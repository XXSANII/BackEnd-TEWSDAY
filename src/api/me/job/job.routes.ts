import { Router } from 'express';
import { versionMiddleware } from '@/middleware/version.middleware';
import * as controller from './job.controller';

const router = Router({ mergeParams: true });

router.post('/jobs/create', versionMiddleware(1), controller.createStudentJobHandler);
router.put('/jobs/:jobId/status/edit', versionMiddleware(1), controller.editStudentJobStatusHandler);
router.post('/jobs/:jobId/applications/search', versionMiddleware(1), controller.searchJobApplicationHandler);
router.post('/jobs/:jobId/apply', versionMiddleware(1), controller.applyStudentJobHandler);
router.put('/applications/:applicationId/status/edit', versionMiddleware(1), controller.editJobApplicationStatusHandler);

export default router;
