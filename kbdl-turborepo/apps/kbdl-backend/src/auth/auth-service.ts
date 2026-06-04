import { Employer, prisma, User } from '@repo/db/server';
import {
  EmployerRegisterPayload,
  UserRegisterPayload,
  UserVerifyRegisterPayload,
} from '@repo/types';
import { env } from '@repo/validator/server';
import jwt from 'jsonwebtoken';
import { resendClient } from '../config/resend';
import { AppError } from '../utils/api-error';
import { OTP_ROLES, ROLES } from '../utils/constants';
import { JwtPayload } from '../utils/jwt-payload';
const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOtpEmail = async (email: string, otp: string): Promise<void> => {
  try {
    const { data, error } = await resendClient.emails.send({
      from: 'Kaam Badlo <itsupport@mail.kaambadlo.com>',

      to: email,

      subject: 'Your Verification Code',

      html: `
          <div
            style="
              background-color: #f5f5f5;
              padding: 40px 20px;
              font-family: Arial, sans-serif;
            "
          >
            <div
              style="
                max-width: 500px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                padding: 40px 30px;
                text-align: center;
                border: 1px solid #e5e5e5;
              "
            >
              <img
                src="https://kaambadlo.com/logo.png"
                alt="Kaam Badlo"
                width="120"
                style="
                  margin-bottom: 24px;
                "
              />

              <h1
                style="
                  margin: 0;
                  font-size: 24px;
                  color: #111827;
                "
              >
                Verify Your Account
              </h1>

              <p
                style="
                  margin-top: 16px;
                  font-size: 16px;
                  color: #4b5563;
                  line-height: 1.6;
                "
              >
                Use the verification code below to continue.
              </p>

              <div
                style="
                  margin: 32px 0;
                  background: #111827;
                  color: white;
                  font-size: 32px;
                  font-weight: bold;
                  letter-spacing: 8px;
                  padding: 18px 24px;
                  border-radius: 10px;
                  display: inline-block;
                "
              >
                ${otp}
              </div>

              <p
                style="
                  margin-top: 10px;
                  font-size: 14px;
                  color: #6b7280;
                "
              >
                This OTP will expire in 5 minutes.
              </p>

              <p
                style="
                  margin-top: 28px;
                  font-size: 13px;
                  color: #9ca3af;
                  line-height: 1.5;
                "
              >
                Please do not share this code with anyone.
              </p>
            </div>
          </div>
        `,
    });

    if (error) {
      throw new Error(error.message);
    }

    console.log(`OTP email sent successfully to ${email}. ID: ${data?.id}`);
  } catch (error: any) {
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }
};

// 1. Step One: Send OTP for Registration
export const registerUserService = async (payload: UserRegisterPayload): Promise<null> => {
  const { phone_no } = payload;

  // 1. Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { phone_no },
  });

  if (existingUser) {
    throw new AppError(409, 'USER_EXISTS', 'User already exists. Please login.');
  }

  const otp = '123456'; // TODO: generateOtp()
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  // 2. Temporarily save registration payload WITH otp
  await prisma.otpVerification.upsert({
    where: {
      phone_no_role: {
        phone_no,
        role: OTP_ROLES.USER_REGISTER,
      },
    },

    update: {
      otp,
      expires_at: expiresAt,

      payload: {
        ...payload,
      },
    },

    create: {
      phone_no,
      otp,
      role: OTP_ROLES.USER_REGISTER,
      expires_at: expiresAt,

      payload: {
        ...payload,
      },
    },
  });

  // TODO: sendOtpSMS(phone_no, otp);

  return null;
};

// 2. Step Two: Verify OTP and Create User
export const verifyUserRegistrationOtpService = async (
  payload: UserVerifyRegisterPayload,
): Promise<{ accessToken: string; user: User; refreshToken: string }> => {
  const { phone_no, otp } = payload;

  const otpRecord = await prisma.otpVerification.findUnique({
    where: {
      phone_no_role: {
        phone_no,
        role: OTP_ROLES.USER_REGISTER,
      },
    },
  });

  if (!otpRecord) {
    throw new AppError(400, 'INVALID_OR_EXPIRED_OTP', 'Invalid or expired OTP');
  }

  if (otpRecord.otp !== otp) {
    throw new AppError(400, 'INVALID_OTP', 'Incorrect OTP');
  }

  if (new Date() > otpRecord.expires_at) {
    await prisma.otpVerification.delete({
      where: {
        phone_no_role: {
          phone_no,
          role: OTP_ROLES.USER_REGISTER,
        },
      },
    });

    throw new AppError(400, 'EXPIRED_OTP', 'OTP has expired');
  }

  // Registration payload stored temporarily
  const pendingUserData = otpRecord.payload as UserRegisterPayload;

  // 3. OTP is valid! NOW create actual user
  const newUser = await prisma.user.create({
    data: {
      phone_no: pendingUserData.phone_no,
      name: pendingUserData.name,
      preferences: pendingUserData.preferences as any,
    },
  });

  // Default notification preference
  await prisma.notificationPreference.create({
    data: {
      user_id: newUser.id,
      shiftSwap: true,
      jobAlert: true,
    },
  });

  // Delete OTP record after successful verification
  await prisma.otpVerification.delete({
    where: {
      phone_no_role: {
        phone_no,
        role: OTP_ROLES.USER_REGISTER,
      },
    },
  });

  // 4. Generate JWTs
  const accessToken = jwt.sign(
    {
      role: ROLES.USER,
      payload: {
        user: {
          id: newUser.id,
          phone_no: newUser.phone_no,
        },
      },
    } as JwtPayload,
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: env.JWT_ACCESS_EXPIRY as any,
    },
  );

  const refreshToken = jwt.sign(
    {
      role: ROLES.USER,
      payload: {
        user: {
          id: newUser.id,
          phone_no: newUser.phone_no,
        },
      },
    } as JwtPayload,
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: env.JWT_REFRESH_EXPIRY as any,
    },
  );

  const finalUser = await prisma.user.update({
    where: { id: newUser.id },
    data: {
      refresh_token: refreshToken,
    },
  });

  return {
    accessToken,
    user: finalUser,
    refreshToken,
  };
};

export const sendUserOtpService = async (payload: { phone: string }): Promise<null> => {
  const { phone } = payload;

  const existingUser = await prisma.user.findUnique({
    where: {
      phone_no: phone,
    },
  });

  if (!existingUser) {
    throw new AppError(404, 'NON_EXISTENT_USER', 'User not found. Please register first.');
  }

  // TODO: uncomment in production
  // const otp = generateOtp();

  const otp = '123456';

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.otpVerification.upsert({
    where: {
      phone_no_role: {
        phone_no: phone,
        role: 'USER_LOGIN',
      },
    },

    update: {
      otp,
      expires_at: expiresAt,
    },

    create: {
      phone_no: phone,
      otp,
      role: 'USER_LOGIN',
      expires_at: expiresAt,
    },
  });

  // TODO:
  // await sendOtpSMS(phone, otp);

  return null;
};

export const verifyUserOtpService = async (payload: {
  phone: string;
  otp: string;
}): Promise<{
  accessToken: string;
  user: User;
  refreshToken: string;
}> => {
  const { phone, otp } = payload;

  const otpRecord = await prisma.otpVerification.findUnique({
    where: {
      phone_no_role: {
        phone_no: phone,
        role: 'USER_LOGIN',
      },
    },
  });

  if (!otpRecord) {
    throw new AppError(400, 'INVALID_OTP', 'No OTP found for this number');
  }

  if (new Date() > otpRecord.expires_at) {
    await prisma.otpVerification.delete({
      where: {
        phone_no_role: {
          phone_no: phone,
          role: 'USER_LOGIN',
        },
      },
    });

    throw new AppError(400, 'EXPIRED_OTP', 'OTP has expired');
  }

  if (otpRecord.otp !== otp) {
    throw new AppError(401, 'INVALID_OTP', 'Incorrect OTP');
  }

  await prisma.otpVerification.delete({
    where: {
      phone_no_role: {
        phone_no: phone,
        role: 'USER_LOGIN',
      },
    },
  });

  const existingUser = await prisma.user.findUnique({
    where: {
      phone_no: phone,
    },
  });

  if (!existingUser) {
    throw new AppError(404, 'NON_EXISTENT_USER', 'User not found');
  }

  const accessToken = jwt.sign(
    {
      role: ROLES.USER,
      payload: {
        user: {
          id: existingUser.id,
          phone_no: existingUser.phone_no,
        },
      },
    } as JwtPayload,
    env.JWT_ACCESS_SECRET as string,
    {
      expiresIn: env.JWT_ACCESS_EXPIRY as any,
    },
  );

  const refreshToken = jwt.sign(
    {
      role: ROLES.USER,
      payload: {
        user: {
          id: existingUser.id,
          phone_no: existingUser.phone_no,
        },
      },
    } as JwtPayload,
    env.JWT_REFRESH_SECRET as string,
    {
      expiresIn: env.JWT_REFRESH_EXPIRY as any,
    },
  );

  const user = await prisma.user.update({
    where: {
      id: existingUser.id,
    },

    data: {
      refresh_token: refreshToken,
    },
  });

  return {
    accessToken,
    user,
    refreshToken,
  };
};

export const registerEmployerService = async (payload: EmployerRegisterPayload): Promise<null> => {
  const existingEmployer = await prisma.employer.findFirst({
    where: {
      OR: [{ email: payload.email }, { phone_no: payload.phone_no }],
    },
  });

  if (existingEmployer) {
    throw new AppError(409, 'EMPLOYER_EXISTS', 'Employer with this email or phone already exists');
  }

  const otp = generateOtp();

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.otpVerification.upsert({
    where: {
      email_role: {
        email: payload.email,
        role: OTP_ROLES.EMPLOYER_REGISTER,
      },
    },

    update: {
      otp,
      expires_at: expiresAt,

      payload: {
        ...payload,
      },
    },

    create: {
      email: payload.email,
      otp,
      role: OTP_ROLES.EMPLOYER_REGISTER,
      expires_at: expiresAt,

      payload: {
        ...payload,
      },
    },
  });

  await sendOtpEmail(payload.email, otp);

  return null;
};

export const verifyEmployerRegistrationOtpService = async (payload: {
  email: string;
  otp: string;
}): Promise<{
  accessToken: string;
  employer: Employer;
  refreshToken: string;
}> => {
  const { email, otp } = payload;

  const otpRecord = await prisma.otpVerification.findUnique({
    where: {
      email_role: {
        email,
        role: 'EMPLOYER_REGISTER',
      },
    },
  });

  if (!otpRecord) {
    throw new AppError(400, 'INVALID_OR_EXPIRED_OTP', 'Invalid or expired OTP');
  }

  if (otpRecord.otp !== otp) {
    throw new AppError(400, 'INVALID_OTP', 'Incorrect OTP');
  }

  if (new Date() > otpRecord.expires_at) {
    await prisma.otpVerification.delete({
      where: {
        email_role: {
          email,
          role: 'EMPLOYER_REGISTER',
        },
      },
    });

    throw new AppError(400, 'EXPIRED_OTP', 'OTP has expired');
  }

  const pendingEmployerData = otpRecord.payload as EmployerRegisterPayload;

  const newEmployer = await prisma.$transaction(async (tx) => {
    const employer = await tx.employer.create({
      data: {
        company_name: pendingEmployerData.company_name,
        email: pendingEmployerData.email,
        phone_no: pendingEmployerData.phone_no,
        company_address: pendingEmployerData.company_address,
        gst_number: pendingEmployerData.gst_number,
        subscription_tier: pendingEmployerData.subscription_tier,
      },
    });

    if (pendingEmployerData?.company_location) {
      await tx.$executeRaw`
        UPDATE employers
        SET company_location =
          ST_SetSRID(
            ST_MakePoint(
              ${pendingEmployerData.company_location.longitude},
              ${pendingEmployerData.company_location.latitude}
            ),
            4326
          )::geography
        WHERE id = ${employer.id}::uuid
      `;
    }

    return employer;
  });

  await prisma.otpVerification.delete({
    where: {
      email_role: {
        email,
        role: 'EMPLOYER_REGISTER',
      },
    },
  });

  const accessToken = jwt.sign(
    {
      role: ROLES.EMPLOYER,
      payload: {
        employer: {
          id: newEmployer.id,
          email: newEmployer.email,
          is_verified: newEmployer.is_verified,
        },
      },
    } as JwtPayload,
    env.JWT_ACCESS_SECRET as string,
    {
      expiresIn: env.JWT_ACCESS_EXPIRY as any,
    },
  );

  const refreshToken = jwt.sign(
    {
      role: ROLES.EMPLOYER,
      payload: {
        employer: {
          id: newEmployer.id,
          email: newEmployer.email,
          is_verified: newEmployer.is_verified,
        },
      },
    } as JwtPayload,
    env.JWT_REFRESH_SECRET as string,
    {
      expiresIn: env.JWT_REFRESH_EXPIRY as any,
    },
  );

  const employer = await prisma.employer.update({
    where: {
      id: newEmployer.id,
    },

    data: {
      refresh_token: refreshToken,
    },
  });

  return {
    accessToken,
    employer,
    refreshToken,
  };
};

export const sendEmployerOtpService = async (payload: { email: string }): Promise<null> => {
  const { email } = payload;

  const existingEmployer = await prisma.employer.findUnique({
    where: {
      email,
    },
  });

  if (!existingEmployer) {
    throw new AppError(404, 'NON_EXISTENT_EMPLOYER', 'Employer not found. Please register first.');
  }

  const otp = generateOtp();

  // TODO: remove in production
  // const otp = '123456';

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.otpVerification.upsert({
    where: {
      email_role: {
        email,
        role: 'EMPLOYER_LOGIN',
      },
    },

    update: {
      otp,
      expires_at: expiresAt,
    },

    create: {
      email,
      otp,
      role: 'EMPLOYER_LOGIN',
      expires_at: expiresAt,
    },
  });

  await sendOtpEmail(email, otp);

  return null;
};

export const verifyEmployerOtpService = async (payload: {
  email: string;
  otp: string;
}): Promise<{
  accessToken: string;
  employer: Employer;
  refreshToken: string;
}> => {
  const { email, otp } = payload;

  const otpRecord = await prisma.otpVerification.findUnique({
    where: {
      email_role: {
        email,
        role: 'EMPLOYER_LOGIN',
      },
    },
  });

  if (!otpRecord) {
    throw new AppError(400, 'INVALID_OTP', 'No OTP found for this email');
  }

  if (new Date() > otpRecord.expires_at) {
    await prisma.otpVerification.delete({
      where: {
        email_role: {
          email,
          role: 'EMPLOYER_LOGIN',
        },
      },
    });

    throw new AppError(400, 'EXPIRED_OTP', 'OTP has expired');
  }

  if (otpRecord.otp !== otp) {
    throw new AppError(401, 'INVALID_OTP', 'Incorrect OTP');
  }

  await prisma.otpVerification.delete({
    where: {
      email_role: {
        email,
        role: 'EMPLOYER_LOGIN',
      },
    },
  });

  const existingEmployer = await prisma.employer.findUnique({
    where: {
      email,
    },
  });

  if (!existingEmployer) {
    throw new AppError(404, 'NON_EXISTENT_EMPLOYER', 'Employer not found');
  }

  const accessToken = jwt.sign(
    {
      role: ROLES.EMPLOYER,
      payload: {
        employer: {
          id: existingEmployer.id,
          email: existingEmployer.email,
          is_verified: existingEmployer.is_verified,
        },
      },
    } as JwtPayload,
    env.JWT_ACCESS_SECRET as string,
    {
      expiresIn: env.JWT_ACCESS_EXPIRY as any,
    },
  );

  const refreshToken = jwt.sign(
    {
      role: ROLES.EMPLOYER,
      payload: {
        employer: {
          id: existingEmployer.id,
          email: existingEmployer.email,
          is_verified: existingEmployer.is_verified,
        },
      },
    } as JwtPayload,
    env.JWT_REFRESH_SECRET as string,
    {
      expiresIn: env.JWT_REFRESH_EXPIRY as any,
    },
  );

  const employer = await prisma.employer.update({
    where: {
      id: existingEmployer.id,
    },

    data: {
      refresh_token: refreshToken,
    },
  });

  return {
    accessToken,
    employer,
    refreshToken,
  };
};

export const generateRefreshTokenService = async (
  oldRefreshToken: string,
): Promise<{ accessToken: string; refreshToken: string; user?: User; employer?: Employer }> => {
  try {
    const decoded = jwt.verify(oldRefreshToken, env.JWT_REFRESH_SECRET as string) as JwtPayload;
    console.log('here');
    if (decoded.role === ROLES.USER) {
      const existingUser = await prisma.user.findUnique({ where: { id: decoded.payload.user.id } });

      if (!existingUser || existingUser.refresh_token !== oldRefreshToken) {
        throw new AppError(401, 'INVALID_TOKEN', 'Invalid refresh token');
      }

      const accessToken = jwt.sign(
        {
          role: ROLES.USER,
          payload: {
            user: {
              id: existingUser.id,
              phone_no: existingUser.phone_no,
            },
          },
        } as JwtPayload,
        env.JWT_ACCESS_SECRET as string,
        { expiresIn: env.JWT_ACCESS_EXPIRY as any },
      );
      const newRefreshToken = jwt.sign(
        {
          role: ROLES.USER,
          payload: {
            user: {
              id: existingUser.id,
              phone_no: existingUser.phone_no,
            },
          },
        } as JwtPayload,
        env.JWT_REFRESH_SECRET as string,
        { expiresIn: env.JWT_REFRESH_EXPIRY as any },
      );

      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: { refresh_token: newRefreshToken },
      });

      return { accessToken, refreshToken: newRefreshToken, user: updatedUser };
    } else if (decoded.role === ROLES.EMPLOYER) {
      console.log('employer here');
      const existingEmployer = await prisma.employer.findUnique({
        where: { id: decoded.payload.employer.id },
      });
      console.log('existin here');

      if (!existingEmployer || existingEmployer.refresh_token !== oldRefreshToken) {
        throw new AppError(401, 'INVALID_TOKEN', 'Invalid refresh token');
      }
      console.log('after employer here');

      const accessToken = jwt.sign(
        {
          role: ROLES.EMPLOYER,
          payload: {
            employer: {
              id: existingEmployer.id,
              email: existingEmployer.email,
              is_verified: existingEmployer.is_verified,
            },
          },
        } as JwtPayload,
        env.JWT_ACCESS_SECRET as string,
        { expiresIn: env.JWT_ACCESS_EXPIRY as any },
      );
      const newRefreshToken = jwt.sign(
        {
          role: ROLES.EMPLOYER,
          payload: {
            employer: {
              id: existingEmployer.id,
              email: existingEmployer.email,
              is_verified: existingEmployer.is_verified,
            },
          },
        } as JwtPayload,
        env.JWT_REFRESH_SECRET as string,
        { expiresIn: env.JWT_REFRESH_EXPIRY as any },
      );

      const updatedEmployer = await prisma.employer.update({
        where: { id: existingEmployer.id },
        data: { refresh_token: newRefreshToken },
      });

      return { accessToken, refreshToken: newRefreshToken, employer: updatedEmployer };
    } else {
      throw new AppError(401, 'INVALID_ROLE', 'Invalid role in token');
    }
  } catch (error) {
    throw new AppError(401, 'INVALID_TOKEN', 'Session expired or invalid token');
  }
};
export const generateAccessToken = (payload: JwtPayload) => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET as string, {
    expiresIn: env.JWT_ACCESS_EXPIRY as any,
  });
};

export const generateRefreshToken = (payload: JwtPayload) => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET as string, {
    expiresIn: env.JWT_REFRESH_EXPIRY as any,
  });
};
