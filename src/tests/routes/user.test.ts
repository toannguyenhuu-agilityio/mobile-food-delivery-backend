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
    getUser: jest.fn((req, res) =>
      res.status(200).json({ message: "Get all users" }),
    ),
    getUserById: jest.fn((req, res) =>
      res.status(200).json({ message: "Get user by ID" }),
    ),
    createUser: jest.fn((req, res) =>
      res.status(201).json({ message: "User created" }),
    ),
    updateUser: jest.fn((req, res) =>
      res.status(200).json({ message: "User updated" }),
    ),
    deleteUser: jest.fn((req, res) =>
      res.status(200).json({ message: "User deleted" }),
    ),
  })),
}));

describe("User Routes", () => {
  let app: express.Application;
  beforeEach(() => {
    app = express();
    userRoutes({ app, repository: mockRepository });
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
    const response = await request(app).post("/users").send({
      name: "John Doe",
      email: "john@example.com",
      password: "password",
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ message: "User created" });
  });

  it("should update a user", async () => {
    const response = await request(app).put("/users/1").send({
      name: "John Doe",
      email: "john@example.com",
      password: "password",
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "User updated" });
  });

  it("should delete a user", async () => {
    const response = await request(app).delete("/users/1");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "User deleted" });
  });
});
