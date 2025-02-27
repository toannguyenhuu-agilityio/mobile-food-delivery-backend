import { dishController } from "../controllers/dish.ts";

// Middlewares
import { validateToken } from "../middleware/auth0.middleware.ts";

export const dishRoutes = ({
  app,
  dishRepository,
  userRepository,
  controller = dishController,
}) => {
  const { createDish, getDishes, getDishByID, deleteDishByID, updateDishByID } =
    controller({
      userRepository,
      dishRepository,
    });

  app.route("/dish").post(validateToken, createDish);

  app.route("/dishes").get(validateToken, getDishes);

  app
    .route("/dish/:id")
    .all(validateToken)
    .get(getDishByID)
    .delete(deleteDishByID)
    .put(updateDishByID);
};
