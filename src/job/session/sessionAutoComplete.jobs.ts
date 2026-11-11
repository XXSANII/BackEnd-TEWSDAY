import cron from 'node-cron';
import { appConfig } from '@/config/app.config';
import { db } from '@/utils/db';
import { logError } from '@/utils/error/logError';
import { paymentStatusType, sessionStatusType } from '@/constants/marketplace.constants';

/**
 * @name   sessionAutoCompleteJob
 * @code   JOB_004
 * @desc
 * - Completes in-progress sessions whose tutor completion claim is older than 48 hours and that are not disputed.
 * - Runs every 15 minutes ('*\/15 * * * *'). Rows are locked with skipLocked so a re-run never double-processes.
 * - Only `status` changes; `paymentStatus` is left as it is.
 */
export const sessionAutoCompleteJob = () => {
  cron.schedule('*/15 * * * *', async () => {
    const jobStartTime = new Date();
    console.log(`[JOB start - ${jobStartTime.toISOString()}] - JOB_004: sessionAutoCompleteJob`);

    try {
      const cutoff = new Date(Date.now() - appConfig.session.AUTO_COMPLETE_HOURS * 60 * 60 * 1000);

      const updatedCount = await db.transaction(async (trx) => {
        const dueSessions = await trx('ClassSession')
          .select('classSessionId')
          .where({ status: sessionStatusType.IN_PROGRESS, isActiveFlag: true })
          .whereNotNull('completionClaimedAt')
          .andWhere('completionClaimedAt', '<=', cutoff)
          .andWhere('paymentStatus', '<>', paymentStatusType.DISPUTED)
          .forUpdate()
          .skipLocked();
        if (dueSessions.length === 0) return 0;

        return trx('ClassSession')
          .whereIn(
            'classSessionId',
            dueSessions.map((row: { classSessionId: string }) => row.classSessionId)
          )
          .update({ status: sessionStatusType.COMPLETED, updatedAt: new Date(), updatedBy: 'system' });
      });

      console.log(`[JOB done] - JOB_004: sessionAutoCompleteJob, ${updatedCount} session(s) completed`);
    } catch (error) {
      logError({ apiName: 'JOB_004: sessionAutoCompleteJob', error: error as Error });
    }
  });
};
