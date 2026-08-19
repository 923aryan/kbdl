import type { EmployerDto } from '@repo/db';

export type EmployerDTO = EmployerDto;

export type EmployerVerifyRegisterResponse = {
  accessToken: string;
  refreshToken: string;
  employer: EmployerDTO;
};
