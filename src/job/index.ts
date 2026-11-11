import { invoiceDelinquencyJob } from './billing/invoiceDelinquency.jobs';
import { monthlyCommissionBillingJob } from './billing/monthlyCommissionBilling.jobs';
import { studentJobExpiryJob } from './job/studentJobExpiry.jobs';
import { expireSessionJob } from './session/expireSession.jobs';
import { sessionAutoCompleteJob } from './session/sessionAutoComplete.jobs';

export const startAllJobs = () => {
  console.log('[server] Starting all cron jobs...');

  // Session jobs
  expireSessionJob();
  sessionAutoCompleteJob();

  // Billing jobs
  monthlyCommissionBillingJob();
  invoiceDelinquencyJob();

  // Marketplace jobs
  studentJobExpiryJob();
};

export {
  expireSessionJob,
  sessionAutoCompleteJob,
  monthlyCommissionBillingJob,
  invoiceDelinquencyJob,
  studentJobExpiryJob,
};
