import { env } from '@repo/validator/server';
import { Request, Response } from 'express';
import { ROLES, type Role } from '../utils/constants';

const LEGACY_ACCESS = 'accessToken';
const LEGACY_REFRESH = 'refreshToken';

function cookieOptions() {
  const isProduction = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
  };
}

export function accessCookieName(role: Role) {
  return `kbdl_${role}_access`;
}

export function refreshCookieName(role: Role) {
  return `kbdl_${role}_refresh`;
}

export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
  role: Role,
) => {
  const options = cookieOptions();
  res.cookie(accessCookieName(role), accessToken, {
    ...options,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.cookie(refreshCookieName(role), refreshToken, {
    ...options,
    maxAge: 15 * 24 * 60 * 60 * 1000,
  });
  // Drop the shared cookie so admin/employer tabs on localhost do not overwrite each other.
  res.clearCookie(LEGACY_ACCESS, options);
  res.clearCookie(LEGACY_REFRESH, options);
};

export const clearAuthCookies = (res: Response) => {
  const options = cookieOptions();
  for (const role of Object.values(ROLES)) {
    res.clearCookie(accessCookieName(role), options);
    res.clearCookie(refreshCookieName(role), options);
  }
  res.clearCookie(LEGACY_ACCESS, options);
  res.clearCookie(LEGACY_REFRESH, options);
};

export function tokensFromRequest(
  req: Request,
  allowedRoles?: Role[],
): string[] {
  const tokens: string[] = [];
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    tokens.push(header.split(' ')[1] ?? '');
  }

  const roles = allowedRoles?.length ? allowedRoles : Object.values(ROLES);
  for (const role of roles) {
    const cookie = req.cookies?.[accessCookieName(role)];
    if (typeof cookie === 'string' && cookie) tokens.push(cookie);
  }

  if (typeof req.cookies?.[LEGACY_ACCESS] === 'string' && req.cookies[LEGACY_ACCESS]) {
    tokens.push(req.cookies[LEGACY_ACCESS]);
  }

  return [...new Set(tokens.filter(Boolean))];
}
