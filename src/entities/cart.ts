import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
} from "typeorm";

// Entities
import { User } from "./user.ts";
import { CartItem } from "./cartItem.ts";

// Types
import { CartStatus } from "../types/cart.ts"; // Assuming CartStatus is a type you've defined elsewhere

@Entity()
export class Cart {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "enum", enum: CartStatus, default: CartStatus.Active })
  status: CartStatus; // Active, Completed, etc.

  @Column("decimal", { default: 0 })
  discount_amount: number;

  @Column("decimal", { default: 0 })
  vat_percentage: number;

  @Column("decimal", { default: 0 })
  totalPrice: number;

  @ManyToOne(() => User, (user) => user.carts, { nullable: false })
  user: User;

  @OneToMany(() => CartItem, (cartItem) => cartItem.cart)
  cartItems: CartItem[];
}
