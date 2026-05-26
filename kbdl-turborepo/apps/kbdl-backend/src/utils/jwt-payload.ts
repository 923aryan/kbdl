export type JwtPayload =
  | {
    role: 'employer';
    payload: {
      employer: {
        id: string;
        email: string;
        is_verified: boolean;
      };
    };
  }
  | {
    role: 'user';
    payload: {
      user: {
        id: string;
        phone_no: string;
      };
    };
  }
  | {
    role: 'admin';
    payload: {
      admin: {
        id: string;
        email: string;
      };
    };
  };