import { ReactNode } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface TabOption {
  value: string;
  label: string;
  count?: number;
  icon?: ReactNode;
}

interface AdminTabsBarProps {
  tabs: TabOption[];
  activeTab: string;
  onTabChange: (value: string) => void;
  className?: string;
}

export function AdminTabsBar({ tabs, activeTab, onTabChange, className }: AdminTabsBarProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className={className}>
      <TabsList className="h-auto p-0.5 flex-wrap gap-0.5 bg-muted/40">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className={cn(
              "px-2.5 py-1 text-[11px] gap-1 data-[state=active]:bg-background",
              "data-[state=active]:shadow-none"
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1 text-muted-foreground">({tab.count})</span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
