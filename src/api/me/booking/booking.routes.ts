import { Router } from 'express';
import { versionMiddleware } from '@/middleware/version.middleware';
import * as controller from './booking.controller';

const router = Router({ mergeParams: true });

router.post('/create', versionMiddleware(1), controller.createBookingHandler);
router.post('/search', versionMiddleware(1), controller.searchBookingHandler);
router.get('/:bookingId/get', versionMiddleware(1), controller.getBookingHandler);
router.put('/:bookingId/cancel', versionMiddleware(1), controller.cancelBookingHandler);

export default router;
