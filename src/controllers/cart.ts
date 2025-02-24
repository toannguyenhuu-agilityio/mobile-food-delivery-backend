import { Request, Response } from "express";
import { Repository } from "typeorm";

// Entities
import { User } from "../entities/user.ts";
import { Cart } from "../entities/cart.ts";
import { CartItem } from "../entities/cartItem.ts";
import { Dish } from "../entities/dish.ts";

// Types
import { STATUS_CODES } from "../constants/httpStatusCodes.ts";
import {
  GENERAL_MESSAGES,
  CART_MESSAGES,
  USER_MESSAGES,
} from "../constants/messages.ts";
import { CartStatus } from "../types/cart.ts";

export const cartController = ({
  cartRepository,
  userRepository,
  dishRepository,
  cartItemRepository,
}: {
  cartRepository: Repository<Cart>;
  userRepository: Repository<User>;
  dishRepository: Repository<Dish>;
  cartItemRepository: Repository<CartItem>;
}) => {
  return {
    /**
     * Creates a new cart for the user.
     */
    createCart: async (req: Request, res: Response) => {
      const { userId } = req.body;

      try {
        const user = await userRepository.findOne({ where: { id: userId } });

        if (!user) {
          return res
            .status(STATUS_CODES.NOT_FOUND)
            .json({ message: USER_MESSAGES.USER_NOT_FOUND });
        }

        // Check if the system already has an active cart for the user
        const existingCart = await cartRepository.findOne({
          where: { user: { id: userId }, status: CartStatus.Active },
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
        console.log("Error creating cart:", error);
        res
          .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
          .json({ message: GENERAL_MESSAGES.INTERNAL_SERVER_ERROR });
      }
    },

    /**
     * Retrieves the active cart details for the user. Only one active cart is operated at a time.
     */
    getCartDetail: async (req: Request, res: Response) => {
      const { userId } = req.params;

      try {
        const cart = await cartRepository.findOne({
          where: { user: { id: userId }, status: CartStatus.Active },
          relations: ["cartItems", "cartItems.dish"],
        });

        if (!cart) {
          return res.status(STATUS_CODES.NOT_FOUND).json({
            message: CART_MESSAGES.CART_NOT_FOUND,
          });
        }

        res.status(STATUS_CODES.OK).json(cart);
      } catch (error) {
        console.log("Error fetching cart:", error);
        res
          .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
          .json({ message: GENERAL_MESSAGES.INTERNAL_SERVER_ERROR });
      }
    },

    /**
     * Adds an item to the user's cart.
     */
    addItemToCart: async (req: Request, res: Response) => {
      const { cartId } = req.params;
      const { dishId, quantity } = req.body;

      try {
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
        console.log("Error adding item to cart:", error);
        res
          .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
          .json({ message: GENERAL_MESSAGES.INTERNAL_SERVER_ERROR });
      }
    },

    /**
     * Updates the quantity or price of an item in the user's cart.
     */
    updateItemInCart: async (req: Request, res: Response) => {
      const { cartId, itemId } = req.params;
      const { quantity } = req.body;

      try {
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
        console.log("Error updating cart item:", error);
        res
          .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
          .json({ message: GENERAL_MESSAGES.INTERNAL_SERVER_ERROR });
      }
    },

    /**
     * Removes an item from the user's cart.
     */
    removeItemFromCart: async (req: Request, res: Response) => {
      const { cartId, itemId } = req.params;

      try {
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
        console.log("Error removing item from cart:", error);
        res
          .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
          .json({ message: GENERAL_MESSAGES.INTERNAL_SERVER_ERROR });
      }
    },

    /**
     * Completes the checkout process for the user's cart.
     */
    checkoutCart: async (req: Request, res: Response) => {
      const { userId } = req.body;

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
        const discountedPrice = totalItemsPrice - cart.discount_amount;

        // Apply VAT (calculate VAT based on the discounted price)
        const vatAmount = (discountedPrice * cart.vat_percentage) / 100;
        const finalTotalPrice = discountedPrice + vatAmount;

        // Update the total price of the cart
        cart.totalPrice = finalTotalPrice;

        // Mark the cart as completed (order placed)
        cart.status = CartStatus.Completed;
        await cartRepository.save(cart);

        // Here you might want to add order creation logic, payment processing, etc.

        return res
          .status(STATUS_CODES.OK)
          .json({ message: CART_MESSAGES.CHECKOUT_SUCCESS, cart });
      } catch (error) {
        console.log("Error during checkout:", error);
        res
          .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
          .json({ message: GENERAL_MESSAGES.INTERNAL_SERVER_ERROR });
      }
    },
  };
};
