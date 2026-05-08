import { env } from "@repo/validator/server";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/api-error";

interface JwtPayload {
  id: string;
  role: "USER" | "ORGANIZATION" | "ADMIN";
  email?: string;
}

export const authenticate = (
  allowedRoles?:
    Array<"USER" | "ORGANIZATION" | "ADMIN">
) => {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    let token: string | undefined;

    // 1. Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // 2. Cookies fallback
    else if (req.cookies?.authToken) {
      token = req.cookies.authToken;
    }

    // 3. No token
    if (!token) {
      return next(
        new AppError(401, "UNAUTHORIZED", "No token provided")
      );
    }

    try {
      // 4. Verify token
      const decoded = jwt.verify(
        token,
        env.JWT_ACCESS_SECRET
      );

      if (typeof decoded === "string") {
        return next(
          new AppError(
            401,
            "INVALID_TOKEN",
            "Invalid token payload"
          )
        );
      }

      const user = decoded as JwtPayload;

      // 5. Attach user to request
      req.user = user;

      // 6. Role authorization
      if (
        allowedRoles &&
        !allowedRoles.includes(user.role)
      ) {
        return next(
          new AppError(
            403,
            "FORBIDDEN",
            "You do not have permission to access this resource"
          )
        );
      }

      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        next(
          new AppError(
            401,
            "TOKEN_EXPIRED",
            "Access token has expired"
          )
        );
      } else if (error instanceof jwt.JsonWebTokenError) {
        next(
          new AppError(
            401,
            "INVALID_TOKEN",
            "Invalid access token"
          )
        );
      } else {
        next(error);
      }
    }
  };
};