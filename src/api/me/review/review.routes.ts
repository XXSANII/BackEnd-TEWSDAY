import { Router } from 'express';
import { versionMiddleware } from '@/middleware/version.middleware';
import * as controller from './review.controller';

const router = Router({ mergeParams: true });

router.post('/sessions/:sessionId/reviews/create', versionMiddleware(1), controller.createReviewHandler);
router.post('/reviews/search', versionMiddleware(1), controller.searchMyReviewHandler);

export default router;
