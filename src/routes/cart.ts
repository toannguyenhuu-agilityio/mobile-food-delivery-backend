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
  app.post("/carts", createCart);

  // View the active cart for a specific user (based on user ID or session)
  app.get("/carts", getCartDetail);

  // Add an item to a specific cart
  app.post("/cartItems", addItemToCart);

  app
    .route("/cartItems/:cartItemId")
    .put(updateItemInCart)
    .delete(removeItemFromCart);

  // Checkout a cart
  app.post("/carts/checkout", checkoutCart);
};
