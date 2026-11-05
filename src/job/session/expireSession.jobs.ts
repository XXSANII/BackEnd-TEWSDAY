import cron from 'node-cron';
import { db } from '@/utils/db';
import { logError } from '@/utils/error/logError';

/**
 * @name   expireSessionJob
 * @code   JOB_001
 * @desc
 * - Example job: soft-deletes sessions that expired more than 30 days ago.
 * - Runs every day at 03:00 AM ('0 3 * * *').
 * - Copy this file as the template for new jobs, then register it in `src/job/index.ts`.
 */
export const expireSessionJob = () => {
  cron.schedule('0 3 * * *', async () => {
    const jobStartTime = new Date();
    console.log(`[JOB start - ${jobStartTime.toISOString()}] - JOB_001: expireSessionJob`);

    try {
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Soft-delete expired sessions
      const updatedCount = await db('Session')
        .where({ isActiveFlag: true })
        .andWhere('expiredAt', '<', cutoff)
        .update({ isActiveFlag: false, updatedAt: new Date(), updatedBy: 'system' });

      console.log(`[JOB done] - JOB_001: expireSessionJob, ${updatedCount} session(s) deactivated`);
    } catch (error) {
      logError({ apiName: 'JOB_001: expireSessionJob', error: error as Error });
    }
  });
};
