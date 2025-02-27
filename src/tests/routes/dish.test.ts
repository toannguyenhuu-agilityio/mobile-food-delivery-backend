import request from "supertest";
import express from "express";
import { Repository } from "typeorm";

// Entities
import { Dish } from "../../entities/dish.ts";
import { User } from "../../entities/user.ts";

// Controllers
import { dishController } from "../../controllers/dish.ts";

// Mocks
import { DISH } from "../../__mocks__/dish.ts";

// Constants
import { STATUS_CODES } from "../../constants/httpStatusCodes.ts";
import { dishRoutes } from "../../routes/dish.ts";

const mockDishRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
} as unknown as Repository<Dish>;

const mockUserRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
} as unknown as Repository<User>;

jest.mock("../../controllers/dish.ts", () => ({
  dishController: jest.fn(),
}));

jest.mock("../../middleware/auth0.middleware", () => ({
  validateToken: jest.fn((req, res, next) => next()),
}));

describe("Dish Routes", () => {
  let app: express.Application;
  const mockCreateDish = jest.fn();
  const mockGetDishes = jest.fn();
  const mockGetDishByID = jest.fn();
  const mockDeleteDishByID = jest.fn();
  const mockUpdateDishByID = jest.fn();

  beforeEach(() => {
    app = express();

    (dishController as jest.Mock).mockReturnValue({
      createDish: mockCreateDish,
      getDishes: mockGetDishes,
      getDishByID: mockGetDishByID,
      updateDishByID: mockUpdateDishByID,
      deleteDishByID: mockDeleteDishByID,
    });

    dishRoutes({
      app,
      userRepository: mockUserRepository,
      dishRepository: mockDishRepository,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should create a new dish and return a success response with HTTP status 201", async () => {
    mockCreateDish.mockImplementation((req, res) => {
      res.status(STATUS_CODES.CREATED).json({ message: "Dish created" });
    });

    const response = await request(app).post("/dish").send(DISH);

    expect(response.status).toBe(STATUS_CODES.CREATED);
    expect(response.body).toEqual({ message: "Dish created" });
    expect(mockCreateDish).toHaveBeenCalledTimes(1);
  });

  it("should retrieve all dishes and return them in the response", async () => {
    mockGetDishes.mockImplementation((req, res) => {
      res.status(STATUS_CODES.OK).json({ message: "Get all dishes" });
    });

    const response = await request(app).get("/dishes");

    expect(response.status).toBe(STATUS_CODES.OK);
    expect(response.body).toEqual({ message: "Get all dishes" });
    expect(mockGetDishes).toHaveBeenCalledTimes(1);
  });

  it("should retrieve a dish by its ID and return the dish details", async () => {
    mockGetDishByID.mockImplementation((req, res) => {
      res.status(STATUS_CODES.OK).json({ message: "Get dish by ID" });
    });

    const response = await request(app).get("/dish/1");

    expect(response.status).toBe(STATUS_CODES.OK);
    expect(response.body).toEqual({ message: "Get dish by ID" });
    expect(mockGetDishByID).toHaveBeenCalledTimes(1);
  });

  it("should update a dish by ID and return the updated dish details", async () => {
    mockUpdateDishByID.mockImplementation((req, res) => {
      res.status(STATUS_CODES.OK).json({ message: "Dish updated" });
    });

    const response = await request(app).put("/dish/1").send(DISH);

    expect(response.status).toBe(STATUS_CODES.OK);
    expect(response.body).toEqual({ message: "Dish updated" });
    expect(mockUpdateDishByID).toHaveBeenCalledTimes(1);
  });

  it("should delete a dish by ID and return a success message", async () => {
    mockDeleteDishByID.mockImplementation((req, res) => {
      res.status(STATUS_CODES.OK).json({ message: "Dish deleted" });
    });

    const response = await request(app).delete("/dish/1");

    expect(response.status).toBe(STATUS_CODES.OK);
    expect(response.body).toEqual({ message: "Dish deleted" });
    expect(mockDeleteDishByID).toHaveBeenCalledTimes(1);
  });
});
