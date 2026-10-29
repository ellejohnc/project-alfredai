// Content moderation utilities for chat

export interface ModerationResult {
  isClean: boolean;
  warningType: "profanity" | "injection" | "personal_info" | "xss" | null;
  message: string | null;
  shouldBlock: boolean;
}

// Common profanity patterns (basic list - expand as needed)
const PROFANITY_PATTERNS = [
  /\b(fuck|shit|damn|ass|bitch|bastard|crap)\b/i,
  /\b(wtf|stfu|lmao|lmfao)\b/i,
];

// Prompt injection patterns
const INJECTION_PATTERNS = [
  /ignore (previous|all|your|the) (instructions?|prompts?|rules?)/i,
  /disregard (your|all|the) (guidelines?|instructions?)/i,
  /pretend (you are|to be|you're) (a different|another|not)/i,
  /act as if you (are|were|have)/i,
  /reveal (your|the) (system|hidden|secret) (prompt|instructions?)/i,
  /what (are|is) your (system|hidden|secret) (prompt|instructions?)/i,
  /jailbreak/i,
  /\bDAN\b/, // "Do Anything Now" jailbreak
  /bypass (your|the|all) (restrictions?|filters?|safety)/i,
];

// Personal info patterns
const PERSONAL_INFO_PATTERNS = [
  /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/, // SSN format
  /\b\d{4}[-.\s]?\d{4}[-.\s]?\d{4}[-.\s]?\d{4}\b/, // Credit card format
  /\b\d{16}\b/, // 16-digit number
  /\bpassword\s*[:=]\s*\S+/i, // Password sharing
];

// XSS patterns
const XSS_PATTERNS = [
  /<script\b[^>]*>/i,
  /javascript:/i,
  /on\w+\s*=/i, // onclick=, onerror=, etc.
  /<iframe/i,
  /<object/i,
  /<embed/i,
];

export const moderateContent = (input: string): ModerationResult => {
  const trimmed = input.trim();
  
  // Check for XSS (highest priority - always block)
  if (XSS_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return {
      isClean: false,
      warningType: "xss",
      message: null, // Silent rejection
      shouldBlock: true,
    };
  }
  
  // Check for prompt injection (block and notify)
  if (INJECTION_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return {
      isClean: false,
      warningType: "injection",
      message: null, // Silently handle - don't reveal detection
      shouldBlock: false, // Let it through but the AI will handle it
    };
  }
  
  // Check for profanity (warn, don't block)
  if (PROFANITY_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return {
      isClean: false,
      warningType: "profanity",
      message: "Let's keep things professional. How can I help you with alfred ai?",
      shouldBlock: true,
    };
  }
  
  // Check for personal info (warn, don't block)
  if (PERSONAL_INFO_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return {
      isClean: false,
      warningType: "personal_info",
      message: "Please don't share sensitive personal information in chat. Your security is important to us.",
      shouldBlock: false, // Warn but allow
    };
  }
  
  return { isClean: true, warningType: null, message: null, shouldBlock: false };
};

// Sanitize input by removing potentially dangerous content
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, "") // Remove event handlers
    .trim();
};
