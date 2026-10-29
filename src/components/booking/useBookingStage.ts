import { useCallback, useMemo } from "react";
import { Message } from "@/hooks/useChatStream";
import {
  STAGES,
  STAGE_ORDER,
  ROLE_ACTIONS,
  INDUSTRY_ACTIONS,
  CHALLENGE_ACTIONS,
  SIZE_ACTIONS,
  TIMELINE_ACTIONS,
  QuickAction,
} from "./BookingConstants";

interface CollectedInfo {
  role: boolean;
  industry: boolean;
  challenge: boolean;
  size: boolean;
  timeline: boolean;
}

// Pre-compiled regex patterns for better performance
const ROLE_PATTERN = /\b(ceo|cto|cfo|founder|manager|director|admin|hr|ea|executive|operations|project|customer service|people ops)\b/i;
const INDUSTRY_PATTERN = /\b(construction|property|professional|insurance|marketing|agency|contracting|services|associations|charities|risk)\b/i;
const CHALLENGE_PATTERN = /\b(admin|paperwork|communication|project|scale|hiring|streamline|reduce|improve)\b/i;
const SIZE_PATTERN = /\b(\d+[-\s]*(employees|people|team|staff)|solo|just me|small team|large team)\b/i;
const TIMELINE_PATTERN = /\b(immediate|asap|now|urgent|next quarter|exploring|soon|this month|next month|later|future)\b/i;

export function useBookingStage(
  messages: Message[],
  completedStages: Set<string>,
  leadEmail: string
) {
  // Detect what information has been collected from user messages
  const collectedInfo = useMemo<CollectedInfo>(() => {
    const userMessages = messages
      .filter(m => m.role === 'user')
      .map(m => m.content.toLowerCase());
    
    return {
      role: completedStages.has('role') || userMessages.some(m => 
        ROLE_ACTIONS.some(r => m.includes(r.label.toLowerCase())) ||
        ROLE_PATTERN.test(m)
      ),
      industry: completedStages.has('industry') || userMessages.some(m => 
        INDUSTRY_ACTIONS.some(i => m.includes(i.label.toLowerCase())) ||
        INDUSTRY_PATTERN.test(m)
      ),
      challenge: completedStages.has('challenge') || userMessages.some(m => 
        CHALLENGE_ACTIONS.some(c => m.includes(c.label.toLowerCase())) ||
        CHALLENGE_PATTERN.test(m)
      ),
      size: completedStages.has('size') || userMessages.some(m => 
        SIZE_ACTIONS.some(s => m.includes(s.label.toLowerCase())) ||
        SIZE_PATTERN.test(m)
      ),
      timeline: completedStages.has('timeline') || userMessages.some(m => 
        TIMELINE_ACTIONS.some(t => m.includes(t.label.toLowerCase())) ||
        TIMELINE_PATTERN.test(m)
      ),
    };
  }, [messages, completedStages]);

  // Calculate current stage based on collected information
  const currentStage = useMemo(() => {
    let stage = 0;
    if (collectedInfo.role) stage = 1;
    if (collectedInfo.role && collectedInfo.industry) stage = 2;
    if (collectedInfo.role && collectedInfo.industry && collectedInfo.challenge) stage = 3;
    if (collectedInfo.role && collectedInfo.industry && collectedInfo.challenge && collectedInfo.size) stage = 4;
    if (collectedInfo.role && collectedInfo.industry && collectedInfo.challenge && collectedInfo.size && collectedInfo.timeline) stage = 5;
    if (
      collectedInfo.role &&
      collectedInfo.industry &&
      collectedInfo.challenge &&
      collectedInfo.size &&
      collectedInfo.timeline &&
      leadEmail
    ) stage = 6;
    return stage;
  }, [collectedInfo, leadEmail]);

  // Determine conversation stage for contextual quick actions
  const quickActionsData = useMemo(() => {
    if (!collectedInfo.role) return { actions: ROLE_ACTIONS as unknown as QuickAction[], showCTA: false };
    if (!collectedInfo.industry) return { actions: INDUSTRY_ACTIONS as unknown as QuickAction[], showCTA: false };
    if (!collectedInfo.challenge) return { actions: CHALLENGE_ACTIONS as unknown as QuickAction[], showCTA: false };
    if (!collectedInfo.size) return { actions: SIZE_ACTIONS as unknown as QuickAction[], showCTA: false };
    if (!collectedInfo.timeline) return { actions: TIMELINE_ACTIONS as unknown as QuickAction[], showCTA: false };
    if (!leadEmail) return { actions: null, showCTA: false };
    return { actions: null, showCTA: true };
  }, [collectedInfo, leadEmail]);

  const shouldCollectContact = collectedInfo.timeline && !leadEmail;

  // Get current stage ID
  const getCurrentStageId = useCallback(() => {
    return STAGE_ORDER.find(stage => !completedStages.has(stage));
  }, [completedStages]);

  return {
    collectedInfo,
    currentStage,
    quickActionsData,
    shouldCollectContact,
    getCurrentStageId,
    stages: STAGES,
  };
}
