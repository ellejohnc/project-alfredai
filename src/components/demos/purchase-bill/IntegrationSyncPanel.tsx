import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { cn } from "@/lib/utils";
import { PurchaseBill, formatCurrency } from "./purchaseBillData";
import {
  CONSTRUCTION_PLATFORMS,
  SYNC_TYPE_LABELS,
  SyncType,
  SyncLogEntry,
  ConstructionPlatform,
  generateMockApiResponse,
  simulatePlatformError,
} from "./integrationData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  X, Wifi, WifiOff, RefreshCw, ChevronRight, 
  CheckCircle2, AlertCircle, Loader2, Building2,
  ArrowDownToLine, ArrowUpFromLine
} from "lucide-react";
import { toast } from "sonner";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

interface IntegrationSyncPanelProps {
  isOpen: boolean;
  onClose: () => void;
  bill: PurchaseBill | null;
  onSyncComplete?: (bill: PurchaseBill, platform: string, syncType: SyncType) => void;
}

export function IntegrationSyncPanel({
  isOpen,
  onClose,
  bill,
  onSyncComplete,
}: IntegrationSyncPanelProps) {
  // Lock background scroll when panel is open
  useBodyScrollLock(isOpen);

  const [selectedPlatform, setSelectedPlatform] = useState<string>('procore');
  const [selectedSyncType, setSelectedSyncType] = useState<SyncType>('pull_po');
  const [isConnected, setIsConnected] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [logs, setLogs] = useState<SyncLogEntry[]>([]);
  const [syncComplete, setSyncComplete] = useState(false);
  const [simulateErrors, setSimulateErrors] = useState(false);

  const platform = CONSTRUCTION_PLATFORMS.find(p => p.id === selectedPlatform);
  const syncTypeInfo = SYNC_TYPE_LABELS[selectedSyncType];

  // Reset state when panel opens
  useEffect(() => {
    if (isOpen) {
      setLogs([]);
      setSyncComplete(false);
      setIsSyncing(false);
    }
  }, [isOpen]);

  const addLog = useCallback((log: Omit<SyncLogEntry, 'id'>) => {
    setLogs(prev => [...prev, { ...log, id: `log-${Date.now()}-${Math.random()}` }]);
  }, []);

  const simulateSync = useCallback(async () => {
    if (!bill || !platform) return;

    setIsSyncing(true);
    setSyncComplete(false);
    setLogs([]);

    // Get relevant endpoints for this sync type
    const endpoints = platform.endpoints.filter(e => e.syncType === selectedSyncType);
    
    for (let i = 0; i < Math.min(endpoints.length, 3); i++) {
      const endpoint = endpoints[i % endpoints.length];
      const startTime = Date.now();
      
      await new Promise(r => setTimeout(r, 500 + Math.random() * 800));
      
      // Check for simulated errors
      const error = simulateErrors ? simulatePlatformError() : null;
      
      if (error) {
        addLog({
          timestamp: new Date(),
          method: endpoint.method,
          endpoint: endpoint.path.replace('{id}', 'PRJ-001'),
          responseStatus: error.status,
          responseTime: Date.now() - startTime,
          error: error.error,
        });
        setIsSyncing(false);
        return;
      }

      const response = generateMockApiResponse(platform, selectedSyncType, {
        po_reference: bill.po_reference,
        total_amount: bill.total_amount,
        supplier_name: bill.supplier_name,
      });

      addLog({
        timestamp: new Date(),
        method: endpoint.method,
        endpoint: endpoint.path.replace('{id}', 'PRJ-001'),
        responseStatus: 200,
        responseTime: Date.now() - startTime,
        responseBody: response,
      });
    }

    setSyncComplete(true);
    setIsSyncing(false);
    
    if (onSyncComplete && bill) {
      onSyncComplete(bill, platform.name, selectedSyncType);
    }
  }, [bill, platform, selectedSyncType, simulateErrors, addLog, onSyncComplete]);

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "text-green-500";
    if (status >= 400 && status < 500) return "text-amber-500";
    return "text-red-500";
  };

  const getStatusBadge = (status: number) => {
    if (status >= 200 && status < 300) return "bg-green-500/10 text-green-600 border-green-500/30";
    if (status >= 400 && status < 500) return "bg-amber-500/10 text-amber-600 border-amber-500/30";
    return "bg-red-500/10 text-red-600 border-red-500/30";
  };

  const isPullSync = selectedSyncType.startsWith('pull') || selectedSyncType === 'verify_contract';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-end"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="h-full w-full max-w-lg bg-card border-l border-border shadow-2xl flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className={cn("p-2 rounded-lg", platform?.bgColor || "bg-muted")}
                style={{ backgroundColor: platform?.color + '20' }}
              >
                <Building2 
                  className="w-5 h-5" 
                  style={{ color: platform?.color }} 
                />
              </div>
              <div>
                <h2 className="font-semibold">Construction PM Sync</h2>
                <p className="text-xs text-muted-foreground">
                  {bill?.invoice_number || 'No bill selected'}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Platform & Sync Type Selection */}
          <div className="p-4 border-b border-border space-y-3">
            {/* Platform Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Platform</label>
              <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONSTRUCTION_PLATFORMS.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: p.color }} 
                        />
                        <span>{p.name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          ({p.category})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sync Type Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Sync Type</label>
              <Select value={selectedSyncType} onValueChange={(v) => setSelectedSyncType(v as SyncType)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SYNC_TYPE_LABELS).map(([key, info]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <span>{info.icon}</span>
                        <span>{info.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                {syncTypeInfo?.description}
              </p>
            </div>

            {/* Connection Status */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
                <span className="text-xs">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">Simulate Errors</span>
                <Switch 
                  checked={simulateErrors} 
                  onCheckedChange={setSimulateErrors} 
                />
              </div>
            </div>
          </div>

          {/* Sync Direction Indicator */}
          <div className="px-4 py-2 bg-muted/30 flex items-center justify-center gap-2">
            {isPullSync ? (
              <>
                <ArrowDownToLine className="w-4 h-4 text-blue-500" />
                <span className="text-xs">Pulling data from {platform?.name}</span>
              </>
            ) : (
              <>
                <ArrowUpFromLine className="w-4 h-4 text-green-500" />
                <span className="text-xs">Pushing data to {platform?.name}</span>
              </>
            )}
          </div>

          {/* API Logs */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {logs.length === 0 && !isSyncing && (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Click "Start Sync" to begin</p>
                </div>
              )}

              {logs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-border rounded-lg overflow-hidden"
                >
                  {/* Request Header */}
                  <div className="p-2 bg-muted/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={cn("text-[9px] py-0", log.method === 'GET' ? 'text-blue-600' : 'text-green-600')}
                      >
                        {log.method}
                      </Badge>
                      <code className="text-[10px] text-muted-foreground font-mono">
                        {log.endpoint}
                      </code>
                    </div>
                    <span className="text-[9px] text-muted-foreground">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                  </div>

                  {/* Response */}
                  <div className="p-2 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={cn("text-[9px] py-0", getStatusBadge(log.responseStatus))}
                      >
                        {log.responseStatus} {log.responseStatus === 200 ? 'OK' : log.responseStatus === 201 ? 'Created' : 'Error'}
                      </Badge>
                      <span className="text-[9px] text-muted-foreground">
                        {log.responseTime}ms
                      </span>
                    </div>

                    {log.error && (
                      <div className="p-2 mt-1 bg-red-500/10 rounded text-[10px] text-red-600">
                        {log.error}
                      </div>
                    )}

                    {log.responseBody && (
                      <pre className="p-2 mt-1 bg-muted/50 rounded text-[9px] font-mono overflow-x-auto">
                        {JSON.stringify(log.responseBody, null, 2)}
                      </pre>
                    )}
                  </div>
                </motion.div>
              ))}

              {isSyncing && (
                <div className="flex items-center justify-center gap-2 py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Syncing...</span>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer Actions */}
          <div className="p-4 border-t border-border space-y-2">
            {syncComplete ? (
              <div className="flex items-center justify-center gap-2 py-2 text-green-600">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Sync Complete</span>
              </div>
            ) : logs.some(l => l.error) ? (
              <div className="flex items-center justify-center gap-2 py-2 text-red-500">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Sync Failed</span>
              </div>
            ) : null}

            <div className="flex gap-2">
              {!isConnected && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsConnected(true)}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reconnect
                </Button>
              )}

              {logs.some(l => l.error) && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={simulateSync}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              )}

              {!syncComplete && !logs.some(l => l.error) && (
                <Button
                  className="flex-1"
                  style={{ backgroundColor: platform?.color }}
                  onClick={simulateSync}
                  disabled={isSyncing || !isConnected}
                >
                  {isSyncing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ChevronRight className="w-4 h-4 mr-2" />
                  )}
                  Start Sync
                </Button>
              )}

              {syncComplete && (
                <Button className="flex-1" onClick={onClose}>
                  Done
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default IntegrationSyncPanel;
