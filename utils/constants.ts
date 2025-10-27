// Session mode constants
export const SESSION_MODES = {
  MEDITATION: 'meditation',
  FOCUS: 'focus',
  BREATHWORK: 'breathwork',
  CALM: 'calm',
  GRATITUDE: 'gratitude',
} as const;

export type SessionMode = typeof SESSION_MODES[keyof typeof SESSION_MODES];

// Session duration constants (in minutes)
export const SESSION_DURATIONS = {
  MIN_DURATION: 1,
  MAX_DURATION: 120,
  DEFAULT_DURATION: 15,
  RECOMMENDED_DURATIONS: [5, 10, 15, 20, 30, 45, 60],
} as const;

// XP calculation constants
export const XP_CONSTANTS = {
  BASE_XP_PER_MINUTE: 10,
  MODE_MULTIPLIERS: {
    meditation: 1.5,
    focus: 1.2,
    breathwork: 1.3,
    calm: 1.0,
    gratitude: 1.1,
  },
  // Level calculation: level = floor(sqrt(totalXP / 100)) + 1
  XP_LEVEL_DIVISOR: 100,
} as const;

// Level thresholds for reference
export const LEVEL_THRESHOLDS = {
  LEVEL_1: 0,
  LEVEL_2: 100,
  LEVEL_3: 400,
  LEVEL_4: 900,
  LEVEL_5: 1600,
  LEVEL_10: 8100,
  LEVEL_20: 36100,
  LEVEL_50: 240100,
} as const;

// Garden/Badge constants
export const GARDEN_CONSTANTS = {
  TOTAL_TILES: 100,
  XP_PER_TILE: 1000,
  BADGES_PER_LEVEL: [1, 5, 10, 20, 50], // Levels where badges are earned
} as const;

// Session validation constants
export const SESSION_VALIDATION = {
  MAX_SESSION_AGE_HOURS: 24,
  MIN_SESSION_COMPLETION_PERCENTAGE: 0.5, // At least 50% of target duration
  NONCE_EXPIRY_MINUTES: 180, // 3 hours
} as const;

// Encryption constants
export const ENCRYPTION_CONSTANTS = {
  ALGORITHM: 'aes-256-gcm',
  KEY_LENGTH: 32,
  IV_LENGTH: 16,
  SALT_LENGTH: 32,
  AUTH_TAG_LENGTH: 16,
  ENCODING: 'utf8' as BufferEncoding,
  OUTPUT_ENCODING: 'base64' as BufferEncoding,
} as const;

// API response constants
export const API_RESPONSES = {
  SUCCESS: 'success',
  ERROR: 'error',
  VALIDATION_ERROR: 'validation_error',
  UNAUTHORIZED: 'unauthorized',
  NOT_FOUND: 'not_found',
  SERVER_ERROR: 'server_error',
} as const;

// Hedera network constants
export const HEDERA_CONSTANTS = {
  NETWORKS: {
    MAINNET: 'mainnet',
    TESTNET: 'testnet',
  },
  HBAR_DECIMALS: 8,
  ACCOUNT_ID_REGEX: /^\d+\.\d+\.\d+$/,
} as const;

// Web3.storage constants
export const WEB3_STORAGE_CONSTANTS = {
  API_ENDPOINT: 'https://api.web3.storage/upload',
  GATEWAY_URL: 'https://w3s.link/ipfs',
  MAX_FILE_SIZE_MB: 100,
} as const;

// IPFS constants
export const IPFS_CONSTANTS = {
  DEFAULT_GATEWAY: 'https://ipfs.io/ipfs',
  DEFAULT_PROTOCOL: 'http',
  DEFAULT_HOST: 'localhost',
  DEFAULT_PORT: '5001',
} as const;

// JWT/Auth constants
export const AUTH_CONSTANTS = {
  TOKEN_EXPIRY: '7d', // 7 days
  REFRESH_TOKEN_EXPIRY: '30d', // 30 days
  SESSION_TOKEN_EXPIRY: '24h', // 24 hours
} as const;

// Database collection names
export const DB_COLLECTIONS = {
  USERS: 'users',
  SESSIONS: 'sessions',
  GARDENS: 'gardens',
  BADGES: 'badges',
} as const;

// Badge types
export const BADGE_TYPES = {
  LEVEL_MILESTONE: 'level_milestone',
  XP_MILESTONE: 'xp_milestone',
  SESSION_STREAK: 'session_streak',
  GARDEN_COMPLETION: 'garden_completion',
  MODE_SPECIALIST: 'mode_specialist',
} as const;

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;
