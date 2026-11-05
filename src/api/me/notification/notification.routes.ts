import { Router } from 'express';
import { versionMiddleware } from '@/middleware/version.middleware';
import * as controller from './notification.controller';

const router = Router({ mergeParams: true });

router.get('/badge-counts/get', versionMiddleware(1), controller.getBadgeCountsHandler);
router.post('/notifications/search', versionMiddleware(1), controller.searchNotificationHandler);
router.put('/notifications/:id/read', versionMiddleware(1), controller.readNotificationHandler);

export default router;
