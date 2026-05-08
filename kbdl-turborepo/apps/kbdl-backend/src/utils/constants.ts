export const ROLES = {
  USER: "USER",
  ORGANIZATION: "ORGANIZATION",
  ADMIN: "ADMIN",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];