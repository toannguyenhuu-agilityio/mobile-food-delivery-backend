import { cartController } from "../controllers/cart.ts";

// Middlewares
import { validateToken } from "../middleware/auth0.middleware.ts";

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
  app.route("/cart").post(validateToken, createCart);

  // View the active cart for a specific user (based on user ID or session)
  app.route("/cart/:userId").get(validateToken, getCartDetail);

  // Add an item to a specific cart
  app.route("/cart/:cartId/item").post(validateToken, addItemToCart);

  // Update an item in a cart
  app.route("/cart/:cartId/item/:itemId").put(validateToken, updateItemInCart);

  // Remove an item from a cart
  app
    .route("/cart/:cartId/item/:itemId")
    .delete(validateToken, removeItemFromCart);

  // Checkout a cart
  app.route("/cart/checkout").post(validateToken, checkoutCart);
};
