import "reflect-metadata";
import express from "express";
import { AppDataSource } from "./data-source.ts";
import dotenv from "dotenv";

// Entities
import { User } from "./entities/user.ts";
import { Dish } from "./entities/dish.ts";
import { CartItem } from "./entities/cartItem.ts";
import { Cart } from "./entities/cart.ts";
import { Order } from "./entities/order.ts";
import { OrderItem } from "./entities/orderItem.ts";

// Routes
import { userRoutes } from "./routes/user.ts";
import { dishRoutes } from "./routes/dish.ts";
import { cartRoutes } from "./routes/cart.ts";
import { orderRoutes } from "./routes/order.ts";

dotenv.config();

const port = process.env.PORT || 3000;

// create and setup express app
const app = express();
app.use(express.json());

AppDataSource.initialize()
  .then(async () => {
    // create repositories
    const userRepository = AppDataSource.getRepository(User);
    const dishRepository = AppDataSource.getRepository(Dish);
    const cartItemRepository = AppDataSource.getRepository(CartItem);
    const cartRepository = AppDataSource.getRepository(Cart);
    const orderRepository = AppDataSource.getRepository(Order);
    const orderItemRepository = AppDataSource.getRepository(OrderItem);

    // routes
    userRoutes({ app, repository: userRepository });
    dishRoutes({ app, userRepository, dishRepository });
    cartRoutes({
      app,
      userRepository,
      cartRepository,
      cartItemRepository,
      dishRepository,
    });

    orderRoutes({
      app,
      dataSource: AppDataSource,
      orderRepository,
      orderItemRepository,
    });

    // start express server
    app.listen(port, () => {
      console.log("Server started on port 3000");
    });
  })
  .catch((error) => console.log(error));
