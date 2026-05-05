import {
  EmployerRegisterRequest,
  EmployerRegisterResponse,
  EmployerVerifyOTPResponse,
  EmpployerSendOTPRequest,
  EmpployerVerifyOTPRequest,
  TokenRefreshResponse,
  UserRegisterRequest,
  UserSendOTPRequest,
  UserVerifyOTPRequest,
  UserVerifyRegisterRequest
} from "@repo/types";
import { env } from "@repo/validator/server";
import {
  employerRegisterSchema,
  employerSendOtpSchema,
  employerVerifyOtpSchema,
  userRegisterSchema,
  userSendOtpSchema,
  userVerifyOtpSchema,
  userVerifyRegisterSchema
} from "@repo/validator/shared";
import { Request, Response } from "express";
import { AppError } from "../utils/api-error";
import { sendSuccess } from "../utils/send-success";
import { validate } from "../utils/validate";
import { generateRefreshTokenService, registerOrgService, registerUserService, sendEmployerOtpService, sendUserOtpService, verifyEmployerOtpService, verifyRegistrationOtpService, verifyUserOtpService } from "./auth-service";



const registerOrg = async (req: Request, res: Response) => {
  const registerInput: EmployerRegisterRequest = validate(employerRegisterSchema, req);
  const org: EmployerRegisterResponse = await registerOrgService(registerInput.body);
  sendSuccess(res, "Org Created", org, 201);
};

const registerUser = async (req: Request, res: Response) => {
  const registerInput: UserRegisterRequest = validate(userRegisterSchema, req);
  await registerUserService(registerInput.body);
  sendSuccess(res, `OTP sent to ${registerInput.body.phone_no}`, null, 200);
};

const verifyRegisteredUser = async (req: Request, res: Response) => {
  const registerInput: UserVerifyRegisterRequest = validate(userVerifyRegisterSchema, req);
  const response = await verifyRegistrationOtpService(registerInput.body);
  const { accessToken, user, refreshToken } = response;
  setAuthCookies(res, accessToken, refreshToken);
  sendSuccess(res, "User Created", { accessToken, user, refreshToken }, 201);
};

const sendUserOtp = async (req: Request, res: Response) => {
  const input: UserSendOTPRequest = validate(userSendOtpSchema, req);
  await sendUserOtpService(input.body);
  sendSuccess(res, "OTP sent successfully to phone", null, 200);
};

const verifyUserOtp = async (req: Request, res: Response) => {
  const input: UserVerifyOTPRequest = validate(userVerifyOtpSchema, req);
  const response = await verifyUserOtpService(input.body);
  const { accessToken, user, refreshToken } = response;
  setAuthCookies(res, accessToken, refreshToken);
  sendSuccess(res, "User login successful", { user, accessToken, refreshToken }, 200);
};

const sendEmployerOtp = async (req: Request, res: Response) => {
  const input: EmpployerSendOTPRequest = validate(employerSendOtpSchema, req);
  await sendEmployerOtpService(input.body);
  sendSuccess(res, "OTP sent successfully to email", null, 200);
};

const verifyEmployerOtp = async (req: Request, res: Response) => {
  const input: EmpployerVerifyOTPRequest = validate(employerVerifyOtpSchema, req);
  const response = await verifyEmployerOtpService(input.body);
  const { accessToken, employer, refreshToken } = response;

  setAuthCookies(res, accessToken, refreshToken);
  sendSuccess<EmployerVerifyOTPResponse>(res, "Employer login successful", { employer, accessToken, refreshToken }, 200);
};


const logout = async (req: Request, res: Response) => {
  clearAuthCookies(res);
  sendSuccess(res, "Logout successful", null, 200);
};

const userTokenRefresh = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  let oldRefreshToken = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : undefined;

  if (!oldRefreshToken && req.cookies?.refreshToken) {
    oldRefreshToken = req.cookies.refreshToken;
  }

  if (!oldRefreshToken) {
    throw new AppError(401, "NO_REFRESH_TOKEN", "No refresh token provided");
  }

  const response = await generateRefreshTokenService(oldRefreshToken);
  const { accessToken, user, refreshToken } = response;

  setAuthCookies(res, accessToken, refreshToken);
  sendSuccess<TokenRefreshResponse>(res, "Token Refreshed", { user, accessToken, refreshToken } as any, 200);
};

const employerTokenRefresh = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  let oldRefreshToken = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : undefined;

  if (!oldRefreshToken && req.cookies?.refreshToken) {
    oldRefreshToken = req.cookies.refreshToken;
  }

  if (!oldRefreshToken) {
    throw new AppError(401, "NO_REFRESH_TOKEN", "No refresh token provided");
  }

  const response = await generateRefreshTokenService(oldRefreshToken);
  const { accessToken, employer, refreshToken } = response;

  setAuthCookies(res, accessToken, refreshToken);
  sendSuccess<TokenRefreshResponse>(res, "Token Refreshed", { employer, accessToken, refreshToken } as any, 200);
};

const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 24 * 60 * 60 * 1000,
  });
};

const clearAuthCookies = (res: Response) => {
  res.clearCookie("accessToken", { httpOnly: true, secure: env.NODE_ENV === "production", sameSite: "strict" });
  res.clearCookie("refreshToken", { httpOnly: true, secure: env.NODE_ENV === "production", sameSite: "strict" });
};

export {
  employerTokenRefresh, logout, registerOrg,
  registerUser, sendEmployerOtp, sendUserOtp, userTokenRefresh, verifyEmployerOtp, verifyRegisteredUser, verifyUserOtp
};

