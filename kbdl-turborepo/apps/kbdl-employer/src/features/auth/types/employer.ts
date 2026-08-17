import { Prisma, safeEmployerSelect } from '@repo/db';

export type EmployerDTO = Prisma.CompanyGetPayload<{
  select: typeof safeEmployerSelect;
}>;

export type EmployerVerifyRegisterResponse = {
  accessToken: string;
  refreshToken: string;
  employer: EmployerDTO;
};
