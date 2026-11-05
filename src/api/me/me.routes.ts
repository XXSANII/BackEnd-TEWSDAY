import { Router } from 'express';
import bookingRoutes from './booking/booking.routes';
import chatRoutes from './chat/chat.routes';
import invoiceRoutes from './invoice/invoice.routes';
import jobRoutes from './job/job.routes';
import notificationRoutes from './notification/notification.routes';
import profileRoutes from './profile/profile.routes';
import recommendationRoutes from './recommendation/recommendation.routes';
import reviewRoutes from './review/review.routes';
import sessionRoutes from './session/session.routes';
import studentRoutes from './student/student.routes';
import tutorRoutes from './tutor/tutor.routes';

const router = Router({ mergeParams: true });

router.use('/profile', profileRoutes);
router.use('/tutor', tutorRoutes);
router.use('/student', studentRoutes);
router.use('/bookings', bookingRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/', notificationRoutes);
router.use('/', jobRoutes);
router.use('/', sessionRoutes);
router.use('/', chatRoutes);
router.use('/', reviewRoutes);

export default router;
