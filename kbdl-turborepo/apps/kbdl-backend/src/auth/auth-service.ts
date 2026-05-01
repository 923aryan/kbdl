import { Employer, prisma, User } from "@repo/db/server";
import { env } from "@repo/validator/server";
import * as https from "https";
import jwt from "jsonwebtoken";
import {
  EmployerRegisterPayload,
  UserRegisterPayload
} from "../../../../packages/types/request-response/auth-type";
import { AppError } from "../utils/api-error";

const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendSmsViaMsg91 = (phone: string, otp: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'POST',
      hostname: 'control.msg91.com',
      path: '/api/v5/flow',
      headers: {
        accept: 'application/json',
        authkey: env.MSG91_AUTH_KEY as string,
        'content-type': 'application/json'
      }
    };

    const req = https.request(options, function (res) {
      const chunks: any[] = [];
      res.on('data', function (chunk) { chunks.push(chunk); });
      res.on('end', function () {
        const body = Buffer.concat(chunks).toString();
        try {
          const response = JSON.parse(body);
          if (response.type === "error") {
            return reject(new Error(response.message));
          }
          resolve();
        } catch (e) {
          resolve();
        }
      });
    });

    req.on('error', (e) => reject(e));

    const mobileWithCountryCode = `91${phone}`;

    req.write(JSON.stringify({
      template_id: env.MSG91_SMS_TEMPLATE_ID,
      short_url: "0",
      recipients: [
        {
          mobiles: mobileWithCountryCode,
          VAR1: otp
        }
      ]
    }));
    req.end();
  });
};

const sendEmailViaMsg91 = (email: string, otp: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'POST',
      hostname: 'control.msg91.com',
      path: '/api/v5/email/send',
      headers: {
        accept: 'application/json',
        authkey: env.MSG91_AUTH_KEY as string,
        'content-type': 'application/json'
      }
    };

    const req = https.request(options, function (res) {
      const chunks: any[] = [];
      res.on('data', function (chunk) { chunks.push(chunk); });
      res.on('end', function () {
        const body = Buffer.concat(chunks).toString();
        try {
          const response = JSON.parse(body);
          if (response.hasError) {
            return reject(new Error(response.message || "Failed to send email"));
          }
          resolve();
        } catch (e) {
          resolve();
        }
      });
    });

    req.on('error', (e) => reject(e));

    const postData = JSON.stringify({
      recipients: [
        {
          to: [
            {
              email: email
            }
          ],
          variables: {
            OTP: otp
          }
        }
      ],
      from: {
        name: env.MSG91_EMAIL_FROM_NAME as string || "Admin",
        email: env.MSG91_EMAIL_FROM_EMAIL as string
      },
      domain: env.MSG91_EMAIL_DOMAIN as string,
      template_id: env.MSG91_EMAIL_TEMPLATE_ID as string
    });

    req.write(postData);
    req.end();
  });
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

export const registerUserService = async (
  payload: UserRegisterPayload
): Promise<User> => {
  const existingUser = await prisma.user.findUnique({
    where: { phone_no: payload.phone_no },
  });

  if (existingUser) {
    throw new AppError(409, "USER_EXISTS", "User with this phone number already exists");
  }

  const newUser = await prisma.user.create({
    data: {
      name: payload.name,
      phone_no: payload.phone_no,
      karigari_id: payload.karigari_id,
      default_address: payload.default_address,
      skills: payload.skills,
      experience: payload.experience,
      city: payload.city,
      area: payload.area,
      extra_shift: payload.extra_shift,
    },
  });

  return newUser;
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
  // await sendSmsViaMsg91(phone, otp);

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

  const accessToken = jwt.sign({ userId: existingUser.id, role: "USER" }, env.JWT_ACCESS_SECRET as string, {
    expiresIn: env.JWT_ACCESS_EXPIRY as any,
  });

  const refreshToken = jwt.sign({ userId: existingUser.id, role: "USER" }, env.JWT_REFRESH_SECRET as string, {
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
  // await sendEmailViaMsg91(email, otp);

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

  const accessToken = jwt.sign({ userId: existingEmployer.id, role: "EMPLOYER" }, env.JWT_ACCESS_SECRET as string, {
    expiresIn: env.JWT_ACCESS_EXPIRY as any,
  });

  const refreshToken = jwt.sign({ userId: existingEmployer.id, role: "EMPLOYER" }, env.JWT_REFRESH_SECRET as string, {
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
    const decoded = jwt.verify(oldRefreshToken, env.JWT_REFRESH_SECRET as string) as { userId: string; role: string };

    if (decoded.role === "USER") {
      const existingUser = await prisma.user.findUnique({ where: { id: decoded.userId } });

      if (!existingUser || existingUser.refresh_token !== oldRefreshToken) {
        throw new AppError(401, "INVALID_TOKEN", "Invalid refresh token");
      }

      const accessToken = jwt.sign({ userId: existingUser.id, role: "USER" }, env.JWT_ACCESS_SECRET as string, { expiresIn: env.JWT_ACCESS_EXPIRY as any });
      const newRefreshToken = jwt.sign({ userId: existingUser.id, role: "USER" }, env.JWT_REFRESH_SECRET as string, { expiresIn: env.JWT_REFRESH_EXPIRY as any });

      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: { refresh_token: newRefreshToken },
      });

      return { accessToken, refreshToken: newRefreshToken, user: updatedUser };

    } else if (decoded.role === "EMPLOYER") {
      const existingEmployer = await prisma.employer.findUnique({ where: { id: decoded.userId } });

      if (!existingEmployer || existingEmployer.refresh_token !== oldRefreshToken) {
        throw new AppError(401, "INVALID_TOKEN", "Invalid refresh token");
      }

      const accessToken = jwt.sign({ userId: existingEmployer.id, role: "EMPLOYER" }, env.JWT_ACCESS_SECRET as string, { expiresIn: env.JWT_ACCESS_EXPIRY as any });
      const newRefreshToken = jwt.sign({ userId: existingEmployer.id, role: "EMPLOYER" }, env.JWT_REFRESH_SECRET as string, { expiresIn: env.JWT_REFRESH_EXPIRY as any });

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