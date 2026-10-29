import { Search } from 'lucide-react';
import { SPOTLIGHT_OPEN_EVENT } from '@/components/admin/AdminSpotlight';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * The visible way into Spotlight.
 *
 * Spotlight shipped as ⌘K only, with nothing on screen to suggest it existed —
 * so a working feature was invisible and went unused. This is the affordance:
 * it looks like a search field, shows the shortcut so the keyboard route is
 * learnable, and collapses to an icon in a narrow sidebar.
 */
export function SpotlightTrigger({
  variant = 'field',
  className,
}: {
  /** 'field' reads as a search box; 'icon' is for tight headers. */
  variant?: 'field' | 'icon';
  className?: string;
}) {
  const open = () => document.dispatchEvent(new CustomEvent(SPOTLIGHT_OPEN_EVENT));

  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={open}
        aria-label="Search leads and pages"
        className={cn('min-h-[44px] min-w-[44px]', className)}
      >
        <Search className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={open}
      aria-label="Search leads and pages"
      className={cn(
        'flex w-full items-center gap-2 rounded-lg border border-border bg-background/60',
        'px-2.5 py-1.5 text-left text-xs text-muted-foreground',
        'transition-colors hover:bg-muted/60 hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      <Search className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1 truncate">Search…</span>
      <kbd className="hidden shrink-0 rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px] sm:inline">
        ⌘K
      </kbd>
    </button>
  );
}

export default SpotlightTrigger;
