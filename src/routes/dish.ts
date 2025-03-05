import { dishController } from "../controllers/dish.ts";

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

  app.route("/dish").post(createDish);

  app.route("/dishes").get(getDishes);

  app
    .route("/dish/:id")
    .get(getDishByID)
    .delete(deleteDishByID)
    .put(updateDishByID);
};
