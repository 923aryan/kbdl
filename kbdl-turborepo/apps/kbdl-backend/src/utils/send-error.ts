import { Prisma } from "@repo/db/server";
import { ApiError } from "@repo/types";
import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "./api-error";

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  let response: ApiError;
  console.log("error was ", err);

  if (err instanceof ZodError) {
    response = {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        details: err.issues.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      },
    };
    return res.status(400).json(response);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // FIX: Explicitly cast 'err' because the namespace instanceof check doesn't narrow 'unknown'
    const prismaErr = err as Prisma.PrismaClientKnownRequestError;

    switch (prismaErr.code) {
      case "P2002": {
        response = {
          success: false,
          error: {
            code: "DUPLICATE_ERROR",
            message: `A record with this ${prismaErr.meta?.target} already exists.`,
            details: { field: prismaErr.meta?.target },
          },
        };
        return res.status(409).json(response);
      }

      case "P2025": {
        const modelName = prismaErr.meta?.modelName || "Record";
        response = {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: `${modelName} not found`,
            details: {
              cause: prismaErr.message,
              model: prismaErr.meta?.modelName,
            },
          },
        };
        return res.status(404).json(response);
      }

      case "P2003": {
        response = {
          success: false,
          error: {
            code: "FOREIGN_KEY_ERROR",
            message: "Related record does not exist",
            details: { field: prismaErr.meta?.field_name },
          },
        };
        return res.status(400).json(response);
      }

      case "P2014": {
        response = {
          success: false,
          error: {
            code: "RELATION_ERROR",
            message: "Required relation is missing",
            details: prismaErr.meta,
          },
        };
        return res.status(400).json(response);
      }

      case "P2021":
      case "P2022": {
        response = {
          success: false,
          error: {
            code: "DATABASE_SCHEMA_ERROR",
            message: "Database schema error",
            details: { code: prismaErr.code, message: prismaErr.message },
          },
        };
        return res.status(500).json(response);
      }

      default: {
        response = {
          success: false,
          error: {
            code: "DATABASE_ERROR",
            message: "Database operation failed",
            details: { code: prismaErr.code, message: prismaErr.message },
          },
        };
        return res.status(400).json(response);
      }
    }
  }

  if (err instanceof AppError) {
    response = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    };
    return res.status(err.statusCode).json(response);
  }

  let message = "Something went wrong";

  if (err instanceof Error) {
    message = err.message;
  }

  console.error("error is ", err);

  response = {
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message,
    },
  };
  return res.status(500).json(response);
};