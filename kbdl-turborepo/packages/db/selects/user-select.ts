import { Prisma } from '../generated/prisma';
export const safeUserSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  name: true,
  phone_no: true,
  city: true,
  area: true,
  skills: true,
  experience: true,
  rating_avg: true,
  rating_count: true,
  verification_level: true,
  extra_shift: true,
  created_at: true,
  preferences: true,
});
