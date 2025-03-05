import { Response, NextFunction } from "express";
import { AuthenticationClient } from "auth0";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

// Constants
import { STATUS_CODES } from "../constants/httpStatusCodes";

// Utils
import { getKey } from "../utils/auth.ts";
import { AUTH_MESSAGES } from "../constants/messages.ts";

dotenv.config();

const authClient = new AuthenticationClient({
  domain: process.env.AUTH0_DOMAIN || "",
  clientId: process.env.AUTH0_CLIENT_ID || "",
  clientSecret: process.env.AUTH0_CLIENT_SECRET || "",
});

const validateToken = async (req: any, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res
      .status(STATUS_CODES.UNAUTHORIZED)
      .json({ message: AUTH_MESSAGES.UNAUTHORIZED_ACCESS });
  }

  try {
    // Decode the JWT header to get the kid (key ID)
    const decodedHeader = jwt.decode(token, { complete: true })?.header;

    if (!decodedHeader?.kid) {
      return res
        .status(STATUS_CODES.UNAUTHORIZED)
        .json({ error: AUTH_MESSAGES.INVALID_TOKEN });
    }

    // Get signing keys from Auth0
    const signingKey = await getKey(decodedHeader);

    // Verify the token with the signing key
    const decoded = jwt.verify(token, signingKey, {
      audience: process.env.AUTH0_CLIENT_ID, // Ensure audience matches client ID
      issuer: `https://${process.env.AUTH0_DOMAIN}/`,
      algorithms: ["RS256"],
    });

    // Attach the decoded token to the request object
    req.user = decoded;

    next();
  } catch (error) {
    res
      .status(STATUS_CODES.UNAUTHORIZED)
      .json({ error: AUTH_MESSAGES.TOKEN_EXPIRED });
  }
};

export { authClient, validateToken };
