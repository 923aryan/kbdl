export type UserPreferences = {
  theme: 'light' | 'dark' | 'system';
  language: 'en-IN' | 'hi-IN';
};

export type AppUser = {
  id: string;
  name: string | null;
  phone_no: string;
  skills: string[];
  preferences: UserPreferences;
  extra_shift: boolean;
  created_at: string;
  updated_at: string;
};
