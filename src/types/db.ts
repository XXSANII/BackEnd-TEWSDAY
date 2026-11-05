import type {
  AuthProviderType,
  CurrentModeType,
  LanguageType,
  SystemRoleType,
  UserStatusType,
} from '@/constants/user.constants';
import type {
  ApplicationStatusType,
  BookingStatusType,
  ChangeRequestStatusType,
  DeclineReasonType,
  IntroVideoStatusType,
  JobStatusType,
  MessageType,
  NotificationPriorityType,
  PaymentStatusType,
  RecommendationActionType,
  RecommendationTargetType,
  ReviewType,
  SessionStatusType,
  TeachingLocationType,
  TeachingModeType,
  VerificationStatusType,
} from '@/constants/marketplace.constants';
import type { InvoiceStatusType, InvoiceTypeType, PaymentMethodType } from '@/constants/billing.constants';
import type { ActionLogType } from '@/constants/system.constants';

// Base audit attributes present in most tables
export interface BaseEntity {
  isActiveFlag: boolean;
  createdAt: Date | string;
  createdBy?: string | null;
  updatedAt: Date | string;
  updatedBy?: string | null;
}

// Table Interfaces

export interface User extends BaseEntity {
  userId: string;
  username: string;
  displayName: string;
  email: string;
  emailVerifiedAt?: Date | string | null;
  phoneNumber?: string | null;
  phoneVerifiedAt?: Date | string | null;
  role: SystemRoleType;
  status: UserStatusType;
  language: LanguageType;
  currentMode: CurrentModeType;
  profileImageId?: string | null;
  coverImageId?: string | null;
  notificationSettings: Record<string, boolean>;
  consentAcceptedAt?: Date | string | null;
}

export interface AuthAccount extends BaseEntity {
  authAccountId: string;
  userId: string;
  provider: AuthProviderType;
  providerAccountId?: string | null;
  passwordHash?: string | null;
}

export interface Session extends BaseEntity {
  sessionId: string;
  userId: string;
  token: string;
  expiredAt: Date | string;
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceId?: string | null;
}

export interface Otp extends BaseEntity {
  otpId: string;
  userId: string;
  code: string;
  purpose: string;
  expiredAt: Date | string;
}

export interface File extends BaseEntity {
  fileId: string;
  name: string;
  path: string;
  size: number;
  type: string | null;
  fileExtension: string | null;
  isPublicFlag: boolean;
}

export interface ErrorLog extends BaseEntity {
  errorLogId: string;
  apiName: string;
  message: string;
  stack?: string | null;
}

export interface Example extends BaseEntity {
  exampleId: string;
  name: string;
}

// PostGIS point (geometry(Point,4326)); selected as raw WKB hex unless converted in the query
export type GeoPoint = unknown;

export interface Subject extends BaseEntity {
  subjectId: string;
  name: string;
  category: string;
  description?: string | null;
}

export interface StudentProfile extends BaseEntity {
  studentProfileId: string;
  userId: string;
  currentGradeLevel?: string | null;
  schoolName?: string | null;
  location?: GeoPoint | null;
  parentName?: string | null;
  parentPhone?: string | null;
  emergencyContact?: Record<string, unknown> | null;
}

export interface TutorProfile extends BaseEntity {
  tutorProfileId: string;
  userId: string;
  bio?: string | null;
  hourlyRate?: number | string | null;
  teachingLocationType: TeachingLocationType;
  location?: GeoPoint | null;
  serviceRadiusKm?: number | string | null;
  paymentDetails?: Record<string, unknown> | null;
  introVideoFileId?: string | null;
  introVideoStatus?: IntroVideoStatusType | null;
  verificationStatus: VerificationStatusType;
  popularityScore: number | string;
}

export interface TutorSubject extends BaseEntity {
  tutorSubjectId: string;
  tutorProfileId: string;
  subjectId: string;
  proficiencyLevel?: string | null;
  gradeLevels: string[];
  specializedTopics: string[];
  customHourlyRate?: number | string | null;
}

export interface TutorEducation extends BaseEntity {
  tutorEducationId: string;
  tutorProfileId: string;
  institution: string;
  degree?: string | null;
  fieldOfStudy?: string | null;
  graduationYear?: number | null;
  verificationDocFileId?: string | null;
  isVerifiedFlag: boolean;
}

export interface TutorAvailability extends BaseEntity {
  tutorAvailabilityId: string;
  tutorProfileId: string;
  dayOfWeek?: number | null;
  specificDate?: Date | string | null;
  startTime: string;
  endTime: string;
  isAvailableFlag: boolean;
}

export interface ProfileChangeRequest extends BaseEntity {
  profileChangeRequestId: string;
  tutorProfileId: string;
  requestedChanges: Record<string, unknown>;
  supportingDocFileId?: string | null;
  status: ChangeRequestStatusType;
  reviewedBy?: string | null;
  reviewedAt?: Date | string | null;
  rejectionReason?: string | null;
}

export interface StudentJob extends BaseEntity {
  studentJobId: string;
  studentProfileId: string;
  subjectId: string;
  targetGradeLevel?: string | null;
  topics: string[];
  learningGoal?: string | null;
  budgetMin?: number | string | null;
  budgetMax?: number | string | null;
  locationType: TeachingLocationType;
  location?: GeoPoint | null;
  frequencyPerWeek?: number | null;
  preferredDays?: unknown | null;
  status: JobStatusType;
  expiredAt?: Date | string | null;
}

export interface JobApplication extends BaseEntity {
  jobApplicationId: string;
  studentJobId: string;
  tutorProfileId: string;
  proposedRate: number | string;
  proposedAvailability?: unknown | null;
  coverMessage?: string | null;
  status: ApplicationStatusType;
}

export interface Booking extends BaseEntity {
  bookingId: string;
  studentProfileId: string;
  tutorProfileId: string;
  subjectId: string;
  originatingStudentJobId?: string | null;
  agreedHourlyRate: number | string;
  teachingMode: TeachingModeType;
  meetingLocation?: string | null;
  meetingUrl?: string | null;
  signedContractFileId?: string | null;
  contractUploadedAt?: Date | string | null;
  status: BookingStatusType;
}

export interface ClassSession extends BaseEntity {
  classSessionId: string;
  bookingId: string;
  studentProfileId: string;
  tutorProfileId: string;
  scheduledStart: Date | string;
  scheduledEnd: Date | string;
  actualStart?: Date | string | null;
  actualEnd?: Date | string | null;
  completionClaimedAt?: Date | string | null;
  hourlyRate: number | string;
  durationMinutes: number;
  grossAmount: number | string;
  lessonFeedback?: string | null;
  homeworkAssigned?: string | null;
  status: SessionStatusType;
  paymentStatus: PaymentStatusType;
  disputeReason?: string | null;
  studentConfirmedAt?: Date | string | null;
  tutorConfirmedAt?: Date | string | null;
}

export interface Invoice extends BaseEntity {
  invoiceId: string;
  invoiceNumber: string;
  invoiceType: InvoiceTypeType;
  bookingId?: string | null;
  classSessionId?: string | null;
  payerUserId: string;
  payeeUserId: string;
  billingPeriodStart?: Date | string | null;
  billingPeriodEnd?: Date | string | null;
  commissionRateSnapshot?: number | string | null;
  amount: number | string;
  commissionFee: number | string;
  status: InvoiceStatusType;
  paymentMethod?: PaymentMethodType | null;
  slipFileId?: string | null;
  dueDate?: Date | string | null;
  paidAt?: Date | string | null;
  verifiedBy?: string | null;
}

export interface InvoiceItem extends BaseEntity {
  invoiceItemId: string;
  invoiceId: string;
  classSessionId: string;
  sessionGrossAmount: number | string;
  commissionRate: number | string;
  commissionAmount: number | string;
}

export interface Conversation extends BaseEntity {
  conversationId: string;
  studentProfileId: string;
  tutorProfileId: string;
  bookingId?: string | null;
  lastMessageAt?: Date | string | null;
}

export interface Message extends BaseEntity {
  messageId: string;
  conversationId: string;
  senderUserId: string;
  messageType: MessageType;
  content?: string | null;
  fileId?: string | null;
  isReadFlag: boolean;
  readAt?: Date | string | null;
}

export interface Review extends BaseEntity {
  reviewId: string;
  classSessionId: string;
  reviewerUserId: string;
  revieweeUserId: string;
  tutorProfileId?: string | null;
  reviewType: ReviewType;
  ratingScore: number;
  comment?: string | null;
  isPublishedFlag: boolean;
}

export interface Notification extends BaseEntity {
  notificationId: string;
  userId: string;
  priorityTier: NotificationPriorityType;
  title: string;
  body: string;
  referenceType?: string | null;
  referenceId?: string | null;
  isReadFlag: boolean;
  readAt?: Date | string | null;
}

export interface UserActivityLog extends BaseEntity {
  userActivityLogId: string;
  userId?: string | null;
  actionType: ActionLogType;
  entityType: string;
  entityId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface EntityAuditLog extends BaseEntity {
  entityAuditLogId: string;
  tableName: string;
  recordId: string;
  action: ActionLogType;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  changedFields?: string[] | null;
  changedBy?: string | null;
}

export interface ProfileEmbedding extends BaseEntity {
  profileEmbeddingId: string;
  tutorProfileId: string;
  contentHash: string;
  embedding?: string | null; // pgvector text form, e.g. '[0.1,0.2,...]'
  embeddingModel?: string | null;
  embeddedAt?: Date | string | null;
}

export interface JobEmbedding extends BaseEntity {
  jobEmbeddingId: string;
  studentJobId: string;
  contentHash: string;
  embedding?: string | null;
  embeddingModel?: string | null;
  embeddedAt?: Date | string | null;
}

export interface RecommendationFeedback extends BaseEntity {
  recommendationFeedbackId: string;
  actorUserId: string;
  targetType: RecommendationTargetType;
  targetId: string;
  action: RecommendationActionType;
  declineReason?: DeclineReasonType | null;
  rankingVersion?: string | null;
}
