import { DishCategory } from "../types/dish";

const DISH = {
  name: "Pizza",
  description: "A delicious pizza",
  price: 9.99,
  image: "https://example.com/pizza.jpg",
  category: DishCategory.Main,
  userId: 1,
  isActive: true,
  additionalItem: "Extra cheese",
};

const DISHES = [
  DISH,
  {
    ...DISH,
    name: "Pasta",
    description: "A delicious pasta",
    image: "https://example.com/pasta.jpg",
    category: DishCategory.Main,
    additionalItem: "Extra sauce",
  },
  {
    ...DISH,
    name: "Burger",
    description: "A delicious burger",
    image: "https://example.com/burger.jpg",
    category: DishCategory.Main,
    additionalItem: "Extra ketchup",
  },
];

const DISH_REQUEST = {
  body: DISH,
};

export { DISH, DISHES, DISH_REQUEST };
