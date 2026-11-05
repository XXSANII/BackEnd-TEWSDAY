import app from './app';
import { assertRequiredEnv, env } from './config/env';
import { startAllJobs } from './job/index';

assertRequiredEnv();

/**
 * ------------------------------------------------------------------------------------------------------
 * @Start
 * Start the Server
 */
app.listen(env.PORT, () => {
  console.log('[server] Server is running in', env.NODE_ENV, 'on ' + env.HOST + ':' + env.PORT);
  if (env.ENABLE_CRON_JOBS) {
    console.log('[server] Cron jobs enabled on this instance');
    startAllJobs();
  }
});
