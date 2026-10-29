import { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { useDemoSpeed } from "@/contexts/DemoSpeedContext";
import { InlineDemoSpeedControl } from "@/components/demos/shared/InlineDemoSpeedControl";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Building2,
  Calendar,
  Heart,
  Megaphone,
  CreditCard,
  BarChart3,
  Handshake,
  Bell,
  Mail,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Check,
  Plus,
  DollarSign,
  Search,
  Star,
  Send,
  UserPlus,
  X,
  MessageSquare,
  Phone,
  ExternalLink,
  Trash2,
  CheckCircle2,
  ArrowRight,
  PartyPopper,
  Sparkles,
  PhoneCall
} from "lucide-react";
import { ConfettiCelebration } from "@/components/results/ConfettiCelebration";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { 
  AreaChart, Area, 
  ResponsiveContainer, XAxis, YAxis, Tooltip 
} from "recharts";

// Lazy load the interactive seating planner
const BusinessHubSeatingPlanner = lazy(() => import("./BusinessHubSeatingPlanner"));

type HubStep = {
  id: string;
  title: string;
  icon: typeof Users;
  description: string;
  duration: number;
};

const HUB_STEPS: HubStep[] = [
  { id: "directory", title: "Member Directory", icon: Building2, description: "Companies & members overview", duration: 5000 },
  { id: "events", title: "Event Management", icon: Calendar, description: "Plan galas, networking, workshops", duration: 5500 },
  { id: "seating", title: "Seating Planner", icon: Users, description: "AI-powered table assignments", duration: 5000 },
  { id: "volunteers", title: "Volunteers", icon: Heart, description: "Coordinate volunteer teams", duration: 5000 },
  { id: "communications", title: "Communications", icon: Megaphone, description: "Newsletters & announcements", duration: 5000 },
  { id: "donations", title: "Donations", icon: DollarSign, description: "Track donations & sponsors", duration: 4500 },
  { id: "analytics", title: "Analytics", icon: BarChart3, description: "Member retention & ROI", duration: 5000 },
];

// Mock data for charts
const attendanceData = [
  { month: "Jan", attendees: 145, avgPerEvent: 48 },
  { month: "Feb", attendees: 189, avgPerEvent: 63 },
  { month: "Mar", attendees: 267, avgPerEvent: 89 },
  { month: "Apr", attendees: 312, avgPerEvent: 78 },
  { month: "May", attendees: 356, avgPerEvent: 89 },
  { month: "Jun", attendees: 423, avgPerEvent: 106 },
];

const initialMemberCompanies = [
  { id: 'c1', name: "Jade Tech Intl", industry: "Technology", members: 1, starred: false },
  { id: 'c2', name: "Blue Ocean Media", industry: "Media", members: 4, starred: true },
  { id: 'c3', name: "Great Wall Property", industry: "Construction", members: 5, starred: false },
  { id: 'c4', name: "Orient Catering", industry: "Food & Bev", members: 3, starred: false },
  { id: 'c5', name: "Phoenix Institute", industry: "Education", members: 2, starred: true },
  { id: 'c6', name: "Harmony Holdings", industry: "Finance", members: 3, starred: false },
];

const initialEvents = [
  { id: 'e1', name: "Annual Gala 2026", date: "Feb 15", attendees: 280, status: "Confirmed", rsvpOpen: true },
  { id: 'e2', name: "Spring Networking", date: "Mar 8", attendees: 95, status: "Open", rsvpOpen: true },
  { id: 'e3', name: "Tech Summit", date: "Apr 12", attendees: 156, status: "Planning", rsvpOpen: false },
];

const initialVolunteers = [
  { id: 'v1', name: "Elizabeth Lin", role: "Event Coordinator", events: 12, active: true },
  { id: 'v2', name: "James Ma", role: "Registration Lead", events: 8, active: true },
  { id: 'v3', name: "Wei Feng", role: "Setup Team", events: 15, active: true },
  { id: 'v4', name: "Anna Chen", role: "Catering", events: 6, active: false },
];

const initialDonations = [
  { id: 'd1', donor: "TechCorp AU", type: "Platinum", amount: 15000, thanked: false },
  { id: 'd2', donor: "Ming Dynasty", type: "Gold", amount: 8000, thanked: true },
  { id: 'd3', donor: "James Wilson", type: "Individual", amount: 500, thanked: false },
];

export default function BusinessHubDemo() {
  const { applySpeed } = useDemoSpeed();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [stepProgress, setStepProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const stepScrollRef = useRef<HTMLDivElement>(null);

  // Interactive state for each step
  const [searchQuery, setSearchQuery] = useState("");
  const [companies, setCompanies] = useState(initialMemberCompanies);
  const [events, setEvents] = useState(initialEvents);
  const [volunteers, setVolunteers] = useState(initialVolunteers);
  const [donations, setDonations] = useState(initialDonations);
  const [announcementText, setAnnouncementText] = useState("");
  const [selectedMetric, setSelectedMetric] = useState<'attendees' | 'revenue'>('attendees');
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [sentAnnouncements, setSentAnnouncements] = useState<{id: string; text: string; time: string}[]>([]);
  const [actionCompleted, setActionCompleted] = useState(false);

  const currentStepData = HUB_STEPS[currentStep];
  const isLastStep = currentStep === HUB_STEPS.length - 1;

  // Swipe navigation for mobile
  const handleSwipeNavigate = useCallback((stepIndex: number) => {
    if (stepIndex === HUB_STEPS.length && isLastStep) {
      // Complete the demo on swipe past last step
      setIsCompleted(true);
      setShowConfetti(true);
      setIsPlaying(false);
    } else {
      setCurrentStep(stepIndex);
      setStepProgress(0);
    }
  }, [isLastStep]);

  const { handleTouchStart, handleTouchMove, handleTouchEnd } = useSwipeNavigation({
    items: HUB_STEPS.map((_, idx) => idx),
    activeItem: currentStep,
    onNavigate: handleSwipeNavigate,
    threshold: 50,
  });

  const advanceStep = useCallback(() => {
    if (isLastStep) {
      // Complete the demo
      setIsCompleted(true);
      setShowConfetti(true);
      setIsPlaying(false);
    } else {
      setCurrentStep((prev) => prev + 1);
      setStepProgress(0);
    }
  }, [isLastStep]);

  const goToPrevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      setStepProgress(0);
    }
  }, [currentStep]);

  // Auto-play logic
  useEffect(() => {
    if (!isPlaying) return;
    
    const duration = applySpeed(currentStepData.duration);
    const interval = 50;
    const increment = (interval / duration) * 100;
    
    const timer = setInterval(() => {
      setStepProgress((prev) => {
        if (prev >= 100) {
          advanceStep();
          return 0;
        }
        return prev + increment;
      });
    }, interval);
    
    return () => clearInterval(timer);
  }, [isPlaying, currentStep, currentStepData.duration, advanceStep]);

  // Scroll active step into view
  useEffect(() => {
    if (stepScrollRef.current) {
      const activeStep = stepScrollRef.current.querySelector('[data-active="true"]');
      if (activeStep) {
        activeStep.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentStep]);

  const resetDemo = () => {
    setCurrentStep(0);
    setStepProgress(0);
    setIsPlaying(false);
    setIsCompleted(false);
    setShowConfetti(false);
    setActionCompleted(false);
    // Reset all interactive states
    setSearchQuery("");
    setCompanies(initialMemberCompanies);
    setEvents(initialEvents);
    setVolunteers(initialVolunteers);
    setDonations(initialDonations);
    setAnnouncementText("");
    setSelectedMetric('attendees');
    setShowAddCompany(false);
    setNewCompanyName("");
    setSentAnnouncements([]);
  };

  const handleExploreDemos = () => {
    navigate('/resources/demos');
  };

  const handleBookCall = () => {
    window.location.href = 'https://new.alfredai.bot/book';
  };

  // Reset action completed when step changes
  useEffect(() => {
    setActionCompleted(false);
  }, [currentStep]);

  // Interactive handlers
  const toggleCompanyStar = (id: string) => {
    setCompanies(prev => prev.map(c => 
      c.id === id ? { ...c, starred: !c.starred } : c
    ));
    const company = companies.find(c => c.id === id);
    toast.success(company?.starred ? `Removed from favorites` : `Added to favorites`);
    setActionCompleted(true);
  };

  const addNewCompany = () => {
    if (!newCompanyName.trim()) return;
    const newCompany = {
      id: `c${Date.now()}`,
      name: newCompanyName,
      industry: "New",
      members: 1,
      starred: false
    };
    setCompanies(prev => [newCompany, ...prev]);
    setNewCompanyName("");
    setShowAddCompany(false);
    toast.success(`Added ${newCompanyName}`);
    setActionCompleted(true);
  };

  const toggleEventRsvp = (id: string) => {
    setEvents(prev => prev.map(e => 
      e.id === id ? { ...e, rsvpOpen: !e.rsvpOpen } : e
    ));
    const event = events.find(e => e.id === id);
    toast.success(event?.rsvpOpen ? `RSVP closed` : `RSVP opened`);
    setActionCompleted(true);
  };

  const toggleVolunteerActive = (id: string) => {
    setVolunteers(prev => prev.map(v => 
      v.id === id ? { ...v, active: !v.active } : v
    ));
    const volunteer = volunteers.find(v => v.id === id);
    toast.success(volunteer?.active ? `Marked inactive` : `Marked active`);
    setActionCompleted(true);
  };

  const sendThankYou = (id: string) => {
    setDonations(prev => prev.map(d => 
      d.id === id ? { ...d, thanked: true } : d
    ));
    toast.success(`Thank you email sent!`);
    setActionCompleted(true);
  };

  const sendAnnouncement = () => {
    if (!announcementText.trim()) {
      toast.error("Enter a message first");
      return;
    }
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setSentAnnouncements(prev => [{
      id: `ann-${Date.now()}`,
      text: announcementText,
      time: timeStr
    }, ...prev]);
    toast.success("Sent to 342 members!");
    setAnnouncementText("");
    setActionCompleted(true);
  };

  const handleMetricToggle = (metric: 'attendees' | 'revenue') => {
    setSelectedMetric(metric);
    setActionCompleted(true);
  };

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.industry.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper component for action hint
  const ActionHint = ({ defaultText }: { defaultText: string }) => (
    <AnimatePresence mode="wait">
      {actionCompleted ? (
        <motion.p 
          key="continue"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="text-[10px] text-center text-primary font-medium flex items-center justify-center gap-1"
        >
          <CheckCircle2 className="w-3 h-3" />
          Done! Click arrow to continue
          <ArrowRight className="w-3 h-3" />
        </motion.p>
      ) : (
        <motion.p 
          key="default"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-[10px] text-center text-muted-foreground"
        >
          {defaultText}
        </motion.p>
      )}
    </AnimatePresence>
  );

  const renderStepContent = () => {
    switch (currentStepData.id) {
      case "directory":
        return (
          <div className="space-y-3">
            {/* Search & Add */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search companies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs"
                />
              </div>
              {showAddCompany ? (
                <div className="flex gap-1">
                  <Input
                    placeholder="Company name"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    className="h-8 w-28 text-xs"
                    onKeyDown={(e) => e.key === 'Enter' && addNewCompany()}
                  />
                  <Button size="sm" className="h-8 px-2" onClick={addNewCompany}>
                    <Check className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setShowAddCompany(false)}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <Button size="sm" className="h-8 gap-1 text-xs" onClick={() => setShowAddCompany(true)}>
                  <Plus className="w-3.5 h-3.5" /> Add
                </Button>
              )}
            </div>
            
            {/* Companies List */}
            <div className="space-y-2 max-h-[220px] sm:max-h-[260px] overflow-y-auto">
              {filteredCompanies.map((company, idx) => (
                <motion.div
                  key={company.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 bg-muted/50 rounded-lg border border-border/50 group"
                >
                  <button
                    onClick={() => toggleCompanyStar(company.id)}
                    className="w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0 bg-primary/10 rounded-lg flex items-center justify-center hover:bg-primary/20 transition-colors"
                  >
                    <Star className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors", company.starred ? "text-amber-500 fill-amber-500" : "text-primary")} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-foreground truncate">{company.name}</p>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Badge variant="outline" className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0">{company.industry}</Badge>
                      <span className="text-[9px] sm:text-[10px] text-muted-foreground">{company.members}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" className="h-6 w-6 sm:h-7 sm:w-7 p-0">
                      <Phone className="w-3 h-3" />
                    </Button>
                  </div>
                </motion.div>
              ))}
              {filteredCompanies.length === 0 && (
                <div className="text-center py-4 text-xs sm:text-sm text-muted-foreground">
                  No companies found
                </div>
              )}
            </div>
            <ActionHint defaultText="💡 Star a company or add a new one" />
          </div>
        );

      case "events":
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs sm:text-sm font-semibold text-foreground">Manage Events</h4>
              <Badge variant="secondary" className="text-[10px] sm:text-xs">{events.length} events</Badge>
            </div>
            <div className="space-y-2 max-h-[220px] sm:max-h-[240px] overflow-y-auto">
              {events.map((event, idx) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center justify-between gap-2 p-2 sm:p-3 bg-muted/50 rounded-lg border border-border/50"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 bg-violet-500/10 rounded-lg flex items-center justify-center">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-violet-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-foreground truncate">{event.name}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">{event.date} • {event.attendees}</p>
                    </div>
                  </div>
                  <Button 
                    variant={event.rsvpOpen ? "default" : "outline"} 
                    size="sm" 
                    className="h-6 sm:h-7 text-[10px] sm:text-xs gap-1 flex-shrink-0 px-2"
                    onClick={() => toggleEventRsvp(event.id)}
                  >
                    {event.rsvpOpen ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        <span className="hidden sm:inline">RSVP Open</span>
                        <span className="sm:hidden">Open</span>
                      </>
                    ) : (
                      <>
                        <X className="w-3 h-3" />
                        <span>Closed</span>
                      </>
                    )}
                  </Button>
                </motion.div>
              ))}
            </div>
            <ActionHint defaultText="💡 Toggle RSVP status for any event" />
          </div>
        );

      case "seating":
        return (
          <Suspense fallback={
            <div className="flex items-center justify-center h-[200px]">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          }>
            <BusinessHubSeatingPlanner />
          </Suspense>
        );

      case "volunteers":
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs sm:text-sm font-semibold text-foreground">Volunteers</h4>
              <Badge variant="secondary" className="text-[10px] sm:text-xs">
                {volunteers.filter(v => v.active).length} active
              </Badge>
            </div>
            <div className="space-y-2 max-h-[220px] sm:max-h-[240px] overflow-y-auto">
              {volunteers.map((volunteer, idx) => (
                <motion.div
                  key={volunteer.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={cn(
                    "flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg border transition-all",
                    volunteer.active 
                      ? "bg-muted/50 border-border/50" 
                      : "bg-muted/20 border-border/30 opacity-60"
                  )}
                >
                  <button
                    onClick={() => toggleVolunteerActive(volunteer.id)}
                    className={cn(
                      "w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0 rounded-full flex items-center justify-center transition-colors",
                      volunteer.active 
                        ? "bg-rose-500/10 hover:bg-rose-500/20" 
                        : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    <Heart className={cn(
                      "w-3.5 h-3.5 sm:w-4 sm:h-4 transition-colors",
                      volunteer.active ? "text-rose-500 fill-rose-500" : "text-muted-foreground"
                    )} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-foreground truncate">{volunteer.name}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{volunteer.role}</p>
                  </div>
                  <Badge variant={volunteer.active ? "default" : "secondary"} className="text-[9px] sm:text-[10px] flex-shrink-0">
                    {volunteer.active ? "Active" : "Inactive"}
                  </Badge>
                </motion.div>
              ))}
            </div>
            <ActionHint defaultText="💡 Tap heart to toggle status" />
          </div>
        );

      case "communications":
        return (
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-semibold text-foreground">Announcement</h4>
              <Badge variant="secondary" className="text-[10px] sm:text-xs">342 members</Badge>
            </div>
            
            {/* Announcement Composer */}
            <div className="p-2 sm:p-3 bg-muted/50 rounded-lg border border-border/50 space-y-2 sm:space-y-3">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
                <span>New Message</span>
              </div>
              <textarea
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="Type message..."
                className="w-full h-12 sm:h-14 p-2 text-xs sm:text-sm bg-background rounded-md border border-border resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                  Sends to all members
                </span>
                <Button 
                  size="sm" 
                  className="h-7 sm:h-8 gap-1 text-xs ml-auto"
                  onClick={sendAnnouncement}
                  disabled={!announcementText.trim()}
                >
                  <Send className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  Send
                </Button>
              </div>
            </div>

            {/* Sent Announcements */}
            <div className="space-y-2 max-h-[100px] sm:max-h-[120px] overflow-y-auto">
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">
                {sentAnnouncements.length > 0 ? `Sent (${sentAnnouncements.length})` : 'Recent'}
              </p>
              
              <AnimatePresence>
                {sentAnnouncements.map((ann, idx) => (
                  <motion.div
                    key={ann.id}
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/30"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span className="text-[10px] sm:text-xs font-medium text-emerald-700">Sent</span>
                      <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-600">
                        {ann.time}
                      </Badge>
                    </div>
                    <p className="text-[10px] sm:text-xs text-foreground line-clamp-1">{ann.text}</p>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Default newsletter item */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-2 bg-muted/30 rounded-lg border border-border/30"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Mail className="w-3 h-3 text-blue-500" />
                  <span className="text-[10px] sm:text-xs font-medium">Newsletter</span>
                  <Badge className="text-[9px]">Sent</Badge>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Jan 2026 Update</p>
              </motion.div>
            </div>
            <ActionHint defaultText="💡 Type and send an announcement" />
          </div>
        );

      case "donations":
        return (
          <div className="space-y-2 sm:space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-2 sm:p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20"
              >
                <p className="text-[10px] sm:text-xs text-muted-foreground">Total</p>
                <p className="text-sm sm:text-lg font-bold text-emerald-600 tabular-nums">
                  ${donations.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}
                </p>
                <p className="text-[9px] sm:text-[10px] text-emerald-600">{donations.length} donors</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="p-2 sm:p-3 bg-violet-500/10 rounded-lg border border-violet-500/20"
              >
                <p className="text-[10px] sm:text-xs text-muted-foreground">Pending</p>
                <p className="text-sm sm:text-lg font-bold text-violet-600 tabular-nums">
                  {donations.filter(d => !d.thanked).length}
                </p>
                <p className="text-[9px] sm:text-[10px] text-violet-600">Need thanks</p>
              </motion.div>
            </div>
            
            <div className="space-y-2 max-h-[140px] sm:max-h-[160px] overflow-y-auto">
              {donations.map((donation, idx) => (
                <motion.div
                  key={donation.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 bg-muted/50 rounded-lg border border-border/50"
                >
                  <div className="w-7 h-7 sm:w-9 sm:h-9 flex-shrink-0 bg-amber-500/10 rounded-lg flex items-center justify-center">
                    <Handshake className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-foreground truncate">{donation.donor}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">{donation.type}</p>
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-emerald-600 flex-shrink-0 tabular-nums">${donation.amount.toLocaleString()}</span>
                  {donation.thanked ? (
                    <Badge variant="secondary" className="text-[9px] sm:text-[10px] gap-0.5 flex-shrink-0">
                      <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5" /> Done
                    </Badge>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-6 sm:h-7 text-[10px] sm:text-xs gap-0.5 px-2 flex-shrink-0"
                      onClick={() => sendThankYou(donation.id)}
                    >
                      <Mail className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                      <span className="hidden sm:inline">Thank</span>
                    </Button>
                  )}
                </motion.div>
              ))}
            </div>
            <ActionHint defaultText="💡 Send a thank you email" />
          </div>
        );

      case "analytics":
        return (
          <div className="space-y-2 sm:space-y-3">
            {/* Metric Toggle */}
            <div className="flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-semibold text-foreground">Analytics</h4>
              <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
                <button
                  onClick={() => handleMetricToggle('attendees')}
                  className={cn(
                    "px-2 sm:px-2.5 py-1 text-[9px] sm:text-[10px] font-medium rounded-md transition-colors",
                    selectedMetric === 'attendees' 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Attendees
                </button>
                <button
                  onClick={() => handleMetricToggle('revenue')}
                  className={cn(
                    "px-2 sm:px-2.5 py-1 text-[9px] sm:text-[10px] font-medium rounded-md transition-colors",
                    selectedMetric === 'revenue' 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Revenue
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              <motion.div
                key={`stat-1-${selectedMetric}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-2 sm:p-2.5 bg-muted/50 rounded-lg border border-border/50 text-center"
              >
                <p className="text-sm sm:text-lg font-bold text-foreground">
                  {selectedMetric === 'attendees' ? '647' : '$96K'}
                </p>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground">
                  {selectedMetric === 'attendees' ? 'Total' : 'Revenue'}
                </p>
              </motion.div>
              <motion.div
                key={`stat-2-${selectedMetric}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 }}
                className="p-2 sm:p-2.5 bg-muted/50 rounded-lg border border-border/50 text-center"
              >
                <p className="text-sm sm:text-lg font-bold text-emerald-600">+22%</p>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground">Growth</p>
              </motion.div>
              <motion.div
                key={`stat-3-${selectedMetric}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="p-2 sm:p-2.5 bg-muted/50 rounded-lg border border-border/50 text-center"
              >
                <p className="text-sm sm:text-lg font-bold text-foreground">
                  {selectedMetric === 'attendees' ? '89' : '$4.8K'}
                </p>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground">Avg</p>
              </motion.div>
            </div>

            {/* Chart */}
            <div className="h-[100px] sm:h-[130px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceData}>
                  <defs>
                    <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '11px'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey={selectedMetric === 'attendees' ? 'attendees' : 'avgPerEvent'} 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fill="url(#attendanceGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <ActionHint defaultText="💡 Toggle between metrics" />
          </div>
        );

      default:
        return null;
    }
  };

  // Completion screen
  if (isCompleted) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-lg overflow-hidden">
        <ConfettiCelebration trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
        
        {/* Celebration Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 sm:p-8">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
              className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <PartyPopper className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </motion.div>
            <motion.h3 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-white font-bold text-xl sm:text-2xl mb-2"
            >
              Demo Complete! 🎉
            </motion.h3>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-white/80 text-sm sm:text-base mb-6"
            >
              You've explored all features of Business Hub
            </motion.p>

            {/* Restart button inside header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                onClick={resetDemo}
                variant="outline"
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white gap-2 h-10 px-6"
              >
                <RotateCcw className="w-4 h-4" />
                Restart Demo
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Action Options */}
        <div className="p-4 sm:p-6 flex flex-col gap-3">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            onClick={handleExploreDemos}
            className="w-full flex items-center justify-center h-14 sm:h-16 gap-3 text-base sm:text-lg font-medium bg-emerald-500 hover:bg-emerald-600 text-white rounded-md transition-colors"
          >
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
            Explore Other Demos
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            onClick={handleBookCall}
            className="w-full flex items-center justify-center h-12 sm:h-14 gap-2 text-sm sm:text-base bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-md font-medium transition-colors hover:opacity-90"
          >
            <PhoneCall className="w-4 h-4 sm:w-5 sm:h-5" />
            Book Impact Conversation
          </motion.button>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center text-xs text-muted-foreground pt-2"
          >
            See how Alfred can transform your operations
          </motion.p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a365d] to-[#2c5282] p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm sm:text-base">Business Hub</h3>
              <p className="text-white/60 text-[10px] sm:text-xs">Association Management Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={resetDemo}
              className="w-7 h-7 text-white/70 hover:text-white hover:bg-white/10"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-7 h-7 text-white/70 hover:text-white hover:bg-white/10"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </Button>
            <InlineDemoSpeedControl compact className="hidden sm:flex" />
          </div>
        </div>

        {/* Step Tabs - Horizontal Scrollable */}
        <div 
          ref={stepScrollRef}
          className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1"
        >
          {HUB_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = idx === currentStep;
            return (
              <button
                key={step.id}
                data-active={isActive}
                onClick={() => {
                  setCurrentStep(idx);
                  setStepProgress(0);
                }}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0",
                  isActive
                    ? "bg-white text-[#1a365d]"
                    : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{step.title}</span>
                <span className="sm:hidden">{step.title.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content - Fully Interactive with Swipe Support */}
      <div
        ref={contentRef}
        className="p-4 sm:p-5 min-h-[420px] relative touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Navigation Arrows */}
        <button
          onClick={goToPrevStep}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center text-foreground hover:bg-background transition-colors shadow-md border border-border/50"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={advanceStep}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center text-foreground hover:bg-background transition-colors shadow-md border border-border/50"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Step Header */}
        <div className="flex items-center gap-2 mb-4 px-6">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            {(() => {
              const Icon = currentStepData.icon;
              return <Icon className="w-4 h-4 text-primary" />;
            })()}
          </div>
          <div>
            <h4 className="font-semibold text-sm text-foreground">{currentStepData.title}</h4>
            <p className="text-xs text-muted-foreground">{currentStepData.description}</p>
          </div>
        </div>

        {/* Animated Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="px-6"
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-muted">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${stepProgress}%` }}
          transition={{ duration: 0.05 }}
        />
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-border bg-muted/30 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Step {currentStep + 1} of {HUB_STEPS.length}
        </span>
        <div className="flex gap-1">
          {HUB_STEPS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentStep(idx);
                setStepProgress(0);
              }}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                idx === currentStep
                  ? "bg-primary w-4"
                  : idx < currentStep
                    ? "bg-primary/50"
                    : "bg-muted-foreground/30"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
