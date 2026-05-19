import { Employer, User } from '@repo/db/server';
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
export type GetCurrentUserProfileResponse = User;
export type UpdateUserProfileRequest = z.infer<typeof updateUserProfileSchema>;
export type UpdateUserProfilePayload = z.infer<typeof updateUserProfileSchema>['body'];
export type UpdateUserProfileResponse = User;
export type DeleteUserProfileResponse = {
  message: string;
};
export type UpdateUserSkillsRequest = z.infer<typeof updateUserSkillsSchema>;
export type UpdateUserSkillsPayload = z.infer<typeof updateUserSkillsSchema>['body'];
export type UpdateUserSkillsResponse = User;
export type UpdateUserPreferencesRequest = z.infer<typeof updateUserPreferencesSchema>;
export type UpdateUserPreferencesPayload = z.infer<typeof updateUserPreferencesSchema>['body'];
export type UpdateUserPreferencesResponse = User;
export type UpdateUserLocationRequest = z.infer<typeof updateUserLocationSchema>;
export type UpdateUserLocationPayload = z.infer<typeof updateUserLocationSchema>['body'];
export type UpdateUserLocationResponse = User;
export type UpdateUserAvailabilityRequest = z.infer<typeof updateUserAvailabilitySchema>;
export type UpdateUserAvailabilityPayload = z.infer<typeof updateUserAvailabilitySchema>['body'];
export type UpdateUserAvailabilityResponse = User;
export type RegisterPushTokenRequest = z.infer<typeof savePushTokenSchema>;
export type RegisterPushTokenPayload = z.infer<typeof savePushTokenSchema>['body'];
export type RegisterPushTokenResponse = {
  message: string;
};
export type RemovePushTokenRequest = z.infer<typeof removePushTokenSchema>;
export type RemovePushTokenPayload = z.infer<typeof removePushTokenSchema>['body'];
export type RemovePushTokenResponse = {
  message: string;
};
export type GetPublicUserProfileRequest = z.infer<typeof getPublicUserProfileSchema>;
export type GetPublicUserProfileResponse = Partial<User>;
export type GetCurrentEmployerProfileResponse = Employer;
export type UpdateEmployerProfileRequest = z.infer<typeof updateEmployerProfileSchema>;
export type UpdateEmployerProfilePayload = z.infer<typeof updateEmployerProfileSchema>['body'];
export type UpdateEmployerProfileResponse = Employer;
export type DeleteEmployerProfileResponse = {
  message: string;
};
export type UpdateEmployerPreferencesRequest = z.infer<typeof updateEmployerPreferencesSchema>;
export type UpdateEmployerPreferencesPayload = z.infer<
  typeof updateEmployerPreferencesSchema
>['body'];
export type UpdateEmployerPreferencesResponse = Employer;
export type UpdateEmployerLocationRequest = z.infer<typeof updateEmployerLocationSchema>;
export type UpdateEmployerLocationPayload = z.infer<typeof updateEmployerLocationSchema>['body'];
export type UpdateEmployerLocationResponse = Employer;
export type UploadEmployerDocumentsRequest = z.infer<typeof uploadEmployerDocumentsSchema>;
export type UploadEmployerDocumentsResponse = {
  message: string;
  files: any;
};
export type GetEmployerVerificationStatusResponse = {
  is_verified: boolean;
};
export type GetPublicEmployerProfileRequest = z.infer<typeof getPublicEmployerProfileSchema>;
export type GetPublicEmployerProfileResponse = Partial<Employer>;
//# sourceMappingURL=profile-type.d.ts.map
