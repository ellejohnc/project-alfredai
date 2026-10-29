import { memo, forwardRef } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Play, Calculator, Calendar, MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useScrollHide } from "@/hooks/useScrollHide";
import { useHaptics } from "@/hooks/useHaptics";
interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path?: string;
  action?: "book" | "chat";
  isCenter?: boolean;
}

interface MobileBottomNavProps {
  onChatToggle?: () => void;
  onBookingOpen?: () => void;
  isChatActive?: boolean;
}

const navItems: NavItem[] = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Play, label: "Demos", path: "/resources/demos" },
  { icon: MessageCircle, label: "AI", action: "chat", isCenter: true },
  { icon: Calculator, label: "ROI", path: "/impact-studies/roi-breakdowns" },
  { icon: Calendar, label: "Book", path: "https://new.alfredai.bot/book" },
];

const MobileBottomNavInner = memo(({ onChatToggle, onBookingOpen, isChatActive }: MobileBottomNavProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isHidden: isScrollHidden } = useScrollHide({ delay: 1500 });
  const { vibrate } = useHaptics();

  // Hide bottom nav when viewing a demo (matches /resources/demos/:demoId)
  const isDemoActive = /^\/resources\/demos\/[^/]+$/.test(location.pathname);

  const handleNavClick = (item: NavItem) => {
    if (item.action === "book") {
      vibrate('medium');
      onBookingOpen?.();
    } else if (item.action === "chat") {
      vibrate('light');
      onChatToggle?.();
    } else if (item.path) {
      vibrate('light');
      if (/^https?:/.test(item.path)) window.location.href = item.path; else navigate(item.path);
    }
  };

  const isActive = (item: NavItem) => {
    if (!item.path) return false;
    if (item.path === "/") return location.pathname === "/";
    return location.pathname.startsWith(item.path);
  };

  // Don't render when demo is active
  if (isDemoActive) {
    return null;
  }

  return (
    <>
      {/* Spacer to prevent content from being hidden behind nav */}
      <div className="h-20 md:hidden" />
      
      {/* Bottom Navigation */}
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: isScrollHidden ? 100 : 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      >
        {/* Glass background */}
        <div className="absolute inset-0 bg-background/95 backdrop-blur-xl border-t border-border/30 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]" />
        
        {/* Safe area padding for iOS */}
        <div className="relative px-1 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <div className="flex items-end justify-around">
            {navItems.map((item) => {
              const active = isActive(item);
              
              // Centered AI button - elevated design
              if (item.isCenter) {
                return (
                  <button
                    key={item.label}
                    onClick={() => handleNavClick(item)}
                    className="relative flex flex-col items-center -mt-5"
                  >
                    {/* Elevated button with glow */}
                    <motion.div
                      whileTap={{ scale: 0.95 }}
                      className="relative"
                    >
                      {/* Outer glow ring */}
                      <div className={cn(
                        "absolute inset-0 rounded-full blur-md scale-125 transition-colors",
                        isChatActive ? "bg-destructive/30" : "bg-primary/20"
                      )} />
                      
                      {/* Main button */}
                      <motion.div 
                        className={cn(
                          "relative w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all",
                          isChatActive 
                            ? "bg-gradient-to-br from-destructive to-destructive/80 shadow-destructive/30" 
                            : "bg-gradient-to-br from-primary to-pink-500 shadow-primary/30"
                        )}
                        animate={{ rotate: isChatActive ? 0 : 0 }}
                      >
                        <AnimatePresence mode="wait">
                          {isChatActive ? (
                            <motion.div
                              key="close"
                              initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                              animate={{ opacity: 1, rotate: 0, scale: 1 }}
                              exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                              transition={{ duration: 0.2 }}
                            >
                              <X className="w-6 h-6 text-primary-foreground" />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="chat"
                              initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
                              animate={{ opacity: 1, rotate: 0, scale: 1 }}
                              exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
                              transition={{ duration: 0.2 }}
                            >
                              <item.icon className="w-6 h-6 text-primary-foreground" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                        
                        {/* Pulse indicator - only show when chat is closed */}
                        {!isChatActive && (
                          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-secondary rounded-full animate-pulse border-2 border-background" />
                        )}
                      </motion.div>
                    </motion.div>
                    
                    <span className={cn(
                      "text-[10px] mt-1.5 font-semibold transition-colors",
                      isChatActive ? "text-destructive" : "text-primary"
                    )}>
                      {isChatActive ? "Close" : item.label}
                    </span>
                  </button>
                );
              }
              
              // Regular nav items
              return (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item)}
                  className="relative flex flex-col items-center justify-center py-1.5 px-3 min-w-[56px] min-h-[48px] group touch-manipulation"
                >
                  {/* Active indicator dot */}
                  <AnimatePresence>
                    {active && (
                      <motion.div
                        layoutId="activeTabDot"
                        className="absolute top-0 w-1 h-1 bg-primary rounded-full"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                      />
                    )}
                  </AnimatePresence>
                  
                  <div
                    className={cn(
                      "relative p-2 rounded-xl transition-all duration-200",
                      active 
                        ? "bg-primary/10" 
                        : "group-active:bg-muted/50"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "w-5 h-5 transition-colors",
                        active ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                  </div>
                  
                  <span
                    className={cn(
                      "text-[10px] font-medium transition-colors",
                      active ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </motion.nav>
    </>
  );
});

MobileBottomNavInner.displayName = 'MobileBottomNavInner';

// Wrap with forwardRef for lazy loading compatibility
const MobileBottomNav = forwardRef<HTMLDivElement, MobileBottomNavProps>((props, _ref) => (
  <MobileBottomNavInner {...props} />
));

MobileBottomNav.displayName = 'MobileBottomNav';

export default MobileBottomNav;
