import { asyncHandler } from '@/utils/request/asyncHandler.helper';
import { getRequestPayload } from '@/utils/request/getRequestPayload.helper';
import * as chatService from './chat.service';
import {
  createConversationSchema,
  createMessageSchema,
  deleteMessageSchema,
  readConversationSchema,
  searchConversationSchema,
  searchMessageSchema,
} from './chat.validation';

/**
 * ============================================================================
 * @name    searchConversation
 * @code    me_010_conv_s
 * @route   POST /api/v1/me/conversations/search
 * @desc    Search conversations of the authenticated user.
 *
 * ============================================================================
 */
export const searchConversationHandler = asyncHandler('me_010_conv_s', async (req) => {
  // Validate request body
  const { body } = searchConversationSchema.parse(req);

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const conversations = await chatService.searchConversation(body, user);

  // Send response
  return { message: 'Conversations searched successfully.', data: conversations };
});

/**
 * ============================================================================
 * @name    createConversation
 * @code    me_010_conv_c
 * @route   POST /api/v1/me/conversations/create
 * @desc    Create a new conversation or return the existing active conversation.
 *
 * ============================================================================
 */
export const createConversationHandler = asyncHandler('me_010_conv_c', async (req) => {
  // Validate request body
  const { body } = createConversationSchema.parse(req);

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const conversation = await chatService.createConversation(body, user);

  // Send response
  return { message: 'Conversation created successfully.', data: conversation, status: 201 };
});

/**
 * ============================================================================
 * @name    searchMessage
 * @code    me_010_msg_s
 * @route   POST /api/v1/me/conversations/:conversationId/messages/search
 * @desc    Search messages inside a conversation.
 *
 * ============================================================================
 */
export const searchMessageHandler = asyncHandler('me_010_msg_s', async (req) => {
  // Validate request body
  const { params, body } = searchMessageSchema.parse(req);
  if (!params.conversationId) {
    throw new Error('Conversation info is missing in request.');
  }

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const messages = await chatService.searchMessage(params, body, user);

  // Send response
  return { message: 'Messages searched successfully.', data: messages };
});

/**
 * ============================================================================
 * @name    createMessage
 * @code    me_010_msg_c
 * @route   POST /api/v1/me/conversations/:conversationId/messages/create
 * @desc    Send a new message in a conversation.
 *
 * ============================================================================
 */
export const createMessageHandler = asyncHandler('me_010_msg_c', async (req) => {
  // Validate request body
  const { params, body } = createMessageSchema.parse(req);
  if (!params.conversationId) {
    throw new Error('Conversation info is missing in request.');
  }

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const message = await chatService.createMessage(params, body, user);

  // Send response
  return { message: 'Message created successfully.', data: message, status: 201 };
});

/**
 * ============================================================================
 * @name    readConversation
 * @code    me_010_read
 * @route   PUT /api/v1/me/conversations/:conversationId/read
 * @desc    Mark all unread incoming messages in a conversation as read.
 *
 * ============================================================================
 */
export const readConversationHandler = asyncHandler('me_010_read', async (req) => {
  // Recheck request info
  const { params } = readConversationSchema.parse(req);
  if (!params.conversationId) {
    throw new Error('Conversation info is missing in request.');
  }

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const readResult = await chatService.readConversation(params, user);

  // Send response
  return { message: 'Conversation marked as read successfully.', data: readResult };
});

/**
 * ============================================================================
 * @name    deleteMessage
 * @code    me_010_msg_d
 * @route   DELETE /api/v1/me/messages/:messageId/delete
 * @desc    Soft-delete a message sent by the authenticated user.
 *
 * ============================================================================
 */
export const deleteMessageHandler = asyncHandler('me_010_msg_d', async (req) => {
  // Recheck request info
  const { params } = deleteMessageSchema.parse(req);
  if (!params.messageId) {
    throw new Error('Message info is missing in request.');
  }

  // Extract user payload from request (set by auth middleware)
  const { user } = getRequestPayload(req, ['user']);

  // Call service
  const deletedMessage = await chatService.deleteMessage(params, user);

  // Send response
  return { message: 'Message deleted successfully.', data: deletedMessage };
});
