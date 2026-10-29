import { createContext, useContext } from "react";

export type ActiveChat = "none" | "assistant" | "booking";
export type BookingSource = "header_cta" | "page_cta" | "chatbot" | "default";

export interface ChatContextType {
  activeChat: ActiveChat;
  bookingSource: BookingSource;
  openAssistant: () => void;
  toggleAssistant: () => void;
  openBooking: (source?: BookingSource) => void;
  closeAll: () => void;
  closeAssistant: () => void;
  closeBooking: () => void;
  isDemoActive: boolean;
  setDemoActive: (active: boolean) => void;
}

/**
 * The context and its consumer hook live here, apart from the provider
 * component in ChatProvider.tsx.
 *
 * A file that exports both a component and a hook cannot hot-reload — React
 * Fast Refresh gives up and full-reloads the page, losing whatever state you
 * were mid-way through. Keeping the component on its own fixes that. The
 * provider is imported in two places; this hook is imported in seventeen,
 * which is why the PROVIDER moved out rather than the hook.
 */
export const ChatContext = createContext<ChatContextType | null>(null);

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}
