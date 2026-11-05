import { Router } from 'express';
import { versionMiddleware } from '@/middleware/version.middleware';
import * as controller from './profile.controller';

const router = Router({ mergeParams: true });

router.get('/get', versionMiddleware(1), controller.getProfileHandler);
router.put('/mode/edit', versionMiddleware(1), controller.editProfileModeHandler);
router.put('/avatar/edit', versionMiddleware(1), controller.editProfileAvatarHandler);
router.put('/notifications/edit', versionMiddleware(1), controller.editProfileNotificationsHandler);

export default router;
