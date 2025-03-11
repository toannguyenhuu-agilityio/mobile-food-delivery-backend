import { Request, Response } from "express";
import { Repository } from "typeorm";

// Entities
import { User } from "../../entities/user.ts";
import { Cart } from "../../entities/cart.ts";
import { CartItem } from "../../entities/cartItem.ts";
import { Dish } from "../../entities/dish.ts";

// Controllers
import { cartController } from "../../controllers/cart.ts";

// Mocks
import { USER } from "../../__mocks__/user.ts";
import { CART, CART_ITEM } from "../../__mocks__/cart.ts";
import { DISH } from "../../__mocks__/dish.ts";

// Constants
import { STATUS_CODES } from "../../constants/httpStatusCodes.ts";
import {
  CART_MESSAGES,
  GENERAL_MESSAGES,
  USER_MESSAGES,
} from "../../constants/messages.ts";

// Services
import { userService } from "../../services/userService.ts";
import { IUserRequest } from "../../types/user.ts";

const mockUserRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
} as unknown as jest.Mocked<Repository<User>>;

const mockDishRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
} as unknown as jest.Mocked<Repository<Dish>>;

const mockQueryBuilder = {
  innerJoinAndSelect: jest.fn().mockReturnThis(),
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getOne: jest.fn().mockResolvedValue(CART), // Replace `mockCart` with your mocked cart object
};

const mockCartRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  create: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
} as unknown as jest.Mocked<Repository<Cart>>;

const mockCartItemRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn<Promise<CartItem>, []>(),
  remove: jest.fn<Promise<CartItem>, []>(),
  create: jest.fn<Promise<CartItem>, []>(),
} as unknown as jest.Mocked<Repository<CartItem>>;

const mockUserService = jest.fn().mockReturnValue({
  findUser: jest.fn(),
  getAllUsers: jest.fn(),
  createUser: jest.fn(),
}) as unknown as typeof userService;

describe("Cart Controller", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createCart", () => {
    const initMockReq = {
      body: {
        userId: USER.id,
      },
    } as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    const mockNext = jest.fn();

    it("should return a status not found if user is not found", async () => {
      (mockUserService as jest.Mock).mockReturnValue({
        findUser: jest.fn().mockResolvedValue(null),
        getAllUsers: jest.fn(),
        createUser: jest.fn(),
      });

      await cartController({
        cartRepository: mockCartRepository,
        userRepository: mockUserRepository,
        dishRepository: mockDishRepository,
        cartItemRepository: {} as Repository<CartItem>,
        userService: mockUserService as unknown as typeof userService,
      }).createCart(initMockReq, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({
        message: USER_MESSAGES.USER_NOT_FOUND,
      });
    });

    it("should return a status conflict if cart already exists", async () => {
      (mockUserService as jest.Mock).mockReturnValue({
        findUser: jest.fn().mockResolvedValue(USER),
        getAllUsers: jest.fn(),
        createUser: jest.fn(),
      });
      mockCartRepository.findOne.mockResolvedValue(CART as unknown as Cart);

      await cartController({
        cartRepository: mockCartRepository,
        userRepository: mockUserRepository,
        dishRepository: mockDishRepository,
        cartItemRepository: {} as Repository<CartItem>,
        userService: mockUserService as unknown as typeof userService,
      }).createCart(initMockReq, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.CONFLICT);
      expect(res.json).toHaveBeenCalledWith({
        message: CART_MESSAGES.CART_ALREADY_EXISTS,
      });
    });

    it("should create a new cart", async () => {
      mockCartRepository.findOne.mockResolvedValue(null);
      mockCartRepository.create.mockImplementation(
        () => CART as unknown as Cart,
      );
      (mockUserService as jest.Mock).mockReturnValue({
        findUser: jest.fn().mockResolvedValue(USER),
        getAllUsers: jest.fn(),
        createUser: jest.fn(),
      });

      await cartController({
        cartRepository: mockCartRepository,
        userRepository: mockUserRepository,
        dishRepository: mockDishRepository,
        cartItemRepository: {} as Repository<CartItem>,
        userService: mockUserService as unknown as typeof userService,
      }).createCart(initMockReq, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.CREATED);
      expect(res.json).toHaveBeenCalledWith(CART);
    });

    it("should return an internal server error", async () => {
      (mockUserService as jest.Mock).mockReturnValue({
        findUser: jest
          .fn()
          .mockRejectedValue(new Error(GENERAL_MESSAGES.INTERNAL_SERVER_ERROR)),
        getAllUsers: jest.fn(),
        createUser: jest.fn(),
      });

      await cartController({
        cartRepository: mockCartRepository,
        userRepository: mockUserRepository,
        dishRepository: mockDishRepository,
        cartItemRepository: {} as Repository<CartItem>,
        userService: mockUserService as unknown as typeof userService,
      }).createCart(initMockReq, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        new Error(GENERAL_MESSAGES.INTERNAL_SERVER_ERROR),
      );
    });
  });

  describe("getCartDetail", () => {
    const initMockReq = {
      user: {
        email: "usertest@gmail.com",
      },
    } as unknown as Request & IUserRequest;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    const mockNext = jest.fn();

    it("should return a status not found if cart is not found", async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await cartController({
        cartRepository: mockCartRepository,
        userRepository: mockUserRepository,
        dishRepository: mockDishRepository,
        cartItemRepository: {} as Repository<CartItem>,
      }).getCartDetail(initMockReq, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({
        message: CART_MESSAGES.CART_NOT_FOUND,
      });
    });

    it("should return the cart details", async () => {
      mockQueryBuilder.getOne.mockResolvedValue(CART);

      await cartController({
        cartRepository: mockCartRepository,
        userRepository: mockUserRepository,
        dishRepository: mockDishRepository,
        cartItemRepository: {} as Repository<CartItem>,
      }).getCartDetail(initMockReq, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.OK);
      expect(res.json).toHaveBeenCalledWith(CART);
    });

    it("should return an internal server error", async () => {
      mockQueryBuilder.getOne.mockRejectedValue(
        new Error(GENERAL_MESSAGES.INTERNAL_SERVER_ERROR),
      );

      await cartController({
        cartRepository: mockCartRepository,
        userRepository: mockUserRepository,
        dishRepository: mockDishRepository,
        cartItemRepository: {} as Repository<CartItem>,
      }).getCartDetail(initMockReq, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        new Error(GENERAL_MESSAGES.INTERNAL_SERVER_ERROR),
      );
    });
  });

  describe("addItemToCart", () => {
    const initMockReq = {
      body: {
        dishId: "1",
        cartId: "1",
        quantity: 1,
      },
    } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    const mockNext = jest.fn();

    it("should return a status not found if cart is not found", async () => {
      mockCartRepository.findOne.mockResolvedValue(null);

      await cartController({
        cartRepository: mockCartRepository,
        userRepository: mockUserRepository,
        dishRepository: mockDishRepository,
        cartItemRepository: mockCartItemRepository,
      }).addItemToCart(initMockReq, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({
        message: CART_MESSAGES.CART_OR_DISH_NOT_FOUND,
      });
    });

    it("should update quantity of the existing item to the cart", async () => {
      mockDishRepository.findOne.mockResolvedValue(DISH as unknown as Dish);
      mockCartRepository.findOne.mockResolvedValue(CART as unknown as Cart);

      await cartController({
        cartRepository: mockCartRepository,
        userRepository: mockUserRepository,
        dishRepository: mockDishRepository,
        cartItemRepository: mockCartItemRepository,
      }).addItemToCart(initMockReq, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.OK);
      expect(res.json).toHaveBeenCalledWith(CART_ITEM);
    });

    it("should add the item to the cart", async () => {
      const initMockReq = {
        params: { cartId: "1" },
        body: {
          dishId: "2",
          quantity: 1,
        },
      } as unknown as Request;
      mockCartRepository.findOne.mockResolvedValue(CART as unknown as Cart);
      mockDishRepository.findOne.mockResolvedValue({
        ...DISH,
        id: "2",
      } as unknown as Dish);
      mockCartItemRepository.create.mockImplementation(
        () => CART_ITEM as unknown as CartItem,
      );
      mockCartItemRepository.save.mockResolvedValue(
        CART_ITEM as unknown as CartItem,
      );

      await cartController({
        cartRepository: mockCartRepository,
        userRepository: mockUserRepository,
        dishRepository: mockDishRepository,
        cartItemRepository: mockCartItemRepository,
      }).addItemToCart(initMockReq, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.CREATED);
      expect(res.json).toHaveBeenCalledWith(CART_ITEM);
    });

    it("should return an internal server error", async () => {
      mockCartRepository.findOne.mockRejectedValue(
        new Error(GENERAL_MESSAGES.INTERNAL_SERVER_ERROR),
      );

      await cartController({
        cartRepository: mockCartRepository,
        userRepository: mockUserRepository,
        dishRepository: mockDishRepository,
        cartItemRepository: mockCartItemRepository,
      }).addItemToCart(initMockReq, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        new Error(GENERAL_MESSAGES.INTERNAL_SERVER_ERROR),
      );
    });
  });

  describe("updateItemInCart", () => {
    const initMockReq = {
      params: { itemId: "1234" },
      body: { cartId: "1", quantity: 1 },
    } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    const mockNext = jest.fn();

    it("should return a status not found if cart is not found", async () => {
      mockCartRepository.findOne.mockResolvedValue(null);

      await cartController({
        cartRepository: mockCartRepository,
        userRepository: mockUserRepository,
        dishRepository: mockDishRepository,
        cartItemRepository: mockCartItemRepository,
      }).updateItemInCart(initMockReq, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({
        message: CART_MESSAGES.CART_NOT_FOUND,
      });
    });

    it("should return a status not found if cart item is not found", async () => {
      mockCartRepository.findOne.mockResolvedValue(CART as unknown as Cart);
      mockCartItemRepository.findOne.mockResolvedValue(null);

      await cartController({
        cartRepository: mockCartRepository,
        userRepository: mockUserRepository,
        dishRepository: mockDishRepository,
        cartItemRepository: mockCartItemRepository,
      }).updateItemInCart(initMockReq, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({
        message: CART_MESSAGES.CART_ITEM_NOT_FOUND,
      });
    });

    it("should update quantity of the existing item to the cart", async () => {
      mockCartRepository.findOne.mockResolvedValue(CART as unknown as Cart);
      mockCartItemRepository.findOne.mockResolvedValue(
        CART_ITEM as unknown as CartItem,
      );
      mockCartItemRepository.save.mockResolvedValue(
        CART_ITEM as unknown as CartItem,
      );

      await cartController({
        cartRepository: mockCartRepository,
        userRepository: mockUserRepository,
        dishRepository: mockDishRepository,
        cartItemRepository: mockCartItemRepository,
      }).updateItemInCart(initMockReq, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.OK);
      expect(res.json).toHaveBeenCalledWith(CART_ITEM);
    });

    it("should return an internal server error", async () => {
      mockCartRepository.findOne.mockResolvedValue(CART as unknown as Cart);
      mockCartItemRepository.findOne.mockRejectedValue(
        new Error(GENERAL_MESSAGES.INTERNAL_SERVER_ERROR),
      );

      await cartController({
        cartRepository: mockCartRepository,
        userRepository: mockUserRepository,
        dishRepository: mockDishRepository,
        cartItemRepository: mockCartItemRepository,
      }).updateItemInCart(initMockReq, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        new Error(GENERAL_MESSAGES.INTERNAL_SERVER_ERROR),
      );
    });
  });

  describe("removeItemFromCart", () => {
    const initMockReq = {
      params: { dishId: "1" },
      body: {
        cartId: "1",
      },
    } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    const mockNext = jest.fn();

    it("should return a status not found if cart is not found", async () => {
      mockCartRepository.findOne.mockResolvedValue(null);

      await cartController({
        cartRepository: mockCartRepository,
        userRepository: mockUserRepository,
        dishRepository: mockDishRepository,
        cartItemRepository: mockCartItemRepository,
      }).removeItemFromCart(initMockReq, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({
        message: CART_MESSAGES.CART_NOT_FOUND,
      });
    });
    it("should return a status not found if cart item is not found", async () => {
      mockCartRepository.findOne.mockResolvedValue(CART as unknown as Cart);
      mockCartItemRepository.findOne.mockResolvedValue(null);

      await cartController({
        cartRepository: mockCartRepository,
        userRepository: mockUserRepository,
        dishRepository: mockDishRepository,
        cartItemRepository: mockCartItemRepository,
      }).removeItemFromCart(initMockReq, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({
        message: CART_MESSAGES.CART_ITEM_NOT_FOUND,
      });
    });

    it("should return a status not found if cart item remove failed", async () => {
      mockCartItemRepository.findOne.mockResolvedValue(
        CART_ITEM as unknown as CartItem,
      );
      mockCartItemRepository.remove.mockResolvedValue(null);

      await cartController({
        cartRepository: mockCartRepository,
        userRepository: mockUserRepository,
        dishRepository: mockDishRepository,
        cartItemRepository: mockCartItemRepository,
      }).removeItemFromCart(initMockReq, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({
        message: CART_MESSAGES.CART_ITEM_NOT_FOUND,
      });
    });

    it("should remove the item from the cart", async () => {
      mockCartItemRepository.findOne.mockResolvedValue(
        CART_ITEM as unknown as CartItem,
      );
      mockCartItemRepository.remove.mockResolvedValue(
        CART_ITEM as unknown as CartItem,
      );

      await cartController({
        cartRepository: mockCartRepository,
        userRepository: mockUserRepository,
        dishRepository: mockDishRepository,
        cartItemRepository: mockCartItemRepository,
      }).removeItemFromCart(initMockReq, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.OK);
      expect(res.json).toHaveBeenCalledWith({
        message: CART_MESSAGES.CART_ITEM_REMOVED,
      });
    });

    it("should return an internal server error", async () => {
      mockCartItemRepository.findOne.mockRejectedValue(
        new Error(GENERAL_MESSAGES.INTERNAL_SERVER_ERROR),
      );

      await cartController({
        cartRepository: mockCartRepository,
        userRepository: mockUserRepository,
        dishRepository: mockDishRepository,
        cartItemRepository: mockCartItemRepository,
      }).removeItemFromCart(initMockReq, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        new Error(GENERAL_MESSAGES.INTERNAL_SERVER_ERROR),
      );
    });
  });

  describe("checkoutCart", () => {
    const initMockReq = {
      body: {
        userId: USER.id,
      },
    } as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;
    const mockNext = jest.fn();

    it("should return a status not found if cart is not found", async () => {
      mockCartRepository.findOne.mockResolvedValue(null);

      await cartController({
        cartRepository: mockCartRepository,
        userRepository: mockUserRepository,
        dishRepository: mockDishRepository,
        cartItemRepository: {} as Repository<CartItem>,
      }).checkoutCart(initMockReq, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({
        message: CART_MESSAGES.CART_NOT_FOUND,
      });
    });

    it("should checkout the cart successfully", async () => {
      mockCartRepository.findOne.mockResolvedValue(CART as unknown as Cart);
      mockCartRepository.save.mockResolvedValue(CART as unknown as Cart);

      await cartController({
        cartRepository: mockCartRepository,
        userRepository: mockUserRepository,
        dishRepository: mockDishRepository,
        cartItemRepository: {} as Repository<CartItem>,
      }).checkoutCart(initMockReq, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.OK);
      expect(res.json).toHaveBeenCalledWith({
        message: CART_MESSAGES.CHECKOUT_SUCCESS,
        cart: CART,
      });
    });

    it("should return an internal server error", async () => {
      mockCartRepository.findOne.mockRejectedValue(
        new Error(GENERAL_MESSAGES.INTERNAL_SERVER_ERROR),
      );

      await cartController({
        cartRepository: mockCartRepository,
        userRepository: mockUserRepository,
        dishRepository: mockDishRepository,
        cartItemRepository: {} as Repository<CartItem>,
      }).checkoutCart(initMockReq, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        new Error(GENERAL_MESSAGES.INTERNAL_SERVER_ERROR),
      );
    });
  });
});
