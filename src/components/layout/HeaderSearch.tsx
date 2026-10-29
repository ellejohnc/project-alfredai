import { useState, useEffect, useRef, memo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Clock, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSmartSearch, useSearchHistory } from "@/hooks/useSmartSearch";
import { useHaptics } from "@/hooks/useHaptics";

interface HeaderSearchProps {
  isMobile?: boolean;
  onClose?: () => void;
  isExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
}

const HeaderSearch = memo(({ 
  isMobile = false, 
  onClose,
  isExpanded: controlledExpanded,
  onToggle 
}: HeaderSearchProps) => {
  const [query, setQuery] = useState("");
  const [internalExpanded, setInternalExpanded] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  // Support both controlled and uncontrolled modes
  const isControlled = controlledExpanded !== undefined;
  const isExpanded = isControlled ? controlledExpanded : internalExpanded;
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { results, isSearching, isAIEnhanced } = useSmartSearch(query);
  const { searchHistory, addToHistory, clearHistory } = useSearchHistory();
  const { vibrate } = useHaptics();
  const navigate = useNavigate();

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Helper to close search
  const closeSearch = () => {
    if (isControlled) {
      onToggle?.(false);
    } else {
      setInternalExpanded(false);
    }
    setQuery("");
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeSearch();
      }
    };
    
    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isExpanded, isControlled]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isExpanded) {
        closeSearch();
      }
    };
    
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isExpanded, isControlled]);

  const handleToggle = () => {
    vibrate("light");
    const newState = !isExpanded;
    if (isControlled) {
      onToggle?.(newState);
    } else {
      setInternalExpanded(newState);
    }
    if (!newState) {
      setQuery("");
      setSelectedIndex(-1);
    }
  };

  const handleSelect = (path: string, title: string) => {
    addToHistory(title);
    closeSearch();
    vibrate("light");
    onClose?.();

    // Handle hash navigation for demo sections
    if (path.includes("#")) {
      const [basePath, hash] = path.split("#");
      navigate(basePath);
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } else {
      navigate(path);
    }
  };

  const handleHistorySelect = (historyItem: string) => {
    setQuery(historyItem);
    inputRef.current?.focus();
    vibrate("light");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = results.length > 0 ? results : [];
    
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === "Enter" && selectedIndex >= 0 && items[selectedIndex]) {
      e.preventDefault();
      handleSelect(items[selectedIndex].path, items[selectedIndex].title);
    } else if (e.key === "Escape") {
      closeSearch();
    }
  };

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [results]);

  const showDropdown = isExpanded && (query || searchHistory.length > 0);

  return (
    <div ref={containerRef} className="relative">
      {/* Collapsed: Just the icon */}
      {!isExpanded && (
        <button
          onClick={handleToggle}
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center transition-all",
            "border border-border bg-muted/50 hover:bg-muted",
            "min-h-[44px] min-w-[44px]"
          )}
          aria-label="Search"
        >
          <Search className="w-5 h-5 text-muted-foreground" />
        </button>
      )}

      {/* Expanded: Search input with animation */}
      {isExpanded && (
        <div
          className={cn(
            "flex items-center gap-2 animate-fade-in",
            isMobile 
              ? "w-full" 
              : isControlled 
                ? "flex-1 max-w-[500px]" 
                : "absolute right-0 top-1/2 -translate-y-1/2"
          )}
        >
          <div
            className={cn(
              "relative flex items-center w-full",
              "bg-background border border-border rounded-full shadow-lg",
              isMobile ? "w-full" : isControlled ? "w-full" : "w-[300px] lg:w-[360px]"
            )}
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 text-primary absolute left-3.5 pointer-events-none animate-spin" />
            ) : isAIEnhanced ? (
              <Sparkles className="w-4 h-4 text-primary absolute left-3.5 pointer-events-none" />
            ) : (
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 pointer-events-none" />
            )}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Alfred where to go..."
              className={cn(
                "w-full pl-10 pr-10 py-2.5 bg-transparent text-sm rounded-full",
                "placeholder:text-muted-foreground/60",
                "focus:outline-none focus:ring-2 focus:ring-primary/20",
                "min-h-[44px]"
              )}
              aria-label="Search pages"
              role="combobox"
              aria-expanded={showDropdown ? true : undefined}
              aria-haspopup="listbox"
            />
            <button
              onClick={handleToggle}
              className={cn(
                "absolute right-2 p-1.5 rounded-full",
                "text-muted-foreground hover:text-foreground",
                "hover:bg-muted/50 transition-colors",
                "min-h-[32px] min-w-[32px]",
                "flex items-center justify-center"
              )}
              aria-label="Close search"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Results Dropdown */}
          {showDropdown && (
            <div
              className={cn(
                "absolute top-full right-0 mt-2",
                "bg-background border border-border rounded-2xl shadow-xl",
                "max-h-[60vh] overflow-y-auto z-[100]",
                isMobile ? "left-0 right-0" : "w-[300px] lg:w-[360px]"
              )}
              role="listbox"
            >
              {/* Search Results */}
              {results.length > 0 && (
                <div className="p-2">
                  <p className="text-xs text-muted-foreground px-2 py-1 font-medium">
                    Results
                  </p>
                  {results.map((result, index) => (
                    <button
                      key={result.path}
                      onClick={() => handleSelect(result.path, result.title)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg",
                        "text-left transition-colors min-h-[44px]",
                        selectedIndex === index
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-muted/50"
                      )}
                      role="option"
                      aria-selected={selectedIndex === index}
                    >
                      <result.icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{result.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {result.group}
                        </p>
                      </div>
                      <ArrowRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* No Results */}
              {query && results.length === 0 && (
                <div className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    No pages found for "{query}"
                  </p>
                </div>
              )}

              {/* Recent Searches */}
              {!query && searchHistory.length > 0 && (
                <div className="p-2">
                  <div className="flex items-center justify-between px-2 py-1">
                    <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Recent
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearHistory();
                        vibrate("light");
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 px-2 py-1.5">
                    {searchHistory.map((item) => (
                      <button
                        key={item}
                        onClick={() => handleHistorySelect(item)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs",
                          "bg-muted/50 hover:bg-muted transition-colors",
                          "min-h-[32px]"
                        )}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

HeaderSearch.displayName = "HeaderSearch";

export default HeaderSearch;
