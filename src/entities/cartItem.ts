import { Entity, Column, ManyToOne } from "typeorm";

// Entities
import { Cart } from "./cart.ts";
import { Dish } from "./dish.ts";
import { BaseEntity } from "./base.ts";

@Entity()
export class CartItem extends BaseEntity {
  @Column("int")
  quantity: number; // Quantity of the dish in the cart

  @Column("decimal")
  pricePerItem: number; // Price per individual dish item

  @Column("decimal")
  totalPrice: number; // Total price for this particular CartItem (quantity * pricePerItem)

  @ManyToOne(() => Dish, (dish) => dish.cartItems, { nullable: false })
  dish: Dish;

  @ManyToOne(() => Cart, (cart) => cart.cartItems, { nullable: false })
  cart: Cart;
}
