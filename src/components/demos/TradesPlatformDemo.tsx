import { useState, useEffect, useRef, useCallback } from "react";
import { useDemoSpeed } from "@/contexts/DemoSpeedContext";
import { InlineDemoSpeedControl } from "@/components/demos/shared/InlineDemoSpeedControl";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { 
  Paintbrush, Send, Camera, Upload, Check, X, Calendar, Clock, 
  ChevronRight, ChevronLeft, CreditCard, MapPin, Phone, Mail, User, Home,
  Sparkles, Image, AlertCircle, CheckCircle2, ArrowRight, 
  MessageSquare, Building2, Droplets, Palette, Timer, Shield,
  RefreshCw, Play, Pause, RotateCcw, Eye, Star, Users, FileText,
  Truck, Hammer, HardHat, Receipt, Send as SendIcon, Download,
  ExternalLink, Printer, ClipboardList, ListChecks
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useBookingSounds } from "@/hooks/useBookingSounds";
import stripeLogo from "@/assets/logos/stripe.png";
import { useChatContext } from "@/contexts/ChatContext";
import { FingerClickIndicator, DemoButton } from "./shared";
// Main tabs data for swipe navigation
const mainTabs = [
  { id: 'demo' as const, label: 'Try Demo', icon: MessageSquare },
  { id: 'workflow' as const, label: 'How It Works', icon: ListChecks },
];

// Main Tabs with swipe and arrows component
interface MainTabsWithSwipeProps {
  activeTab: 'demo' | 'workflow';
  onTabChange: (tab: 'demo' | 'workflow') => void;
}

function MainTabsWithSwipe({ activeTab, onTabChange }: MainTabsWithSwipeProps) {
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    const currentIndex = mainTabs.findIndex(t => t.id === activeTab);
    
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentIndex < mainTabs.length - 1) {
        onTabChange(mainTabs[currentIndex + 1].id);
      } else if (diff < 0 && currentIndex > 0) {
        onTabChange(mainTabs[currentIndex - 1].id);
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const navigate = (direction: 'left' | 'right') => {
    const currentIndex = mainTabs.findIndex(t => t.id === activeTab);
    if (direction === 'left' && currentIndex > 0) {
      onTabChange(mainTabs[currentIndex - 1].id);
    } else if (direction === 'right' && currentIndex < mainTabs.length - 1) {
      onTabChange(mainTabs[currentIndex + 1].id);
    }
  };

  const currentIndex = mainTabs.findIndex(t => t.id === activeTab);
  const canGoLeft = currentIndex > 0;
  const canGoRight = currentIndex < mainTabs.length - 1;

  return (
    <div className="mt-4 relative">
      {/* Left Arrow */}
      <AnimatePresence>
        {canGoLeft && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => navigate('left')}
            className="absolute -left-1 top-1/2 -translate-y-1/2 z-10 w-6 h-6 flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-full"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Tabs Container */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="flex gap-2 px-1"
      >
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <Button
              key={tab.id}
              variant="ghost"
              size="sm"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex-1 h-9 text-sm font-medium transition-all",
                isActive 
                  ? "bg-white/20 text-white" 
                  : "text-white/70 hover:text-white hover:bg-white/10"
              )}
            >
              <Icon className="h-4 w-4 mr-2" />
              {tab.label}
            </Button>
          );
        })}
      </div>

      {/* Right Arrow */}
      <AnimatePresence>
        {canGoRight && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => navigate('right')}
            className="absolute -right-1 top-1/2 -translate-y-1/2 z-10 w-6 h-6 flex items-center justify-center bg-white/20 backdrop-blur-sm rounded-full"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

// Demo room images for AI analysis simulation
const DEMO_ROOM_IMAGES = [
  {
    id: "living-room",
    name: "Living Room",
    url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop",
    analysis: { area: 52, height: 2.7, condition: "Good", prep: 2.5 },
  },
  {
    id: "bedroom",
    name: "Master Bedroom",
    url: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=300&fit=crop",
    analysis: { area: 38, height: 2.7, condition: "Fair", prep: 3 },
  },
  {
    id: "kitchen",
    name: "Kitchen",
    url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
    analysis: { area: 32, height: 2.7, condition: "Good", prep: 1.5 },
  },
  {
    id: "bathroom",
    name: "Bathroom",
    url: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=300&fit=crop",
    analysis: { area: 22, height: 2.4, condition: "Needs attention", prep: 4 },
  },
  {
    id: "exterior",
    name: "House Exterior",
    url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop",
    analysis: { area: 145, height: 4.5, condition: "Weathered", prep: 6 },
  },
];

// Paint options
const PAINT_TYPES = [
  { id: "interior-acrylic", name: "Interior Acrylic", priceMultiplier: 1.0 },
  { id: "exterior-weather", name: "Exterior Weather Shield", priceMultiplier: 1.25 },
  { id: "low-voc", name: "Low-VOC Eco Paint", priceMultiplier: 1.15 },
  { id: "premium-washable", name: "Premium Washable", priceMultiplier: 1.3 },
];

const PAINT_FINISHES = [
  { id: "matte", name: "Matte", description: "Elegant, hides imperfections" },
  { id: "satin", name: "Satin", description: "Soft sheen, easy to clean" },
  { id: "semi-gloss", name: "Semi-Gloss", description: "Durable, moisture resistant" },
  { id: "gloss", name: "Gloss", description: "High shine, very durable" },
];

const PAINT_BRANDS = [
  { id: "dulux", name: "Dulux", premium: false },
  { id: "taubmans", name: "Taubmans", premium: false },
  { id: "haymes", name: "Haymes", premium: true },
  { id: "no-pref", name: "No Preference", premium: false },
];

const COLOR_SWATCHES = [
  { id: "white", name: "Brilliant White", hex: "#FFFFFF" },
  { id: "antique-white", name: "Antique White", hex: "#FAEBD7" },
  { id: "warm-grey", name: "Warm Grey", hex: "#A0998F" },
  { id: "sage-green", name: "Sage Green", hex: "#9CAF88" },
  { id: "navy-blue", name: "Navy Blue", hex: "#1E3A5F" },
  { id: "charcoal", name: "Charcoal", hex: "#36454F" },
  { id: "terracotta", name: "Terracotta", hex: "#C67B5C" },
  { id: "dusty-pink", name: "Dusty Pink", hex: "#D4A5A5" },
];

const ADDITIONAL_SERVICES = [
  { id: "ceiling", name: "Ceiling Painting", price: 18, unit: "per m²" },
  { id: "trim", name: "Trim & Skirting", price: 95, unit: "per room" },
  { id: "repairs", name: "Wall Repairs/Patching", price: 185, unit: "estimate" },
  { id: "furniture", name: "Furniture Moving", price: 120, unit: "flat fee" },
  { id: "undercoat", name: "Premium Undercoat", price: 12, unit: "per m²" },
];

const TIMING_OPTIONS = [
  { id: "asap", name: "ASAP (within 1 week)", multiplier: 1.2, badge: "Urgent" },
  { id: "2weeks", name: "Within 2 weeks", multiplier: 1.0, badge: null },
  { id: "1month", name: "Within 1 month", multiplier: 0.95, badge: "5% off" },
  { id: "flexible", name: "Flexible timing", multiplier: 0.9, badge: "10% off" },
];

type QuoteStep = 
  | 'welcome' 
  | 'project-type' 
  | 'rooms' 
  | 'photos' 
  | 'analyzing' 
  | 'confirm-measurements'
  | 'surface-assessment'
  | 'paint' 
  | 'extras' 
  | 'timing' 
  | 'contact' 
  | 'quote' 
  | 'payment' 
  | 'confirmation';

// Surface preparation options with pricing impact
const SURFACE_PREP_OPTIONS = [
  { id: 'minimal', name: 'Minimal Prep', description: 'Light cleaning & spot repairs', multiplier: 0.8, hours: 2 },
  { id: 'standard', name: 'Standard Prep', description: 'Sanding, filling holes, cleaning', multiplier: 1.0, hours: 4 },
  { id: 'extensive', name: 'Extensive Prep', description: 'Major repairs, stripping, priming', multiplier: 1.4, hours: 8 },
  { id: 'full-restoration', name: 'Full Restoration', description: 'Complete surface restoration', multiplier: 1.8, hours: 12 },
];

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user' | 'system';
  content: string;
  timestamp: Date;
  component?: React.ReactNode;
}

interface QuoteData {
  projectType: string | null;
  rooms: string[];
  photos: typeof DEMO_ROOM_IMAGES;
  paint: {
    type: string | null;
    finish: string | null;
    brand: string | null;
    color: { id: string; name: string; hex: string } | null;
  };
  extras: string[];
  timing: string | null;
  contact: {
    name: string;
    email: string;
    phone: string;
    address: string;
  } | null;
}

interface AnalysisResult {
  totalArea: number;
  avgHeight: number;
  condition: string;
  prepHours: number;
  roomBreakdown: { name: string; area: number; height: number; condition: string }[];
}

interface SurfacePrepSelection {
  prepLevel: string;
  adjustedPrepHours: number;
  confirmedArea: number;
}

export default function TradesPlatformDemo() {
  const { applySpeed } = useDemoSpeed();
  const [currentStep, setCurrentStep] = useState<QuoteStep>('welcome');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [quoteData, setQuoteData] = useState<QuoteData>({
    projectType: null,
    rooms: [],
    photos: [],
    paint: { type: null, finish: null, brand: null, color: null },
    extras: [],
    timing: null,
    contact: null,
  });
  const [isTyping, setIsTyping] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [autoPlayPaused, setAutoPlayPaused] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<typeof DEMO_ROOM_IMAGES>([]);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [activePostTab, setActivePostTab] = useState<'workflow' | 'invoice' | 'quote'>('workflow');
  const [workAssignments, setWorkAssignments] = useState([
    { id: 1, name: 'Marcus Thompson', role: 'Lead Painter', status: 'confirmed', avatar: 'MT' },
    { id: 2, name: 'Jake Williams', role: 'Painter', status: 'pending', avatar: 'JW' },
    { id: 3, name: 'QuickPrep Services', role: 'Subcontractor', status: 'pending', avatar: 'QP' },
  ]);
  const [surfacePrep, setSurfacePrep] = useState<SurfacePrepSelection | null>(null);
  const [measurementAdjustment, setMeasurementAdjustment] = useState(0); // percentage adjustment
  const [activeMainTab, setActiveMainTab] = useState<'demo' | 'workflow'>('demo');
  const [siteInspectionRequested, setSiteInspectionRequested] = useState(false);
  const [showMobileQuote, setShowMobileQuote] = useState(false);
  const [clickIndicator, setClickIndicator] = useState<{ x: number; y: number; label: string } | null>(null);
  const [autoFillContact, setAutoFillContact] = useState<{ name: string; email: string; phone: string; address: string } | undefined>(undefined);
  const [highlightedTab, setHighlightedTab] = useState<'workflow' | 'invoice' | 'quote' | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const demoContainerRef = useRef<HTMLDivElement>(null);
  const [showAutoPlayPrompt, setShowAutoPlayPrompt] = useState(true);
  const { setDemoActive } = useChatContext();
  
  // Helper to show click indicator at element position
  const showClickAt = useCallback((selector: string, label: string, offsetX = 0, offsetY = 0) => {
    return new Promise<void>((resolve) => {
      // Find element within the demo container
      const container = demoContainerRef.current;
      if (!container) {
        resolve();
        return;
      }
      
      const element = container.querySelector(selector);
      if (element) {
        const rect = element.getBoundingClientRect();
        const x = rect.left + rect.width / 2 + offsetX;
        const y = rect.top + rect.height / 2 + offsetY;
        setClickIndicator({ x, y, label });
        
        // Hide after animation
        setTimeout(() => {
          setClickIndicator(null);
          resolve();
        }, applySpeed(800));
      } else {
        // If element not found, show in center of container
        const containerRect = container.getBoundingClientRect();
        setClickIndicator({ 
          x: containerRect.left + containerRect.width / 2, 
          y: containerRect.top + 200, 
          label 
        });
        setTimeout(() => {
          setClickIndicator(null);
          resolve();
        }, applySpeed(800));
      }
    });
  }, []);
  
  // Computed: is autoplay running and not paused (blocks manual interactions)
  const isAutoPlayActive = isAutoPlaying && !autoPlayPaused;
  
  // Track demo active state
  const isDemoRunning = currentStep !== 'welcome' || messages.length > 0;
  
  useEffect(() => {
    setDemoActive(isDemoRunning);
    return () => setDemoActive(false);
  }, [isDemoRunning, setDemoActive]);
  
  // Haptic feedback hook
  const { playClick, playSuccess, playStepComplete, playCelebration } = useBookingSounds();

  // Scroll to bottom when messages change - with smooth behavior
  useEffect(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      // Use requestAnimationFrame for smoother scroll timing
      requestAnimationFrame(() => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        });
      });
    }
  }, [messages, isTyping, currentStep]);

  // Calculate quote total - uses confirmed measurements and surface prep
  const calculateQuote = () => {
    if (!analysisResult) return { subtotal: 0, gst: 0, total: 0, deposit: 0, breakdown: [] };
    
    // Use confirmed area if available, otherwise use AI estimate
    const confirmedArea = surfacePrep?.confirmedArea || analysisResult.totalArea;
    const prepSelection = SURFACE_PREP_OPTIONS.find(p => p.id === surfacePrep?.prepLevel);
    const prepMultiplier = prepSelection?.multiplier || 1;
    const prepHours = surfacePrep?.adjustedPrepHours || analysisResult.prepHours;
    
    const baseLabourRate = 48; // per m² for labour
    const paintType = PAINT_TYPES.find(p => p.id === quoteData.paint.type);
    const timing = TIMING_OPTIONS.find(t => t.id === quoteData.timing);
    const brand = PAINT_BRANDS.find(b => b.id === quoteData.paint.brand);
    
    const paintMultiplier = paintType?.priceMultiplier || 1;
    const timingMultiplier = timing?.multiplier || 1;
    const brandPremium = brand?.premium ? 1.15 : 1;
    
    const breakdown: { item: string; amount: number }[] = [];
    
    // Labour - painting (uses confirmed area)
    const labourTotal = Math.round(confirmedArea * baseLabourRate * paintMultiplier * brandPremium);
    breakdown.push({ item: `Professional Painting Labour (${confirmedArea}m²)`, amount: labourTotal });
    
    // Paint materials - realistic paint cost
    const paintLitresNeeded = Math.ceil(confirmedArea / 12); // ~12m² per litre coverage
    const paintPricePerLitre = brand?.premium ? 85 : 65;
    const paintCost = Math.round(paintLitresNeeded * paintPricePerLitre * paintMultiplier);
    breakdown.push({ item: `Paint & Materials (${paintLitresNeeded}L)`, amount: paintCost });
    
    // Prep work - uses selected prep level and multiplier
    const prepHourlyRate = 75;
    const prepCost = Math.round(prepHours * prepHourlyRate * prepMultiplier);
    breakdown.push({ item: `Surface Preparation (${prepHours}h @ $${prepHourlyRate}/h${prepMultiplier !== 1 ? ` × ${prepMultiplier}` : ''})`, amount: prepCost });
    
    // Additional services
    quoteData.extras.forEach(extraId => {
      const extra = ADDITIONAL_SERVICES.find(s => s.id === extraId);
      if (extra) {
        let extraCost = extra.price;
        if (extra.unit === 'per m²') {
          extraCost = Math.round(extra.price * (confirmedArea * 0.35)); // Ceiling is ~35% of wall area
        } else if (extra.unit === 'per room') {
          extraCost = extra.price * quoteData.photos.length;
        }
        breakdown.push({ item: extra.name, amount: extraCost });
      }
    });
    
    const subtotal = Math.round(breakdown.reduce((sum, item) => sum + item.amount, 0) * timingMultiplier);
    const gst = Math.round(subtotal * 0.1);
    const total = subtotal + gst;
    const deposit = Math.round(total * 0.25); // 25% deposit
    
    return { subtotal, gst, total, deposit, breakdown };
  };

  const addMessage = (role: 'assistant' | 'user' | 'system', content: string, component?: React.ReactNode) => {
    const message: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      role,
      content,
      timestamp: new Date(),
      component,
    };
    setMessages(prev => [...prev, message]);
  };

  const simulateTyping = async (delay = 800) => {
    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, delay));
    setIsTyping(false);
  };

  // Start the conversation - instant for manual exploration
  useEffect(() => {
    if (messages.length === 0) {
      // Add welcome message instantly
      addMessage('assistant', "Hi! 👋 Welcome to **ProPaint Professionals**. I'm your AI quote assistant and I'll help you get an instant, accurate quote for your painting project.\n\nWhat type of painting service do you need today?");
      setCurrentStep('project-type');
    }
  }, []);

  // Handle project type selection
  const handleProjectType = async (type: string) => {
    playClick();
    addMessage('user', type);
    setQuoteData(prev => ({ ...prev, projectType: type }));
    
    await simulateTyping();
    addMessage('assistant', `Great choice! **${type}** projects are our specialty.\n\nTo give you an accurate quote, I need to see the spaces. Please upload photos of the rooms/areas that need painting, or select from our demo images below.\n\n📸 *Our AI will analyze the photos to estimate surface area and wall condition.*`);
    setCurrentStep('photos');
  };

  // Handle photo selection
  const handlePhotoSelect = (photo: typeof DEMO_ROOM_IMAGES[0]) => {
    playClick();
    if (selectedPhotos.find(p => p.id === photo.id)) {
      setSelectedPhotos(prev => prev.filter(p => p.id !== photo.id));
    } else {
      setSelectedPhotos(prev => [...prev, photo]);
    }
  };

  // Handle photo upload confirmation
  const handlePhotosSubmit = async () => {
    if (selectedPhotos.length === 0) return;
    
    playSuccess();
    setQuoteData(prev => ({ ...prev, photos: selectedPhotos }));
    addMessage('user', `[Uploaded ${selectedPhotos.length} photo${selectedPhotos.length > 1 ? 's' : ''}: ${selectedPhotos.map(p => p.name).join(', ')}]`);
    
    await simulateTyping(500);
    addMessage('assistant', "Excellent! I've received your photos. Let me analyze them with our AI...");
    setCurrentStep('analyzing');
    
    // Simulate AI analysis
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        // Calculate analysis results with room breakdown
        const roomBreakdown = selectedPhotos.map(p => ({
          name: p.name,
          area: p.analysis.area,
          height: p.analysis.height,
          condition: p.analysis.condition
        }));
        const totalArea = selectedPhotos.reduce((sum, p) => sum + p.analysis.area, 0);
        const avgHeight = selectedPhotos.reduce((sum, p) => sum + p.analysis.height, 0) / selectedPhotos.length;
        const prepHours = selectedPhotos.reduce((sum, p) => sum + p.analysis.prep, 0);
        const conditions = selectedPhotos.map(p => p.analysis.condition);
        const worstCondition = conditions.includes("Needs attention") ? "Needs attention" : 
                               conditions.includes("Weathered") ? "Weathered" :
                               conditions.includes("Fair") ? "Fair" : "Good";
        
        const result: AnalysisResult = { totalArea, avgHeight, condition: worstCondition, prepHours, roomBreakdown };
        setAnalysisResult(result);
        playStepComplete();
        
        setTimeout(async () => {
          addMessage('assistant', `🔍 **AI Analysis Complete!**\n\nI've measured each space. Please review the measurements below and confirm they look accurate, or adjust if needed.`);
          setCurrentStep('confirm-measurements');
        }, 500);
      }
      setAnalysisProgress(progress);
    }, 200);
  };

  // Handle measurement confirmation
  const handleConfirmMeasurements = async (adjustment: number) => {
    playClick();
    setMeasurementAdjustment(adjustment);
    // Use ref as fallback for autoplay race condition
    const currentAnalysis = analysisResult || autoPlayAnalysisRef.current;
    const adjustedArea = Math.round((currentAnalysis?.totalArea || 0) * (1 + adjustment / 100));
    
    addMessage('user', adjustment === 0 
      ? "Measurements look accurate ✓" 
      : `Adjusted total area to ${adjustedArea}m² (${adjustment > 0 ? '+' : ''}${adjustment}%)`
    );
    
    await simulateTyping();
    const condition = currentAnalysis?.condition || 'Good';
    addMessage('assistant', `Great! Now let's assess the surface condition. Based on my analysis, I detected **${condition}** condition.\n\nPlease select the level of surface preparation needed:`);
    setCurrentStep('surface-assessment');
  };

  // Handle surface prep selection
  const handleSurfacePrepSelect = async (prepId: string) => {
    playClick();
    const prep = SURFACE_PREP_OPTIONS.find(p => p.id === prepId);
    // Use ref as fallback for autoplay race condition
    const currentAnalysis = analysisResult || autoPlayAnalysisRef.current;
    if (!prep || !currentAnalysis) return;
    
    // Use autoplay photos ref as fallback during autoplay
    const photosCount = selectedPhotos.length || autoPlayPhotosRef.current.length;
    const adjustedPrepHours = Math.round(prep.hours * photosCount);
    const confirmedArea = Math.round(currentAnalysis.totalArea * (1 + measurementAdjustment / 100));
    
    setSurfacePrep({
      prepLevel: prepId,
      adjustedPrepHours,
      confirmedArea
    });
    
    addMessage('user', `${prep.name} - ${prep.description}`);
    
    await simulateTyping();
    const prepImpact = prep.multiplier > 1 
      ? `This will add ${((prep.multiplier - 1) * 100).toFixed(0)}% to prep costs.` 
      : prep.multiplier < 1 
        ? `This reduces prep costs by ${((1 - prep.multiplier) * 100).toFixed(0)}%.`
        : '';
    
    addMessage('assistant', `Noted! **${prep.name}** selected - ${adjustedPrepHours} hours of prep work. ${prepImpact}\n\nNow let's choose your paint specifications. What type of paint would you like?`);
    setCurrentStep('paint');
  };

  // Handle paint selection
  const handlePaintType = async (typeId: string) => {
    playClick();
    const paintType = PAINT_TYPES.find(p => p.id === typeId);
    addMessage('user', paintType?.name || typeId);
    setQuoteData(prev => ({ ...prev, paint: { ...prev.paint, type: typeId } }));
    
    await simulateTyping();
    addMessage('assistant', "Perfect! What finish would you prefer?");
  };

  const handlePaintFinish = async (finishId: string) => {
    playClick();
    const finish = PAINT_FINISHES.find(f => f.id === finishId);
    addMessage('user', `${finish?.name} - ${finish?.description}`);
    setQuoteData(prev => ({ ...prev, paint: { ...prev.paint, finish: finishId } }));
    
    await simulateTyping();
    addMessage('assistant', "Do you have a preferred paint brand?");
  };

  const handlePaintBrand = async (brandId: string) => {
    playClick();
    const brand = PAINT_BRANDS.find(b => b.id === brandId);
    addMessage('user', brand?.name || brandId);
    setQuoteData(prev => ({ ...prev, paint: { ...prev.paint, brand: brandId } }));
    
    await simulateTyping();
    addMessage('assistant', "Now let's pick a color! Select from our popular choices or describe your ideal shade:");
  };

  const handleColorSelect = async (color: typeof COLOR_SWATCHES[0]) => {
    playClick();
    addMessage('user', `🎨 ${color.name}`);
    setQuoteData(prev => ({ ...prev, paint: { ...prev.paint, color } }));
    
    await simulateTyping();
    addMessage('assistant', "Excellent choice! Would you like any additional services included in your quote?");
    setCurrentStep('extras');
  };

  // Handle extras selection
  const handleExtrasSubmit = async (selectedExtras: string[]) => {
    playSuccess();
    setQuoteData(prev => ({ ...prev, extras: selectedExtras }));
    
    if (selectedExtras.length > 0) {
      const extraNames = selectedExtras.map(id => ADDITIONAL_SERVICES.find(s => s.id === id)?.name).filter(Boolean);
      addMessage('user', `Added: ${extraNames.join(', ')}`);
    } else {
      addMessage('user', 'No additional services needed');
    }
    
    await simulateTyping();
    addMessage('assistant', "When would you like the work completed? This helps us schedule the best team for your project.");
    setCurrentStep('timing');
  };

  // Handle timing selection
  const handleTimingSelect = async (timingId: string) => {
    playClick();
    const timing = TIMING_OPTIONS.find(t => t.id === timingId);
    setQuoteData(prev => ({ ...prev, timing: timingId }));
    addMessage('user', timing?.name || timingId);
    
    await simulateTyping();
    addMessage('assistant', "Almost there! Please provide your contact details so I can prepare your personalized quote:");
    setCurrentStep('contact');
  };

  // Handle contact form submission
  const handleContactSubmit = async (contact: QuoteData['contact']) => {
    playStepComplete();
    setQuoteData(prev => ({ ...prev, contact }));
    addMessage('user', `${contact?.name}, ${contact?.email}, ${contact?.address}`);
    
    await simulateTyping(1200);
    addMessage('assistant', "Thanks! I've generated your personalized quote. Here's a detailed breakdown:");
    setCurrentStep('quote');
  };

  // Handle quote acceptance
  const handleAcceptQuote = async () => {
    playSuccess();
    addMessage('user', '✅ Accept & Book');
    
    await simulateTyping();
    addMessage('assistant', "Excellent! To secure your booking, we require a **20% deposit**. You can pay securely online using our encrypted payment system.\n\n🔒 *Your payment is protected by 256-bit encryption and PCI compliance.*");
    setCurrentStep('payment');
  };

  // Handle payment
  const handlePayment = async () => {
    playClick();
    setPaymentProcessing(true);
    addMessage('user', '[Processing payment...]');
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    setPaymentProcessing(false);
    setPaymentComplete(true);
    
    playCelebration();
    
    toast({
      title: "✅ Payment Processed",
      description: "Demo payment successful! In production, this would process a real payment.",
      duration: 3000,
    });
    
    await simulateTyping(500);
    addMessage('assistant', "✅ **Payment Successful!**\n\nYour booking is now confirmed. Here's what happens next:\n\n1. ✉️ Confirmation email sent\n2. 📅 Calendar invite on its way\n3. 📱 SMS reminder 24 hours before\n4. 👷 Your lead painter Marcus will call to introduce himself\n\nThank you for choosing ProPaint Professionals!");
    setCurrentStep('confirmation');
  };

  // Handle site inspection request
  const handleSiteInspectionRequest = async () => {
    playClick();
    setSiteInspectionRequested(true);
    addMessage('user', '📋 Request Site Inspection');
    
    await simulateTyping();
    addMessage('assistant', "Perfect! A site inspection ensures the most accurate quote possible.\n\n**What happens next:**\n1. 📅 Our estimator will call you within 2 hours\n2. 🏠 We'll schedule a convenient time to visit\n3. 📏 Precise measurements & surface assessment\n4. 💰 Detailed quote within 24 hours of visit\n\nPlease provide your contact details so we can arrange the inspection:");
    setCurrentStep('contact');
  };

  // Reset demo
  const resetDemo = () => {
    setMessages([]);
    setCurrentStep('welcome');
    setQuoteData({
      projectType: null,
      rooms: [],
      photos: [],
      paint: { type: null, finish: null, brand: null, color: null },
      extras: [],
      timing: null,
      contact: null,
    });
    setAnalysisProgress(0);
    setAnalysisResult(null);
    autoPlayAnalysisRef.current = null;
    setSelectedPhotos([]);
    setPaymentProcessing(false);
    setPaymentComplete(false);
    setIsAutoPlaying(false);
    setAutoPlayPaused(false);
    setHighlightedTab(null);
    setSurfacePrep(null);
    setMeasurementAdjustment(0);
    setSiteInspectionRequested(false);
    setAutoFillContact(undefined);
    setClickIndicator(null);
    setWorkAssignments([
      { id: 1, name: 'Marcus Thompson', role: 'Lead Painter', status: 'confirmed', avatar: 'MT' },
      { id: 2, name: 'Jake Williams', role: 'Painter', status: 'pending', avatar: 'JW' },
      { id: 3, name: 'QuickPrep Services', role: 'Subcontractor', status: 'pending', avatar: 'QP' },
    ]);
    toast({
      title: "Demo Reset",
      description: "Starting fresh! Try the quote flow again.",
      duration: 2000,
    });
  };

  // Auto-play demo - refs for storing data during autoplay (to avoid race conditions with React state)
  const autoPlayPhotosRef = useRef<typeof DEMO_ROOM_IMAGES>([]);
  const autoPlayAnalysisRef = useRef<AnalysisResult | null>(null);

  const startAutoPlay = async () => {
    setIsAutoPlaying(true);
    setAutoPlayPaused(false);
    
    // Reset state without using resetDemo to avoid clearing messages we're about to add
    setCurrentStep('welcome');
    setQuoteData({
      projectType: null,
      rooms: [],
      photos: [],
      paint: { type: null, finish: null, brand: null, color: null },
      extras: [],
      timing: null,
      contact: null,
    });
    setAnalysisProgress(0);
    setAnalysisResult(null);
    autoPlayAnalysisRef.current = null;
    setSelectedPhotos([]);
    setPaymentProcessing(false);
    setPaymentComplete(false);
    setSurfacePrep(null);
    setMeasurementAdjustment(0);
    setSiteInspectionRequested(false);
    setAutoFillContact(undefined);
    setClickIndicator(null);
    setHighlightedTab(null);
    setWorkAssignments([
      { id: 1, name: 'Marcus Thompson', role: 'Lead Painter', status: 'confirmed', avatar: 'MT' },
      { id: 2, name: 'Jake Williams', role: 'Painter', status: 'pending', avatar: 'JW' },
      { id: 3, name: 'QuickPrep Services', role: 'Subcontractor', status: 'pending', avatar: 'QP' },
    ]);
    
    // Add welcome message instantly for autoplay
    setMessages([{
      id: `msg-${Date.now()}-${Math.random()}`,
      role: 'assistant',
      content: "Hi! 👋 Welcome to **ProPaint Professionals**. I'm your AI quote assistant and I'll help you get an instant, accurate quote for your painting project.\n\nWhat type of painting service do you need today?",
      timestamp: new Date(),
    }]);
    setCurrentStep('project-type');
    
    // Wait for welcome message to display
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Step through the demo with proper sequencing
    const steps = [
      // Step 1: Select project type
      async () => {
        await showClickAt('[data-autoplay-target="interior-painting"]', 'Selecting Interior Painting');
        await handleProjectType('Interior Painting');
      },
      // Step 2: Select photos (just update state)
      async () => {
        await showClickAt('[data-autoplay-target="photo-1"]', 'Selecting photos');
        const photosToSelect = [DEMO_ROOM_IMAGES[0], DEMO_ROOM_IMAGES[1], DEMO_ROOM_IMAGES[3]];
        setSelectedPhotos(photosToSelect);
        autoPlayPhotosRef.current = photosToSelect;
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for UI to show selected photos
      },
      // Step 3: Click Analyze button
      async () => {
        await showClickAt('[data-autoplay-target="analyze-photos"]', 'Analyzing photos');
        // Manually trigger the photo submit with the autoplay photos
        if (autoPlayPhotosRef.current.length > 0) {
          setQuoteData(prev => ({ ...prev, photos: autoPlayPhotosRef.current }));
          addMessage('user', `[Uploaded ${autoPlayPhotosRef.current.length} photos: ${autoPlayPhotosRef.current.map(p => p.name).join(', ')}]`);
          
          await simulateTyping(500);
          addMessage('assistant', "Excellent! I've received your photos. Let me analyze them with our AI...");
          setCurrentStep('analyzing');
          
          // Simulate AI analysis
          await new Promise(resolve => {
            let progress = 0;
            const interval = setInterval(() => {
              progress += Math.random() * 15 + 5;
              if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                
                const roomBreakdown = autoPlayPhotosRef.current.map(p => ({
                  name: p.name,
                  area: p.analysis.area,
                  height: p.analysis.height,
                  condition: p.analysis.condition
                }));
                const totalArea = autoPlayPhotosRef.current.reduce((sum, p) => sum + p.analysis.area, 0);
                const avgHeight = autoPlayPhotosRef.current.reduce((sum, p) => sum + p.analysis.height, 0) / autoPlayPhotosRef.current.length;
                const prepHours = autoPlayPhotosRef.current.reduce((sum, p) => sum + p.analysis.prep, 0);
                const conditions = autoPlayPhotosRef.current.map(p => p.analysis.condition);
                const worstCondition = conditions.includes("Needs attention") ? "Needs attention" : 
                                       conditions.includes("Weathered") ? "Weathered" :
                                       conditions.includes("Fair") ? "Fair" : "Good";
                
                const result: AnalysisResult = { totalArea, avgHeight, condition: worstCondition, prepHours, roomBreakdown };
                autoPlayAnalysisRef.current = result; // Store immediately for autoplay
                setAnalysisResult(result);
                
                setTimeout(() => {
                  addMessage('assistant', `🔍 **AI Analysis Complete!**\n\nI've measured each space. Please review the measurements below and confirm they look accurate, or adjust if needed.`);
                  setCurrentStep('confirm-measurements');
                  resolve(true);
                }, 500);
              }
              setAnalysisProgress(progress);
            }, 200);
          });
        }
      },
      // Step 4: Confirm measurements
      async () => {
        await new Promise(resolve => setTimeout(resolve, 1500)); // Extra delay for state to settle
        await showClickAt('[data-autoplay-target="confirm-measurements"]', 'Confirming measurements');
        await handleConfirmMeasurements(0); // Confirm as accurate
      },
      // Step 5: Select surface prep
      async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await showClickAt('[data-autoplay-target="standard-prep"]', 'Selecting prep level');
        await handleSurfacePrepSelect('standard');
      },
      // Step 6: Paint type
      async () => {
        await new Promise(resolve => setTimeout(resolve, 800));
        await showClickAt('[data-autoplay-target="premium-washable"]', 'Selecting paint type');
        await handlePaintType('premium-washable');
        await new Promise(resolve => setTimeout(resolve, 800));
      },
      // Step 7: Paint finish
      async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
        await showClickAt('[data-autoplay-target="satin"]', 'Selecting finish');
        await handlePaintFinish('satin');
        await new Promise(resolve => setTimeout(resolve, 800));
      },
      // Step 8: Paint brand
      async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
        await showClickAt('[data-autoplay-target="dulux"]', 'Selecting brand');
        await handlePaintBrand('dulux');
        await new Promise(resolve => setTimeout(resolve, 800));
      },
      // Step 9: Color selection
      async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
        await showClickAt('[data-autoplay-target="color-2"]', 'Choosing color');
        await handleColorSelect(COLOR_SWATCHES[2]);
        await new Promise(resolve => setTimeout(resolve, 800));
      },
      // Step 10: Extras
      async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
        await showClickAt('[data-autoplay-target="extras-submit"]', 'Adding extras');
        await handleExtrasSubmit(['ceiling', 'trim']);
        await new Promise(resolve => setTimeout(resolve, 800));
      },
      // Step 11: Timing
      async () => {
        await new Promise(resolve => setTimeout(resolve, 600));
        await showClickAt('[data-autoplay-target="2weeks"]', 'Selecting timeline');
        await handleTimingSelect('2weeks');
        await new Promise(resolve => setTimeout(resolve, 800));
      },
      // Step 12: Contact details - prefill form first, then click submit
      async () => {
        const contactData = {
          name: 'Jane Smith',
          email: 'sarah.chen@email.com',
          phone: '0412 345 678',
          address: '42 Oak Street, Richmond VIC 3121',
        };
        // Prefill the form
        setAutoFillContact(contactData);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for form to populate
        await showClickAt('[data-autoplay-target="contact-submit"]', 'Submitting details');
        await handleContactSubmit(contactData);
        await new Promise(resolve => setTimeout(resolve, 800));
      },
      // Step 13: Accept quote
      async () => {
        await new Promise(resolve => setTimeout(resolve, 1500));
        await showClickAt('[data-autoplay-target="accept-quote"]', 'Accepting quote');
        await handleAcceptQuote();
      },
      // Step 14: Payment
      async () => {
        await new Promise(resolve => setTimeout(resolve, 1500));
        await showClickAt('[data-autoplay-target="pay-deposit"]', 'Processing payment');
        await handlePayment();
      },
      // Step 15: Scroll to Admin Dashboard and highlight tabs
      async () => {
        await new Promise(resolve => setTimeout(resolve, 2500)); // Wait for confirmation to fully render
        
        // Find and scroll to Admin Dashboard smoothly
        const container = demoContainerRef.current;
        if (container) {
          const adminDashboard = container.querySelector('[data-autoplay-target="admin-dashboard"]');
          if (adminDashboard) {
            // Smooth scroll the demo container to show Admin Dashboard
            adminDashboard.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start' 
            });
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 1500)); // Wait for scroll to complete
        
        // Show hint for Invoice tab with highlight animation
        setHighlightedTab('invoice');
        await showClickAt('[data-autoplay-target="invoice-tab"]', 'Click to see Invoice');
        setActivePostTab('invoice');
        await new Promise(resolve => setTimeout(resolve, 2500)); // Let user see invoice
        setHighlightedTab(null);
        
        // Show hint for Quote tab with highlight animation
        setHighlightedTab('quote');
        await showClickAt('[data-autoplay-target="quote-tab"]', 'Click to see Quote');
        setActivePostTab('quote');
        await new Promise(resolve => setTimeout(resolve, 2500)); // Let user see quote
        setHighlightedTab(null);
        
        // Return to workflow tab
        setActivePostTab('workflow');
      },
    ];
    
    for (const step of steps) {
      if (autoPlayPaused) break;
      await new Promise(resolve => setTimeout(resolve, 1500));
      await step();
    }
    
    // Cleanup
    setClickIndicator(null);
    setHighlightedTab(null);
    setIsAutoPlaying(false);
  };

  // Get step progress
  const getStepProgress = () => {
    const stepOrder: QuoteStep[] = ['welcome', 'project-type', 'rooms', 'photos', 'analyzing', 'confirm-measurements', 'surface-assessment', 'paint', 'extras', 'timing', 'contact', 'quote', 'payment', 'confirmation'];
    const currentIndex = stepOrder.indexOf(currentStep);
    return Math.round((currentIndex / (stepOrder.length - 1)) * 100);
  };

  const quote = calculateQuote();

  // Dismiss auto-play prompt on any interaction
  const handleDemoInteraction = () => {
    if (showAutoPlayPrompt) {
      setShowAutoPlayPrompt(false);
    }
  };

  const handleStartAutoPlay = () => {
    setShowAutoPlayPrompt(false);
    startAutoPlay();
  };

  // Prevent scroll events from bubbling to parent page
  const handleWheelCapture = (e: React.WheelEvent) => {
    const target = e.currentTarget;
    const scrollableParent = target.querySelector('[data-demo-scrollable]') as HTMLElement;
    
    if (scrollableParent) {
      const { scrollTop, scrollHeight, clientHeight } = scrollableParent;
      const isAtTop = scrollTop === 0 && e.deltaY < 0;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1 && e.deltaY > 0;
      
      // Only stop propagation if we're not at the scroll boundaries
      if (!isAtTop && !isAtBottom) {
        e.stopPropagation();
      }
    }
  };

  return (
    <div 
      ref={demoContainerRef}
      className="bg-gradient-to-br from-orange-50 via-amber-50/30 to-background rounded-xl overflow-visible relative overscroll-contain"
      onClick={handleDemoInteraction}
      onWheelCapture={handleWheelCapture}
    >
      {/* Finger click indicator for autoplay */}
      <AnimatePresence>
        {clickIndicator && (
          <FingerClickIndicator position={clickIndicator} label={clickIndicator.label} />
        )}
      </AnimatePresence>
      {/* Floating Autoplay Prompt Overlay */}
      <AnimatePresence>
        {showAutoPlayPrompt && !isAutoPlaying && currentStep === 'project-type' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-xl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="bg-card border border-border shadow-2xl rounded-2xl p-8 max-w-md mx-4 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Play className="h-8 w-8 text-white ml-1" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                Watch the Demo
              </h3>
              <p className="text-muted-foreground text-sm mb-6">
                See how customers get instant AI-powered painting quotes in under 2 minutes
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartAutoPlay();
                  }}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold py-6 text-base"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Start Autoplay Demo
                </Button>
                <Button
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAutoPlayPrompt(false);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  I'll explore it myself
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-500 text-white p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/20 backdrop-blur-sm flex-shrink-0 flex items-center justify-center">
              <Paintbrush className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-base sm:text-lg truncate">ProPaint Professionals</h2>
              <p className="text-orange-100 text-xs sm:text-sm truncate">Get Your Instant Quote</p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <InlineDemoSpeedControl compact className="hidden sm:flex" />
            <Button
              variant="ghost"
              size="sm"
              onClick={isAutoPlaying ? () => setAutoPlayPaused(true) : startAutoPlay}
              className="text-white hover:bg-white/20 px-2 sm:px-3"
            >
              {isAutoPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              <span className="hidden sm:inline ml-1">{isAutoPlaying ? 'Pause' : 'Auto Demo'}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetDemo}
              className="text-white hover:bg-white/20 px-2"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Main Tabs with swipe and arrows */}
        <MainTabsWithSwipe
          activeTab={activeMainTab}
          onTabChange={setActiveMainTab}
        />
        
        {/* Progress bar - only show in demo tab */}
        {activeMainTab === 'demo' && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-orange-100 mb-1">
              <span>Quote Progress</span>
              <span>{getStepProgress()}%</span>
            </div>
            <Progress value={getStepProgress()} className="h-2 bg-white/20" />
          </div>
        )}
      </div>

      {/* How It Works Tab Content */}
      {activeMainTab === 'workflow' && (
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-foreground mb-2">How TradeFlow OS Works</h3>
            <p className="text-muted-foreground text-sm">Complete workflow from quote to completion</p>
          </div>
          
          {/* Workflow Steps */}
          <div className="space-y-4">
            {[
              {
                step: 1,
                title: "Customer Requests Quote",
                description: "Customer uploads photos or requests site inspection via chat interface",
                icon: Camera,
                color: "from-orange-500 to-amber-500",
                details: ["Photo upload with AI analysis", "Site inspection scheduling", "Project type selection"]
              },
              {
                step: 2,
                title: "AI Photo Analysis",
                description: "AI measures wall area, detects surface condition, and estimates prep work",
                icon: Sparkles,
                color: "from-cyan-500 to-blue-500",
                details: ["Wall boundary detection", "Surface area calculation", "Condition assessment", "Prep time estimation"]
              },
              {
                step: 3,
                title: "Measurement Confirmation",
                description: "Customer reviews and confirms AI measurements with ability to adjust ±10%",
                icon: CheckCircle2,
                color: "from-emerald-500 to-teal-500",
                details: ["Room-by-room breakdown", "Area adjustment controls", "Confidence scoring"]
              },
              {
                step: 4,
                title: "Surface Prep Assessment",
                description: "Select preparation level based on wall condition - affects pricing and timeline",
                icon: Hammer,
                color: "from-purple-500 to-indigo-500",
                details: ["Minimal, Standard, Extensive, Full Restoration", "Price impact preview", "Labor hours estimate"]
              },
              {
                step: 5,
                title: "Paint Selection",
                description: "Choose paint type, finish, brand, and color with live price updates",
                icon: Palette,
                color: "from-pink-500 to-rose-500",
                details: ["Interior/Exterior options", "Multiple finishes", "Brand preferences", "Color swatches"]
              },
              {
                step: 6,
                title: "Instant Quote Generation",
                description: "AI generates detailed itemized quote with labor, materials, and GST breakdown",
                icon: FileText,
                color: "from-amber-500 to-orange-500",
                details: ["Itemized pricing", "GST calculation", "Deposit amount", "Valid for 7 days"]
              },
              {
                step: 7,
                title: "Online Payment",
                description: "Secure deposit payment via Stripe with instant confirmation",
                icon: CreditCard,
                color: "from-[#635BFF] to-[#8B85FF]",
                details: ["256-bit SSL encryption", "PCI DSS compliant", "Instant confirmation", "Email receipt"]
              },
              {
                step: 8,
                title: "Team Assignment",
                description: "Admin assigns painters and subcontractors, orders materials",
                icon: Users,
                color: "from-blue-500 to-indigo-500",
                details: ["Lead painter assignment", "Subcontractor booking", "Material ordering", "Schedule confirmation"]
              },
              {
                step: 9,
                title: "Invoice & Documentation",
                description: "Auto-generate invoices, quotes, and send via email",
                icon: Receipt,
                color: "from-green-500 to-emerald-500",
                details: ["Professional PDF documents", "Email delivery", "Balance tracking", "Payment reminders"]
              }
            ].map((item, idx) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex gap-4"
              >
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center shadow-lg",
                    item.color
                  )}>
                    <item.icon className="h-5 w-5 text-white" />
                  </div>
                  {idx < 8 && (
                    <div className="w-0.5 h-full bg-gradient-to-b from-border to-transparent mt-2" />
                  )}
                </div>
                <div className="flex-1 pb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px]">Step {item.step}</Badge>
                    <h4 className="font-semibold text-sm">{item.title}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {item.details.map((detail, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                        {detail}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          <Separator />
          
          <div className="text-center">
            <Button
              onClick={() => setActiveMainTab('demo')}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
            >
              <Play className="h-4 w-4 mr-2" />
              Try the Demo
            </Button>
          </div>
        </div>
      )}

      {/* Main content - Split view (Demo Tab) */}
      {activeMainTab === 'demo' && (
      <div 
        className="flex flex-col md:grid md:grid-cols-5 h-[65vh] md:min-h-[600px] md:max-h-[80vh] overflow-hidden overscroll-contain"
        data-demo-scrollable
      >
        {/* Chat Panel - Left */}
        <div className="md:col-span-3 flex flex-col border-r border-border/50 flex-1 min-h-0 overflow-hidden">
          {/* Messages - Scrollable container */}
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto overscroll-y-auto p-3 md:p-4 pb-24 md:pb-4 space-y-3 md:space-y-4 min-h-0"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <AnimatePresence initial={false} mode="sync">
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    type: "tween",
                    duration: 0.25,
                    ease: "easeOut",
                    delay: index === messages.length - 1 ? 0.05 : 0
                  }}
                  layout="position"
                  className={cn(
                    "flex",
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 will-change-transform",
                    message.role === 'user' 
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-br-md'
                      : 'bg-card border border-border shadow-sm rounded-bl-md'
                  )}>
                    <div className={cn(
                      "text-sm whitespace-pre-wrap",
                      message.role === 'assistant' && "[&_strong]:font-semibold [&_strong]:text-foreground"
                    )}>
                      {message.content.split(/(\*\*.*?\*\*)/).map((part, i) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                          return <strong key={i}>{part.slice(2, -2)}</strong>;
                        }
                        return part;
                      })}
                    </div>
                    {message.component}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing indicator */}
            <AnimatePresence>
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="flex items-center gap-2 text-muted-foreground"
                >
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs">ProPaint Assistant is typing...</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Interactive components based on step */}
            {/* Autoplay Active Indicator */}
            <AnimatePresence>
              {isAutoPlayActive && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 mb-2"
                >
                  <Play className="h-3 w-3 animate-pulse" />
                  <span>Autoplay active — pause to interact manually</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs ml-auto hover:bg-amber-100"
                    onClick={() => setAutoPlayPaused(true)}
                  >
                    <Pause className="h-3 w-3 mr-1" />
                    Pause
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence mode="wait">
              {/* Project Type Selection */}
              {currentStep === 'project-type' && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="flex flex-wrap gap-2"
                >
                  {['Interior Painting', 'Exterior Painting', 'Full House Repaint', 'Commercial/Office', 'Touch-up & Repairs'].map((type) => (
                    <Button
                      key={type}
                      variant="outline"
                      disabled={isAutoPlayActive}
                      data-autoplay-target={type === 'Interior Painting' ? 'interior-painting' : undefined}
                      className={cn(
                        "justify-start h-auto py-2.5 px-3 hover:border-orange-400 hover:bg-orange-50 whitespace-nowrap text-sm",
                        isAutoPlayActive && "opacity-50 cursor-not-allowed"
                      )}
                      onClick={() => handleProjectType(type)}
                    >
                      <Home className="h-4 w-4 mr-2 shrink-0 text-orange-500" />
                      <span className="truncate">{type}</span>
                    </Button>
                  ))}
                </motion.div>
              )}

              {/* Photo Upload */}
              {currentStep === 'photos' && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="space-y-4"
                >
                  {/* Upload zone */}
                  <div className="border-2 border-dashed border-orange-300 rounded-xl p-6 text-center bg-orange-50/50 hover:bg-orange-50 transition-colors cursor-pointer">
                    <Camera className="h-8 w-8 mx-auto text-orange-400 mb-2" />
                    <p className="text-sm font-medium text-orange-700">Take or upload photos</p>
                    <p className="text-xs text-muted-foreground mt-1">Or select demo images below</p>
                  </div>
                  
                  {/* Demo images grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {DEMO_ROOM_IMAGES.map((photo, index) => (
                      <button
                        key={photo.id}
                        onClick={() => handlePhotoSelect(photo)}
                        disabled={isAutoPlayActive}
                        data-autoplay-target={`photo-${index + 1}`}
                        className={cn(
                          "relative rounded-lg overflow-hidden aspect-video border-2 transition-all",
                          selectedPhotos.find(p => p.id === photo.id)
                            ? "border-orange-500 ring-2 ring-orange-200"
                            : "border-transparent hover:border-orange-300",
                          isAutoPlayActive && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <span className="absolute bottom-1 left-1 text-[10px] text-white font-medium">{photo.name}</span>
                        {selectedPhotos.find(p => p.id === photo.id) && (
                          <div className="absolute top-1 right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  
                  {selectedPhotos.length > 0 && (
                    <Button 
                      onClick={handlePhotosSubmit}
                      disabled={isAutoPlayActive}
                      data-autoplay-target="analyze-photos"
                      className={cn(
                        "w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600",
                        isAutoPlayActive && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Analyze {selectedPhotos.length} Photo{selectedPhotos.length > 1 ? 's' : ''} with AI
                    </Button>
                  )}

                  {/* Site Inspection Option */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-background px-2 text-muted-foreground">or</span>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline"
                    onClick={handleSiteInspectionRequest}
                    disabled={isAutoPlayActive}
                    className={cn(
                      "w-full border-blue-200 hover:border-blue-400 hover:bg-blue-50",
                      isAutoPlayActive && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <ClipboardList className="h-4 w-4 mr-2 text-blue-600" />
                    <span className="text-blue-700">Request Site Inspection</span>
                    <Badge variant="secondary" className="ml-2 text-[10px] bg-blue-100 text-blue-700">Free</Badge>
                  </Button>
                  <p className="text-[11px] text-muted-foreground text-center">
                    Prefer an in-person measurement? Our estimator will visit your property for precise quotes.
                  </p>
                </motion.div>
              )}

              {/* AI Analysis Progress */}
              {currentStep === 'analyzing' && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="space-y-4"
                >
                  <Card className="border-cyan-200 bg-gradient-to-br from-cyan-50 to-background">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
                          <Sparkles className="h-5 w-5 text-cyan-600 animate-pulse" />
                        </div>
                        <div>
                          <p className="font-medium text-cyan-900">AI Image Analysis</p>
                          <p className="text-xs text-cyan-600">Processing your photos...</p>
                        </div>
                      </div>
                      
                      <Progress value={analysisProgress} className="h-2 mb-3" />
                      
                      <div className="space-y-2 text-sm">
                        <div className={cn("flex items-center gap-2 transition-opacity", analysisProgress > 20 ? "opacity-100" : "opacity-30")}>
                          {analysisProgress > 20 ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <RefreshCw className="h-4 w-4 animate-spin text-cyan-500" />}
                          <span>Detecting wall boundaries...</span>
                        </div>
                        <div className={cn("flex items-center gap-2 transition-opacity", analysisProgress > 50 ? "opacity-100" : "opacity-30")}>
                          {analysisProgress > 50 ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <RefreshCw className="h-4 w-4 animate-spin text-cyan-500" />}
                          <span>Measuring surface area...</span>
                        </div>
                        <div className={cn("flex items-center gap-2 transition-opacity", analysisProgress > 75 ? "opacity-100" : "opacity-30")}>
                          {analysisProgress > 75 ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <RefreshCw className="h-4 w-4 animate-spin text-cyan-500" />}
                          <span>Analyzing wall condition...</span>
                        </div>
                        <div className={cn("flex items-center gap-2 transition-opacity", analysisProgress >= 100 ? "opacity-100" : "opacity-30")}>
                          {analysisProgress >= 100 ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <RefreshCw className="h-4 w-4 animate-spin text-cyan-500" />}
                          <span>Generating estimate...</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Measurement Confirmation */}
              {currentStep === 'confirm-measurements' && analysisResult && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="space-y-4"
                >
                  <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-background">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <p className="font-semibold text-emerald-900">Room Measurements</p>
                        <Badge variant="outline" className="ml-auto text-xs">94% confidence</Badge>
                      </div>
                      
                      {/* Room breakdown */}
                      <div className="space-y-2 mb-4">
                        {analysisResult.roomBreakdown.map((room, idx) => (
                          <div key={idx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 bg-white/60 rounded-lg border border-emerald-100 gap-1 sm:gap-0">
                            <div className="flex items-center gap-2">
                              <Home className="h-4 w-4 shrink-0 text-emerald-600" />
                              <span className="text-sm font-medium">{room.name}</span>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm ml-6 sm:ml-0">
                              <span className="text-muted-foreground">{room.area}m²</span>
                              <span className="text-muted-foreground">H: {room.height}m</span>
                              <Badge variant={room.condition === 'Good' ? 'default' : room.condition === 'Fair' ? 'secondary' : 'destructive'} className="text-[10px]">
                                {room.condition}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Total summary */}
                      <div className="flex items-center justify-between p-3 bg-emerald-100 rounded-lg mb-4">
                        <span className="font-semibold text-emerald-900">Total Wall Area</span>
                        <span className="text-xl font-bold text-emerald-700 tabular-nums">{analysisResult.totalArea}m²</span>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-3">
                        Do these measurements look accurate? You can adjust if needed.
                      </p>
                      
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          disabled={isAutoPlayActive}
                          data-autoplay-target="confirm-measurements"
                          className={cn(
                            "flex-1 order-1 sm:order-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white",
                            isAutoPlayActive && "opacity-50 cursor-not-allowed"
                          )}
                          onClick={() => handleConfirmMeasurements(0)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Confirm Measurements
                        </Button>
                        <div className="flex gap-2 order-2 sm:order-1">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isAutoPlayActive}
                            className={cn("flex-1 text-xs", isAutoPlayActive && "opacity-50 cursor-not-allowed")}
                            onClick={() => handleConfirmMeasurements(-10)}
                          >
                            -10%
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isAutoPlayActive}
                            className={cn("flex-1 text-xs", isAutoPlayActive && "opacity-50 cursor-not-allowed")}
                            onClick={() => handleConfirmMeasurements(10)}
                          >
                            +10%
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Surface Assessment */}
              {currentStep === 'surface-assessment' && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="space-y-3"
                >
                  <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Surface prep affects final price
                  </div>
                  {SURFACE_PREP_OPTIONS.map((prep) => (
                    <Button
                      key={prep.id}
                      variant="outline"
                      disabled={isAutoPlayActive}
                      data-autoplay-target={prep.id === 'standard' ? 'standard-prep' : undefined}
                      className={cn(
                        "w-full h-auto py-3 px-3 hover:border-orange-400 hover:bg-orange-50",
                        prep.id === 'standard' && "border-orange-300 bg-orange-50/50",
                        isAutoPlayActive && "opacity-50 cursor-not-allowed"
                      )}
                      onClick={() => handleSurfacePrepSelect(prep.id)}
                    >
                      <div className="flex items-center justify-between w-full gap-2">
                        <div className="text-left min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-medium text-sm">{prep.name}</p>
                            {prep.id === 'standard' && <Badge className="text-[10px] bg-orange-500 flex-shrink-0">Recommended</Badge>}
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">{prep.description}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-semibold text-orange-600 whitespace-nowrap">
                            {prep.multiplier < 1 ? `-${((1 - prep.multiplier) * 100).toFixed(0)}%` : 
                             prep.multiplier > 1 ? `+${((prep.multiplier - 1) * 100).toFixed(0)}%` : 
                             'Standard'}
                          </p>
                          <p className="text-[10px] text-muted-foreground whitespace-nowrap">~{prep.hours * selectedPhotos.length}h prep</p>
                        </div>
                      </div>
                    </Button>
                  ))}
                </motion.div>
              )}

              {/* Paint Selection */}
              {currentStep === 'paint' && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="space-y-4"
                >
                  {/* Paint Type */}
                  {!quoteData.paint.type && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {PAINT_TYPES.map((type) => (
                        <Button
                          key={type.id}
                          variant="outline"
                          disabled={isAutoPlayActive}
                          data-autoplay-target={type.id === 'premium-washable' ? 'premium-washable' : undefined}
                          className={cn(
                            "justify-start h-auto py-3 hover:border-orange-400 hover:bg-orange-50",
                            isAutoPlayActive && "opacity-50 cursor-not-allowed"
                          )}
                          onClick={() => handlePaintType(type.id)}
                        >
                          <Droplets className="h-4 w-4 mr-2 shrink-0 text-orange-500" />
                          <div className="text-left min-w-0">
                            <p className="font-medium text-sm truncate">{type.name}</p>
                            {type.priceMultiplier > 1 && (
                              <p className="text-[10px] text-muted-foreground">+{((type.priceMultiplier - 1) * 100).toFixed(0)}% premium</p>
                            )}
                          </div>
                        </Button>
                      ))}
                    </div>
                  )}
                  
                  {/* Paint Finish */}
                  {quoteData.paint.type && !quoteData.paint.finish && (
                    <div className="grid grid-cols-2 gap-2">
                      {PAINT_FINISHES.map((finish) => (
                        <Button
                          key={finish.id}
                          variant="outline"
                          disabled={isAutoPlayActive}
                          data-autoplay-target={finish.id}
                          className={cn(
                            "justify-start h-auto py-2.5 sm:py-3 hover:border-orange-400 hover:bg-orange-50",
                            isAutoPlayActive && "opacity-50 cursor-not-allowed"
                          )}
                          onClick={() => handlePaintFinish(finish.id)}
                        >
                          <div className="text-left min-w-0">
                            <p className="font-medium text-sm">{finish.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{finish.description}</p>
                          </div>
                        </Button>
                      ))}
                    </div>
                  )}
                  
                  {/* Paint Brand */}
                  {quoteData.paint.finish && !quoteData.paint.brand && (
                    <div className="grid grid-cols-2 gap-2">
                      {PAINT_BRANDS.map((brand) => (
                        <Button
                          key={brand.id}
                          variant="outline"
                          disabled={isAutoPlayActive}
                          data-autoplay-target={brand.id}
                          className={cn(
                            "justify-start h-auto py-3 hover:border-orange-400 hover:bg-orange-50",
                            isAutoPlayActive && "opacity-50 cursor-not-allowed"
                          )}
                          onClick={() => handlePaintBrand(brand.id)}
                        >
                          {brand.name}
                          {brand.premium && <Badge variant="secondary" className="ml-2 text-[10px]">Premium</Badge>}
                        </Button>
                      ))}
                    </div>
                  )}
                  
                  {/* Color Selection */}
                  {quoteData.paint.brand && !quoteData.paint.color && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {COLOR_SWATCHES.map((color, index) => (
                        <button
                          key={color.id}
                          onClick={() => handleColorSelect(color)}
                          disabled={isAutoPlayActive}
                          data-autoplay-target={`color-${index}`}
                          className={cn(
                            "group relative p-2 rounded-lg border hover:border-orange-400 transition-all hover:shadow-md active:scale-95",
                            isAutoPlayActive && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          <div 
                            className="w-full aspect-square rounded-md mb-1 ring-1 ring-black/10"
                            style={{ backgroundColor: color.hex }}
                          />
                          <p className="text-[9px] sm:text-[10px] text-center font-medium truncate">{color.name}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Additional Services */}
              {currentStep === 'extras' && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="space-y-3"
                >
                  <ExtrasSelector onSubmit={handleExtrasSubmit} />
                </motion.div>
              )}

              {/* Timing Selection */}
              {currentStep === 'timing' && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="space-y-2"
                >
                  {TIMING_OPTIONS.map((option) => (
                    <Button
                      key={option.id}
                      variant="outline"
                      disabled={isAutoPlayActive}
                      data-autoplay-target={option.id}
                      className={cn(
                        "w-full justify-between h-auto py-2.5 sm:py-3 hover:border-orange-400 hover:bg-orange-50",
                        isAutoPlayActive && "opacity-50 cursor-not-allowed"
                      )}
                      onClick={() => handleTimingSelect(option.id)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Timer className="h-4 w-4 shrink-0 text-orange-500" />
                        <span className="text-sm text-left">{option.name}</span>
                      </div>
                      {option.badge && (
                        <Badge variant={option.badge === 'Urgent' ? 'destructive' : 'secondary'} className="text-[10px] shrink-0 ml-2">
                          {option.badge}
                        </Badge>
                      )}
                    </Button>
                  ))}
                </motion.div>
              )}

              {/* Contact Form */}
              {currentStep === 'contact' && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <ContactForm onSubmit={handleContactSubmit} autoFillData={autoFillContact} />
                </motion.div>
              )}

              {/* Quote Display */}
              {currentStep === 'quote' && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="space-y-3"
                >
                  <Button
                    disabled={isAutoPlayActive}
                    data-autoplay-target="accept-quote"
                    className={cn(
                      "w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600",
                      isAutoPlayActive && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={handleAcceptQuote}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Accept & Book
                  </Button>
                  <div className="flex gap-2">
                    <DemoButton 
                      variant="outline" 
                      className="text-xs sm:text-sm flex-1 px-2 sm:px-3"
                      featureName="Email quote"
                    >
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span className="ml-1 sm:ml-2 truncate">Email Quote</span>
                    </DemoButton>
                    <DemoButton 
                      variant="outline" 
                      className="text-xs sm:text-sm flex-1 px-2 sm:px-3"
                      featureName="Request callback"
                    >
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <span className="ml-1 sm:ml-2 truncate">Callback</span>
                    </DemoButton>
                  </div>
                </motion.div>
              )}

              {/* Payment */}
              {currentStep === 'payment' && !paymentComplete && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <PaymentForm 
                    amount={quote.deposit} 
                    onPay={handlePayment} 
                    processing={paymentProcessing}
                  />
                </motion.div>
              )}

              {/* Confirmation */}
              {currentStep === 'confirmation' && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-background">
                    <CardContent className="p-4 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                        <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                      </div>
                      <h3 className="font-bold text-lg text-emerald-900 mb-2">Booking Confirmed!</h3>
                      <p className="text-sm text-emerald-700 mb-4">Reference: <span className="font-mono font-bold">BK-2026-0089</span></p>
                      
                      <div className="text-left space-y-2 bg-white rounded-lg p-3 border border-emerald-100">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-emerald-600" />
                          <span>Monday, 20 January 2026</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-emerald-600" />
                          <span>Estimated: 3-4 days</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-4 w-4 text-emerald-600" />
                          <span>Lead Painter: Marcus</span>
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full mt-4" 
                        variant="outline"
                        onClick={resetDemo}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restart Demo
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>
          
          {/* Mobile Quote Preview Toggle - only show after analysis */}
          {analysisResult && (
            <div className="md:hidden border-t border-border/50 bg-gradient-to-r from-orange-50 to-amber-50 p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between text-xs h-9"
                onClick={() => setShowMobileQuote(!showMobileQuote)}
              >
                <span className="flex items-center gap-2">
                  <Eye className="h-3.5 w-3.5 text-orange-600" />
                  <span className="font-medium tabular-nums">Quote: ${quote.total.toLocaleString('en-AU')}</span>
                </span>
                <ChevronRight className={cn("h-4 w-4 transition-transform", showMobileQuote && "rotate-90")} />
              </Button>
              
              <AnimatePresence>
                {showMobileQuote && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-2 space-y-2 text-xs">
                      {quote.breakdown.slice(0, 3).map((item, i) => (
                        <div key={i} className="flex justify-between">
                          <span className="text-muted-foreground truncate pr-2">{item.item}</span>
                          <span className="font-medium shrink-0 tabular-nums">${item.amount.toLocaleString()}</span>
                        </div>
                      ))}
                      {quote.breakdown.length > 3 && (
                        <p className="text-muted-foreground text-center">+{quote.breakdown.length - 3} more items</p>
                      )}
                      <Separator className="my-1" />
                      <div className="flex justify-between font-semibold text-orange-700">
                        <span>Total (inc. GST)</span>
                        <span className="tabular-nums">${quote.total.toLocaleString('en-AU')}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Quote Preview Panel - Right (hidden on mobile) */}
        <div className="hidden md:block md:col-span-2 bg-gradient-to-br from-slate-50 to-background p-4 overflow-y-auto overscroll-contain">
          <div className="sticky top-0">
            <h3 className="font-bold text-sm text-muted-foreground mb-3 flex items-center gap-2">
              <Eye className="h-4 w-4" />
              LIVE QUOTE PREVIEW
            </h3>
            
            <Card className="border-orange-200 shadow-lg">
              <CardHeader className="pb-2 bg-gradient-to-r from-orange-100 to-amber-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Quote #{quoteData.contact ? 'Q-2026-0147' : '------'}</CardTitle>
                  <Badge variant="outline" className="text-[10px]">
                    {currentStep === 'confirmation' ? 'Booked' : currentStep === 'quote' ? 'Ready' : 'Draft'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* Customer info */}
                {quoteData.contact && (
                  <div className="text-sm">
                    <p className="font-medium">{quoteData.contact.name}</p>
                    <p className="text-muted-foreground text-xs">{quoteData.contact.address}</p>
                  </div>
                )}
                
                {/* Project summary */}
                <div className="space-y-2">
                  {quoteData.projectType && (
                    <div className="flex items-center gap-2 text-sm">
                      <Home className="h-3 w-3 text-orange-500" />
                      <span>{quoteData.projectType}</span>
                    </div>
                  )}
                  {quoteData.photos.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Image className="h-3 w-3 text-orange-500" />
                      <span>{quoteData.photos.length} room{quoteData.photos.length > 1 ? 's' : ''}</span>
                    </div>
                  )}
                  {quoteData.paint.color && (
                    <div className="flex items-center gap-2 text-sm">
                      <Palette className="h-3 w-3 text-orange-500" />
                      <div 
                        className="w-4 h-4 rounded ring-1 ring-black/10"
                        style={{ backgroundColor: quoteData.paint.color.hex }}
                      />
                      <span>{quoteData.paint.color.name}</span>
                    </div>
                  )}
                </div>
                
                <Separator />
                
                {/* Breakdown */}
                {analysisResult && quote.breakdown.length > 0 && (
                  <div className="space-y-2">
                      {quote.breakdown.map((item, i) => (
                        <div
                          key={i}
                          className="flex justify-between text-xs"
                        >
                          <span className="text-muted-foreground">{item.item}</span>
                          <span className="font-medium">${item.amount.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                    
                    <Separator className="my-2" />
                    
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>${quote.subtotal.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">GST (10%)</span>
                      <span>${quote.gst.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</span>
                    </div>
                    
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>TOTAL</span>
                      <span className="text-orange-600">${quote.total.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</span>
                    </div>
                    
                    {currentStep === 'payment' && (
                      <div className="bg-amber-50 rounded-lg p-3 mt-2 border border-amber-200">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">Deposit (25%)</span>
                          <span className="font-bold text-amber-700">${quote.deposit.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Balance due on completion</span>
                          <span>${(quote.total - quote.deposit).toLocaleString('en-AU', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-amber-200">
                          <svg className="h-4 w-auto" viewBox="0 0 60 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M59.64 14.28C59.64 8.59 56.75 5.12 52.64 5.12C48.51 5.12 45.17 8.59 45.17 14.28C45.17 20.99 49.06 23.52 54.07 23.52C56.54 23.52 58.4 22.98 59.79 22.21V18.29C58.4 19.01 56.83 19.44 54.85 19.44C52.89 19.44 51.17 18.74 50.97 16.29H59.57C59.57 16.01 59.64 14.87 59.64 14.28ZM50.9 12.78C50.9 10.44 52.27 9.49 53.55 9.49C54.8 9.49 56.1 10.44 56.1 12.78H50.9Z" fill="#635BFF"/>
                            <path d="M39.08 5.12C37.08 5.12 35.76 6.05 35.04 6.7L34.77 5.42H30.63V28L35.27 27.01L35.28 21.88C36.02 22.41 37.1 23.16 38.97 23.16C42.77 23.16 46.22 20.1 46.22 13.94C46.21 8.32 42.72 5.12 39.08 5.12ZM37.92 19.22C36.67 19.22 35.93 18.77 35.44 18.22L35.42 10.31C35.95 9.7 36.7 9.27 37.92 9.27C39.89 9.27 41.25 11.43 41.25 14.23C41.25 17.1 39.91 19.22 37.92 19.22Z" fill="#635BFF"/>
                            <path d="M25.44 4.22L30.09 3.22V-0.610001L25.44 0.379999V4.22Z" fill="#635BFF"/>
                            <path d="M30.09 5.42H25.44V22.87H30.09V5.42Z" fill="#635BFF"/>
                            <path d="M21.13 6.93L20.82 5.42H16.74V22.87H21.39V10.65C22.4 9.32 24.17 9.56 24.76 9.76V5.42C24.15 5.2 22.13 4.79 21.13 6.93Z" fill="#635BFF"/>
                            <path d="M12.12 1.77L7.58 2.76L7.56 18.54C7.56 21.25 9.59 23.16 12.3 23.16C13.79 23.16 14.88 22.89 15.49 22.55V18.72C14.9 18.97 12.1 19.79 12.1 17.08V9.51H15.49V5.42H12.1L12.12 1.77Z" fill="#635BFF"/>
                            <path d="M2.73 10.38C2.73 9.56 3.4 9.24 4.52 9.24C6.11 9.24 8.12 9.72 9.71 10.59V5.94C7.98 5.24 6.27 4.97 4.52 4.97C1.81 4.97 0 6.53 0 8.99C0 12.85 5.33 12.22 5.33 13.91C5.33 14.88 4.5 15.2 3.32 15.2C1.6 15.2 -0.62 14.5 -2.37 13.51V18.23C-0.42 19.09 1.49 19.44 3.32 19.44C6.1 19.44 8.02 17.93 8.02 15.44C8.01 11.27 2.73 12.02 2.73 10.38Z" fill="#635BFF"/>
                          </svg>
                          <span className="text-[9px] text-muted-foreground">Pay via Stripe</span>
                        </div>
                      </div>
                    )}
                    
                    {paymentComplete && (
                      <div className="bg-emerald-50 rounded-lg p-3 mt-2 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <div>
                          <p className="font-medium text-sm text-emerald-900">Deposit Paid</p>
                          <p className="text-xs text-emerald-700">${quote.deposit.toFixed(2)} received</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {!analysisResult && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Your quote will appear here as you provide details</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Trust badges */}
            <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                <span>Insured</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span>4.9 Rating</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>Licensed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Post-Booking Workflow Section - Shows after confirmation */}
      {activeMainTab === 'demo' && currentStep === 'confirmation' && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 border-t border-border pt-6"
        >
          <div className="px-4 pb-4" data-autoplay-target="admin-dashboard">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Admin Dashboard</h3>
                <p className="text-sm text-muted-foreground">Manage work distribution, invoicing & documents</p>
              </div>
            </div>

            <Tabs value={activePostTab} onValueChange={(v) => setActivePostTab(v as typeof activePostTab)} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4 relative">
                <TabsTrigger 
                  value="workflow" 
                  className="flex items-center gap-2 relative" 
                  data-autoplay-target="workflow-tab"
                >
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Team</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="invoice" 
                  className={`flex items-center gap-2 relative transition-all duration-300 ${
                    highlightedTab === 'invoice' 
                      ? 'ring-2 ring-amber-500 ring-offset-2 bg-amber-50 dark:bg-amber-900/20 scale-105 shadow-lg' 
                      : ''
                  }`}
                  data-autoplay-target="invoice-tab"
                >
                  {highlightedTab === 'invoice' && (
                    <motion.span
                      className="absolute inset-0 rounded-md bg-amber-400/20"
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  )}
                  <Receipt className="h-4 w-4 relative z-10" />
                  <span className="hidden sm:inline relative z-10">Invoice</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="quote" 
                  className={`flex items-center gap-2 relative transition-all duration-300 ${
                    highlightedTab === 'quote' 
                      ? 'ring-2 ring-orange-500 ring-offset-2 bg-orange-50 dark:bg-orange-900/20 scale-105 shadow-lg' 
                      : ''
                  }`}
                  data-autoplay-target="quote-tab"
                >
                  {highlightedTab === 'quote' && (
                    <motion.span
                      className="absolute inset-0 rounded-md bg-orange-400/20"
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  )}
                  <FileText className="h-4 w-4 relative z-10" />
                  <span className="hidden sm:inline relative z-10">Quote</span>
                </TabsTrigger>
              </TabsList>

              {/* Work Distribution Tab */}
              <TabsContent value="workflow" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <HardHat className="h-5 w-5 text-blue-600" />
                        Work Assignment
                      </CardTitle>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">Job #BK-2026-0089</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="bg-slate-50 rounded-lg p-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <MapPin className="h-3 w-3" />
                        <span>{quoteData.contact?.address || '42 Oak Street, Richmond VIC 3121'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Mon 20 Jan - Thu 23 Jan 2026</span>
                      </div>
                    </div>

                    <Separator />

                    <p className="text-sm font-medium text-muted-foreground">Assigned Team</p>
                    
                    {workAssignments.map((worker) => (
                      <div 
                        key={worker.id}
                        className="flex items-center justify-between gap-2 p-3 rounded-lg border bg-card"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold",
                            worker.role === 'Subcontractor' 
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          )}>
                            {worker.avatar}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{worker.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{worker.role}</p>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {worker.status === 'confirmed' ? (
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 whitespace-nowrap">
                              <Check className="h-3 w-3 mr-1" />
                              Confirmed
                            </Badge>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="h-8 text-xs hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                              onClick={() => {
                                setWorkAssignments(prev => 
                                  prev.map(w => w.id === worker.id ? { ...w, status: 'confirmed' } : w)
                                );
                                toast({
                                  title: "✅ Team Member Confirmed",
                                  description: `${worker.name} has been confirmed for this job.`,
                                  duration: 2000,
                                });
                              }}
                            >
                              Confirm
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}

                    <div className="pt-2">
                      <DemoButton 
                        className="w-full" 
                        variant="outline"
                        featureName="Materials ordering"
                      >
                        <Truck className="h-4 w-4 mr-2" />
                        Order Materials
                      </DemoButton>
                    </div>

                    {workAssignments.every(w => w.status === 'confirmed') && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-3"
                      >
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <div>
                          <p className="font-medium text-sm text-emerald-900">All Team Confirmed!</p>
                          <p className="text-xs text-emerald-700">Job is ready to commence on schedule</p>
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Invoice Tab */}
              <TabsContent value="invoice" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Receipt className="h-5 w-5 text-amber-600" />
                        Invoice Preview
                      </CardTitle>
                      <Badge variant="outline" className="bg-amber-50 text-amber-700">INV-2026-0089</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Invoice Header */}
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                            <Paintbrush className="h-4 w-4 text-white" />
                          </div>
                          <span className="font-bold">ProPaint Professionals</span>
                        </div>
                        <p className="text-xs text-muted-foreground">ABN: 12 345 678 901</p>
                        <p className="text-xs text-muted-foreground">hello@propaint.com.au</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Invoice Date</p>
                        <p className="font-medium text-sm">4 January 2026</p>
                        <p className="text-xs text-muted-foreground mt-2">Due Date</p>
                        <p className="font-medium text-sm">24 January 2026</p>
                      </div>
                    </div>

                    <Separator />

                    {/* Bill To */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Bill To</p>
                      <p className="font-medium text-sm">{quoteData.contact?.name || 'Jane Smith'}</p>
                      <p className="text-xs text-muted-foreground">{quoteData.contact?.address || '42 Oak Street, Richmond VIC 3121'}</p>
                      <p className="text-xs text-muted-foreground">{quoteData.contact?.email || 'sarah.chen@email.com'}</p>
                    </div>

                    <Separator />

                    {/* Line Items */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground pb-1 border-b">
                        <span>Description</span>
                        <span>Amount</span>
                      </div>
                      {quote.breakdown.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{item.item}</span>
                          <span>${item.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    {/* Totals */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>${quote.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">GST (10%)</span>
                        <span>${quote.gst.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold pt-2 border-t">
                        <span>Total Due</span>
                        <span className="text-orange-600">${quote.total.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-sm text-emerald-600">
                        <span>Deposit Paid</span>
                        <span>-${quote.deposit.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold text-orange-600 pt-2">
                        <span>Balance Due</span>
                        <span>${(quote.total - quote.deposit).toLocaleString('en-AU', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>

                    {/* Email Preview */}
                    <div className="bg-slate-50 rounded-lg p-4 mt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Mail className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-sm">Email Preview</span>
                      </div>
                      <div className="bg-white rounded-lg border p-3 text-xs">
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b">
                          <span className="text-muted-foreground">To:</span>
                          <span>{quoteData.contact?.email || 'sarah.chen@email.com'}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                          <span className="text-muted-foreground">Subject:</span>
                          <span className="font-medium">Invoice INV-2026-0089 from ProPaint Professionals</span>
                        </div>
                        <div className="space-y-2 text-muted-foreground">
                          <p>Hi {quoteData.contact?.name?.split(' ')[0] || 'Sarah'},</p>
                          <p>Thank you for choosing ProPaint Professionals! Please find attached your invoice for the painting services at {quoteData.contact?.address || '42 Oak Street'}.</p>
                          <p><strong className="text-foreground">Amount Due: ${(quote.total - quote.deposit).toLocaleString('en-AU', { minimumFractionDigits: 2 })}</strong></p>
                          <p>Payment is due upon completion of work.</p>
                          <p className="pt-2">Thanks,<br/>The ProPaint Team</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <DemoButton 
                        className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
                        variant="default"
                        featureName="Send invoice via email"
                      >
                        <SendIcon className="h-4 w-4 mr-2" />
                        Send Invoice
                      </DemoButton>
                      <DemoButton 
                        variant="outline"
                        size="icon"
                        featureName="Download invoice PDF"
                        showDemoBadge={false}
                      >
                        <Download className="h-4 w-4" />
                      </DemoButton>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Quote Preview Tab */}
              <TabsContent value="quote" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3 bg-gradient-to-r from-orange-50 to-amber-50">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-5 w-5 text-orange-600" />
                        Quote Document
                      </CardTitle>
                      <Badge className="bg-emerald-100 text-emerald-700">Accepted</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    {/* Quote Header */}
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                            <Paintbrush className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <span className="font-bold">ProPaint Professionals</span>
                            <p className="text-xs text-muted-foreground">Quality Painting Services</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">QUOTE</p>
                        <p className="font-mono text-orange-600">Q-2026-0147</p>
                      </div>
                    </div>

                    <Separator />

                    {/* Client Details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Prepared For</p>
                        <p className="font-medium text-sm">{quoteData.contact?.name || 'Jane Smith'}</p>
                        <p className="text-xs text-muted-foreground">{quoteData.contact?.address || '42 Oak Street, Richmond VIC 3121'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground mb-1">Quote Date</p>
                        <p className="font-medium text-sm">4 January 2026</p>
                        <p className="text-xs text-muted-foreground mt-2">Valid Until</p>
                        <p className="font-medium text-sm">11 January 2026</p>
                      </div>
                    </div>

                    <Separator />

                    {/* Project Scope */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Project Scope</p>
                      <div className="bg-orange-50 rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Home className="h-4 w-4 text-orange-600" />
                          <span className="font-medium">{quoteData.projectType || 'Interior Painting'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Image className="h-4 w-4 text-orange-600" />
                          <span>{quoteData.photos.length || 3} room{(quoteData.photos.length || 3) > 1 ? 's' : ''} - {analysisResult?.totalArea || 101}m² total</span>
                        </div>
                        {quoteData.paint.color && (
                          <div className="flex items-center gap-2 text-sm">
                            <Palette className="h-4 w-4 text-orange-600" />
                            <div 
                              className="w-4 h-4 rounded ring-1 ring-black/10"
                              style={{ backgroundColor: quoteData.paint.color.hex }}
                            />
                            <span>{quoteData.paint.color.name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pricing Table */}
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-slate-100 px-3 py-2 text-xs font-medium text-muted-foreground grid grid-cols-2">
                        <span>Item</span>
                        <span className="text-right">Amount</span>
                      </div>
                      <div className="divide-y">
                        {quote.breakdown.map((item, i) => (
                          <div key={i} className="px-3 py-2 grid grid-cols-2 text-sm">
                            <span className="text-muted-foreground">{item.item}</span>
                            <span className="text-right">${item.amount.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</span>
                          </div>
                        ))}
                      </div>
                      <div className="bg-slate-50 px-3 py-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>${quote.subtotal.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">GST (10%)</span>
                          <span>${quote.gst.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold pt-2 mt-2 border-t">
                          <span>Total</span>
                          <span className="text-orange-600">${quote.total.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Acceptance */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                        <div>
                          <p className="font-medium text-sm text-emerald-900">Quote Accepted</p>
                          <p className="text-xs text-emerald-700">Accepted on 4 January 2026 at 2:34 PM</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <DemoButton 
                        variant="outline" 
                        className="flex-1 min-w-[140px]"
                        featureName="Download quote as PDF"
                      >
                        <Download className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">Download PDF</span>
                      </DemoButton>
                      <div className="flex gap-2 flex-shrink-0">
                        <DemoButton 
                          variant="outline"
                          size="icon"
                          featureName="Print quote"
                          showDemoBadge={false}
                          className="flex-shrink-0"
                        >
                          <Printer className="h-4 w-4" />
                        </DemoButton>
                        <DemoButton 
                          variant="outline"
                          size="icon"
                          featureName="Share quote link"
                          showDemoBadge={false}
                          className="flex-shrink-0"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </DemoButton>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Extras Selector Component
function ExtrasSelector({ onSubmit }: { onSubmit: (extras: string[]) => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  
  const toggleExtra = (id: string) => {
    setSelected(prev => 
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };
  
  return (
    <div className="space-y-3">
      {ADDITIONAL_SERVICES.map((service) => (
        <button
          key={service.id}
          onClick={() => toggleExtra(service.id)}
          className={cn(
            "w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left",
            selected.includes(service.id)
              ? "border-orange-400 bg-orange-50"
              : "border-border hover:border-orange-300"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-5 h-5 rounded border flex items-center justify-center transition-colors",
              selected.includes(service.id)
                ? "bg-orange-500 border-orange-500"
                : "border-muted-foreground/30"
            )}>
              {selected.includes(service.id) && <Check className="h-3 w-3 text-white" />}
            </div>
            <span className="text-sm font-medium">{service.name}</span>
          </div>
          <span className="text-sm text-muted-foreground">${service.price} {service.unit}</span>
        </button>
      ))}
      
      <Button 
        onClick={() => onSubmit(selected)}
        data-autoplay-target="extras-submit"
        className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
      >
        Continue
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}

// Contact Form Component
function ContactForm({ onSubmit, autoFillData }: { onSubmit: (contact: QuoteData['contact']) => void; autoFillData?: { name: string; email: string; phone: string; address: string } }) {
  const [form, setForm] = useState({
    name: autoFillData?.name || '',
    email: autoFillData?.email || '',
    phone: autoFillData?.phone || '',
    address: autoFillData?.address || '',
  });
  
  // Update form when autoFillData changes
  useEffect(() => {
    if (autoFillData) {
      setForm(autoFillData);
    }
  }, [autoFillData]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name && form.email && form.phone && form.address) {
      onSubmit(form);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Your name"
          value={form.name}
          onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
          className="pl-10"
        />
      </div>
      <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="email"
          placeholder="Email address"
          value={form.email}
          onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
          className="pl-10"
        />
      </div>
      <div className="relative">
        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Phone number"
          value={form.phone}
          onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
          className="pl-10"
        />
      </div>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Property address"
          value={form.address}
          onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))}
          className="pl-10"
        />
      </div>
      
      <Button 
        type="submit"
        disabled={!form.name || !form.email || !form.phone || !form.address}
        data-autoplay-target="contact-submit"
        className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
      >
        Generate My Quote
        <Sparkles className="h-4 w-4 ml-2" />
      </Button>
    </form>
  );
}

// Payment Form Component
function PaymentForm({ amount, onPay, processing }: { amount: number; onPay: () => void; processing: boolean }) {
  return (
    <Card className="border-amber-200">
      <CardContent className="p-4">
        {/* Stripe Header */}
        <div className="flex items-start justify-between mb-4 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm sm:text-base truncate">Secure Deposit Payment</p>
              <p className="text-lg sm:text-2xl font-bold text-amber-600">${amount.toLocaleString('en-AU', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
          {/* Stripe Logo */}
          <div className="flex flex-col items-end flex-shrink-0">
            <img src={stripeLogo} alt="Stripe" className="h-8 sm:h-10 w-auto rounded" />
            <span className="text-[9px] text-muted-foreground mt-0.5">Secure payments</span>
          </div>
        </div>
        
        <div className="space-y-3 mb-4">
          <div className="relative">
            <Input placeholder="Card number" defaultValue="4242 4242 4242 4242" className="pr-20" />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
              <div className="w-7 h-5 bg-[#1A1F71] rounded flex items-center justify-center">
                <span className="text-white text-[8px] font-bold italic">VISA</span>
              </div>
              <div className="w-7 h-5 bg-gradient-to-r from-[#EB001B] to-[#F79E1B] rounded flex items-center justify-center">
                <div className="w-3 h-3 bg-[#EB001B] rounded-full opacity-80"></div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="MM/YY" defaultValue="12/27" />
            <Input placeholder="CVV" defaultValue="123" type="password" />
          </div>
        </div>
        
        <Button 
          onClick={onPay}
          disabled={processing}
          data-autoplay-target="pay-deposit"
          className="w-full bg-gradient-to-r from-[#635BFF] to-[#8B85FF] hover:from-[#5851DB] hover:to-[#7B75FF] text-white"
        >
          {processing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" />
              Pay ${amount.toLocaleString('en-AU', { minimumFractionDigits: 2 })} Securely
            </>
          )}
        </Button>
        
        <div className="flex items-center justify-center gap-3 mt-3 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            <span>256-bit SSL</span>
          </div>
          <span>•</span>
          <span>PCI DSS Compliant</span>
          <span>•</span>
          <span>Powered by Stripe</span>
        </div>
      </CardContent>
    </Card>
  );
}
