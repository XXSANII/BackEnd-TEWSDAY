import { Router } from 'express';
import { versionMiddleware } from '@/middleware/version.middleware';
import * as controller from './subject.controller';

const router = Router({ mergeParams: true });

router.post('/search', versionMiddleware(1), controller.searchSubjectHandler);
router.get('/:subjectId/get', versionMiddleware(1), controller.getSubjectHandler);

export default router;
