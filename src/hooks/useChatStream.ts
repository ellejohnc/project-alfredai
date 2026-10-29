import { useState, useCallback, useRef, useEffect } from "react";
import { ChatErrorType } from "@/components/chat/ChatFallback";
import { validateMessage, recordMessage, clearMessageHistory, ValidationResult } from "@/lib/chatValidation";
import { moderateContent, sanitizeInput, ModerationResult } from "@/lib/contentModeration";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface StageContext {
  completedStages?: string[];
  currentStage?: string;
  nextStage?: string;
  isCustomInput?: boolean;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/alfred-chat`;

const MAX_RETRIES = 3;
const TIMEOUT_MS = 30000;
const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff
const FRUSTRATION_THRESHOLD = 5; // Offer human after this many exchanges

export const useChatStream = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ChatErrorType | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [loadingDuration, setLoadingDuration] = useState(0);
  const [validationError, setValidationError] = useState<ValidationResult | null>(null);
  const [moderationWarning, setModerationWarning] = useState<ModerationResult | null>(null);
  const [exchangeCount, setExchangeCount] = useState(0);
  const [shouldOfferHuman, setShouldOfferHuman] = useState(false);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastUserMessageRef = useRef<string | null>(null);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Network awareness
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Loading duration tracker
  useEffect(() => {
    if (isLoading) {
      setLoadingDuration(0);
      loadingTimerRef.current = setInterval(() => {
        setLoadingDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (loadingTimerRef.current) {
        clearInterval(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
      setLoadingDuration(0);
    }
    
    return () => {
      if (loadingTimerRef.current) {
        clearInterval(loadingTimerRef.current);
      }
    };
  }, [isLoading]);

  const getErrorType = (status: number, errorMessage?: string): ChatErrorType => {
    if (!navigator.onLine) return "network_error";
    if (status === 429) return "rate_limit";
    if (status === 402) return "payment_required";
    if (status >= 500) return "service_error";
    if (errorMessage?.toLowerCase().includes("timeout") || errorMessage?.toLowerCase().includes("aborted")) {
      return "timeout";
    }
    return "unknown";
  };

  const validateAndModerate = useCallback((input: string): { isValid: boolean; sanitizedInput: string } => {
    // Clear previous errors
    setValidationError(null);
    setModerationWarning(null);
    
    // Validate input
    const validation = validateMessage(input);
    if (!validation.isValid) {
      setValidationError(validation);
      return { isValid: false, sanitizedInput: "" };
    }
    
    // Moderate content
    const moderation = moderateContent(input);
    if (moderation.shouldBlock) {
      if (moderation.message) {
        // Show as assistant message for profanity
        setMessages((prev) => [...prev, 
          { role: "user", content: input },
          { role: "assistant", content: moderation.message }
        ]);
      }
      return { isValid: false, sanitizedInput: "" };
    }
    
    // Warn about personal info but allow
    if (moderation.warningType === "personal_info") {
      setModerationWarning(moderation);
    }
    
    // Sanitize and return
    const sanitized = sanitizeInput(input);
    return { isValid: true, sanitizedInput: sanitized };
  }, []);

  const sendMessage = useCallback(async (input: string, isRetry = false, stageContext?: StageContext) => {
    // Check network before sending
    if (!navigator.onLine) {
      setError("You appear to be offline");
      setErrorType("network_error");
      return;
    }

    // Validate and moderate (skip for retries)
    if (!isRetry) {
      const { isValid, sanitizedInput } = validateAndModerate(input);
      if (!isValid) return;
      input = sanitizedInput;
    }

    const userMsg: Message = { role: "user", content: input };
    
    if (!isRetry) {
      setMessages((prev) => [...prev, userMsg]);
      lastUserMessageRef.current = input;
      setRetryCount(0);
      recordMessage(input); // Track for rate limiting
      setExchangeCount((prev) => {
        const newCount = prev + 1;
        if (newCount >= FRUSTRATION_THRESHOLD) {
          setShouldOfferHuman(true);
        }
        return newCount;
      });
    }
    
    setIsLoading(true);
    setError(null);
    setErrorType(null);

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Set timeout
    const timeoutId = setTimeout(() => {
      abortControllerRef.current?.abort();
    }, TIMEOUT_MS);

    let assistantContent = "";

    const upsertAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, { role: "assistant", content: assistantContent }];
      });
    };

    try {
      const currentMessages = isRetry 
        ? messages.filter(m => !(m.role === "user" && m.content === input)).concat([userMsg])
        : [...messages, userMsg];

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: currentMessages, stageContext, pagePath: window.location.pathname }),
        signal: abortControllerRef.current.signal,
      });

      clearTimeout(timeoutId);

      if (!resp.ok || !resp.body) {
        const errorData = await resp.json().catch(() => ({}));
        const errType = getErrorType(resp.status, errorData.error);
        throw { message: errorData.error || "Failed to get response", type: errType, status: resp.status };
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsertAssistant(content);
          } catch {
            /* ignore */
          }
        }
      }
      
      // Success - reset retry count
      setRetryCount(0);
    } catch (err) {
      clearTimeout(timeoutId);
      
      // Handle abort/timeout
      if (err.name === "AbortError") {
        setError("Request timed out");
        setErrorType("timeout");
      } else {
        console.error("Chat error:", err);
        setError(err.message || "An error occurred");
        setErrorType(err.type || getErrorType(err.status || 0, err.message));
      }
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const retryLastMessage = useCallback(async () => {
    if (!lastUserMessageRef.current || retryCount >= MAX_RETRIES) return;
    
    const newRetryCount = retryCount + 1;
    setRetryCount(newRetryCount);
    
    // Exponential backoff delay
    const delay = RETRY_DELAYS[Math.min(newRetryCount - 1, RETRY_DELAYS.length - 1)];
    await new Promise(resolve => setTimeout(resolve, delay));
    
    await sendMessage(lastUserMessageRef.current, true);
  }, [retryCount, sendMessage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setErrorType(null);
    setRetryCount(0);
    setValidationError(null);
    setModerationWarning(null);
    setExchangeCount(0);
    setShouldOfferHuman(false);
    clearMessageHistory();
    lastUserMessageRef.current = null;
  }, []);

  // Remove the last user-assistant exchange (for going back one step)
  const removeLastExchange = useCallback(() => {
    setMessages((prev) => {
      // Find the last user message index
      let lastUserIdx = -1;
      for (let i = prev.length - 1; i >= 0; i--) {
        if (prev[i].role === 'user') {
          lastUserIdx = i;
          break;
        }
      }
      
      if (lastUserIdx === -1) return prev;
      
      // Remove from the last user message onwards (includes assistant response)
      return prev.slice(0, lastUserIdx);
    });
    
    // Decrement exchange count
    setExchangeCount((prev) => Math.max(0, prev - 1));
  }, []);

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const clearValidationError = useCallback(() => {
    setValidationError(null);
  }, []);

  const clearModerationWarning = useCallback(() => {
    setModerationWarning(null);
  }, []);

  return { 
    messages, 
    isLoading, 
    error, 
    errorType,
    retryCount,
    isOnline,
    loadingDuration,
    validationError,
    moderationWarning,
    exchangeCount,
    shouldOfferHuman,
    sendMessage, 
    clearMessages,
    removeLastExchange,
    retryLastMessage,
    cancelRequest,
    clearValidationError,
    clearModerationWarning,
    canRetry: retryCount < MAX_RETRIES,
  };
};
