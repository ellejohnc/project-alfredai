import { useState, useCallback, useEffect } from "react";
import { useDemoSpeed } from "@/contexts/DemoSpeedContext";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, Table2, CheckCircle, Loader2, Layers, Square, ArrowUpRight, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { sampleDocuments } from "./demoData";
import { DrawingAnnotationCanvas } from "./DrawingAnnotationCanvas";
import type { UploadedDocument } from "./types";

interface UploadStepProps {
  onComplete: (documents: UploadedDocument[]) => void;
  isActive: boolean;
}

const uploadZones = [
  {
    id: 'drawings',
    type: 'drawing' as const,
    title: 'Drawings',
    description: 'PDF plans, sections',
    icon: Layers,
    accept: '.pdf',
    color: 'from-blue-500/20 to-blue-600/10',
    borderColor: 'border-blue-300 hover:border-blue-400',
  },
  {
    id: 'scope',
    type: 'scope' as const,
    title: 'Scope',
    description: 'Briefs, specs',
    icon: FileText,
    accept: '.docx,.doc,.pdf,.txt',
    color: 'from-purple-500/20 to-purple-600/10',
    borderColor: 'border-purple-300 hover:border-purple-400',
  },
  {
    id: 'schedule',
    type: 'schedule' as const,
    title: 'Schedules',
    description: 'BOQ, finishes',
    icon: Table2,
    accept: '.xlsx,.xls,.csv',
    color: 'from-emerald-500/20 to-emerald-600/10',
    borderColor: 'border-emerald-300 hover:border-emerald-400',
  },
];

export function UploadStep({ onComplete, isActive }: UploadStepProps) {
  const { applySpeed } = useDemoSpeed();
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPhase, setUploadPhase] = useState<'idle' | 'uploading' | 'analyzing' | 'annotating' | 'complete'>('idle');
  const [currentUploadIndex, setCurrentUploadIndex] = useState(0);
  const [hasAnnotations, setHasAnnotations] = useState(false);

  // Auto-run upload simulation when step becomes active
  useEffect(() => {
    if (isActive && uploadPhase === 'idle' && uploadedDocs.length === 0) {
      simulateUpload();
    }
  }, [isActive]);

  const simulateUpload = useCallback(() => {
    setIsUploading(true);
    setUploadPhase('uploading');
    setUploadedDocs([]);
    setCurrentUploadIndex(0);

    // Simulate uploading documents one by one
    sampleDocuments.forEach((doc, index) => {
      setTimeout(() => {
        setCurrentUploadIndex(index);
        setUploadedDocs(prev => [...prev, { ...doc, uploadProgress: 0 }]);
        
        // Animate progress for each doc
        let progress = 0;
        const progressInterval = setInterval(() => {
          progress += 25;
          setUploadedDocs(prev => 
            prev.map(d => d.id === doc.id ? { ...d, uploadProgress: Math.min(progress, 100) } : d)
          );
          if (progress >= 100) clearInterval(progressInterval);
        }, 40);
      }, applySpeed(index * 100));
    });

    // Switch to analyzing phase
    setTimeout(() => {
      setUploadPhase('analyzing');
    }, applySpeed(sampleDocuments.length * 100 + 400));

    // Move to annotation phase
    setTimeout(() => {
      setUploadPhase('annotating');
      setIsUploading(false);
    }, applySpeed(sampleDocuments.length * 100 + 1500));
  }, []);

  const handleAnnotationsComplete = useCallback((annotations: unknown[]) => {
    setHasAnnotations(annotations.length > 0);
    setUploadPhase('complete');
  }, []);

  const handleProceed = () => {
    onComplete(uploadedDocs);
  };

  const drawingDocs = uploadedDocs.filter(d => d.type === 'drawing');
  const scopeDocs = uploadedDocs.filter(d => d.type === 'scope');
  const scheduleDocs = uploadedDocs.filter(d => d.type === 'schedule');

  const planCount = drawingDocs.filter(d => d.detectedType === 'plan').length;
  const sectionCount = drawingDocs.filter(d => d.detectedType === 'section').length;

  return (
    <div className="space-y-4">
      {/* Compact upload zones */}
      <div className="grid grid-cols-3 gap-2">
        {uploadZones.map((zone, idx) => {
          const zoneDocs = uploadedDocs.filter(d => d.type === zone.type);
          const Icon = zone.icon;
          const hasUploads = zoneDocs.length > 0;
          
          return (
            <motion.div
              key={zone.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={cn(
                "relative rounded-lg border-2 border-dashed p-2 transition-all",
                zone.borderColor,
                hasUploads ? "bg-muted/30" : "hover:bg-muted/20"
              )}
            >
              <div className={cn(
                "absolute inset-0 rounded-lg bg-gradient-to-br opacity-50",
                zone.color
              )} />
              
              <div className="relative space-y-1">
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded bg-background shadow-sm flex items-center justify-center">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  {hasUploads && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center"
                    >
                      <CheckCircle className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                </div>
                
                <div>
                  <h4 className="font-medium text-xs">{zone.title}</h4>
                  <p className="text-[10px] text-muted-foreground">{zone.description}</p>
                </div>
                
                {hasUploads && (
                  <div className="text-[10px] font-medium text-green-600">
                    {zoneDocs.length} file{zoneDocs.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Upload progress */}
      <AnimatePresence mode="wait">
        {uploadPhase === 'uploading' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Uploading... ({currentUploadIndex + 1}/{sampleDocuments.length})</span>
            </div>
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentUploadIndex + 1) / sampleDocuments.length) * 100}%` }}
              />
            </div>
          </motion.div>
        )}

        {uploadPhase === 'analyzing' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-100"
          >
            <div className="w-5 h-5 rounded-full border-2 border-blue-300 border-t-blue-600 animate-spin" />
            <div>
              <p className="text-xs font-medium text-blue-900">Analyzing drawings...</p>
              <p className="text-[10px] text-blue-600">Detecting {planCount} plans, {sectionCount} sections</p>
            </div>
          </motion.div>
        )}

        {uploadPhase === 'annotating' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* Detection summary */}
            <div className="flex flex-wrap gap-1.5">
              {planCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-medium">
                  <Square className="w-2.5 h-2.5" />
                  {planCount} Plans
                </span>
              )}
              {sectionCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-[10px] font-medium">
                  <ArrowUpRight className="w-2.5 h-2.5" />
                  {sectionCount} Sections
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-medium">
                {drawingDocs.length - planCount - sectionCount} Other
              </span>
            </div>

            {/* Human guidance banner */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-2 border border-amber-200">
              <p className="text-xs font-medium text-amber-900">👁️ Human Review: Guide what AI should measure</p>
              <p className="text-[10px] text-amber-700">Annotate areas, mark special items, or exclude zones</p>
            </div>

            {/* Drawing annotation canvas */}
            <DrawingAnnotationCanvas 
              onAnnotationsComplete={handleAnnotationsComplete}
              isActive={uploadPhase === 'annotating'}
            />
          </motion.div>
        )}

        {uploadPhase === 'complete' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="bg-green-50 rounded-lg p-3 border border-green-100">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900">Ready for scope confirmation</p>
                  <p className="text-xs text-green-600">
                    {uploadedDocs.length} documents • {hasAnnotations ? 'Annotations added' : 'No annotations'}
                  </p>
                </div>
              </div>
            </div>

            <Button onClick={handleProceed} className="w-full">
              Continue to Scope Confirmation
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
