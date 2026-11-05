// ============================================================================
// Marketplace
// ============================================================================

/**
 * @constant  teachingLocationType
 * @desc      Teaching formats a tutor offers or a student job asks for.
 */
export const teachingLocationType = {
  ONLINE: 'online',
  ONSITE: 'onsite',
  BOTH: 'both',
} as const;
export const teachingLocationList = Object.values(teachingLocationType);
export type TeachingLocationType = (typeof teachingLocationList)[number];

/**
 * @constant  teachingModeType
 * @desc      Teaching format actually agreed in a booking (never `both`).
 */
export const teachingModeType = {
  ONLINE: 'online',
  ONSITE: 'onsite',
} as const;
export const teachingModeList = Object.values(teachingModeType);
export type TeachingModeType = (typeof teachingModeList)[number];

/**
 * @constant  verificationStatusType
 * @desc      Identity / qualification verification status of a tutor profile.
 */
export const verificationStatusType = {
  UNVERIFIED: 'unverified',
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
} as const;
export const verificationStatusList = Object.values(verificationStatusType);
export type VerificationStatusType = (typeof verificationStatusList)[number];

/**
 * @constant  introVideoStatusType
 * @desc      Moderation / processing status of a tutor intro video.
 */
export const introVideoStatusType = {
  PROCESSING: 'processing',
  READY: 'ready',
  APPROVED: 'approved',
  FLAGGED: 'flagged',
  FAILED: 'failed',
} as const;
export const introVideoStatusList = Object.values(introVideoStatusType);
export type IntroVideoStatusType = (typeof introVideoStatusList)[number];

/**
 * @constant  changeRequestStatusType
 * @desc      Review status of a tutor profile change request.
 */
export const changeRequestStatusType = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
} as const;
export const changeRequestStatusList = Object.values(changeRequestStatusType);
export type ChangeRequestStatusType = (typeof changeRequestStatusList)[number];

// ============================================================================
// Jobs & bookings
// ============================================================================

/**
 * @constant  jobStatusType
 * @desc      Lifecycle of a student job post.
 */
export const jobStatusType = {
  OPEN: 'open',
  MATCHED: 'matched',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
} as const;
export const jobStatusList = Object.values(jobStatusType);
export type JobStatusType = (typeof jobStatusList)[number];

/**
 * @constant  applicationStatusType
 * @desc      Lifecycle of a tutor bid on a student job.
 */
export const applicationStatusType = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
} as const;
export const applicationStatusList = Object.values(applicationStatusType);
export type ApplicationStatusType = (typeof applicationStatusList)[number];

/**
 * @constant  bookingStatusType
 * @desc      Lifecycle of a booking.
 */
export const bookingStatusType = {
  PENDING_CONFIRMATION: 'pendingConfirmation',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
} as const;
export const bookingStatusList = Object.values(bookingStatusType);
export type BookingStatusType = (typeof bookingStatusList)[number];

// ============================================================================
// Class sessions
// ============================================================================

/**
 * @constant  sessionStatusType
 * @desc      Lifecycle of a class session.
 */
export const sessionStatusType = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'inProgress',
  COMPLETED: 'completed',
  CANCELLED_BY_STUDENT: 'cancelledByStudent',
  CANCELLED_BY_TUTOR: 'cancelledByTutor',
  NO_SHOW: 'noShow',
} as const;
export const sessionStatusList = Object.values(sessionStatusType);
export type SessionStatusType = (typeof sessionStatusList)[number];

/**
 * @constant  paymentStatusType
 * @desc      Direct tuition settlement status of a class session.
 */
export const paymentStatusType = {
  PENDING_PAYMENT: 'pendingPayment',
  STUDENT_PAID: 'studentPaid',
  TUTOR_CONFIRMED: 'tutorConfirmed',
  DISPUTED: 'disputed',
} as const;
export const paymentStatusList = Object.values(paymentStatusType);
export type PaymentStatusType = (typeof paymentStatusList)[number];

// ============================================================================
// Reviews, messages & notifications
// ============================================================================

/**
 * @constant  reviewType
 * @desc      Direction of a post-session review.
 */
export const reviewType = {
  STUDENT_TO_TUTOR: 'studentToTutor',
  TUTOR_TO_STUDENT: 'tutorToStudent',
} as const;
export const reviewTypeList = Object.values(reviewType);
export type ReviewType = (typeof reviewTypeList)[number];

/**
 * @constant  messageType
 * @desc      Kinds of chat message.
 */
export const messageType = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  SYSTEM: 'system',
} as const;
export const messageTypeList = Object.values(messageType);
export type MessageType = (typeof messageTypeList)[number];

/**
 * @constant  notificationPriorityType
 * @desc      Priority tiers of an in-app notification.
 */
export const notificationPriorityType = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;
export const notificationPriorityList = Object.values(notificationPriorityType);
export type NotificationPriorityType = (typeof notificationPriorityList)[number];

// ============================================================================
// AI recommendation
// ============================================================================

/**
 * @constant  recommendationTargetType
 * @desc      What a recommendation points at.
 */
export const recommendationTargetType = {
  TUTOR_PROFILE: 'tutorProfile',
  STUDENT_JOB: 'studentJob',
} as const;
export const recommendationTargetList = Object.values(recommendationTargetType);
export type RecommendationTargetType = (typeof recommendationTargetList)[number];

/**
 * @constant  recommendationActionType
 * @desc      What the user did with a recommendation.
 */
export const recommendationActionType = {
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
} as const;
export const recommendationActionList = Object.values(recommendationActionType);
export type RecommendationActionType = (typeof recommendationActionList)[number];

/**
 * @constant  declineReasonType
 * @desc      Structured reasons for declining a recommendation.
 */
export const declineReasonType = {
  BUDGET_MISMATCH: 'budgetMismatch',
  SCHEDULE_CONFLICT: 'scheduleConflict',
  LOCATION_MISMATCH: 'locationMismatch',
  NOT_INTERESTED: 'notInterested',
} as const;
export const declineReasonList = Object.values(declineReasonType);
export type DeclineReasonType = (typeof declineReasonList)[number];
