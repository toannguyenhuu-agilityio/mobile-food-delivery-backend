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

  app.use(validateToken);

  // Create a new cart for a user
  app.post("/cart", createCart);

  // View the active cart for a specific user (based on user ID or session)
  app.get("/cart/:userId", getCartDetail);

  // Add an item to a specific cart
  app.post("/cart/:cartId/item", addItemToCart);

  app
    .route("/cart/:cartId/item/:itemId")
    .put(updateItemInCart)
    .delete(removeItemFromCart);

  // Checkout a cart
  app.post("/cart/checkout", checkoutCart);
};
