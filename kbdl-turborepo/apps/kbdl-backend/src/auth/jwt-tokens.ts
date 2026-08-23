import { env } from '@repo/validator/server';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../utils/jwt-payload';

export const generateAccessToken = (payload: JwtPayload) => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET as string, {
    expiresIn: env.JWT_ACCESS_EXPIRY as any,
  });
};

export const generateRefreshToken = (payload: JwtPayload) => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET as string, {
    expiresIn: env.JWT_REFRESH_EXPIRY as any,
  });
};
