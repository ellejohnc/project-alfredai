import { Message } from "@/hooks/useChatStream";
import { User, Building2, Target, Users, Clock, Mail, Calendar } from "lucide-react";

export const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content: "Hi! I'm Alfred. I'd love to learn a bit about you so I can tailor your Impact Conversation. First up — what's your role?",
};

// Conversation stages with visual progress
export const STAGES = [
  { id: "role", label: "Role", icon: User },
  { id: "industry", label: "Industry", icon: Building2 },
  { id: "challenge", label: "Challenge", icon: Target },
  { id: "size", label: "Team", icon: Users },
  { id: "timeline", label: "Timeline", icon: Clock },
  { id: "contact", label: "Contact", icon: Mail },
  { id: "book", label: "Book", icon: Calendar },
] as const;

export const STAGE_ORDER = ['role', 'industry', 'challenge', 'size', 'timeline'] as const;

// Stage 1: Role qualification
export const ROLE_ACTIONS = [
  { label: "CEO / Founder", type: "qualify" },
  { label: "CFO", type: "qualify" },
  { label: "CTO", type: "qualify" },
  { label: "Operations Leader", type: "qualify" },
  { label: "Project Manager", type: "qualify" },
  { label: "Admin / EA", type: "qualify" },
  { label: "Customer Service", type: "qualify" },
  { label: "HR / People Ops", type: "qualify" },
] as const;

// Stage 2: Industry
export const INDUSTRY_ACTIONS = [
  { label: "Construction & Contracting", type: "qualify" },
  { label: "Property Services", type: "qualify" },
  { label: "Professional Services", type: "qualify" },
  { label: "Insurance & Risk", type: "qualify" },
  { label: "Marketing Agency", type: "qualify" },
  { label: "Associations & Charities", type: "qualify" },
] as const;

// Stage 3: Pain points
export const CHALLENGE_ACTIONS = [
  { label: "Reduce admin & paperwork", type: "qualify" },
  { label: "Improve client communication", type: "qualify" },
  { label: "Streamline project management", type: "qualify" },
  { label: "Scale without hiring", type: "qualify" },
] as const;

// Stage 4: Company size
export const SIZE_ACTIONS = [
  { label: "1-10 employees", type: "qualify" },
  { label: "11-50 employees", type: "qualify" },
  { label: "51-200 employees", type: "qualify" },
  { label: "200+ employees", type: "qualify" },
] as const;

// Stage 5: Timeline
export const TIMELINE_ACTIONS = [
  { label: "Immediately / ASAP", type: "qualify" },
  { label: "Next quarter", type: "qualify" },
  { label: "Exploring options", type: "qualify" },
] as const;

// Stage 6: CTA actions
export const CTA_ACTIONS = [
  { label: "View Available Times", type: "calendar" },
  { label: "See Demos First", type: "demos" },
] as const;

export const MAX_OTHER_INPUT_LENGTH = 100;

export type QuickAction = {
  label: string;
  type: string;
  icon?: React.ComponentType<{ className?: string }>;
};
