import { Employer, prisma, User } from "@repo/db/server";
import {
  EmployerRegisterPayload,
  UserRegisterPayload,
  UserVerifyRegisterPayload
} from "@repo/types";
import { env } from "@repo/validator/server";
import jwt from "jsonwebtoken";
import { resendClient } from "../config/resend";
import { AppError } from "../utils/api-error";

const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOtpEmail = async (email: string, otp: string): Promise<void> => {
  try {
    const { data, error } = await resendClient.emails.send({
      from: 'Kaam Badlo <itsupport@kaambadlo.com>',
      to: email,
      subject: 'Your Verification Code',
      html: `<p>Your OTP for logging in is: <strong>${otp}</strong></p><p>Please do not share this code with anyone.</p>`,
    });

    if (error) {
      throw new Error(error.message);
    }

    console.log(`OTP email sent successfully to ${email}. ID: ${data?.id}`);

  } catch (error: any) {
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }
};
export const registerOrgService = async (
  payload: EmployerRegisterPayload
): Promise<Employer> => {
  const existingOrg = await prisma.employer.findFirst({
    where: { OR: [{ email: payload.email }, { phone_no: payload.phone_no }] },
  });

  if (existingOrg) {
    throw new AppError(409, "EMPLOYER_EXISTS", "Employer with this email or phone already exists");
  }

  const newEmployer = await prisma.employer.create({
    data: {
      company_name: payload.company_name,
      email: payload.email,
      phone_no: payload.phone_no,
      company_address: payload.company_address,
      gst_number: payload.gst_number,
      subscription_tier: payload.subscription_tier,
    },
  });

  return newEmployer;
};


// 1. Step One: Send OTP for Registration
export const registerUserService = async (
  payload: UserRegisterPayload
): Promise<null> => {
  const { phone_no, name, preferences } = payload;

  // 1. Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { phone_no } });
  if (existingUser) {
    throw new AppError(409, "USER_EXISTS", "User already exists. Please login.");
  }

  const otp = "123456"; // TODO: generateOtp()
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  // 2. Temporarily save details WITH the OTP
  await prisma.otpVerification.upsert({
    where: { phone_no },
    update: { otp, expires_at: expiresAt, name, preferences: preferences },
    create: { phone_no, otp, expires_at: expiresAt, name, preferences: preferences },
  });

  // TODO: sendOtpSMS(phone, otp);;
  return null;
};

// 2. Step Two: Verify OTP and Create User
export const verifyRegistrationOtpService = async (
  payload: UserVerifyRegisterPayload
): Promise<{ accessToken: string; user: User; refreshToken: string }> => {
  const { phone_no, otp } = payload;

  const otpRecord = await prisma.otpVerification.findUnique({ where: { phone_no: phone_no } });

  if (!otpRecord || otpRecord.otp !== otp || new Date() > otpRecord.expires_at) {
    throw new AppError(400, "INVALID_OR_EXPIRED_OTP", "Invalid or expired OTP");
  }

  // 3. OTP is valid! NOW create the actual user.
  const newUser = await prisma.user.create({
    data: {
      phone_no: phone_no,
      name: otpRecord.name,
      preferences: otpRecord.preferences as any,
    },
  });

  await prisma.otpVerification.delete({ where: { phone_no: phone_no } });

  // 4. Generate JWTs
  const accessToken = jwt.sign({ id: newUser.id, role: "USER" }, env.JWT_ACCESS_SECRET);
  const refreshToken = jwt.sign({ id: newUser.id, role: "USER" }, env.JWT_REFRESH_SECRET);

  const finalUser = await prisma.user.update({
    where: { id: newUser.id },
    data: { refresh_token: refreshToken },
  });

  return { accessToken, user: finalUser, refreshToken };
};

export const sendUserOtpService = async (
  payload: { phone: string }
): Promise<null> => {
  const { phone } = payload;

  const existingUser = await prisma.user.findUnique({ where: { phone_no: phone } });
  if (!existingUser) {
    throw new AppError(404, "NON_EXISTENT_USER", "User not found. Please register first.");
  }
  //TODO:in prod uncomment this
  // const otp = generateOtp();
  const otp = "123456";
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

  await prisma.otpVerification.upsert({
    where: { phone_no: phone },
    update: { otp, expires_at: expiresAt },
    create: { phone_no: phone, otp, expires_at: expiresAt },
  });
  // TODO: Uncomment this
  // await sendOtpSMS(phone, otp);

  return null;
};

export const verifyUserOtpService = async (
  payload: { phone: string; otp: string }
): Promise<{ accessToken: string; user: User; refreshToken: string }> => {
  const { phone, otp } = payload;

  const otpRecord = await prisma.otpVerification.findUnique({
    where: { phone_no: phone },
  });

  if (!otpRecord) {
    throw new AppError(400, "INVALID_OTP", "No OTP found for this number");
  }

  if (new Date() > otpRecord.expires_at) {
    await prisma.otpVerification.delete({ where: { phone_no: phone } });
    throw new AppError(400, "EXPIRED_OTP", "OTP has expired");
  }

  if (otpRecord.otp !== otp) {
    throw new AppError(401, "INVALID_OTP", "Incorrect OTP");
  }

  await prisma.otpVerification.delete({ where: { phone_no: phone } });

  const existingUser = await prisma.user.findUnique({
    where: { phone_no: phone },
  });

  if (!existingUser) {
    throw new AppError(404, "NON_EXISTENT_USER", "User not found");
  }

  const accessToken = jwt.sign({ id: existingUser.id, role: "USER" }, env.JWT_ACCESS_SECRET as string, {
    expiresIn: env.JWT_ACCESS_EXPIRY as any,
  });

  const refreshToken = jwt.sign({ id: existingUser.id, role: "USER" }, env.JWT_REFRESH_SECRET as string, {
    expiresIn: env.JWT_REFRESH_EXPIRY as any,
  });

  const user = await prisma.user.update({
    where: { id: existingUser.id },
    data: { refresh_token: refreshToken },
  });

  return { accessToken, user, refreshToken };
};

export const sendEmployerOtpService = async (
  payload: { email: string }
): Promise<null> => {
  const { email } = payload;

  const existingEmployer = await prisma.employer.findUnique({ where: { email } });
  if (!existingEmployer) {
    throw new AppError(404, "NON_EXISTENT_EMPLOYER", "Employer not found. Please register first.");
  }
  // TODO: remove this in prod
  // const otp = generateOtp();
  const otp = "123456";

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

  await prisma.otpVerification.upsert({
    where: { email: email },
    update: { otp, expires_at: expiresAt },
    create: { email: email, otp, expires_at: expiresAt },
  });
  // TODO: remove this in prod
  // await sendOtpEmail(email, otp);

  return null;
};

export const verifyEmployerOtpService = async (
  payload: { email: string; otp: string }
): Promise<{ accessToken: string; employer: Employer; refreshToken: string }> => {
  const { email, otp } = payload;

  const otpRecord = await prisma.otpVerification.findUnique({
    where: { email: email },
  });

  if (!otpRecord) {
    throw new AppError(400, "INVALID_OTP", "No OTP found for this email");
  }

  if (new Date() > otpRecord.expires_at) {
    await prisma.otpVerification.delete({ where: { email: email } });
    throw new AppError(400, "EXPIRED_OTP", "OTP has expired");
  }

  if (otpRecord.otp !== otp) {
    throw new AppError(401, "INVALID_OTP", "Incorrect OTP");
  }

  await prisma.otpVerification.delete({ where: { email: email } });

  const existingEmployer = await prisma.employer.findUnique({
    where: { email: email },
  });

  if (!existingEmployer) {
    throw new AppError(404, "NON_EXISTENT_EMPLOYER", "Employer not found");
  }

  const accessToken = jwt.sign({ id: existingEmployer.id, role: "ORGANIZATION" }, env.JWT_ACCESS_SECRET as string, {
    expiresIn: env.JWT_ACCESS_EXPIRY as any,
  });

  const refreshToken = jwt.sign({ id: existingEmployer.id, role: "ORGANIZATION" }, env.JWT_REFRESH_SECRET as string, {
    expiresIn: env.JWT_REFRESH_EXPIRY as any,
  });

  const employer = await prisma.employer.update({
    where: { id: existingEmployer.id },
    data: { refresh_token: refreshToken },
  });

  return { accessToken, employer, refreshToken };
};

export const generateRefreshTokenService = async (
  oldRefreshToken: string
): Promise<{ accessToken: string; refreshToken: string; user?: User; employer?: Employer }> => {
  try {
    const decoded = jwt.verify(oldRefreshToken, env.JWT_REFRESH_SECRET as string) as { id: string; role: string };

    if (decoded.role === "USER") {
      const existingUser = await prisma.user.findUnique({ where: { id: decoded.id } });

      if (!existingUser || existingUser.refresh_token !== oldRefreshToken) {
        throw new AppError(401, "INVALID_TOKEN", "Invalid refresh token");
      }

      const accessToken = jwt.sign({ id: existingUser.id, role: "USER" }, env.JWT_ACCESS_SECRET as string, { expiresIn: env.JWT_ACCESS_EXPIRY as any });
      const newRefreshToken = jwt.sign({ id: existingUser.id, role: "USER" }, env.JWT_REFRESH_SECRET as string, { expiresIn: env.JWT_REFRESH_EXPIRY as any });

      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: { refresh_token: newRefreshToken },
      });

      return { accessToken, refreshToken: newRefreshToken, user: updatedUser };

    } else if (decoded.role === "ORGANIZATION") {
      const existingEmployer = await prisma.employer.findUnique({ where: { id: decoded.id } });

      if (!existingEmployer || existingEmployer.refresh_token !== oldRefreshToken) {
        throw new AppError(401, "INVALID_TOKEN", "Invalid refresh token");
      }

      const accessToken = jwt.sign({ id: existingEmployer.id, role: "ORGANIZATION" }, env.JWT_ACCESS_SECRET as string, { expiresIn: env.JWT_ACCESS_EXPIRY as any });
      const newRefreshToken = jwt.sign({ id: existingEmployer.id, role: "ORGANIZATION" }, env.JWT_REFRESH_SECRET as string, { expiresIn: env.JWT_REFRESH_EXPIRY as any });

      const updatedEmployer = await prisma.employer.update({
        where: { id: existingEmployer.id },
        data: { refresh_token: newRefreshToken },
      });

      return { accessToken, refreshToken: newRefreshToken, employer: updatedEmployer };

    } else {
      throw new AppError(401, "INVALID_ROLE", "Invalid role in token");
    }

  } catch (error) {
    throw new AppError(401, "INVALID_TOKEN", "Session expired or invalid token");
  }
};