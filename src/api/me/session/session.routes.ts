import { Router } from 'express';
import { versionMiddleware } from '@/middleware/version.middleware';
import * as controller from './session.controller';

const router = Router({ mergeParams: true });

router.post('/bookings/:bookingId/sessions/search', versionMiddleware(1), controller.searchClassSessionHandler);
router.post('/sessions/:sessionId/start', versionMiddleware(1), controller.startClassSessionHandler);
router.post('/sessions/:sessionId/complete', versionMiddleware(1), controller.completeClassSessionHandler);
router.post('/sessions/:sessionId/confirm-attendance', versionMiddleware(1), controller.confirmSessionAttendanceHandler);
router.post('/sessions/:sessionId/dispute', versionMiddleware(1), controller.disputeClassSessionHandler);

export default router;
