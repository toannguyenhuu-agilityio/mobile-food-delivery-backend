import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

// Entities
import { Order } from "./order.ts";
import { Dish } from "./dish.ts";

@Entity()
export class OrderItem {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("int")
  quantity: number;

  @Column("decimal")
  pricePerItem: number;

  @Column("decimal")
  totalPrice: number;

  @ManyToOne(() => Dish, (dish) => dish.orderItems, { nullable: false })
  dish: Dish;

  @ManyToOne(() => Order, (order) => order.orderItems, { nullable: false })
  order: Order;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
