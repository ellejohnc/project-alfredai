import { useMemo, useState } from "react";
import { ComplianceVendor, getDocumentTypeLabel, getStatusColor, formatDate } from "./vendorComplianceData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Users, 
  Search, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Mail,
  MessageSquare,
  Phone,
  ChevronRight,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VendorDashboardProps {
  vendors: ComplianceVendor[];
  onSelectVendor?: (vendor: ComplianceVendor) => void;
}

export function VendorDashboard({ vendors, onSelectVendor }: VendorDashboardProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tradeFilter, setTradeFilter] = useState<string>("all");

  // Get unique trades
  const trades = useMemo(() => {
    const uniqueTrades = [...new Set(vendors.map(v => v.trade))];
    return uniqueTrades.sort();
  }, [vendors]);

  const filteredVendors = useMemo(() => {
    return vendors.filter(v => {
      const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.contact_name.toLowerCase().includes(search.toLowerCase()) ||
        v.trade.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || v.overall_status === statusFilter;
      const matchesTrade = tradeFilter === "all" || v.trade === tradeFilter;
      return matchesSearch && matchesStatus && matchesTrade;
    });
  }, [vendors, search, statusFilter, tradeFilter]);

  const getStatusIcon = (status: ComplianceVendor["overall_status"]) => {
    switch (status) {
      case "compliant": return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "expiring": return <Clock className="w-4 h-4 text-amber-500" />;
      case "non_compliant": return <AlertTriangle className="w-4 h-4 text-rose-500" />;
    }
  };

  const getChannelIcon = (channel: ComplianceVendor["preferred_channel"]) => {
    switch (channel) {
      case "email": return <Mail className="w-3 h-3" />;
      case "sms": return <MessageSquare className="w-3 h-3" />;
      case "voice": return <Phone className="w-3 h-3" />;
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Vendor Dashboard
          <Badge variant="secondary" className="ml-auto">
            {filteredVendors.length} / {vendors.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden flex flex-col gap-3">
        {/* Search and Filters - touch-friendly */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[150px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search vendors..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-11 min-h-[44px]"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[140px] h-11 min-h-[44px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="compliant">🟢 Compliant</SelectItem>
              <SelectItem value="expiring">🟡 Expiring</SelectItem>
              <SelectItem value="non_compliant">🔴 Non-Compliant</SelectItem>
            </SelectContent>
          </Select>
          <Select value={tradeFilter} onValueChange={setTradeFilter}>
            <SelectTrigger className="w-full sm:w-[140px] h-11 min-h-[44px]">
              <SelectValue placeholder="Trade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trades</SelectItem>
              {trades.map(trade => (
                <SelectItem key={trade} value={trade}>{trade}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Vendor Grid - responsive single column on mobile */}
        <ScrollArea className="flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 pr-3">
            {filteredVendors.map(vendor => (
              <VendorCard 
                key={vendor.id} 
                vendor={vendor}
                onSelect={() => onSelectVendor?.(vendor)}
                getStatusIcon={getStatusIcon}
                getChannelIcon={getChannelIcon}
              />
            ))}
            
            {filteredVendors.length === 0 && (
              <div className="col-span-2 text-center py-8 text-muted-foreground text-sm">
                No vendors match your filters
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function VendorCard({ 
  vendor, 
  onSelect,
  getStatusIcon,
  getChannelIcon
}: { 
  vendor: ComplianceVendor;
  onSelect: () => void;
  getStatusIcon: (status: ComplianceVendor["overall_status"]) => React.ReactNode;
  getChannelIcon: (channel: ComplianceVendor["preferred_channel"]) => React.ReactNode;
}) {
  const docStats = useMemo(() => {
    const current = vendor.documents.filter(d => d.status === "current").length;
    const expiring = vendor.documents.filter(d => d.status === "expiring_soon").length;
    const expired = vendor.documents.filter(d => d.status === "expired" || d.status === "missing").length;
    return { current, expiring, expired, total: vendor.documents.length };
  }, [vendor.documents]);

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left p-4 rounded-lg border transition-all duration-200 touch-manipulation min-h-[80px]",
        "hover:bg-muted/50 hover:border-primary/30 active:bg-muted/70",
        vendor.overall_status === "compliant" && "border-emerald-200 dark:border-emerald-800/50",
        vendor.overall_status === "expiring" && "border-amber-200 dark:border-amber-800/50",
        vendor.overall_status === "non_compliant" && "border-rose-200 dark:border-rose-800/50"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {getStatusIcon(vendor.overall_status)}
            <span className="font-medium text-sm truncate">{vendor.name}</span>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {vendor.trade} • {vendor.contact_name}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
        <div className="flex items-center gap-2">
          <FileText className="w-3 h-3 text-muted-foreground" />
          <div className="flex items-center gap-1 text-xs">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">{docStats.current}</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-amber-600 dark:text-amber-400 font-medium">{docStats.expiring}</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-rose-600 dark:text-rose-400 font-medium">{docStats.expired}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          {getChannelIcon(vendor.preferred_channel)}
          <span className="text-[10px] uppercase">{vendor.preferred_channel}</span>
        </div>
      </div>
    </button>
  );
}

export default VendorDashboard;
