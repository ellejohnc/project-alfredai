import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Users, Check, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RepVariantGroup {
  canonical: string;
  variants: { name: string; count: number; quoteIds: string[] }[];
  totalQuotes: number;
}

interface SalesRepMergeModalProps {
  group: RepVariantGroup | null;
  onClose: () => void;
  onMerged: (mergedIds: string[]) => void;
}

export function SalesRepMergeModal({ group, onClose, onMerged }: SalesRepMergeModalProps) {
  const [isMerging, setIsMerging] = useState(false);
  const [selectedName, setSelectedName] = useState('');
  const [customName, setCustomName] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  // Reset when group changes
  const handleOpen = (open: boolean) => {
    if (!open) {
      onClose();
      return;
    }
  };

  if (!group) return null;

  const allVariants = group.variants;
  const finalName = useCustom ? customName.trim() : selectedName;
  const canMerge = finalName.length > 0;

  // IDs to update (all quotes not already using the final name)
  const idsToUpdate = allVariants
    .filter(v => v.name !== finalName)
    .flatMap(v => v.quoteIds);

  const handleMerge = async () => {
    if (!canMerge || idsToUpdate.length === 0) {
      toast.info('Nothing to merge — all quotes already use this name.');
      return;
    }
    setIsMerging(true);
    try {
      const { error } = await supabase
        .from('quotes')
        .update({ created_by: finalName, updated_at: new Date().toISOString() })
        .in('id', idsToUpdate);

      if (error) throw error;

      toast.success(`Merged ${idsToUpdate.length} quote(s) under "${finalName}"`);
      onMerged(idsToUpdate);
      onClose();
    } catch (err) {
      console.error('Merge failed:', err);
      toast.error('Failed to merge. Please try again or email support with a screenshot.');
    } finally {
      setIsMerging(false);
    }
  };

  // Auto-select the most common variant on first render
  if (!selectedName && allVariants.length > 0) {
    const best = allVariants.reduce((a, b) => (b.count > a.count ? b : a));
    setSelectedName(best.name);
  }

  return (
    <Dialog open={!!group} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Users className="w-4 h-4 text-primary" />
            Merge Sales Rep Names
          </DialogTitle>
          <DialogDescription>
            These names look like the same person. Pick the canonical name to standardise all quotes.
          </DialogDescription>
        </DialogHeader>

        {/* Variants list */}
        <div className="space-y-3">
          <Label className="text-xs font-medium text-muted-foreground">Detected Variants</Label>
          <RadioGroup
            value={useCustom ? '__custom__' : selectedName}
            onValueChange={(val) => {
              if (val === '__custom__') {
                setUseCustom(true);
              } else {
                setUseCustom(false);
                setSelectedName(val);
              }
            }}
            className="space-y-1.5"
          >
            {allVariants.map(v => (
              <label
                key={v.name}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors min-h-[44px]",
                  !useCustom && selectedName === v.name
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-accent/50"
                )}
              >
                <RadioGroupItem value={v.name} className="shrink-0" />
                <span className="text-sm font-medium flex-1">{v.name}</span>
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  {v.count} quote{v.count !== 1 ? 's' : ''}
                </Badge>
              </label>
            ))}

            {/* Custom option */}
            <label
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors min-h-[44px]",
                useCustom
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-accent/50"
              )}
            >
              <RadioGroupItem value="__custom__" className="shrink-0" />
              <div className="flex-1 space-y-1.5">
                <span className="text-sm font-medium flex items-center gap-1.5">
                  <Pencil className="w-3 h-3" />
                  Use custom name
                </span>
                {useCustom && (
                  <Input
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Enter correct name"
                    className="h-8 text-sm"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
              </div>
            </label>
          </RadioGroup>
        </div>

        {/* Summary */}
        {canMerge && idsToUpdate.length > 0 && (
          <div className="text-xs text-muted-foreground p-2.5 rounded-lg bg-muted/50 border border-border">
            Will update <span className="font-semibold text-foreground">{idsToUpdate.length}</span> quote{idsToUpdate.length !== 1 ? 's' : ''} to use{' '}
            <span className="font-semibold text-foreground">"{finalName}"</span>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isMerging} className="min-h-[44px]">
            Cancel
          </Button>
          <Button
            onClick={handleMerge}
            disabled={isMerging || !canMerge || idsToUpdate.length === 0}
            className="min-h-[44px] gap-1.5"
          >
            {isMerging ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Merging...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Merge ({idsToUpdate.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
