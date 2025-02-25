import { Request, Response } from "express";
import { Repository, DataSource } from "typeorm";

// Entities
import { User } from "../entities/user.ts";
import { Order } from "../entities/order.ts";
import { OrderItem } from "../entities/orderItem.ts";

// Types
import { OrderStatus } from "../types/order.ts";

// Constants
import {
  GENERAL_MESSAGES,
  ORDER_MESSAGES,
  USER_MESSAGES,
  CART_MESSAGES,
} from "../constants/messages.ts";
import { STATUS_CODES } from "../constants/httpStatusCodes.ts";
import { CartStatus } from "../types/cart.ts";
import { Cart } from "../entities/cart.ts";

export const orderController = ({
  dataSource,
  orderRepository,
  orderItemRepository,
}: {
  dataSource: DataSource;
  orderRepository: Repository<Order>;
  orderItemRepository: Repository<OrderItem>;
}) => {
  return {
    /**
     * Creates a new order for the user.
     * @param {Object} req - The request object containing the user ID.
     * @param {Object} res - The response object.
     *
     * @returns {Promise<void>} - A promise that resolves when the order is successfully created.
     * @throws {Error} - Throws an error if an unexpected issue occurs while creating the order.
     */
    createOrder: async (req: Request, res: Response) => {
      const { userId } = req.body;
      const queryRunner = dataSource.createQueryRunner();

      try {
        // Start a transaction

        await queryRunner.connect();
        await queryRunner.startTransaction();

        //Find the user
        const user = await queryRunner.manager.findOne(User, {
          where: { id: userId },
        });

        if (!user) {
          return res
            .status(STATUS_CODES.NOT_FOUND)
            .json({ message: USER_MESSAGES.USER_NOT_FOUND });
        }

        // Find the pending cart
        const pendingCart = await queryRunner.manager.findOne(Cart, {
          where: { user: { id: userId }, status: CartStatus.Pending },
          relations: ["cartItems", "cartItems.dish"],
        });

        if (!pendingCart) {
          return res
            .status(STATUS_CODES.NOT_FOUND)
            .json({ message: CART_MESSAGES.CART_NOT_FOUND });
        }

        //  Create the Order
        const newOrder = orderRepository.create({
          user,
          vatPercentage: pendingCart.vatPercentage,
          discountAmount: pendingCart.discountAmount,
          totalPrice: pendingCart.totalPrice,
          cart: pendingCart,
          status: OrderStatus.Pending,
        });

        //  Save the Order
        await queryRunner.manager.save(newOrder);

        //  Create the Order Items
        const orderItems = [];
        for (const cartItem of pendingCart.cartItems) {
          const newOrderItem = orderItemRepository.create({
            order: newOrder,
            dish: cartItem.dish,
            quantity: cartItem.quantity,
            pricePerItem: cartItem.pricePerItem,
            totalPrice: cartItem.totalPrice,
          });

          orderItems.push(queryRunner.manager.save(OrderItem, newOrderItem));
        }

        // Wait for all order items to be saved
        await Promise.all(orderItems);

        // Update the cart status to 'Converted' after the order is created
        pendingCart.status = CartStatus.Converted;
        await queryRunner.manager.save(Cart, pendingCart);

        // Commit the transaction
        await queryRunner.commitTransaction();

        res.status(STATUS_CODES.CREATED).json(newOrder);
      } catch (error) {
        console.error("Error creating order:", error);

        // Rollback the transaction in case of an error
        await queryRunner.rollbackTransaction();

        return res
          .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
          .json({ message: GENERAL_MESSAGES.INTERNAL_SERVER_ERROR });
      } finally {
        // Release the query runner
        await queryRunner.release();
      }
    },

    /**
     * Retrieves an order by ID.
     * @param {Object} req - The request object containing the order ID.
     * @param {Object} res - The response object.
     *
     * @returns {Promise<void>} - A promise that resolves when the order is successfully retrieved.
     * @throws {Error} - Throws an error if an unexpected issue occurs while retrieving the order.
     */
    getOrderById: async (req: Request, res: Response) => {
      try {
        const { orderId } = req.params;
        const order = await orderRepository.findOne({
          where: { id: orderId },
          relations: ["orderItems", "orderItems.dish"],
        });

        if (!order) {
          return res
            .status(STATUS_CODES.NOT_FOUND)
            .json({ message: ORDER_MESSAGES.ORDER_NOT_FOUND });
        }

        return res.status(STATUS_CODES.OK).json(order);
      } catch (error) {
        console.error("Error retrieving order:", error);

        return res
          .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
          .json({ message: GENERAL_MESSAGES.INTERNAL_SERVER_ERROR });
      }
    },

    /**
     * Retrieves all orders for the user.
     * @param {Object} req - The request object containing the user ID.
     * @param {Object} res - The response object.
     *
     * @returns {Promise<void>} - A promise that resolves when the orders are successfully retrieved.
     * @throws {Error} - Throws an error if an unexpected issue occurs while retrieving the orders.
     */
    getOrders: async (req: Request, res: Response) => {
      try {
        const { userId } = req.params;
        const orders = await orderRepository.find({
          where: { user: { id: userId } },
          relations: ["orderItems", "orderItems.dish"],
        }); // Include orderItems and their associated dish entities

        return res.status(STATUS_CODES.OK).json(orders);
      } catch (error) {
        console.error("Error retrieving orders:", error);

        return res
          .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
          .json({ message: GENERAL_MESSAGES.INTERNAL_SERVER_ERROR });
      }
    },

    /**
     * Updates the status of an order.
     * @param {Object} req - The request object containing the order ID and new status.
     * @param {Object} res - The response object.
     *
     * @returns {Promise<void>} - A promise that resolves when the order status is successfully updated.
     * @throws {Error} - Throws an error if an unexpected issue occurs while updating the order status.
     *
     */
    updateOrderStatus: async (req: Request, res: Response) => {
      try {
        const { orderId } = req.params;
        const { status } = req.body;

        const order = await orderRepository.findOne({
          where: { id: orderId },
        });

        if (!order) {
          return res
            .status(STATUS_CODES.NOT_FOUND)
            .json({ message: ORDER_MESSAGES.ORDER_NOT_FOUND });
        }

        order.status = status;
        await orderRepository.save(order);

        return res
          .status(STATUS_CODES.OK)
          .json({ message: ORDER_MESSAGES.ORDER_STATUS_UPDATED });
      } catch (error) {
        console.error("Error updating order status:", error);

        return res
          .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
          .json({ message: GENERAL_MESSAGES.INTERNAL_SERVER_ERROR });
      }
    },
  };
};
