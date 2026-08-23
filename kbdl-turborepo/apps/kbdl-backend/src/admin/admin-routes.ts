import { Router } from 'express';
import { authenticate } from '../middleware/auth-middleware';
import { ROLES } from '../utils/constants';
import {
  getAdminCompany,
  getAdminMe,
  inviteHr,
  listAdminCompanies,
  listHrInvites,
  onboardCompanyFounder,
  patchCompanyStatus,
  revokeHrInvite,
} from './admin-controllers';

const adminRouter: Router = Router();
const adminAuth = authenticate([ROLES.ADMIN]);

adminRouter.get('/me', adminAuth, getAdminMe);
adminRouter.get('/companies', adminAuth, listAdminCompanies);
adminRouter.post('/companies', adminAuth, onboardCompanyFounder);
adminRouter.get('/companies/:companyId', adminAuth, getAdminCompany);
adminRouter.patch('/companies/:companyId/status', adminAuth, patchCompanyStatus);
adminRouter.get('/hr-invites', adminAuth, listHrInvites);
adminRouter.post('/hr-invites', adminAuth, inviteHr);
adminRouter.patch('/hr-invites/:inviteId/revoke', adminAuth, revokeHrInvite);

export default adminRouter;
