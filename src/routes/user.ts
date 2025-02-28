import { userController } from "../controllers/user.ts";

// Middlewares
import { validateToken } from "../middleware/auth0.middleware.ts";

export const userRoutes = ({
  app,
  repository,
  authClient,
  controller = userController,
}) => {
  const { getUsers, getUserById, signUp, signIn } = controller({
    authClient,
    userRepository: repository,
  });

  // Sign up a new user
  app.route("/auth/signup").post(signUp);

  // Sign in a user
  app.route("/auth/signin").post(signIn);

  app.use(validateToken);

  // Retrieve all users
  app.route("/users").get(getUsers);

  // Retrieve a specific user
  app.route("/users/:id").get(getUserById);
};
