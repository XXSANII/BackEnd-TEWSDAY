import { Router } from 'express';
import { versionMiddleware } from '@/middleware/version.middleware';
import * as controller from './moderation.controller';

const router = Router({ mergeParams: true });

router.post('/tutors/verification/search', versionMiddleware(1), controller.searchTutorVerificationHandler);
router.put('/tutors/:tutorId/verify', versionMiddleware(1), controller.verifyTutorProfileHandler);
router.post('/change-requests/search', versionMiddleware(1), controller.searchChangeRequestHandler);
router.put('/change-requests/:requestId/resolve', versionMiddleware(1), controller.resolveChangeRequestHandler);
router.post('/invoices/commission/search', versionMiddleware(1), controller.searchCommissionInvoiceHandler);
router.put('/invoices/:invoiceId/verify-slip', versionMiddleware(1), controller.verifyInvoiceSlipHandler);
router.post('/disputes/search', versionMiddleware(1), controller.searchDisputeHandler);
router.put('/disputes/:disputeId/resolve', versionMiddleware(1), controller.resolveDisputeHandler);
router.put('/users/:userId/suspend', versionMiddleware(1), controller.suspendUserHandler);

export default router;
