import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from "typeorm";

// Entities
import { User } from "./user.ts";

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

  @ManyToOne(() => User, (user) => user.dish, { nullable: false })
  user: User;
}
