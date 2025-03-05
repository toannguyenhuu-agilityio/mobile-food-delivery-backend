import { cartController } from "../controllers/cart.ts";

export const cartRoutes = ({
  app,
  cartRepository,
  userRepository,
  dishRepository,
  cartItemRepository,
  controller = cartController,
}) => {
  const {
    createCart,
    getCartDetail,
    addItemToCart,
    updateItemInCart,
    removeItemFromCart,
    checkoutCart,
  } = controller({
    userRepository,
    cartRepository,
    dishRepository,
    cartItemRepository,
  });

  // Create a new cart for a user
  app.route("/cart").post(createCart);

  // View the active cart for a specific user (based on user ID or session)
  app.route("/cart/:userId").get(getCartDetail);

  // Add an item to a specific cart
  app.route("/cart/:cartId/item").post(addItemToCart);

  // Update an item in a cart
  app.route("/cart/:cartId/item/:itemId").put(updateItemInCart);

  // Remove an item from a cart
  app.route("/cart/:cartId/item/:itemId").delete(removeItemFromCart);

  // Checkout a cart
  app.route("/cart/checkout").post(checkoutCart);
};
