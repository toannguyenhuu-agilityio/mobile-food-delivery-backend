import request from "supertest";
import express from "express";
import { Repository } from "typeorm";

// Routes
import { cartRoutes } from "../../routes/cart.ts";

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

// Constants
import { STATUS_CODES } from "../../constants/httpStatusCodes.ts";
import { CART_MESSAGES } from "../../constants/messages.ts";

const mockCartRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
} as unknown as Repository<Cart>;

const mockUserRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
} as unknown as Repository<User>;

const mockCartItemRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
} as unknown as Repository<CartItem>;

const mockDishRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
} as unknown as Repository<Dish>;

jest.mock("../../controllers/cart", () => ({
  cartController: jest.fn(),
}));

jest.mock("../../middleware/auth0.middleware", () => ({
  validateToken: jest.fn((req, res, next) => next()),
}));

describe("Cart Routes", () => {
  let app: express.Application;
  const mockCreateCart = jest.fn();
  const mockGetCartDetail = jest.fn();
  const mockUpdateItemInCart = jest.fn();
  const mockRemoveItemFromCart = jest.fn();
  const mockAddItemToCart = jest.fn();
  const mockCheckoutCart = jest.fn();

  beforeEach(() => {
    app = express();

    (cartController as jest.Mock).mockReturnValue({
      createCart: mockCreateCart,
      getCartDetail: mockGetCartDetail,
      addItemToCart: mockAddItemToCart,
      updateItemInCart: mockUpdateItemInCart,
      removeItemFromCart: mockRemoveItemFromCart,
      checkoutCart: mockCheckoutCart,
    });

    cartRoutes({
      app,
      userRepository: mockUserRepository,
      cartRepository: mockCartRepository,
      dishRepository: mockDishRepository,
      cartItemRepository: mockCartItemRepository,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should create a new cart and return a success response with HTTP status 201", async () => {
    mockCreateCart.mockImplementation((req, res) => {
      res
        .status(STATUS_CODES.CREATED)
        .json({ message: CART_MESSAGES.CART_CREATED });
    });

    const response = await request(app).post("/cart").send(CART);

    expect(response.status).toBe(STATUS_CODES.CREATED);
    expect(response.body).toEqual({ message: CART_MESSAGES.CART_CREATED });
    expect(mockCreateCart).toHaveBeenCalledTimes(1);
  });

  it("should get cart details and return a success response with HTTP status 200", async () => {
    mockGetCartDetail.mockImplementation((req, res) => {
      res.status(STATUS_CODES.OK).json(CART);
    });

    const response = await request(app).get(`/cart/${USER.id}`);

    expect(response.status).toBe(STATUS_CODES.OK);
    expect(response.body).toEqual(CART);
    expect(mockGetCartDetail).toHaveBeenCalledTimes(1);
  });

  it("should add an item to the cart and return a success response with HTTP status 201", async () => {
    mockAddItemToCart.mockImplementation((req, res) => {
      res.status(STATUS_CODES.CREATED).json(CART_ITEM);
    });

    const response = await request(app).post("/cart/1/item").send(CART_ITEM);

    expect(response.status).toBe(STATUS_CODES.CREATED);
    expect(response.body).toEqual(CART_ITEM);
    expect(mockAddItemToCart).toHaveBeenCalledTimes(1);
  });

  it("should update an item in the cart and return the updated cart", async () => {
    mockUpdateItemInCart.mockImplementation((req, res) => {
      res.status(STATUS_CODES.OK).json(CART_ITEM);
    });

    const response = await request(app).put("/cart/1/item/1").send(CART_ITEM);

    expect(response.status).toBe(STATUS_CODES.OK);
    expect(response.body).toEqual(CART_ITEM);
    expect(mockUpdateItemInCart).toHaveBeenCalledTimes(1);
  });

  it("should remove an item from the cart and return a success message", async () => {
    mockRemoveItemFromCart.mockImplementation((req, res) => {
      res.status(STATUS_CODES.OK).json({ message: "Item removed from cart" });
    });

    const response = await request(app).delete("/cart/1/item/1");

    expect(response.status).toBe(STATUS_CODES.OK);
    expect(response.body).toEqual({ message: "Item removed from cart" });
    expect(mockRemoveItemFromCart).toHaveBeenCalledTimes(1);
  });

  it("should checkout the cart and return a success message", async () => {
    mockCheckoutCart.mockImplementation((req, res) => {
      res.status(STATUS_CODES.OK).json({ message: "Cart checked out" });
    });

    const response = await request(app).post("/cart/checkout");

    expect(response.status).toBe(STATUS_CODES.OK);
    expect(response.body).toEqual({ message: "Cart checked out" });
    expect(mockCheckoutCart).toHaveBeenCalledTimes(1);
  });
});
