declare global {
  namespace Express {
    interface Request {
      user: any;
      id: string;
      role: string;
    }
  }
}

export { };

