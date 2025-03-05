import { orderController } from "../controllers/order.ts";

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
  app.route("/order").post(createOrder);

  // Retrieve all orders
  app.route("/orders/:userId").get(getOrders);

  // Retrieve a specific order
  app.route("/order/:id").get(getOrderById);

  // Update the status of an order
  app.route("/order/:id").put(updateOrderStatus);
};

export default orderRoutes;
