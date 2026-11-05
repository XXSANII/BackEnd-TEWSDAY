import { Router } from 'express';
import { versionMiddleware } from '@/middleware/version.middleware';
import * as controller from './storage.controller';

const router = Router({ mergeParams: true });

router.post('/presigned-upload', versionMiddleware(1), controller.createPresignedUploadHandler);
router.post('/confirm-upload', versionMiddleware(1), controller.confirmUploadHandler);
router.get('/:fileId/view-url', versionMiddleware(1), controller.getFileViewUrlHandler);

export default router;
