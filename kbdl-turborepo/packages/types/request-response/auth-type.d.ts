import { Employer, User } from "@repo/db/server";
import { employerRegisterSchema, employerSendOtpSchema, employerVerifyOtpSchema, userRegisterSchema, userSendOtpSchema, userVerifyOtpSchema, userVerifyRegisterSchema } from "@repo/validator/shared";
import z from "zod";
export type UserRegisterRequest = z.infer<typeof userRegisterSchema>;
export type UserRegisterPayload = z.infer<typeof userRegisterSchema>["body"];
export type UserVerifyRegisterRequest = z.infer<typeof userVerifyRegisterSchema>;
export type UserVerifyRegisterPayload = z.infer<typeof userVerifyRegisterSchema>["body"];
export type UserVerifyRegisterResponse = User;
export type EmployerRegisterRequest = z.infer<typeof employerRegisterSchema>;
export type EmployerRegisterPayload = z.infer<typeof employerRegisterSchema>["body"];
export type EmployerRegisterResponse = Employer;
export type UserSendOTPRequest = z.infer<typeof userSendOtpSchema>;
export type UserSendOTPResponse = null;
export type UserVerifyOTPRequest = z.infer<typeof userVerifyOtpSchema>;
export type UserVerifyOTPResponse = {
    usre: User;
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
//# sourceMappingURL=auth-type.d.ts.map