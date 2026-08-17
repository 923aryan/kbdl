import type { EmployerDTO } from '@repo/types';

export type EmployerVerifyRegisterResponse = {
  accessToken: string;
  refreshToken: string;
  employer: EmployerDTO;
};
