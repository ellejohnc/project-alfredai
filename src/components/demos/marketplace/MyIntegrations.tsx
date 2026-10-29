import { motion } from "framer-motion";
import { 
  RefreshCw, 
  Pause, 
  Settings, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Clock,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Integration } from "./types";
import { toast } from "sonner";

interface MyIntegrationsProps {
  integrations: Integration[];
  onConfigure: (integration: Integration) => void;
}

const mockSyncData: Record<string, { lastSync: string; records: number; status: "connected" | "syncing" | "error" | "paused" }> = {
  "chatgpt": { lastSync: "2 min ago", records: 1250, status: "connected" },
  "hubspot": { lastSync: "Just now", records: 4890, status: "syncing" },
  "gmail-api": { lastSync: "5 min ago", records: 8920, status: "connected" },
  "xero": { lastSync: "15 min ago", records: 2340, status: "connected" },
  "shopify": { lastSync: "1 hour ago", records: 560, status: "paused" },
  "github": { lastSync: "30 min ago", records: 128, status: "connected" },
  "calendly": { lastSync: "10 min ago", records: 89, status: "connected" },
  "zapier": { lastSync: "Error", records: 0, status: "error" },
};

export default function MyIntegrations({ integrations, onConfigure }: MyIntegrationsProps) {
  const installedIntegrations = integrations.filter(i => i.installed);

  if (installedIntegrations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Settings className="w-8 h-8 text-muted-foreground" />
        </div>
        <h4 className="font-semibold mb-2">No Integrations Yet</h4>
        <p className="text-sm text-muted-foreground max-w-xs">
          Browse the marketplace to connect your first integration
        </p>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "syncing":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "paused":
        return <Pause className="w-4 h-4 text-amber-500" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "connected":
        return "Connected";
      case "syncing":
        return "Syncing...";
      case "error":
        return "Error";
      case "paused":
        return "Paused";
      default:
        return "Connected";
    }
  };

  return (
    <div className="space-y-3">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2 p-3 bg-muted/30 rounded-xl">
        <div className="text-center">
          <div className="text-lg font-bold text-primary">{installedIntegrations.length}</div>
          <div className="text-[10px] text-muted-foreground">Connected</div>
        </div>
        <div className="text-center border-x border-border">
          <div className="text-lg font-bold text-green-500">
            {installedIntegrations.filter(i => mockSyncData[i.id]?.status === "connected").length}
          </div>
          <div className="text-[10px] text-muted-foreground">Healthy</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-foreground">
            {Object.values(mockSyncData).reduce((acc, d) => acc + d.records, 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-muted-foreground">Records</div>
        </div>
      </div>

      {/* Integration List */}
      <div className="space-y-2 max-h-[280px] overflow-y-auto">
        {installedIntegrations.map((integration, idx) => {
          const syncData = mockSyncData[integration.id] || { lastSync: "Never", records: 0, status: "connected" };
          
          return (
            <motion.div
              key={integration.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={cn(
                "p-3 rounded-xl border transition-all",
                syncData.status === "error" 
                  ? "bg-red-500/5 border-red-500/20" 
                  : "bg-card border-border hover:border-primary/40"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br",
                  integration.color
                )}>
                  <integration.icon className="w-5 h-5 text-primary" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm truncate">{integration.name}</h4>
                    {getStatusIcon(syncData.status)}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {syncData.lastSync}
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {syncData.records.toLocaleString()} records
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7"
                    onClick={() => toast.info("Syncing...", { description: `Refreshing ${integration.name} data` })}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7"
                    onClick={() => onConfigure(integration)}
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => toast.info("Demo Mode", { description: "In production, this would disconnect the integration" })}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {syncData.status === "error" && (
                <div className="mt-2 px-2 py-1.5 bg-red-500/10 rounded-lg text-xs text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-3 h-3" />
                  Connection failed. Click refresh to retry.
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
