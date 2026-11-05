import { Router } from 'express';
import { authProtectMiddleware } from '@/middleware/auth.middleware';
import { versionMiddleware } from '@/middleware/version.middleware';
import * as controller from './auth.controller';

const router = Router({ mergeParams: true });

router.post('/register', versionMiddleware(1), controller.registerHandler);
router.post('/login', versionMiddleware(1), controller.loginHandler);
router.post('/oauth/:provider', versionMiddleware(1), controller.oauthLoginHandler);
router.post('/refresh-token', versionMiddleware(1), controller.refreshTokenHandler);
router.post('/logout', versionMiddleware(1), authProtectMiddleware, controller.logoutHandler);
router.post('/sessions/search', versionMiddleware(1), authProtectMiddleware, controller.searchSessionHandler);
router.delete('/sessions/:sessionId/delete', versionMiddleware(1), authProtectMiddleware, controller.deleteSessionHandler);

export default router;
