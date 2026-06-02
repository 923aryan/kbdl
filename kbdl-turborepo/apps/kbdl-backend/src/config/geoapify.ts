import { env } from '@repo/validator/server';

export const GEOAPIFY_CONFIG = {
  API_KEY: env.GEOAPIFY_API_KEY,
  BASE_URL: 'https://api.geoapify.com/v1',
};
