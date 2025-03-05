import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from "typeorm";

// Entities
import { User } from "./user.ts";
import { Cart } from "./cart.ts";
import { OrderItem } from "./orderItem.ts";

// Types
import { OrderStatus } from "../types/order.ts";

@Entity()
export class Order {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "enum", enum: OrderStatus, default: OrderStatus.Pending })
  status: OrderStatus;

  @Column("decimal", { default: 0 })
  totalPrice: number;

  @Column("decimal", { default: 0 })
  vatPercentage: number;

  @Column("decimal", { default: 0 })
  discountAmount: number;

  @ManyToOne(() => User, (user) => user.orders)
  user: User;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order)
  orderItems: OrderItem[];

  @OneToOne(() => Cart, (cart) => cart.order)
  @JoinColumn()
  cart: Cart;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
