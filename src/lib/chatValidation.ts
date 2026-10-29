// Chat input validation utilities

export type ValidationErrorType = 
  | "too_long" 
  | "too_short" 
  | "rate_limited" 
  | "duplicate" 
  | "gibberish" 
  | "spam";

export interface ValidationResult {
  isValid: boolean;
  errorType: ValidationErrorType | null;
  message: string | null;
}

// Constants
const MAX_MESSAGE_LENGTH = 2000;
const MIN_MESSAGE_LENGTH = 1;
const MAX_MESSAGES_PER_WINDOW = 5;
const RATE_LIMIT_WINDOW_MS = 30000; // 30 seconds
const DUPLICATE_WINDOW_MS = 10000; // 10 seconds
const MAX_SPECIAL_CHAR_RATIO = 0.5; // 50%

// Gibberish patterns (keyboard mashing, repeated chars)
const GIBBERISH_PATTERNS = [
  /^[asdfghjkl]+$/i,
  /^[qwertyuiop]+$/i,
  /^[zxcvbnm]+$/i,
  /(.)\1{5,}/, // Same character 6+ times in a row
  /^[^a-zA-Z0-9\s]{10,}$/, // 10+ special chars only
];

// Store for rate limiting and duplicate detection
const messageHistory: { content: string; timestamp: number }[] = [];

export const validateMessage = (input: string): ValidationResult => {
  const trimmed = input.trim();
  
  // Check minimum length
  if (trimmed.length < MIN_MESSAGE_LENGTH) {
    return {
      isValid: false,
      errorType: "too_short",
      message: "Please enter a message",
    };
  }
  
  // Check maximum length
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return {
      isValid: false,
      errorType: "too_long",
      message: `Message is too long (${trimmed.length}/${MAX_MESSAGE_LENGTH} characters)`,
    };
  }
  
  const now = Date.now();
  
  // Clean up old history
  while (messageHistory.length > 0 && now - messageHistory[0].timestamp > RATE_LIMIT_WINDOW_MS) {
    messageHistory.shift();
  }
  
  // Check rate limiting
  if (messageHistory.length >= MAX_MESSAGES_PER_WINDOW) {
    const oldestInWindow = messageHistory[0];
    const waitTime = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - oldestInWindow.timestamp)) / 1000);
    return {
      isValid: false,
      errorType: "rate_limited",
      message: `Please wait ${waitTime} seconds before sending more messages`,
    };
  }
  
  // Check for duplicates
  const recentDuplicate = messageHistory.find(
    (h) => h.content.toLowerCase() === trimmed.toLowerCase() && now - h.timestamp < DUPLICATE_WINDOW_MS
  );
  if (recentDuplicate) {
    return {
      isValid: false,
      errorType: "duplicate",
      message: "You already sent this message",
    };
  }
  
  // Check for gibberish patterns
  if (GIBBERISH_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return {
      isValid: false,
      errorType: "gibberish",
      message: "I didn't quite catch that. Could you rephrase?",
    };
  }
  
  // Check special character ratio
  const specialChars = trimmed.replace(/[a-zA-Z0-9\s]/g, "").length;
  if (trimmed.length > 5 && specialChars / trimmed.length > MAX_SPECIAL_CHAR_RATIO) {
    return {
      isValid: false,
      errorType: "spam",
      message: "Please use regular text in your message",
    };
  }
  
  return { isValid: true, errorType: null, message: null };
};

export const recordMessage = (content: string): void => {
  messageHistory.push({ content: content.trim(), timestamp: Date.now() });
};

export const getCharacterCount = (input: string): { current: number; max: number; isNearLimit: boolean } => {
  const current = input.length;
  return {
    current,
    max: MAX_MESSAGE_LENGTH,
    isNearLimit: current >= MAX_MESSAGE_LENGTH * 0.9, // 90% of limit
  };
};

export const clearMessageHistory = (): void => {
  messageHistory.length = 0;
};
