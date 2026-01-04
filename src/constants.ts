/**
 * Centralized constants for the WinWin application.
 * All hardcoded timeouts, thresholds, and configuration values should be moved here.
 */

export const AI_CONSTANTS = {
  COMMENTARY_THROTTLE_MS: 10000, // Increased to 10s based on CR #9
  API_TIMEOUT_MS: 30000,
  MAX_RETRY_ATTEMPTS: 3,
};

export const EVENT_CONSTANTS = {
  STUDENT_JUMP_THRESHOLD: 50,
  STUDENT_JUMP_THROTTLE_MS: 30000,
  CLASS_BOOST_THRESHOLD: 100,
  CLASS_BOOST_THROTTLE_MS: 45000,
  CLASS_HIGHLIGHT_DURATION_MS: 1500, // Reduced based on CR #9 logic
};

export const KIOSK_CONSTANTS = {
  AUTO_START_DELAY_MS: 15000,
  AUTO_DISMISS_DELAY_MS: 10000,
  DASHBOARD_URL: "__DASHBOARD__",
};

export const UI_CONSTANTS = {
  DEBOUNCE_DELAY_MS: 300,
  TRANSITION_DURATION_MS: 200,
};

export const VALIDATION_CONSTANTS = {
  MIN_PASSWORD_LENGTH: 6,
  MAX_NAME_LENGTH: 100,
};

export const FEATURE_FLAGS = {
  ENABLE_AI_COMMENTARY: true,
  ENABLE_REALTIME_ALERTS: true,
};
