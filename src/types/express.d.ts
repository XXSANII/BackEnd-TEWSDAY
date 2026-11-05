/**
 * @GLOBAL_DECLARATION
 * - This file contains global type declarations for Express Request extensions.
 */

import type { CurrentModeType, LanguageType, SystemRoleType, UserStatusType } from '@/constants/user.constants';

// The user attached to `req.user` by `authGateMiddleware`
export interface UserPayload {
  token: string;
  userId: string;
  username: string;
  displayName: string;
  email: string;
  profileImageId?: string | null;
  coverImageId?: string | null;
  role: SystemRoleType;
  status: UserStatusType;
  language: LanguageType;
  currentMode: CurrentModeType;
  studentProfileId?: string | null;
  tutorProfileId?: string | null;
  userLogName: string;
  profileImageUrl?: string | null;
  coverImageUrl?: string | null;
}

// Extend Express Request interface
declare global {
  namespace Express {
    export interface Request {
      user?: UserPayload;
    }
  }
}

export {}; // This makes it a module
