import { Router } from 'express';
import jobRoutes from './job/job.routes';
import subjectRoutes from './subject/subject.routes';
import tutorRoutes from './tutor/tutor.routes';

const router = Router({ mergeParams: true });

router.use('/subjects', subjectRoutes);
router.use('/tutors', tutorRoutes);
router.use('/jobs', jobRoutes);

export default router;
