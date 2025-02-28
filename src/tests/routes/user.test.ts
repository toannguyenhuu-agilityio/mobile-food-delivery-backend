import request from "supertest";
import express from "express";

import { userRoutes } from "../../routes/user.ts";

// Mock repository
const mockRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};

// Mock controller
jest.mock("../../controllers/user", () => ({
  userController: jest.fn().mockImplementation(() => ({
    getUsers: jest.fn((req, res) =>
      res.status(200).json({ message: "Get all users" }),
    ),
    getUserById: jest.fn((req, res) =>
      res.status(200).json({ message: "Get user by ID" }),
    ),
    signUp: jest.fn((req, res) =>
      res.status(201).json({ message: "User created" }),
    ),
    signIn: jest.fn((req, res) =>
      res.status(200).json({ message: "User signed in" }),
    ),
  })),
}));

jest.mock("../../middleware/auth0.middleware", () => ({
  validateToken: jest.fn((req, res, next) => next()),
  authClient: jest.fn(),
}));

describe("User Routes", () => {
  let app: express.Application;
  beforeEach(() => {
    app = express();
    userRoutes({ app, repository: mockRepository, authClient: jest.fn() });
  });

  it("should get all users", async () => {
    const response = await request(app).get("/users");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "Get all users" });
  });

  it("should get user by ID", async () => {
    const response = await request(app).get("/users/1");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "Get user by ID" });
  });

  it("should create a new user", async () => {
    const response = await request(app).post("/auth/signup").send({
      name: "User Test",
      email: "usertest@example.com",
      password: "password",
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ message: "User created" });
  });

  it("should sign in a user", async () => {
    const response = await request(app).post("/auth/signin").send({
      email: "usertest@example.com",
      password: "password",
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "User signed in" });
  });
});
