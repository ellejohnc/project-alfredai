import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLeadIdentity } from "./useLeadIdentity";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

interface UsePartnerChatOptions {
  partnerType: string;
  onSessionCreated?: (sessionId: string) => void;
}

export function usePartnerChat({ partnerType, onSessionCreated }: UsePartnerChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sessionCreatedRef = useRef(false);
  const { leadIdentity } = useLeadIdentity();

  const getDeviceType = () => {
    return window.innerWidth < 768 ? "mobile" : "desktop";
  };

  const createSession = useCallback(async (leadInfo: { name: string; email: string; company?: string }) => {
    if (sessionCreatedRef.current) return sessionId;
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke('partner-chat', {
        body: {
          action: 'create_session',
          partnerType,
          leadInfo,
          deviceType: getDeviceType(),
        },
      });

      if (fnError || !data?.success) {
        throw new Error(fnError?.message || data?.error || 'Failed to create session');
      }

      sessionCreatedRef.current = true;
      setSessionId(data.sessionId);
      onSessionCreated?.(data.sessionId);
      
      return data.sessionId;
    } catch (err) {
      console.error('[usePartnerChat] Session creation error:', err);
      setError('Failed to start chat session. Please try again.');
      return null;
    }
  }, [partnerType, sessionId, onSessionCreated]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    setError(null);
    
    // Ensure we have a session
    let currentSessionId = sessionId;
    if (!currentSessionId && leadIdentity.email) {
      currentSessionId = await createSession({
        name: leadIdentity.name || 'Visitor',
        email: leadIdentity.email,
        company: leadIdentity.company,
      });
      
      if (!currentSessionId) return;
    }

    if (!currentSessionId) {
      setError('Please complete the lead form first.');
      return;
    }

    // Add user message optimistically
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('partner-chat', {
        body: {
          action: 'send_message',
          sessionId: currentSessionId,
          message: content,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
        },
      });

      if (fnError || !data?.success) {
        throw new Error(fnError?.message || data?.error || 'Failed to get response');
      }

      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.message,
        createdAt: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('[usePartnerChat] Send message error:', err);
      setError('Failed to get response. Please try again.');
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "I'm sorry, I encountered an issue. Please try again or book a call with our partnerships team for immediate assistance.",
        createdAt: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, messages, isLoading, leadIdentity, createSession]);

  const addWelcomeMessage = useCallback((name?: string, partnerType?: string) => {
    const programConfigs: Record<string, { name: string; topics: string }> = {
      implementation: {
        name: 'Implementation Partner',
        topics: `- Certification requirements and process
- Revenue model and earning potential  
- Technical training and resources
- Getting started as a partner`
      },
      technology: {
        name: 'Technology Partner',
        topics: `- Integration process and API access
- Joint solution development
- Go-to-market support
- Getting started as a partner`
      },
      sales: {
        name: 'Sales Partner',
        topics: `- Commission rates and earnings potential
- Territory exclusivity options
- Sales enablement resources
- Getting started as a partner`
      },
      consulting: {
        name: 'Consulting Partner',
        topics: `- Partnership model and benefits
- Advisory resources available
- Revenue opportunities
- Getting started as a partner`
      },
      training: {
        name: 'Training Partner',
        topics: `- Trainer certification program
- Revenue share model
- Training materials and LMS
- Getting started as a partner`
      },
      referral: {
        name: 'Referral Partner',
        topics: `- Commission rates and earnings potential
- How the referral process works
- Deal registration and protection
- Getting started as a partner`
      },
    };

    const config = programConfigs[partnerType || 'referral'] || programConfigs.referral;

    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      role: 'assistant',
      content: `Hi${name ? ` ${name}` : ''}! 👋 I'm here to answer any questions about our ${config.name} program.

What would you like to know? You can ask about:

${config.topics}

Or feel free to ask anything else!`,
      createdAt: new Date(),
    };
    setMessages([welcomeMessage]);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    sessionCreatedRef.current = false;
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sessionId,
    sendMessage,
    createSession,
    addWelcomeMessage,
    clearMessages,
  };
}
