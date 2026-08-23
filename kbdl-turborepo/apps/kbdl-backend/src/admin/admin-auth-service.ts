import { prisma } from '@repo/db/server';
import type { AdminLoginResponse, AdminSession } from '@repo/types';
import bcrypt from 'bcrypt';
import { AppError } from '../utils/api-error';
import { ROLES } from '../utils/constants';
import { JwtPayload } from '../utils/jwt-payload';
import { generateAccessToken, generateRefreshToken } from '../auth/jwt-tokens';

function normalizeAdminLogin(raw: string): { email?: string; phone_no?: string } {
  const trimmed = raw.trim();
  if (/^\d{10}$/.test(trimmed)) return { phone_no: `+91${trimmed}` };
  if (/^\+91\d{10}$/.test(trimmed)) return { phone_no: trimmed };
  return { email: trimmed.toLowerCase() };
}

export async function adminLoginService(payload: {
  email: string;
  password: string;
}): Promise<AdminLoginResponse> {
  const login = normalizeAdminLogin(payload.email);
  const admin = login.email
    ? await prisma.admin.findUnique({ where: { email: login.email } })
    : await prisma.admin.findUnique({ where: { phone_no: login.phone_no } });
  if (!admin) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email/phone or password');
  }

  const ok = await bcrypt.compare(payload.password, admin.password_hash);
  if (!ok) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email/phone or password');
  }

  const jwtPayload: JwtPayload = {
    role: ROLES.ADMIN,
    payload: {
      admin: { id: admin.id, email: admin.email, name: admin.name },
    },
  };

  return {
    admin: {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      phone_no: admin.phone_no,
      role: admin.role,
    },
    accessToken: generateAccessToken(jwtPayload),
    refreshToken: generateRefreshToken(jwtPayload),
  };
}

export async function getAdminMeService(adminId: string): Promise<AdminSession> {
  const admin = await prisma.admin.findUnique({ where: { id: adminId } });
  if (!admin) {
    throw new AppError(401, 'UNAUTHORIZED', 'Admin not found');
  }
  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    phone_no: admin.phone_no,
    role: admin.role,
  };
}
