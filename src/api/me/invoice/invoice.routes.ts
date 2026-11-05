import { Router } from 'express';
import { versionMiddleware } from '@/middleware/version.middleware';
import * as controller from './invoice.controller';

const router = Router({ mergeParams: true });

router.post('/search', versionMiddleware(1), controller.searchInvoiceHandler);
router.get('/:invoiceId/get', versionMiddleware(1), controller.getInvoiceHandler);
router.post('/:invoiceId/slip/upload', versionMiddleware(1), controller.uploadInvoiceSlipHandler);

export default router;
