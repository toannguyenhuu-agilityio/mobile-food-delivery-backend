import { NextFunction, Request, Response } from "express";
import { Repository, In } from "typeorm";

// Entities
import { User } from "../entities/user.ts";
import { Cart } from "../entities/cart.ts";
import { CartItem } from "../entities/cartItem.ts";
import { Dish } from "../entities/dish.ts";

// Types
import { STATUS_CODES } from "../constants/httpStatusCodes.ts";
import { CART_MESSAGES, USER_MESSAGES } from "../constants/messages.ts";
import { CartStatus } from "../types/cart.ts";
import { IUserRequest } from "../types/user.ts";

// Services
import { userService as defaultUserService } from "../services/userService.ts";

export const cartController = ({
  cartRepository,
  userRepository,
  dishRepository,
  cartItemRepository,
  userService = defaultUserService,
}: {
  cartRepository: Repository<Cart>;
  userRepository: Repository<User>;
  dishRepository: Repository<Dish>;
  cartItemRepository: Repository<CartItem>;
  userService?: typeof defaultUserService;
}) => {
  return {
    /**
     * Creates a new cart for the user.
     * @param {Object} req - The request object containing the user ID.
     * @param {Object} res - The response object used to send the response.
     * @param {Object} next - The next middleware function.
     * 
     * @returns {Promise<void>} - A promise that resolves when the cart is successfully created.
     * @throws {Error} - Throws an error if an unexpected issue occurs while creating the cart.
    
     */
    createCart: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { userId } = req.body;

        const { findUser } = userService(userRepository);

        const user = await findUser({ id: userId });

        if (!user) {
          return res
            .status(STATUS_CODES.NOT_FOUND)
            .json({ message: USER_MESSAGES.USER_NOT_FOUND });
        }

        // Check if the system already has an active or pending cart for the user
        const existingCart = await cartRepository.findOne({
          where: {
            user: { id: userId },
            status: In([CartStatus.Active, CartStatus.Pending]),
          },
        });

        if (existingCart) {
          return res
            .status(STATUS_CODES.CONFLICT)
            .json({ message: CART_MESSAGES.CART_ALREADY_EXISTS });
        }

        const newCart = cartRepository.create({
          user,
          status: CartStatus.Active,
        });
        await cartRepository.save(newCart);

        return res.status(STATUS_CODES.CREATED).json(newCart);
      } catch (error) {
        next(error);
      }
    },

    /**
     * Retrieves the active cart details for the user. Only one active cart is operated at a time.
     * @param {Object} req - The request object containing the user ID.
     * @param {Object} res - The response object used to send the response.
     * @param {Object} next - The next middleware function.
     *
     * @returns {Promise<void>} - A promise that resolves when the cart details are successfully retrieved.
     * @throws {Error} - Throws an error if an unexpected issue occurs while retrieving the cart details.
     *
     */
    getCartDetail: async (
      req: Request & IUserRequest,
      res: Response,
      next: NextFunction,
    ) => {
      try {
        const { email } = req.user;

        const cart = await cartRepository
          .createQueryBuilder("cart")
          .innerJoinAndSelect("cart.user", "user")
          .leftJoinAndSelect("cart.cartItems", "cartItem")
          .leftJoinAndSelect("cartItem.dish", "dish")
          .where("user.email = :email", { email })
          .andWhere("cart.status = :status", { status: CartStatus.Active })
          .getOne();

        if (!cart) {
          return res.status(STATUS_CODES.NOT_FOUND).json({
            message: CART_MESSAGES.CART_NOT_FOUND,
          });
        }

        res.status(STATUS_CODES.OK).json(cart);
      } catch (error) {
        next(error);
      }
    },

    /**
     * Adds an item to the user's cart.
     * @param {Object} req - The request object containing the cart id, dish id and quantity.
     * @param {Object} res - The response object used to send the response.
     * @param {Object} next - The next middleware function.
     *
     * @returns {Promise<void>} - A promise that resolves when the item is successfully added to the cart.
     * @throws {Error} - Throws an error if an unexpected issue occurs while adding the item to the cart.
     */
    addItemToCart: async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { dishId, quantity, cartId } = req.body;

        const cart = await cartRepository.findOne({
          where: { id: cartId, status: CartStatus.Active },
          relations: ["cartItems", "cartItems.dish"],
        });
        const dish = await dishRepository.findOne({ where: { id: dishId } });

        if (!cart || !dish) {
          return res.status(STATUS_CODES.NOT_FOUND).json({
            message: CART_MESSAGES.CART_OR_DISH_NOT_FOUND,
          });
        }

        const existingItem = cart.cartItems.find(
          (item) => item.dish.id === dishId,
        );

        if (existingItem) {
          // If the item already exists, update the quantity and total price
          existingItem.quantity += quantity;
          existingItem.totalPrice = existingItem.quantity * dish.price; // Recalculate total price
          await cartItemRepository.save(existingItem);

          return res.status(STATUS_CODES.OK).json(existingItem);
        }

        const newItem = cartItemRepository.create({
          cart,
          dish,
          quantity,
          pricePerItem: dish.price,
          totalPrice: quantity * dish.price,
        });
        await cartItemRepository.save(newItem);

        return res.status(STATUS_CODES.CREATED).json(newItem);
      } catch (error) {
        next(error);
      }
    },

    /**
     * Updates the quantity or price of an item in the user's cart.
     * @param {Object} req - The request object containing the cart id and item id.
     * @param {Object} res - The response object used to send the response.
     * @param {Object} next - The next middleware function.
     *
     * @returns {Promise<void>} - A promise that resolves when the item is successfully updated in the cart.
     * @throws {Error} - Throws an error if an unexpected issue occurs while updating the item in the cart.
     */
    updateItemInCart: async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      try {
        const { itemId } = req.params;
        const { quantity, cartId } = req.body;

        const cart = await cartRepository.findOne({
          where: { id: cartId, status: CartStatus.Active },
          relations: ["cartItems", "cartItems.dish"],
        });

        if (!cart) {
          return res.status(STATUS_CODES.NOT_FOUND).json({
            message: CART_MESSAGES.CART_NOT_FOUND,
          });
        }

        const cartItem = await cartItemRepository.findOne({
          where: { id: itemId, cart: { id: cartId } },
          relations: ["dish"],
        });

        if (!cartItem) {
          return res.status(STATUS_CODES.NOT_FOUND).json({
            message: CART_MESSAGES.CART_ITEM_NOT_FOUND,
          });
        }

        const dish = cartItem.dish;

        // Update the cart item details
        cartItem.quantity = quantity;
        cartItem.totalPrice = quantity * dish.price;

        const result = await cartItemRepository.save(cartItem);

        res.status(STATUS_CODES.OK).json(result);
      } catch (error) {
        next(error);
      }
    },

    /**
     * Removes an item from the user's cart.
     * @param {Object} req - The request object containing the cart id and item id.
     * @param {Object} res - The response object used to send the response.
     * @param {Object} next - The next middleware function.
     *
     * @returns {Promise<void>} - A promise that resolves when the item is successfully removed from the cart.
     * @throws {Error} - Throws an error if an unexpected issue occurs while removing the item from the cart.
     *
     */
    removeItemFromCart: async (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      try {
        const { itemId } = req.params;
        const { cartId } = req.body;

        const cart = await cartRepository.findOne({
          where: { id: cartId, status: CartStatus.Active },
          relations: ["cartItems", "cartItems.dish"],
        });

        if (!cart) {
          return res.status(STATUS_CODES.NOT_FOUND).json({
            message: CART_MESSAGES.CART_NOT_FOUND,
          });
        }

        const cartItem = await cartItemRepository.findOne({
          where: { id: itemId, cart: { id: cartId } },
        });

        if (!cartItem) {
          return res.status(STATUS_CODES.NOT_FOUND).json({
            message: CART_MESSAGES.CART_ITEM_NOT_FOUND,
          });
        }

        const result = await cartItemRepository.remove(cartItem);

        if (!result) {
          return res.status(STATUS_CODES.NOT_FOUND).json({
            message: CART_MESSAGES.CART_ITEM_NOT_FOUND,
          });
        }

        res.status(STATUS_CODES.OK).json({
          message: CART_MESSAGES.CART_ITEM_REMOVED,
        });
      } catch (error) {
        next(error);
      }
    },

    /**
     * Completes the checkout process for the user's cart.
     * @param {Object} req - The request object containing the user ID.
     * @param {Object} res - The response object used to send the response.
     * @param {Object} next - The next middleware function.
     *
     * @returns {Promise<void>} - A promise that resolves when the checkout process is completed.
     * @throws {Error} - Throws an error if an unexpected issue occurs while completing the checkout process.
     */
    checkoutCart: async (req: Request, res: Response, next: NextFunction) => {
      const { userId, vat, discount } = req.body;

      try {
        const cart = await cartRepository.findOne({
          where: { user: { id: userId }, status: CartStatus.Active },
          relations: ["cartItems", "cartItems.dish"],
        });

        if (!cart) {
          return res
            .status(STATUS_CODES.NOT_FOUND)
            .json({ message: CART_MESSAGES.CART_NOT_FOUND });
        }

        // Calculate the total price of all items in the cart
        let totalItemsPrice = 0;
        cart.cartItems.forEach((cartItem) => {
          totalItemsPrice += cartItem.totalPrice; // cartItem.totalPrice = quantity * dish.price
        });

        // Apply the discount (subtract from total price)
        const discountedPrice = totalItemsPrice - discount;

        // Apply VAT (calculate VAT based on the discounted price)
        const vatAmount = (discountedPrice * vat) / 100;
        const finalTotalPrice = discountedPrice + vatAmount;

        // Update the total price of the cart
        cart.totalPrice = finalTotalPrice;
        cart.vatPercentage = vat;
        cart.discountAmount = discount;

        // Mark the cart as completed (order placed)
        cart.status = CartStatus.Pending;
        await cartRepository.save(cart);

        // Here you might want to add order creation logic, payment processing, etc.

        return res
          .status(STATUS_CODES.OK)
          .json({ message: CART_MESSAGES.CHECKOUT_SUCCESS, cart });
      } catch (error) {
        next(error);
      }
    },
  };
};
