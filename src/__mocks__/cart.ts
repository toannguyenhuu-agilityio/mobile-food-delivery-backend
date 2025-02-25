import { DISH } from "./dish.ts";

const CART_ITEM = {
  id: "1234",
  quantity: 1,
  pricePerItem: 0,
  totalPrice: 0,
  dish: DISH,
  cart: { id: "1234" },
};

const CART = {
  id: "1234",
  status: "Active",
  discount_amount: 0,
  vat_percentage: 0,
  totalPrice: 0,
  cartItems: [CART_ITEM],
};

export { CART, CART_ITEM };
