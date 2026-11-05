import { Router } from 'express';
import { versionMiddleware } from '@/middleware/version.middleware';
import * as controller from './subject.controller';

const router = Router({ mergeParams: true });

router.post('/create', versionMiddleware(1), controller.createSubjectHandler);
router.put('/:subjectId/edit', versionMiddleware(1), controller.editSubjectHandler);

export default router;
