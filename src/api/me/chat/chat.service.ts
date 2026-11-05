import { applyPagination } from '@/utils/data/applyPagination.helper';
import { applySort } from '@/utils/data/applySort.helper';
import { auditCreate, auditSoftDelete, auditUpdate } from '@/utils/data/auditFields.helper';
import { calculatePagination } from '@/utils/data/calculatePagination.helper';
import { db } from '@/utils/db';
import { ApiError } from '@/utils/error/ApiError';
import { Conversation, Message, StudentProfile, TutorProfile } from '@/types/db';
import { UserPayload } from '@/types/express';
import { messageType } from '@/constants/marketplace.constants';
import {
  CreateConversationInput,
  CreateConversationResponse,
  CreateMessageInput,
  CreateMessageParams,
  CreateMessageResponse,
  DeleteMessageParams,
  DeleteMessageResponse,
  ReadConversationParams,
  ReadConversationResponse,
  SearchConversationInput,
  SearchConversationResponse,
  searchConversationValidSortKeys,
  SearchMessageInput,
  SearchMessageParams,
  SearchMessageResponse,
  searchMessageValidSortKeys,
} from './chat.validation';

/**
 * ============================================================================
 * @name    me_010_conv_s
 * @desc    Search conversations of the authenticated user.
 *
 * ============================================================================
 */
export async function searchConversation(
  input: SearchConversationInput,
  user: UserPayload
): Promise<SearchConversationResponse> {
  // Build query
  let query = db('Conversation')
    .join('StudentProfile', 'Conversation.studentProfileId', 'StudentProfile.studentProfileId')
    .join('User as StudentUser', 'StudentProfile.userId', 'StudentUser.userId')
    .join('TutorProfile', 'Conversation.tutorProfileId', 'TutorProfile.tutorProfileId')
    .join('User as TutorUser', 'TutorProfile.userId', 'TutorUser.userId')
    .select(
      'Conversation.conversationId as conversationId',
      'Conversation.studentProfileId as studentProfileId',
      'StudentUser.displayName as studentDisplayName',
      'Conversation.tutorProfileId as tutorProfileId',
      'TutorUser.displayName as tutorDisplayName',
      'Conversation.bookingId as bookingId',
      'Conversation.lastMessageAt as lastMessageAt',
      'Conversation.createdAt as createdAt'
    )
    .where({ 'Conversation.isActiveFlag': true })
    .andWhere((qb) => {
      qb.where('StudentProfile.userId', user.userId).orWhere('TutorProfile.userId', user.userId);
    });

  // Apply sorting
  query = applySort({
    query,
    sortKey: input.sortKey,
    sortAsc: input.sortAsc,
    validColumns: searchConversationValidSortKeys,
  });

  // Apply pagination
  const totalCountResult = await query.clone().clearSelect().clearOrder().count().first<{ count: string }>();
  const totalCount = parseInt(totalCountResult?.count || '0', 10);
  const pagination = calculatePagination({
    pageNumber: input.pageNumber,
    pageSize: input.pageSize,
    total: totalCount,
    pageAll: input.pageAll,
  });
  query = applyPagination({
    query,
    pageNumber: pagination.currentPage,
    pageSize: pagination.pageSize,
  });

  // Execute the query
  const rows = await query;

  // Return result
  const returnResult: SearchConversationResponse = {
    total: totalCount,
    pagination,
    data: rows.map((row: any) => ({
      conversationId: row.conversationId,
      studentProfileId: row.studentProfileId,
      studentDisplayName: row.studentDisplayName,
      tutorProfileId: row.tutorProfileId,
      tutorDisplayName: row.tutorDisplayName,
      bookingId: row.bookingId || null,
      lastMessageAt: row.lastMessageAt ? new Date(row.lastMessageAt).toISOString() : null,
      createdAt: new Date(row.createdAt).toISOString(),
    })),
  };
  return returnResult;
}

/**
 * ============================================================================
 * @name    me_010_conv_c
 * @desc    Create a new conversation or return the existing active conversation.
 *
 * ============================================================================
 */
export async function createConversation(
  input: CreateConversationInput,
  user: UserPayload
): Promise<CreateConversationResponse> {
  return db.transaction(async (trx) => {
    // Check existing data
    let studentProfileId = input.studentProfileId || user.studentProfileId;
    if (!studentProfileId) {
      let studentProfile = await trx('StudentProfile')
        .where({ userId: user.userId, isActiveFlag: true })
        .first<StudentProfile>();
      if (!studentProfile) {
        const [created] = await trx('StudentProfile')
          .insert({ userId: user.userId, ...auditCreate(user.userLogName) })
          .returning<StudentProfile[]>('*');
        studentProfile = created;
      }
      studentProfileId = studentProfile?.studentProfileId;
    }

    if (!studentProfileId) {
      throw new ApiError(400, 'me_010_conv_c_s_01', 'Student profile is required to open a conversation.');
    }

    const tutorProfile = await trx('TutorProfile')
      .where({ tutorProfileId: input.tutorProfileId, isActiveFlag: true })
      .first<TutorProfile>();
    if (!tutorProfile) {
      throw new ApiError(404, 'me_010_conv_c_s_02', 'Tutor profile not found or inactive.');
    }

    const existingConv = await trx('Conversation')
      .where({
        studentProfileId,
        tutorProfileId: tutorProfile.tutorProfileId,
        isActiveFlag: true,
      })
      .first<Conversation>();

    if (existingConv) {
      return {
        conversationId: existingConv.conversationId,
        studentProfileId: existingConv.studentProfileId,
        tutorProfileId: existingConv.tutorProfileId,
        bookingId: existingConv.bookingId || null,
      };
    }

    // Prepare data
    const newConvData: Partial<Conversation> = {
      studentProfileId,
      tutorProfileId: tutorProfile.tutorProfileId,
      bookingId: input.bookingId || null,
      lastMessageAt: new Date(),
      ...auditCreate(user.userLogName),
    };

    // Insert data
    const [createdConv] = await trx('Conversation').insert(newConvData).returning<Conversation[]>('*');
    if (!createdConv) {
      throw new ApiError(500, 'me_010_conv_c_s_03', 'Failed to create conversation.');
    }

    // Return result
    return {
      conversationId: createdConv.conversationId,
      studentProfileId: createdConv.studentProfileId,
      tutorProfileId: createdConv.tutorProfileId,
      bookingId: createdConv.bookingId || null,
    };
  });
}

/**
 * ============================================================================
 * @name    me_010_msg_s
 * @desc    Search messages inside a conversation.
 *
 * ============================================================================
 */
export async function searchMessage(
  params: SearchMessageParams,
  input: SearchMessageInput,
  user: UserPayload
): Promise<SearchMessageResponse> {
  // Check existing data
  const convRow = await db('Conversation')
    .join('StudentProfile', 'Conversation.studentProfileId', 'StudentProfile.studentProfileId')
    .join('TutorProfile', 'Conversation.tutorProfileId', 'TutorProfile.tutorProfileId')
    .select(
      'Conversation.conversationId as conversationId',
      'StudentProfile.userId as studentUserId',
      'TutorProfile.userId as tutorUserId'
    )
    .where({
      'Conversation.conversationId': params.conversationId,
      'Conversation.isActiveFlag': true,
    })
    .first<any>();

  if (!convRow) {
    throw new ApiError(404, 'me_010_msg_s_s_01', 'Conversation not found or inactive.');
  }

  if (convRow.studentUserId !== user.userId && convRow.tutorUserId !== user.userId && user.role !== 'admin') {
    throw new ApiError(403, 'me_010_msg_s_s_02', 'You do not have permission to view this conversation.');
  }

  // Build query
  let query = db('Message')
    .select(
      'messageId',
      'conversationId',
      'senderUserId',
      'messageType',
      'content',
      'fileId',
      'isReadFlag',
      'readAt',
      'createdAt'
    )
    .where({
      conversationId: convRow.conversationId,
      isActiveFlag: true,
    });

  // Apply sorting
  query = applySort({
    query,
    sortKey: input.sortKey,
    sortAsc: input.sortAsc,
    validColumns: searchMessageValidSortKeys,
  });

  // Apply pagination
  const totalCountResult = await query.clone().clearSelect().clearOrder().count().first<{ count: string }>();
  const totalCount = parseInt(totalCountResult?.count || '0', 10);
  const pagination = calculatePagination({
    pageNumber: input.pageNumber,
    pageSize: input.pageSize,
    total: totalCount,
    pageAll: input.pageAll,
  });
  query = applyPagination({
    query,
    pageNumber: pagination.currentPage,
    pageSize: pagination.pageSize,
  });

  // Execute the query
  const messages: Message[] = await query;

  // Return result
  const returnResult: SearchMessageResponse = {
    total: totalCount,
    pagination,
    data: messages.map((msg) => ({
      messageId: msg.messageId,
      conversationId: msg.conversationId,
      senderUserId: msg.senderUserId,
      messageType: msg.messageType,
      content: msg.content || null,
      fileId: msg.fileId || null,
      isReadFlag: msg.isReadFlag,
      readAt: msg.readAt ? new Date(msg.readAt).toISOString() : null,
      createdAt: new Date(msg.createdAt).toISOString(),
    })),
  };
  return returnResult;
}

/**
 * ============================================================================
 * @name    me_010_msg_c
 * @desc    Send a new message in a conversation.
 *
 * ============================================================================
 */
export async function createMessage(
  params: CreateMessageParams,
  input: CreateMessageInput,
  user: UserPayload
): Promise<CreateMessageResponse> {
  return db.transaction(async (trx) => {
    // Check existing data
    const convRow = await trx('Conversation')
      .join('StudentProfile', 'Conversation.studentProfileId', 'StudentProfile.studentProfileId')
      .join('TutorProfile', 'Conversation.tutorProfileId', 'TutorProfile.tutorProfileId')
      .select(
        'Conversation.conversationId as conversationId',
        'StudentProfile.userId as studentUserId',
        'TutorProfile.userId as tutorUserId'
      )
      .where({
        'Conversation.conversationId': params.conversationId,
        'Conversation.isActiveFlag': true,
      })
      .first<any>();

    if (!convRow) {
      throw new ApiError(404, 'me_010_msg_c_s_01', 'Conversation not found or inactive.');
    }

    if (convRow.studentUserId !== user.userId && convRow.tutorUserId !== user.userId) {
      throw new ApiError(403, 'me_010_msg_c_s_02', 'You are not a participant in this conversation.');
    }

    if (!input.content && !input.fileId) {
      throw new ApiError(400, 'me_010_msg_c_s_03', 'Message must contain either text content or a file attachment.');
    }

    // Prepare data
    const newMsgData: Partial<Message> = {
      conversationId: convRow.conversationId,
      senderUserId: user.userId,
      messageType: input.messageType || (input.fileId ? messageType.FILE : messageType.TEXT),
      content: input.content || null,
      fileId: input.fileId || null,
      isReadFlag: false,
      ...auditCreate(user.userLogName),
    };

    // Insert data
    const [createdMsg] = await trx('Message').insert(newMsgData).returning<Message[]>('*');
    if (!createdMsg) {
      throw new ApiError(500, 'me_010_msg_c_s_04', 'Failed to send message.');
    }

    await trx('Conversation')
      .where({ conversationId: convRow.conversationId })
      .update({
        lastMessageAt: new Date(),
        ...auditUpdate(user.userLogName),
      });

    // Return result
    return {
      messageId: createdMsg.messageId,
      conversationId: createdMsg.conversationId,
      senderUserId: createdMsg.senderUserId,
      messageType: createdMsg.messageType,
      content: createdMsg.content || null,
      fileId: createdMsg.fileId || null,
      isReadFlag: createdMsg.isReadFlag,
      readAt: createdMsg.readAt ? new Date(createdMsg.readAt).toISOString() : null,
      createdAt: new Date(createdMsg.createdAt).toISOString(),
    };
  });
}

/**
 * ============================================================================
 * @name    me_010_read
 * @desc    Mark all unread incoming messages in a conversation as read.
 *
 * ============================================================================
 */
export async function readConversation(
  params: ReadConversationParams,
  user: UserPayload
): Promise<ReadConversationResponse> {
  return db.transaction(async (trx) => {
    // Check existing data
    const convRow = await trx('Conversation')
      .join('StudentProfile', 'Conversation.studentProfileId', 'StudentProfile.studentProfileId')
      .join('TutorProfile', 'Conversation.tutorProfileId', 'TutorProfile.tutorProfileId')
      .select(
        'Conversation.conversationId as conversationId',
        'StudentProfile.userId as studentUserId',
        'TutorProfile.userId as tutorUserId'
      )
      .where({
        'Conversation.conversationId': params.conversationId,
        'Conversation.isActiveFlag': true,
      })
      .first<any>();

    if (!convRow) {
      throw new ApiError(404, 'me_010_read_s_01', 'Conversation not found or inactive.');
    }

    if (convRow.studentUserId !== user.userId && convRow.tutorUserId !== user.userId) {
      throw new ApiError(403, 'me_010_read_s_02', 'You are not a participant in this conversation.');
    }

    // Update data
    const updatedRows = await trx('Message')
      .where({
        conversationId: convRow.conversationId,
        isReadFlag: false,
        isActiveFlag: true,
      })
      .andWhereNot('senderUserId', user.userId)
      .update({
        isReadFlag: true,
        readAt: new Date(),
        ...auditUpdate(user.userLogName),
      })
      .returning<Message[]>('messageId');

    // Return result
    return {
      conversationId: convRow.conversationId,
      updatedCount: updatedRows.length,
    };
  });
}

/**
 * ============================================================================
 * @name    me_010_msg_d
 * @desc    Soft-delete a message sent by the authenticated user.
 *
 * ============================================================================
 */
export async function deleteMessage(
  params: DeleteMessageParams,
  user: UserPayload
): Promise<DeleteMessageResponse> {
  return db.transaction(async (trx) => {
    // Check existing data
    const existingMsg = await trx('Message')
      .where({
        messageId: params.messageId,
        senderUserId: user.userId,
        isActiveFlag: true,
      })
      .first<Message>();
    if (!existingMsg) {
      throw new ApiError(404, 'me_010_msg_d_s_01', 'Message not found or inactive.');
    }

    // -----------------------------------
    // Delete main record
    // -----------------------------------
    const [deletedMsg] = await trx('Message')
      .where({ messageId: existingMsg.messageId })
      .update(auditSoftDelete(user.userLogName))
      .returning<Message[]>('*');
    if (!deletedMsg) {
      throw new ApiError(500, 'me_010_msg_d_s_02', 'Failed to delete message.');
    }

    // Return result
    return {
      messageId: deletedMsg.messageId,
    };
  });
}
