import { Entity, Column, OneToMany } from "typeorm";

// Entities
import { Dish } from "./dish.ts";
import { Cart } from "./cart.ts";
import { Order } from "./order.ts";
import { BaseEntity } from "./base.ts";

// Types
import { UserRole } from "../types/user.ts";

@Entity()
export class User extends BaseEntity {
  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column({ type: "enum", enum: UserRole, default: UserRole.Customer })
  role: UserRole;

  @OneToMany(() => Dish, (dish) => dish.user)
  dishes: Dish[];

  @OneToMany(() => Cart, (cart) => cart.user)
  carts: Cart[];

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];
}
