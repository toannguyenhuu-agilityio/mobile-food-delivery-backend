import { Request, Response } from "express";
import { Repository } from "typeorm";
import { User } from "../entities/user.ts";

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
        const userId = Number(req.params.id);
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
        console.log("req.body", req.body);
        const user = userRepository.create(req.body);
        const results = await userRepository.save(user);

        res.status(201).send(results);
      } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).send("Internal server error");
      }
    },
    updateUser: async (req: Request, res: Response) => {
      try {
        const userId = Number(req.params.id);
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
