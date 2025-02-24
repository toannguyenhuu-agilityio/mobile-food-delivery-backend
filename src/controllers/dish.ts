import { Request, Response } from "express";
import { Repository } from "typeorm";

// Entities
import { User } from "../entities/user.ts";
import { Dish } from "../entities/dish.ts";

// Types
import { UserRole } from "../types/user.ts";
import { DishCategory } from "../types/dish.ts";

// Constants
import {
  GENERAL_MESSAGES,
  DISH_MESSAGES,
  USER_MESSAGES,
} from "../constants/messages.ts";
import { STATUS_CODES } from "../constants/httpStatusCodes.ts";

export const dishController = ({
  dishRepository,
  userRepository,
}: {
  dishRepository: Repository<Dish>;
  userRepository: Repository<User>;
}) => {
  return {
    /**
     * Creates a new dish.
     *
     * @param {Object} req - The request object containing the dish data.
     * @param {Object} res - The response object used to send the response. Sends a response
     *   indicating the result of the dish creation process.
     *
     * @returns {Promise<void>} - A promise that resolves when the dish is successfully created
     *   or rejects if there is an error during the process.
     *
     * @throws {Error} - Throws an error if an unexpected issue occurs while creating the dish,
     *   such as database errors or validation issues.
     */
    createDish: async (req: Request, res: Response) => {
      try {
        const {
          name,
          description,
          price,
          image,
          category,
          userId,
          isActive,
          additionalItem,
        } = req.body;

        if (!name || !description || !price || !image || !category || !userId) {
          return res
            .status(STATUS_CODES.BAD_REQUEST)
            .json({ message: GENERAL_MESSAGES.MISSING_REQUIRED_FIELDS });
        }

        // Find the user who is creating the dish (admin check)
        const user = await userRepository.findOne({ where: { id: userId } });

        if (!user) {
          return res.status(STATUS_CODES.NOT_FOUND).json({
            message: USER_MESSAGES.USER_NOT_FOUND,
          });
        }

        // Optional: Check if the user is an admin
        if (user.role !== UserRole.admin) {
          return res
            .status(STATUS_CODES.FORBIDDEN)
            .json({ message: USER_MESSAGES.ADMIN_ONLY });
        }

        const dish = dishRepository.create({
          name,
          description,
          price,
          image,
          category,
          isActive: isActive ?? true, // Default to true if not provided
          additionalItem: additionalItem ?? "meat", // Default to 'meat' if not provided
          user,
        });

        const results = await dishRepository.save(dish);

        res.status(STATUS_CODES.NO_CONTENT).json(results);
      } catch (error) {
        console.error("Error creating dish:", error);
        res
          .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
          .json({ message: GENERAL_MESSAGES.INTERNAL_SERVER_ERROR });
      }
    },

    /**
     * Retrieves a dish by its ID.
     *
     * @param {Object} req - The request object containing the ID of the dish to retrieve.
     * @param {Object} res - The response object used to send the response. Sends a response
     *   indicating the result of the dish retrieval process.
     *
     * @returns {Promise<void>} - A promise that resolves when the dish is successfully retrieved
     *   or rejects if there is an error during the process.
     *
     * @throws {Error} - Throws an error if an unexpected issue occurs while retrieving the dish,
     *   such as database errors or validation issues.
     */
    getDishByID: async (req: Request, res: Response) => {
      const id = req.params.id;

      try {
        const dish = await dishRepository.findOneBy({ id });

        // Check if the dish exists
        if (!dish) {
          return res
            .status(STATUS_CODES.NOT_FOUND)
            .json({ message: DISH_MESSAGES.DISH_NOT_FOUND });
        }

        res.status(STATUS_CODES.OK).json(dish);
      } catch (error) {
        console.error("Error fetching dish with id ${req.params.id}:", error);

        res
          .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
          .json({ message: GENERAL_MESSAGES.INTERNAL_SERVER_ERROR });
      }
    },

    /**
     * Updates a dish by its ID.
     *
     * @param {Object} req - The request object containing the ID of the dish to update and the
     *   updated data.
     * @param {Object} res - The response object used to send the response. Sends a response
     *   indicating the result of the dish update process.
     *
     * @returns {Promise<void>} - A promise that resolves when the dish is successfully updated.
     *   or rejects if there is an error during the process.
     *
     * @throws {Error} - Throws an error if an unexpected issue occurs while updating the dish,
     *   such as database errors or validation issues.
     * */
    updateDishByID: async (req: Request, res: Response) => {
      const id = req.params.id;
      const userId = req.body.userId;

      try {
        // Find the user who is creating the dish (admin check)
        const user = await userRepository.findOne({ where: { id: userId } });

        if (!user) {
          return res.status(STATUS_CODES.NOT_FOUND).json({
            message: USER_MESSAGES.USER_NOT_FOUND,
          });
        }

        // Optional: Check if the user is an admin
        if (user.role !== UserRole.admin) {
          return res
            .status(STATUS_CODES.FORBIDDEN)
            .json({ message: USER_MESSAGES.ADMIN_ONLY });
        }

        const dish = await dishRepository.findOneBy({ id });

        // Check if the dish exists
        if (!dish) {
          return res
            .status(STATUS_CODES.NOT_FOUND)
            .json({ message: DISH_MESSAGES.DISH_NOT_FOUND });
        }

        const updatedDish = dishRepository.merge(dish, req.body);
        const results = await dishRepository.save(updatedDish);

        res.status(STATUS_CODES.OK).json(results);
      } catch (error) {
        console.error("Error updating dish with id ${req.params.id}:", error);

        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
          message: GENERAL_MESSAGES.INTERNAL_SERVER_ERROR,
        });
      }
    },

    /**
     * Deletes a dish by its ID.
     *
     * @param {Object} req - The request object containing the ID of the dish to delete.
     * @param {Object} res - The response object used to send the response. Sends a response
     *   indicating the result of the dish deletion process.
     *
     * @returns {Promise<void>} - A promise that resolves when the dish is successfully deleted.
     *   or rejects if there is an error during the process.
     *
     * @throws {Error} - Throws an error if an unexpected issue occurs while deleting the dish,
     *   such as database errors or validation issues.
     */
    deleteDishByID: async (req: Request, res: Response) => {
      const id = req.params.id;
      const userId = req.body.userId;

      try {
        // Find the user who is creating the dish (admin check)
        const user = await userRepository.findOne({ where: { id: userId } });

        if (!user) {
          return res.status(STATUS_CODES.NOT_FOUND).json({
            message: USER_MESSAGES.USER_NOT_FOUND,
          });
        }

        // Optional: Check if the user is an admin
        if (user.role !== UserRole.admin) {
          return res
            .status(STATUS_CODES.FORBIDDEN)
            .json({ message: USER_MESSAGES.ADMIN_ONLY });
        }

        const results = await dishRepository.delete(id);

        if (results.affected === 0) {
          return res
            .status(STATUS_CODES.NOT_FOUND)
            .json({ message: DISH_MESSAGES.DISH_NOT_FOUND });
        }

        res
          .status(STATUS_CODES.OK)
          .json({ message: DISH_MESSAGES.DISH_DELETED });
      } catch (error) {
        console.error("Error deleting dish with id ${req.params.id}:", error);

        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
          message: GENERAL_MESSAGES.INTERNAL_SERVER_ERROR,
        });
      }
    },

    /**
     * Retrieves a list of dishes based on the specified category, page, and limit.
     *
     * @param {Object} req - The request object containing the category, page, and limit parameters.
     * @param {Object} res - The response object used to send the response. Sends a response
     *   indicating the result of the dish retrieval process.
     *
     * @returns {Promise<void>} - A promise that resolves when the dishes are successfully retrieved.
     *   or rejects if there is an error during the process.
     *
     * @throws {Error} - Throws an error if an unexpected issue occurs while retrieving the dishes,
     *   such as database errors or validation issues.
     * */
    getDishes: async (req: Request, res: Response) => {
      const { category, page, limit } = req.query;
      const categoryParam = (category as DishCategory) || DishCategory.Main;

      // Ensure the category is valid
      if (!Object.values(DishCategory).includes(categoryParam)) {
        return res
          .status(STATUS_CODES.BAD_REQUEST)
          .json({ message: DISH_MESSAGES.INVALID_CATEGORY });
      }

      const pageParam = parseInt(page as string);
      const limitParam = parseInt(limit as string);

      // Ensure page and limit are valid
      if ((page && limit && pageParam <= 0) || limitParam <= 0) {
        return res
          .status(STATUS_CODES.BAD_REQUEST)
          .json({ message: DISH_MESSAGES.INVALID_PAGE_AND_LIMIT });
      }

      const skip = (pageParam - 1) * limitParam;

      try {
        const [dishes, total = 0] = await dishRepository.findAndCount({
          where: { category: categoryParam },
          take: limitParam,
          skip,
          order: { name: "DESC" },
        });

        const totalPages = Math.ceil(total / limitParam);

        res.status(STATUS_CODES.OK).json({
          data: dishes,
          pagination: {
            page: pageParam,
            limit: limitParam,
            totalItems: total,
            totalPages,
          },
        });
      } catch (error) {
        console.error("Error fetching dishes:", error);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
          message: GENERAL_MESSAGES.INTERNAL_SERVER_ERROR,
        });
      }
    },
  };
};
