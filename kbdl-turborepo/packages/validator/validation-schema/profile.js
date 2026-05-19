"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPublicEmployerProfileSchema = exports.uploadEmployerDocumentsSchema = exports.updateEmployerLocationSchema = exports.updateEmployerPreferencesSchema = exports.updateEmployerProfileSchema = exports.removePushTokenSchema = exports.getPublicUserProfileSchema = exports.updateUserAvailabilitySchema = exports.updateUserLocationSchema = exports.updateUserPreferencesSchema = exports.updateUserSkillsSchema = exports.updateUserProfileSchema = void 0;
const zod_1 = require("zod");
const userPreferencesSchema = zod_1.z.object({
    language: zod_1.z.string().min(2).max(10).default('en-IN'),
    theme: zod_1.z.enum(['light', 'dark', 'system']).default('system'),
});
const locationSchema = zod_1.z.object({
    latitude: zod_1.z.number().min(-90).max(90),
    longitude: zod_1.z.number().min(-180).max(180),
});
exports.updateUserProfileSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Name is too short').max(255, 'Name is too long').optional(),
        default_address: zod_1.z.string().max(500, 'Address is too long').optional(),
        experience: zod_1.z.number().int().positive('Experience must be a positive number').optional(),
        city: zod_1.z.string().max(100).optional(),
        area: zod_1.z.string().max(100).optional(),
    }),
});
exports.updateUserSkillsSchema = zod_1.z.object({
    body: zod_1.z.object({
        skills: zod_1.z.array(zod_1.z.string().min(1, 'Skill cannot be empty')),
    }),
});
exports.updateUserPreferencesSchema = zod_1.z.object({
    body: userPreferencesSchema,
});
exports.updateUserLocationSchema = zod_1.z.object({
    body: locationSchema,
});
exports.updateUserAvailabilitySchema = zod_1.z.object({
    body: zod_1.z.object({
        extra_shift: zod_1.z.boolean(),
    }),
});
exports.getPublicUserProfileSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('Invalid user ID format'),
    }),
});
exports.removePushTokenSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        token: zod_1.z.string().min(1, 'Token is required').optional(),
        deviceId: zod_1.z.string().min(1, 'Device ID is required').optional(),
    })
        .refine((data) => data.token || data.deviceId, {
        message: 'Either token or deviceId must be provided',
        path: ['body'],
    }),
});
exports.updateEmployerProfileSchema = zod_1.z.object({
    body: zod_1.z.object({
        company_name: zod_1.z.string().min(1, 'Company name is required').max(255).optional(),
        phone_no: zod_1.z
            .string()
            .min(10)
            .max(15)
            .regex(/^\+?[0-9]+$/)
            .optional(),
        company_address: zod_1.z.string().max(500).optional(),
        gst_number: zod_1.z
            .string()
            .length(15)
            .regex(/^[A-Z0-9]+$/)
            .optional()
            .or(zod_1.z.literal('')),
    }),
});
exports.updateEmployerPreferencesSchema = zod_1.z.object({
    body: zod_1.z.any(),
});
exports.updateEmployerLocationSchema = zod_1.z.object({
    body: locationSchema,
});
exports.uploadEmployerDocumentsSchema = zod_1.z.object({});
exports.getPublicEmployerProfileSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('Invalid employer ID format'),
    }),
});
