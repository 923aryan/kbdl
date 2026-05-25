import { Prisma, safeEmployerSelect, safeUserSelect } from '@repo/db/server';
import {
  getPublicEmployerProfileSchema,
  getPublicUserProfileSchema,
  removePushTokenSchema,
  savePushTokenSchema,
  updateEmployerLocationSchema,
  updateEmployerPreferencesSchema,
  updateEmployerProfileSchema,
  updateUserAvailabilitySchema,
  updateUserLocationSchema,
  updateUserPreferencesSchema,
  updateUserProfileSchema,
  updateUserSkillsSchema,
  uploadEmployerDocumentsSchema,
} from '@repo/validator/shared';
import { z } from 'zod';

export type GetCurrentUserProfileResponse = UserDTO;

export type UpdateUserProfileRequest = z.infer<typeof updateUserProfileSchema>;
export type UpdateUserProfilePayload = z.infer<typeof updateUserProfileSchema>['body'];
export type UpdateUserProfileResponse = UserDTO;

export type DeleteUserProfileResponse = { message: string };

export type UpdateUserSkillsRequest = z.infer<typeof updateUserSkillsSchema>;
export type UpdateUserSkillsPayload = z.infer<typeof updateUserSkillsSchema>['body'];
export type UpdateUserSkillsResponse = UserDTO;

export type UpdateUserPreferencesRequest = z.infer<typeof updateUserPreferencesSchema>;
export type UpdateUserPreferencesPayload = z.infer<typeof updateUserPreferencesSchema>['body'];
export type UpdateUserPreferencesResponse = UserDTO;

export type UpdateUserLocationRequest = z.infer<typeof updateUserLocationSchema>;
export type UpdateUserLocationPayload = z.infer<typeof updateUserLocationSchema>['body'];
export type UpdateUserLocationResponse = UserDTO;

export type UpdateUserAvailabilityRequest = z.infer<typeof updateUserAvailabilitySchema>;
export type UpdateUserAvailabilityPayload = z.infer<typeof updateUserAvailabilitySchema>['body'];
export type UpdateUserAvailabilityResponse = UserDTO;

export type RegisterPushTokenRequest = z.infer<typeof savePushTokenSchema>;
export type RegisterPushTokenPayload = z.infer<typeof savePushTokenSchema>['body'];
export type RegisterPushTokenResponse = { message: string };

export type RemovePushTokenRequest = z.infer<typeof removePushTokenSchema>;
export type RemovePushTokenPayload = z.infer<typeof removePushTokenSchema>['body'];
export type RemovePushTokenResponse = { message: string };

export type GetPublicUserProfileRequest = z.infer<typeof getPublicUserProfileSchema>;
export type GetPublicUserProfileResponse = Partial<UserDTO>;

export type GetCurrentEmployerProfileResponse = EmployerDTO
export type UpdateEmployerProfileRequest = z.infer<typeof updateEmployerProfileSchema>;
export type UpdateEmployerProfilePayload = z.infer<typeof updateEmployerProfileSchema>['body'];
export type UpdateEmployerProfileResponse = EmployerDTO;

export type DeleteEmployerProfileResponse = { message: string };

export type UpdateEmployerPreferencesRequest = z.infer<typeof updateEmployerPreferencesSchema>;
export type UpdateEmployerPreferencesPayload = z.infer<
  typeof updateEmployerPreferencesSchema
>['body'];
export type UpdateEmployerPreferencesResponse = EmployerDTO;

export type UpdateEmployerLocationRequest = z.infer<typeof updateEmployerLocationSchema>;
export type UpdateEmployerLocationPayload = z.infer<typeof updateEmployerLocationSchema>['body'];
export type UpdateEmployerLocationResponse = EmployerDTO;

export type UploadEmployerDocumentsRequest = z.infer<typeof uploadEmployerDocumentsSchema>;

export type UploadEmployerDocumentsResponse = { message: string; files: any };

export type GetEmployerVerificationStatusResponse = { is_verified: boolean };

export type GetPublicEmployerProfileRequest = z.infer<typeof getPublicEmployerProfileSchema>;
export type GetPublicEmployerProfileResponse = Partial<EmployerDTO>;


//Helpers:
type EmployerDTO = Prisma.EmployerGetPayload<{
  select: typeof safeEmployerSelect;
}>;

type UserDTO = Prisma.UserGetPayload<{
  select: typeof safeUserSelect;
}>;