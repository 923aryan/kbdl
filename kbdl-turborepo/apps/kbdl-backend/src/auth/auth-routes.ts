import { Router } from 'express';
import {
  employerTokenRefresh,
  logout,
  registerOrg,
  registerUser,
  sendEmployerOtp,
  sendUserOtp,
  userTokenRefresh,
  verifyEmployerOtp,
  verifyRegisteredEmployer,
  verifyRegisteredUser,
  verifyUserOtp,
} from './auth-controller';

const authRouter: Router = Router();

// --- Registration Routes ---
authRouter.post('/register/user', registerUser);
authRouter.post('/register/user/verify', verifyRegisteredUser);
authRouter.post('/register/employer', registerOrg);
authRouter.post('/register/employer/verify', verifyRegisteredEmployer);

// --- User Auth Routes (Phone OTP) ---
authRouter.post('/user/send-otp', sendUserOtp);
authRouter.post('/user/verify-otp', verifyUserOtp);
authRouter.post('/user/token-refresh', userTokenRefresh);

// --- Employer Auth Routes (Email OTP) ---
authRouter.post('/employer/send-otp', sendEmployerOtp);
authRouter.post('/employer/verify-otp', verifyEmployerOtp);
authRouter.post('/employer/token-refresh', employerTokenRefresh);

// --- Shared Routes ---
// Handles clearing cookies for both Users and Employers on the web
authRouter.post('/logout', logout);

export default authRouter;
