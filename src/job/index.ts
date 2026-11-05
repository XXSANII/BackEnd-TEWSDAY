import { expireSessionJob } from './session/expireSession.jobs';

export const startAllJobs = () => {
  console.log('[server] Starting all cron jobs...');

  // Session jobs
  expireSessionJob();
};

export { expireSessionJob };
