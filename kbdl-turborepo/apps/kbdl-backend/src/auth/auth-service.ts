import {
  ensureDefaultCompanyRoles,
  PlatformType,
  prisma,
  SYSTEM_ROLE_CODES,
  User,
} from '@repo/db/server';
import {
  EmployerRegisterPayload,
  UserRegisterPayload,
  UserVerifyRegisterPayload,
} from '@repo/types';
import { env } from '@repo/validator/server';
import jwt from 'jsonwebtoken';
import {
  EmployerDto,
  findEmployerByEmail,
  toEmployerDto,
} from '../compat/employer-compat';
import { resendClient } from '../config/resend';
import { AppError } from '../utils/api-error';
import { linkWorkforcePersonToUser } from '../operations/workforce-person-service';
import { OTP_ROLES, ROLES } from '../utils/constants';
import { JwtPayload } from '../utils/jwt-payload';
const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

type OtpLookup = { phone_no: string; role: string } | { email: string; role: string };

function otpWhere(lookup: OtpLookup) {
  return 'phone_no' in lookup
    ? { phone_no: lookup.phone_no, role: lookup.role }
    : { email: lookup.email, role: lookup.role };
}

async function findOtpRecord(lookup: OtpLookup) {
  return prisma.otpVerification.findFirst({ where: otpWhere(lookup) });
}

async function deleteOtpRecord(lookup: OtpLookup) {
  await prisma.otpVerification.deleteMany({ where: otpWhere(lookup) });
}

/** Replace prior row for same phone/email + role (no upsert — works even if unique index missing). */
async function saveOtpRecord(data: {
  phone_no?: string;
  email?: string;
  role: string;
  otp: string;
  expires_at: Date;
  payload?: unknown;
}) {
  const where =
    data.phone_no != null
      ? { phone_no: data.phone_no, role: data.role }
      : { email: data.email!, role: data.role };

  await prisma.otpVerification.deleteMany({ where });
  await prisma.otpVerification.create({
    data: {
      phone_no: data.phone_no ?? null,
      email: data.email ?? null,
      otp: data.otp,
      role: data.role,
      expires_at: data.expires_at,
      payload: (data.payload ?? {}) as object,
    },
  });
}

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
  await saveOtpRecord({
    phone_no,
    role: OTP_ROLES.USER_REGISTER,
    otp,
    expires_at: expiresAt,
    payload: { ...payload },
  });

  // TODO: sendOtpSMS(phone_no, otp);

  return null;
};

// 2. Step Two: Verify OTP and Create User
export const verifyUserRegistrationOtpService = async (
  payload: UserVerifyRegisterPayload,
): Promise<{ accessToken: string; user: User; refreshToken: string }> => {
  const { phone_no, otp } = payload;

  const otpRecord = await findOtpRecord({
    phone_no,
    role: OTP_ROLES.USER_REGISTER,
  });

  if (!otpRecord) {
    throw new AppError(400, 'INVALID_OR_EXPIRED_OTP', 'Invalid or expired OTP');
  }

  if (otpRecord.otp !== otp) {
    throw new AppError(400, 'INVALID_OTP', 'Incorrect OTP');
  }

  if (new Date() > otpRecord.expires_at) {
    await deleteOtpRecord({ phone_no, role: OTP_ROLES.USER_REGISTER });

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

  await linkWorkforcePersonToUser(newUser.id, newUser.phone_no);

  // Delete OTP record after successful verification
  await deleteOtpRecord({ phone_no, role: OTP_ROLES.USER_REGISTER });

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

  await saveOtpRecord({
    phone_no: phone,
    role: OTP_ROLES.USER_LOGIN,
    otp,
    expires_at: expiresAt,
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

  const otpRecord = await findOtpRecord({ phone_no: phone, role: OTP_ROLES.USER_LOGIN });

  if (!otpRecord) {
    throw new AppError(400, 'INVALID_OTP', 'No OTP found for this number');
  }

  if (new Date() > otpRecord.expires_at) {
    await deleteOtpRecord({ phone_no: phone, role: OTP_ROLES.USER_LOGIN });

    throw new AppError(400, 'EXPIRED_OTP', 'OTP has expired');
  }

  if (otpRecord.otp !== otp) {
    throw new AppError(401, 'INVALID_OTP', 'Incorrect OTP');
  }

  await deleteOtpRecord({ phone_no: phone, role: OTP_ROLES.USER_LOGIN });

  const existingUser = await prisma.user.findUnique({
    where: {
      phone_no: phone,
    },
  });

  if (!existingUser) {
    throw new AppError(404, 'NON_EXISTENT_USER', 'User not found');
  }

  await linkWorkforcePersonToUser(existingUser.id, existingUser.phone_no);

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
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: payload.email }, { phone_no: payload.phone_no }],
    },
    include: {
      companyMemberships: {
        where: { platform_type: PlatformType.EMPLOYER },
        take: 1,
      },
    },
  });

  if (existingUser?.companyMemberships.length) {
    throw new AppError(409, 'EMPLOYER_EXISTS', 'Employer with this email or phone already exists');
  }

  if (existingUser) {
    throw new AppError(409, 'EMPLOYER_EXISTS', 'Employer with this email or phone already exists');
  }

  const otp = generateOtp();

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await saveOtpRecord({
    email: payload.email,
    role: OTP_ROLES.EMPLOYER_REGISTER,
    otp,
    expires_at: expiresAt,
    payload: { ...payload },
  });

  await sendOtpEmail(payload.email, otp);

  return null;
};

export const verifyEmployerRegistrationOtpService = async (payload: {
  email: string;
  otp: string;
}): Promise<{
  accessToken: string;
  employer: EmployerDto;
  refreshToken: string;
}> => {
  const { email, otp } = payload;

  const otpRecord = await findOtpRecord({
    email,
    role: OTP_ROLES.EMPLOYER_REGISTER,
  });

  if (!otpRecord) {
    throw new AppError(400, 'INVALID_OR_EXPIRED_OTP', 'Invalid or expired OTP');
  }

  if (otpRecord.otp !== otp) {
    throw new AppError(400, 'INVALID_OTP', 'Incorrect OTP');
  }

  if (new Date() > otpRecord.expires_at) {
    await deleteOtpRecord({ email, role: OTP_ROLES.EMPLOYER_REGISTER });

    throw new AppError(400, 'EXPIRED_OTP', 'OTP has expired');
  }

  const pendingEmployerData = otpRecord.payload as EmployerRegisterPayload;

  const { company, ownerUser } = await prisma.$transaction(async (tx) => {
    const conflictingUser = await tx.user.findFirst({
      where: {
        OR: [{ email: pendingEmployerData.email }, { phone_no: pendingEmployerData.phone_no }],
      },
    });

    if (conflictingUser) {
      throw new AppError(409, 'EMPLOYER_EXISTS', 'Employer with this email or phone already exists');
    }

    const user = await tx.user.create({
      data: {
        email: pendingEmployerData.email,
        phone_no: pendingEmployerData.phone_no,
      },
    });

    const preferences: Record<string, string> = {};
    if (pendingEmployerData.subscription_tier) {
      preferences.subscription_tier = pendingEmployerData.subscription_tier;
    }

    const company = await tx.company.create({
      data: {
        company_name: pendingEmployerData.company_name,
        company_address: pendingEmployerData.company_address,
        gst_number: pendingEmployerData.gst_number || null,
        preferences: preferences as any,
      },
    });

    // Seed default per-company roles, then attach OWNER by role_id
    const roleIds = await ensureDefaultCompanyRoles(company.id, tx);

    await tx.companyMember.create({
      data: {
        user_id: user.id,
        company_id: company.id,
        platform_type: PlatformType.EMPLOYER,
        role_id: roleIds[SYSTEM_ROLE_CODES.OWNER]!,
        is_active: true,
      },
    });

    if (pendingEmployerData?.company_location) {
      await tx.$executeRaw`
        UPDATE companies
        SET company_location =
          ST_SetSRID(
            ST_MakePoint(
              ${pendingEmployerData.company_location.longitude},
              ${pendingEmployerData.company_location.latitude}
            ),
            4326
          )::geography
        WHERE id = ${company.id}::uuid
      `;
    }

    return { company, ownerUser: user };
  });

  await deleteOtpRecord({ email, role: OTP_ROLES.EMPLOYER_REGISTER });

  const accessToken = jwt.sign(
    {
      role: ROLES.EMPLOYER,
      payload: {
        employer: {
          id: company.id,
          email: ownerUser.email,
          is_verified: company.is_verified,
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
          id: company.id,
          email: ownerUser.email,
          is_verified: company.is_verified,
        },
      },
    } as JwtPayload,
    env.JWT_REFRESH_SECRET as string,
    {
      expiresIn: env.JWT_REFRESH_EXPIRY as any,
    },
  );

  const updatedOwner = await prisma.user.update({
    where: { id: ownerUser.id },
    data: { refresh_token: refreshToken },
  });

  return {
    accessToken,
    employer: toEmployerDto(company, updatedOwner),
    refreshToken,
  };
};

export const sendEmployerOtpService = async (payload: { email: string }): Promise<null> => {
  const { email } = payload;

  const existingEmployer = await findEmployerByEmail(email);

  if (!existingEmployer) {
    throw new AppError(404, 'NON_EXISTENT_EMPLOYER', 'Employer not found. Please register first.');
  }

  // const otp = generateOtp();

  // TODO: remove in production
  const otp = '123456';

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await saveOtpRecord({
    email,
    role: OTP_ROLES.EMPLOYER_LOGIN,
    otp,
    expires_at: expiresAt,
  });

  await sendOtpEmail(email, otp);

  return null;
};

export const verifyEmployerOtpService = async (payload: {
  email: string;
  otp: string;
}): Promise<{
  accessToken: string;
  employer: EmployerDto;
  refreshToken: string;
}> => {
  const { email, otp } = payload;

  const otpRecord = await findOtpRecord({ email, role: OTP_ROLES.EMPLOYER_LOGIN });

  if (!otpRecord) {
    throw new AppError(400, 'INVALID_OTP', 'No OTP found for this email');
  }

  if (new Date() > otpRecord.expires_at) {
    await deleteOtpRecord({ email, role: OTP_ROLES.EMPLOYER_LOGIN });

    throw new AppError(400, 'EXPIRED_OTP', 'OTP has expired');
  }

  if (otpRecord.otp !== otp) {
    throw new AppError(401, 'INVALID_OTP', 'Incorrect OTP');
  }

  await deleteOtpRecord({ email, role: OTP_ROLES.EMPLOYER_LOGIN });

  const ownerUser = await prisma.user.findUnique({
    where: { email },
    include: {
      companyMemberships: {
        where: { platform_type: PlatformType.EMPLOYER },
        include: { company: true },
        take: 1,
      },
    },
  });

  const membership = ownerUser?.companyMemberships[0];
  if (!ownerUser || !membership) {
    throw new AppError(404, 'NON_EXISTENT_EMPLOYER', 'Employer not found');
  }

  const company = membership.company;

  const accessToken = jwt.sign(
    {
      role: ROLES.EMPLOYER,
      payload: {
        employer: {
          id: company.id,
          email: ownerUser.email,
          is_verified: company.is_verified,
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
          id: company.id,
          email: ownerUser.email,
          is_verified: company.is_verified,
        },
      },
    } as JwtPayload,
    env.JWT_REFRESH_SECRET as string,
    {
      expiresIn: env.JWT_REFRESH_EXPIRY as any,
    },
  );

  const updatedOwner = await prisma.user.update({
    where: { id: ownerUser.id },
    data: { refresh_token: refreshToken },
  });

  return {
    accessToken,
    employer: toEmployerDto(company, updatedOwner),
    refreshToken,
  };
};

export const generateRefreshTokenService = async (
  oldRefreshToken: string,
): Promise<{ accessToken: string; refreshToken: string; user?: User; employer?: EmployerDto }> => {
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
      const companyId = decoded.payload.employer.id;
      const ownerMember = await prisma.companyMember.findFirst({
        where: {
          company_id: companyId,
          platform_type: PlatformType.EMPLOYER,
          role: { code: SYSTEM_ROLE_CODES.OWNER },
        },
        include: {
          user: true,
          company: true,
          role: true,
        },
      });
      console.log('existin here');

      if (!ownerMember?.user || ownerMember.user.refresh_token !== oldRefreshToken) {
        throw new AppError(401, 'INVALID_TOKEN', 'Invalid refresh token');
      }
      console.log('after employer here');

      const accessToken = jwt.sign(
        {
          role: ROLES.EMPLOYER,
          payload: {
            employer: {
              id: ownerMember.company.id,
              email: ownerMember.user.email,
              is_verified: ownerMember.company.is_verified,
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
              id: ownerMember.company.id,
              email: ownerMember.user.email,
              is_verified: ownerMember.company.is_verified,
            },
          },
        } as JwtPayload,
        env.JWT_REFRESH_SECRET as string,
        { expiresIn: env.JWT_REFRESH_EXPIRY as any },
      );

      const updatedOwner = await prisma.user.update({
        where: { id: ownerMember.user.id },
        data: { refresh_token: newRefreshToken },
      });

      return {
        accessToken,
        refreshToken: newRefreshToken,
        employer: toEmployerDto(ownerMember.company, updatedOwner),
      };
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
