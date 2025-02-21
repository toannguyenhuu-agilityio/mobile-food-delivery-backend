import { userController } from "../controllers/user.ts";

export const userRoutes = ({
  app,
  repository,
  controller = userController,
}) => {
  const { getUser, getUserById, createUser, updateUser, deleteUser } =
    controller(repository);

  app.route("/users").get(getUser).post(createUser);

  app.route("/users/:id").get(getUserById).put(updateUser).delete(deleteUser);
};
