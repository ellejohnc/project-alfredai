import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Mail, FileText, Video, Settings, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';

export function AdminMobileBottomNav() {
  const location = useLocation();
  const { isSalesRep, isDistributor, canManageContent, canViewLeads } = usePermissions();

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  // Distributors get a restricted, personal-scope bottom nav
  const distributorOnly = isDistributor && !canViewLeads;

  // Build items based on role
  const bottomNavItems = [
    { label: 'Home', icon: LayoutDashboard, path: '/admin', show: true },
    { label: distributorOnly ? 'My Leads' : 'Leads', icon: Mail, path: '/admin/leads', show: canViewLeads || distributorOnly },
    { label: distributorOnly ? 'Meetings' : 'Meetings', icon: Video, path: '/admin/meetings', show: canViewLeads || distributorOnly },
    { label: 'Quotes', icon: FileText, path: '/admin/quotes', show: distributorOnly },
    { label: 'Sales', icon: DollarSign, path: '/admin/sales-figures', show: isSalesRep },
    { label: 'Content', icon: FileText, path: '/admin/blog', show: canManageContent },
    { label: 'Settings', icon: Settings, path: '/admin/settings/account', show: !isSalesRep && !distributorOnly },
  ].filter(item => item.show);

  return (
    <nav
      data-mobile-nav
      className="fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur-lg border-t border-border lg:hidden safe-bottom"
    >
      <div className="flex items-center justify-around h-16">
        {bottomNavItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-h-[48px] transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground active:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "scale-110")} />
              <span className={cn("text-[10px] font-medium", active && "font-semibold")}>
                {item.label}
              </span>
              {active && (
                <div className="absolute top-0 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
