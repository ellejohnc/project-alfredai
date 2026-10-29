import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { X, Handshake, MessageCircle, Calendar, Mail, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLeadIdentity } from "@/hooks/useLeadIdentity";
import { usePartnerChat } from "@/hooks/usePartnerChat";
import { PartnerLeadForm } from "./PartnerLeadForm";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface PartnerChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerType: string;
  partnerTitle: string;
  partnerGradient?: string;
}

// Helper to get theme colors based on partner type
const getThemeColors = (partnerType: string) => {
  switch (partnerType) {
    case 'implementation':
      return {
        headerBg: 'from-secondary/5 to-secondary/10',
        iconBg: 'from-secondary to-secondary/60',
        quickActionBg: 'bg-secondary/10 hover:bg-secondary/20 text-secondary',
        suggestionBg: 'bg-secondary/10 hover:bg-secondary/20 text-secondary',
      };
    case 'technology':
      return {
        headerBg: 'from-violet-500/5 to-violet-500/10',
        iconBg: 'from-violet-500 to-violet-400',
        quickActionBg: 'bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-400',
        suggestionBg: 'bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-400',
      };
    case 'sales':
      return {
        headerBg: 'from-amber-500/5 to-amber-500/10',
        iconBg: 'from-amber-500 to-amber-400',
        quickActionBg: 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400',
        suggestionBg: 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400',
      };
    case 'consulting':
      return {
        headerBg: 'from-emerald-500/5 to-emerald-500/10',
        iconBg: 'from-emerald-500 to-emerald-400',
        quickActionBg: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
        suggestionBg: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
      };
    case 'training':
      return {
        headerBg: 'from-cyan-500/5 to-cyan-500/10',
        iconBg: 'from-cyan-500 to-cyan-400',
        quickActionBg: 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400',
        suggestionBg: 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400',
      };
    default: // referral
      return {
        headerBg: 'from-primary/5 to-primary/10',
        iconBg: 'from-primary to-primary/60',
        quickActionBg: 'bg-primary/10 hover:bg-primary/20 text-primary',
        suggestionBg: 'bg-primary/10 hover:bg-primary/20 text-primary',
      };
  }
};

const getQuickActions = (partnerType: string) => {
  switch (partnerType) {
    case 'implementation':
      return [
        { label: "Certification process", query: "What is the certification process?" },
        { label: "Revenue model", query: "How do Implementation Partners earn revenue?" },
        { label: "Technical training", query: "What technical training is provided?" },
        { label: "Get started", query: "How do I get started as an Implementation Partner?" },
      ];
    case 'technology':
      return [
        { label: "Integration process", query: "How does the technology integration process work?" },
        { label: "API access", query: "What API access do Technology Partners get?" },
        { label: "Co-development", query: "How does joint solution development work?" },
        { label: "Get started", query: "How do I become a Technology Partner?" },
      ];
    case 'sales':
      return [
        { label: "Commission rates", query: "What are the sales partner commission rates?" },
        { label: "Territory options", query: "How does territory exclusivity work?" },
        { label: "Earnings examples", query: "Can you show me earnings calculation examples?" },
        { label: "Get started", query: "How do I become a Sales Partner?" },
      ];
    case 'consulting':
      return [
        { label: "Partnership model", query: "How does the consulting partnership model work?" },
        { label: "Client advisory", query: "What advisory resources are available?" },
        { label: "Revenue model", query: "How do Consulting Partners earn revenue?" },
        { label: "Get started", query: "How do I become a Consulting Partner?" },
      ];
    case 'training':
      return [
        { label: "Certification program", query: "What is the trainer certification program?" },
        { label: "Revenue share", query: "How does the per-student revenue share work?" },
        { label: "Training materials", query: "What training materials are provided?" },
        { label: "Get started", query: "How do I become a Training Partner?" },
      ];
    default: // referral
      return [
        { label: "Commission rates", query: "What are the commission rates?" },
        { label: "How to earn", query: "How does the referral process work?" },
        { label: "Deal protection", query: "How does deal registration protection work?" },
        { label: "Get started", query: "How do I get started as a referral partner?" },
      ];
  }
};

// Parse quick reply suggestions from assistant response
const parseSuggestedReplies = (content: string): { mainContent: string; suggestions: string[] } => {
  // Match "**Quick replies:**" section at end
  const quickRepliesPattern = /\*\*Quick replies:\*\*\s*([\s\S]*?)$/i;
  const match = content.match(quickRepliesPattern);
  
  if (!match) {
    return { mainContent: content, suggestions: [] };
  }
  
  const mainContent = content.replace(quickRepliesPattern, '').trim();
  const suggestionsText = match[1];
  
  // Extract bullet points - clean up and limit to concise labels
  const suggestions = suggestionsText
    .split(/\n/)
    .map(line => line.replace(/^[-•*]\s*/, '').replace(/^["']|["']$/g, '').trim())
    .filter(line => line.length > 0 && line.length <= 30);
  
  return { mainContent, suggestions: suggestions.slice(0, 3) };
};

export function PartnerChatModal({ isOpen, onClose, partnerType, partnerTitle, partnerGradient }: PartnerChatModalProps) {
  const theme = getThemeColors(partnerType);
  const { leadIdentity, updateLeadIdentity, isLoading: isLoadingIdentity } = useLeadIdentity();
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    createSession,
    addWelcomeMessage,
    clearMessages,
  } = usePartnerChat({
    partnerType,
  });

  // Determine if we need to show lead form
  useEffect(() => {
    if (isOpen && !isLoadingIdentity) {
      if (leadIdentity.email && leadIdentity.name) {
        // User already identified - go straight to chat
        setShowLeadForm(false);
        if (messages.length === 0) {
          // Create session and add welcome message
          createSession({
            name: leadIdentity.name,
            email: leadIdentity.email,
            company: leadIdentity.company,
          });
          addWelcomeMessage(leadIdentity.name?.split(' ')[0], partnerType);
        }
      } else {
        // Need to collect lead info
        setShowLeadForm(true);
      }
    }
  }, [isOpen, isLoadingIdentity, leadIdentity, messages.length, createSession, addWelcomeMessage]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !showLeadForm && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, showLeadForm]);

  const handleLeadFormSubmit = async (data: { name: string; email: string; company?: string }) => {
    // Update lead identity (saves to localStorage + database)
    await updateLeadIdentity(data);
    
    // Create chat session
    await createSession(data);
    
    // Add welcome message
    addWelcomeMessage(data.name.split(' ')[0], partnerType);
    
    // Show chat
    setShowLeadForm(false);
  };

  const handleSendMessage = useCallback(() => {
    if (!inputValue.trim() || isLoading) return;
    sendMessage(inputValue);
    setInputValue("");
  }, [inputValue, isLoading, sendMessage]);

  const handleQuickAction = (query: string) => {
    sendMessage(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClose = () => {
    onClose();
    // Don't clear messages - keep session for returning users
  };

  const handleBookCall = () => {
    // Open booking modal or navigate to booking page
    window.open('/contact?type=partnership', '_blank');
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent 
        hideCloseButton
        className={cn(
          "flex flex-col p-0 gap-0 overflow-hidden",
          isMobile 
            ? "w-full h-[100dvh] max-w-full max-h-full rounded-none" 
            : "w-[720px] h-[900px] max-h-[90vh] rounded-2xl"
        )}
      >
        <VisuallyHidden>
          <DialogTitle>{partnerTitle} Chat</DialogTitle>
        </VisuallyHidden>
        
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r ${theme.headerBg}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 bg-gradient-to-br ${theme.iconBg} rounded-xl flex items-center justify-center shadow-lg`}>
              <Handshake className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">{partnerTitle} Expert</h3>
              <p className="text-xs text-muted-foreground">Ask me anything about partnerships</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8 rounded-full hover:bg-background/80"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {isLoadingIdentity ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex items-center justify-center"
            >
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </motion.div>
          ) : showLeadForm ? (
            <motion.div
              key="lead-form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 overflow-auto"
            >
              <PartnerLeadForm
                onSubmit={handleLeadFormSubmit}
                partnerType={partnerType}
                partnerTitle={partnerTitle}
              />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col min-h-0"
            >
              {/* Messages */}
              <ScrollArea className="flex-1 px-4 py-4">
                <div className="space-y-4">
                  {messages.map((message, index) => {
                    const isLastAssistant = message.role === "assistant" && index === messages.length - 1;
                    const { mainContent, suggestions } = message.role === "assistant" 
                      ? parseSuggestedReplies(message.content)
                      : { mainContent: message.content, suggestions: [] };
                    
                    return (
                      <div key={message.id} className="space-y-2">
                        <div
                          className={cn(
                            "flex",
                            message.role === "user" ? "justify-end" : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                              message.role === "user"
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : "bg-muted text-foreground rounded-bl-md"
                            )}
                          >
                            {message.role === "assistant" ? (
                              <div className="prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown
                                  components={{
                                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                    ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                                    li: ({ children }) => <li className="text-sm">{children}</li>,
                                  }}
                                >
                                  {mainContent}
                                </ReactMarkdown>
                              </div>
                            ) : (
                              message.content
                            )}
                          </div>
                        </div>
                        
                        {/* Quick reply buttons - show for last assistant message */}
                        {isLastAssistant && suggestions.length > 0 && !isLoading && (
                          <motion.div 
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.2 }}
                            className="flex flex-wrap gap-2 pl-1"
                          >
                            {suggestions.map((suggestion, idx) => (
                              <motion.button
                                key={idx}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 + idx * 0.1 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleQuickAction(suggestion)}
                                className={`min-h-[44px] px-4 py-2 text-sm font-medium ${theme.suggestionBg} rounded-full transition-colors touch-manipulation`}
                              >
                                {suggestion}
                              </motion.button>
                            ))}
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Quick Actions - show only on welcome message */}
              {messages.length === 1 && messages[0].role === "assistant" && (
                <div className="px-4 pb-2">
                  <div className="flex flex-wrap gap-2">
                    {getQuickActions(partnerType).map((action) => (
                      <button
                        key={action.label}
                        onClick={() => handleQuickAction(action.query)}
                        className={`min-h-[44px] px-4 py-2 text-xs font-medium ${theme.quickActionBg} rounded-full transition-colors touch-manipulation`}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="px-4 pb-2">
                  <div className="flex items-center gap-2 px-3 py-2 bg-destructive/10 text-destructive text-xs rounded-lg">
                    <span>{error}</span>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs underline"
                      onClick={() => window.location.href = `mailto:partnerships@getalfredai.com?subject=Chat Error&body=Page: ${window.location.href}`}
                    >
                      Email us
                    </Button>
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-4 border-t border-border bg-background">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about the partner program..."
                    className="flex-1 bg-muted/50 border border-border rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    size="icon"
                    className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 flex-shrink-0"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                
                {/* Book a Call CTA */}
                <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                  <button
                    onClick={handleBookCall}
                    className="flex items-center gap-1.5 hover:text-primary transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Book a call
                  </button>
                  <span className="text-border">|</span>
                  <a
                    href="mailto:partnerships@getalfredai.com"
                    className="flex items-center gap-1.5 hover:text-primary transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Email us
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
