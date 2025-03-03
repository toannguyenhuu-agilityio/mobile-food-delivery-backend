import { Request, Response } from "express";
import { DataSource, Repository } from "typeorm";

// Entities
import { Order } from "../../entities/order.ts";
import { OrderItem } from "../../entities/orderItem.ts";

// Controllers
import { orderController } from "../../controllers/order.ts";

// Types
import { OrderStatus } from "../../types/order.ts";

// Constants
import {
  CART_MESSAGES,
  GENERAL_MESSAGES,
  ORDER_MESSAGES,
  USER_MESSAGES,
} from "../../constants/messages.ts";
import { STATUS_CODES } from "../../constants/httpStatusCodes.ts";

// Mocks

import { ORDER, ORDER_REQUEST } from "../../__mocks__/order.ts";
import { User } from "../../entities/user.ts";
import { Cart } from "../../entities/cart.ts";
import { CART } from "../../__mocks__/cart.ts";

const mockOrderRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  findAndCount: jest.fn(),
} as unknown as jest.Mocked<Repository<Order>>;

const mockOrderItemRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
} as unknown as jest.Mocked<Repository<OrderItem>>;

const mockDataSource = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  createQueryRunner: jest.fn(),
} as unknown as DataSource;

describe("Order Controller", () => {
  let req: Request;
  let res: Response;
  let queryRunnerMock: any;

  describe("createOrder", () => {
    beforeEach(() => {
      req = ORDER_REQUEST as unknown as Request;
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      queryRunnerMock = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          findOne: jest.fn(),
          save: jest.fn(),
        },
      };

      (mockDataSource.createQueryRunner as jest.Mock).mockReturnValue(
        queryRunnerMock,
      );
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should return a status not found if user is not found", async () => {
      queryRunnerMock.manager.findOne.mockResolvedValue(null);

      await orderController({
        dataSource: mockDataSource,
        orderRepository: mockOrderRepository,
        orderItemRepository: mockOrderItemRepository,
      }).createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({
        message: USER_MESSAGES.USER_NOT_FOUND,
      });
    });

    it("should return a status not found if cart is not found", async () => {
      // Mock `findOne` to return mock user and cart
      queryRunnerMock.manager.findOne.mockImplementationOnce((entity: any) =>
        entity === User ? { id: 1, name: "John Doe" } : null,
      );
      // Mock `findOne` to return mock cart
      queryRunnerMock.manager.findOne.mockImplementationOnce((entity: any) => {
        if (entity === Cart) return null;
      });

      await orderController({
        dataSource: mockDataSource,
        orderRepository: mockOrderRepository,
        orderItemRepository: mockOrderItemRepository,
      }).createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({
        message: CART_MESSAGES.CART_NOT_FOUND,
      });
    });

    it("should return a status created if order is created", async () => {
      const mockReq = ORDER_REQUEST as unknown as Request;

      mockOrderRepository.create.mockReturnValue(ORDER as unknown as Order);

      // Mock `findOne` to return mock user and cart
      queryRunnerMock.manager.findOne.mockImplementationOnce((entity: any) =>
        entity === User ? { id: 1, name: "John Doe" } : null,
      );

      queryRunnerMock.manager.findOne.mockImplementationOnce((entity: any) =>
        entity === Cart ? CART : null,
      );

      // Mock `save` method to simulate successful saving of entities
      queryRunnerMock.manager.save.mockImplementationOnce(
        (entity: any, data: any) =>
          entity === Order ? { id: 1, ...data } : null,
      );

      queryRunnerMock.manager.save.mockImplementationOnce(
        (entity: any, data: any) =>
          entity === OrderItem ? { id: 1, ...data } : null,
      );

      await orderController({
        dataSource: mockDataSource,
        orderRepository: mockOrderRepository,
        orderItemRepository: mockOrderItemRepository,
      }).createOrder(mockReq, res);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.CREATED);
      expect(res.json).toHaveBeenCalledWith(ORDER);
    });

    it("should return a status internal server error", async () => {
      queryRunnerMock.manager.findOne = jest
        .fn()
        .mockRejectedValue(new Error("Some error occurred"));

      await orderController({
        dataSource: mockDataSource,
        orderRepository: mockOrderRepository,
        orderItemRepository: mockOrderItemRepository,
      }).createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(
        STATUS_CODES.INTERNAL_SERVER_ERROR,
      );
      expect(res.json).toHaveBeenCalledWith({
        message: GENERAL_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    });
  });

  describe("getOrderById", () => {
    beforeEach(() => {
      req = ORDER_REQUEST as unknown as Request;
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;
    });
    it("should return a status not found if order is not found", async () => {
      mockOrderRepository.findOne.mockResolvedValue(null);

      await orderController({
        dataSource: mockDataSource,
        orderRepository: mockOrderRepository,
        orderItemRepository: mockOrderItemRepository,
      }).getOrderById(req, res);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({
        message: ORDER_MESSAGES.ORDER_NOT_FOUND,
      });
    });

    it("should return a status ok if order is found", async () => {
      mockOrderRepository.findOne.mockResolvedValue(ORDER as unknown as Order);

      await orderController({
        dataSource: mockDataSource,
        orderRepository: mockOrderRepository,
        orderItemRepository: mockOrderItemRepository,
      }).getOrderById(req, res);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.OK);
      expect(res.json).toHaveBeenCalledWith(ORDER);
    });

    it("should return a status internal server error", async () => {
      mockOrderRepository.findOne.mockRejectedValue(
        new Error(GENERAL_MESSAGES.INTERNAL_SERVER_ERROR),
      );

      await orderController({
        dataSource: mockDataSource,
        orderRepository: mockOrderRepository,
        orderItemRepository: mockOrderItemRepository,
      }).getOrderById(req, res);

      expect(res.status).toHaveBeenCalledWith(
        STATUS_CODES.INTERNAL_SERVER_ERROR,
      );
      expect(res.json).toHaveBeenCalledWith({
        message: GENERAL_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    });
  });

  describe("updateOrderStatus", () => {
    beforeEach(() => {
      req = ORDER_REQUEST as unknown as Request;
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;
    });

    it("should return a status not found if order is not found", async () => {
      mockOrderRepository.findOne.mockResolvedValue(null);

      await orderController({
        dataSource: mockDataSource,
        orderRepository: mockOrderRepository,
        orderItemRepository: mockOrderItemRepository,
      }).getOrderById(req, res);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({
        message: ORDER_MESSAGES.ORDER_NOT_FOUND,
      });
    });

    it("should return a status ok if order is updated successfully", async () => {
      mockOrderRepository.findOne.mockResolvedValue(ORDER as unknown as Order);
      mockOrderRepository.save.mockResolvedValue({
        ...ORDER,
        status: OrderStatus.Delivered,
      } as unknown as Order);

      await orderController({
        dataSource: mockDataSource,
        orderRepository: mockOrderRepository,
        orderItemRepository: mockOrderItemRepository,
      }).updateOrderStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.OK);
      expect(res.json).toHaveBeenCalledWith({
        message: ORDER_MESSAGES.ORDER_STATUS_UPDATED,
      });
    });

    it("should return a status internal server error", async () => {
      mockOrderRepository.findOne.mockRejectedValue(
        new Error(GENERAL_MESSAGES.INTERNAL_SERVER_ERROR),
      );

      await orderController({
        dataSource: mockDataSource,
        orderRepository: mockOrderRepository,
        orderItemRepository: mockOrderItemRepository,
      }).updateOrderStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(
        STATUS_CODES.INTERNAL_SERVER_ERROR,
      );
      expect(res.json).toHaveBeenCalledWith({
        message: GENERAL_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    });
  });

  describe("getOrders", () => {
    beforeEach(() => {
      req = ORDER_REQUEST as unknown as Request;
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;
    });

    it("should return a status bad request if order status is invalid   ", async () => {
      req = { ...req, query: { status: "invalid" } } as unknown as Request;

      await orderController({
        dataSource: mockDataSource,
        orderRepository: mockOrderRepository,
        orderItemRepository: mockOrderItemRepository,
      }).getOrders(req, res);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({
        message: ORDER_MESSAGES.INVALID_ORDER_STATUS,
      });
    });

    it("should return a status bad request if page and limit are invalid", async () => {
      req = {
        ...req,
        query: {
          status: OrderStatus.Pending,
          page: -1,
          limit: -1,
        },
      } as unknown as Request;

      await orderController({
        dataSource: mockDataSource,
        orderRepository: mockOrderRepository,
        orderItemRepository: mockOrderItemRepository,
      }).getOrders(req, res);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({
        message: ORDER_MESSAGES.INVALID_PAGE_AND_LIMIT,
      });
    });

    it("should return a status not found if no orders are found", async () => {
      mockOrderRepository.findAndCount.mockResolvedValue([[], 0]);

      await orderController({
        dataSource: mockDataSource,
        orderRepository: mockOrderRepository,
        orderItemRepository: mockOrderItemRepository,
      }).getOrders(req, res);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({
        message: ORDER_MESSAGES.ORDER_NOT_FOUND,
      });
    });

    it("should return a status ok if orders are found", async () => {
      mockOrderRepository.findAndCount.mockResolvedValue([
        [ORDER as unknown as Order],
        1,
      ]);

      await orderController({
        dataSource: mockDataSource,
        orderRepository: mockOrderRepository,
        orderItemRepository: mockOrderItemRepository,
      }).getOrders(req, res);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.OK);
      expect(res.json).toHaveBeenCalledWith({
        data: [ORDER],
        pagination: {
          page: 1,
          limit: 10,
          totalItems: 1,
          totalPages: 1,
        },
      });
    });

    it("should return a status internal server error", async () => {
      mockOrderRepository.findAndCount.mockRejectedValue(
        new Error("Internal server error"),
      );

      await orderController({
        dataSource: mockDataSource,
        orderRepository: mockOrderRepository,
        orderItemRepository: mockOrderItemRepository,
      }).getOrders(req, res);

      expect(res.status).toHaveBeenCalledWith(
        STATUS_CODES.INTERNAL_SERVER_ERROR,
      );
      expect(res.json).toHaveBeenCalledWith({
        message: GENERAL_MESSAGES.INTERNAL_SERVER_ERROR,
      });
    });
  });
});
