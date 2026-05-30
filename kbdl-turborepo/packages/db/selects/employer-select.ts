import { Prisma } from '../generated/prisma';

export const safeEmployerSelect = Prisma.validator<Prisma.EmployerSelect>()({
  id: true,
  company_name: true,
  phone_no: true,
  company_address: true,
  is_verified: true,
  subscription_tier: true,
  preferences: true,
});
