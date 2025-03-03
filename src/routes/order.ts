import { orderController } from "../controllers/order.ts";

// Middlewares
import { validateToken } from "../middleware/auth0.middleware.ts";

export const orderRoutes = ({
  app,
  dataSource,
  orderRepository,
  orderItemRepository,
  controller = orderController,
}) => {
  const { createOrder, getOrderById, getOrders, updateOrderStatus } =
    controller({
      dataSource,
      orderRepository,
      orderItemRepository,
    });

  // Create a new order
  app.route("/order").post(validateToken, createOrder);

  // Retrieve all orders
  app.route("/orders/:userId").get(validateToken, getOrders);

  // Retrieve a specific order
  app.route("/order/:id").get(validateToken, getOrderById);

  // Update the status of an order
  app.route("/order/:id").put(validateToken, updateOrderStatus);
};

export default orderRoutes;
