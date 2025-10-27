import { z } from 'zod';

// Session modes
export const SessionMode = z.enum(['meditation', 'focus', 'breathwork', 'calm', 'gratitude']);
export type SessionModeType = z.infer<typeof SessionMode>;

// Encrypted reflection schema
export const EncryptedReflectionSchema = z.object({
  ciphertext: z.string(),
  iv: z.string(),
  salt: z.string(),
});
export type EncryptedReflection = z.infer<typeof EncryptedReflectionSchema>;

// Start session DTOs
export const StartSessionRequestSchema = z.object({
  hederaAccountId: z.string().regex(/^\d+\.\d+\.\d+$/, 'Invalid Hedera account ID format'),
  mode: SessionMode,
  targetDuration: z.number().min(1).max(120), // 1-120 minutes
});
export type StartSessionRequest = z.infer<typeof StartSessionRequestSchema>;

export const StartSessionResponseSchema = z.object({
  success: z.boolean(),
  sessionId: z.string(),
  nonce: z.string(),
  mode: SessionMode,
  targetDuration: z.number(),
  startTime: z.string(),
  message: z.string().optional(),
});
export type StartSessionResponse = z.infer<typeof StartSessionResponseSchema>;

// Complete session DTOs
export const CompleteSessionRequestSchema = z.object({
  sessionId: z.string(),
  hederaAccountId: z.string().regex(/^\d+\.\d+\.\d+$/, 'Invalid Hedera account ID format'),
  mode: SessionMode,
  actualDuration: z.number().min(1).max(120), // Actual duration in minutes
  signedProof: z.string(), // Signed proof payload from client
  encryptedReflection: EncryptedReflectionSchema.optional(),
  reflectionText: z.string().optional(), // Placeholder for future encryption work
});
export type CompleteSessionRequest = z.infer<typeof CompleteSessionRequestSchema>;

export const GardenPreviewSchema = z.object({
  tilesCompleted: z.number(),
  totalTiles: z.number(),
  nextTileId: z.number().optional(),
  isGridComplete: z.boolean(),
  completionDate: z.string().optional(),
});
export type GardenPreview = z.infer<typeof GardenPreviewSchema>;

export const CompleteSessionResponseSchema = z.object({
  success: z.boolean(),
  sessionId: z.string(),
  xpEarned: z.number(),
  totalXP: z.number(),
  level: z.number(),
  gardenPreview: GardenPreviewSchema,
  hcsMetadata: z.object({
    topicId: z.string(),
    sequenceNumber: z.number(),
    consensusTimestamp: z.string(),
  }).optional(),
  message: z.string().optional(),
});
export type CompleteSessionResponse = z.infer<typeof CompleteSessionResponseSchema>;

// Error response
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  error: z.string().optional(),
});
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
