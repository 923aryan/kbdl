import { env } from "@repo/validator/server";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/api-error";

const authenticate = (req: Request, res: Response, next: NextFunction) => {
  let token;

  // 1. Check for token in the Authorization header (React Native)
  // Format should be: "Bearer <token>"
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // 2. Fallback to checking cookies (Web)
  else if (req.cookies && req.cookies.authToken) {
    token = req.cookies.authToken;
  }

  // If no token is found in either place, reject the request
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }

  try {
    // 3. Verify the token
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);

    // 4. Attach user details to the Request object
    // You can attach just the decoded payload, or query the DB for the full user
    req.user = decoded;

    next(); // Move to the next middleware or controller
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new AppError(401, "TOKEN_EXPIRED", "Access token has expired"));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError(401, "INVALID_TOKEN", "Invalid access token"));
    } else {
      next(error);
    }
  }
};

module.exports = { authenticate };
