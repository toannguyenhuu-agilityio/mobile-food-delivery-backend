import { Request, Response, NextFunction } from "express";
import { errorHandler } from "../../middleware/errorHandling.middleware";
import { STATUS_CODES } from "../../constants/httpStatusCodes";
import { AUTH_MESSAGES, GENERAL_MESSAGES } from "../../constants/messages";

describe("Error Handler Middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {}; // Empty request since we don’t use it here
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      headersSent: false, // Ensure headers are not sent
    };
    mockNext = jest.fn();
  });

  it("should return 500 Internal Server Error for generic errors", () => {
    const error = { name: "Error", message: "" };

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(
      STATUS_CODES.INTERNAL_SERVER_ERROR,
    );
    expect(mockRes.json).toHaveBeenCalledWith({
      message: GENERAL_MESSAGES.INTERNAL_SERVER_ERROR,
    });
  });

  it("should return 400 Bad Request for ValidationError", () => {
    const error = { name: "ValidationError", details: "Invalid input data" };

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(STATUS_CODES.BAD_REQUEST);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: "Invalid input data",
    });
  });

  it("should return 401 Unauthorized for UnauthorizedError", () => {
    const error = { name: "UnauthorizedError" };

    errorHandler(error, mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(STATUS_CODES.UNAUTHORIZED);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: AUTH_MESSAGES.INVALID_TOKEN,
    });
  });
});
