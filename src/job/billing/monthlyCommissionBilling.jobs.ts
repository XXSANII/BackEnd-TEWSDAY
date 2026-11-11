import crypto from 'crypto';
import cron from 'node-cron';
import { appConfig } from '@/config/app.config';
import { env } from '@/config/env';
import { db } from '@/utils/db';
import { logError } from '@/utils/error/logError';
import { InvoiceItem } from '@/types/db';
import { invoiceStatusType, invoiceTypeType } from '@/constants/billing.constants';
import { notificationPriorityType, sessionStatusType } from '@/constants/marketplace.constants';
import { systemRoleType } from '@/constants/user.constants';

interface BillableSession {
  classSessionId: string;
  bookingId: string;
  grossAmount: number | string;
  durationMinutes: number | string;
}

/**
 * @name   monthlyCommissionBillingJob
 * @code   JOB_002
 * @desc
 * - On the 1st of each month (00:00 UTC) creates one consolidated `tutorCommission` invoice per tutor for the
 *   sessions completed in the previous month that are not billed yet.
 * - Rate is 10% below 20 hours and 8% from 20 hours; the rate is stored on the invoice as `commissionRateSnapshot`.
 * - Each tutor is billed in its own transaction. `InvoiceItem.classSessionId` is UNIQUE, and billed sessions are
 *   excluded, so running the job twice never bills a session twice.
 */
export const monthlyCommissionBillingJob = () => {
  cron.schedule(
    '0 0 1 * *',
    async () => {
      const jobStartTime = new Date();
      console.log(`[JOB start - ${jobStartTime.toISOString()}] - JOB_002: monthlyCommissionBillingJob`);

      try {
        // Prepare billing period (previous month, UTC)
        const periodStart = new Date(Date.UTC(jobStartTime.getUTCFullYear(), jobStartTime.getUTCMonth() - 1, 1));
        const periodEndExclusive = new Date(Date.UTC(jobStartTime.getUTCFullYear(), jobStartTime.getUTCMonth(), 1));
        const periodEnd = new Date(periodEndExclusive.getTime() - 24 * 60 * 60 * 1000);
        const dueDate = new Date(periodEndExclusive.getTime() + appConfig.billing.GRACE_DAYS * 24 * 60 * 60 * 1000);
        const periodLabel = `${periodStart.getUTCFullYear()}${String(periodStart.getUTCMonth() + 1).padStart(2, '0')}`;

        let platformPayeeUserId = env.PLATFORM_PAYEE_USER_ID;
        if (!platformPayeeUserId) {
          const adminUser = await db('User')
            .where({ role: systemRoleType.ADMIN, isActiveFlag: true })
            .first<{ userId: string }>('userId');
          platformPayeeUserId = adminUser?.userId || '';
        }
        if (!platformPayeeUserId) {
          throw new Error('No platform payee user. Set PLATFORM_PAYEE_USER_ID or create an admin user.');
        }

        // Find tutors with unbilled completed sessions
        const unbilledSessionQuery = () =>
          db('ClassSession')
            .where({ 'ClassSession.status': sessionStatusType.COMPLETED, 'ClassSession.isActiveFlag': true })
            .andWhereRaw('COALESCE("ClassSession"."actualEnd", "ClassSession"."scheduledEnd") >= ?', [periodStart])
            .andWhereRaw('COALESCE("ClassSession"."actualEnd", "ClassSession"."scheduledEnd") < ?', [
              periodEndExclusive,
            ])
            .whereNotExists(
              db('InvoiceItem')
                .select(db.raw('1'))
                .whereRaw('"InvoiceItem"."classSessionId" = "ClassSession"."classSessionId"')
                .andWhere('InvoiceItem.isActiveFlag', true)
            );
        const tutorRows = await unbilledSessionQuery().distinct('ClassSession.tutorProfileId as tutorProfileId');

        // Bill each tutor in its own transaction
        let invoiceCount = 0;
        for (const { tutorProfileId } of tutorRows as { tutorProfileId: string }[]) {
          try {
            const created = await db.transaction(async (trx) => {
              const tutor = await trx('TutorProfile')
                .where({ tutorProfileId, isActiveFlag: true })
                .first<{ userId: string }>('userId');
              if (!tutor) return false;

              const sessions = (await trx('ClassSession')
                .where({
                  'ClassSession.tutorProfileId': tutorProfileId,
                  'ClassSession.status': sessionStatusType.COMPLETED,
                  'ClassSession.isActiveFlag': true,
                })
                .andWhereRaw('COALESCE("ClassSession"."actualEnd", "ClassSession"."scheduledEnd") >= ?', [periodStart])
                .andWhereRaw('COALESCE("ClassSession"."actualEnd", "ClassSession"."scheduledEnd") < ?', [
                  periodEndExclusive,
                ])
                .whereNotExists(
                  trx('InvoiceItem')
                    .select(trx.raw('1'))
                    .whereRaw('"InvoiceItem"."classSessionId" = "ClassSession"."classSessionId"')
                    .andWhere('InvoiceItem.isActiveFlag', true)
                )
                .select('classSessionId', 'bookingId', 'grossAmount', 'durationMinutes')
                .forUpdate()
                .skipLocked()) as BillableSession[];
              if (sessions.length === 0) return false;

              // Pick the commission tier from the total hours
              const totalHours = sessions.reduce((sum, s) => sum + Number(s.durationMinutes), 0) / 60;
              const commissionRate =
                totalHours >= appConfig.billing.HIGH_VOLUME_HOURS
                  ? appConfig.billing.COMMISSION_RATE_HIGH_VOLUME
                  : appConfig.billing.COMMISSION_RATE_STANDARD;

              const itemRows: Partial<InvoiceItem>[] = sessions.map((s) => ({
                classSessionId: s.classSessionId,
                sessionGrossAmount: Number(s.grossAmount),
                commissionRate,
                commissionAmount: Number((Number(s.grossAmount) * commissionRate).toFixed(2)),
                createdBy: 'system',
                updatedBy: 'system',
              }));
              const totalCommission = Number(
                itemRows.reduce((sum, item) => sum + Number(item.commissionAmount), 0).toFixed(2)
              );

              const invoiceNumber = `INV-COM-${periodLabel}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
              const [createdInvoice] = await trx('Invoice')
                .insert({
                  invoiceNumber,
                  invoiceType: invoiceTypeType.TUTOR_COMMISSION,
                  payerUserId: tutor.userId,
                  payeeUserId: platformPayeeUserId,
                  billingPeriodStart: periodStart,
                  billingPeriodEnd: periodEnd,
                  commissionRateSnapshot: commissionRate,
                  amount: totalCommission,
                  commissionFee: totalCommission,
                  status: invoiceStatusType.UNPAID,
                  dueDate,
                  createdBy: 'system',
                  updatedBy: 'system',
                })
                .returning<{ invoiceId: string }[]>('invoiceId');
              if (!createdInvoice) throw new Error('Failed to create commission invoice.');

              await trx('InvoiceItem').insert(
                itemRows.map((item) => ({ ...item, invoiceId: createdInvoice.invoiceId }))
              );

              await trx('Notification').insert({
                userId: tutor.userId,
                priorityTier: notificationPriorityType.HIGH,
                title: 'Monthly commission invoice issued',
                body: `Invoice ${invoiceNumber} is due on ${dueDate.toISOString().slice(0, 10)}.`,
                referenceType: 'Invoice',
                referenceId: createdInvoice.invoiceId,
                isReadFlag: false,
                createdBy: 'system',
                updatedBy: 'system',
              });
              return true;
            });
            if (created) invoiceCount += 1;
          } catch (error) {
            // One failing tutor must not block the others; the next run picks the unbilled sessions up again
            logError({
              apiName: `JOB_002: monthlyCommissionBillingJob (tutor ${tutorProfileId})`,
              error: error as Error,
            });
          }
        }

        console.log(`[JOB done] - JOB_002: monthlyCommissionBillingJob, ${invoiceCount} invoice(s) created`);
      } catch (error) {
        logError({ apiName: 'JOB_002: monthlyCommissionBillingJob', error: error as Error });
      }
    },
    { timezone: 'UTC' }
  );
};
