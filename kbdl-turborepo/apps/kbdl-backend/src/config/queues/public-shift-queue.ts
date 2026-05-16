import { Queue } from 'bullmq';

import redis from '../redis';

export const publicShiftQueue = new Queue('public-shift-broadcast', {
  connection: redis,
});
