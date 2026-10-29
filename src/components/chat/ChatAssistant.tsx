import { useState, useRef, useEffect, useCallback, forwardRef, memo } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { MessageCircle, Calendar, WifiOff, AlertTriangle, ThumbsUp, ThumbsDown, ChevronDown, RotateCcw, GripVertical, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatStream, Message } from "@/hooks/useChatStream";
import ChatFallback from "@/components/chat/ChatFallback";
import ChatValidationError from "@/components/chat/ChatValidationError";
import { getCharacterCount } from "@/lib/chatValidation";
import { useIsMobile } from "@/hooks/use-mobile";
import { useChatContext } from "@/contexts/ChatContext";
import { useChatSounds } from "@/hooks/useChatSounds";
import {
  ChatContainer,
  ChatHeader,
  ChatMessage,
  ChatTypingIndicator,
  ChatInput,
  QuickActionButton,
} from "@/components/chat/shared";

import { getPageSuggestions } from "@/lib/chat/pageSuggestions";
import { useLocation } from "react-router-dom";
import { extractCards, stripQualification, bookingUrlWith, type Qualification } from "@/lib/chat/chatCards";
import { BOOKING_PAGE_URL } from "@/lib/bookingConfig";
import { supabase } from "@/integrations/supabase/client";

interface ChatAssistantProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const ChatAssistantInner = memo(({ isOpen: controlledIsOpen, onOpenChange }: ChatAssistantProps) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const { openBooking } = useChatContext();
  const { playOpen, playClose, playMessage, playSend } = useChatSounds();
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [chatSize, setChatSize] = useState({ width: 380, height: 600 });
  const isResizingRef = useRef(false);
  
  // Support both controlled and uncontrolled modes
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = (value: boolean) => {
    if (value) {
      playOpen();
    } else {
      playClose();
    }
    setInternalIsOpen(value);
    onOpenChange?.(value);
  };
  const [input, setInput] = useState("");
  const isMobile = useIsMobile();
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

  const { pathname } = useLocation();
  const pageSuggestions = getPageSuggestions(pathname);
  const QUICK_ACTIONS = [...pageSuggestions.suggestions, "View live demos"];
  const INITIAL_MESSAGE: Message = { role: "assistant", content: pageSuggestions.greeting };
  const allMessages = [INITIAL_MESSAGE, ...messages].map((m) =>
    m.role === "assistant" ? { ...m, content: stripQualification(m.content).text } : m);
  // Qualifying answers picked up over the conversation
  const qualification: Qualification = messages.reduce<Qualification>(
    (acc, m) => (m.role === "assistant" ? { ...acc, ...stripQualification(m.content).qualification } : acc), {});
  const qualificationKey = JSON.stringify(qualification);
  const savedLeadRef = useRef<string | null>(null);
  useEffect(() => {
    if (qualificationKey === "{}") return;
    try { sessionStorage.setItem("chat_qualification", qualificationKey); } catch { /* storage unavailable */ }
    const q = JSON.parse(qualificationKey) as Qualification;
    if (q.email && /@/.test(q.email) && savedLeadRef.current !== q.email && !isLoading) {
      savedLeadRef.current = q.email;
      supabase.functions.invoke("queue-demo-lead", { body: {
        lead_email: q.email, lead_name: q.name ?? "", lead_company: q.company ?? "",
        source_page: pathname, source_medium: "website_chat", source_campaign: "chat_qualification",
        lead_source: "website_chat", demo_id: "website-chat", demo_title: `Website chat — Trade: ${q.trade ?? "-"} | Size: ${q.size ?? "-"} | Software: ${q.software ?? "-"} | Challenge: ${q.challenge ?? "-"} | Timeline: ${q.timeline ?? "-"}`,
      } }).catch((err) => console.error("Chat lead save failed:", err));
    }
  }, [qualificationKey, isLoading, pathname]);
  const reportIssueHref = `mailto:hello@alfredai.bot?subject=${encodeURIComponent("Chatbot issue")}&body=${encodeURIComponent(`Page: ${typeof window !== "undefined" ? window.location.href : pathname}\n\nWhat went wrong:\n\n(Please attach a screenshot of the page.)`)}`;

  // Check if scrolled up to show scroll-to-bottom button
  const handleMessagesScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isNearBottom && messages.length > 3);
  }, [messages.length]);

  // Always auto-scroll smoothly when new messages arrive
  const prevMessagesLengthForScroll = useRef(allMessages.length);
  useEffect(() => {
    if (allMessages.length > prevMessagesLengthForScroll.current) {
      // Small delay to ensure DOM has updated
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
    prevMessagesLengthForScroll.current = allMessages.length;
  }, [allMessages.length]);

  // Also scroll when loading state changes (e.g., typing indicator appears)
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
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Check for demo booking trigger in last message
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "assistant" && lastMessage.content.includes("[BOOK_DEMO]")) {
      handleBookCall();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    clearValidationError();
    clearModerationWarning();
    playSend();
    sendMessage(input.trim());
    setInput("");
  };

  // Play sound when receiving a message
  const prevMessagesLength = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.role === "assistant") {
        playMessage();
      }
    }
    prevMessagesLength.current = messages.length;
  }, [messages, playMessage]);

  const handleQuickAction = (action: string) => {
    if (action === "Book a demo") {
      handleBookCall();
    } else if (action === "View live demos") {
      window.location.href = "/resources/demos";
    } else {
      sendMessage(action);
    }
  };

  const handleBookCall = () => {
    window.location.href = bookingUrlWith(BOOKING_PAGE_URL, qualification);
  };

  const handleClearAndRetry = () => {
    clearMessages();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleReset = () => {
    clearMessages();
    setInput("");
  };

  // Resize handlers
  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (isMobile) return;
    e.preventDefault();
    isResizingRef.current = true;
    
    const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const startWidth = chatSize.width;
    const startHeight = chatSize.height;

    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!isResizingRef.current) return;
      
      const currentX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const currentY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
      
      // Resize from top-left corner (inverted since chat is fixed to bottom-right)
      const newWidth = Math.max(320, Math.min(600, startWidth + (startX - currentX)));
      const newHeight = Math.max(400, Math.min(800, startHeight + (startY - currentY)));
      
      setChatSize({ width: newWidth, height: newHeight });
    };

    const handleEnd = () => {
      isResizingRef.current = false;
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleEnd);
  };

  // THE FLOATING LAUNCHER IS THE DESKTOP ENTRY POINT. The header carries the
  // other one, and between them they cover every viewport exactly once.
  //
  // They did not, for three hours. The bubble was hidden below 768px
  // (useIsMobile) and the header button is rendered below 1280px (xl:hidden),
  // so every tablet showed BOTH. The comment here said "there is no mobile chat
  // entry point right now", which stopped being true 108 minutes after it was
  // written — the same stale-comment shape that removed the chat from phones in
  // the first place, and from the homepage before that.
  //
  // So the breakpoint is stated once, in CSS, at the same xl the header uses.
  // Matching it in JS with a second media query would be a third copy of the
  // same fact, and copies of a fact are what this file keeps getting wrong.
  const showButton = !isOpen;

  return (
    <>
      {/* Floating launcher — xl and above; below that the header button. */}
      <AnimatePresence>
        {showButton && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 hidden xl:flex w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-2xl shadow-primary/30 hover:shadow-primary/40 transition-all duration-300 items-center justify-center group overflow-visible"
            aria-label="Open chat"
          >
            {/* Outer ring pulse */}
            <motion.span
              className="absolute inset-0 rounded-full bg-primary/30"
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.6, 0, 0.6],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            
            {/* Second ring pulse */}
            <motion.span
              className="absolute inset-0 rounded-full bg-primary/20"
              animate={{
                scale: [1, 1.6, 1],
                opacity: [0.4, 0, 0.4],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.8,
              }}
            />
            
            {/* Icon with subtle float */}
            <motion.div
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <MessageCircle className="w-7 h-7" />
            </motion.div>
            
            {/* Status indicator with glow */}
            <motion.span
              className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-secondary rounded-full border-2 border-background"
              animate={{
                scale: [1, 1.15, 1],
                boxShadow: [
                  "0 0 0 0 hsl(var(--secondary) / 0.4)",
                  "0 0 8px 2px hsl(var(--secondary) / 0.6)",
                  "0 0 0 0 hsl(var(--secondary) / 0.4)",
                ],
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed z-[60] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={isMobile ? {
              bottom: 'calc(96px + env(safe-area-inset-bottom))',
              right: '12px',
              width: 'calc(100vw - 24px)',
              height: 'calc(100dvh - 140px - env(safe-area-inset-bottom))',
            } : {
              bottom: '24px',
              right: '24px',
              width: `${chatSize.width}px`,
              height: `${chatSize.height}px`,
              maxWidth: 'calc(100vw - 48px)',
              maxHeight: 'calc(100vh - 100px)',
            }}
          >
            {/* Resize handle - top left corner (desktop only) */}
            {!isMobile && (
              <div
                onMouseDown={handleResizeStart}
                onTouchStart={handleResizeStart}
                className="absolute top-0 left-0 w-6 h-6 cursor-nwse-resize z-20 group"
              >
                <div className="absolute top-1 left-1 w-4 h-4 flex items-center justify-center opacity-30 group-hover:opacity-70 transition-opacity">
                  <GripVertical className="w-3 h-3 text-muted-foreground rotate-[-45deg]" />
                </div>
              </div>
            )}

            
            <div className="relative flex flex-col h-full">
              <ChatHeader
                title="Alfred"
                subtitle="alfred ai Assistant"
                isOnline={isOnline}
                onClose={() => setIsOpen(false)}
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
              onScroll={handleMessagesScroll}
              className="flex-1 overflow-y-auto p-4 space-y-4 relative overscroll-contain touch-pan-y"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {allMessages.map((msg, idx) => (
                <div key={idx} className="space-y-2">
                <ChatMessage
                  key={idx}
                  role={msg.role}
                  content={msg.content}
                  showAvatar={msg.role === "assistant"}
                  animationDelay={idx === 0 ? 0.2 : 0}
                  onSuggestionClick={(suggestion) => {
                    if (suggestion.toLowerCase().includes("book") || suggestion.toLowerCase().includes("demo")) {
                      handleBookCall();
                    } else {
                      sendMessage(suggestion);
                    }
                  }}
                />
                {msg.role === "assistant" && idx > 0 && !(isLoading && idx === allMessages.length - 1) && extractCards(msg.content).length > 0 && (
                  <div className="ml-8 grid gap-2">
                    {extractCards(msg.content).map((c) => (
                      <a key={c.href} href={c.href} className="block min-h-[44px] rounded-xl border border-border bg-background p-3 hover:bg-muted transition-colors">
                        <span className="block text-sm font-semibold text-foreground">{c.title}</span>
                        <span className="block text-xs text-muted-foreground line-clamp-2">{c.subtitle}</span>
                        <span className="mt-1 inline-block text-xs font-medium text-foreground underline underline-offset-2">{c.cta} →</span>
                      </a>
                    ))}
                  </div>
                )}
                </div>
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
                    Want to talk to a person? Book a demo
                  </button>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Scroll to bottom button */}
            <AnimatePresence>
              {showScrollButton && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={scrollToBottom}
                  className="absolute bottom-32 right-4 w-8 h-8 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center z-10"
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Quick Actions (only show at start) */}
            {messages.length === 0 && !error && (
              <div className="px-4 pb-3">
                <div className="flex flex-wrap gap-2">
                  {QUICK_ACTIONS.map((action) => (
                    <QuickActionButton
                      key={action}
                      label={action}
                      onClick={() => handleQuickAction(action)}
                      icon={action === "View live demos" ? Play : undefined}
                      variant={action === "View live demos" ? "rainbow" : "default"}
                      size="sm"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-border bg-background/50 space-y-3">
              {/* Persistent Book Demo Button */}
              <button
                onClick={handleBookCall}
                className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-cta text-cta-foreground hover:bg-cta-hover font-medium text-sm active:scale-[0.98] transition-all duration-200"
              >
                <Calendar className="w-4 h-4 text-accent" />
                Book a demo
              </button>
              <a href={reportIssueHref} className="block text-center text-xs text-muted-foreground underline-offset-2 hover:underline py-1">
                Report an issue with this chat
              </a>

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
                placeholder="Ask me anything..."
                isLoading={isLoading}
                isOnline={isOnline}
                maxLength={2000}
                showCharCount={charCount.isNearLimit}
                charCountThreshold={1800}
              />
            </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

ChatAssistantInner.displayName = 'ChatAssistantInner';

// Wrap with forwardRef for lazy loading compatibility
const ChatAssistant = forwardRef<HTMLDivElement, ChatAssistantProps>((props, _ref) => (
  <ChatAssistantInner {...props} />
));

ChatAssistant.displayName = 'ChatAssistant';

export default ChatAssistant;
