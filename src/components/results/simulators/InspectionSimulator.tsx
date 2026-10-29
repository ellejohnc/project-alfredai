import { useState } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { 
  Camera, Upload, Scan, AlertTriangle, CheckCircle2, 
  Bot, Loader2, Play, RotateCcw, Eye, FileText,
  MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import LazyImage from "@/components/ui/lazy-image";

import { BeforeAfterCompare } from "./BeforeAfterCompare";

import inspectionCrack from "@/assets/inspection-crack.jpg";
import inspectionWaterproofing from "@/assets/inspection-waterproofing.jpg";
import inspectionElectrical from "@/assets/inspection-electrical.jpg";
import inspectionStructure from "@/assets/inspection-structure.jpg";

interface InspectionSimulatorProps {
  company: string;
  industry: string;
  onComplete?: () => void;
}

const INSPECTION_PHOTOS = [
  { 
    id: "crack",
    src: inspectionCrack, 
    label: "Wall Crack",
    location: "Level 2 - Bathroom",
    aiAnalysis: {
      detected: "Structural crack in concrete wall",
      problem: "Hairline crack detected running vertically. Potential water ingress point.",
      severity: "high" as const,
      confidence: 94
    }
  },
  { 
    id: "waterproofing",
    src: inspectionWaterproofing, 
    label: "Waterproofing",
    location: "Level 1 - Bathroom",
    aiAnalysis: {
      detected: "Bathroom waterproofing membrane",
      problem: "Membrane correctly installed. Minor discoloration near drain.",
      severity: "low" as const,
      confidence: 82
    }
  },
  { 
    id: "electrical",
    src: inspectionElectrical, 
    label: "Electrical Panel",
    location: "Ground Floor",
    aiAnalysis: {
      detected: "Main switchboard and cables",
      problem: "Junction box cover missing on secondary panel.",
      severity: "medium" as const,
      confidence: 89
    }
  },
  { 
    id: "structure",
    src: inspectionStructure, 
    label: "Steel Structure",
    location: "Level 3 - Frame",
    aiAnalysis: {
      detected: "Steel frame connections",
      problem: "Missing bolts on secondary beam joint - requires attention.",
      severity: "high" as const,
      confidence: 91
    }
  },
];

type SimulationStep = "idle" | "capturing" | "analyzing" | "detecting" | "reporting" | "complete";

export function InspectionSimulator({ company, industry, onComplete }: InspectionSimulatorProps) {
  const [step, setStep] = useState<SimulationStep>("idle");
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [analyzedPhotos, setAnalyzedPhotos] = useState<typeof INSPECTION_PHOTOS>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [selectedPhoto, setSelectedPhoto] = useState<typeof INSPECTION_PHOTOS[0] | null>(null);

  const handleReset = () => {
    setStep("idle");
    setCurrentPhotoIndex(0);
    setAnalyzedPhotos([]);
    setShowComparison(false);
    setScanProgress(0);
    setSelectedPhoto(null);
  };

  const handleStart = async () => {
    setStep("capturing");
    
    for (let i = 0; i < INSPECTION_PHOTOS.length; i++) {
      setCurrentPhotoIndex(i);
      setStep("analyzing");
      setScanProgress(0);
      
      for (let p = 0; p <= 100; p += 10) {
        await simulateDelay(80);
        setScanProgress(p);
      }
      
      setStep("detecting");
      await simulateDelay(500);
      
      setAnalyzedPhotos(prev => [...prev, INSPECTION_PHOTOS[i]]);
      await simulateDelay(300);
    }
    
    setStep("reporting");
    await simulateDelay(1000);
    
    setStep("complete");
    setShowComparison(true);
    setTimeout(() => onComplete?.(), 100);
  };

  const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case "high": return "border-l-destructive bg-destructive/5";
      case "medium": return "border-l-muted-foreground bg-muted/20";
      case "low": return "border-l-muted-foreground/30 bg-muted/10";
      default: return "bg-muted/5";
    }
  };

  const getSeverityDot = (severity: string) => {
    switch (severity) {
      case "high": return "bg-destructive";
      case "medium": return "bg-muted-foreground";
      case "low": return "bg-muted-foreground/50";
      default: return "bg-muted";
    }
  };

  const defectsFound = analyzedPhotos.filter(p => p.aiAnalysis.severity === "high").length;
  const warningsFound = analyzedPhotos.filter(p => p.aiAnalysis.severity === "medium").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
        <div>
          <h3 className="text-base font-semibold text-foreground">Site Inspection</h3>
          <p className="text-sm text-muted-foreground">
            Watch AI analyze site photos in real-time
          </p>
        </div>
        <div className="flex gap-2">
          {step !== "idle" && (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-1.5" />
              Reset
            </Button>
          )}
          {step === "idle" && (
            <Button size="sm" onClick={handleStart}>
              <Play className="w-4 h-4 mr-1.5" />
              Run Demo
            </Button>
          )}
        </div>
      </div>


      {/* Main area */}
      <div className="grid md:grid-cols-2 gap-4 min-h-[400px]">
        {/* Photo capture */}
        <Card className="border border-border bg-card overflow-hidden">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Site Photos</span>
            </div>
            {analyzedPhotos.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {analyzedPhotos.length}/{INSPECTION_PHOTOS.length} analyzed
              </Badge>
            )}
          </div>
          <CardContent className="p-4">
            {step === "idle" ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Upload className="w-8 h-8 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm">
                  Click "Run Demo" to simulate inspection
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {step !== "complete" && (
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-muted/30">
                    <LazyImage
                      src={INSPECTION_PHOTOS[currentPhotoIndex].src}
                      alt={INSPECTION_PHOTOS[currentPhotoIndex].label}
                      className="w-full h-full object-cover"
                      wrapperClassName="w-full h-full"
                    />
                    
                    {(step === "analyzing" || step === "detecting") && (
                      <motion.div className="absolute inset-0">
                        <motion.div
                          className="absolute left-0 right-0 h-0.5 bg-primary/50"
                          style={{ top: `${scanProgress}%` }}
                        />
                        <div className="absolute top-2 left-2">
                          <Badge variant="outline" className="bg-background/80 text-xs">
                            <Scan className="w-3 h-3 mr-1 animate-pulse" />
                            {step === "detecting" ? "Detecting..." : "Scanning..."}
                          </Badge>
                        </div>
                      </motion.div>
                    )}
                    
                    <div className="absolute bottom-2 left-2">
                      <Badge variant="outline" className="bg-background/80 text-xs">
                        <MapPin className="w-3 h-3 mr-1" />
                        {INSPECTION_PHOTOS[currentPhotoIndex].location}
                      </Badge>
                    </div>
                  </div>
                )}

                {analyzedPhotos.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {analyzedPhotos.map((photo) => (
                      <motion.button
                        key={photo.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={() => setSelectedPhoto(photo)}
                        className={cn(
                          "relative aspect-square rounded overflow-hidden border-2 transition-all",
                          selectedPhoto?.id === photo.id 
                            ? "border-primary" 
                            : "border-transparent hover:border-muted-foreground/50"
                        )}
                      >
                        <LazyImage
                          src={photo.src}
                          alt={photo.label}
                          className="w-full h-full object-cover"
                          wrapperClassName="w-full h-full"
                        />
                        <div className={cn(
                          "absolute top-1 right-1 w-2.5 h-2.5 rounded-full border border-background",
                          getSeverityDot(photo.aiAnalysis.severity)
                        )} />
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analysis results */}
        <Card className="border border-border bg-card">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">AI Detection</span>
            </div>
            {step === "complete" && (
              <div className="flex gap-2">
                {defectsFound > 0 && (
                  <Badge variant="outline" className="text-xs text-destructive border-destructive/30">
                    {defectsFound} High
                  </Badge>
                )}
                {warningsFound > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {warningsFound} Medium
                  </Badge>
                )}
              </div>
            )}
          </div>
          <CardContent className="p-4 space-y-4 max-h-[360px] overflow-y-auto">
            {step === "idle" ? (
              <p className="text-muted-foreground text-sm text-center py-6">
                AI analysis will appear here
              </p>
            ) : (
              <>
                {selectedPhoto ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-foreground">{selectedPhoto.label}</h4>
                      <Badge variant="outline" className="text-xs">
                        {selectedPhoto.aiAnalysis.severity}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <Eye className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium text-xs text-muted-foreground">DETECTED</p>
                          <p className="text-foreground">{selectedPhoto.aiAnalysis.detected}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="font-medium text-xs text-muted-foreground">FINDING</p>
                          <p className="text-foreground">{selectedPhoto.aiAnalysis.problem}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 pt-2">
                        <Progress 
                          value={selectedPhoto.aiAnalysis.confidence} 
                          className="h-1 flex-1" 
                        />
                        <span className="text-xs text-muted-foreground">
                          {selectedPhoto.aiAnalysis.confidence}%
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="space-y-2">
                    {analyzedPhotos.map((photo, i) => (
                      <motion.div
                        key={photo.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => setSelectedPhoto(photo)}
                        className={cn(
                          "p-3 rounded border-l-2 border border-border cursor-pointer transition-colors hover:bg-muted/30",
                          getSeverityStyle(photo.aiAnalysis.severity)
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm text-foreground">{photo.label}</span>
                          <Badge variant="outline" className="text-[10px]">
                            {photo.aiAnalysis.confidence}%
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {photo.aiAnalysis.problem}
                        </p>
                      </motion.div>
                    ))}
                    
                    {step !== "complete" && (
                      <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing {currentPhotoIndex + 1} of {INSPECTION_PHOTOS.length}...
                      </div>
                    )}
                  </div>
                )}

                {step === "complete" && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded border border-border bg-muted/20"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-sm text-foreground">Report Generated</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {analyzedPhotos.length} photos analyzed • {defectsFound} critical • {warningsFound} warnings
                    </p>
                  </motion.div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Comparison */}
      {showComparison && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <BeforeAfterCompare
            title="Time Saved"
            items={[
              { label: "Inspection Time", before: "4+ hours", after: "20 seconds", improvement: "720x faster" },
              { label: "Report Generation", before: "Manual entry", after: "Instant AI", improvement: "Automated" },
            ]}
          />
        </motion.div>
      )}
    </div>
  );
}