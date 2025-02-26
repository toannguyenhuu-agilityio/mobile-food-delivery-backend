import request from "supertest";
import express from "express";
import { DataSource, Repository } from "typeorm";

// Routes
import { orderRoutes } from "../../routes/order.ts";

// Controllers
import { orderController } from "../../controllers/order.ts";

// Entities
import { Order } from "../../entities/order.ts";
import { OrderItem } from "../../entities/orderItem.ts";

// Mocks
import { ORDER } from "../../__mocks__/order.ts";

// Constants
import { STATUS_CODES } from "../../constants/httpStatusCodes.ts";
import { OrderStatus } from "../../types/order.ts";

const mockOrderRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
} as unknown as Repository<Order>;
const mockOrderItemRepository = {
  findOne: jest.fn(),
} as unknown as Repository<OrderItem>;

const mockDataSource = {
  getRepository: jest.fn(),
} as unknown as DataSource;

jest.mock("../../controllers/order", () => ({
  orderController: jest.fn(),
}));

describe("Order Routes", () => {
  let app: express.Application;
  const mockGetOrderById = jest.fn();
  const mockCreateOrder = jest.fn();
  const mockGetOrders = jest.fn();
  const mockUpdateOrderStatus = jest.fn();

  beforeEach(() => {
    app = express();

    (orderController as jest.Mock).mockReturnValue({
      createOrder: mockCreateOrder,
      getOrderById: mockGetOrderById,
      getOrders: mockGetOrders,
      updateOrderStatus: mockUpdateOrderStatus,
    });

    orderRoutes({
      app,
      dataSource: mockDataSource,
      orderRepository: mockOrderRepository,
      orderItemRepository: mockOrderItemRepository,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should create a new order and return a success response", async () => {
    mockCreateOrder.mockImplementation((req, res) => {
      res.status(STATUS_CODES.CREATED).json(ORDER);
    });

    const response = await request(app).post("/order").send(ORDER);

    expect(response.status).toBe(STATUS_CODES.CREATED);
    expect(response.body).toEqual(ORDER);
    expect(mockCreateOrder).toHaveBeenCalledTimes(1);
  });

  it("should get an order by id and return a success response", async () => {
    mockGetOrderById.mockImplementation((req, res) => {
      res.status(STATUS_CODES.OK).json(ORDER);
    });

    const response = await request(app).get("/order/1");

    expect(response.status).toBe(STATUS_CODES.OK);
    expect(response.body).toEqual(ORDER);
    expect(mockGetOrderById).toHaveBeenCalledTimes(1);
  });

  it("should get all orders and return a success response", async () => {
    mockGetOrders.mockImplementation((req, res) => {
      res.status(STATUS_CODES.OK).json([ORDER]);
    });

    const response = await request(app).get("/orders/1");

    expect(response.status).toBe(STATUS_CODES.OK);
    expect(response.body).toEqual([ORDER]);
    expect(mockGetOrders).toHaveBeenCalledTimes(1);
  });

  it("should update the status of an order and return a success response", async () => {
    mockUpdateOrderStatus.mockImplementation((req, res) => {
      res
        .status(STATUS_CODES.OK)
        .json({ ...ORDER, status: OrderStatus.Delivered });
    });

    const response = await request(app).put("/order/1");

    expect(response.status).toBe(STATUS_CODES.OK);
    expect(response.body).toEqual({
      ...ORDER,
      status: OrderStatus.Delivered,
    });
    expect(mockUpdateOrderStatus).toHaveBeenCalledTimes(1);
  });
});
