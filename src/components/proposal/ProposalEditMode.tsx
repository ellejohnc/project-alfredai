import { useState, useCallback, useRef, useEffect, memo } from 'react';
import { Pencil, Save, X, Loader2, Check, Lock, Shield, Target, Zap, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AdminPasswordDialog } from './AdminPasswordDialog';
import { cn } from '@/lib/utils';

interface ProposalEditModeProps {
  quoteId: string;
  data: any;
  onUpdate: (updatedData: any) => void;
  onCancel: () => void;
}

export const ProposalEditMode = memo(function ProposalEditMode({
  quoteId,
  data,
  onUpdate,
  onCancel
}: ProposalEditModeProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isPriceUnlocked, setIsPriceUnlocked] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [editedData, setEditedData] = useState({
    transcript_summary: data.transcript_summary || '',
    notes: data.notes || '',
    challenges: data.challenges || [],
    setup_fee_final: data.setup_fee_final || Math.round(((data.setup_fee_min || 0) + (data.setup_fee_max || 0)) / 2),
    monthly_retainer_final: data.monthly_retainer_final || Math.round(((data.monthly_retainer_min || 0) + (data.monthly_retainer_max || 0)) / 2),
    roi_conservative: data.roi_conservative ?? 5,
    roi_likely: data.roi_likely ?? 10,
    roi_best: data.roi_best ?? 20,
  });
  const [newChallenge, setNewChallenge] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleResetToV1 = useCallback(async () => {
    setIsResetting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        toast.error('Please log in to reset versions');
        return;
      }

      // Get the quote's internal ID
      const { data: quoteData, error: qErr } = await supabase
        .from('quotes')
        .select('id')
        .eq('quote_id', quoteId)
        .maybeSingle();

      if (qErr || !quoteData) throw new Error('Quote not found');

      // Check if there's any version history to clear
      const { count, error: countErr } = await supabase
        .from('quote_versions')
        .select('*', { count: 'exact', head: true })
        .eq('quote_id', quoteData.id);

      if (countErr) throw countErr;

      if (!count || count === 0) {
        toast.info('No version history found — already at Revision 1');
        setShowResetConfirm(false);
        return;
      }

      // The current quote content stays as-is (it becomes the new Revision 1).
      // Just delete all version history to archive previous revisions.
      await supabase
        .from('quote_versions')
        .delete()
        .eq('quote_id', quoteData.id);

      setShowResetConfirm(false);
      toast.success('Current proposal is now Revision 1. All previous version history cleared.');
    } catch (err) {
      console.error('Reset error:', err);
      toast.error(err.message || 'Failed to reset to Revision 1');
    } finally {
      setIsResetting(false);
    }
  }, [quoteId]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        toast.error('Please log in to edit proposals');
        return;
      }

      const { data: result, error } = await supabase.functions.invoke('update-proposal-content', {
        body: {
          quoteId,
          updates: editedData,
          editorEmail: session.session.user.email
        },
        headers: {
          Authorization: `Bearer ${session.session.access_token}`
        }
      });

      // Fallback: if the function returned a non-2xx, read the real message from the response body
      let serverError: string | null = result?.error ?? null;
      if (error && !serverError) {
        try {
          const ctx = (error as any)?.context;
          if (ctx && typeof ctx.json === 'function') {
            const body = await ctx.json();
            serverError = body?.error ?? null;
          }
        } catch {
          /* ignore body parse failures */
        }
      }

      if (error || !result?.success) {
        throw new Error(serverError || error?.message || 'Failed to save changes');
      }

      toast.success('Changes saved successfully');
      onUpdate(result.quote);
    } catch (err) {
      console.error('Save error:', err);
      const message = err?.message || 'Failed to save changes';
      toast.error(message, {
        description: 'Your edits are still on screen — you can retry or report this.',
        action: {
          label: 'Email support',
          onClick: () => {
            const subject = encodeURIComponent(`Proposal save failed (${quoteId})`);
            const body = encodeURIComponent(
              `Error: ${message}\nPage: ${window.location.href}\n\nPlease attach a screenshot of this page.`,
            );
            window.location.href = `mailto:support@alfredai.bot?subject=${subject}&body=${body}`;
          },
        },
      });
    } finally {
      setIsSaving(false);
    }

  }, [quoteId, editedData, onUpdate]);

  const addChallenge = useCallback(() => {
    if (newChallenge.trim()) {
      setEditedData(prev => ({
        ...prev,
        challenges: [...prev.challenges, newChallenge.trim()]
      }));
      setNewChallenge('');
    }
  }, [newChallenge]);

  const removeChallenge = useCallback((index: number) => {
    setEditedData(prev => ({
      ...prev,
      challenges: prev.challenges.filter((_: string, i: number) => i !== index)
    }));
  }, []);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="bg-card rounded-xl shadow-xl border p-6 space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Edit Proposal</h2>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel} disabled={isSaving}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Summary/Narrative */}
          <div className="space-y-2">
            <Label>Proposal Summary</Label>
            <Textarea
              value={editedData.transcript_summary}
              onChange={(e) => setEditedData(prev => ({ ...prev, transcript_summary: e.target.value }))}
              placeholder="Enter the proposal summary/narrative..."
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              This is the main narrative that appears at the top of the proposal.
            </p>
          </div>

          {/* Challenges */}
          <div className="space-y-2">
            <Label>Pain Points & Challenges</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {editedData.challenges.map((challenge: string, index: number) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="gap-1 pr-1 cursor-pointer hover:bg-destructive/10"
                  onClick={() => removeChallenge(index)}
                >
                  {challenge}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newChallenge}
                onChange={(e) => setNewChallenge(e.target.value)}
                placeholder="Add a challenge..."
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addChallenge())}
              />
              <Button variant="outline" onClick={addChallenge}>
                Add
              </Button>
            </div>
          </div>

          {/* ROI Scenarios */}
          <div className="space-y-4">
            <div>
              <Label>ROI Scenarios (%)</Label>
              <p className="text-xs text-muted-foreground">Click on any ROI value to override the calculated percentage.</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <InlineROIEditor
                label="Guaranteed"
                icon={Shield}
                color="blue"
                value={editedData.roi_conservative}
                onChange={(v) => setEditedData(prev => ({ ...prev, roi_conservative: v }))}
              />
              <InlineROIEditor
                label="Most Likely"
                icon={Target}
                color="green"
                value={editedData.roi_likely}
                onChange={(v) => setEditedData(prev => ({ ...prev, roi_likely: v }))}
              />
              <InlineROIEditor
                label="Best Case"
                icon={Zap}
                color="amber"
                value={editedData.roi_best}
                onChange={(v) => setEditedData(prev => ({ ...prev, roi_best: v }))}
              />
            </div>
          </div>

          {/* Pricing - Password Protected */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Investment Amounts</Label>
                <p className="text-xs text-muted-foreground">Set the definitive amounts to present to the client.</p>
              </div>
              {!isPriceUnlocked && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPasswordDialog(true)}
                  className="gap-2"
                >
                  <Lock className="w-4 h-4" />
                  Unlock Pricing
                </Button>
              )}
              {isPriceUnlocked && (
                <Badge variant="secondary" className="gap-1 text-green-600">
                  <Check className="w-3 h-3" />
                  Unlocked
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Setup Fee (One-time)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">$</span>
                  <Input
                    type="number"
                    value={editedData.setup_fee_final}
                    onChange={(e) => setEditedData(prev => ({ ...prev, setup_fee_final: parseInt(e.target.value) || 0 }))}
                    placeholder="Setup Fee"
                    className="font-semibold"
                    disabled={!isPriceUnlocked}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Range: ${(data.setup_fee_min || 0).toLocaleString()} - ${(data.setup_fee_max || 0).toLocaleString()}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Monthly Retainer</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">$</span>
                  <Input
                    type="number"
                    value={editedData.monthly_retainer_final}
                    onChange={(e) => setEditedData(prev => ({ ...prev, monthly_retainer_final: parseInt(e.target.value) || 0 }))}
                    placeholder="Monthly Retainer"
                    className="font-semibold"
                    disabled={!isPriceUnlocked}
                  />
                  <span className="text-muted-foreground">/mo</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Range: ${(data.monthly_retainer_min || 0).toLocaleString()} - ${(data.monthly_retainer_max || 0).toLocaleString()}/mo
                </p>
              </div>
            </div>
            
            {!isPriceUnlocked && (
              <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3">
                <Lock className="w-4 h-4" />
                Click "Unlock Pricing" and verify your admin password to edit investment amounts.
              </div>
            )}
          </div>

          {/* Internal Notes */}
          <div className="space-y-2">
            <Label>Internal Notes</Label>
            <Textarea
              value={editedData.notes}
              onChange={(e) => setEditedData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add internal notes (visible on proposal)..."
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between gap-2 bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="w-4 h-4 text-green-500" />
              Changes are automatically versioned. You can view version history in the admin panel.
            </div>
            {!showResetConfirm ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0 gap-1.5 min-h-[44px]"
                onClick={() => setShowResetConfirm(true)}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset to v1
              </Button>
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-destructive font-medium">This will delete all version history</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-[44px]"
                  onClick={() => setShowResetConfirm(false)}
                  disabled={isResetting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1.5 min-h-[44px]"
                  onClick={handleResetToV1}
                  disabled={isResetting}
                >
                  {isResetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                  Confirm Reset
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Admin Password Dialog */}
      <AdminPasswordDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
        onSuccess={() => setIsPriceUnlocked(true)}
        title="Unlock Price Editing"
        description="Enter your admin password to edit the investment amounts on this proposal."
      />
    </div>
  );
});

/** Inline ROI editor – click to edit, Enter to confirm */
function InlineROIEditor({
  label,
  icon: Icon,
  color,
  value,
  onChange,
}: {
  label: string;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'amber';
  value: number;
  onChange: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (!editing) setDraft(String(value)); }, [value, editing]);
  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);

  const commit = useCallback(() => {
    const parsed = parseFloat(draft);
    if (!isNaN(parsed)) onChange(Math.round(parsed * 100) / 100);
    setEditing(false);
  }, [draft, onChange]);

  const colorMap = {
    blue: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800',
    green: 'text-green-600 bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800',
    amber: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800',
  };

  return (
    <div className={cn('rounded-lg border p-3 space-y-1', colorMap[color])}>
      <div className="flex items-center gap-1.5 text-xs font-medium">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      {editing ? (
        <div className="flex items-center gap-1">
          <input
            ref={inputRef}
            type="number"
            step="0.1"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
            onBlur={commit}
            className="w-full h-8 text-lg font-bold rounded border border-primary bg-background px-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <span className="text-sm font-semibold">%</span>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-1 group cursor-pointer"
          title="Click to edit"
        >
          <span className="text-xl font-bold">{value}%</span>
          <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      )}
    </div>
  );
}