import { Worker } from 'bullmq';

import { prisma } from '@repo/db/server';

import redis from '../redis';

import { createNotificationService } from '../../notifications/notification-service';

new Worker(
  'public-shift-broadcast',

  async (job) => {
    const { shiftId, employerId, originalEmployeeId, skillRequired } = job.data;

    /*
      Find nearby eligible users
    */

    const nearbyUsers = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT u.id
        FROM users u

        INNER JOIN notification_preferences np
          ON np.user_id = u.id

        INNER JOIN employers e
          ON e.id = ${employerId}

        WHERE

          u.id != ${originalEmployeeId}

          AND u.extra_shift = true

          AND np.shift_swap = true

          AND ${skillRequired} = ANY(u.skills)

          AND u.location IS NOT NULL

          AND e.company_location IS NOT NULL

          AND ST_DWithin(
            u.location,
            e.company_location,
            10000
          )
      `;

    /*
      Create notifications
    */

    await Promise.all(
      nearbyUsers.map((user) =>
        createNotificationService({
          userId: user.id,

          type: 'public_shift',

          title: 'New Shift Available',

          body: 'A nearby shift matching your skills is available.',

          data: {
            shiftId,
          },
        }),
      ),
    );

    console.log(`✅ Public shift notifications sent to ${nearbyUsers.length} users`);
  },

  {
    connection: redis,
  },
);
