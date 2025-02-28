import { AuthenticationClient } from "auth0";
import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { validateToken } from "../../middleware/auth0.middleware";

// Utitls
import { getKey } from "../../utils/auth";

// Constants
import { STATUS_CODES } from "../../constants/httpStatusCodes";
import { AUTH_MESSAGES } from "../../constants/messages";

jest.mock("jsonwebtoken", () => ({
  decode: jest.fn(),
  verify: jest.fn(),
}));

jest.mock("../../utils/auth", () => ({
  getKey: jest.fn(),
}));

jest.mock("auth0", () => ({
  AuthenticationClient: jest.fn(),
}));

describe("Auth0 Middleware", () => {
  describe("AuthClient initialization", () => {
    process.env.AUTH0_DOMAIN = "test-domain";
    process.env.AUTH0_CLIENT_ID = "test-client-id";
    process.env.AUTH0_CLIENT_SECRET = "test-client-secret";

    const authClient = new AuthenticationClient({
      domain: process.env.AUTH0_DOMAIN || "",
      clientId: process.env.AUTH0_CLIENT_ID || "",
      clientSecret: process.env.AUTH0_CLIENT_SECRET || "",
    });

    it("should be initialized with the correct domain, client ID, and client secret", () => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("../../middleware/auth0.middleware");

      expect(authClient).toBeInstanceOf(AuthenticationClient);
      expect(AuthenticationClient).toHaveBeenCalledWith({
        domain: "test-domain",
        clientId: "test-client-id",
        clientSecret: "test-client-secret",
      });
    });
  });

  describe("validateToken", () => {
    let req: any;
    let res: Response;
    let next: NextFunction;

    beforeEach(() => {
      req = {
        headers: {
          authorization: "Bearer test_token",
        },
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;
      next = jest.fn();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should return 401 if no token is provided", async () => {
      req = {
        headers: { authorization: "" },
      };

      await validateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.UNAUTHORIZED);
      expect(res.json).toHaveBeenCalledWith({
        message: AUTH_MESSAGES.UNAUTHORIZED_ACCESS,
      });
    });

    it("should return status 401 if token is invalid (no kid)", async () => {
      (jwt.decode as jest.Mock).mockReturnValueOnce({ header: {} });

      await validateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.UNAUTHORIZED);
      expect(res.json).toHaveBeenCalledWith({
        error: AUTH_MESSAGES.INVALID_TOKEN,
      });
    });

    it("should return status 401 if token verification fails", async () => {
      (jwt.decode as jest.Mock).mockReturnValueOnce({
        header: { kid: "testKid" },
      });

      (getKey as jest.Mock).mockResolvedValueOnce("signingKey");

      (jwt.verify as jest.Mock).mockImplementationOnce(() => {
        throw new Error("Invalid token");
      });

      await validateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(STATUS_CODES.UNAUTHORIZED);
      expect(res.json).toHaveBeenCalledWith({
        error: AUTH_MESSAGES.TOKEN_EXPIRED,
      });
    });

    it("should call next() if token is valid", async () => {
      const decodedToken = { sub: "user123" };

      (jwt.decode as jest.Mock).mockReturnValueOnce({
        header: { kid: "testKid" },
      });

      (getKey as jest.Mock).mockResolvedValueOnce("signingKey");

      (jwt.verify as jest.Mock).mockResolvedValueOnce(decodedToken);

      await validateToken(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).resolves.toEqual(decodedToken);
    });
  });
});
