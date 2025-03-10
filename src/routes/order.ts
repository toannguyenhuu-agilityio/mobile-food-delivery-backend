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

  app.use(validateToken);

  // Create a new order
  app.post("/orders", createOrder);

  // Retrieve all orders
  app.get("/orders", getOrders);

  // Retrieve a specific order
  app.get("/orders/:id", getOrderById);

  // Update the status of an order
  app.put("/orders/:id", updateOrderStatus);
};

export default orderRoutes;
