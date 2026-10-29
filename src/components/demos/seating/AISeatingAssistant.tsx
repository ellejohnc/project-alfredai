import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { 
  Bot, 
  Send, 
  Sparkles, 
  Loader2, 
  Users, 
  Shuffle, 
  Crown, 
  Building2,
  Wand2,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { AIMessage, AutoAssignStrategy, Guest, Table, Seat } from "./types";
import { aiSuggestions } from "./seatingData";

interface AISeatingAssistantProps {
  guests: Guest[];
  tables: Table[];
  seats: Map<string, Seat[]>;
  onAutoAssign?: (strategy: AutoAssignStrategy) => void;
  onClearAssignments?: () => void;
  onAssignGuest?: (guestId: string, tableId: string, seatId: string) => void;
}

export function AISeatingAssistant({
  guests,
  tables,
  seats,
  onAutoAssign,
  onClearAssignments,
  onAssignGuest,
}: AISeatingAssistantProps) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Stats
  const seatedCount = guests.filter(g => g.isSeated).length;
  const unseatedCount = guests.length - seatedCount;
  const vipCount = guests.filter(g => g.tier === 'vip').length;
  const sponsorCount = guests.filter(g => g.tier === 'sponsor').length;
  const vipSeated = guests.filter(g => g.tier === 'vip' && g.isSeated).length;

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      const greeting: AIMessage = {
        id: 'initial',
        role: 'assistant',
        content: `👋 Hello! I'm your AI seating assistant. I'll help you assign ${guests.length} guests to ${tables.length} tables optimally.\n\n**Quick stats:**\n- ${vipCount} VIP guests\n- ${sponsorCount} sponsors\n- ${unseatedCount} guests need seats\n\nHow would you like to proceed?`,
        timestamp: new Date(),
        actions: [
          { type: 'suggest', label: 'Seat VIPs near stage' },
          { type: 'suggest', label: 'Group by company' },
          { type: 'suggest', label: 'Auto-assign all' },
        ],
      };
      setMessages([greeting]);
    }
  }, [guests.length, tables.length, vipCount, sponsorCount, unseatedCount, messages.length]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  // Simulate AI response
  const simulateResponse = (userMessage: string) => {
    setIsTyping(true);
    
    setTimeout(() => {
      let responseContent = "";
      let actions: AIMessage['actions'] = [];

      const lowerMessage = userMessage.toLowerCase();

      if (lowerMessage.includes('vip') && (lowerMessage.includes('stage') || lowerMessage.includes('seat'))) {
        responseContent = `✅ **VIP Seating Complete!**\n\nI've placed ${vipCount} VIP guests at Tables 1-2 (front row near stage):\n\n`;
        const vipGuests = guests.filter(g => g.tier === 'vip');
        vipGuests.forEach((g, i) => {
          responseContent += `• ${g.name} → Table ${Math.ceil((i + 1) / 4)}, Seat ${(i % 4) + 1}\n`;
        });
        responseContent += `\n${unseatedCount - vipCount} guests still need seats.`;
        
        // Simulate assignment
        onAutoAssign?.('by-tier');
        
        actions = [
          { type: 'suggest', label: 'Now seat sponsors' },
          { type: 'suggest', label: 'Auto-assign remaining' },
        ];
      } else if (lowerMessage.includes('company') || lowerMessage.includes('colleague') || lowerMessage.includes('group')) {
        responseContent = `✅ **Company Grouping Complete!**\n\nI've grouped colleagues together:\n\n`;
        const companies = [...new Set(guests.map(g => g.company))];
        companies.slice(0, 4).forEach((company, i) => {
          const count = guests.filter(g => g.company === company).length;
          responseContent += `• ${company} (${count} guests) → Table ${i + 3}\n`;
        });
        responseContent += `\nAll teams are seated together for better networking!`;
        
        onAutoAssign?.('by-company');
        
        actions = [
          { type: 'suggest', label: 'Show seating chart' },
        ];
      } else if (lowerMessage.includes('auto') || lowerMessage.includes('all') || lowerMessage.includes('remaining')) {
        responseContent = `🎉 **All Guests Assigned!**\n\nI've optimally seated all ${guests.length} guests:\n\n`;
        responseContent += `• VIPs at front tables (1-2)\n`;
        responseContent += `• Sponsors at designated tables\n`;
        responseContent += `• Colleagues grouped together\n`;
        responseContent += `• Mixed networking at remaining tables\n\n`;
        responseContent += `Your event is ready! 🎊`;
        
        onAutoAssign?.('smart-mix');
        
        actions = [
          { type: 'suggest', label: 'Export seating chart' },
          { type: 'suggest', label: 'Make adjustments' },
        ];
      } else if (lowerMessage.includes('clear') || lowerMessage.includes('reset')) {
        responseContent = `🔄 **Assignments Cleared**\n\nAll seat assignments have been removed. You can start fresh or let me auto-assign guests.`;
        
        onClearAssignments?.();
        
        actions = [
          { type: 'suggest', label: 'Auto-assign all' },
          { type: 'suggest', label: 'Start with VIPs' },
        ];
      } else if (lowerMessage.includes('sponsor')) {
        responseContent = `✅ **Sponsor Seating Complete!**\n\nI've placed ${sponsorCount} sponsors at premium tables:\n\n`;
        const sponsors = guests.filter(g => g.tier === 'sponsor');
        sponsors.forEach((g, i) => {
          responseContent += `• ${g.name} (${g.company}) → Table ${i + 3}, Seat 1\n`;
        });
        
        actions = [
          { type: 'suggest', label: 'Auto-assign remaining' },
        ];
      } else {
        responseContent = `I understand you want to: "${userMessage}"\n\nHere are some things I can help with:\n\n`;
        responseContent += `• Seat VIPs near the stage\n`;
        responseContent += `• Group colleagues together\n`;
        responseContent += `• Optimize for networking\n`;
        responseContent += `• Auto-assign all guests\n\n`;
        responseContent += `What would you like me to do?`;
        
        actions = [
          { type: 'suggest', label: 'Seat VIPs near stage' },
          { type: 'suggest', label: 'Auto-assign all' },
        ];
      }

      const response: AIMessage = {
        id: `response-${Date.now()}`,
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
        actions,
      };

      setMessages(prev => [...prev, response]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: AIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    simulateResponse(inputValue);
  };

  const handleSuggestionClick = (suggestion: string) => {
    const userMessage: AIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: suggestion,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    simulateResponse(suggestion);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-border bg-gradient-to-r from-primary/10 to-purple-500/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">AI Seating Assistant</h3>
            <p className="text-xs text-muted-foreground">
              {seatedCount}/{guests.length} seated
            </p>
          </div>
          <Sparkles className="w-4 h-4 text-primary/60 ml-auto" />
        </div>
      </div>

      {/* Quick actions */}
      <div className="p-2 border-b border-border flex gap-1 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-7 gap-1"
          onClick={() => handleSuggestionClick('Seat VIPs near stage')}
        >
          <Crown className="w-3 h-3 text-amber-500" />
          VIPs First
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-7 gap-1"
          onClick={() => handleSuggestionClick('Group by company')}
        >
          <Building2 className="w-3 h-3 text-purple-500" />
          By Company
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-7 gap-1"
          onClick={() => handleSuggestionClick('Auto-assign all guests')}
        >
          <Wand2 className="w-3 h-3 text-primary" />
          Auto-fill
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  "flex gap-2",
                  message.role === 'user' && "flex-row-reverse"
                )}
              >
                {/* Avatar */}
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                  message.role === 'assistant' ? "bg-primary/20" : "bg-muted"
                )}>
                  {message.role === 'assistant' ? (
                    <Bot className="w-3 h-3 text-primary" />
                  ) : (
                    <Users className="w-3 h-3 text-muted-foreground" />
                  )}
                </div>

                {/* Content */}
                <div className={cn(
                  "rounded-lg px-3 py-2 max-w-[85%]",
                  message.role === 'assistant' 
                    ? "bg-muted/50 text-foreground" 
                    : "bg-primary text-primary-foreground"
                )}>
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {message.content.split('\n').map((line, i) => (
                      <span key={i}>
                        {line.startsWith('**') && line.endsWith('**') ? (
                          <strong>{line.slice(2, -2)}</strong>
                        ) : line.startsWith('•') ? (
                          <span className="block ml-2">{line}</span>
                        ) : (
                          line
                        )}
                        {i < message.content.split('\n').length - 1 && <br />}
                      </span>
                    ))}
                  </div>

                  {/* Action buttons */}
                  {message.actions && message.actions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {message.actions.map((action, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          size="sm"
                          className="text-xs h-6 bg-background/50"
                          onClick={() => handleSuggestionClick(action.label)}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-2"
            >
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <Bot className="w-3 h-3 text-primary" />
              </div>
              <div className="bg-muted/50 rounded-lg px-3 py-2">
                <div className="flex gap-1">
                  <motion.div
                    className="w-2 h-2 bg-primary/40 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-primary/40 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                  />
                  <motion.div
                    className="w-2 h-2 bg-primary/40 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-border bg-muted/30">
        <div className="flex gap-2">
          <Input
            placeholder="Ask me anything about seating..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 text-sm"
            disabled={isTyping}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
          >
            {isTyping ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
