import { useState, useEffect, useRef, useCallback } from "react";
import { useDemoSpeed } from "@/contexts/DemoSpeedContext";
import demoFloorLiving from "@/assets/demo-floor-living.jpg";
import demoFloorHallway from "@/assets/demo-floor-hallway.jpg";
import demoFloorBedroom from "@/assets/demo-floor-bedroom.jpg";
import demoFloorDining from "@/assets/demo-floor-dining.jpg";
import { InlineDemoSpeedControl } from "@/components/demos/shared/InlineDemoSpeedControl";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import {
  TreePine, Send, Camera, Upload, Check, X, Calendar, Clock,
  ChevronRight, ChevronLeft, CreditCard, MapPin, Phone, Mail, User,
  Sparkles, CheckCircle2, ArrowRight, MessageSquare, Image,
  Ruler, Droplets, Palette, Shield, Star, FileText, Eye,
  Play, RotateCcw, Receipt, Download, Home, Hammer, Package,
  ListChecks, AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useChatContext } from "@/contexts/ChatContext";
import { FingerClickIndicator, DemoButton } from "./shared";

// ── Types ────────────────────────────────────────
type DemoStep =
  | "welcome"
  | "service-select"
  | "photo-upload"
  | "photo-uploading"
  | "ai-analyzing"
  | "measurements"
  | "coating-select"
  | "extras"
  | "quote-summary"
  | "booking"
  | "confirmation";

interface SimulatedPhoto {
  id: string;
  name: string;
  size: string;
  room: string;
  image: string;
  uploadProgress: number;
  status: "queued" | "uploading" | "uploaded" | "analyzing" | "measured";
  refObject?: string;
  detectedScale?: string;
  measuredArea?: number;
}

interface ChatMessage {
  id: string;
  role: "assistant" | "user" | "system";
  content: string;
  timestamp: Date;
}

interface RoomMeasurement {
  name: string;
  area: number;
  condition: string;
}

// ── Service Data ────────────────────────────────
const SERVICES = [
  { id: "sanding_polish_water", label: "Sanding & Polish (Water-based)", rate: 65, icon: Droplets, desc: "Low-odour, fast-drying, natural look" },
  { id: "sanding_polish_oil", label: "Sanding & Polish (Oil-based)", rate: 75, icon: Palette, desc: "Rich, warm finish, enhanced grain" },
  { id: "engineered_install", label: "Engineered Timber Install", rate: 110, icon: Package, desc: "Professional floating/glue-down install" },
  { id: "stair_sanding", label: "Stair Sanding & Refinish", rate: 125, icon: Home, desc: "Specialised stair restoration" },
  { id: "floor_repairs", label: "Floor Repairs", rate: 85, icon: Hammer, desc: "Board replacement, gap filling" },
];

const COATINGS = [
  { id: "water_satin", label: "Water-Based Satin", desc: "Most popular — natural look, low odour", popular: true },
  { id: "water_gloss", label: "Water-Based Gloss", desc: "High shine, modern feel" },
  { id: "oil_natural", label: "Oil-Based Natural", desc: "Deep warmth, enhanced grain" },
  { id: "oil_stain", label: "Oil-Based + Stain", desc: "Custom colour matching available" },
];

const EXTRAS = [
  { id: "furniture_move", label: "Furniture Moving", price: 250, desc: "We move & protect your furniture" },
  { id: "gap_fill", label: "Full Gap Filling", price: 15, unit: "/m²", desc: "Timber dust resin fill all gaps" },
  { id: "stair_nosing", label: "Stair Nosing Replacement", price: 45, unit: "/step", desc: "New hardwood nosings" },
  { id: "subfloor_repair", label: "Subfloor Repairs", price: 350, desc: "Fix squeaks & structural issues" },
];

// ── Simulated AI Analysis ────────────────────────
const MOCK_ROOMS: RoomMeasurement[] = [
  { name: "Living Room", area: 28, condition: "Good — light scratches" },
  { name: "Hallway", area: 12, condition: "Fair — moderate wear" },
  { name: "Master Bedroom", area: 16, condition: "Good — minor scuffing" },
  { name: "Kitchen/Dining", area: 22, condition: "Fair — water stains near sink" },
];

// ── Component ────────────────────────────────────
export default function TimberFlooringQuoteDemo() {
  const { speedMultiplier } = useDemoSpeed();
  const { openBooking } = useChatContext();
  const delay = useCallback((ms: number) => new Promise(r => setTimeout(r, ms * speedMultiplier)), [speedMultiplier]);

  const [step, setStep] = useState<DemoStep>("welcome");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedCoating, setSelectedCoating] = useState<string | null>(null);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [rooms, setRooms] = useState<RoomMeasurement[]>([]);
  const [showQuote, setShowQuote] = useState(false);
  const [photos, setPhotos] = useState<SimulatedPhoto[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const totalArea = rooms.reduce((s, r) => s + r.area, 0);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = useCallback((role: ChatMessage["role"], content: string) => {
    setMessages(prev => [...prev, {
      id: `${Date.now()}-${Math.random()}`,
      role,
      content,
      timestamp: new Date(),
    }]);
  }, []);

  // ── Step Handlers ──────────────────────────────
  const startDemo = useCallback(async () => {
    setStep("service-select");
    await delay(300);
    addMessage("assistant", "👋 Welcome to **AlfredFloors AI Quote Assistant**!\n\nI'll help you get an instant quote for your timber flooring project. What service do you need?");
  }, [delay, addMessage]);

  const selectService = useCallback(async (serviceId: string) => {
    const svc = SERVICES.find(s => s.id === serviceId);
    if (!svc) return;
    setSelectedService(serviceId);
    addMessage("user", svc.label);
    setStep("photo-upload");
    await delay(500);
    addMessage("assistant", `Great choice! **${svc.label}** selected.\n\nNow upload photos of your floors so our AI can measure the area and assess the condition. 📸`);
  }, [delay, addMessage]);

  const SIMULATED_PHOTOS: Omit<SimulatedPhoto, "uploadProgress" | "status">[] = [
    { id: "p1", name: "IMG_2847.jpg", size: "4.2 MB", room: "Living Room", image: demoFloorLiving, refObject: "Standard doorway (820mm)", detectedScale: "1px = 2.3mm", measuredArea: 28 },
    { id: "p2", name: "IMG_2848.jpg", size: "3.8 MB", room: "Hallway", image: demoFloorHallway, refObject: "A4 sheet on floor (297mm)", detectedScale: "1px = 1.8mm", measuredArea: 12 },
    { id: "p3", name: "IMG_2849.jpg", size: "5.1 MB", room: "Master Bedroom", image: demoFloorBedroom, refObject: "Standard doorway (820mm)", detectedScale: "1px = 2.1mm", measuredArea: 16 },
    { id: "p4", name: "IMG_2850.jpg", size: "4.6 MB", room: "Kitchen/Dining", image: demoFloorDining, refObject: "Benchtop depth (600mm)", detectedScale: "1px = 1.9mm", measuredArea: 22 },
  ];

  const simulatePhotoUpload = useCallback(async () => {
    // Initialize photos as queued
    const initialPhotos: SimulatedPhoto[] = SIMULATED_PHOTOS.map(p => ({
      ...p,
      uploadProgress: 0,
      status: "queued" as const,
    }));
    setPhotos(initialPhotos);
    setStep("photo-uploading");
    addMessage("user", "📷 __PHOTOS_ATTACHED__");

    // Upload photos one by one with progress animation
    for (let photoIdx = 0; photoIdx < initialPhotos.length; photoIdx++) {
      const photoId = initialPhotos[photoIdx].id;

      // Set status to uploading
      setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, status: "uploading" as const } : p));

      // Animate upload progress
      for (let prog = 0; prog <= 100; prog += 8) {
        setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, uploadProgress: Math.min(prog, 100) } : p));
        await delay(40);
      }

      // Mark as uploaded
      setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, status: "uploaded" as const, uploadProgress: 100 } : p));
      await delay(200);

      // Start analyzing — detect reference object and measure
      setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, status: "analyzing" as const } : p));
      await delay(600);

      // Complete measurement
      setPhotos(prev => prev.map(p => p.id === photoId ? { ...p, status: "measured" as const } : p));
      await delay(300);
    }

    addMessage("assistant", "✅ **All 4 photos uploaded & pre-measured!**\n\nI detected reference objects in each photo to calibrate real-world dimensions. Now running full AI analysis...");
    await delay(400);

    // Transition to deep analysis
    setStep("ai-analyzing");
    addMessage("assistant", "Running deep analysis — timber type, condition assessment, and final area calculations... 🔍");

    for (let i = 0; i <= 100; i += 5) {
      setAnalysisProgress(i);
      await delay(80);
    }

    setRooms(MOCK_ROOMS);
    setStep("measurements");
    await delay(300);

    const total = MOCK_ROOMS.reduce((s, r) => s + r.area, 0);
    addMessage("assistant", `✅ **AI Analysis Complete!**\n\n🏠 **${MOCK_ROOMS.length} rooms** detected\n📐 **${total}m² total area**\n🪵 **Spotted Gum** hardwood identified\n\nPlease confirm the measurements below, then we'll select your finish.`);
  }, [delay, addMessage]);

  const confirmMeasurements = useCallback(async () => {
    addMessage("user", `Confirmed ${totalArea}m² across ${rooms.length} rooms`);
    setStep("coating-select");
    await delay(400);
    addMessage("assistant", "Perfect! Now choose your preferred coating finish. Each option offers a different look and durability level. 🎨");
  }, [delay, addMessage, totalArea, rooms.length]);

  const selectCoating = useCallback(async (coatingId: string) => {
    const coating = COATINGS.find(c => c.id === coatingId);
    if (!coating) return;
    setSelectedCoating(coatingId);
    addMessage("user", coating.label);
    setStep("extras");
    await delay(400);
    addMessage("assistant", `**${coating.label}** — excellent choice!\n\nWould you like to add any extras to your project? These are optional but recommended for the best result.`);
  }, [delay, addMessage]);

  const toggleExtra = useCallback((extraId: string) => {
    setSelectedExtras(prev =>
      prev.includes(extraId) ? prev.filter(e => e !== extraId) : [...prev, extraId]
    );
  }, []);

  const confirmExtras = useCallback(async () => {
    const extraLabels = selectedExtras.map(id => EXTRAS.find(e => e.id === id)?.label).filter(Boolean);
    addMessage("user", extraLabels.length ? `Added: ${extraLabels.join(", ")}` : "No extras needed");
    setStep("quote-summary");
    await delay(600);

    // Calculate quote
    const svc = SERVICES.find(s => s.id === selectedService);
    const rate = svc?.rate || 65;
    const labourTotal = totalArea * rate;
    const materialsTotal = Math.round(totalArea * 12);
    const prepTotal = Math.round(totalArea * 8);
    const dumpFee = totalArea > 60 ? 350 : 150;
    let extrasTotal = 0;
    selectedExtras.forEach(id => {
      const ext = EXTRAS.find(e => e.id === id);
      if (ext) {
        if (ext.unit === "/m²") extrasTotal += ext.price * totalArea;
        else if (ext.unit === "/step") extrasTotal += ext.price * 12; // assume 12 steps
        else extrasTotal += ext.price;
      }
    });
    const subtotal = labourTotal + materialsTotal + prepTotal + dumpFee + extrasTotal;
    const gst = Math.round(subtotal * 0.1);
    const total = subtotal + gst;

    addMessage("assistant", `🎉 **Your AI-Generated Quote is Ready!**\n\n💰 **Total: $${total.toLocaleString()} (inc. GST)**\n📐 ${totalArea}m² of ${svc?.label}\n⏱️ Estimated 3–5 working days\n\nReview the detailed breakdown below, then book your preferred date!`);
    setShowQuote(true);
  }, [delay, addMessage, selectedService, selectedExtras, totalArea]);

  const bookJob = useCallback(async () => {
    addMessage("user", "Book for next Tuesday");
    setStep("booking");
    await delay(800);
    addMessage("assistant", "📅 **Booking Confirmed!**\n\n✅ **Next Tuesday** at 7:30 AM\n👷 Team of 2 assigned\n📧 Confirmation sent to your email\n💳 10% deposit secured via Stripe\n\nWe'll send a reminder SMS the day before. See you then! 🏠");
    setStep("confirmation");
  }, [delay, addMessage]);

  const resetDemo = useCallback(() => {
    setStep("welcome");
    setMessages([]);
    setSelectedService(null);
    setSelectedCoating(null);
    setSelectedExtras([]);
    setAnalysisProgress(0);
    setRooms([]);
    setShowQuote(false);
    setPhotos([]);
  }, []);

  // ── Quote Calculation ──────────────────────────
  const svc = SERVICES.find(s => s.id === selectedService);
  const rate = svc?.rate || 65;
  const labourTotal = totalArea * rate;
  const materialsTotal = Math.round(totalArea * 12);
  const prepTotal = Math.round(totalArea * 8);
  const dumpFee = totalArea > 60 ? 350 : 150;
  let extrasTotal = 0;
  selectedExtras.forEach(id => {
    const ext = EXTRAS.find(e => e.id === id);
    if (ext) {
      if (ext.unit === "/m²") extrasTotal += ext.price * totalArea;
      else if (ext.unit === "/step") extrasTotal += ext.price * 12;
      else extrasTotal += ext.price;
    }
  });
  const subtotal = labourTotal + materialsTotal + prepTotal + dumpFee + extrasTotal;
  const gst = Math.round(subtotal * 0.1);
  const grandTotal = subtotal + gst;

  // ── Render ────────────────────────────────────
  return (
    <div className="flex flex-col flex-1 min-h-0 gap-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <TreePine className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">AlfredFloors — AI Quote Builder</h2>
            <p className="text-sm text-muted-foreground">Timber flooring maintenance quoting powered by AI vision</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <InlineDemoSpeedControl />
          {step !== "welcome" && (
            <Button variant="outline" size="sm" onClick={resetDemo} className="gap-1.5 min-h-[36px]">
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-5 gap-4 flex-1 min-h-0">
        {/* Chat Panel (left 3/5) */}
        <div className="lg:col-span-3 flex flex-col rounded-xl border border-border bg-card overflow-hidden">
          {/* Chat Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-foreground">AlfredFloors AI Assistant</span>
            <Badge variant="secondary" className="text-[10px] ml-auto">DEMO</Badge>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 touch-pan-y overscroll-contain">
            {step === "welcome" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center h-full text-center py-12 gap-4"
              >
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                  <TreePine className="w-8 h-8 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-1">Timber Floor Quoting Demo</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Experience how AlfredFloors uses AI to measure floors from photos, assess condition, and generate instant quotes.
                  </p>
                </div>
                <Button onClick={startDemo} className="gap-2 min-h-[44px]">
                  <Play className="w-4 h-4" /> Start Demo
                </Button>
              </motion.div>
            )}

            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted/60 text-foreground rounded-bl-md border border-border"
                )}>
                  {/* Photo attachment grid inside chat bubble */}
                  {msg.content.includes("__PHOTOS_ATTACHED__") ? (
                    <div className="space-y-2">
                      <p className="leading-relaxed font-medium">📷 Uploaded 4 floor photos</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {SIMULATED_PHOTOS.map((photo, idx) => (
                          <motion.div
                            key={photo.id}
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.15, duration: 0.3 }}
                            className="relative rounded-lg overflow-hidden aspect-[4/3] bg-primary-foreground/10 border border-primary-foreground/20"
                          >
                            {/* Real photo thumbnail */}
                            <img 
                              src={photo.image} 
                              alt={photo.room}
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                            {/* Room label overlay */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1">
                              <span className="text-[9px] text-white font-medium">{photo.room}</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    msg.content.split("\n").map((line, i) => (
                      <p key={i} className={cn("leading-relaxed", i > 0 && "mt-1")}>
                        {line.split(/(\*\*.*?\*\*)/).map((part, j) =>
                          part.startsWith("**") && part.endsWith("**")
                            ? <strong key={j}>{part.slice(2, -2)}</strong>
                            : part
                        )}
                      </p>
                    ))
                  )}
                </div>
              </motion.div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Action Area */}
          <div className="border-t border-border bg-muted/20 p-3">
            <AnimatePresence mode="wait">
              {/* Service Selection */}
              {step === "service-select" && (
                <motion.div key="svc" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium px-1">Select a service:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {SERVICES.map(svc => (
                      <button
                        key={svc.id}
                        onClick={() => selectService(svc.id)}
                        className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:border-amber-500/40 hover:bg-amber-500/5 transition-all text-left min-h-[44px]"
                      >
                        <svc.icon className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-foreground">{svc.label}</div>
                          <div className="text-xs text-muted-foreground">{svc.desc}</div>
                          <div className="text-xs font-semibold text-amber-600 mt-0.5">${svc.rate}/m²</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Photo Upload */}
              {step === "photo-upload" && (
                <motion.div key="photo" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
                  <Button onClick={simulatePhotoUpload} className="w-full gap-2 min-h-[44px] bg-amber-600 hover:bg-amber-700">
                    <Camera className="w-4 h-4" /> Upload Floor Photos (Simulated)
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">In production, customers upload real photos for AI analysis</p>
                </motion.div>
              )}

              {/* Photo Uploading Animation */}
              {step === "photo-uploading" && (
                <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 p-1">
                  {/* Prominent header */}
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <Upload className="w-4 h-4 text-amber-600 animate-bounce" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">Uploading & Measuring Photos</p>
                      <p className="text-xs text-muted-foreground">
                        {photos.filter(p => p.status === "measured").length}/{photos.length} complete
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-amber-600">
                        {Math.round((photos.filter(p => p.status === "measured").length / Math.max(photos.length, 1)) * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Photo cards with larger thumbnails */}
                  <div className="grid grid-cols-2 gap-2">
                    {photos.map((photo, idx) => (
                      <motion.div
                        key={photo.id}
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: idx * 0.1, type: "spring", stiffness: 200 }}
                        className={cn(
                          "relative rounded-xl border-2 overflow-hidden transition-all",
                          photo.status === "measured" ? "border-green-500 bg-green-500/5 shadow-md shadow-green-500/10" :
                          photo.status === "analyzing" ? "border-amber-500 bg-amber-500/5 shadow-md shadow-amber-500/10 animate-pulse" :
                          photo.status === "uploading" ? "border-primary/40 bg-primary/5" :
                          photo.status === "uploaded" ? "border-blue-400 bg-blue-500/5" :
                          "border-border bg-muted/30"
                        )}
                      >
                        {/* Photo thumbnail area with real image */}
                        <div className="aspect-[4/3] relative overflow-hidden">
                          <img 
                            src={photo.image} 
                            alt={photo.room}
                            className={cn(
                              "absolute inset-0 w-full h-full object-cover transition-all duration-500",
                              photo.status === "analyzing" && "brightness-75",
                              photo.status === "measured" && "brightness-90"
                            )}
                          />
                          {/* Status overlay */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/20">
                          {photo.status === "uploading" && (
                            <>
                              <Upload className="w-6 h-6 text-white animate-bounce drop-shadow-lg" />
                              <span className="text-lg font-bold text-white drop-shadow-lg">{photo.uploadProgress}%</span>
                              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/30">
                                <motion.div
                                  className="h-full bg-white rounded-r"
                                  style={{ width: `${photo.uploadProgress}%` }}
                                />
                              </div>
                            </>
                          )}
                          {photo.status === "queued" && (
                            <>
                              <Image className="w-5 h-5 text-white/80 drop-shadow-lg" />
                              <span className="text-[10px] text-white/90 font-medium drop-shadow-lg">Waiting...</span>
                            </>
                          )}
                          {photo.status === "uploaded" && (
                            <>
                              <CheckCircle2 className="w-5 h-5 text-white drop-shadow-lg" />
                              <span className="text-[10px] text-white font-medium drop-shadow-lg">Uploaded</span>
                            </>
                          )}
                          {photo.status === "analyzing" && (
                            <>
                              <Ruler className="w-6 h-6 text-amber-300 drop-shadow-lg" />
                              <span className="text-[10px] text-amber-200 font-semibold drop-shadow-lg">Measuring...</span>
                              <span className="text-[9px] text-white/80 drop-shadow-lg">{photo.refObject}</span>
                            </>
                          )}
                          {photo.status === "measured" && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-0.5">
                              <CheckCircle2 className="w-6 h-6 text-green-400 drop-shadow-lg" />
                              <span className="text-lg font-bold text-white drop-shadow-lg">{photo.measuredArea}m²</span>
                              <span className="text-[9px] text-green-200 drop-shadow-lg">{photo.detectedScale}</span>
                            </motion.div>
                          )}
                          </div>
                        </div>

                        {/* Photo info bar */}
                        <div className="px-2 py-1.5 border-t border-border/50 bg-card/80">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-medium text-foreground truncate">{photo.name}</span>
                            <span className="text-[10px] text-muted-foreground">{photo.size}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">{photo.room}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* AI Analyzing */}
              {step === "ai-analyzing" && (
                <motion.div key="analyze" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 p-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                    <span>AI Vision analysing floor photos...</span>
                    <span className="ml-auto font-medium">{analysisProgress}%</span>
                  </div>
                  <Progress value={analysisProgress} className="h-2" />
                  <div className="grid grid-cols-2 gap-1.5 text-xs text-muted-foreground">
                    {analysisProgress > 15 && <div className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> Timber type identified</div>}
                    {analysisProgress > 35 && <div className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> Room boundaries detected</div>}
                    {analysisProgress > 55 && <div className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> Area calculated</div>}
                    {analysisProgress > 75 && <div className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> Condition assessed</div>}
                  </div>
                </motion.div>
              )}

              {/* Measurements Confirmation */}
              {step === "measurements" && (
                <motion.div key="measure" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
                  <Button onClick={confirmMeasurements} className="w-full gap-2 min-h-[44px]">
                    <CheckCircle2 className="w-4 h-4" /> Confirm Measurements ({totalArea}m²)
                  </Button>
                </motion.div>
              )}

              {/* Coating Selection */}
              {step === "coating-select" && (
                <motion.div key="coat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium px-1">Choose your finish:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {COATINGS.map(c => (
                      <button
                        key={c.id}
                        onClick={() => selectCoating(c.id)}
                        className={cn(
                          "relative p-3 rounded-lg border text-left transition-all min-h-[44px]",
                          "border-border bg-card hover:border-amber-500/40 hover:bg-amber-500/5"
                        )}
                      >
                        {c.popular && (
                          <Badge className="absolute -top-2 right-2 text-[9px] bg-amber-500 text-white">Popular</Badge>
                        )}
                        <div className="text-sm font-medium text-foreground">{c.label}</div>
                        <div className="text-xs text-muted-foreground">{c.desc}</div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Extras */}
              {step === "extras" && (
                <motion.div key="extras" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium px-1">Optional extras:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {EXTRAS.map(ext => (
                      <button
                        key={ext.id}
                        onClick={() => toggleExtra(ext.id)}
                        className={cn(
                          "p-3 rounded-lg border text-left transition-all min-h-[44px]",
                          selectedExtras.includes(ext.id)
                            ? "border-amber-500 bg-amber-500/10"
                            : "border-border bg-card hover:border-amber-500/30"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">{ext.label}</span>
                          {selectedExtras.includes(ext.id) && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                        </div>
                        <div className="text-xs text-muted-foreground">{ext.desc}</div>
                        <div className="text-xs font-semibold text-amber-600 mt-0.5">${ext.price}{ext.unit || ""}</div>
                      </button>
                    ))}
                  </div>
                  <Button onClick={confirmExtras} className="w-full gap-2 min-h-[44px]">
                    <ArrowRight className="w-4 h-4" /> {selectedExtras.length > 0 ? "Continue with Extras" : "Skip Extras"}
                  </Button>
                </motion.div>
              )}

              {/* Quote Summary — Book */}
              {step === "quote-summary" && (
                <motion.div key="book" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <Button onClick={bookJob} className="w-full gap-2 min-h-[44px] bg-green-600 hover:bg-green-700">
                    <Calendar className="w-4 h-4" /> Book This Job
                  </Button>
                </motion.div>
              )}

              {/* Confirmation */}
              {step === "confirmation" && (
                <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex gap-2">
                  <Button onClick={resetDemo} variant="outline" className="flex-1 gap-2 min-h-[44px]">
                    <RotateCcw className="w-4 h-4" /> Try Again
                  </Button>
                  <Button onClick={() => openBooking("page_cta")} className="flex-1 gap-2 min-h-[44px]">
                    <Sparkles className="w-4 h-4" /> Build This for My Business
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Panel (2/5) */}
        <div className="lg:col-span-2 space-y-4 overflow-y-auto min-h-0">
          {/* Photo Upload & Measurement Card */}
          {photos.length > 0 && (step === "photo-uploading" || step === "ai-analyzing") && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Camera className="w-4 h-4 text-amber-600" />
                    Photo Analysis & Reference Measurement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {photos.map((photo, i) => (
                    <motion.div
                      key={photo.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={cn(
                        "p-3 rounded-lg border transition-all",
                        photo.status === "measured" ? "border-green-500/30 bg-green-500/5" :
                        photo.status === "analyzing" ? "border-amber-500/30 bg-amber-500/5" :
                        "border-border bg-muted/30"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 border border-border">
                            <img src={photo.image} alt={photo.room} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-foreground">{photo.room}</div>
                            <div className="text-[10px] text-muted-foreground">{photo.name} · {photo.size}</div>
                          </div>
                        </div>
                        {photo.status === "measured" && (
                          <Badge variant="secondary" className="text-xs font-mono bg-green-500/10 text-green-600 border-green-500/20">
                            {photo.measuredArea}m²
                          </Badge>
                        )}
                      </div>

                      {/* Upload Progress */}
                      {(photo.status === "uploading" || photo.status === "uploaded") && (
                        <div className="mt-1.5">
                          <Progress value={photo.uploadProgress} className="h-1.5" />
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {photo.status === "uploading" ? `Uploading ${photo.uploadProgress}%` : "Upload complete"}
                          </div>
                        </div>
                      )}

                      {/* Reference Measurement */}
                      {(photo.status === "analyzing" || photo.status === "measured") && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-2 p-2 rounded-md bg-card border border-border"
                        >
                          <div className="text-[10px] font-medium text-amber-600 mb-1 flex items-center gap-1">
                            <Ruler className="w-3 h-3" />
                            Reference Calibration
                          </div>
                          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px]">
                            <span className="text-muted-foreground">Ref Object:</span>
                            <span className="text-foreground font-medium">{photo.refObject}</span>
                            <span className="text-muted-foreground">Scale:</span>
                            <span className="text-foreground font-medium">{photo.detectedScale}</span>
                            {photo.status === "measured" && (
                              <>
                                <span className="text-muted-foreground">Measured:</span>
                                <span className="text-green-600 font-bold">{photo.measuredArea}m²</span>
                              </>
                            )}
                          </div>
                          {photo.status === "analyzing" && (
                            <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-amber-600">
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              >
                                <Sparkles className="w-3 h-3" />
                              </motion.div>
                              Calculating floor area from reference...
                            </div>
                          )}
                        </motion.div>
                      )}
                    </motion.div>
                  ))}

                  {/* Running total */}
                  {photos.some(p => p.status === "measured") && (
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="text-sm font-medium text-muted-foreground">Pre-measured Total</span>
                      <span className="text-sm font-bold text-amber-600">
                        {photos.filter(p => p.status === "measured").reduce((s, p) => s + (p.measuredArea || 0), 0)}m²
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Room Breakdown Card */}
          {rooms.length > 0 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <Card className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-amber-600" />
                    AI Room Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {rooms.map((room, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border">
                      <div>
                        <div className="text-sm font-medium text-foreground">{room.name}</div>
                        <div className="text-xs text-muted-foreground">{room.condition}</div>
                      </div>
                      <Badge variant="secondary" className="text-xs font-mono">{room.area}m²</Badge>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">Total Area</span>
                    <span className="text-sm font-bold text-amber-600">{totalArea}m²</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Quote Breakdown Card */}
          {showQuote && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <Card className="border-amber-500/30 bg-amber-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-amber-600" />
                    Quote Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <QuoteLine label={`${svc?.label || "Service"} — Labour`} detail={`${totalArea}m² × $${rate}/m²`} amount={labourTotal} />
                  <QuoteLine label="Floor Preparation & Repairs" detail="lot" amount={prepTotal} />
                  <QuoteLine label="Materials (Coatings & Consumables)" detail="lot" amount={materialsTotal} />
                  <QuoteLine label="Dump / Tipping Fees" amount={dumpFee} />
                  {selectedExtras.map(id => {
                    const ext = EXTRAS.find(e => e.id === id);
                    if (!ext) return null;
                    let amt = ext.price;
                    if (ext.unit === "/m²") amt = ext.price * totalArea;
                    if (ext.unit === "/step") amt = ext.price * 12;
                    return <QuoteLine key={id} label={ext.label} amount={amt} />;
                  })}
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium tabular-nums">${subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">GST (10%)</span>
                    <span className="font-medium tabular-nums">${gst.toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-bold text-foreground">Total (inc. GST)</span>
                    <span className="text-lg font-bold text-amber-600 tabular-nums">${grandTotal.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* How It Works Card (when idle) */}
          {step === "welcome" && (
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-muted-foreground" />
                  How AI Quoting Works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { icon: Camera, label: "Upload floor photos", desc: "AI detects room boundaries & timber type" },
                  { icon: Ruler, label: "Auto-measure area", desc: "Calibrated area measurement from images" },
                  { icon: Sparkles, label: "AI generates quote", desc: "Rate cards + smart pricing logic" },
                  { icon: Calendar, label: "Book & pay online", desc: "Instant scheduling with deposit" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                      <item.icon className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Efficiency Stats */}
          {step === "confirmation" && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-green-500/30 bg-green-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Star className="w-4 h-4 text-green-600" />
                    Before vs After AI
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Quote Time", before: "45 min", after: "3 min" },
                      { label: "Site Visits", before: "Required", after: "Optional" },
                      { label: "Accuracy", before: "±20%", after: "±5%" },
                      { label: "Booking", before: "Phone tag", after: "Instant" },
                    ].map((stat, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-card border border-border text-center">
                        <div className="text-[10px] text-muted-foreground font-medium">{stat.label}</div>
                        <div className="text-xs text-red-400 line-through">{stat.before}</div>
                        <div className="text-sm font-bold text-green-600">{stat.after}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Helper Components ────────────────────────────
function QuoteLine({ label, detail, amount }: { label: string; detail?: string; amount: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div>
        <span className="text-foreground">{label}</span>
        {detail && <span className="text-xs text-muted-foreground ml-1">({detail})</span>}
      </div>
      <span className="font-medium text-foreground tabular-nums">${amount.toLocaleString()}</span>
    </div>
  );
}
