import { Request, Response } from "express";
import { Repository } from "typeorm";
import bcrypt from "bcryptjs";

// Entities
import { User } from "../../entities/user.ts";

// Controllers
import { userController } from "../../controllers/user.ts";

// Mocks
import { USER } from "../../__mocks__/user.ts";

// Constants
import { STATUS_CODES } from "../../constants/httpStatusCodes.ts";
import {
  AUTH_MESSAGES,
  GENERAL_MESSAGES,
  USER_MESSAGES,
} from "../../constants/messages.ts";
import { AuthenticationClient } from "auth0";

const mockUserRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
} as unknown as Repository<User>;

const mockAuthClient = {
  database: {
    signUp: jest.fn(),
  },
  oauth: {
    passwordGrant: jest.fn(),
  },
} as unknown as AuthenticationClient;

const createMockReqRes = (body: object = {}, params: object = {}) => {
  const req = {
    body,
    params,
  } as unknown as Request;

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as unknown as Response;

  return { req, res };
};

describe("userController", () => {
  describe("signUp", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should return status bad request if missing required fields", async () => {
      const { req, res } = createMockReqRes({
        name: "",
        email: "",
        password: "",
      });

      await userController({
        userRepository: mockUserRepository,
        authClient: mockAuthClient,
      }).signUp(req, res);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({
        message: AUTH_MESSAGES.MISSING_REQUIRED_FIELDS,
      });
    });

    it("should return status conflict if user already exists", async () => {
      const { req, res } = createMockReqRes({
        name: "User Test",
        email: "usertest@example.com",
        password: "password",
      });

      (mockUserRepository.findOne as jest.Mock).mockResolvedValue(USER);

      await userController({
        userRepository: mockUserRepository,
        authClient: mockAuthClient,
      }).signUp(req, res);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.CONFLICT);
      expect(res.json).toHaveBeenCalledWith({
        error: AUTH_MESSAGES.USER_ALREADY_EXISTS,
      });
    });

    it("should return status internal server error if Auth0 sign-up fails", async () => {
      const { req, res } = createMockReqRes({
        name: "User Test",
        email: "usertest@example.com",
        password: "password",
      });

      (mockUserRepository.findOne as jest.Mock).mockResolvedValue(null);
      (mockAuthClient.database.signUp as jest.Mock).mockResolvedValue(null);

      await userController({
        userRepository: mockUserRepository,
        authClient: mockAuthClient,
      }).signUp(req, res);

      expect(res.status).toHaveBeenCalledWith(
        STATUS_CODES.INTERNAL_SERVER_ERROR,
      );
      expect(res.json).toHaveBeenCalledWith({
        message: AUTH_MESSAGES.SIGNUP_FAILED,
      });
    });

    it("should return status internal server error if user creation fails", async () => {
      const { req, res } = createMockReqRes({
        name: "User Test",
        email: "usertest@example.com",
        password: "password",
      });

      (mockUserRepository.findOne as jest.Mock).mockResolvedValue(null);
      (mockAuthClient.database.signUp as jest.Mock).mockResolvedValue({
        data: { _id: "auth0_user_id" },
      });
      (mockUserRepository.create as jest.Mock).mockReturnValue(USER);
      (mockUserRepository.save as jest.Mock).mockRejectedValue(
        new Error("Database error"),
      );

      // Mock bcrypt hashing
      bcrypt.hash = jest.fn().mockResolvedValue("hashed_password");

      await userController({
        userRepository: mockUserRepository,
        authClient: mockAuthClient,
      }).signUp(req, res);

      expect(res.status).toHaveBeenCalledWith(
        STATUS_CODES.INTERNAL_SERVER_ERROR,
      );
      expect(res.json).toHaveBeenCalledWith({
        message: AUTH_MESSAGES.SIGNUP_FAILED,
      });
    });

    it("should sign up a new user successfully", async () => {
      const { req, res } = createMockReqRes({
        name: "User Test",
        email: "usertest@example.com",
        password: "password",
      });

      (mockUserRepository.findOne as jest.Mock).mockResolvedValue(null);
      (mockAuthClient.database.signUp as jest.Mock).mockResolvedValue({
        data: {
          _id: "auth0_user_id",
        },
      });
      (mockUserRepository.create as jest.Mock).mockReturnValue(USER);
      (mockUserRepository.save as jest.Mock).mockResolvedValue(USER);

      // Mock bcrypt hashing
      bcrypt.hash = jest.fn().mockResolvedValue("hashed_password");

      await userController({
        userRepository: mockUserRepository,
        authClient: mockAuthClient,
      }).signUp(req, res);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.CREATED);
      expect(res.json).toHaveBeenCalledWith({
        message: AUTH_MESSAGES.SIGNUP_SUCCESS,
        user: {
          id: USER.id,
          name: USER.name,
          email: USER.email,
          role: USER.role,
          dish: [],
        },
      });
    });
  });

  describe("signIn", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should return status bad request if missing required fields", async () => {
      const { req, res } = createMockReqRes({ email: "", password: "" });

      await userController({
        userRepository: mockUserRepository,
        authClient: mockAuthClient,
      }).signIn(req, res);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({
        message: AUTH_MESSAGES.MISSING_REQUIRED_FIELDS,
      });
    });

    it("should sign in a user successfully and return access token", async () => {
      const { req, res } = createMockReqRes({
        email: "usertest@example.com",
        password: "password",
      });

      (mockAuthClient.oauth.passwordGrant as jest.Mock).mockResolvedValue({
        data: {
          id_token: "access_token",
        },
      });
      (mockUserRepository.findOneBy as jest.Mock).mockResolvedValue(USER);

      await userController({
        userRepository: mockUserRepository,
        authClient: mockAuthClient,
      }).signIn(req, res);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.OK);
      expect(res.json).toHaveBeenCalledWith({
        message: AUTH_MESSAGES.SIGNIN_SUCCESS,
        accessToken: "access_token",
      });
    });

    it("should return status unauthorized if there is no have access token", async () => {
      const { req, res } = createMockReqRes({
        email: "usertest@example.com",
        password: "password",
      });

      (mockAuthClient.oauth.passwordGrant as jest.Mock).mockResolvedValue({
        data: {},
      });

      await userController({
        userRepository: mockUserRepository,
        authClient: mockAuthClient,
      }).signIn(req, res);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.UNAUTHORIZED);
      expect(res.json).toHaveBeenCalledWith({
        message: AUTH_MESSAGES.INVALID_CREDENTIALS,
      });
    });

    it("should return status internal server error if Auth0 sign-in fails", async () => {
      const { req, res } = createMockReqRes({
        email: "usertest@example.com",
        password: "password",
      });

      (mockAuthClient.oauth.passwordGrant as jest.Mock).mockRejectedValue(
        new Error("Auth0 sign-in failed"),
      );

      await userController({
        userRepository: mockUserRepository,
        authClient: mockAuthClient,
      }).signIn(req, res);

      expect(res.status).toHaveBeenCalledWith(
        STATUS_CODES.INTERNAL_SERVER_ERROR,
      );
      expect(res.json).toHaveBeenCalledWith({
        message: AUTH_MESSAGES.SIGNIN_FAILED,
      });
    });
  });

  describe("getUser", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should return status not found if user is not found", async () => {
      const { req, res } = createMockReqRes();

      (mockUserRepository.find as jest.Mock).mockResolvedValue([]);

      await userController({
        userRepository: mockUserRepository,
        authClient: mockAuthClient,
      }).getUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({
        message: USER_MESSAGES.USER_NOT_FOUND,
      });
    });

    it("should get all users successfully", async () => {
      const { req, res } = createMockReqRes();

      (mockUserRepository.find as jest.Mock).mockResolvedValue([USER]);

      await userController({
        userRepository: mockUserRepository,
        authClient: mockAuthClient,
      }).getUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.OK);
      expect(res.json).toHaveBeenCalledWith([USER]);
    });

    it("should return status internal server error if an error occurs", async () => {
      const { req, res } = createMockReqRes();

      (mockUserRepository.find as jest.Mock).mockRejectedValue(
        new Error("Database error"),
      );

      await userController({
        userRepository: mockUserRepository,
        authClient: mockAuthClient,
      }).getUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(
        STATUS_CODES.INTERNAL_SERVER_ERROR,
      );
      expect(res.json).toHaveBeenCalledWith({
        message: GENERAL_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    });
  });

  describe("getUserById", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should return status not found if user is not found", async () => {
      const { req, res } = createMockReqRes({}, { id: "1" });

      (mockUserRepository.findOneBy as jest.Mock).mockResolvedValue(null);

      await userController({
        userRepository: mockUserRepository,
        authClient: mockAuthClient,
      }).getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({
        message: USER_MESSAGES.USER_NOT_FOUND,
      });
    });

    it("should get user by ID successfully", async () => {
      const { req, res } = createMockReqRes({}, { id: "1" });

      (mockUserRepository.findOneBy as jest.Mock).mockResolvedValue(USER);

      await userController({
        userRepository: mockUserRepository,
        authClient: mockAuthClient,
      }).getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.OK);
      expect(res.json).toHaveBeenCalledWith(USER);
    });

    it("should return status internal server error", async () => {
      const { req, res } = createMockReqRes({}, { id: "1" });

      (mockUserRepository.findOneBy as jest.Mock).mockRejectedValue(
        new Error(),
      );

      await userController({
        userRepository: mockUserRepository,
        authClient: mockAuthClient,
      }).getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(
        STATUS_CODES.INTERNAL_SERVER_ERROR,
      );
      expect(res.json).toHaveBeenCalledWith({
        message: GENERAL_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    });
  });
});
