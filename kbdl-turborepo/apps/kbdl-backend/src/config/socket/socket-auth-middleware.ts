import { Socket } from 'socket.io';

import jwt from 'jsonwebtoken';

import { env } from '@repo/validator/server';
import { ROLES } from '../../utils/constants';
import { JwtPayload } from '../../utils/jwt-payload';

interface SocketUser {
  id: string;
  role: string;
}

export interface AuthenticatedSocket extends Socket {
  user?: SocketUser;
}

export async function socketAuthMiddleware(
  socket: AuthenticatedSocket,
  next: (err?: Error) => void,
) {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Unauthorized'));
    }

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;

    if (decoded.role !== ROLES.USER) {
      return next(new Error('Unauthorized'));
    }

    socket.user = {
      id: decoded.payload.user.id,
      role: decoded.role,
    };

    next();
  } catch (error) {
    next(new Error('Unauthorized'));
  }
}
