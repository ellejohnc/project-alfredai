import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { UserMinus, ArrowLeftRight, Move, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Guest, Seat } from "./types";

interface SeatContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  seat: Seat | null;
  guest: Guest | null;
  onClose: () => void;
  onUnassign?: (seatId: string) => void;
  onSwap?: (seatId: string) => void;
  onMove?: (seatId: string) => void;
}

export function SeatContextMenu({
  isOpen,
  position,
  seat,
  guest,
  onClose,
  onUnassign,
  onSwap,
  onMove,
}: SeatContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!seat) return null;

  const menuItems = guest
    ? [
        {
          icon: UserMinus,
          label: "Unassign",
          action: () => {
            onUnassign?.(seat.id);
            onClose();
          },
          variant: "destructive" as const,
        },
        {
          icon: ArrowLeftRight,
          label: "Swap with...",
          action: () => {
            onSwap?.(seat.id);
            onClose();
          },
          variant: "default" as const,
        },
        {
          icon: Move,
          label: "Move to...",
          action: () => {
            onMove?.(seat.id);
            onClose();
          },
          variant: "default" as const,
        },
      ]
    : [
        {
          icon: User,
          label: "Assign guest...",
          action: () => {
            onClose();
          },
          variant: "default" as const,
        },
      ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.15 }}
          className="fixed z-50 min-w-[160px] bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
          style={{
            left: position.x,
            top: position.y,
          }}
        >
          {/* Header */}
          <div className="px-3 py-2 bg-muted/50 border-b border-border flex items-center justify-between">
            <span className="text-xs font-medium">
              {guest ? guest.name : `Seat ${seat.seatNumber}`}
            </span>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-muted transition-colors"
            >
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>

          {/* Menu items */}
          <div className="py-1">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                  "hover:bg-muted",
                  item.variant === "destructive" && "text-destructive hover:bg-destructive/10"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
