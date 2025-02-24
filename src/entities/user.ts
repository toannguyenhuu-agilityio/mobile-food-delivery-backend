import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from "typeorm";

// Entities
import { Dish } from "./dish.ts";

// Types
import { UserRole } from "../types/user.ts";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column({ type: "enum", enum: UserRole, default: UserRole.customer })
  role: UserRole;

  @OneToMany(() => Dish, (dish) => dish.user)
  dish: Dish[];
}
