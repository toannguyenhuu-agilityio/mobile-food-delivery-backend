import { Entity, Column, ManyToOne, OneToMany, OneToOne } from "typeorm";

// Entities
import { User } from "./user.ts";
import { CartItem } from "./cartItem.ts";
import { Order } from "./order.ts";
import { BaseEntity } from "./base.ts";

// Types
import { CartStatus } from "../types/cart.ts";

@Entity()
export class Cart extends BaseEntity {
  @Column({ type: "enum", enum: CartStatus, default: CartStatus.Active })
  status: CartStatus;

  @Column("decimal", { default: 0 })
  discountAmount: number;

  @Column("decimal", { default: 0 })
  vatPercentage: number;

  @Column("decimal", { default: 0 })
  totalPrice: number;

  @ManyToOne(() => User, (user) => user.carts, { nullable: false })
  user: User;

  @OneToMany(() => CartItem, (cartItem) => cartItem.cart)
  cartItems: CartItem[];

  @OneToOne(() => Order, (order) => order.cart)
  order: Cart;
}
