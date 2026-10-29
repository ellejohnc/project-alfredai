import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MousePointer2, 
  Square, 
  Circle, 
  Type, 
  Trash2, 
  ZoomIn, 
  ZoomOut,
  RotateCcw,
  Check,
  Sparkles,
  Eye,
  Layers,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Drawing annotation types
interface Annotation {
  id: string;
  type: 'area' | 'point' | 'text';
  x: number;
  y: number;
  width?: number;
  height?: number;
  label: string;
  category: 'measure' | 'finish' | 'spec' | 'exclude';
  color: string;
}

interface DrawingPage {
  id: string;
  name: string;
  type: 'plan' | 'section' | 'elevation' | 'detail';
  thumbnail: string;
}

// Sample drawing pages (simulated PDFs)
const sampleDrawingPages: DrawingPage[] = [
  { id: 'page-1', name: 'Level 4 - Floor Plan', type: 'plan', thumbnail: '/placeholder.svg' },
  { id: 'page-2', name: 'Section AA', type: 'section', thumbnail: '/placeholder.svg' },
  { id: 'page-3', name: 'Reception Detail', type: 'detail', thumbnail: '/placeholder.svg' },
];

// Predefined annotation categories
const annotationCategories = [
  { id: 'measure', label: 'Measure Area', icon: Square, color: 'bg-blue-500', hint: 'Mark areas for quantity takeoff' },
  { id: 'finish', label: 'Finish Spec', icon: Eye, color: 'bg-purple-500', hint: 'Identify finish materials' },
  { id: 'spec', label: 'Special Item', icon: Sparkles, color: 'bg-amber-500', hint: 'Flag custom/special items' },
  { id: 'exclude', label: 'Exclude', icon: Trash2, color: 'bg-red-500', hint: 'Mark areas to exclude' },
];

// Predefined quick annotations for demo
const quickAnnotations: Annotation[] = [
  { id: 'q1', type: 'area', x: 15, y: 20, width: 25, height: 18, label: 'Open Plan Office', category: 'measure', color: 'blue' },
  { id: 'q2', type: 'area', x: 55, y: 15, width: 15, height: 12, label: 'Meeting Room 1', category: 'measure', color: 'blue' },
  { id: 'q3', type: 'area', x: 72, y: 15, width: 15, height: 12, label: 'Meeting Room 2', category: 'measure', color: 'blue' },
  { id: 'q4', type: 'area', x: 10, y: 65, width: 20, height: 15, label: 'Reception - Premium Finish', category: 'finish', color: 'purple' },
  { id: 'q5', type: 'point', x: 45, y: 50, label: 'Feature Joinery', category: 'spec', color: 'amber' },
  { id: 'q6', type: 'area', x: 75, y: 70, width: 18, height: 12, label: 'Exclude: Existing Kitchen', category: 'exclude', color: 'red' },
];

interface DrawingAnnotationCanvasProps {
  onAnnotationsComplete: (annotations: Annotation[]) => void;
  isActive: boolean;
}

export function DrawingAnnotationCanvas({ onAnnotationsComplete, isActive }: DrawingAnnotationCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedTool, setSelectedTool] = useState<'select' | 'area' | 'point'>('select');
  const [selectedCategory, setSelectedCategory] = useState<'measure' | 'finish' | 'spec' | 'exclude'>('measure');
  const [zoom, setZoom] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [showAIHints, setShowAIHints] = useState(true);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  // Auto-add quick annotations for demo effect
  useEffect(() => {
    if (isActive && annotations.length === 0) {
      // Simulate AI suggesting annotations
      setAiAnalyzing(true);
      const timer = setTimeout(() => {
        setAiAnalyzing(false);
        setShowAIHints(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isActive, annotations.length]);

  const getMousePosition = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (selectedTool === 'select') return;
    const pos = getMousePosition(e);
    setIsDrawing(true);
    setDrawStart(pos);
    
    if (selectedTool === 'point') {
      const newAnnotation: Annotation = {
        id: `ann-${Date.now()}`,
        type: 'point',
        x: pos.x,
        y: pos.y,
        label: `${annotationCategories.find(c => c.id === selectedCategory)?.label || 'Point'}`,
        category: selectedCategory,
        color: annotationCategories.find(c => c.id === selectedCategory)?.color.replace('bg-', '') || 'blue',
      };
      setAnnotations(prev => [...prev, newAnnotation]);
      setIsDrawing(false);
    }
  }, [selectedTool, selectedCategory, getMousePosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDrawing || !drawStart || selectedTool !== 'area') return;
    const pos = getMousePosition(e);
    setCurrentRect({
      x: Math.min(drawStart.x, pos.x),
      y: Math.min(drawStart.y, pos.y),
      width: Math.abs(pos.x - drawStart.x),
      height: Math.abs(pos.y - drawStart.y),
    });
  }, [isDrawing, drawStart, selectedTool, getMousePosition]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !currentRect || selectedTool !== 'area') {
      setIsDrawing(false);
      return;
    }
    
    if (currentRect.width > 3 && currentRect.height > 3) {
      const newAnnotation: Annotation = {
        id: `ann-${Date.now()}`,
        type: 'area',
        ...currentRect,
        label: `${annotationCategories.find(c => c.id === selectedCategory)?.label || 'Area'}`,
        category: selectedCategory,
        color: annotationCategories.find(c => c.id === selectedCategory)?.color.replace('bg-', '') || 'blue',
      };
      setAnnotations(prev => [...prev, newAnnotation]);
    }
    
    setIsDrawing(false);
    setDrawStart(null);
    setCurrentRect(null);
  }, [isDrawing, currentRect, selectedTool, selectedCategory]);

  const applyAISuggestions = () => {
    setAnnotations(quickAnnotations);
    setShowAIHints(false);
  };

  const clearAnnotations = () => {
    setAnnotations([]);
    setShowAIHints(true);
  };

  const removeAnnotation = (id: string) => {
    setAnnotations(prev => prev.filter(a => a.id !== id));
  };

  const handleComplete = () => {
    onAnnotationsComplete(annotations);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'measure': return 'border-blue-500 bg-blue-500/20';
      case 'finish': return 'border-purple-500 bg-purple-500/20';
      case 'spec': return 'border-amber-500 bg-amber-500/20';
      case 'exclude': return 'border-red-500 bg-red-500/20 border-dashed';
      default: return 'border-gray-500 bg-gray-500/20';
    }
  };

  const getPointColor = (category: string) => {
    switch (category) {
      case 'measure': return 'bg-blue-500';
      case 'finish': return 'bg-purple-500';
      case 'spec': return 'bg-amber-500';
      case 'exclude': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Tool selection - larger touch targets on mobile */}
          <TooltipProvider delayDuration={300}>
            <div className="flex items-center bg-muted rounded-lg p-0.5 sm:p-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setSelectedTool('select')}
                    className={cn(
                      "p-2 sm:p-2.5 rounded-md transition-colors touch-manipulation min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center",
                      selectedTool === 'select' ? "bg-background shadow-sm" : "hover:bg-background/50 active:bg-background/70"
                    )}
                  >
                    <MousePointer2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Select</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setSelectedTool('area')}
                    className={cn(
                      "p-2 sm:p-2.5 rounded-md transition-colors touch-manipulation min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center",
                      selectedTool === 'area' ? "bg-background shadow-sm" : "hover:bg-background/50 active:bg-background/70"
                    )}
                  >
                    <Square className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Draw Area</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setSelectedTool('point')}
                    className={cn(
                      "p-2 sm:p-2.5 rounded-md transition-colors touch-manipulation min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center",
                      selectedTool === 'point' ? "bg-background shadow-sm" : "hover:bg-background/50 active:bg-background/70"
                    )}
                  >
                    <Circle className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Add Point</TooltipContent>
              </Tooltip>
            </div>

            {/* Category selection - scrollable on mobile */}
            <div className="flex items-center gap-1 sm:gap-1.5 ml-1 sm:ml-2 overflow-x-auto">
              {annotationCategories.map((cat) => (
                <Tooltip key={cat.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setSelectedCategory(cat.id as typeof selectedCategory)}
                      className={cn(
                        "p-2 sm:p-2.5 rounded-md transition-all touch-manipulation min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center shrink-0",
                        selectedCategory === cat.id 
                          ? cn(cat.color, "text-white shadow-sm") 
                          : "bg-muted hover:bg-muted/80 active:bg-muted/60"
                      )}
                    >
                      <cat.icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">{cat.label}</p>
                    <p className="text-xs text-muted-foreground">{cat.hint}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        </div>

        {/* Zoom & actions - larger touch targets */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button 
            onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
            className="p-2 sm:p-2.5 rounded-md bg-muted hover:bg-muted/80 active:bg-muted/60 touch-manipulation min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center"
          >
            <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <span className="text-xs font-medium w-10 sm:w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button 
            onClick={() => setZoom(z => Math.min(2, z + 0.25))}
            className="p-2 sm:p-2.5 rounded-md bg-muted hover:bg-muted/80 active:bg-muted/60 touch-manipulation min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center"
          >
            <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button 
            onClick={clearAnnotations}
            className="p-2 sm:p-2.5 rounded-md bg-muted hover:bg-muted/80 active:bg-muted/60 touch-manipulation ml-1 sm:ml-2 min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center"
          >
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Page navigation - improved touch targets */}
      <div className="flex items-center justify-between bg-muted/30 rounded-lg px-2 py-1.5 sm:py-2">
        <button
          onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
          disabled={currentPage === 0}
          className="p-2 sm:p-2.5 rounded-md hover:bg-muted active:bg-muted/60 disabled:opacity-30 touch-manipulation min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs sm:text-sm font-medium">{sampleDrawingPages[currentPage].name}</span>
          <Badge variant="secondary" className="text-[10px] sm:text-xs px-1.5 sm:px-2">
            {sampleDrawingPages[currentPage].type}
          </Badge>
        </div>
        <button
          onClick={() => setCurrentPage(p => Math.min(sampleDrawingPages.length - 1, p + 1))}
          disabled={currentPage === sampleDrawingPages.length - 1}
          className="p-2 sm:p-2.5 rounded-md hover:bg-muted active:bg-muted/60 disabled:opacity-30 touch-manipulation min-w-[36px] min-h-[36px] sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Drawing canvas - touch-friendly */}
      <div 
        ref={canvasRef}
        className={cn(
          "relative bg-white border rounded-lg overflow-hidden touch-none",
          selectedTool !== 'select' ? "cursor-crosshair" : "cursor-default"
        )}
        style={{ 
          height: '220px',
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          const rect = canvasRef.current?.getBoundingClientRect();
          if (rect) {
            const syntheticEvent = {
              clientX: touch.clientX,
              clientY: touch.clientY,
            } as React.MouseEvent;
            handleMouseDown(syntheticEvent);
          }
        }}
        onTouchMove={(e) => {
          const touch = e.touches[0];
          const syntheticEvent = {
            clientX: touch.clientX,
            clientY: touch.clientY,
          } as React.MouseEvent;
          handleMouseMove(syntheticEvent);
        }}
        onTouchEnd={() => handleMouseUp()}
      >
        {/* Simulated drawing - conditional based on page type */}
        {sampleDrawingPages[currentPage].type === 'section' ? (
          /* Section Drawing AA */
          <svg 
            viewBox="0 0 100 100" 
            className="absolute inset-0 w-full h-full"
            style={{ background: '#fafafa' }}
          >
            {/* Grid lines */}
            <defs>
              <pattern id="grid-section" width="5" height="5" patternUnits="userSpaceOnUse">
                <path d="M 5 0 L 0 0 0 5" fill="none" stroke="#e5e7eb" strokeWidth="0.1"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid-section)" />
            
            {/* Ground level line */}
            <line x1="5" y1="80" x2="95" y2="80" stroke="#374151" strokeWidth="0.4"/>
            <text x="8" y="83" fontSize="1.5" fill="#64748b">GL ±0.000</text>
            
            {/* Building section outline */}
            <rect x="15" y="20" width="70" height="60" fill="none" stroke="#374151" strokeWidth="0.3"/>
            
            {/* Floor levels */}
            <line x1="15" y1="35" x2="85" y2="35" stroke="#94a3b8" strokeWidth="0.2" strokeDasharray="1"/>
            <text x="88" y="36" fontSize="1.3" fill="#64748b">Level 4</text>
            
            <line x1="15" y1="50" x2="85" y2="50" stroke="#94a3b8" strokeWidth="0.2" strokeDasharray="1"/>
            <text x="88" y="51" fontSize="1.3" fill="#64748b">Level 3</text>
            
            <line x1="15" y1="65" x2="85" y2="65" stroke="#94a3b8" strokeWidth="0.2" strokeDasharray="1"/>
            <text x="88" y="66" fontSize="1.3" fill="#64748b">Level 2</text>
            
            {/* Ceiling void indication */}
            <rect x="15" y="20" width="70" height="5" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="0.1"/>
            <text x="50" y="23" fontSize="1.2" fill="#64748b" textAnchor="middle">CEILING VOID</text>
            
            {/* Open plan area - Level 4 */}
            <rect x="18" y="26" width="30" height="8" fill="#f0f9ff" stroke="#0ea5e9" strokeWidth="0.2"/>
            <text x="33" y="31" fontSize="1.8" fill="#0369a1" textAnchor="middle">OPEN PLAN</text>
            
            {/* Meeting rooms section cut */}
            <rect x="52" y="26" width="15" height="8" fill="#faf5ff" stroke="#a855f7" strokeWidth="0.2"/>
            <text x="59.5" y="31" fontSize="1.5" fill="#7e22ce" textAnchor="middle">MTG 1</text>
            
            <rect x="68" y="26" width="14" height="8" fill="#faf5ff" stroke="#a855f7" strokeWidth="0.2"/>
            <text x="75" y="31" fontSize="1.5" fill="#7e22ce" textAnchor="middle">MTG 2</text>
            
            {/* Core/services */}
            <rect x="40" y="26" width="8" height="52" fill="#e5e7eb" stroke="#94a3b8" strokeWidth="0.2"/>
            <text x="44" y="55" fontSize="1.5" fill="#475569" textAnchor="middle" transform="rotate(-90, 44, 55)">SERVICES CORE</text>
            
            {/* Reception - Level 2 */}
            <rect x="18" y="67" width="20" height="11" fill="#fffbeb" stroke="#f59e0b" strokeWidth="0.2"/>
            <text x="28" y="74" fontSize="1.6" fill="#d97706" textAnchor="middle">RECEPTION</text>
            
            {/* Kitchen - existing */}
            <rect x="60" y="67" width="22" height="11" fill="#fef2f2" stroke="#ef4444" strokeWidth="0.2" strokeDasharray="1"/>
            <text x="71" y="74" fontSize="1.5" fill="#dc2626" textAnchor="middle">KITCHEN</text>
            <text x="71" y="77" fontSize="1.2" fill="#94a3b8" textAnchor="middle">(existing)</text>
            
            {/* Dimension lines */}
            <line x1="15" y1="15" x2="85" y2="15" stroke="#64748b" strokeWidth="0.15"/>
            <line x1="15" y1="14" x2="15" y2="16" stroke="#64748b" strokeWidth="0.15"/>
            <line x1="85" y1="14" x2="85" y2="16" stroke="#64748b" strokeWidth="0.15"/>
            <text x="50" y="14" fontSize="1.3" fill="#475569" textAnchor="middle">28.500m</text>
            
            {/* Height dimension */}
            <line x1="10" y1="20" x2="10" y2="80" stroke="#64748b" strokeWidth="0.15"/>
            <line x1="9" y1="20" x2="11" y2="20" stroke="#64748b" strokeWidth="0.15"/>
            <line x1="9" y1="80" x2="11" y2="80" stroke="#64748b" strokeWidth="0.15"/>
            <text x="7" y="50" fontSize="1.3" fill="#475569" textAnchor="middle" transform="rotate(-90, 7, 50)">12.600m</text>
            
            {/* Title block */}
            <rect x="70" y="88" width="25" height="8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.15"/>
            <text x="82" y="92" fontSize="1.5" fill="#475569" textAnchor="middle">Section AA</text>
            <text x="82" y="94.5" fontSize="1.2" fill="#94a3b8" textAnchor="middle">Sheet A-101 | 1:50</text>
          </svg>
        ) : sampleDrawingPages[currentPage].type === 'detail' ? (
          /* Reception Detail Drawing */
          <svg 
            viewBox="0 0 100 100" 
            className="absolute inset-0 w-full h-full"
            style={{ background: '#fafafa' }}
          >
            {/* Grid */}
            <defs>
              <pattern id="grid-detail" width="2.5" height="2.5" patternUnits="userSpaceOnUse">
                <path d="M 2.5 0 L 0 0 0 2.5" fill="none" stroke="#e5e7eb" strokeWidth="0.1"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid-detail)" />
            
            {/* Reception desk outline */}
            <rect x="15" y="25" width="50" height="35" fill="#fffbeb" stroke="#f59e0b" strokeWidth="0.3"/>
            <text x="40" y="35" fontSize="2.5" fill="#d97706" textAnchor="middle">RECEPTION DESK</text>
            <text x="40" y="40" fontSize="1.8" fill="#64748b" textAnchor="middle">Joinery Detail</text>
            
            {/* Desk layers */}
            <rect x="18" y="45" width="44" height="3" fill="#fef3c7" stroke="#d97706" strokeWidth="0.15"/>
            <text x="65" y="47" fontSize="1.2" fill="#475569">Solid Surface Top</text>
            
            <rect x="18" y="48" width="44" height="8" fill="#fff7ed" stroke="#d97706" strokeWidth="0.15"/>
            <text x="65" y="53" fontSize="1.2" fill="#475569">Storage Unit</text>
            
            {/* Material callouts */}
            <circle cx="25" cy="52" r="1" fill="#f59e0b"/>
            <line x1="26" y1="52" x2="75" y2="52" stroke="#f59e0b" strokeWidth="0.1"/>
            <text x="76" y="52.5" fontSize="1.1" fill="#92400e">Oak Veneer - Premium Grade</text>
            
            <circle cx="40" cy="46" r="1" fill="#a855f7"/>
            <line x1="41" y1="46" x2="75" y2="46" stroke="#a855f7" strokeWidth="0.1"/>
            <text x="76" y="46.5" fontSize="1.1" fill="#7e22ce">Corian® Glacier White</text>
            
            {/* Dimensions */}
            <line x1="18" y1="62" x2="62" y2="62" stroke="#64748b" strokeWidth="0.15"/>
            <text x="40" y="65" fontSize="1.3" fill="#475569" textAnchor="middle">2400mm</text>
            
            {/* Title block */}
            <rect x="70" y="88" width="25" height="8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.15"/>
            <text x="82" y="92" fontSize="1.5" fill="#475569" textAnchor="middle">Reception Detail</text>
            <text x="82" y="94.5" fontSize="1.2" fill="#94a3b8" textAnchor="middle">Sheet D-001 | 1:20</text>
          </svg>
        ) : (
          /* Floor Plan Drawing (default) */
          <svg 
            viewBox="0 0 100 100" 
            className="absolute inset-0 w-full h-full"
            style={{ background: '#fafafa' }}
          >
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
                <path d="M 5 0 L 0 0 0 5" fill="none" stroke="#e5e7eb" strokeWidth="0.1"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
            
            {/* Building outline */}
            <rect x="5" y="5" width="90" height="90" fill="none" stroke="#374151" strokeWidth="0.3"/>
            
            {/* Open plan office area */}
            <rect x="10" y="15" width="35" height="30" fill="#f0f9ff" stroke="#0ea5e9" strokeWidth="0.2"/>
            <text x="27" y="32" fontSize="2.5" fill="#0369a1" textAnchor="middle">OPEN PLAN</text>
            <text x="27" y="36" fontSize="1.8" fill="#64748b" textAnchor="middle">450 m²</text>
            
            {/* Meeting rooms */}
            <rect x="50" y="10" width="18" height="15" fill="#faf5ff" stroke="#a855f7" strokeWidth="0.2"/>
            <text x="59" y="18" fontSize="2" fill="#7e22ce" textAnchor="middle">MTG 1</text>
            
            <rect x="70" y="10" width="18" height="15" fill="#faf5ff" stroke="#a855f7" strokeWidth="0.2"/>
            <text x="79" y="18" fontSize="2" fill="#7e22ce" textAnchor="middle">MTG 2</text>
            
            {/* Reception */}
            <rect x="8" y="60" width="25" height="20" fill="#fffbeb" stroke="#f59e0b" strokeWidth="0.2"/>
            <text x="20" y="71" fontSize="2.2" fill="#d97706" textAnchor="middle">RECEPTION</text>
            
            {/* Kitchen */}
            <rect x="70" y="65" width="22" height="18" fill="#fef2f2" stroke="#ef4444" strokeWidth="0.2" strokeDasharray="1"/>
            <text x="81" y="75" fontSize="2" fill="#dc2626" textAnchor="middle">KITCHEN</text>
            <text x="81" y="79" fontSize="1.5" fill="#94a3b8" textAnchor="middle">(existing)</text>
            
            {/* Corridors */}
            <rect x="45" y="30" width="3" height="45" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="0.1"/>
            <rect x="10" y="48" width="80" height="3" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="0.1"/>
            
            {/* Executive offices */}
            <rect x="50" y="30" width="15" height="12" fill="#ecfdf5" stroke="#10b981" strokeWidth="0.2"/>
            <text x="57" y="37" fontSize="1.8" fill="#059669" textAnchor="middle">EXEC 1</text>
            
            <rect x="67" y="30" width="15" height="12" fill="#ecfdf5" stroke="#10b981" strokeWidth="0.2"/>
            <text x="74" y="37" fontSize="1.8" fill="#059669" textAnchor="middle">EXEC 2</text>
            
            {/* Breakout area */}
            <rect x="35" y="60" width="25" height="20" fill="#f0fdf4" stroke="#22c55e" strokeWidth="0.2"/>
            <text x="47" y="71" fontSize="2" fill="#16a34a" textAnchor="middle">BREAKOUT</text>
            
            {/* Title block */}
            <rect x="70" y="88" width="25" height="8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.15"/>
            <text x="82" y="92" fontSize="1.5" fill="#475569" textAnchor="middle">Level 4 Floor Plan</text>
            <text x="82" y="94.5" fontSize="1.2" fill="#94a3b8" textAnchor="middle">Sheet A-001 | 1:100</text>
          </svg>
        )}

        {/* Annotations overlay */}
        {annotations.map((ann) => (
          <div key={ann.id} className="absolute group">
            {ann.type === 'area' && (
              <div
                className={cn(
                  "absolute border-2 rounded transition-all",
                  getCategoryColor(ann.category)
                )}
                style={{
                  left: `${ann.x}%`,
                  top: `${ann.y}%`,
                  width: `${ann.width}%`,
                  height: `${ann.height}%`,
                }}
              >
                <span className="absolute -top-5 left-0 text-[9px] font-medium bg-background px-1 py-0.5 rounded shadow-sm whitespace-nowrap">
                  {ann.label}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); removeAnnotation(ann.id); }}
                  className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
            )}
            {ann.type === 'point' && (
              <div
                className="absolute"
                style={{
                  left: `${ann.x}%`,
                  top: `${ann.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className={cn("w-4 h-4 rounded-full border-2 border-white shadow-lg", getPointColor(ann.category))} />
                <span className="absolute top-5 left-1/2 -translate-x-1/2 text-[9px] font-medium bg-background px-1 py-0.5 rounded shadow-sm whitespace-nowrap">
                  {ann.label}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); removeAnnotation(ann.id); }}
                  className="absolute -top-1 -right-3 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Current drawing rect */}
        {currentRect && (
          <div
            className={cn(
              "absolute border-2 rounded pointer-events-none",
              getCategoryColor(selectedCategory)
            )}
            style={{
              left: `${currentRect.x}%`,
              top: `${currentRect.y}%`,
              width: `${currentRect.width}%`,
              height: `${currentRect.height}%`,
            }}
          />
        )}

        {/* AI analyzing overlay */}
        <AnimatePresence>
          {aiAnalyzing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 flex items-center justify-center"
            >
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="w-5 h-5 animate-pulse" />
                <span className="text-sm font-medium">AI analyzing drawing...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* AI suggestions banner */}
      <AnimatePresence>
        {showAIHints && !aiAnalyzing && annotations.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-3 border border-primary/20"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">AI detected areas of interest</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Review suggested annotations or draw your own to guide what Alfred measures
                </p>
              </div>
              <Button size="sm" onClick={applyAISuggestions} className="shrink-0 h-8 text-xs">
                Apply AI Suggestions
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Annotation summary */}
      {annotations.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {annotations.map((ann) => (
            <Badge
              key={ann.id}
              variant="secondary"
              className={cn(
                "text-[10px] gap-1 cursor-pointer hover:opacity-70",
                ann.category === 'measure' && "bg-blue-100 text-blue-700",
                ann.category === 'finish' && "bg-purple-100 text-purple-700",
                ann.category === 'spec' && "bg-amber-100 text-amber-700",
                ann.category === 'exclude' && "bg-red-100 text-red-700"
              )}
              onClick={() => removeAnnotation(ann.id)}
            >
              {ann.label}
              <Trash2 className="w-2.5 h-2.5" />
            </Badge>
          ))}
        </div>
      )}

      {/* Complete button */}
      <Button 
        onClick={handleComplete} 
        className="w-full" 
        disabled={annotations.length === 0}
      >
        <Check className="w-4 h-4 mr-2" />
        Confirm Annotations ({annotations.length})
      </Button>
    </div>
  );
}
