import { useState, ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// Monday.com-style color accents for groups
const GROUP_COLORS = [
  'border-l-sky-500',
  'border-l-violet-500',
  'border-l-emerald-500',
  'border-l-amber-500',
  'border-l-rose-500',
  'border-l-indigo-500',
  'border-l-cyan-500',
  'border-l-pink-500',
];

const GROUP_BG_COLORS = [
  'bg-sky-500',
  'bg-violet-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-indigo-500',
  'bg-cyan-500',
  'bg-pink-500',
];

interface AdminTableGroupProps {
  label: string;
  count: number;
  colorIndex?: number;
  defaultOpen?: boolean;
  children: ReactNode;
  className?: string;
}

export function AdminTableGroup({
  label,
  count,
  colorIndex = 0,
  defaultOpen = true,
  children,
  className,
}: AdminTableGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const borderColor = GROUP_COLORS[colorIndex % GROUP_COLORS.length];
  const bgColor = GROUP_BG_COLORS[colorIndex % GROUP_BG_COLORS.length];
  const Icon = isOpen ? ChevronDown : ChevronRight;

  return (
    <div className={cn("border-l-[3px] rounded-sm", borderColor, className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full px-3 py-2 hover:bg-muted/50 transition-colors text-left min-h-[40px]"
      >
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm font-semibold text-foreground">{label}</span>
        <span
          className={cn(
            "text-[10px] font-medium text-white rounded-full px-2 py-0.5 min-w-[20px] text-center",
            bgColor
          )}
        >
          {count}
        </span>
      </button>
      {isOpen && <div>{children}</div>}
    </div>
  );
}
