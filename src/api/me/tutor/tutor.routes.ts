import { Router } from 'express';
import { versionMiddleware } from '@/middleware/version.middleware';
import * as controller from './tutor.controller';

const router = Router({ mergeParams: true });

router.get('/get', versionMiddleware(1), controller.getMyTutorProfileHandler);
router.put('/edit', versionMiddleware(1), controller.editMyTutorProfileHandler);
router.post('/education/create', versionMiddleware(1), controller.createTutorEducationHandler);
router.delete('/education/:eduId/delete', versionMiddleware(1), controller.deleteTutorEducationHandler);
router.get('/availability/get', versionMiddleware(1), controller.getTutorAvailabilityHandler);
router.put('/availability/edit', versionMiddleware(1), controller.editTutorAvailabilityHandler);
router.post('/change-requests/create', versionMiddleware(1), controller.createProfileChangeRequestHandler);

export default router;
