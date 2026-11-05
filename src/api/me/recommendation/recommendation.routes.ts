import { Router } from 'express';
import { versionMiddleware } from '@/middleware/version.middleware';
import * as controller from './recommendation.controller';

const router = Router({ mergeParams: true });

router.post('/tutors/search', versionMiddleware(1), controller.searchRecommendedTutorHandler);
router.post('/jobs/search', versionMiddleware(1), controller.searchRecommendedJobHandler);
router.post('/feedback/create', versionMiddleware(1), controller.createRecommendationFeedbackHandler);

export default router;
