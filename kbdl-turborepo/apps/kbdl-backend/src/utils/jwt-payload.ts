export type JwtPayload =
  | {
      role: 'employer';
      payload: {
        employer: {
          id: string;
          email: string;
          is_verified: boolean;
          user_id?: string;
          role_code?: string;
          setup_pending?: boolean;
          status?: string;
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
          name?: string;
        };
      };
    };
