import { prisma, safeUserSelect } from '@repo/db/server';
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
import {
  EmployerDto,
  ensureEmployerContext,
  findEmployerById,
  toEmployerDto,
} from '../compat/employer-compat';
import { AppError } from '../utils/api-error';

export const getCurrentEmployerProfileService = async (
  auth: { id: string; email: string; user_id?: string; setup_pending?: boolean; role_code?: string },
): Promise<GetCurrentEmployerProfileResponse> => {
  if (!auth.id || auth.setup_pending) {
    const user = auth.user_id
      ? await prisma.user.findUnique({ where: { id: auth.user_id } })
      : await prisma.user.findUnique({ where: { email: auth.email } });
    return {
      id: '',
      company_name: '',
      email: user?.email ?? auth.email,
      phone_no: user?.phone_no ?? null,
      company_address: null,
      gst_number: null,
      pan: null,
      state: null,
      epf_registration_no: null,
      esic_code: null,
      is_verified: false,
      status: 'onboarding',
      setup_pending: true,
      role_code: auth.role_code ?? 'HR',
      preferences: {},
      role: 'employer',
      subscription_tier: null,
    };
  }

  const company = await prisma.company.findUnique({ where: { id: auth.id } });
  if (!company) {
    throw new AppError(404, 'EMPLOYER_NOT_FOUND', 'Employer not found');
  }
  const member = await prisma.companyMember.findFirst({
    where: {
      company_id: auth.id,
      ...(auth.user_id ? { user_id: auth.user_id } : {}),
      platform_type: 'EMPLOYER',
      is_active: true,
    },
    include: { user: true, role: true },
  });
  return toEmployerDto(company, member?.user ?? null, {
    setup_pending: false,
    role_code: member?.role.code ?? auth.role_code,
  });
};

export const updateEmployerProfileService = async (
  employerId: string,
  payload: UpdateEmployerProfilePayload,
): Promise<UpdateEmployerProfileResponse> => {
  const { company, ownerUser } = await ensureEmployerContext(employerId);

  const companyData: {
    company_name?: string;
    company_address?: string;
    gst_number?: string | null;
  } = {};
  if (payload.company_name !== undefined) companyData.company_name = payload.company_name;
  if (payload.company_address !== undefined) companyData.company_address = payload.company_address;
  if (payload.gst_number !== undefined) {
    companyData.gst_number = payload.gst_number === '' ? null : payload.gst_number;
  }

  const [updatedCompany, updatedOwner] = await prisma.$transaction(async (tx) => {
    const nextCompany =
      Object.keys(companyData).length > 0
        ? await tx.company.update({
            where: { id: company.id },
            data: companyData,
          })
        : company;

    const nextOwner =
      payload.phone_no !== undefined
        ? await tx.user.update({
            where: { id: ownerUser.id },
            data: { phone_no: payload.phone_no },
          })
        : ownerUser;

    return [nextCompany, nextOwner] as const;
  });

  return toEmployerDto(updatedCompany, updatedOwner);
};

export const deleteEmployerProfileService = async (employerId: string): Promise<void> => {
  const { company, ownerUser } = await ensureEmployerContext(employerId);
  await prisma.$transaction(async (tx) => {
    await tx.company.delete({ where: { id: company.id } });
    await tx.user.delete({ where: { id: ownerUser.id } });
  });
};

export const updateEmployerPreferencesService = async (
  employerId: string,
  payload: UpdateEmployerPreferencesResponse,
): Promise<EmployerDto> => {
  const { company, ownerUser } = await ensureEmployerContext(employerId);
  const newPreferences = {
    ...((company.preferences as object) || {}),
    ...(payload as object),
  };
  const updatedCompany = await prisma.company.update({
    where: { id: employerId },
    data: { preferences: newPreferences },
  });
  return toEmployerDto(updatedCompany, ownerUser);
};

export const updateEmployerLocationService = async (
  employerId: string,
  payload: UpdateEmployerLocationPayload,
): Promise<UpdateEmployerLocationResponse> => {
  const { latitude, longitude } = payload;
  await prisma.$executeRaw`
    UPDATE companies
    SET company_location = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
    WHERE id = ${employerId}::uuid
  `;
  return getCurrentEmployerProfileService({ id: employerId, email: '' });
};

export const uploadEmployerDocumentsService = async (
  employerId: string,
  files: any,
): Promise<{ message: string; files: any }> => {
  console.log(`Uploading documents for employer ${employerId}`, files);
  await prisma.company.update({
    where: { id: employerId },
    data: { is_verified: false },
  });
  return { message: 'Documents uploaded successfully. Verification is pending.', files };
};

export const getEmployerVerificationStatusService = async (
  employerId: string,
): Promise<{ is_verified: boolean; status: string | null; setup_pending: boolean }> => {
  if (!employerId) {
    return { is_verified: false, status: 'onboarding', setup_pending: true };
  }
  const company = await prisma.company.findUnique({
    where: { id: employerId },
    select: { is_verified: true, status: true },
  });
  if (!company) {
    throw new AppError(404, 'EMPLOYER_NOT_FOUND', 'Employer not found');
  }
  return {
    is_verified: company.is_verified,
    status: company.status,
    setup_pending: false,
  };
};

export const getPublicEmployerProfileService = async (
  employerId: string,
): Promise<Partial<GetPublicEmployerProfileResponse>> => {
  const company = await prisma.company.findUnique({
    where: { id: employerId },
    select: {
      id: true,
      company_name: true,
      company_address: true,
      is_verified: true,
    },
  });
  if (!company) {
    throw new AppError(404, 'EMPLOYER_NOT_FOUND', 'Employer not found');
  }
  return company;
};

export const getCurrentUserProfileService = async (
  userId: string,
): Promise<GetPublicUserProfileResponse> => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: safeUserSelect });
  if (!user) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }
  return user;
};

export const updateUserProfileService = async (
  userId: string,
  payload: UpdateUserProfilePayload,
): Promise<UpdateUserProfileResponse> => {
  console.log('payload was ', JSON.stringify(payload));
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
