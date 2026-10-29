import { useState, useEffect } from "react";
import { subscribeScroll } from "@/hooks/useScrollManager";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, ChevronDown, Brain, Cog, MessageSquare, Phone, Grid3X3, BookOpen, Video, FileText, Newspaper, User, LogIn, UserPlus, LayoutDashboard, Settings, ClipboardList, Building2, TrendingUp, Users, Award, Target, Zap, Scale, Info, HelpCircle, Lock, Handshake, Building, Mail, Factory, Search, HardHat, FileStack, Smartphone, Workflow, Ruler, Cpu, Bot, Eye, Mountain, Radar, FileCheck2, ClipboardCheck, PackageCheck, Pen, Briefcase, Frame, PaintRoller, Truck, Wrench } from "lucide-react";
import { Engine6 } from "@/components/icons/Engine6";
import { OmegaIcon } from "@/components/icons/OmegaIcon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import alfredLogo from "@/assets/alfred-ai-mid.png";
import alfredLogoWhite from "/alfred-ai-white-mid.png";
import aosMenuIcon from "@/assets/logos/accountable-link-icon.png";
import { useScrollHide } from "@/hooks/useScrollHide";
import { isChatAvailable } from '@/lib/chatRoutes';
import { useChatContext } from "@/contexts/ChatContext";
import { getAppUrl } from "@/lib/siteConfig";
import { useHaptics } from "@/hooks/useHaptics";
import HeaderSearch from "./HeaderSearch";
import { platformProducts, platformProductHref } from "@/data/platformProducts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavItem {
  label: string;
  shortLabel?: string;
  href?: string;
  children?: {
    title?: string;
    titleHref?: string;
    items: {
      label: string;
      href: string;
      description?: string;
      icon?: React.ElementType;
      iconSrc?: string;
    }[];
  }[];
}

const OmegaMenuIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <OmegaIcon className={className} {...props} />
);

const navItems: NavItem[] = [
  {
    label: "Products",
    shortLabel: "Products",
    children: [
      {
        title: "Overview",
        items: [
          { label: "Our Core Technology Overview", href: "/products", description: "Products and infrastructure", icon: LayoutDashboard },
        ],
      },
      {
        title: "Products",
        titleHref: "/products#products",
        items: platformProducts.map((p) => ({
          label: p.badge ? `${p.name} (${p.badge})` : p.name,
          href: platformProductHref(p),
          icon: p.icon,
        })),
      },
      {
        title: "Our Infrastructure",
        titleHref: "/products#infrastructure",
        items: [
          { label: "Axiom", href: "/products/axiom", icon: Engine6, description: "01 · Machine learning deep tech that learns your business" },
          { label: "Omega (Ω)", href: "/products/omega", icon: OmegaMenuIcon, description: "02 · Living intelligence — your organisation's memory" },
          { label: "Butler", href: "/products/butler", icon: Bot, description: "03 · AI agents that do the work for your teams" },
          { label: "Watch", href: "/products/watch", icon: Radar, description: "04 · Mission control for owners and operators" },
          { label: "AOS", href: "/products/aos", iconSrc: aosMenuIcon, description: "05 · The operating system that holds it all together" },
        ],
      },
    ],
  },
  {
    label: "Solutions",
    shortLabel: "Solutions",
    children: [
      {
        title: "By Industry",
        titleHref: "/solutions?view=industries",
        items: [
          { label: "Contract Building", href: "/solutions?industry=construction", icon: HardHat, description: "Builders & project delivery" },
          { label: "Windows Fabrication", href: "/solutions?industry=windows-fabrication", icon: Frame, description: "Faster quoting from plans" },
          { label: "Steelwork Fabrication", href: "/solutions?industry=steelwork-fabrication", icon: Factory, description: "Take-offs to tonnage" },
          { label: "Commercial Painting", href: "/solutions?industry=commercial-painting", icon: PaintRoller, description: "Fast, consistent quotes" },
          { label: "Civil Contracting", href: "/solutions?industry=civil-contracting", icon: Truck, description: "Civil works & infrastructure" },
          { label: "Energy and Infrastructure", href: "/solutions?industry=energy-infrastructure", icon: Zap, description: "Major projects" },
          { label: "Consulting & Professional Services", href: "/solutions?industry=consulting", icon: Briefcase, description: "Client delivery" },
          { label: "Special Trades/Contracting", href: "/solutions?industry=special-trades", icon: Wrench, description: "Trades & subcontractors" },
        ],
      },
      {
        title: "By Workflow",
        titleHref: "/products/use-cases",
        items: [
          { label: "AI Take-Off", href: "/solutions/ai-takeoff", icon: Ruler, description: "Drawings to quantities" },
          { label: "Tender Management", href: "/products/use-cases/automated-tender-bid-completion", icon: FileCheck2, description: "Submission-ready tenders" },
          { label: "Billing and Invoicing Triage", href: "/demos/purchase-bill-intake", icon: FileText, description: "Bills sorted & coded" },
          { label: "Inspection & Technical Reports", href: "/demos/technical-report-agent", icon: ClipboardCheck, description: "Site findings to reports" },
          { label: "AI Employees", href: "/solutions/ai-for-construction/operations", icon: Bot, description: "Digital team for operations" },
        ],
      },
    ],
  },
  // Impact Studies nav temporarily hidden (routes/data still live at /impact-studies).
  // {
  //   label: "Impact Studies",
  //   shortLabel: "Impact",
  //   children: [
  //     {
  //       title: "Overview",
  //       items: [
  //         { label: "All Impact Studies", href: "/impact-studies", icon: LayoutDashboard, description: "Case studies, ROI & testimonials" },
  //         { label: "Case Studies", href: "/impact-studies/case-studies", icon: FileText, description: "Real client success stories" },
  //         { label: "ROI Breakdowns", href: "/impact-studies/roi-breakdowns", icon: TrendingUp, description: "Measurable returns" },
  //         { label: "Testimonials", href: "/impact-studies/testimonials", icon: Award, description: "Client success stories" },
  //       ],
  //     },
  //     {
  //       title: "By Outcome",
  //       items: [
  //         { label: "Reduce Admin Load", href: "/impact-studies/reduce-admin", icon: Zap, description: "Cut manual work" },
  //         { label: "Increase Revenue Per Head", href: "/impact-studies/revenue-per-head", icon: Users, description: "Boost productivity" },
  //         { label: "Improve Execution", href: "/impact-studies/execution", icon: Target, description: "Better accountability" },
  //         { label: "Scale Without Hiring", href: "/impact-studies/scale-without-hiring", icon: Scale, description: "Grow efficiently" },
  //       ],
  //     },
  //   ],
  // },
  {
    label: "Resources",
    shortLabel: "Resources",
    children: [
      {
        title: "Overview",
        items: [
          { label: "All Resources", href: "/resources", icon: LayoutDashboard, description: "Demos, guides, webinars & insights" },
        ],
      },
      {
        title: "Learn",
        items: [
          { label: "Demos", href: "/resources/demos", icon: Video, description: "Interactive product demos" },
          { label: "Webinars & Events", href: "/resources/webinars", icon: BookOpen, description: "Live and recorded sessions" },
          { label: "Guides & Playbooks", href: "/resources/guides", icon: FileText, description: "Implementation guides" },
          { label: "Blog / Insights", href: "/resources/blog", icon: Newspaper, description: "Latest articles and insights" },
        ],
      },
    ],
  },
  {
    label: "alfred ai Explained",
    shortLabel: "Explained",
    children: [
      {
        items: [
          { label: "alfred ai Explained", href: "/explained", icon: LayoutDashboard, description: "All about alfred ai" },
          { label: "What Is alfred ai", href: "/explained/what-is-alfred", icon: Info, description: "Platform overview" },
          { label: "How alfred ai Works", href: "/explained/how-it-works", icon: HelpCircle, description: "Under the hood" },
          { label: "Platform Architecture", href: "/explained/architecture", icon: Building, description: "Technical foundation" },
          { label: "Security & Compliance", href: "/explained/security", icon: Lock, description: "Enterprise-grade security" },
          { label: "Tech Partners", href: "/explained/techpartners", icon: Handshake, description: "Integration ecosystem" },
          { label: "Our Story", href: "/explained/about", icon: Users, description: "Our team & mission" },
          { label: "Contact", href: "/explained/contact", icon: Mail, description: "Get in touch" },
        ],
      },
    ],
  },
];

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const { isHidden: isScrollHidden } = useScrollHide({ delay: 1500 });
  const { openAssistant, openBooking } = useChatContext();
  const location = useLocation();
  const navigate = useNavigate();
  const { vibrate } = useHaptics();

  // Check if we're on the homepage for special scroll-reveal behavior
  const isHomePage = location.pathname === "/";
  
  // Navbar is revealed after scrolling past a threshold on homepage
  const [isNavRevealed, setIsNavRevealed] = useState(!isHomePage);
  
  // Track scroll progress for smooth logo morph animation (0 to 1)
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleBookingClick = () => {
    vibrate('medium');
    openBooking("header_cta");
  };

  const handleAssistantClick = () => {
    vibrate('light');
    setIsMobileMenuOpen(false);
    openAssistant();
  };

  // Was a hand-copied second list of the routes App.tsx uses to decide whether
  // to mount ChatAssistant at all. Two copies agree on the day they are written
  // and the failure is silent in the worst direction: add a route to App's list
  // and this button keeps rendering, openAssistant() sets the state, nothing is
  // mounted to read it, and clicking does nothing. One predicate now.
  const isAssistantAvailable = isChatAvailable(location.pathname);

  // Pages where logo should act as a back button
  const isBackButtonPage = location.pathname === "/signup";

  const handleLogoClick = (e: React.MouseEvent) => {
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
    
    if (isBackButtonPage) {
      e.preventDefault();
      navigate("/");
    } else if (isHomePage && !isNavRevealed) {
      // On homepage at top: clicking logo reveals the full nav bar
      e.preventDefault();
      setIsNavRevealed(true);
      setScrollProgress(1);
    }
  };

  // Update nav revealed state when route changes
  useEffect(() => {
    setIsNavRevealed(!isHomePage);
    // Reset scroll progress when navigating away from homepage
    if (!isHomePage) {
      setScrollProgress(1);
    }
  }, [isHomePage]);

  useEffect(() => {
    return subscribeScroll((scrollY: number) => {
      setIsScrolled(scrollY > 20);
      
      if (isHomePage) {
        const rawProgress = Math.min(1, scrollY / 150);
        const easedProgress = rawProgress < 0.5
          ? 4 * Math.pow(rawProgress, 3)
          : 1 - Math.pow(-2 * rawProgress + 2, 3) / 2;
        setScrollProgress(easedProgress);
        setIsNavRevealed(scrollY > 150);
      }
    });
  }, [isHomePage]);

  // Set CSS variable for header height so overlays can position relative to it
  useEffect(() => {
    let rafId: number;
    const updateHeaderHeight = () => {
      rafId = requestAnimationFrame(() => {
        const header = document.querySelector('header');
        if (header) {
          const height = header.offsetHeight;
          document.documentElement.style.setProperty('--header-height', `${height}px`);
        }
      });
    };
    
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, [isScrolled]);

  const handleMouseEnter = (label: string) => {
    setActiveDropdown(label);
  };

  const handleMouseLeave = () => {
    setActiveDropdown(null);
  };

  const { isDemoActive } = useChatContext();

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-[padding,transform,opacity] duration-500",
          // Padding — desktop slims when scrolled; mobile slims only WHILE scrolling
          // (isScrollHidden is true during active scroll, false 1.5s after it stops),
          // so the mobile header returns to full size once scrolling pauses.
          isScrolled ? "py-4 md:py-3" : "py-4",
          isScrollHidden && "py-1.5 md:py-3",
          // On mobile we keep the header pinned and just slim it; only hide on desktop scroll-away
          (isScrollHidden && !isMobileMenuOpen) && "md:-translate-y-full",
          isDemoActive && "pointer-events-none opacity-0"
        )}
        style={isHomePage ? {
          // Smooth scroll-driven background transition
          backgroundColor: scrollProgress < 0.5 
            ? 'transparent' 
            : `hsl(var(--background) / ${Math.min(0.95, (scrollProgress - 0.5) * 2)})`,
          backdropFilter: scrollProgress > 0.5 ? `blur(${Math.min(12, (scrollProgress - 0.5) * 24)}px)` : 'none',
          boxShadow: scrollProgress > 0.8 ? `0 1px 3px hsl(var(--foreground) / ${(scrollProgress - 0.8) * 0.5})` : 'none',
        } : {
          backgroundColor: isScrolled ? 'hsl(var(--background) / 0.95)' : 'hsl(var(--background))',
          backdropFilter: isScrolled ? 'blur(12px)' : 'none',
          boxShadow: isScrolled ? '0 1px 3px hsl(var(--foreground) / 0.1)' : 'none',
        }}
      >
        <div className="container-wide flex items-center justify-between relative">
          {/* Logo with smooth scroll-driven morph animation on homepage */}
          <div 
            className="flex items-center z-50"
            style={isHomePage ? {
              position: scrollProgress < 1 ? 'absolute' as const : 'relative' as const,
              left: scrollProgress < 1 ? `calc(50% - ${scrollProgress * 50}%)` : undefined,
              transform: scrollProgress < 1 
                ? `translateX(-50%) scale(${1.3 - (scrollProgress * 0.3)})` 
                : 'none',
              transformOrigin: 'center center',
            } : undefined}
          >
            <Link 
              to="/" 
              className="flex items-center cursor-pointer"
              onClick={handleLogoClick}
            >
              {/* Crossfade between white and dark logos */}
              <div className={cn(
                "relative w-auto transition-[height] duration-300 md:h-9 lg:h-10 xl:h-11",
                isScrollHidden ? "h-6" : "h-8"
              )}>
                {isHomePage ? (
                  <>
                    <img 
                      src={alfredLogoWhite} 
                      alt="alfred ai" 
                      width="160"
                      height="44"
                      className="h-full w-auto object-contain pointer-events-none absolute top-0 left-0"
                      style={{ opacity: 1 - scrollProgress }}
                      loading="eager"
                      fetchPriority="high"
                      decoding="async"
                    />
                    <img 
                      src={alfredLogo} 
                      alt="alfred ai" 
                      className="h-full w-auto object-contain pointer-events-none invisible"
                      loading="eager"
                      decoding="async"
                      aria-hidden="true"
                    />
                    <img 
                      src={alfredLogo} 
                      alt="alfred ai" 
                      className="h-full w-auto object-contain pointer-events-none absolute top-0 left-0"
                      style={{ opacity: scrollProgress }}
                      loading="eager"
                      decoding="async"
                    />
                  </>
                ) : (
                  <img 
                    src={alfredLogo} 
                    alt="alfred ai" 
                    className="h-full w-auto object-contain pointer-events-none"
                    loading="eager"
                    decoding="async"
                  />
                )}
              </div>
            </Link>
          </div>

          {isAssistantAvailable && !isNavRevealed && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleAssistantClick}
              className="absolute right-4 top-1/2 z-[70] h-11 w-11 -translate-y-1/2 rounded-full xl:hidden"
              aria-label="Open Alfred chat"
            >
              <MessageSquare className="w-5 h-5" />
            </Button>
          )}

          {/* Desktop Navigation - Hidden when search is active or when not revealed on homepage */}
          {!isSearchActive && (
            <nav className={cn(
              "hidden xl:flex items-center gap-1 transition-all duration-500",
              isNavRevealed 
                ? "opacity-100 translate-y-0" 
                : "opacity-0 -translate-y-2 pointer-events-none"
            )}>
              {navItems.map((item) => (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => item.children && handleMouseEnter(item.label)}
                  onMouseLeave={handleMouseLeave}
                >
                  {item.href ? (
                    <Link
                      to={item.href}
                      className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <button
                      className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                    >
                      {item.label}
                      <ChevronDown className={cn(
                        "w-4 h-4 transition-transform",
                        activeDropdown === item.label && "rotate-180"
                      )} />
                    </button>
                  )}

                  {/* Mega Menu Dropdown */}
                  {item.children && activeDropdown === item.label && (
                    <div className="absolute top-full left-0 pt-2 z-[60]">
                      <div className={cn(
                        "bg-card border border-border rounded-xl shadow-xl",
                        item.label === "Compare" ? "p-4 min-w-[280px]" : "p-6"
                      )}>
                        {item.label === "Compare" ? (
                          // Compact grouped layout for Compare
                          <div className="space-y-3">
                            {item.children.map((section, idx) => {
                              const isFeaturedSection = !section.title;
                              return (
                                <div key={idx}>
                                  {/* Category header (skip for first "overview" section) */}
                                  {section.title && (
                                    <div className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-1.5 px-2 flex items-center gap-2">
                                      <span>{section.title}</span>
                                      <div className="flex-1 h-px bg-border/50" />
                                    </div>
                                  )}
                                  {/* Items in a flex wrap for compact inline display */}
                                  <div className="flex flex-wrap gap-1">
                                    {section.items.map((subItem) => {
                                      const isActive = location.pathname === subItem.href;
                                      return (
                                        <Link
                                          key={subItem.href}
                                          to={subItem.href}
                                          className={cn(
                                            "px-2 py-1.5 rounded-md text-sm transition-colors",
                                            isFeaturedSection && "w-full font-medium mb-1",
                                            isActive
                                              ? "bg-primary/10 text-primary"
                                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                          )}
                                          onClick={() => setActiveDropdown(null)}
                                        >
                                          {subItem.label}
                                        </Link>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          // Standard mega menu layout for other nav items
                          <div className="flex gap-8">
                            {item.children.map((section, sectionIndex) => (
                              <div key={sectionIndex} className="min-w-[200px]">
                                {section.title && (
                                  section.titleHref ? (
                                    <Link
                                      to={section.titleHref}
                                      className="block text-xs font-semibold text-primary uppercase tracking-wider mb-3 px-3 hover:underline"
                                      onClick={() => setActiveDropdown(null)}
                                    >
                                      {section.title}
                                    </Link>
                                  ) : (
                                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
                                      {section.title}
                                    </h3>
                                  )
                                )}
                                <ul className="space-y-1">
                                  {section.items.map((subItem) => {
                                    // Check if this item is active
                                    const subItemPath = subItem.href.split('?')[0];
                                    const subItemSearch = subItem.href.includes('?') ? '?' + subItem.href.split('?')[1] : '';
                                    
                                    const isActive = 
                                      // Exact match for pages without query params
                                      (!subItem.href.includes("?") && location.pathname === subItem.href) ||
                                      // Match for pages with query params
                                      (subItem.href.includes("?") && location.pathname === subItemPath && location.search === subItemSearch) ||
                                      // Special case: Platform Overview (no query param on /products)
                                      (subItem.href === "/products" && location.pathname === "/products" && !location.search);
                                    
                                    return (
                                      <li key={subItem.href}>
                                        <Link
                                          to={subItem.href}
                                          className={cn(
                                            "flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors group",
                                            isActive 
                                              ? "bg-primary/10 border border-primary/20" 
                                              : "hover:bg-muted"
                                          )}
                                          onClick={() => setActiveDropdown(null)}
                                        >
                                          {(subItem.icon || subItem.iconSrc) && (
                                            <div className={cn(
                                              "mt-0.5 flex-shrink-0 flex items-center justify-center",
                                              subItem.label === "Omega (Ω)" ? "w-6 h-6" : "w-5 h-5"
                                            )}>
                                              {subItem.icon ? (
                                                <subItem.icon className={cn(
                                                  subItem.label === "Omega (Ω)" ? "w-[1.2rem] h-[1.2rem]" : "w-4 h-4",
                                                  isActive ? "text-primary" : "text-primary"
                                                )} />
                                              ) : (
                                                <img src={subItem.iconSrc} alt="" className={subItem.label === "Omega (Ω)" ? "w-[1.2rem] h-[1.2rem] object-contain" : "w-4 h-4 object-contain"} />
                                              )}
                                            </div>
                                          )}
                                          <div className="flex-1">
                                            <div className={cn(
                                              "text-sm font-medium transition-colors whitespace-nowrap",
                                              isActive 
                                                ? "text-primary" 
                                                : "text-foreground group-hover:text-primary"
                                            )}>
                                              {subItem.label}
                                            </div>
                                            {subItem.description && (
                                              <div className="text-xs text-muted-foreground mt-0.5 whitespace-nowrap">
                                                {subItem.description}
                                              </div>
                                            )}
                                          </div>
                                          {isActive && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                                          )}
                                        </Link>
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>
          )}

          {/* Search, Auth & CTA Buttons */}
          <div className={cn(
            "hidden xl:flex items-center gap-3 transition-all duration-500",
            isNavRevealed 
              ? "opacity-100 translate-y-0" 
              : "opacity-0 -translate-y-2 pointer-events-none"
          )}>
            {/* Search - expands when active */}
            <HeaderSearch 
              isExpanded={isSearchActive}
              onToggle={setIsSearchActive}
            />
            
            {/* Hamburger menu - shown when search is active, positioned after search */}
            {isSearchActive && (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-muted transition-colors animate-fade-in"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5 text-foreground" />
              </button>
            )}
            
            <Button
              onClick={handleBookingClick}
              className="bg-primary hover:bg-primary-hover text-primary-foreground font-medium text-sm px-5 h-10 rounded-full glow-pulse glow-button-hover"
            >
              Book an Impact Conversation
            </Button>
            <TooltipProvider>
              <Tooltip>
                <DropdownMenu>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="w-10 h-10 rounded-full border border-border bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors"
                        aria-label="Sign In / Sign Up"
                      >
                        <User className="w-5 h-5 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Sign In / Sign Up</p>
                  </TooltipContent>
                  <DropdownMenuContent align="end" className="w-40 bg-card border-border">
                    <DropdownMenuItem asChild>
                      <a
                        href={getAppUrl('/users/sign_in')}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <LogIn className="w-4 h-4" />
                        Sign In
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a
                        href={getAppUrl('/users/sign_in')}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4" />
                        Sign Up
                      </a>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Mobile: Search + Menu Button */}
          <div className={cn(
            "relative z-[60] xl:hidden flex items-center gap-2 transition-all duration-500",
            isNavRevealed 
              ? "opacity-100 translate-y-0" 
              : "opacity-0 -translate-y-2 pointer-events-none"
          )}>
            {isAssistantAvailable && isNavRevealed && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleAssistantClick}
                className="h-11 w-11 rounded-full"
                aria-label="Open Alfred chat"
              >
                <MessageSquare className="w-5 h-5" />
              </Button>
            )}
            <HeaderSearch isMobile />
            <button
              className="p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-foreground" />
              ) : (
                <Menu className="w-6 h-6 text-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={cn(
            "xl:hidden absolute top-full left-0 right-0 bg-background border-b border-border transition-all duration-300 overflow-hidden",
            isMobileMenuOpen ? "max-h-[80vh] opacity-100 overflow-y-auto" : "max-h-0 opacity-0"
          )}
        >
          <nav className="container-wide py-6 flex flex-col gap-2">
            {navItems.map((item) => (
              <div key={item.label}>
                {item.href ? (
                  <Link
                    to={item.href}
                    className="block text-base font-medium text-foreground py-3 border-b border-border"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ) : item.label === "Compare" ? (
                  // Compact grouped layout for Compare on mobile
                  <div className="py-3 border-b border-border">
                    <div className="text-base font-medium text-foreground mb-3">{item.label}</div>
                    {item.children?.map((section, sectionIndex) => {
                      const isFeaturedSection = !section.title;
                      return (
                        <div key={sectionIndex} className="mb-3">
                          {section.title && (
                            <div className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-1.5 pl-2 flex items-center gap-2">
                              <span>{section.title}</span>
                              <div className="flex-1 h-px bg-border/50" />
                            </div>
                          )}
                          <div className="flex flex-wrap gap-1">
                            {section.items.map((subItem) => {
                              const isActive = location.pathname === subItem.href;
                              return (
                                <Link
                                  key={subItem.href}
                                  to={subItem.href}
                                  className={cn(
                                    "px-2 py-1.5 rounded-md text-sm transition-colors min-h-[44px] flex items-center",
                                    isFeaturedSection && "w-full font-medium",
                                    isActive
                                      ? "bg-primary/10 text-primary"
                                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                  )}
                                  onClick={() => setIsMobileMenuOpen(false)}
                                >
                                  {subItem.label}
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  // Standard mega menu layout for other nav items
                  <div className="py-3 border-b border-border">
                    <div className="text-base font-medium text-foreground mb-3">{item.label}</div>
                    {item.children?.map((section, sectionIndex) => (
                      <div key={sectionIndex} className="mb-4">
                        {section.title && (
                          section.titleHref ? (
                            <Link
                              to={section.titleHref}
                              className="block text-xs font-semibold text-primary uppercase tracking-wider mb-2 pl-2 hover:underline"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              {section.title}
                            </Link>
                          ) : (
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 pl-2">
                              {section.title}
                            </div>
                          )
                        )}
                        <div className="space-y-1">
                          {section.items.map((subItem) => {
                            const subItemPath = subItem.href.split('?')[0];
                            const subItemSearch = subItem.href.includes('?') ? '?' + subItem.href.split('?')[1] : '';
                            
                            const isActive = 
                              (!subItem.href.includes("?") && location.pathname === subItem.href) ||
                              (subItem.href.includes("?") && location.pathname === subItemPath && location.search === subItemSearch) ||
                              (subItem.href === "/products" && location.pathname === "/products" && !location.search);
                            
                            return (
                              <Link
                                key={subItem.href}
                                to={subItem.href}
                                className={cn(
                                  "flex items-center gap-3 text-sm py-2.5 pl-3 pr-4 rounded-lg transition-colors min-h-[44px]",
                                  isActive 
                                    ? "text-primary bg-primary/10 font-medium" 
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                )}
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                {(subItem.icon || subItem.iconSrc) && (
                                  <div className={cn(
                                    "flex-shrink-0 flex items-center justify-center",
                                    subItem.label === "Omega (Ω)" ? "w-6 h-6" : "w-5 h-5"
                                  )}>
                                    {subItem.icon ? (
                                      <subItem.icon className={cn(
                                        subItem.label === "Omega (Ω)" ? "w-[1.2rem] h-[1.2rem]" : "w-4 h-4",
                                        isActive ? "text-primary" : "text-primary/70"
                                      )} />
                                    ) : (
                                      <img src={subItem.iconSrc} alt="" className={subItem.label === "Omega (Ω)" ? "w-[1.2rem] h-[1.2rem] object-contain" : "w-4 h-4 object-contain"} />
                                    )}
                                  </div>
                                )}
                                <span className="flex-1">{subItem.label}</span>
                                {isActive && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isAssistantAvailable && (
              <Button
                type="button"
                variant="outline"
                onClick={handleAssistantClick}
                className="font-medium w-full mt-4 gap-2 min-h-[44px]"
              >
                <MessageSquare className="w-4 h-4" />
                Ask Alfred
              </Button>
            )}
            <a
              href={getAppUrl('/users/sign_in')}
              onClick={() => setIsMobileMenuOpen(false)}
              className="block"
            >
              <Button
                variant="outline"
                className={cn("font-medium w-full gap-2", isAssistantAvailable ? "mt-2" : "mt-4")}
              >
                <User className="w-4 h-4" />
                Sign In / Sign Up
              </Button>
            </a>
            <Button
              onClick={() => {
                vibrate('medium');
                setIsMobileMenuOpen(false);
                openBooking("header_cta");
              }}
              className="bg-primary hover:bg-primary-hover text-primary-foreground font-medium mt-2 w-full animate-impact-ripple"
            >
              Book an Impact Conversation
            </Button>
          </nav>
        </div>
      </header>
    </>
  );
};

export default Header;