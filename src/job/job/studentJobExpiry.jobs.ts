import cron from 'node-cron';
import { db } from '@/utils/db';
import { logError } from '@/utils/error/logError';
import { applicationStatusType, jobStatusType } from '@/constants/marketplace.constants';

/**
 * @name   studentJobExpiryJob
 * @code   JOB_005
 * @desc
 * - Closes open student jobs whose `expiredAt` has passed and rejects their pending bids.
 * - Runs every hour ('0 * * * *'). Rows are locked with skipLocked so a re-run never double-processes.
 */
export const studentJobExpiryJob = () => {
  cron.schedule('0 * * * *', async () => {
    const jobStartTime = new Date();
    console.log(`[JOB start - ${jobStartTime.toISOString()}] - JOB_005: studentJobExpiryJob`);

    try {
      const closedCount = await db.transaction(async (trx) => {
        const now = new Date();
        const expiredJobs = await trx('StudentJob')
          .select('studentJobId')
          .where({ status: jobStatusType.OPEN, isActiveFlag: true })
          .andWhere('expiredAt', '<=', now)
          .forUpdate()
          .skipLocked();
        if (expiredJobs.length === 0) return 0;

        const expiredJobIds = expiredJobs.map((row: { studentJobId: string }) => row.studentJobId);
        await trx('JobApplication')
          .whereIn('studentJobId', expiredJobIds)
          .andWhere({ status: applicationStatusType.PENDING, isActiveFlag: true })
          .update({ status: applicationStatusType.REJECTED, updatedAt: now, updatedBy: 'system' });

        return trx('StudentJob')
          .whereIn('studentJobId', expiredJobIds)
          .update({ status: jobStatusType.CLOSED, updatedAt: now, updatedBy: 'system' });
      });

      console.log(`[JOB done] - JOB_005: studentJobExpiryJob, ${closedCount} job(s) closed`);
    } catch (error) {
      logError({ apiName: 'JOB_005: studentJobExpiryJob', error: error as Error });
    }
  });
};
