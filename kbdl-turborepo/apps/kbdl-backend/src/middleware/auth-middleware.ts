import { prisma } from '@repo/db/server';
import { env } from '@repo/validator/server';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { setAuthCookies } from '../auth/auth-controller';
import { generateAccessToken, generateRefreshToken } from '../auth/auth-service';
import { ensureEmployerContext } from '../compat/employer-compat';
import { AppError } from '../utils/api-error';
import { ROLES } from '../utils/constants';
import { JwtPayload } from '../utils/jwt-payload';

export const authenticate = (
  allowedRoles?: Array<'user' | 'employer' | 'admin'>,
  bypass: boolean = false,
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    let token: string | undefined;

    // 1. Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('bearer: ', token);
    }
    // 2. Cookies fallback
    else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
      console.log('cookie: ', token);
    }

    // 3. No token
    if (!token) {
      return next(new AppError(401, 'UNAUTHORIZED', 'No token provided'));
    }

    try {
      // 4. Verify token
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);

      if (typeof decoded === 'string') {
        return next(new AppError(401, 'INVALID_TOKEN', 'Invalid token payload'));
      }

      const user = decoded as JwtPayload;

      // 5. Attach role and payload to request
      req.role = user.role;
      req.payload = user.payload;

      // 6. Role authorization
      if (allowedRoles && !allowedRoles.includes(user.role)) {
        return next(
          new AppError(403, 'FORBIDDEN', 'You do not have permission to access this resource'),
        );
      }
      if (user.role === ROLES.EMPLOYER && user.payload.employer.is_verified === false) {
        if (bypass) {
          return next();
        }
        console.log('inside auth middleware: role : employer id =  ', user.payload.employer.id);
        const { company, ownerUser } = await ensureEmployerContext(user.payload.employer.id);
        console.log('curent employer ', { id: company.id, email: ownerUser.email, is_verified: company.is_verified });
        if (!company.is_verified) {
          return next(new AppError(403, 'UNVERIFIED', 'Verification pending.'));
        }

        // employer became verified in DB
        // issue fresh token
        const payload: JwtPayload = {
          role: ROLES.EMPLOYER,
          payload: {
            employer: {
              id: company.id,
              email: ownerUser.email ?? '',
              is_verified: true,
            },
          },
        };

        const newAccessToken = generateAccessToken(payload);

        const newRefreshToken = generateRefreshToken(payload);

        /*
          Persist refresh token on owner User
        */

        await prisma.user.update({
          where: {
            id: ownerUser.id,
          },
          data: {
            refresh_token: newRefreshToken,
          },
        });

        /*
          Set fresh cookies
        */

        setAuthCookies(res, newAccessToken, newRefreshToken);

        // optional for mobile clients
        res.setHeader('x-access-token', newAccessToken);
      }

      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        next(new AppError(401, 'TOKEN_EXPIRED', 'Access token has expired'));
      } else if (error instanceof jwt.JsonWebTokenError) {
        next(new AppError(401, 'INVALID_TOKEN', 'Invalid access token'));
      } else {
        next(error);
      }
    }
  };
};
