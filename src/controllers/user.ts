import { Request, Response } from "express";
import { Repository } from "typeorm";
import { User } from "../entities/user.ts";

// Constants
import { GENERAL_MESSAGES, USER_MESSAGES } from "../constants/messages.ts";
import { STATUS_CODES } from "../constants/httpStatusCodes.ts";
import { UserRole } from "../types/user.ts";

export const userController = (userRepository: Repository<User>) => {
  return {
    getUser: async (req: Request, res: Response) => {
      try {
        const users = await userRepository.find();
        res.json(users);
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).send("Internal server error");
      }
    },
    getUserById: async (req: Request, res: Response) => {
      try {
        const userId = req.params.id;
        const user = await userRepository.findOneBy({ id: userId });

        if (!user) {
          res.status(404).send("User not found");
          return;
        }

        res.send(user);
      } catch (error) {
        console.error("Error fetching user with id ${req.params.id}:", error);
        res.status(500).send("Internal server error");
      }
    },
    createUser: async (req: Request, res: Response) => {
      try {
        const { name, password, email, role } = req.body;

        if (!name || !password || !email || !role) {
          return res
            .status(STATUS_CODES.BAD_REQUEST)
            .send(USER_MESSAGES.USER_NOT_FOUND);
        }

        // Check if there's already an admin user
        const adminCount = await userRepository.count({
          where: { role: UserRole.admin },
        });

        // If an admin exists and the requested role is admin, reject the request
        if (adminCount > 0 && UserRole.admin) {
          return res
            .status(STATUS_CODES.FORBIDDEN)
            .send(USER_MESSAGES.ADMIN_ONLY);
        }

        // If there's already an admin and the requested role is not admin, ensure the role is customer
        if (adminCount > 0 && role === UserRole.customer) {
          // Create the user with customer role
          const user = userRepository.create({
            name,
            email,
            password,
            role: UserRole.customer, // Ensure the role is customer
          });
          const savedUser = await userRepository.save(user);

          return res.status(STATUS_CODES.NO_CONTENT).send(savedUser);
        }

        const user = userRepository.create({
          name,
          email,
          password,
          role: role === UserRole.admin ? UserRole.admin : UserRole.customer, // Allow admin only if no admin exists
        });

        const results = await userRepository.save(user);

        res.status(STATUS_CODES.NO_CONTENT).send(results);
      } catch (error) {
        console.error("Error creating user:", error);
        res
          .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
          .send(GENERAL_MESSAGES.INTERNAL_SERVER_ERROR);
      }
    },

    updateUser: async (req: Request, res: Response) => {
      try {
        const userId = req.params.id;
        const user = await userRepository.findOneBy({ id: userId });

        if (!user) {
          res.status(404).send("User not found");
          return;
        }

        userRepository.merge(user, req.body);

        const results = await userRepository.save(user);

        res.send(results);
      } catch (error) {
        console.error("Error updating user with id ${req.params.id}:", error);
        res.status(500).send("Internal server error");
      }
    },
    deleteUser: async (req: Request, res: Response) => {
      try {
        const results = await userRepository.delete(req.params.id);

        if (results.affected === 0) {
          res.status(404).send("User not found");
          return;
        }

        res.send(results);
      } catch (error) {
        console.error("Error deleting user with id ${req.params.id}:", error);
        res.status(500).send("Internal server error");
      }
    },
  };
};
