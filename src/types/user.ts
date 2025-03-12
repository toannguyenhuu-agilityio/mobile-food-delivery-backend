// Entities
import { Cart } from "../entities/cart";
import { Dish } from "../entities/dish";
import { Order } from "../entities/order";

export enum UserRole {
  Admin = "admin",
  Customer = "customer",
}

export interface IUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password: string;
  dishes: Dish[];
  carts: Cart[];
  orders: Order[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserRequest {
  user: {
    email: string;
  };
}
