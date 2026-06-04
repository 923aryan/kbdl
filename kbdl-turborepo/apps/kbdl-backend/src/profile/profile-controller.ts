import {
  GetPublicEmployerProfileRequest,
  UpdateEmployerLocationRequest,
  UpdateEmployerPreferencesRequest,
  UpdateEmployerProfileRequest,
  UploadEmployerDocumentsRequest,
} from '@repo/types';
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
import { Request, Response } from 'express';
import { sendSuccess } from '../utils/send-success';
import { validate } from '../utils/validate';
import {
  deleteEmployerProfileService,
  deleteUserProfileService,
  getCurrentEmployerProfileService,
  getCurrentUserProfileService,
  getEmployerVerificationStatusService,
  getPublicEmployerProfileService,
  getPublicUserProfileService,
  registerPushTokenService,
  removePushTokenService,
  updateEmployerLocationService,
  updateEmployerPreferencesService,
  updateEmployerProfileService,
  updateUserAvailabilityService,
  updateUserLocationService,
  updateUserPreferencesService,
  updateUserProfileService,
  updateUserSkillsService,
  uploadEmployerDocumentsService,
} from './profile-service';

import {
  GetPublicUserProfileRequest,
  RegisterPushTokenRequest,
  RemovePushTokenRequest,
  UpdateUserAvailabilityRequest,
  UpdateUserLocationRequest,
  UpdateUserPreferencesRequest,
  UpdateUserProfileRequest,
  UpdateUserSkillsRequest,
} from '@repo/types';

export const getCurrentEmployerProfile = async (req: Request, res: Response) => {
  const employerId = req.payload.employer.id;
  const employer = await getCurrentEmployerProfileService(employerId);
  sendSuccess(res, 'Employer profile retrieved successfully', employer);
};

export const updateEmployerProfile = async (req: Request, res: Response) => {
  const input: UpdateEmployerProfileRequest = validate(updateEmployerProfileSchema, req);
  const employerId = req.payload.employer.id;
  const updatedEmployer = await updateEmployerProfileService(employerId, input.body);
  sendSuccess(res, 'Employer profile updated successfully', updatedEmployer);
};

export const deleteEmployerProfile = async (req: Request, res: Response) => {
  const employerId = req.payload.employer.id;
  await deleteEmployerProfileService(employerId);
  sendSuccess(res, 'Employer profile deleted successfully', {
    message: 'Employer profile deleted successfully',
  });
};

export const updateEmployerPreferences = async (req: Request, res: Response) => {
  const input: UpdateEmployerPreferencesRequest = validate(updateEmployerPreferencesSchema, req);
  const employerId = req.payload.employer.id;
  const updatedEmployer = await updateEmployerPreferencesService(employerId, input.body);
  sendSuccess(res, 'Employer preferences updated successfully', updatedEmployer);
};

export const updateEmployerLocation = async (req: Request, res: Response) => {
  const input: UpdateEmployerLocationRequest = validate(updateEmployerLocationSchema, req);
  const employerId = req.payload.employer.id;
  const updatedEmployer = await updateEmployerLocationService(employerId, input.body);
  sendSuccess(res, 'Employer location updated successfully', updatedEmployer);
};

export const uploadEmployerDocuments = async (req: Request, res: Response) => {
  const input: UploadEmployerDocumentsRequest = validate(uploadEmployerDocumentsSchema, req);
  const employerId = req.payload.employer.id;
  const result = await uploadEmployerDocumentsService(employerId, (req as any).files);
  sendSuccess(res, result.message, result.files, 202);
};

export const getEmployerVerificationStatus = async (req: Request, res: Response) => {
  const employerId = req.payload.employer.id;
  const status = await getEmployerVerificationStatusService(employerId);
  sendSuccess(res, 'Employer verification status retrieved', status);
};

export const getPublicEmployerProfile = async (req: Request, res: Response) => {
  const input: GetPublicEmployerProfileRequest = validate(getPublicEmployerProfileSchema, req);
  const employer = await getPublicEmployerProfileService(input.params.id);
  sendSuccess(res, 'Public employer profile retrieved successfully', employer);
};

export const getCurrentUserProfile = async (req: Request, res: Response) => {
  const userId = req.payload.user.id;
  const user = await getCurrentUserProfileService(userId);
  sendSuccess(res, 'User profile retrieved successfully', user);
};

export const updateUserProfile = async (req: Request, res: Response) => {
  const input: UpdateUserProfileRequest = validate(updateUserProfileSchema, req);
  const userId = req.payload.user.id;
  console.log('in controller: ', JSON.stringify(input.body));
  const updatedUser = await updateUserProfileService(userId, input.body);
  sendSuccess(res, 'User profile updated successfully', updatedUser);
};

export const deleteUserProfile = async (req: Request, res: Response) => {
  const userId = req.payload.user.id;
  await deleteUserProfileService(userId);
  sendSuccess(res, 'User profile deleted successfully', {
    message: 'User profile deleted successfully',
  });
};

export const updateUserSkills = async (req: Request, res: Response) => {
  const input: UpdateUserSkillsRequest = validate(updateUserSkillsSchema, req);
  const userId = req.payload.user.id;
  const updatedUser = await updateUserSkillsService(userId, input.body);
  sendSuccess(res, 'User skills updated successfully', updatedUser);
};

export const updateUserPreferences = async (req: Request, res: Response) => {
  const input: UpdateUserPreferencesRequest = validate(updateUserPreferencesSchema, req);
  const userId = req.payload.user.id;
  const updatedUser = await updateUserPreferencesService(userId, input.body);
  sendSuccess(res, 'User preferences updated successfully', updatedUser);
};

export const updateUserLocation = async (req: Request, res: Response) => {
  const input: UpdateUserLocationRequest = validate(updateUserLocationSchema, req);
  const userId = req.payload.user.id;
  const updatedUser = await updateUserLocationService(userId, input.body);
  sendSuccess(res, 'User location updated successfully', updatedUser);
};

export const updateUserAvailability = async (req: Request, res: Response) => {
  const input: UpdateUserAvailabilityRequest = validate(updateUserAvailabilitySchema, req);
  const userId = req.payload.user.id;
  const updatedUser = await updateUserAvailabilityService(userId, input.body);
  sendSuccess(res, 'User availability updated successfully', updatedUser);
};

export const registerPushToken = async (req: Request, res: Response) => {
  const input: RegisterPushTokenRequest = validate(savePushTokenSchema, req);
  const userId = req.payload.user.id;
  await registerPushTokenService(userId, input.body);
  sendSuccess(res, 'Push token registered successfully', {
    message: 'Push token registered successfully',
  });
};

export const removePushToken = async (req: Request, res: Response) => {
  const input: RemovePushTokenRequest = validate(removePushTokenSchema, req);
  const userId = req.payload.user.id;
  await removePushTokenService(userId, input.body);
  sendSuccess(res, 'Push token removed successfully', {
    message: 'Push token removed successfully',
  });
};

export const getPublicUserProfile = async (req: Request, res: Response) => {
  const input: GetPublicUserProfileRequest = validate(getPublicUserProfileSchema, req);
  const user = await getPublicUserProfileService(input.params.id);
  sendSuccess(res, 'Public user profile retrieved successfully', user);
};
