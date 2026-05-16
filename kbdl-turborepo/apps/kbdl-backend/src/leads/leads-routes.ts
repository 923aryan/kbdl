import { Router } from 'express';
import { authenticate } from '../middleware/auth-middleware';
import { ROLES } from '../utils/constants';

import { createLead, deleteLead, getAllLeads, getLeadById, resolveLead } from './leads-controllers';

const leadRouter: Router = Router();

// Public
leadRouter.post('/', createLead);

// Admin
leadRouter.get('/', authenticate([ROLES.ADMIN]), getAllLeads);

leadRouter.get('/:id', authenticate([ROLES.ADMIN]), getLeadById);

leadRouter.patch('/:id/resolve', authenticate([ROLES.ADMIN]), resolveLead);

leadRouter.delete('/:id', authenticate([ROLES.ADMIN]), deleteLead);

export default leadRouter;
