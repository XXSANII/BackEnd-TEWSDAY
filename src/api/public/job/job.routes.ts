import { Router } from 'express';
import { versionMiddleware } from '@/middleware/version.middleware';
import * as controller from './job.controller';

const router = Router({ mergeParams: true });

router.post('/search', versionMiddleware(1), controller.searchPublicJobHandler);
router.get('/:jobId/get', versionMiddleware(1), controller.getPublicJobHandler);
router.post('/:jobId/share', versionMiddleware(1), controller.sharePublicJobHandler);

export default router;
