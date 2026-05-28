import { Router } from 'express';

import { authenticate } from '../middleware/auth-middleware';
import { ROLES } from '../utils/constants';

import {
  deleteEmployerProfile,
  deleteUserProfile,
  getCurrentEmployerProfile,
  getCurrentUserProfile,
  getEmployerVerificationStatus,
  getPublicEmployerProfile,
  getPublicUserProfile,
  registerPushToken,
  removePushToken,
  updateEmployerLocation,
  updateEmployerPreferences,
  updateEmployerProfile,
  updateUserAvailability,
  updateUserLocation,
  updateUserPreferences,
  updateUserProfile,
  updateUserSkills,
  uploadEmployerDocuments,
} from './profile-controller';

const profileRouter: Router = Router();

profileRouter.get('/users/me', authenticate([ROLES.USER]), getCurrentUserProfile);

profileRouter.patch('/users/me', authenticate([ROLES.USER]), updateUserProfile);

profileRouter.delete('/users/me', authenticate([ROLES.USER]), deleteUserProfile);

profileRouter.patch('/users/me/skills', authenticate([ROLES.USER]), updateUserSkills);

profileRouter.patch('/users/me/preferences', authenticate([ROLES.USER]), updateUserPreferences);

profileRouter.patch('/users/me/location', authenticate([ROLES.USER]), updateUserLocation);

profileRouter.patch('/users/me/availability', authenticate([ROLES.USER]), updateUserAvailability);

profileRouter.post('/users/me/push-token', authenticate([ROLES.USER]), registerPushToken);

profileRouter.delete('/users/me/push-token', authenticate([ROLES.USER]), removePushToken);

profileRouter.get(
  '/users/:id',
  authenticate([ROLES.USER, ROLES.EMPLOYER, ROLES.ADMIN]),
  getPublicUserProfile,
);

profileRouter.get('/employers/me', authenticate([ROLES.EMPLOYER]), getCurrentEmployerProfile);

profileRouter.patch('/employers/me', authenticate([ROLES.EMPLOYER]), updateEmployerProfile);

profileRouter.delete('/employers/me', authenticate([ROLES.EMPLOYER]), deleteEmployerProfile);

profileRouter.patch(
  '/employers/me/preferences',
  authenticate([ROLES.EMPLOYER]),
  updateEmployerPreferences,
);

profileRouter.patch(
  '/employers/me/location',
  authenticate([ROLES.EMPLOYER]),
  updateEmployerLocation,
);

profileRouter.post(
  '/employers/me/documents',
  authenticate([ROLES.EMPLOYER]),
  uploadEmployerDocuments,
);

profileRouter.get(
  '/employers/me/verification-status',
  authenticate([ROLES.EMPLOYER], true),
  getEmployerVerificationStatus,
);

profileRouter.get(
  '/employers/:id',
  authenticate([ROLES.USER, ROLES.EMPLOYER, ROLES.ADMIN]),
  getPublicEmployerProfile,
);

export default profileRouter;
