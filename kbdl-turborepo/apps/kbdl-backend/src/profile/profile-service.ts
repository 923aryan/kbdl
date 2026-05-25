import { Employer, prisma, safeEmployerSelect } from '@repo/db/server';
import {
  GetCurrentEmployerProfileResponse,
  GetPublicEmployerProfileResponse,
  GetPublicUserProfileResponse,
  RegisterPushTokenPayload,
  RemovePushTokenPayload,
  UpdateEmployerLocationPayload,
  UpdateEmployerLocationResponse,
  UpdateEmployerPreferencesResponse,
  UpdateEmployerProfilePayload,
  UpdateEmployerProfileResponse,
  UpdateUserAvailabilityPayload,
  UpdateUserAvailabilityResponse,
  UpdateUserLocationPayload,
  UpdateUserLocationResponse,
  UpdateUserPreferencesPayload,
  UpdateUserPreferencesResponse,
  UpdateUserProfilePayload,
  UpdateUserProfileResponse,
  UpdateUserSkillsPayload,
  UpdateUserSkillsResponse,
} from '@repo/types';
import { AppError } from '../utils/api-error';

import { User } from '@repo/db/server';

export const getCurrentEmployerProfileService = async (
  employerId: string,
): Promise<GetCurrentEmployerProfileResponse> => {
  const employer = await prisma.employer.findUnique({
    where: { id: employerId },
    select: safeEmployerSelect,
  });
  if (!employer) {
    throw new AppError(404, 'EMPLOYER_NOT_FOUND', 'Employer not found');
  }
  return employer;
};

export const updateEmployerProfileService = async (
  employerId: string,
  payload: UpdateEmployerProfilePayload,
): Promise<UpdateEmployerProfileResponse> => {
  return prisma.employer.update({
    where: { id: employerId },
    data: payload,
    select: safeEmployerSelect,
  });
};

export const deleteEmployerProfileService = async (employerId: string): Promise<void> => {
  await prisma.employer.delete({ where: { id: employerId } });
};

export const updateEmployerPreferencesService = async (
  employerId: string,
  payload: UpdateEmployerPreferencesResponse,
): Promise<Employer> => {
  const employer = await getCurrentEmployerProfileService(employerId);
  const newPreferences = { ...(employer.preferences as object), ...payload };
  return prisma.employer.update({
    where: { id: employerId },
    data: { preferences: newPreferences },
  });
};

export const updateEmployerLocationService = async (
  employerId: string,
  payload: UpdateEmployerLocationPayload,
): Promise<UpdateEmployerLocationResponse> => {
  const { latitude, longitude } = payload;
  await prisma.$executeRaw`
    UPDATE employers
    SET company_location = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
    WHERE id = ${employerId}::uuid
  `;
  return getCurrentEmployerProfileService(employerId);
};

export const uploadEmployerDocumentsService = async (
  employerId: string,
  files: any,
): Promise<{ message: string; files: any }> => {
  console.log(`Uploading documents for employer ${employerId}`, files);
  await prisma.employer.update({
    where: { id: employerId },
    data: { is_verified: false },
  });
  return { message: 'Documents uploaded successfully. Verification is pending.', files };
};

export const getEmployerVerificationStatusService = async (
  employerId: string,
): Promise<{ is_verified: boolean }> => {
  const employer = await prisma.employer.findUnique({
    where: { id: employerId },
    select: { is_verified: true },
  });
  if (!employer) {
    throw new AppError(404, 'EMPLOYER_NOT_FOUND', 'Employer not found');
  }
  return { is_verified: employer.is_verified };
};

export const getPublicEmployerProfileService = async (
  employerId: string,
): Promise<Partial<GetPublicEmployerProfileResponse>> => {
  const employer = await prisma.employer.findUnique({
    where: { id: employerId },
    select: {
      id: true,
      company_name: true,
      company_address: true,
      is_verified: true,
    },
  });
  if (!employer) {
    throw new AppError(404, 'EMPLOYER_NOT_FOUND', 'Employer not found');
  }
  return employer;
};

export const getCurrentUserProfileService = async (userId: string): Promise<User> => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }
  return user;
};

export const updateUserProfileService = async (
  userId: string,
  payload: UpdateUserProfilePayload,
): Promise<UpdateUserProfileResponse> => {
  return prisma.user.update({
    where: { id: userId },
    data: payload,
  });
};

export const deleteUserProfileService = async (userId: string): Promise<void> => {
  await prisma.user.delete({ where: { id: userId } });
};

export const updateUserSkillsService = async (
  userId: string,
  payload: UpdateUserSkillsPayload,
): Promise<UpdateUserSkillsResponse> => {
  return prisma.user.update({
    where: { id: userId },
    data: { skills: payload.skills },
  });
};

export const updateUserPreferencesService = async (
  userId: string,
  payload: UpdateUserPreferencesPayload,
): Promise<UpdateUserPreferencesResponse> => {
  const user = await getCurrentUserProfileService(userId);
  const newPreferences = { ...(user.preferences as object), ...payload };
  return prisma.user.update({
    where: { id: userId },
    data: { preferences: newPreferences },
  });
};

export const updateUserLocationService = async (
  userId: string,
  payload: UpdateUserLocationPayload,
): Promise<UpdateUserLocationResponse> => {
  const { latitude, longitude } = payload;
  await prisma.$executeRaw`
        UPDATE users
        SET location = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
        WHERE id = ${userId}::uuid
    `;
  return getCurrentUserProfileService(userId);
};

export const updateUserAvailabilityService = async (
  userId: string,
  payload: UpdateUserAvailabilityPayload,
): Promise<UpdateUserAvailabilityResponse> => {
  return prisma.user.update({
    where: { id: userId },
    data: { extra_shift: payload.extra_shift },
  });
};

export const registerPushTokenService = async (
  userId: string,
  payload: RegisterPushTokenPayload,
): Promise<void> => {
  const { token, deviceId, platform } = payload;
  await prisma.pushToken.upsert({
    where: { token },
    update: { isActive: true, deviceId, platform, user_id: userId },
    create: { token, deviceId, platform, user_id: userId },
  });
};

export const removePushTokenService = async (
  userId: string,
  payload: RemovePushTokenPayload,
): Promise<void> => {
  const whereClause: { token?: string; deviceId?: string; user_id: string } = { user_id: userId };
  if (payload.token) {
    whereClause.token = payload.token;
  } else if (payload.deviceId) {
    whereClause.deviceId = payload.deviceId;
  } else {
    throw new AppError(400, 'INVALID_PAYLOAD', 'Either token or deviceId is required');
  }

  const foundToken = await prisma.pushToken.findFirst({ where: whereClause });

  if (foundToken) {
    await prisma.pushToken.update({
      where: { id: foundToken.id },
      data: { isActive: false },
    });
  }
};

export const getPublicUserProfileService = async (
  userId: string,
): Promise<Partial<GetPublicUserProfileResponse>> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      skills: true,
      experience: true,
      city: true,
      area: true,
      rating_avg: true,
      rating_count: true,
      verification_level: true,
    },
  });
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }
  return user;
};
