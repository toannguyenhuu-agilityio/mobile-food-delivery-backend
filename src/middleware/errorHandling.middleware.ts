import { NextFunction, Request, Response } from "express";
import { STATUS_CODES } from "../constants/httpStatusCodes.ts";
import { AUTH_MESSAGES, GENERAL_MESSAGES } from "../constants/messages.ts";

const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let statusCode = err.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;
  let message = err.message || GENERAL_MESSAGES.INTERNAL_SERVER_ERROR;

  if (err.name === "ValidationError") {
    statusCode = STATUS_CODES.BAD_REQUEST;
    message = err.details || GENERAL_MESSAGES.MISSING_REQUIRED_FIELDS;
  }

  if (err.name === "UnauthorizedError") {
    statusCode = STATUS_CODES.UNAUTHORIZED;
    message = AUTH_MESSAGES.INVALID_TOKEN;
  }

  res.status(statusCode).json({ message });
};

export { errorHandler };
