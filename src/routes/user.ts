import { userController } from "../controllers/user.ts";

// Middlewares
import { validateToken } from "../middleware/auth0.middleware.ts";

export const userRoutes = ({
  app,
  repository,
  authClient,
  controller = userController,
}) => {
  const { getUser, getUserById, signUp, signIn } = controller({
    authClient,
    userRepository: repository,
  });

  app.route("/auth/signup").post(signUp);

  app.route("/auth/signin").post(signIn);

  app.use(validateToken);

  app.route("/users").get(getUser);

  app.route("/users/:id").get(getUserById);
};
