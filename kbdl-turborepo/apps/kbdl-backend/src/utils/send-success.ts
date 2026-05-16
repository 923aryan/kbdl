import { ApiSuccess } from '@repo/types';
import { Response } from 'express';

export const sendSuccess = <T>(
  res: Response,
  message: string,
  data: T,
  statusCode = 200,
  meta?: Record<string, unknown>,
) => {
  const response: ApiSuccess<T> = {
    success: true,
    message: message,
    data,
    ...(meta && { meta }),
  };

  return res.status(statusCode).json(response);
};
