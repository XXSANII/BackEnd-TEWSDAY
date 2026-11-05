/**
 * ============================================================================
 * @name    appConfig
 * @desc
 * - Fixed application settings that are the same in every environment.
 * - These used to be environment variables; they are code now so they are reviewed and versioned.
 * - Values that change per environment or are secret stay in `env.ts`.
 *
 * ============================================================================
 */
export const appConfig = {
  // Authentication
  auth: {
    JWT_EXPIRE: '30d', // JWT `expiresIn` (was JWT_EXPIRE)
    SESSION_EXPIRE_DAYS: 30, // Session row / cookie lifetime in days (was JWT_COOKIE_EXPIRE)
  },

  // File upload limits
  file: {
    GENERAL_FILE_MAX_SIZE_BYTE: 50 * 1024 * 1024, // 50 MB
    GENERAL_IMAGE_MAX_SIZE_BYTE: 5 * 1024 * 1024, // 5 MB (was GENERAL_IMAGE_MAX_SIZE_BYTE / IMAGE_MAX_FILE_SIZE_BYTE)
    PLACEHOLDER_IMAGE_PATH: 'https://placehold.co/600x400', // was FILE_PLACEHOLDER_IMAGE_PATH
  },

  // Video duration and streaming limits
  video: {
    MAX_DURATION_SECONDS: 180, // Maximum tutor intro video duration (3 minutes)
  },

  // Trigram search (selectSearchScore); the `<%` threshold is set on the database by migration v-1-0-0
  search: {
    SCORE_WEIGHT: {
      prefixMatch: 1.0, // the column starts with the search
      wordPrefixMatch: 0.5, // a later word in the column starts with the search
      fuzzyMatch: 0.6, // word_similarity, for typo tolerance
      popularity: 0.15, // multiplied by ln(1 + popularity)
    },
  },

  // Commission & billing configuration
  billing: {
    COMMISSION_RATE_STANDARD: 0.1, // 10% standard commission for < 20 hours/month
    COMMISSION_RATE_HIGH_VOLUME: 0.08, // 8% discounted rate for >= 20 hours/month
    HIGH_VOLUME_HOURS: 20, // Threshold in hours to unlock 8% commission
    GRACE_DAYS: 10, // Invoice due on the 11th (10 days from the 1st)
    SUSPEND_AFTER_DAYS_FROM_ISSUE: 14, // Overdue suspension triggered after 14 days
  },

  // Session execution rules
  session: {
    AUTO_COMPLETE_HOURS: 48, // Automatic learning completion after tutor claim
  },

  // Marketplace job lifecycle
  job: {
    EXPIRE_DAYS: 30, // Default duration before an unmatched job post expires
  },

  // AI Matching and Hybrid Ranking
  matching: {
    RANK_WEIGHT: {
      semantic: 0.35,
      lexical: 0.15,
      availability: 0.2,
      distanceRateFit: 0.15,
      qualitySignals: 0.15,
    },
    AI_TIMEOUT_MS: 1500, // Maximum latency budget before falling back to local deterministic ranking
  },
} as const;
