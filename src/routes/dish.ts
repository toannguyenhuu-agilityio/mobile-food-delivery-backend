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

  app.use(validateToken);

  app.post("/dishes", createDish);

  app.get("/dishes", getDishes);

  app
    .route("/dishes/:id")
    .all(validateToken)
    .get(getDishByID)
    .delete(deleteDishByID)
    .put(updateDishByID);
};
