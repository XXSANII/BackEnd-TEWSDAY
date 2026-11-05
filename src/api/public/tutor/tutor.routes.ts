import { Router } from 'express';
import { versionMiddleware } from '@/middleware/version.middleware';
import * as controller from './tutor.controller';

const router = Router({ mergeParams: true });

router.post('/search', versionMiddleware(1), controller.searchTutorHandler);
router.get('/:tutorId/get', versionMiddleware(1), controller.getTutorHandler);
router.get('/:tutorId/availability/get', versionMiddleware(1), controller.getPublicTutorAvailabilityHandler);
router.post('/:tutorId/reviews/search', versionMiddleware(1), controller.searchTutorReviewHandler);

export default router;
