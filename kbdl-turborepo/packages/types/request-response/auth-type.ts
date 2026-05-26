import { Employer, User } from '@repo/db/server';
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
import z from 'zod';
export type UserRegisterRequest = z.infer<typeof userRegisterSchema>;
export type UserRegisterPayload = z.infer<typeof userRegisterSchema>['body'];
export type UserVerifyRegisterRequest = z.infer<typeof userVerifyRegisterSchema>;
export type UserVerifyRegisterPayload = z.infer<typeof userVerifyRegisterSchema>['body'];
export type UserVerifyRegisterResponse = User;

export type EmployerRegisterRequest = z.infer<typeof employerRegisterSchema>;
export type EmployerRegisterPayload = z.infer<typeof employerRegisterSchema>['body'];
export type EmployerVerifyRegisterRequest = z.infer<typeof employerVerifyRegisterSchema>;
export type EmployerVerifyRegisterPayload = z.infer<typeof employerVerifyRegisterSchema>['body'];
export type EmployerVerifyRegisterResponse = Employer;

export type UserSendOTPRequest = z.infer<typeof userSendOtpSchema>;
export type UserSendOTPResponse = null;
export type UserVerifyOTPRequest = z.infer<typeof userVerifyOtpSchema>;
export type UserVerifyOTPPayload = z.infer<typeof userVerifyOtpSchema>['body'];
export type UserVerifyOTPResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
};
export type EmpployerSendOTPRequest = z.infer<typeof employerSendOtpSchema>;
export type EmployerSendOTPResponse = null;
export type EmpployerVerifyOTPRequest = z.infer<typeof employerVerifyOtpSchema>;
export type EmployerVerifyOTPResponse = {
  employer: Employer;
  accessToken: string;
  refreshToken: string;
};

export type LogoutResponse = null;

export type TokenRefreshResponse = {
  accessToken: string;
  refreshToken: string;
};
