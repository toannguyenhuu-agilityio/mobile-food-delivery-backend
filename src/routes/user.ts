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
  app.post("/auth/signup", signUp);

  // Sign in a user
  app.post("/auth/signin", signIn);

  app.use(validateToken);

  // Retrieve all users
  app.get("/users", getUsers);

  // Retrieve a specific user
  app.get("/users/:id", getUserById);
};
