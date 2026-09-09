export const ROLES = {
  GUEST: "guest",
  REGISTERED: "registered",
  ADMIN: "admin",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];