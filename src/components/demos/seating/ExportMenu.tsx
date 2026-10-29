import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { Download, FileImage, FileText, FileSpreadsheet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ExportMenuProps {
  onExportPDF: () => void;
  onExportImage: () => void;
  onExportCSV: () => void;
}

export function ExportMenu({
  onExportPDF,
  onExportImage,
  onExportCSV,
}: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const menuItems = [
    {
      icon: FileText,
      label: "Export as PDF",
      description: "Printable seating chart",
      action: () => {
        onExportPDF();
        setIsOpen(false);
      },
    },
    {
      icon: FileImage,
      label: "Export as Image",
      description: "PNG screenshot",
      action: () => {
        onExportImage();
        setIsOpen(false);
      },
    },
    {
      icon: FileSpreadsheet,
      label: "Export as CSV",
      description: "Spreadsheet data",
      action: () => {
        onExportCSV();
        setIsOpen(false);
      },
    },
  ];

  return (
    <div ref={menuRef} className="relative">
      <Button
        variant="outline"
        size="sm"
        className="gap-1 text-xs"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Download className="w-3 h-3" />
        Export
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 z-50 w-56 bg-popover border border-border rounded-lg shadow-lg overflow-hidden"
          >
            {/* Header */}
            <div className="px-3 py-2 bg-muted/50 border-b border-border flex items-center justify-between">
              <span className="text-xs font-medium">Export Options</span>
              <button
                onClick={() => setIsOpen(false)}
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
                    "w-full flex items-start gap-3 px-3 py-2 text-left transition-colors",
                    "hover:bg-muted"
                  )}
                >
                  <item.icon className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
