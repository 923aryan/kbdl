declare global {
  namespace Express {
    interface Request {
      role?: JwtPayload['role'];
      payload?: JwtPayload['payload'];
    }
  }
}
export {};
