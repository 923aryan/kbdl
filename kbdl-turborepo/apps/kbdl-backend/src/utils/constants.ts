export const ROLES = {
  USER: 'user',
  EMPLOYER: 'employer',
  ADMIN: 'admin',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
