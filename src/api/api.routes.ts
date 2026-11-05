import { Router } from 'express';

import admin from './admin/admin.routes';
import auth from './auth/auth.routes';
import me from './me/me.routes';
import publicRoutes from './public/public.routes';
import storage from './storage/storage.routes';
import template from './template/template.routes';

import { authGateMiddleware, authProtectMiddleware, authorizeAdminMiddleware } from '@/middleware/auth.middleware';

const router = Router({ mergeParams: true });

router.use('/template', authProtectMiddleware, template);
router.use('/auth', auth);
router.use('/storage', authProtectMiddleware, storage);
router.use('/public', authGateMiddleware, publicRoutes);
router.use('/me', authProtectMiddleware, me);
router.use('/admin', authorizeAdminMiddleware, admin);

export default router;
