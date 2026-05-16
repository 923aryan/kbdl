import { env } from '@repo/validator/server';
import Redis from 'ioredis';

const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,

  retryStrategy: (times) => {
    if (times > 3) {
      console.error('❌ Redis could not connect after 3 attempts.');
      return null;
    }
    return 50;
  },
});

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err) => console.error('⚠️ Redis connection error:', err));

export default redis;
