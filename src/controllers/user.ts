import { Request, Response } from "express";
import { Repository } from "typeorm";
import { AuthenticationClient } from "auth0";

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

// Services
import { auth0Service } from "../services/auth0Service.ts";
import { userService as defaultUserService } from "../services/userService.ts";

export const userController = ({
  authClient,
  userRepository,
  userService = defaultUserService,
  authService = auth0Service,
}: {
  authClient: AuthenticationClient;
  userRepository: Repository<User>;
  userService?: typeof defaultUserService;
  authService?: typeof auth0Service;
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
      try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
          return res
            .status(STATUS_CODES.BAD_REQUEST)
            .json({ message: AUTH_MESSAGES.MISSING_REQUIRED_FIELDS });
        }

        const { registerNewUser } = authService({
          payloadReq: { email, password, name },
          authClient,
        });
        const { findUser, createUser } = userService(userRepository);

        // Check if user already exists with the given email
        const existingUser = await findUser({ email });

        if (existingUser) {
          return res.status(STATUS_CODES.CONFLICT).json({
            error: AUTH_MESSAGES.USER_ALREADY_EXISTS,
          });
        }

        const createUserResponse = await registerNewUser();

        // Check if Auth0 sign-up was successful
        if (
          !createUserResponse ||
          !JSON.parse(JSON.stringify(createUserResponse)).data?._id
        ) {
          return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
            message: AUTH_MESSAGES.SIGNUP_FAILED,
          });
        }

        // Check if the Admin role already exists
        const existingAdminUser = await findUser({
          role: UserRole.Admin,
        });

        // If an Admin user exists, set the new user role as Customer, otherwise, set it as Admin
        const userRole = existingAdminUser ? UserRole.Customer : UserRole.Admin;

        const newUser = await createUser({
          name,
          email,
          password,
          role: userRole,
        });

        res.status(STATUS_CODES.CREATED).json({
          message: AUTH_MESSAGES.SIGNUP_SUCCESS,
          user: newUser,
        });
      } catch (error) {
        console.log("Sign-up error:", error);

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
      try {
        const { email, password } = req.body || {};

        if (!email || !password) {
          return res
            .status(STATUS_CODES.BAD_REQUEST)
            .json({ message: AUTH_MESSAGES.MISSING_REQUIRED_FIELDS });
        }

        const { getAccessToken } = authService({
          payloadReq: { email, password, name: "" },
          authClient,
        });

        const { findUser } = userService(userRepository);

        const user = await findUser({ email });

        if (!user) {
          return res
            .status(STATUS_CODES.NOT_FOUND)
            .json({ message: USER_MESSAGES.USER_NOT_FOUND });
        }

        const token = await getAccessToken();

        if (!token) {
          return res
            .status(STATUS_CODES.UNAUTHORIZED)
            .json({ message: AUTH_MESSAGES.INVALID_CREDENTIALS });
        }

        return res.status(STATUS_CODES.OK).json({
          message: AUTH_MESSAGES.SIGNIN_SUCCESS,
          accessToken: token,
        });
      } catch (error) {
        console.log("Sign-in error:", error);

        const errorMessage = error?.body
          ? JSON.parse(error?.body)?.message
          : AUTH_MESSAGES.SIGNIN_FAILED;

        return res
          .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
          .json({ message: errorMessage });
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
      const { getAllUsers } = userService(userRepository);

      try {
        const users = await getAllUsers();

        return res.status(users.length > 0 ? STATUS_CODES.OK : STATUS_CODES.NOT_FOUND).json({
          message:
            users.length > 0
              ? USER_MESSAGES.USERS_FETCHED
              : USER_MESSAGES.USER_NOT_FOUND,
          users,
        });
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

        if (!userId) {
          return res.status(STATUS_CODES.BAD_REQUEST).json({
            message: USER_MESSAGES.INVALID_USER_ID,
          });
        }

        const { findUser } = userService(userRepository);

        const user = await findUser({ id: userId });

        if (!user) {
          return res
            .status(STATUS_CODES.NOT_FOUND)
            .json({ message: USER_MESSAGES.USER_NOT_FOUND });
        }

        return res.status(STATUS_CODES.OK).json(user);
      } catch (error) {
        console.log("Error fetching user with id ${req.params.id}:", error);

        return res
          .status(STATUS_CODES.INTERNAL_SERVER_ERROR)
          .json({ message: GENERAL_MESSAGES.INTERNAL_SERVER_ERROR });
      }
    },
  };
};
