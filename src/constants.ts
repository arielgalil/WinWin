/**
 * Application-wide constants and configuration values
 */

// ============================================
// TIMING CONSTANTS
// ============================================

/**
 * AI Commentary throttling and delays
 */
export const AI_CONSTANTS = {
  /** Minimum time between AI commentary generations (milliseconds) */
  COMMENTARY_THROTTLE_MS: 10000, // Increased from 5000 to reduce API costs
  
  /** Timeout for AI API calls (milliseconds) */
  API_TIMEOUT_MS: 30000,
} as const;

/**
 * Competition event detection thresholds and timings
 */
export const EVENT_CONSTANTS = {
  /** Minimum points jump to trigger student spotlight (increased from 50) */
  STUDENT_JUMP_THRESHOLD: 50,
  
  /** Minimum points jump to trigger class boost notification (increased from 200) */
  CLASS_BOOST_THRESHOLD: 200,
  
  /** Minimum time between student jump notifications (milliseconds) */
  STUDENT_JUMP_THROTTLE_MS: 30000,
  
  /** Minimum time between class boost notifications (milliseconds) */
  CLASS_BOOST_THROTTLE_MS: 45000,
  
  /** Duration to highlight a class after score change (milliseconds) */
  CLASS_HIGHLIGHT_DURATION_MS: 3000,
  
  /** Duration to show spotlight on a student (milliseconds) */
  SPOTLIGHT_DURATION_MS: 3000,
} as const;

/**
 * Kiosk mode timings
 */
export const KIOSK_CONSTANTS = {
  /** Auto-dismiss kiosk start overlay after this time (milliseconds) */
  AUTO_START_DELAY_MS: 15000,
  
  /** Idle time before auto-refresh when new version detected (milliseconds) */
  AUTO_UPDATE_IDLE_MS: 60000,
} as const;

/**
 * UI Animation and transition timings
 */
export const UI_CONSTANTS = {
  /** Debounce delay for search inputs (milliseconds) */
  SEARCH_DEBOUNCE_MS: 300,
  
  /** Toast notification auto-dismiss duration (milliseconds) */
  TOAST_DURATION_MS: 3000,
  
  /** Save notification display duration (milliseconds) */
  SAVE_NOTIFICATION_DURATION_MS: 3000,
  
  /** Animation duration for page transitions (milliseconds) */
  PAGE_TRANSITION_MS: 200,
} as const;

// ============================================
// VALIDATION CONSTANTS
// ============================================

/**
 * Input validation limits
 */
export const VALIDATION_CONSTANTS = {
  /** Maximum length for sanitized AI input */
  MAX_AI_INPUT_LENGTH: 200,
  
  /** Maximum number of score presets */
  MAX_SCORE_PRESETS: 20,
  
  /** Minimum points value */
  MIN_POINTS: -10000,
  
  /** Maximum points value */
  MAX_POINTS: 1000000,
} as const;

// ============================================
// FEATURE FLAGS
// ============================================

/**
 * Feature toggles for experimental or conditional features
 */
export const FEATURE_FLAGS = {
  /** Enable PWA auto-update functionality */
  ENABLE_AUTO_UPDATE: true,
  
  /** Enable real-time subscriptions */
  ENABLE_REALTIME: true,
  
  /** Enable AI commentary */
  ENABLE_AI_COMMENTARY: true,
  
  /** Enable background music */
  ENABLE_BACKGROUND_MUSIC: true,
} as const;

// ============================================
// TYPE EXPORTS
// ============================================

export type AIConstants = typeof AI_CONSTANTS;
export type EventConstants = typeof EVENT_CONSTANTS;
export type KioskConstants = typeof KIOSK_CONSTANTS;
export type UIConstants = typeof UI_CONSTANTS;
export type ValidationConstants = typeof VALIDATION_CONSTANTS;
export type FeatureFlags = typeof FEATURE_FLAGS;
