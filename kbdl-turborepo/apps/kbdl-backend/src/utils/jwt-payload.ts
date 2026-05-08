export type JwtPayload = {
  id: string;
  role: "user" | "organization" | "admin";
};
