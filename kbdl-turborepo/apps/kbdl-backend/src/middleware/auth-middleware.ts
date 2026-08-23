import { prisma } from '@repo/db/server';
import { env } from '@repo/validator/server';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { setAuthCookies, tokensFromRequest } from '../auth/auth-cookies';
import { generateAccessToken, generateRefreshToken } from '../auth/jwt-tokens';
import { ensureEmployerContext } from '../compat/employer-compat';
import { AppError } from '../utils/api-error';
import { ROLES, type Role } from '../utils/constants';
import { JwtPayload } from '../utils/jwt-payload';

export const authenticate = (
  allowedRoles?: Array<'user' | 'employer' | 'admin'>,
  bypass: boolean = false,
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const candidates = tokensFromRequest(req, allowedRoles as Role[] | undefined);
    if (!candidates.length) {
      return next(new AppError(401, 'UNAUTHORIZED', 'No token provided'));
    }

    let lastAuthError: AppError | jwt.JsonWebTokenError | jwt.TokenExpiredError | unknown;

    for (const token of candidates) {
      try {
        const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
        if (typeof decoded === 'string') {
          lastAuthError = new AppError(401, 'INVALID_TOKEN', 'Invalid token payload');
          continue;
        }

        const user = decoded as JwtPayload;
        if (allowedRoles && !allowedRoles.includes(user.role)) {
          lastAuthError = new AppError(
            403,
            'FORBIDDEN',
            'You do not have permission to access this resource',
          );
          continue;
        }

        req.role = user.role;
        req.payload = user.payload;

        if (user.role === ROLES.EMPLOYER) {
          const emp = user.payload.employer;
          if (emp.status === 'suspended' || emp.status === 'rejected') {
            if (bypass) return next();
            return next(
              new AppError(403, 'COMPANY_SUSPENDED', 'This company is suspended. Contact KBDL support.'),
            );
          }
          if (emp.setup_pending || !emp.id) {
            if (bypass) return next();
            return next(
              new AppError(403, 'COMPANY_SETUP_REQUIRED', 'Complete company onboarding first'),
            );
          }
          if (emp.is_verified === false) {
            if (bypass) {
              return next();
            }
            const { company, ownerUser } = await ensureEmployerContext(emp.id);
            if (company.status === 'suspended' || company.status === 'rejected') {
              return next(
                new AppError(403, 'COMPANY_SUSPENDED', 'This company is suspended. Contact KBDL support.'),
              );
            }
            if (!company.is_verified) {
              return next(new AppError(403, 'UNVERIFIED', 'Verification pending.'));
            }

            const payload: JwtPayload = {
              role: ROLES.EMPLOYER,
              payload: {
                employer: {
                  id: company.id,
                  email: ownerUser.email ?? '',
                  is_verified: true,
                  user_id: emp.user_id ?? ownerUser.id,
                  role_code: emp.role_code,
                  setup_pending: false,
                  status: company.status,
                },
              },
            };

            const newAccessToken = generateAccessToken(payload);
            const newRefreshToken = generateRefreshToken(payload);

            await prisma.user.update({
              where: { id: ownerUser.id },
              data: { refresh_token: newRefreshToken },
            });

            setAuthCookies(res, newAccessToken, newRefreshToken, ROLES.EMPLOYER);
            res.setHeader('x-access-token', newAccessToken);
          }
        }

        return next();
      } catch (error) {
        lastAuthError = error;
      }
    }

    if (lastAuthError instanceof jwt.TokenExpiredError) {
      return next(new AppError(401, 'TOKEN_EXPIRED', 'Access token has expired'));
    }
    if (lastAuthError instanceof jwt.JsonWebTokenError) {
      return next(new AppError(401, 'INVALID_TOKEN', 'Invalid access token'));
    }
    if (lastAuthError instanceof AppError) {
      return next(lastAuthError);
    }
    return next(lastAuthError);
  };
};
