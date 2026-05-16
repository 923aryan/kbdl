export interface JwtPayload {
  role: 'user' | 'employer' | 'admin';
  payload: {
    employer: {
      id: string;
      email: string;
      is_verified: boolean;
    };
    user: {
      id: string;
      phone_no: string;
    };
    admin: {
      id: string;
      email: string;
    };
  };
}
