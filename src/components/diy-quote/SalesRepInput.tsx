import { memo, useState, useEffect, useCallback } from 'react';
import { User, RotateCcw, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'diy_quote_sales_rep_name';

interface SalesRepInputProps {
  value: string;
  onChange: (value: string) => void;
}

interface Rep {
  id: string;
  display_name: string;
  email: string;
  role: string;
}

export const SalesRepInput = memo(function SalesRepInput({
  value,
  onChange,
}: SalesRepInputProps) {
  const [wasAutoLoaded, setWasAutoLoaded] = useState(false);
  const [reps, setReps] = useState<Rep[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load saved name on mount
  useEffect(() => {
    const savedName = localStorage.getItem(STORAGE_KEY);
    if (savedName) {
      onChange(savedName);
      setWasAutoLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch sales reps from admin users
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke(
          'list-sales-reps',
        );
        if (cancelled) return;
        if (error) throw error;
        if (data?.success && Array.isArray(data.reps)) {
          setReps(data.reps);
          setLoadError(null);
        } else {
          throw new Error(data?.error || 'Could not load team list');
        }
      } catch (e) {
        if (cancelled) return;
        console.error('Failed to load sales reps', e);
        setLoadError(
          e instanceof Error ? e.message : 'Could not load team list',
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleChange = useCallback(
    (newValue: string) => {
      onChange(newValue);
      setWasAutoLoaded(false);
      if (newValue.trim()) {
        localStorage.setItem(STORAGE_KEY, newValue.trim());
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    },
    [onChange],
  );

  // If value isn't in the list, allow it to still display (e.g., restored from storage)
  const valueInList = reps.some((r) => r.display_name === value);
  const showFallbackInput = !!loadError;

  const reportMailto = (() => {
    const subject = encodeURIComponent('DIY Quote — Sales rep list failed to load');
    const body = encodeURIComponent(
      `Hi team,\n\nThe sales rep dropdown failed to load on the DIY Quote page.\n\nPage: ${typeof window !== 'undefined' ? window.location.href : ''}\nError: ${loadError ?? ''}\n\n(Please attach a screenshot.)`,
    );
    return `mailto:hello@alfredai.bot?subject=${subject}&body=${body}`;
  })();

  return (
    <div className="space-y-2">
      <Label
        htmlFor="sales-rep"
        className="text-sm font-medium flex items-center gap-2"
      >
        <User className="w-4 h-4 text-primary" />
        Sales Rep Name
        {wasAutoLoaded && value && (
          <Badge
            variant="secondary"
            className="text-[10px] px-1.5 py-0 h-4 font-normal gap-1"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            Restored
          </Badge>
        )}
      </Label>

      {showFallbackInput ? (
        <>
          <Input
            id="sales-rep"
            placeholder="Enter your name..."
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className="bg-background h-11"
          />
          <p className="text-xs text-amber-600 dark:text-amber-500 flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>
              Could not load the team list — typing manually instead.{' '}
              <a
                href={reportMailto}
                className="underline underline-offset-2 hover:text-amber-700"
              >
                Report this issue
              </a>
              .
            </span>
          </p>
        </>
      ) : (
        <Select
          value={valueInList ? value : ''}
          onValueChange={handleChange}
          disabled={loading}
        >
          <SelectTrigger
            id="sales-rep"
            className="bg-background h-11 min-h-[44px]"
          >
            <SelectValue
              placeholder={
                loading ? 'Loading team…' : 'Select your name…'
              }
            >
              {value || undefined}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {reps.map((rep) => (
              <SelectItem key={rep.id} value={rep.display_name}>
                <span className="flex flex-col">
                  <span className="font-medium">{rep.display_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {rep.email}
                  </span>
                </span>
              </SelectItem>
            ))}
            {reps.length === 0 && !loading && (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                No team members found
              </div>
            )}
          </SelectContent>
        </Select>
      )}

      <p className="text-xs text-muted-foreground">
        Your name will be logged with the quote and appear on exported PDFs
      </p>
    </div>
  );
});
