import express from "express";
import { DeleteResult, Repository } from "typeorm";

// Entities
import { Dish } from "../../entities/dish.ts";
import { User } from "../../entities/user.ts";

// Controllers
import { dishController } from "../../controllers/dish.ts";

// Mocks
import { DISH, DISHES, DISH_REQUEST } from "../../__mocks__/dish.ts";
import { USER } from "../../__mocks__/user.ts";

// Constants
import { STATUS_CODES } from "../../constants/httpStatusCodes.ts";
import {
  DISH_MESSAGES,
  GENERAL_MESSAGES,
  USER_MESSAGES,
} from "../../constants/messages.ts";

// Types
import { UserRole } from "../../types/user.ts";
import { DishCategory } from "../../types/dish.ts";

const mockDishRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  findOneBy: jest.fn(),
  merge: jest.fn(),
  delete: jest.fn(),
  findAndCount: jest.fn(),
} as unknown as jest.Mocked<Repository<Dish>>;

const mockUserRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
} as unknown as jest.Mocked<Repository<User>>;

describe("Dish Controller", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createDish", () => {
    const initMockReq = DISH_REQUEST as unknown as express.Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as express.Response;

    it("should return a bad request response and message missing required fields", async () => {
      const mockReq = {
        body: {
          ...initMockReq.body,
          name: "",
        },
      } as unknown as express.Request;

      await dishController({
        dishRepository: mockDishRepository,
        userRepository: mockUserRepository,
      }).createDish(mockReq, res);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({
        message: "Missing required fields",
      });
    });

    it("should return a status not found  when user is not found", async () => {
      const mockReq = {
        body: {
          ...initMockReq.body,
          userId: 2,
        },
      } as unknown as express.Request;

      await dishController({
        dishRepository: mockDishRepository,
        userRepository: mockUserRepository,
      }).createDish(mockReq, res);

      mockUserRepository.findOne.mockResolvedValue(null);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({
        message: "User not found",
      });
    });

    it("should return a status admin only when user is not admin role", async () => {
      const mockReq = {
        body: {
          ...initMockReq.body,
          role: UserRole.customer,
        },
      } as unknown as express.Request;

      mockUserRepository.findOne.mockResolvedValue({
        ...USER,
        role: UserRole.customer,
      } as unknown as User);

      await dishController({
        dishRepository: mockDishRepository,
        userRepository: mockUserRepository,
      }).createDish(mockReq, res);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.FORBIDDEN);
      expect(res.json).toHaveBeenCalledWith({
        message: USER_MESSAGES.ADMIN_ONLY,
      });
    });

    it("should return a status created", async () => {
      const mockReq = DISH_REQUEST as unknown as express.Request;

      mockUserRepository.findOne.mockResolvedValue({
        ...USER,
        role: UserRole.admin,
      } as unknown as User);

      mockDishRepository.create.mockReturnValue({
        ...DISH,
        id: 1,
        user: USER,
      } as unknown as Dish);

      mockDishRepository.save.mockResolvedValue(DISH as unknown as Dish);

      await dishController({
        dishRepository: mockDishRepository,
        userRepository: mockUserRepository,
      }).createDish(mockReq, res);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.NO_CONTENT);
      expect(res.json).toHaveBeenCalledWith(DISH);
    });

    it("should return a status internal server error", async () => {
      const mockReq = DISH_REQUEST as unknown as express.Request;

      mockUserRepository.findOne.mockResolvedValue({
        ...USER,
        role: UserRole.admin,
      } as unknown as User);

      mockDishRepository.create.mockReturnValue({
        ...DISH,
        id: 1,
        user: USER,
      } as unknown as Dish);

      mockDishRepository.save.mockRejectedValue(
        new Error("Internal server error"),
      );

      await dishController({
        dishRepository: mockDishRepository,
        userRepository: mockUserRepository,
      }).createDish(mockReq, res);

      expect(res.status).toHaveBeenCalledWith(
        STATUS_CODES.INTERNAL_SERVER_ERROR,
      );
      expect(res.json).toHaveBeenCalledWith({
        message: GENERAL_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    });
  });

  describe("getDishByID", () => {
    const initMockReq = {
      params: { id: "1" },
    } as unknown as express.Request;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as express.Response;

    it("should return a status not found", async () => {
      mockDishRepository.findOneBy.mockResolvedValue(null);

      await dishController({
        dishRepository: mockDishRepository,
        userRepository: mockUserRepository,
      }).getDishByID(initMockReq, res);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({
        message: DISH_MESSAGES.DISH_NOT_FOUND,
      });
    });

    it("should return a status ok", async () => {
      mockDishRepository.findOneBy.mockResolvedValue(DISH as unknown as Dish);

      await dishController({
        dishRepository: mockDishRepository,
        userRepository: mockUserRepository,
      }).getDishByID(initMockReq, res);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.OK);
      expect(res.json).toHaveBeenCalledWith(DISH);
    });

    it("should return a status internal server error", async () => {
      mockDishRepository.findOneBy.mockRejectedValue(
        new Error("Internal server error"),
      );

      await dishController({
        dishRepository: mockDishRepository,
        userRepository: mockUserRepository,
      }).getDishByID(initMockReq, res);

      expect(res.status).toHaveBeenCalledWith(
        STATUS_CODES.INTERNAL_SERVER_ERROR,
      );
      expect(res.json).toHaveBeenCalledWith({
        message: GENERAL_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    });
  });

  describe("updateDishByID", () => {
    const initMockReq = {
      params: { id: "1" },
      body: {
        name: "test",
      },
    } as unknown as express.Request;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as express.Response;

    it("should return a status not found  when user is not found", async () => {
      mockDishRepository.findOneBy.mockResolvedValue(DISH as unknown as Dish);
      mockUserRepository.findOne.mockResolvedValue(null);

      await dishController({
        dishRepository: mockDishRepository,
        userRepository: mockUserRepository,
      }).updateDishByID(initMockReq, res);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({
        message: USER_MESSAGES.USER_NOT_FOUND,
      });
    });

    it("should return a status admin only when user is not admin role", async () => {
      mockDishRepository.findOneBy.mockResolvedValue(DISH as unknown as Dish);
      mockUserRepository.findOne.mockResolvedValue({
        ...USER,
        role: UserRole.customer,
      } as unknown as User);

      await dishController({
        dishRepository: mockDishRepository,
        userRepository: mockUserRepository,
      }).updateDishByID(initMockReq, res);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.FORBIDDEN);
      expect(res.json).toHaveBeenCalledWith({
        message: USER_MESSAGES.ADMIN_ONLY,
      });
    });

    it("should return a status not found", async () => {
      mockUserRepository.findOne.mockResolvedValue({
        ...USER,
        role: UserRole.admin,
        dishes: [],
        carts: [],
      });
      mockDishRepository.findOneBy.mockResolvedValue(null);

      await dishController({
        dishRepository: mockDishRepository,
        userRepository: mockUserRepository,
      }).updateDishByID(initMockReq, res);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({
        message: DISH_MESSAGES.DISH_NOT_FOUND,
      });
    });

    it("should return a status ok", async () => {
      mockDishRepository.findOneBy.mockResolvedValue(DISH as unknown as Dish);
      mockUserRepository.findOne.mockResolvedValue({
        ...USER,
        role: UserRole.admin,
      } as unknown as User);

      const updatedDish = {
        ...DISH,
        ...initMockReq.body,
      };

      mockDishRepository.findOneBy.mockResolvedValue(DISH as unknown as Dish); // Simulate that the dish exists
      mockDishRepository.merge.mockReturnValue(updatedDish); // Simulate the merge operation
      mockDishRepository.save.mockResolvedValue(updatedDish); // Simulate successful save

      await dishController({
        dishRepository: mockDishRepository,
        userRepository: mockUserRepository,
      }).updateDishByID(initMockReq, res);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.OK);
      expect(res.json).toHaveBeenCalledWith(updatedDish);
    });

    it("should return a status internal server error", async () => {
      mockDishRepository.findOneBy.mockResolvedValue(DISH as unknown as Dish);
      mockUserRepository.findOne.mockResolvedValue({
        ...USER,
        role: UserRole.admin,
      } as unknown as User);

      mockDishRepository.findOneBy.mockRejectedValue(
        new Error("Internal server error"),
      );

      await dishController({
        dishRepository: mockDishRepository,
        userRepository: mockUserRepository,
      }).updateDishByID(initMockReq, res);

      expect(res.status).toHaveBeenCalledWith(
        STATUS_CODES.INTERNAL_SERVER_ERROR,
      );
      expect(res.json).toHaveBeenCalledWith({
        message: GENERAL_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    });
  });

  describe("deleteDishByID", () => {
    const initMockReq = {
      params: { id: "1" },
      body: {
        userId: "1",
      },
    } as unknown as express.Request;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as express.Response;

    it("should return a status not found  when user is not found", async () => {
      mockDishRepository.findOneBy.mockResolvedValue(DISH as unknown as Dish);
      mockUserRepository.findOne.mockResolvedValue(null);

      await dishController({
        dishRepository: mockDishRepository,
        userRepository: mockUserRepository,
      }).deleteDishByID(initMockReq, res);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({
        message: USER_MESSAGES.USER_NOT_FOUND,
      });
    });

    it("should return a status admin only when user is not admin role", async () => {
      mockDishRepository.findOneBy.mockResolvedValue(DISH as unknown as Dish);
      mockUserRepository.findOne.mockResolvedValue({
        ...USER,
        role: UserRole.customer,
      } as unknown as User);

      await dishController({
        dishRepository: mockDishRepository,
        userRepository: mockUserRepository,
      }).deleteDishByID(initMockReq, res);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.FORBIDDEN);
      expect(res.json).toHaveBeenCalledWith({
        message: USER_MESSAGES.ADMIN_ONLY,
      });
    });

    it("should return a status not found", async () => {
      mockUserRepository.findOne.mockResolvedValue({
        ...USER,
        role: UserRole.admin,
        dishes: [],
        carts: [],
      });
      mockDishRepository.delete.mockResolvedValue({
        affected: 0,
      } as unknown as DeleteResult);

      await dishController({
        dishRepository: mockDishRepository,
        userRepository: mockUserRepository,
      }).deleteDishByID(initMockReq, res);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({
        message: DISH_MESSAGES.DISH_NOT_FOUND,
      });
    });

    it("should return a status ok", async () => {
      mockUserRepository.findOne.mockResolvedValue({
        ...USER,
        role: UserRole.admin,
      } as unknown as User);

      mockDishRepository.delete.mockResolvedValue({
        affected: 1,
      } as unknown as DeleteResult);

      await dishController({
        dishRepository: mockDishRepository,
        userRepository: mockUserRepository,
      }).deleteDishByID(initMockReq, res);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.OK);
      expect(res.json).toHaveBeenCalledWith({
        message: DISH_MESSAGES.DISH_DELETED,
      });
    });

    it("should return a status internal server error", async () => {
      mockUserRepository.findOne.mockResolvedValue({
        ...USER,
        role: UserRole.admin,
      } as unknown as User);

      mockDishRepository.delete.mockRejectedValue(
        new Error("Internal server error"),
      );

      await dishController({
        dishRepository: mockDishRepository,
        userRepository: mockUserRepository,
      }).deleteDishByID(initMockReq, res); // Simulate the deleteDishByID function

      expect(res.status).toHaveBeenCalledWith(
        STATUS_CODES.INTERNAL_SERVER_ERROR,
      );
      expect(res.json).toHaveBeenCalledWith({
        message: GENERAL_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    });
  });

  describe("getDishes", () => {
    const initMockReq = {
      query: {
        category: DishCategory.Main,
        page: "1",
        limit: "10",
      },
    } as unknown as express.Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as express.Response;

    it("should return a bad request response when category is invalid", async () => {
      const mockReq = {
        ...initMockReq,
        query: {
          ...initMockReq.query,
          category: "invalid",
        },
      } as unknown as express.Request;
      await dishController({
        dishRepository: mockDishRepository,
        userRepository: mockUserRepository,
      }).getDishes(mockReq, res);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({
        message: DISH_MESSAGES.INVALID_CATEGORY,
      });
    });

    it("should return invalid page and limit response", async () => {
      const mockReq = {
        ...initMockReq,
        query: {
          ...initMockReq.query,
          page: -1,
          limit: -1,
        },
      } as unknown as express.Request;
      await dishController({
        dishRepository: mockDishRepository,
        userRepository: mockUserRepository,
      }).getDishes(mockReq, res);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({
        message: DISH_MESSAGES.INVALID_PAGE_AND_LIMIT,
      });
    });

    it("should return a status ok", async () => {
      mockDishRepository.findAndCount.mockResolvedValue([
        DISHES,
        DISHES.length,
      ] as unknown as [Dish[], number]);

      await dishController({
        dishRepository: mockDishRepository,
        userRepository: mockUserRepository,
      }).getDishes(initMockReq, res);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.OK);
      expect(res.json).toHaveBeenCalledWith({
        data: DISHES,
        pagination: {
          page: 1,
          limit: 10,
          totalItems: DISHES.length,
          totalPages: Math.ceil(DISHES.length / 10),
        },
      });
    });

    it("should return a status internal server error", async () => {
      mockDishRepository.findAndCount.mockRejectedValue(
        new Error("Internal server error"),
      );

      await dishController({
        dishRepository: mockDishRepository,
        userRepository: mockUserRepository,
      }).getDishes(initMockReq, res);

      expect(res.status).toHaveBeenCalledWith(
        STATUS_CODES.INTERNAL_SERVER_ERROR,
      );
      expect(res.json).toHaveBeenCalledWith({
        message: GENERAL_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    });
  });
});
