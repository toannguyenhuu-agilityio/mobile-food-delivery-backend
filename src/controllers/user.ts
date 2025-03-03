import { Request, Response } from "express";
import { Repository } from "typeorm";
import { AuthenticationClient } from "auth0";
import bcrypt from "bcryptjs";

// Entities
import { User } from "../entities/user.ts";

// Constants
import {
  AUTH_MESSAGES,
  GENERAL_MESSAGES,
  USER_MESSAGES,
} from "../constants/messages.ts";
import { STATUS_CODES } from "../constants/httpStatusCodes.ts";
import { UserRole } from "../types/user.ts";

export const userController = ({
  authClient,
  userRepository,
}: {
  authClient: AuthenticationClient;
  userRepository: Repository<User>;
}) => {
  return {
    /**
     * Signs up a new user.
     * @param {Object} req - The request object containing user details such as email, password, and name.
     * @param {Object} res - The response object used to send the response.
     *
     * @returns {Promise<void>} - A promise that resolves when the user is successfully signed up.
     * @throws {Error} - Throws an error if an unexpected issue occurs while signing up the user.
     *
     */
    signUp: async (req: Request, res: Response) => {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        return res
          .status(STATUS_CODES.BAD_REQUEST)
          .json({ message: AUTH_MESSAGES.MISSING_REQUIRED_FIELDS });
      }

      // Check if user already exists with the given email
      const existingUser = await userRepository.findOne({ where: { email } });

      if (existingUser) {
        return res.status(STATUS_CODES.CONFLICT).json({
          error: AUTH_MESSAGES.USER_ALREADY_EXISTS,
        });
      }

      try {
        const createUserResponse = await authClient.database.signUp({
          email,
          password,
          connection: "Username-Password-Authentication", // Default Auth0 connection for username-password
          user_metadata: { firstName: name },
        });

        // Check if Auth0 sign-up was successful
        if (
          !createUserResponse ||
          !JSON.parse(JSON.stringify(createUserResponse)).data._id
        ) {
          return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            message: AUTH_MESSAGES.SIGNUP_FAILED,
          });
        }

        // Hash the password before storing it
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if the Admin role already exists
        const existingAdminUser = await userRepository.findOne({
          where: { role: UserRole.admin },
        });

        // If an Admin user exists, set the new user role as Customer, otherwise, set it as Admin
        const userRole = existingAdminUser ? UserRole.customer : UserRole.admin;

        const newUser = userRepository.create({
          name,
          email,
          password: hashedPassword,
          role: userRole,
        });

        // Save the user entity to the database
        const createdUser = await userRepository.save(newUser);

        // Remove sensitive data like password before sending user data in response
        const { password: _, ...userData } = createdUser;

        res.status(STATUS_CODES.CREATED).json({
          message: AUTH_MESSAGES.SIGNUP_SUCCESS,
          user: userData,
        });
      } catch (error) {
        const errorMessage = error?.body
          ? JSON.parse(error?.body)?.message
          : AUTH_MESSAGES.SIGNUP_FAILED;

        res
          .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
          .json({ message: errorMessage });
      }
    },
    /**
     * Signs in a user.
     * @param {Object} req - The request object containing user credentials such as email and password.
     * @param {Object} res - The response object used to send the response.
     *
     * @returns {Promise<void>} - A promise that resolves when the user is successfully signed in.
     * @throws {Error} - Throws an error if an unexpected issue occurs while signing in the user.
     *
     */
    signIn: async (req: Request, res: Response) => {
      const { email, password } = req.body;

      try {
        if (!email || !password) {
          return res
            .status(STATUS_CODES.BAD_REQUEST)
            .json({ message: AUTH_MESSAGES.MISSING_REQUIRED_FIELDS });
        }

        const tokenResponse = await authClient.oauth.passwordGrant({
          username: email,
          password,
          realm: "Username-Password-Authentication",
          client_id: process.env.AUTH0_CLIENT_ID,
          client_secret: process.env.AUTH0_CLIENT_SECRET,
          scope: "openid profile email", // Define the scope of the access request
          audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`, // Define your API audience
        });

        const { id_token } = tokenResponse.data;

        if (!id_token) {
          return res
            .status(STATUS_CODES.UNAUTHORIZED)
            .json({ message: AUTH_MESSAGES.INVALID_CREDENTIALS });
        }

        res.status(STATUS_CODES.OK).json({ accessToken: id_token });
      } catch (error) {
        const errorMessage = JSON.parse(error?.body)?.message;

        res
          .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
          .json({ message: errorMessage || AUTH_MESSAGES.SIGNUP_FAILED });
      }
    },

    /**
     * Fetches all users from the database.
     * @param {Object} req - The request object.
     * @param {Object} res - The response object used to send the response.
     *
     * @returns {Promise<void>} - A promise that resolves when the users are successfully fetched.
     * @throws {Error} - Throws an error if an unexpected issue occurs while fetching the users.
     *
     */
    getUsers: async (req: Request, res: Response) => {
      try {
        const users = await userRepository.find();

        if (users.length === 0) {
          return res
            .status(STATUS_CODES.NOT_FOUND)
            .json({ message: USER_MESSAGES.USER_NOT_FOUND });
        }

        res.status(STATUS_CODES.OK).json(users);
      } catch (error) {
        console.log("Error fetching users:", error);

        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
          message: GENERAL_MESSAGES.INTERNAL_SERVER_ERROR,
        });
      }
    },

    /**
     * Fetches a user by their ID from the database.
     * @param {Object} req - The request object containing the user ID.
     * @param {Object} res - The response object used to send the response.
     *
     * @returns {Promise<void>} - A promise that resolves when the user is successfully fetched.
     * @throws {Error} - Throws an error if an unexpected issue occurs while fetching the user.
     *
     */
    getUserById: async (req: Request, res: Response) => {
      try {
        const userId = req.params.id;
        const user = await userRepository.findOneBy({ id: userId });

        if (!user) {
          return res
            .status(STATUS_CODES.NOT_FOUND)
            .json({ message: USER_MESSAGES.USER_NOT_FOUND });
        }

        res.status(STATUS_CODES.OK).json(user);
      } catch (error) {
        console.log("Error fetching user with id ${req.params.id}:", error);

        res
          .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
          .json({ message: GENERAL_MESSAGES.INTERNAL_SERVER_ERROR });
      }
    },
  };
};
