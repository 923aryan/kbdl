import { z } from 'zod';
export declare const updateUserProfileSchema: z.ZodObject<
  {
    body: z.ZodObject<
      {
        name: z.ZodOptional<z.ZodString>;
        default_address: z.ZodOptional<z.ZodString>;
        experience: z.ZodOptional<z.ZodNumber>;
        city: z.ZodOptional<z.ZodString>;
        area: z.ZodOptional<z.ZodString>;
      },
      z.core.$strip
    >;
  },
  z.core.$strip
>;
export declare const updateUserSkillsSchema: z.ZodObject<
  {
    body: z.ZodObject<
      {
        skills: z.ZodArray<z.ZodString>;
      },
      z.core.$strip
    >;
  },
  z.core.$strip
>;
export declare const updateUserPreferencesSchema: z.ZodObject<
  {
    body: z.ZodObject<
      {
        language: z.ZodDefault<z.ZodString>;
        theme: z.ZodDefault<
          z.ZodEnum<{
            light: 'light';
            dark: 'dark';
            system: 'system';
          }>
        >;
      },
      z.core.$strip
    >;
  },
  z.core.$strip
>;
export declare const updateUserLocationSchema: z.ZodObject<
  {
    body: z.ZodObject<
      {
        latitude: z.ZodNumber;
        longitude: z.ZodNumber;
      },
      z.core.$strip
    >;
  },
  z.core.$strip
>;
export declare const updateUserAvailabilitySchema: z.ZodObject<
  {
    body: z.ZodObject<
      {
        extra_shift: z.ZodBoolean;
      },
      z.core.$strip
    >;
  },
  z.core.$strip
>;
export declare const getPublicUserProfileSchema: z.ZodObject<
  {
    params: z.ZodObject<
      {
        id: z.ZodString;
      },
      z.core.$strip
    >;
  },
  z.core.$strip
>;
export declare const removePushTokenSchema: z.ZodObject<
  {
    body: z.ZodObject<
      {
        token: z.ZodOptional<z.ZodString>;
        deviceId: z.ZodOptional<z.ZodString>;
      },
      z.core.$strip
    >;
  },
  z.core.$strip
>;
export declare const updateEmployerProfileSchema: z.ZodObject<
  {
    body: z.ZodObject<
      {
        company_name: z.ZodOptional<z.ZodString>;
        phone_no: z.ZodOptional<z.ZodString>;
        company_address: z.ZodOptional<z.ZodString>;
        gst_number: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<''>]>;
      },
      z.core.$strip
    >;
  },
  z.core.$strip
>;
export declare const updateEmployerPreferencesSchema: z.ZodObject<
  {
    body: z.ZodAny;
  },
  z.core.$strip
>;
export declare const updateEmployerLocationSchema: z.ZodObject<
  {
    body: z.ZodObject<
      {
        latitude: z.ZodNumber;
        longitude: z.ZodNumber;
      },
      z.core.$strip
    >;
  },
  z.core.$strip
>;
export declare const uploadEmployerDocumentsSchema: z.ZodObject<{}, z.core.$strip>;
export declare const getPublicEmployerProfileSchema: z.ZodObject<
  {
    params: z.ZodObject<
      {
        id: z.ZodString;
      },
      z.core.$strip
    >;
  },
  z.core.$strip
>;
//# sourceMappingURL=profile.d.ts.map
