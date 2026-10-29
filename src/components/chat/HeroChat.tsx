import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { Calendar, AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatStream, Message } from "@/hooks/useChatStream";
import BookingChatModal from "@/components/BookingChatModal";
import ChatFallback from "@/components/chat/ChatFallback";
import ChatValidationError from "@/components/chat/ChatValidationError";
import { getCharacterCount } from "@/lib/chatValidation";
import {
  ChatHeader,
  ChatMessage,
  ChatTypingIndicator,
  ChatInput,
  QuickActionButton,
} from "@/components/chat/shared";

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content: "Hi! I'm Alfred. Tell me about your business challenges and I'll show you how alfred ai can help.",
};

const QUICK_ACTIONS = [
  "What is alfred ai?",
  "How can it reduce admin work?",
  "Book an Impact Conversation",
];

interface HeroChatProps {
  onClose: () => void;
}

const HeroChat = ({ onClose }: HeroChatProps) => {
  const [input, setInput] = useState("");
  const [isCalendlyOpen, setIsCalendlyOpen] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  const { 
    messages, 
    isLoading, 
    error, 
    errorType,
    retryCount,
    isOnline,
    loadingDuration,
    validationError,
    moderationWarning,
    shouldOfferHuman,
    sendMessage, 
    clearMessages,
    retryLastMessage,
    clearValidationError,
    clearModerationWarning,
    canRetry,
  } = useChatStream();
  
  const charCount = getCharacterCount(input);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const allMessages = [INITIAL_MESSAGE, ...messages];

  // Always auto-scroll smoothly when new messages arrive
  const prevMessagesLength = useRef(allMessages.length);
  useEffect(() => {
    if (allMessages.length > prevMessagesLength.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
    prevMessagesLength.current = allMessages.length;
  }, [allMessages.length]);

  // Scroll when loading state changes
  useEffect(() => {
    if (isLoading) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  }, [isLoading]);

  // Scroll when assistant message content updates (streaming)
  const lastMessageContent = allMessages[allMessages.length - 1]?.content;
  useEffect(() => {
    if (allMessages[allMessages.length - 1]?.role === "assistant") {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  }, [lastMessageContent]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Check for demo booking trigger in last message
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "assistant" && lastMessage.content.includes("[BOOK_DEMO]")) {
      setIsCalendlyOpen(true);
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    clearValidationError();
    clearModerationWarning();
    sendMessage(input.trim());
    setInput("");
  };

  const handleQuickAction = (action: string) => {
    if (action === "Book an Impact Conversation") {
      setIsCalendlyOpen(true);
    } else {
      sendMessage(action);
    }
  };

  const handleBookCall = () => {
    setIsCalendlyOpen(true);
  };

  const handleClearAndRetry = () => {
    clearMessages();
  };

  const handleReset = () => {
    clearMessages();
    setInput("");
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-2xl bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Glassmorphism overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-secondary/[0.03] pointer-events-none rounded-2xl" />
        
        {/* Decorative grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative z-10 flex flex-col h-full">
          <ChatHeader
            title="Chat with Alfred"
            subtitle="Your AI guide to alfred ai"
            isOnline={isOnline}
            onClose={onClose}
            variant="gradient"
          >
            {/* Reset button */}
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleReset}
                className="h-8 w-8 rounded-full hover:bg-muted"
                title="Reset conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </ChatHeader>

          {/* Messages */}
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[300px] min-h-[200px] overscroll-contain touch-pan-y"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {allMessages.map((msg, idx) => (
              <ChatMessage
                key={idx}
                role={msg.role}
                content={msg.content}
                showAvatar={msg.role === "assistant"}
                animationDelay={idx === 0 ? 0.2 : 0}
                onSuggestionClick={(suggestion) => {
                  if (suggestion.toLowerCase().includes("book") || suggestion.toLowerCase().includes("demo")) {
                    setIsCalendlyOpen(true);
                  } else {
                    sendMessage(suggestion);
                  }
                }}
              />
            ))}

            {isLoading && (
              <ChatTypingIndicator
                showAvatar
                loadingDuration={loadingDuration}
                variant="dots"
              />
            )}

            {/* Error Fallback UI */}
            {errorType && !isLoading && (
              <ChatFallback
                errorType={errorType}
                onRetry={canRetry ? retryLastMessage : undefined}
                onBookCall={handleBookCall}
                onClear={handleClearAndRetry}
                canRetry={canRetry}
                retryCount={retryCount}
              />
            )}

            {/* Offer human assistance */}
            {shouldOfferHuman && !errorType && !isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center"
              >
                <button
                  onClick={handleBookCall}
                  className="text-xs px-4 py-2 rounded-full bg-secondary/20 text-secondary-foreground hover:bg-secondary/30 transition-colors flex items-center gap-2"
                >
                  <Calendar className="w-3 h-3" />
                  Want to talk to a human? Book an Impact Conversation
                </button>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length === 0 && !error && (
            <div className="px-5 pb-3">
              <div className="flex flex-wrap gap-2">
                {QUICK_ACTIONS.map((action) => (
                  <QuickActionButton
                    key={action}
                    label={action}
                    onClick={() => handleQuickAction(action)}
                    icon={action === "Book an Impact Conversation" ? Calendar : undefined}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-border bg-background/30 backdrop-blur-sm space-y-3">
            {/* Persistent Book Demo Button */}
            <button
              onClick={handleBookCall}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-medium text-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <Calendar className="w-4 h-4" />
              Book an Impact Conversation
            </button>

            {/* Validation Error */}
            <AnimatePresence>
              {validationError && validationError.errorType && validationError.message && (
                <ChatValidationError 
                  errorType={validationError.errorType} 
                  message={validationError.message} 
                />
              )}
            </AnimatePresence>

            {/* Moderation Warning */}
            <AnimatePresence>
              {moderationWarning && moderationWarning.message && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-warning bg-warning/10 rounded-lg border border-warning/20"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>{moderationWarning.message}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <ChatInput
              ref={inputRef}
              value={input}
              onChange={setInput}
              onSend={handleSend}
              placeholder="Ask me anything about alfred ai..."
              isLoading={isLoading}
              isOnline={isOnline}
              size="lg"
              maxLength={2000}
              showCharCount={charCount.isNearLimit}
              charCountThreshold={1800}
            />

            {/* Keyboard hint */}
            <p className="text-center text-xs text-muted-foreground/60">
              Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px]">Enter</kbd> to send
            </p>
          </div>
        </div>
      </motion.div>

      <BookingChatModal isOpen={isCalendlyOpen} onClose={() => setIsCalendlyOpen(false)} />
    </>
  );
};

export default HeroChat;
