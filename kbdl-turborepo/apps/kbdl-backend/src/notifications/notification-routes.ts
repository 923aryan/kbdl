import { Router } from 'express';
import { authenticate } from '../middleware/auth-middleware';
import { ROLES } from '../utils/constants';
import {
  clearPushToken,
  getNotifications,
  markNotificationRead,
  savePushToken,
} from './notification-ontroller';

const notificationRouter: Router = Router();

// --- Notification Routes ---
notificationRouter.post('/push-token', authenticate([ROLES.USER]), savePushToken);
notificationRouter.get('/', authenticate([ROLES.USER]), getNotifications);
notificationRouter.patch('/read', authenticate([ROLES.USER]), markNotificationRead);
notificationRouter.patch('/push-token', authenticate([ROLES.USER]), clearPushToken);

export default notificationRouter;
