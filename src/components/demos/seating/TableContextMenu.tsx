import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { Lock, Unlock, Crown, X as XIcon, RotateCw, X, Users, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Table } from "./types";

interface TableContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  table: Table | null;
  onClose: () => void;
  onToggleLock?: (tableId: string) => void;
  onToggleVip?: (tableId: string) => void;
  onClearTable?: (tableId: string) => void;
  onRotateTable?: (tableId: string) => void;
  onRemoveTable?: (tableId: string) => void;
}

export function TableContextMenu({
  isOpen,
  position,
  table,
  onClose,
  onToggleLock,
  onToggleVip,
  onClearTable,
  onRotateTable,
  onRemoveTable,
}: TableContextMenuProps) {
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

  if (!table) return null;

  const menuItems = [
    {
      icon: table.isLocked ? Unlock : Lock,
      label: table.isLocked ? "Unlock table" : "Lock table",
      action: () => {
        onToggleLock?.(table.id);
        onClose();
      },
      variant: "default" as const,
    },
    {
      icon: Crown,
      label: table.isVip ? "Remove VIP status" : "Mark as VIP",
      action: () => {
        onToggleVip?.(table.id);
        onClose();
      },
      variant: table.isVip ? "destructive" as const : "default" as const,
    },
    {
      icon: RotateCw,
      label: "Rotate table",
      action: () => {
        onRotateTable?.(table.id);
        onClose();
      },
      variant: "default" as const,
    },
    {
      icon: Users,
      label: "Clear all seats",
      action: () => {
        onClearTable?.(table.id);
        onClose();
      },
      variant: "destructive" as const,
    },
    {
      icon: Trash2,
      label: "Remove table",
      action: () => {
        onRemoveTable?.(table.id);
        onClose();
      },
      variant: "destructive" as const,
      disabled: table.isLocked,
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
          className="fixed z-50 min-w-[180px] bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
          style={{
            left: position.x,
            top: position.y,
          }}
        >
          {/* Header */}
          <div className="px-3 py-2 bg-muted/50 border-b border-border flex items-center justify-between">
            <span className="text-xs font-medium">
              Table {table.tableNumber}
              {table.isVip && (
                <span className="ml-1 text-amber-500">★</span>
              )}
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
                disabled={item.disabled}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                  "hover:bg-muted",
                  item.variant === "destructive" && "text-destructive hover:bg-destructive/10",
                  item.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent"
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
