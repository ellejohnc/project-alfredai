import { cn } from '@/lib/utils';

// Monday.com-inspired vivid status badges
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  // Lead statuses
  new: { bg: 'bg-sky-500', text: 'text-white' },
  contacted: { bg: 'bg-amber-500', text: 'text-white' },
  qualified: { bg: 'bg-violet-500', text: 'text-white' },
  converted: { bg: 'bg-emerald-500', text: 'text-white' },
  lost: { bg: 'bg-rose-500', text: 'text-white' },
  
  // Quote/proposal statuses
  draft: { bg: 'bg-slate-400', text: 'text-white' },
  sent: { bg: 'bg-blue-500', text: 'text-white' },
  viewed: { bg: 'bg-indigo-500', text: 'text-white' },
  signed: { bg: 'bg-emerald-500', text: 'text-white' },
  declined: { bg: 'bg-rose-500', text: 'text-white' },
  expired: { bg: 'bg-zinc-400', text: 'text-white' },

  // Content statuses
  published: { bg: 'bg-emerald-500', text: 'text-white' },
  archived: { bg: 'bg-zinc-400', text: 'text-white' },
  
  // Meeting statuses
  scheduled: { bg: 'bg-blue-500', text: 'text-white' },
  completed: { bg: 'bg-emerald-500', text: 'text-white' },
  cancelled: { bg: 'bg-rose-500', text: 'text-white' },
  rescheduled: { bg: 'bg-amber-500', text: 'text-white' },
  'no-show': { bg: 'bg-zinc-500', text: 'text-white' },

  // Investor statuses
  pending: { bg: 'bg-amber-500', text: 'text-white' },
  approved: { bg: 'bg-emerald-500', text: 'text-white' },
  rejected: { bg: 'bg-rose-500', text: 'text-white' },
  
  // Generic
  active: { bg: 'bg-emerald-500', text: 'text-white' },
  inactive: { bg: 'bg-zinc-400', text: 'text-white' },
  success: { bg: 'bg-emerald-500', text: 'text-white' },
  error: { bg: 'bg-rose-500', text: 'text-white' },
  warning: { bg: 'bg-amber-500', text: 'text-white' },
  info: { bg: 'bg-blue-500', text: 'text-white' },
};

interface StatusBadgeProps {
  status: string;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusBadge({ status, label, size = 'sm', className }: StatusBadgeProps) {
  const key = status.toLowerCase().replace(/[\s_]+/g, '-');
  const colors = STATUS_COLORS[key] || { bg: 'bg-muted', text: 'text-muted-foreground' };
  const displayLabel = label || status.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium whitespace-nowrap",
        colors.bg,
        colors.text,
        size === 'sm' ? 'px-2.5 py-0.5 text-[10px]' : 'px-3 py-1 text-xs',
        className
      )}
    >
      {displayLabel}
    </span>
  );
}
