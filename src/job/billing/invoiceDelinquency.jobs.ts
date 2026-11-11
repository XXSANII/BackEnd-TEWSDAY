import cron from 'node-cron';
import { appConfig } from '@/config/app.config';
import { db } from '@/utils/db';
import { getAuthRedisKey } from '@/utils/cache/getTemplateRedisKey.helper';
import { logError } from '@/utils/error/logError';
import { redis } from '@/utils/redis';
import { invoiceStatusType, invoiceTypeType } from '@/constants/billing.constants';
import { actionLogType } from '@/constants/system.constants';
import { userStatusType } from '@/constants/user.constants';

/**
 * @name   invoiceDelinquencyJob
 * @code   JOB_003
 * @desc
 * - Suspends tutors who still have an unpaid commission invoice 14 days after it was issued, and restores tutors that
 *   this job suspended once they have no overdue invoice left.
 * - Runs every day at 00:30 UTC ('30 0 * * *').
 * - Only users whose status was last written by 'system' are restored, so an admin suspension is never lifted here.
 * - Each change writes an EntityAuditLog row and clears the user's cached auth sessions.
 */
export const invoiceDelinquencyJob = () => {
  cron.schedule(
    '30 0 * * *',
    async () => {
      const jobStartTime = new Date();
      console.log(`[JOB start - ${jobStartTime.toISOString()}] - JOB_003: invoiceDelinquencyJob`);

      try {
        const overdueCutoff = new Date(
          jobStartTime.getTime() - appConfig.billing.SUSPEND_AFTER_DAYS_FROM_ISSUE * 24 * 60 * 60 * 1000
        );
        const overdueInvoiceQuery = () =>
          db('Invoice')
            .where({
              'Invoice.invoiceType': invoiceTypeType.TUTOR_COMMISSION,
              'Invoice.status': invoiceStatusType.UNPAID,
              'Invoice.isActiveFlag': true,
            })
            .andWhere('Invoice.createdAt', '<=', overdueCutoff);

        // -----------------------------------
        // Suspend overdue tutors
        // -----------------------------------
        const overduePayers = await overdueInvoiceQuery()
          .join('User', 'Invoice.payerUserId', 'User.userId')
          .where({ 'User.status': userStatusType.NORMAL, 'User.isActiveFlag': true })
          .distinct('User.userId as userId');

        let suspendedCount = 0;
        for (const { userId } of overduePayers as { userId: string }[]) {
          await changeUserStatus(userId, userStatusType.NORMAL, userStatusType.SUSPENDED);
          suspendedCount += 1;
        }

        // -----------------------------------
        // Restore tutors that are no longer overdue
        // -----------------------------------
        const suspendedBySystem = await db('User')
          .where({ status: userStatusType.SUSPENDED, updatedBy: 'system', isActiveFlag: true })
          .select<{ userId: string }[]>('userId');

        let restoredCount = 0;
        for (const { userId } of suspendedBySystem) {
          const stillOverdue = await overdueInvoiceQuery().andWhere('Invoice.payerUserId', userId).first();
          if (stillOverdue) continue;
          await changeUserStatus(userId, userStatusType.SUSPENDED, userStatusType.NORMAL);
          restoredCount += 1;
        }

        console.log(
          `[JOB done] - JOB_003: invoiceDelinquencyJob, ${suspendedCount} suspended, ${restoredCount} restored`
        );
      } catch (error) {
        logError({ apiName: 'JOB_003: invoiceDelinquencyJob', error: error as Error });
      }
    },
    { timezone: 'UTC' }
  );
};

/**
 * @name   changeUserStatus
 * @desc   Change a user's status as 'system', write the audit log row and clear the cached auth sessions.
 */
async function changeUserStatus(userId: string, fromStatus: string, toStatus: string): Promise<void> {
  const sessionTokens = await db.transaction(async (trx) => {
    const updatedCount = await trx('User')
      .where({ userId, status: fromStatus, isActiveFlag: true })
      .update({ status: toStatus, updatedAt: new Date(), updatedBy: 'system' });
    if (updatedCount === 0) return [];

    await trx('EntityAuditLog').insert({
      tableName: 'User',
      recordId: userId,
      action: actionLogType.EDIT,
      oldData: JSON.stringify({ status: fromStatus }),
      newData: JSON.stringify({ status: toStatus }),
      changedFields: JSON.stringify(['status']),
      changedBy: 'system',
      createdBy: 'system',
      updatedBy: 'system',
    });

    return trx('Session').where({ userId, isActiveFlag: true }).select<{ token: string }[]>('token');
  });

  for (const { token } of sessionTokens) {
    await redis.del(getAuthRedisKey(token));
  }
}
