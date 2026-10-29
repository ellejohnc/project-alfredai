import * as React from "react";
import { useState } from "react";
import { Filter, ChevronDown, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface FilterCategory {
  id: string;
  label: string;
}

interface ResponsiveFilterBarProps {
  categories: FilterCategory[];
  activeCategory: string;
  onCategoryChange: (id: string) => void;
  className?: string;
}

export function ResponsiveFilterBar({
  categories,
  activeCategory,
  onCategoryChange,
  className,
}: ResponsiveFilterBarProps) {
  // Separate state for each breakpoint to prevent flickering
  const [sheetOpen, setSheetOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const activeLabel = categories.find((c) => c.id === activeCategory)?.label || "All";

  const handleSelectMobile = (id: string) => {
    onCategoryChange(id);
    setSheetOpen(false);
  };

  const handleSelectTablet = (id: string) => {
    onCategoryChange(id);
    setPopoverOpen(false);
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />

      {/* Desktop: Scrollable horizontal filter bar */}
      <div className="hidden lg:block flex-1 overflow-hidden">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={activeCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => onCategoryChange(cat.id)}
              className="whitespace-nowrap flex-shrink-0"
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Tablet: Popover dropdown */}
      <div className="hidden sm:block lg:hidden">
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 min-w-[140px] justify-between"
            >
              <span className="truncate">{activeLabel}</span>
              <ChevronDown
                className={cn(
                  "w-4 h-4 transition-transform flex-shrink-0",
                  popoverOpen && "rotate-180"
                )}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-56 p-1 max-h-[320px] overflow-y-auto bg-popover border border-border shadow-lg z-50"
            align="start"
          >
            <div className="flex flex-col">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleSelectTablet(cat.id)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
                    activeCategory === cat.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  <span>{cat.label}</span>
                  {activeCategory === cat.id && (
                    <Check className="w-4 h-4" />
                  )}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Mobile: Sheet drawer */}
      <div className="block sm:hidden flex-1">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full flex items-center justify-between gap-2"
            >
              <span className="truncate">{activeLabel}</span>
              <ChevronDown
                className={cn(
                  "w-4 h-4 transition-transform flex-shrink-0",
                  sheetOpen && "rotate-180"
                )}
              />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto max-h-[70vh] rounded-t-2xl">
            <SheetHeader className="pb-4">
              <SheetTitle className="text-left flex items-center justify-between">
                <span>Filter by Category</span>
                {activeCategory !== "all" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSelectMobile("all")}
                    className="text-muted-foreground"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                )}
              </SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-2 gap-2 pb-6">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleSelectMobile(cat.id)}
                  className={cn(
                    "flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    activeCategory === cat.id
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-muted/50 text-foreground hover:bg-muted border border-border"
                  )}
                >
                  {activeCategory === cat.id && (
                    <Check className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span className="truncate">{cat.label}</span>
                </button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
