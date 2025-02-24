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

const mockCartRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  create: jest.fn(),
} as unknown as jest.Mocked<Repository<Cart>>;

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

const mockCartItemRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  create: jest.fn(),
} as unknown as jest.Mocked<Repository<CartItem>>;

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

    it("should return a status not found if user is not found", async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await cartController({
        cartRepository: mockCartRepository,
        userRepository: mockUserRepository,
        dishRepository: mockDishRepository,
        cartItemRepository: {} as Repository<CartItem>,
      }).createCart(initMockReq, res);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({
        message: USER_MESSAGES.USER_NOT_FOUND,
      });
    });

    it("should create a new cart", async () => {
      mockUserRepository.findOne.mockResolvedValue(USER as unknown as User);
      mockCartRepository.create.mockImplementation(
        () => CART as unknown as Cart,
      );

      await cartController({
        cartRepository: mockCartRepository,
        userRepository: mockUserRepository,
        dishRepository: mockDishRepository,
        cartItemRepository: {} as Repository<CartItem>,
      }).createCart(initMockReq, res);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.CREATED);
      expect(res.json).toHaveBeenCalledWith(CART);
    });

    it("should return an internal server error", async () => {
      mockUserRepository.findOne.mockRejectedValue(
        new Error(GENERAL_MESSAGES.INTERNAL_SERVER_ERROR),
      );

      await cartController({
        cartRepository: mockCartRepository,
        userRepository: mockUserRepository,
        dishRepository: mockDishRepository,
        cartItemRepository: {} as Repository<CartItem>,
      }).createCart(initMockReq, res);

      expect(res.status).toHaveBeenCalledWith(
        STATUS_CODES.INTERNAL_SERVER_ERROR,
      );
      expect(res.json).toHaveBeenCalledWith({
        message: GENERAL_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    });
  });

  describe("getCartDetail", () => {
    const initMockReq = {
      params: { id: "1" },
    } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    it("should return a status not found if cart is not found", async () => {
      mockCartRepository.findOne.mockResolvedValue(null);

      await cartController({
        cartRepository: mockCartRepository,
        userRepository: mockUserRepository,
        dishRepository: mockDishRepository,
        cartItemRepository: {} as Repository<CartItem>,
      }).getCartDetail(initMockReq, res);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({
        message: CART_MESSAGES.CART_NOT_FOUND,
      });
    });

    it("should return the cart details", async () => {
      mockCartRepository.findOne.mockResolvedValue(CART as unknown as Cart);

      await cartController({
        cartRepository: mockCartRepository,
        userRepository: mockUserRepository,
        dishRepository: mockDishRepository,
        cartItemRepository: {} as Repository<CartItem>,
      }).getCartDetail(initMockReq, res);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.OK);
      expect(res.json).toHaveBeenCalledWith(CART);
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
      }).getCartDetail(initMockReq, res);

      expect(res.status).toHaveBeenCalledWith(
        STATUS_CODES.INTERNAL_SERVER_ERROR,
      );
      expect(res.json).toHaveBeenCalledWith({
        message: GENERAL_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    });
  });

  describe("removeItemFromCart", () => {
    const initMockReq = {
      params: { cartId: "1", dishId: "1" },
    } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    it("should return a status not found if cart is not found", async () => {
      mockCartItemRepository.findOne.mockResolvedValue(null);

      await cartController({
        cartRepository: mockCartRepository,
        userRepository: mockUserRepository,
        dishRepository: mockDishRepository,
        cartItemRepository: mockCartItemRepository,
      }).removeItemFromCart(initMockReq, res);

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
      }).removeItemFromCart(initMockReq, res);

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
      }).removeItemFromCart(initMockReq, res);

      expect(res.status).toHaveBeenCalledWith(
        STATUS_CODES.INTERNAL_SERVER_ERROR,
      );
      expect(res.json).toHaveBeenCalledWith({
        message: GENERAL_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    });
  });

  describe("addItemToCart", () => {
    const initMockReq = {
      params: { cartId: "1" },
      body: {
        dishId: "1",
        quantity: 1,
      },
    } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    it("should return a status not found if cart is not found", async () => {
      mockCartRepository.findOne.mockResolvedValue(null);

      await cartController({
        cartRepository: mockCartRepository,
        userRepository: mockUserRepository,
        dishRepository: mockDishRepository,
        cartItemRepository: mockCartItemRepository,
      }).addItemToCart(initMockReq, res);

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
      }).addItemToCart(initMockReq, res);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.OK);
      expect(res.json).toHaveBeenCalledWith(CART_ITEM);
    });

    it("should add the item to the cart", async () => {
      mockDishRepository.findOne.mockResolvedValue({
        ...DISH,
        id: "2",
      } as unknown as Dish);
      mockCartRepository.findOne.mockResolvedValue(CART as unknown as Cart);

      await cartController({
        cartRepository: mockCartRepository,
        userRepository: mockUserRepository,
        dishRepository: mockDishRepository,
        cartItemRepository: mockCartItemRepository,
      }).addItemToCart(initMockReq, res);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.OK);
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
      }).addItemToCart(initMockReq, res);

      expect(res.status).toHaveBeenCalledWith(
        STATUS_CODES.INTERNAL_SERVER_ERROR,
      );
      expect(res.json).toHaveBeenCalledWith({
        message: GENERAL_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    });
  });

  describe("updateItemInCart", () => {
    const initMockReq = {
      params: { cartId: "1", itemId: "1234" },
      body: {
        quantity: 1,
      },
    } as unknown as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as unknown as Response;

    it("should return a status not found if cart is not found", async () => {
      mockCartRepository.findOne.mockResolvedValue(null);

      await cartController({
        cartRepository: mockCartRepository,
        userRepository: mockUserRepository,
        dishRepository: mockDishRepository,
        cartItemRepository: mockCartItemRepository,
      }).updateItemInCart(initMockReq, res);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({
        message: CART_MESSAGES.CART_ITEM_NOT_FOUND,
      });
    });

    it("should update quantity of the existing item to the cart", async () => {
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
      }).updateItemInCart(initMockReq, res);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.OK);
      expect(res.json).toHaveBeenCalledWith(CART_ITEM);
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
      }).updateItemInCart(initMockReq, res);

      expect(res.status).toHaveBeenCalledWith(
        STATUS_CODES.INTERNAL_SERVER_ERROR,
      );
      expect(res.json).toHaveBeenCalledWith({
        message: GENERAL_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    });
  });
});
