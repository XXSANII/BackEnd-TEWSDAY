import { Router } from 'express';
import { versionMiddleware } from '@/middleware/version.middleware';
import * as controller from './student.controller';

const router = Router({ mergeParams: true });

router.get('/get', versionMiddleware(1), controller.getMyStudentProfileHandler);
router.put('/edit', versionMiddleware(1), controller.editMyStudentProfileHandler);
router.put('/emergency-contact/edit', versionMiddleware(1), controller.editStudentEmergencyContactHandler);

export default router;
