import { Router } from 'express';
import { versionMiddleware } from '@/middleware/version.middleware';
import * as controller from './chat.controller';

const router = Router({ mergeParams: true });

router.post('/conversations/search', versionMiddleware(1), controller.searchConversationHandler);
router.post('/conversations/create', versionMiddleware(1), controller.createConversationHandler);
router.post('/conversations/:conversationId/messages/search', versionMiddleware(1), controller.searchMessageHandler);
router.post('/conversations/:conversationId/messages/create', versionMiddleware(1), controller.createMessageHandler);
router.put('/conversations/:conversationId/read', versionMiddleware(1), controller.readConversationHandler);
router.delete('/messages/:messageId/delete', versionMiddleware(1), controller.deleteMessageHandler);

export default router;
