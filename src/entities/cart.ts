import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from "typeorm";

// Entities
import { User } from "./user.ts";
import { CartItem } from "./cartItem.ts";
import { Order } from "./order.ts";

// Types
import { CartStatus } from "../types/cart.ts";

@Entity()
export class Cart {
  @PrimaryGeneratedColumn("uuid")
  id: string;

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
