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
import { OrderItem } from "./orderItem.ts";

// Types
import { DishCategory } from "../types/dish.ts";

@Entity()
export class Dish {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column("text")
  description: string;

  @Column("decimal")
  price: number;

  @Column()
  image: string;

  @Column({ type: "enum", enum: DishCategory, default: DishCategory.Main })
  category: DishCategory;

  @Column({ type: "boolean", default: true, nullable: true })
  isActive: boolean | null;

  @Column({ type: "varchar", length: 255, default: "meat", nullable: true })
  additionalItem: string | null;

  @ManyToOne(() => User, (user) => user.dishes, { nullable: false })
  user: User;

  @OneToMany(() => CartItem, (cartItem) => cartItem.dish)
  cartItems: CartItem[];

  @OneToMany(() => OrderItem, (orderItem) => orderItem.dish)
  orderItems: OrderItem[];
}
