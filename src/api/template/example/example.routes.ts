import { Router } from 'express';
import { versionMiddleware } from '@/middleware/version.middleware';
import * as controller from './example.controller';

const router = Router({ mergeParams: true });

router.post('/create', versionMiddleware(1), controller.createExampleHandler);
router.post('/search', versionMiddleware(1), controller.searchExampleHandler);
router.delete('/:exampleId/delete', versionMiddleware(1), controller.deleteExampleHandler);
router.put('/:exampleId/edit', versionMiddleware(1), controller.editExampleHandler);
router.get('/:exampleId/get', versionMiddleware(1), controller.getExampleHandler);

export default router;
