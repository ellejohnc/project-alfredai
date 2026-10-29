import { useState, useEffect, useCallback } from "react";
import { useDemoSpeed } from "@/contexts/DemoSpeedContext";
import { motion, AnimatePresence } from "framer-motion";
import { FileSearch, CheckCircle, Loader2, Table2, FileText, Hash, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { sampleExtractedItems, roomScheduleTable } from "./demoData";
import type { ExtractedItem, ScopeConfirmation } from "./types";

interface ExtractionStepProps {
  scope: ScopeConfirmation;
  onComplete: (items: ExtractedItem[]) => void;
  isActive: boolean;
}

const categoryConfig = {
  room: { label: 'Room Types', icon: Table2, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  finish: { label: 'Finishes', icon: FileText, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  quantity: { label: 'Quantities', icon: Hash, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  spec: { label: 'Specifications', icon: Settings, color: 'text-amber-600', bgColor: 'bg-amber-50' },
};

export function ExtractionStep({ scope, onComplete, isActive }: ExtractionStepProps) {
  const { applySpeed } = useDemoSpeed();
  const [extractedItems, setExtractedItems] = useState<ExtractedItem[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionPhase, setExtractionPhase] = useState<'idle' | 'scanning' | 'extracting' | 'complete'>('idle');
  const [currentCategory, setCurrentCategory] = useState<string>('');
  const [highlightedRow, setHighlightedRow] = useState<number>(-1);

  // Auto-start extraction when step becomes active
  useEffect(() => {
    if (isActive && extractionPhase === 'idle') {
      startExtraction();
    }
  }, [isActive]);

  const startExtraction = useCallback(() => {
    setIsExtracting(true);
    setExtractionPhase('scanning');
    setExtractedItems([]);

    // Scanning phase - highlight rows in schedule
    let rowIndex = 0;
    const scanInterval = setInterval(() => {
      setHighlightedRow(rowIndex);
      rowIndex++;
      if (rowIndex >= roomScheduleTable.rows.length) {
        clearInterval(scanInterval);
        setHighlightedRow(-1);
        setExtractionPhase('extracting');
        extractItems();
      }
    }, applySpeed(200));
  }, []);

  const extractItems = useCallback(() => {
    const categories = ['room', 'finish', 'quantity', 'spec'];
    let categoryIndex = 0;
    
    const extractCategory = () => {
      if (categoryIndex >= categories.length) {
        setExtractionPhase('complete');
        setIsExtracting(false);
        setCurrentCategory('');
        return;
      }
      
      const category = categories[categoryIndex];
      setCurrentCategory(category);
      
      const categoryItems = sampleExtractedItems.filter(item => item.category === category);
      
      categoryItems.forEach((item, idx) => {
        setTimeout(() => {
          setExtractedItems(prev => [...prev, item]);
        }, applySpeed(idx * 150));
      });
      
      setTimeout(() => {
        categoryIndex++;
        extractCategory();
      }, applySpeed(categoryItems.length * 150 + 300));
    };
    
    extractCategory();
  }, []);

  const handleProceed = () => {
    onComplete(extractedItems);
  };

  const roomItems = extractedItems.filter(i => i.category === 'room');
  const finishItems = extractedItems.filter(i => i.category === 'finish');
  const quantityItems = extractedItems.filter(i => i.category === 'quantity');
  const specItems = extractedItems.filter(i => i.category === 'spec');

  return (
    <div className="space-y-4">
      {/* Split screen layout */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Left: Schedule preview */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Table2 className="w-4 h-4 text-muted-foreground" />
            <span>Room Schedule (Source)</span>
          </div>
          
          <div className="border rounded-lg overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    {roomScheduleTable.headers.map((header, idx) => (
                      <th key={idx} className="px-2 py-1.5 text-left font-medium text-muted-foreground whitespace-nowrap">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {roomScheduleTable.rows.map((row, rowIdx) => (
                    <motion.tr
                      key={rowIdx}
                      animate={{
                        backgroundColor: highlightedRow === rowIdx ? 'rgb(219 234 254)' : 'transparent',
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx} className="px-2 py-1.5 whitespace-nowrap">
                          {cell}
                        </td>
                      ))}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {extractionPhase === 'scanning' && (
            <div className="flex items-center gap-2 text-xs text-blue-600">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Scanning schedule data...</span>
            </div>
          )}
        </div>

        {/* Right: Extracted inputs */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <FileSearch className="w-4 h-4 text-muted-foreground" />
            <span>Structured Estimate Inputs</span>
          </div>
          
          <div className="border rounded-lg p-3 bg-muted/20 min-h-[160px] space-y-3">
            {/* Category progress */}
            {Object.entries(categoryConfig).map(([key, config]) => {
              const items = extractedItems.filter(i => i.category === key);
              const total = sampleExtractedItems.filter(i => i.category === key).length;
              const isActive = currentCategory === key;
              const Icon = config.icon;
              
              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={cn("flex items-center gap-1.5 font-medium", config.color)}>
                      <Icon className="w-3 h-3" />
                      {config.label}
                    </span>
                    <span className="text-muted-foreground">
                      {items.length}/{total}
                    </span>
                  </div>
                  <Progress 
                    value={(items.length / total) * 100} 
                    className={cn("h-1.5", isActive && "animate-pulse")}
                  />
                </div>
              );
            })}

            {/* Extracted items list */}
            <AnimatePresence>
              {extractedItems.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 space-y-1 max-h-24 overflow-y-auto"
                >
                  {extractedItems.slice(-6).map((item, idx) => {
                    const config = categoryConfig[item.category];
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn(
                          "flex items-center justify-between px-2 py-1 rounded text-xs",
                          config.bgColor
                        )}
                      >
                        <span className="font-medium truncate">{item.label}</span>
                        <span className="text-muted-foreground shrink-0 ml-2">{item.value}</span>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Completion state */}
      <AnimatePresence>
        {extractionPhase === 'complete' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900">Extraction complete</p>
                  <p className="text-xs text-green-600 mt-0.5">
                    {roomItems.length} rooms, {finishItems.length} finishes, {quantityItems.length} quantities, {specItems.length} specs extracted
                  </p>
                </div>
              </div>
            </div>

            <Button onClick={handleProceed} className="w-full" size="lg">
              Generate Draft Estimate
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
