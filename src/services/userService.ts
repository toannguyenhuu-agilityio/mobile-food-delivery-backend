import { Repository } from "typeorm";
import * as bcrypt from "bcryptjs";

// Entities
import { User } from "../entities/user.ts";

// Types
import { IUser, UserRole } from "../types/user.ts";

export const userService = (userRepository: Repository<User>) => {
  return {
    findUser: async (
      criteria: Partial<Pick<IUser, "email" | "id" | "role">>,
    ): Promise<User> => await userRepository.findOneBy({ ...criteria }),
    getAllUsers: async (): Promise<User[]> => await userRepository.find(),
    createUser: async ({
      name,
      email,
      password,
      role,
    }: {
      name: string;
      email: string;
      password: string;
      role: UserRole;
    }): Promise<Omit<IUser, "password">> => {
      // Hash the password before storing it
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = userRepository.create({
        name,
        email,
        password: hashedPassword,
        role,
      });

      const { password: _, ...userData } = await userRepository.save(newUser);

      return userData;
    },
  };
};
