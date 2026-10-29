import { memo, useState } from 'react';
import { Copy, ExternalLink, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/pricingEngine';

interface PaymentLinkRowProps {
  label: string;
  amount: number;
  url: string;
  suffix?: string; // e.g., "/mo" for monthly
  taxLabel?: string;
  currency?: 'aud' | 'usd';
}

export const PaymentLinkRow = memo(function PaymentLinkRow({
  label,
  amount,
  url,
  suffix = '',
  taxLabel = '+ GST',
  currency = 'aud',
}: PaymentLinkRowProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(`${label} link copied!`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className="p-3 bg-background rounded-lg border">
      <div className="flex items-center justify-between gap-3">
         <div className="flex-1 min-w-0">
           <p className="text-sm font-medium">{label}</p>
           {currency === 'aud' ? (
             <p className="text-xs text-muted-foreground">
               {formatCurrency(amount)}{suffix} + GST ({formatCurrency(Math.round(amount * 0.1))} GST = {formatCurrency(Math.round(amount * 1.1))}{suffix} total)
             </p>
           ) : (
             <p className="text-xs text-muted-foreground">
               {formatCurrency(amount)}{suffix} {taxLabel}
             </p>
           )}
        </div>
        <div className="flex gap-1.5 shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="h-9 gap-1.5 min-w-[44px]"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-600" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-9 gap-1.5 min-w-[44px]"
            onClick={() => window.open(url, '_blank')}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Open</span>
          </Button>
        </div>
      </div>
    </div>
  );
});
