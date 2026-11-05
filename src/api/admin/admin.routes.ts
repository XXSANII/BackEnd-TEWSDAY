import { Router } from 'express';
import moderationRoutes from './moderation/moderation.routes';
import subjectRoutes from './subject/subject.routes';

const router = Router({ mergeParams: true });

router.use('/subjects', subjectRoutes);
router.use('/', moderationRoutes);

export default router;
