import { useState, useEffect, useCallback, useRef } from "react";
import { useDemoSpeed } from "@/contexts/DemoSpeedContext";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import {
  Package,
  Boxes,
  Route,
  UserCheck,
  ScanLine,
  PackageCheck,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Clock,
  AlertTriangle,
  ChevronRight,
  MapPin,
  Hand,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import FingerClickIndicator from "@/components/demos/shared/FingerClickIndicator";
import { InlineDemoSpeedControl } from "@/components/demos/shared/InlineDemoSpeedControl";

interface WarehouseStep {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
  duration: number;
  clickPrompt?: string;
}

interface WarehouseZone {
  id: string;
  row: number;
  col: number;
  type: "storage" | "aisle" | "staging" | "dispatch" | "receiving";
  items?: number;
  label?: string;
  inRoute?: boolean;
  isPicking?: boolean;
}

interface PickOrder {
  id: string;
  priority: "urgent" | "normal" | "low";
  items: { sku: string; name: string; qty: number; location: string }[];
  customer: string;
  deadline: string;
}

const WAREHOUSE_STEPS: WarehouseStep[] = [
  { id: "queue", title: "Order Queue", icon: Package, description: "Prioritizing incoming orders", duration: 5000, clickPrompt: "Click to analyze orders" },
  { id: "wave", title: "Wave Planning", icon: Boxes, description: "AI groups orders for efficiency", duration: 5000, clickPrompt: "Click to plan wave" },
  { id: "route", title: "Route Optimization", icon: Route, description: "Calculating optimal pick path", duration: 4500, clickPrompt: "Click to optimize route" },
  { id: "assign", title: "Pick Assignment", icon: UserCheck, description: "Assigning to available picker", duration: 4500, clickPrompt: "Click to assign picker" },
  { id: "pick", title: "Batch Picking", icon: ScanLine, description: "Scan-to-pick in progress", duration: 6000, clickPrompt: "Click to start picking" },
  { id: "pack", title: "Pack Station", icon: PackageCheck, description: "Packaging & verification", duration: 4500, clickPrompt: "Click to pack items" },
  { id: "quality", title: "Quality Check", icon: ShieldCheck, description: "Visual inspection complete", duration: 4000, clickPrompt: "Click to verify quality" },
  { id: "ship", title: "Shipping", icon: Truck, description: "Label generated & dispatched", duration: 4500, clickPrompt: "Click to generate label" },
  { id: "complete", title: "Complete", icon: CheckCircle2, description: "Order fulfilled successfully", duration: 3000 },
];

const createWarehouseGrid = (): WarehouseZone[] => {
  const zones: WarehouseZone[] = [];
  
  // Storage zones (rows A-E, cols 1-8)
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 8; col++) {
      // Create aisles in cols 3-4
      if (col === 3 || col === 4) {
        if (row === 1 || row === 3) {
          zones.push({
            id: `aisle-${row}-${col}`,
            row,
            col,
            type: "aisle",
            label: "AISLE",
          });
          continue;
        }
      }
      
      const rowLabel = String.fromCharCode(65 + row);
      zones.push({
        id: `${rowLabel}${col + 1}`,
        row,
        col,
        type: "storage",
        items: Math.floor(Math.random() * 50) + 10,
        label: `${rowLabel}${col + 1}`,
      });
    }
  }
  
  // Bottom row: special zones
  zones.push({ id: "receiving", row: 5, col: 0, type: "receiving", label: "RECEIVING" });
  zones.push({ id: "staging", row: 5, col: 3, type: "staging", label: "STAGING" });
  zones.push({ id: "dispatch", row: 5, col: 6, type: "dispatch", label: "DISPATCH" });
  
  return zones;
};

const MOCK_ORDERS: PickOrder[] = [
  {
    id: "ORD-4521",
    priority: "urgent",
    customer: "TechCorp Solutions",
    deadline: "Today 2:00 PM",
    items: [
      { sku: "LAP-PRO-15", name: "ProBook Laptop 15\"", qty: 5, location: "A3" },
      { sku: "MON-ULT-27", name: "UltraView Monitor 27\"", qty: 5, location: "B7" },
      { sku: "KBD-MEC-01", name: "Mechanical Keyboard", qty: 10, location: "C2" },
    ],
  },
  {
    id: "ORD-4522",
    priority: "normal",
    customer: "Creative Agency",
    deadline: "Today 5:00 PM",
    items: [
      { sku: "TAB-GFX-12", name: "Graphics Tablet", qty: 3, location: "D5" },
      { sku: "STY-PRO-01", name: "Pro Stylus", qty: 6, location: "E1" },
    ],
  },
  {
    id: "ORD-4523",
    priority: "low",
    customer: "StartupHub Inc",
    deadline: "Tomorrow 10:00 AM",
    items: [
      { sku: "WBC-HD-01", name: "HD Webcam", qty: 8, location: "A6" },
      { sku: "HST-WRL-01", name: "Wireless Headset", qty: 8, location: "B2" },
    ],
  },
];

const PICK_ROUTE = ["A3", "A6", "B2", "B7", "C2", "D5", "E1", "staging", "dispatch"];

export default function SmartWarehouseDemo() {
  const { applySpeed } = useDemoSpeed();
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false); // Don't auto-start
  const [stepProgress, setStepProgress] = useState(0);
  const [warehouseGrid, setWarehouseGrid] = useState<WarehouseZone[]>(() => createWarehouseGrid());
  const [currentPickIndex, setCurrentPickIndex] = useState(-1);
  const [pickedItems, setPickedItems] = useState<string[]>([]);
  const [waveOrders, setWaveOrders] = useState<string[]>([]);
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | null>(null);
  const [showClickPrompt, setShowClickPrompt] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const pickIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateRouteHighlight = useCallback((routeIndex: number) => {
    setWarehouseGrid(prev =>
      prev.map(zone => ({
        ...zone,
        inRoute: PICK_ROUTE.includes(zone.id),
        isPicking: zone.id === PICK_ROUTE[routeIndex],
      }))
    );
  }, []);

  // Handle step advancement
  const advanceStep = useCallback(() => {
    if (currentStep < WAREHOUSE_STEPS.length - 1) {
      // Step-specific actions when completing a step
      const step = WAREHOUSE_STEPS[currentStep];
      if (step.id === "wave") {
        setWaveOrders(MOCK_ORDERS.map(o => o.id));
      }
      if (step.id === "route") {
        updateRouteHighlight(-1);
      }
      
      setCurrentStep(prev => prev + 1);
      setStepProgress(0);
      setShowClickPrompt(true);
    }
  }, [currentStep, updateRouteHighlight]);

  // Handle picking animation for the pick step
  useEffect(() => {
    if (WAREHOUSE_STEPS[currentStep]?.id === "pick" && isPlaying) {
      let pickIdx = 0;
      setCurrentPickIndex(0);
      updateRouteHighlight(0);
      
      pickIntervalRef.current = setInterval(() => {
        if (pickIdx < PICK_ROUTE.length - 2) {
          setCurrentPickIndex(pickIdx);
          updateRouteHighlight(pickIdx);
          setPickedItems(prev => {
            if (!prev.includes(PICK_ROUTE[pickIdx])) {
              return [...prev, PICK_ROUTE[pickIdx]];
            }
            return prev;
          });
          pickIdx++;
        } else {
          if (pickIntervalRef.current) {
            clearInterval(pickIntervalRef.current);
          }
        }
      }, 500);
      
      return () => {
        if (pickIntervalRef.current) {
          clearInterval(pickIntervalRef.current);
        }
      };
    }
  }, [currentStep, isPlaying, updateRouteHighlight]);

  // Autoplay with progress and click indicator
  useEffect(() => {
    if (!isPlaying) return;

    const step = WAREHOUSE_STEPS[currentStep];
    if (!step) {
      setIsPlaying(false);
      return;
    }

    // Show click indicator during autoplay
    const showClickIndicator = () => {
      if (contentRef.current && currentStep < WAREHOUSE_STEPS.length - 1) {
        const rect = contentRef.current.getBoundingClientRect();
        setClickPosition({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2 + 50,
        });
        
        setTimeout(() => {
          setClickPosition(null);
        }, 800);
      }
    };

    const progressInterval = setInterval(() => {
      setStepProgress(prev => {
        if (prev >= 100) return 100;
        return prev + (100 / (applySpeed(step.duration) / 50));
      });
    }, 50);

    // Show click indicator near end of step
    const clickIndicatorTimeout = setTimeout(() => {
      showClickIndicator();
    }, applySpeed(step.duration - 800));

    const stepTimeout = setTimeout(() => {
      advanceStep();
    }, applySpeed(step.duration));

    return () => {
      clearInterval(progressInterval);
      clearTimeout(stepTimeout);
      clearTimeout(clickIndicatorTimeout);
    };
  }, [isPlaying, currentStep, advanceStep]);

  // Handle manual click to advance
  const handleStepClick = () => {
    if (currentStep < WAREHOUSE_STEPS.length - 1) {
      setIsPlaying(false);
      setShowClickPrompt(false);
      
      // Show click effect at center
      if (contentRef.current) {
        const rect = contentRef.current.getBoundingClientRect();
        setClickPosition({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        });
        setTimeout(() => setClickPosition(null), 600);
      }
      
      // Advance after brief delay
      setTimeout(() => {
        advanceStep();
        setIsPlaying(true);
      }, 300);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setStepProgress(0);
    setIsPlaying(true);
    setWarehouseGrid(createWarehouseGrid());
    setCurrentPickIndex(-1);
    setPickedItems([]);
    setWaveOrders([]);
    setShowClickPrompt(true);
    if (pickIntervalRef.current) {
      clearInterval(pickIntervalRef.current);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500/20 text-red-500 border-red-500/30";
      case "normal": return "bg-blue-500/20 text-blue-500 border-blue-500/30";
      case "low": return "bg-muted text-muted-foreground border-border";
      default: return "";
    }
  };

  const getZoneStyle = (zone: WarehouseZone) => {
    const base = "rounded flex items-center justify-center text-[10px] font-medium transition-all duration-300";
    
    if (zone.isPicking) {
      return `${base} bg-green-500 text-white ring-2 ring-green-500 ring-offset-2 ring-offset-background animate-pulse`;
    }
    if (pickedItems.includes(zone.id)) {
      return `${base} bg-green-500/30 text-green-500 border border-green-500/50`;
    }
    if (zone.inRoute) {
      return `${base} bg-primary/20 text-primary border border-primary/50`;
    }
    
    switch (zone.type) {
      case "storage":
        return `${base} bg-muted/50 text-muted-foreground border border-border hover:bg-muted`;
      case "aisle":
        return `${base} bg-transparent text-muted-foreground/50`;
      case "receiving":
        return `${base} bg-blue-500/20 text-blue-500 col-span-3`;
      case "staging":
        return `${base} bg-amber-500/20 text-amber-500 col-span-2`;
      case "dispatch":
        return `${base} bg-green-500/20 text-green-500 col-span-3`;
      default:
        return base;
    }
  };

  const renderStepContent = () => {
    const step = WAREHOUSE_STEPS[currentStep];
    if (!step) return null;

    switch (step.id) {
      case "queue":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              3 orders in queue, prioritizing by deadline...
            </div>
            {MOCK_ORDERS.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.15 }}
              >
                <Card className={`border ${getPriorityColor(order.priority)}`}>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{order.id}</span>
                          <Badge variant="outline" className={`text-[10px] ${getPriorityColor(order.priority)}`}>
                            {order.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{order.customer}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-xs">
                          {order.priority === "urgent" && <AlertTriangle className="w-3 h-3 text-red-500" />}
                          {order.deadline}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {order.items.map(item => (
                        <Badge key={item.sku} variant="secondary" className="text-[10px]">
                          {item.name} x{item.qty}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        );

      case "wave":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              AI grouping orders into efficient wave...
            </div>
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-primary" />
                  Wave #W-2026-0089
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary tabular-nums">3</p>
                    <p className="text-xs text-muted-foreground">Orders</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary tabular-nums">45</p>
                    <p className="text-xs text-muted-foreground">Items</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary tabular-nums">7</p>
                    <p className="text-xs text-muted-foreground">Locations</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground">Orders included:</p>
                  <div className="flex gap-2 mt-1">
                    {waveOrders.map(orderId => (
                      <Badge key={orderId} variant="secondary" className="text-xs">
                        {orderId}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      case "route":
      case "pick":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              {step.id === "route" ? (
                <>
                  <Route className="w-4 h-4 text-primary" />
                  Optimized route calculated: {PICK_ROUTE.length - 2} stops
                </>
              ) : (
                <>
                  <ScanLine className="w-4 h-4 text-green-500 animate-pulse" />
                  Picking in progress: {pickedItems.length}/{PICK_ROUTE.length - 2} items
                </>
              )}
            </div>
            
            {/* Pick path visualization */}
            <div className="flex items-center gap-1 flex-wrap">
              {PICK_ROUTE.slice(0, -2).map((loc, idx) => (
                <div key={loc} className="flex items-center">
                  <Badge
                    variant={pickedItems.includes(loc) ? "default" : "outline"}
                    className={`text-xs ${
                      pickedItems.includes(loc)
                        ? "bg-green-500"
                        : currentPickIndex === idx
                        ? "border-primary text-primary animate-pulse"
                        : ""
                    }`}
                  >
                    <MapPin className="w-3 h-3 mr-1" />
                    {loc}
                  </Badge>
                  {idx < PICK_ROUTE.length - 3 && (
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>

            {step.id === "pick" && currentPickIndex >= 0 && (
              <Card className="bg-muted/30">
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground mb-1">Now picking at {PICK_ROUTE[currentPickIndex]}:</p>
                  {MOCK_ORDERS.flatMap(o => o.items)
                    .filter(item => item.location === PICK_ROUTE[currentPickIndex])
                    .map(item => (
                      <div key={item.sku} className="flex justify-between text-sm">
                        <span>{item.name}</span>
                        <Badge variant="secondary">Qty: {item.qty}</Badge>
                      </div>
                    ))}
                </CardContent>
              </Card>
            )}
          </motion.div>
        );

      case "assign":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-medium">Assigned to: Alex M.</p>
                  <p className="text-sm text-muted-foreground">Zone A-E picker • 98% accuracy</p>
                </div>
                <Badge className="ml-auto bg-green-500">Available</Badge>
              </CardContent>
            </Card>
            <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-primary mt-0.5" />
              <span>AI selected picker based on zone familiarity and current workload</span>
            </div>
          </motion.div>
        );

      case "pack":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <PackageCheck className="w-6 h-6 text-primary" />
                  <div>
                    <p className="font-medium">Pack Station #3</p>
                    <p className="text-xs text-muted-foreground">Verifying items and packaging</p>
                  </div>
                </div>
                <Progress value={75} className="h-2" />
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 bg-muted/30 rounded">
                    <p className="font-bold text-lg tabular-nums">2</p>
                    <p className="text-muted-foreground">Boxes</p>
                  </div>
                  <div className="p-2 bg-muted/30 rounded">
                    <p className="font-bold text-lg tabular-nums">45</p>
                    <p className="text-muted-foreground">Items</p>
                  </div>
                  <div className="p-2 bg-green-500/20 rounded">
                    <p className="font-bold text-lg text-green-500">✓</p>
                    <p className="text-green-500">Verified</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      case "quality":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" }}
              className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4"
            >
              <ShieldCheck className="w-8 h-8 text-green-500" />
            </motion.div>
            <h3 className="font-semibold">Quality Check Passed</h3>
            <p className="text-sm text-muted-foreground">All items verified, no discrepancies</p>
          </motion.div>
        );

      case "ship":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <Card className="border-primary/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-primary" />
                    <span className="font-medium">Shipping Label Generated</span>
                  </div>
                  <Badge variant="secondary">Express</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Carrier</span>
                    <span>FastShip Express</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tracking</span>
                    <span className="font-mono text-xs">FS-2026-8847521</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ETA</span>
                    <span>Tomorrow 10:00 AM</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <p className="text-xs text-muted-foreground text-center">
              <Sparkles className="w-3 h-3 inline mr-1" />
              AI selected carrier based on deadline, cost, and reliability
            </p>
          </motion.div>
        );

      case "complete":
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </motion.div>
            <h3 className="font-semibold text-lg mb-1">Wave Complete!</h3>
            <p className="text-sm text-muted-foreground mb-4">
              3 orders fulfilled, 45 items shipped
            </p>
            <div className="flex justify-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary tabular-nums">12 min</p>
                <p className="text-xs text-muted-foreground">Total time</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500 tabular-nums">100%</p>
                <p className="text-xs text-muted-foreground">Accuracy</p>
              </div>
            </div>
            <Button onClick={handleReset} className="mt-4 gap-2">
              <RotateCcw className="w-4 h-4" />
              Run Again
            </Button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  const currentStepData = WAREHOUSE_STEPS[currentStep];

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Click indicator for autoplay */}
      <AnimatePresence>
        {clickPosition && (
          <FingerClickIndicator 
            position={clickPosition} 
            label={currentStepData?.clickPrompt || "Click to continue"} 
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold">Smart Warehouse Operations</h2>
            <p className="text-sm text-muted-foreground">AI-powered order fulfillment</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <InlineDemoSpeedControl compact />
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-1">
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
          <Button size="sm" onClick={() => setIsPlaying(!isPlaying)} className="gap-1">
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? "Pause" : "Play"}
          </Button>
        </div>
      </div>

      {/* Step Progress */}
      <div className="mb-6 overflow-x-auto pb-2">
        <div className="flex gap-1 min-w-max">
          {WAREHOUSE_STEPS.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const StepIcon = step.icon;

            return (
              <motion.button
                key={step.id}
                onClick={() => {
                  if (index === currentStep && currentStep < WAREHOUSE_STEPS.length - 1) {
                    handleStepClick();
                  }
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all ${
                  isCompleted
                    ? "bg-green-500/20 text-green-500"
                    : isCurrent
                    ? "bg-amber-500 text-white cursor-pointer hover:bg-amber-600"
                    : "bg-muted text-muted-foreground"
                }`}
                animate={isCurrent ? { scale: [1, 1.02, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <StepIcon className="w-3 h-3" />
                <span className="hidden sm:inline">{step.title}</span>
                {isCompleted && <CheckCircle2 className="w-3 h-3" />}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Progress bar */}
      {currentStep < WAREHOUSE_STEPS.length && (
        <div className="mb-4">
          <Progress value={stepProgress} className="h-1" />
        </div>
      )}

      {/* Main Content - Clickable Area */}
      <div 
        ref={contentRef}
        className="grid md:grid-cols-2 gap-6 cursor-pointer group"
        onClick={handleStepClick}
      >
        {/* Left: Step Content */}
        <div className="min-h-[400px] relative">
          <AnimatePresence mode="wait">
            <div key={currentStep}>{renderStepContent()}</div>
          </AnimatePresence>
          
          {/* Click prompt overlay */}
          {showClickPrompt && currentStep < WAREHOUSE_STEPS.length - 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-0 left-0 right-0 flex justify-center"
            >
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-sm">
                <Hand className="w-4 h-4 animate-bounce" />
                <span>{currentStepData?.clickPrompt || "Click anywhere to continue"}</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right: Warehouse Grid Visualization */}
        <Card className="h-fit">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Warehouse Floor View
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-8 gap-1">
              {warehouseGrid.filter(z => z.row < 5).map(zone => (
                <motion.div
                  key={zone.id}
                  className={`h-10 ${getZoneStyle(zone)}`}
                  animate={zone.isPicking ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                >
                  {zone.label}
                </motion.div>
              ))}
            </div>
            
            {/* Special zones row */}
            <div className="grid grid-cols-8 gap-1 mt-2">
              {warehouseGrid.filter(z => z.row === 5).map(zone => (
                <div
                  key={zone.id}
                  className={`h-10 ${getZoneStyle(zone)}`}
                >
                  {zone.label}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-2 text-[10px]">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-muted border border-border" />
                <span className="text-muted-foreground">Storage</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-primary/20 border border-primary/50" />
                <span className="text-muted-foreground">In Route</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-500" />
                <span className="text-muted-foreground">Picking</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-500/30 border border-green-500/50" />
                <span className="text-muted-foreground">Picked</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Efficiency stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 p-4 rounded-lg bg-muted/30 border border-border"
      >
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-muted-foreground line-through tabular-nums">25 min</p>
            <p className="text-xs text-muted-foreground">Manual Picking</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-500 tabular-nums">12 min</p>
            <p className="text-xs text-muted-foreground">AI-Optimized</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-500 tabular-nums">52%</p>
            <p className="text-xs text-muted-foreground">Time Saved</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
