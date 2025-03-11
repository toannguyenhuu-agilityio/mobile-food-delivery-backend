import { NextFunction, Request, Response } from "express";
import { Repository } from "typeorm";

// Entities
import { User } from "../../entities/user.ts";

// Controllers
import { userController } from "../../controllers/user.ts";

// Services
import { userService } from "../../services/userService.ts";
import { auth0Service } from "../../services/auth0Service.ts";

// Mocks
import { USER } from "../../__mocks__/user.ts";

// Constants
import { STATUS_CODES } from "../../constants/httpStatusCodes.ts";
import { AUTH_MESSAGES, USER_MESSAGES } from "../../constants/messages.ts";
import { AuthenticationClient } from "auth0";

// Types
import { UserRole } from "../../types/user.ts";

jest.mock("../../services/userService.ts");
jest.mock("../../services/auth0Service.ts");

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

const mockAuthService = jest.fn().mockReturnValue({
  registerNewUser: jest.fn(),
  getAccessToken: jest.fn(),
});
const mockUserService = jest.fn().mockReturnValue({
  findUser: jest.fn(),
  getAllUsers: jest.fn(),
  createUser: jest.fn(),
}) as unknown as typeof userService;

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
        id: "1",
        name: "John Doe",
        email: "B4s8s@example.com",
        password: "password",
        role: UserRole.Admin,
      });

      (mockUserRepository.findOne as jest.Mock).mockResolvedValue(USER);
      (mockUserService as jest.Mock).mockReturnValue({
        findUser: jest.fn().mockResolvedValue({
          email: "test@example.com",
        }),
        getAllUsers: jest.fn(),
        createUser: jest.fn(),
      });
      mockAuthService.mockReturnValue({
        registerNewUser: jest.fn().mockResolvedValue({
          id: "newUserId",
          name: "John Doe",
          email: "B4s8s@example.com",
        }),
      });

      await userController({
        userRepository: mockUserRepository,
        authClient: mockAuthClient,
        userService: mockUserService as unknown as typeof userService,
        authService: mockAuthService as unknown as typeof auth0Service,
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
      (mockUserService as jest.Mock).mockReturnValue({
        findUser: jest.fn().mockResolvedValue(null),
        getAllUsers: jest.fn(),
        createUser: jest.fn(),
      });
      mockAuthService.mockReturnValue({
        registerNewUser: jest.fn().mockResolvedValue(null),
      });

      await userController({
        userRepository: mockUserRepository,
        authClient: mockAuthClient,
        userService: mockUserService as unknown as typeof userService,
        authService: mockAuthService as unknown as typeof auth0Service,
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
      (mockUserService as jest.Mock).mockReturnValue({
        findUser: jest.fn().mockResolvedValue(null),
        getAllUsers: jest.fn(),
        createUser: jest
          .fn()
          .mockRejectedValue(new Error("User creation failed")),
      });
      mockAuthService.mockReturnValue({
        registerNewUser: jest.fn().mockResolvedValue({
          data: { _id: "auth0_user_id" },
        }),
      });

      await userController({
        userRepository: mockUserRepository,
        authClient: mockAuthClient,
        userService: mockUserService as unknown as typeof userService,
        authService: mockAuthService as unknown as typeof auth0Service,
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
      (mockUserService as jest.Mock).mockReturnValue({
        findUser: jest.fn().mockResolvedValue(null),
        getAllUsers: jest.fn(),
        createUser: jest.fn().mockResolvedValue(USER),
      });
      mockAuthService.mockReturnValue({
        registerNewUser: jest.fn().mockResolvedValue({
          data: { _id: "auth0_user_id" },
        }),
      });

      await userController({
        userRepository: mockUserRepository,
        authClient: mockAuthClient,
        userService: mockUserService as unknown as typeof userService,
        authService: mockAuthService as unknown as typeof auth0Service,
      }).signUp(req, res);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.CREATED);
      expect(res.json).toHaveBeenCalledWith({
        message: AUTH_MESSAGES.SIGNUP_SUCCESS,
        user: USER,
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

    it("should return status not found if user not found", async () => {
      const { req, res } = createMockReqRes({
        email: "usertest@example.com",
        password: "password",
      });

      mockAuthService.mockReturnValue({
        registerNewUser: jest.fn().mockResolvedValue(null),
        getAccessToken: jest.fn().mockResolvedValue(null),
      });
      (mockUserService as jest.Mock).mockReturnValue({
        findUser: jest.fn().mockResolvedValue(null),
      });

      await userController({
        userRepository: mockUserRepository,
        authClient: mockAuthClient,
        userService: mockUserService as unknown as typeof userService,
        authService: mockAuthService as unknown as typeof auth0Service,
      }).signIn(req, res);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({
        message: AUTH_MESSAGES.USER_NOT_FOUND,
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
      mockAuthService.mockReturnValue({
        registerNewUser: jest.fn().mockResolvedValue(null),
        getAccessToken: jest.fn().mockResolvedValue("access_token"),
      });
      (mockUserService as jest.Mock).mockReturnValue({
        findUser: jest.fn().mockResolvedValue(USER),
      });

      await userController({
        userRepository: mockUserRepository,
        authClient: mockAuthClient,
        userService: mockUserService as unknown as typeof userService,
        authService: mockAuthService as unknown as typeof auth0Service,
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
      mockAuthService.mockReturnValue({
        registerNewUser: jest.fn().mockResolvedValue(null),
        getAccessToken: jest.fn().mockResolvedValue(null),
      });
      (mockUserService as jest.Mock).mockReturnValue({
        findUser: jest.fn().mockResolvedValue(USER),
      });

      await userController({
        userRepository: mockUserRepository,
        authClient: mockAuthClient,
        authService: mockAuthService as unknown as typeof auth0Service,
        userService: mockUserService as unknown as typeof userService,
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
    let mockNext: NextFunction;

    beforeEach(() => {
      mockNext = jest.fn();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should return status not found if user is not found", async () => {
      const { req, res } = createMockReqRes();

      (mockUserService as jest.Mock).mockReturnValue({
        findUser: jest.fn().mockResolvedValue(null),
        getAllUsers: jest.fn().mockResolvedValue([]),
        createUser: jest.fn(),
      });

      await userController({
        userRepository: mockUserRepository,
        authClient: mockAuthClient,
        userService: mockUserService as unknown as typeof userService,
      }).getUsers(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({
        message: USER_MESSAGES.USER_NOT_FOUND,
        users: [],
      });
    });

    it("should get all users successfully", async () => {
      const { req, res } = createMockReqRes();

      (mockUserService as jest.Mock).mockReturnValue({
        findUser: jest.fn().mockResolvedValue(null),
        getAllUsers: jest.fn().mockResolvedValue([USER]),
        createUser: jest.fn(),
      });

      await userController({
        userRepository: mockUserRepository,
        authClient: mockAuthClient,
        userService: mockUserService as unknown as typeof userService,
      }).getUsers(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.OK);
      expect(res.json).toHaveBeenCalledWith({
        message: USER_MESSAGES.USERS_FETCHED,
        users: [USER],
      });
    });

    it("should return status internal server error if an error occurs", async () => {
      const { req, res } = createMockReqRes();

      (mockUserService as jest.Mock).mockReturnValue({
        findUser: jest.fn().mockResolvedValue(null),
        getAllUsers: jest
          .fn()
          .mockRejectedValue(new Error("User creation failed")),
        createUser: jest.fn(),
      });

      await userController({
        userRepository: mockUserRepository,
        authClient: mockAuthClient,
        userService: mockUserService as unknown as typeof userService,
      }).getUsers(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(new Error("User creation failed"));
    });
  });

  describe("getUserById", () => {
    let mockNext: NextFunction;

    beforeEach(() => {
      mockNext = jest.fn();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should return status bad request if ID is not provided", async () => {
      const { req, res } = createMockReqRes();

      await userController({
        userRepository: mockUserRepository,
        authClient: mockAuthClient,
      }).getUserById(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({
        message: USER_MESSAGES.INVALID_USER_ID,
      });
    });

    it("should return status not found if user is not found", async () => {
      const { req, res } = createMockReqRes({}, { id: "1" });

      (mockUserService as jest.Mock).mockReturnValue({
        findUser: jest.fn().mockResolvedValue(null),
        getAllUsers: jest.fn(),
        createUser: jest.fn(),
      });
      await userController({
        userRepository: mockUserRepository,
        authClient: mockAuthClient,
        userService: mockUserService as unknown as typeof userService,
      }).getUserById(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({
        message: USER_MESSAGES.USER_NOT_FOUND,
      });
    });

    it("should get user by ID successfully", async () => {
      const { req, res } = createMockReqRes({}, { id: "1" });

      (mockUserService as jest.Mock).mockReturnValue({
        findUser: jest.fn().mockResolvedValue(USER),
        getAllUsers: jest.fn(),
        createUser: jest.fn(),
      });

      await userController({
        userRepository: mockUserRepository,
        authClient: mockAuthClient,
        userService: mockUserService as unknown as typeof userService,
      }).getUserById(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.OK);
      expect(res.json).toHaveBeenCalledWith(USER);
    });

    it("should return status internal server error", async () => {
      const { req, res } = createMockReqRes({}, { id: "1" });

      (mockUserService as jest.Mock).mockReturnValue({
        findUser: jest
          .fn()
          .mockRejectedValue(new Error("User creation failed")),
        getAllUsers: jest.fn(),
        createUser: jest.fn(),
      });

      await userController({
        userRepository: mockUserRepository,
        authClient: mockAuthClient,
        userService: mockUserService as unknown as typeof userService,
      }).getUserById(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(new Error("User creation failed"));
    });
  });
});
