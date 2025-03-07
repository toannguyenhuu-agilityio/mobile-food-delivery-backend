import { Entity, Column, ManyToOne } from "typeorm";

// Entities
import { Order } from "./order.ts";
import { Dish } from "./dish.ts";
import { BaseEntity } from "./base.ts";

@Entity()
export class OrderItem extends BaseEntity {
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
}
