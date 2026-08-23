import {
  EmployerRegisterRequest,
  EmployerVerifyOTPResponse,
  EmployerVerifyRegisterRequest,
  EmpployerSendOTPRequest,
  EmpployerVerifyOTPRequest,
  TokenRefreshResponse,
  UserRegisterRequest,
  UserSendOTPRequest,
  UserVerifyOTPRequest,
  UserVerifyRegisterRequest,
} from '@repo/types';
import {
  employerRegisterSchema,
  employerSendOtpSchema,
  employerVerifyOtpSchema,
  employerVerifyRegisterSchema,
  userRegisterSchema,
  userSendOtpSchema,
  userVerifyOtpSchema,
  userVerifyRegisterSchema,
} from '@repo/validator/shared';
import { Request, Response } from 'express';
import { AppError } from '../utils/api-error';
import { ROLES } from '../utils/constants';
import { sendSuccess } from '../utils/send-success';
import { validate } from '../utils/validate';
import { clearAuthCookies, setAuthCookies } from './auth-cookies';
import {
  generateRefreshTokenService,
  registerEmployerService,
  registerUserService,
  sendEmployerOtpService,
  sendUserOtpService,
  verifyEmployerOtpService,
  verifyEmployerRegistrationOtpService,
  verifyUserOtpService,
  verifyUserRegistrationOtpService,
} from './auth-service';

const registerUser = async (req: Request, res: Response) => {
  const registerInput: UserRegisterRequest = validate(userRegisterSchema, req);
  await registerUserService(registerInput.body);
  sendSuccess(res, `OTP sent to ${registerInput.body.phone_no}`, null, 200);
};

const verifyRegisteredUser = async (req: Request, res: Response) => {
  const registerInput: UserVerifyRegisterRequest = validate(userVerifyRegisterSchema, req);
  const response = await verifyUserRegistrationOtpService(registerInput.body);
  const { accessToken, user, refreshToken } = response;
  setAuthCookies(res, accessToken, refreshToken, ROLES.USER);
  sendSuccess(res, 'User Created', { accessToken, user, refreshToken }, 201);
};

const sendUserOtp = async (req: Request, res: Response) => {
  const input: UserSendOTPRequest = validate(userSendOtpSchema, req);
  await sendUserOtpService(input.body);
  sendSuccess(res, 'OTP sent successfully to phone', null, 200);
};

const verifyUserOtp = async (req: Request, res: Response) => {
  const input: UserVerifyOTPRequest = validate(userVerifyOtpSchema, req);
  const response = await verifyUserOtpService(input.body);
  const { accessToken, user, refreshToken } = response;
  setAuthCookies(res, accessToken, refreshToken, ROLES.USER);
  sendSuccess(res, 'User login successful', { user, accessToken, refreshToken }, 200);
};

const registerEmployer = async (req: Request, res: Response) => {
  const registerInput: EmployerRegisterRequest = validate(employerRegisterSchema, req);
  await registerEmployerService(registerInput.body);
  sendSuccess(res, 'Org Created', `OTP sent to ${registerInput.body.email}`, 201);
};

const verifyRegisteredEmployer = async (req: Request, res: Response) => {
  const registerInput: EmployerVerifyRegisterRequest = validate(employerVerifyRegisterSchema, req);
  const response = await verifyEmployerRegistrationOtpService(registerInput.body);
  const { accessToken, employer, refreshToken } = response;
  setAuthCookies(res, accessToken, refreshToken, ROLES.EMPLOYER);
  sendSuccess(res, 'Employer Created', { accessToken, employer, refreshToken }, 201);
};

const sendEmployerOtp = async (req: Request, res: Response) => {
  const input: EmpployerSendOTPRequest = validate(employerSendOtpSchema, req);
  await sendEmployerOtpService(input.body);
  sendSuccess(res, 'OTP sent successfully to email', null, 200);
};

const verifyEmployerOtp = async (req: Request, res: Response) => {
  const input: EmpployerVerifyOTPRequest = validate(employerVerifyOtpSchema, req);
  const response = await verifyEmployerOtpService(input.body);
  const { accessToken, employer, refreshToken } = response;

  setAuthCookies(res, accessToken, refreshToken, ROLES.EMPLOYER);
  sendSuccess<EmployerVerifyOTPResponse>(
    res,
    'Employer login successful',
    { employer, accessToken, refreshToken },
    200,
  );
};

const logout = async (req: Request, res: Response) => {
  clearAuthCookies(res);
  sendSuccess(res, 'Logout successful', null, 200);
};

const userTokenRefresh = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  let oldRefreshToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;

  if (!oldRefreshToken && req.cookies?.kbdl_user_refresh) {
    oldRefreshToken = req.cookies.kbdl_user_refresh;
  }
  if (!oldRefreshToken && req.cookies?.refreshToken) {
    oldRefreshToken = req.cookies.refreshToken;
  }

  if (!oldRefreshToken) {
    throw new AppError(401, 'NO_REFRESH_TOKEN', 'No refresh token provided');
  }

  const response = await generateRefreshTokenService(oldRefreshToken);
  const { accessToken, user, refreshToken } = response;

  setAuthCookies(res, accessToken, refreshToken, ROLES.USER);
  sendSuccess<TokenRefreshResponse>(
    res,
    'Token Refreshed',
    { user, accessToken, refreshToken } as any,
    200,
  );
};

const employerTokenRefresh = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  let oldRefreshToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;

  if (!oldRefreshToken && req.cookies?.kbdl_employer_refresh) {
    oldRefreshToken = req.cookies.kbdl_employer_refresh;
  }
  if (!oldRefreshToken && req.cookies?.refreshToken) {
    oldRefreshToken = req.cookies.refreshToken;
  }
  if (!oldRefreshToken) {
    throw new AppError(401, 'NO_REFRESH_TOKEN', 'No refresh token provided');
  }

  const response = await generateRefreshTokenService(oldRefreshToken);
  const { accessToken, employer, refreshToken } = response;

  setAuthCookies(res, accessToken, refreshToken, ROLES.EMPLOYER);
  sendSuccess<TokenRefreshResponse>(
    res,
    'Token Refreshed',
    { employer, accessToken, refreshToken } as any,
    200,
  );
};

export {
  clearAuthCookies,
  employerTokenRefresh,
  logout,
  registerEmployer as registerOrg,
  registerUser,
  sendEmployerOtp,
  sendUserOtp,
  setAuthCookies,
  userTokenRefresh,
  verifyEmployerOtp,
  verifyRegisteredEmployer,
  verifyRegisteredUser,
  verifyUserOtp,
};
