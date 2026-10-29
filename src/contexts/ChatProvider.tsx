import { useState, useCallback, ReactNode } from "react";
import { ChatContext, type ActiveChat, type BookingSource } from "./ChatContext";

export function ChatProvider({ children }: { children: ReactNode }) {
  const [activeChat, setActiveChat] = useState<ActiveChat>("none");
  const [bookingSource, setBookingSource] = useState<BookingSource>("default");
  const [isDemoActive, setIsDemoActive] = useState(false);

  const openAssistant = useCallback(() => {
    setActiveChat("assistant");
  }, []);

  const toggleAssistant = useCallback(() => {
    setActiveChat((current) => current === "assistant" ? "none" : "assistant");
  }, []);

  const openBooking = useCallback((source: BookingSource = "default") => {
    setBookingSource(source);
    setActiveChat("booking");
  }, []);

  const closeAll = useCallback(() => {
    setActiveChat("none");
    setBookingSource("default");
  }, []);

  const closeAssistant = useCallback(() => {
    if (activeChat === "assistant") {
      setActiveChat("none");
    }
  }, [activeChat]);

  const closeBooking = useCallback(() => {
    if (activeChat === "booking") {
      setActiveChat("none");
      setBookingSource("default");
    }
  }, [activeChat]);

  const setDemoActive = useCallback((active: boolean) => {
    setIsDemoActive(active);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        activeChat,
        bookingSource,
        openAssistant,
        toggleAssistant,
        openBooking,
        closeAll,
        closeAssistant,
        closeBooking,
        isDemoActive,
        setDemoActive,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
