import z from 'zod';
import { PaginatedResponse, paginationSchema } from '@/utils/validation/pagination.schema';
import { sortingSchema } from '@/utils/validation/sorting.schema';
import { messageTypeList } from '@/constants/marketplace.constants';

/**
 * ============================================================================
 * @name    searchConversationSchema
 * @code    me_010_conv_s
 * @desc    Search user conversations schema
 *
 * ============================================================================
 */
export const searchConversationSortMap = {
  lastMessageAt: 'lastMessageAt',
  createdAt: 'createdAt',
} as const;
export const searchConversationValidSortKeys = Object.keys(searchConversationSortMap) as [string, ...string[]];

export const searchConversationSchema = z.object({
  body: z.object({
    ...paginationSchema.shape,
    ...sortingSchema(searchConversationValidSortKeys, 'lastMessageAt').shape,
  }),
});

export const searchConversationResponseSchemaBody = z.object({
  conversationId: z.string(),
  studentProfileId: z.string(),
  studentDisplayName: z.string(),
  tutorProfileId: z.string(),
  tutorDisplayName: z.string(),
  bookingId: z.string().nullable(),
  lastMessageAt: z.string().nullable(),
  createdAt: z.string(),
});

export const searchConversationResponseSchema = z.object({
  total: z.number(),
  pagination: PaginatedResponse,
  data: z.array(searchConversationResponseSchemaBody),
});

export type SearchConversationInput = z.infer<typeof searchConversationSchema>['body'];
export type SearchConversationResponseBody = z.infer<typeof searchConversationResponseSchemaBody>;
export type SearchConversationResponse = z.infer<typeof searchConversationResponseSchema>;

/**
 * ============================================================================
 * @name    createConversationSchema
 * @code    me_010_conv_c
 * @desc    Create or open conversation schema
 *
 * ============================================================================
 */
export const createConversationSchema = z.object({
  body: z.object({
    tutorProfileId: z.uuidv4('me_010_conv_c_v_01'),
    studentProfileId: z.uuidv4('me_010_conv_c_v_02').optional(),
    bookingId: z.uuidv4('me_010_conv_c_v_03').optional().nullable(),
  }),
});

export const createConversationResponseSchema = z.object({
  conversationId: z.string(),
  studentProfileId: z.string(),
  tutorProfileId: z.string(),
  bookingId: z.string().nullable(),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>['body'];
export type CreateConversationResponse = z.infer<typeof createConversationResponseSchema>;

/**
 * ============================================================================
 * @name    searchMessageSchema
 * @code    me_010_msg_s
 * @desc    Search messages in a conversation schema
 *
 * ============================================================================
 */
export const searchMessageSortMap = {
  createdAt: 'createdAt',
} as const;
export const searchMessageValidSortKeys = Object.keys(searchMessageSortMap) as [string, ...string[]];

export const searchMessageSchema = z.object({
  params: z.object({
    conversationId: z.uuidv4('me_010_msg_s_v_01'),
  }),
  body: z.object({
    ...paginationSchema.shape,
    ...sortingSchema(searchMessageValidSortKeys, 'createdAt').shape,
  }),
});

export const searchMessageResponseSchemaBody = z.object({
  messageId: z.string(),
  conversationId: z.string(),
  senderUserId: z.string(),
  messageType: z.enum(messageTypeList),
  content: z.string().nullable(),
  fileId: z.string().nullable(),
  isReadFlag: z.boolean(),
  readAt: z.string().nullable(),
  createdAt: z.string(),
});

export const searchMessageResponseSchema = z.object({
  total: z.number(),
  pagination: PaginatedResponse,
  data: z.array(searchMessageResponseSchemaBody),
});

export type SearchMessageParams = z.infer<typeof searchMessageSchema>['params'];
export type SearchMessageInput = z.infer<typeof searchMessageSchema>['body'];
export type SearchMessageResponseBody = z.infer<typeof searchMessageResponseSchemaBody>;
export type SearchMessageResponse = z.infer<typeof searchMessageResponseSchema>;

/**
 * ============================================================================
 * @name    createMessageSchema
 * @code    me_010_msg_c
 * @desc    Create chat message schema
 *
 * ============================================================================
 */
export const createMessageSchema = z.object({
  params: z.object({
    conversationId: z.uuidv4('me_010_msg_c_v_01'),
  }),
  body: z.object({
    messageType: z.enum(messageTypeList, 'me_010_msg_c_v_02').optional(),
    content: z.string('me_010_msg_c_v_03').max(4000, 'me_010_msg_c_v_03').optional().nullable(),
    fileId: z.uuidv4('me_010_msg_c_v_04').optional().nullable(),
  }),
});

export const createMessageResponseSchema = searchMessageResponseSchemaBody;

export type CreateMessageParams = z.infer<typeof createMessageSchema>['params'];
export type CreateMessageInput = z.infer<typeof createMessageSchema>['body'];
export type CreateMessageResponse = z.infer<typeof createMessageResponseSchema>;

/**
 * ============================================================================
 * @name    readConversationSchema
 * @code    me_010_read
 * @desc    Mark conversation messages as read schema
 *
 * ============================================================================
 */
export const readConversationSchema = z.object({
  params: z.object({
    conversationId: z.uuidv4('me_010_read_v_01'),
  }),
});

export const readConversationResponseSchema = z.object({
  conversationId: z.string(),
  updatedCount: z.number(),
});

export type ReadConversationParams = z.infer<typeof readConversationSchema>['params'];
export type ReadConversationResponse = z.infer<typeof readConversationResponseSchema>;

/**
 * ============================================================================
 * @name    deleteMessageSchema
 * @code    me_010_msg_d
 * @desc    Delete chat message schema
 *
 * ============================================================================
 */
export const deleteMessageSchema = z.object({
  params: z.object({
    messageId: z.uuidv4('me_010_msg_d_v_01'),
  }),
});

export const deleteMessageResponseSchema = z.object({
  messageId: z.string(),
});

export type DeleteMessageParams = z.infer<typeof deleteMessageSchema>['params'];
export type DeleteMessageResponse = z.infer<typeof deleteMessageResponseSchema>;
