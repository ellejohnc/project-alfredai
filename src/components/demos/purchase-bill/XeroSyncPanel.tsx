import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { SafeAnimatePresence } from "@/components/ui/safe-animate-presence";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { 
  X, CheckCircle2, XCircle, AlertTriangle, 
  RefreshCw, Wifi, WifiOff, Clock, ArrowRight,
  ExternalLink, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PurchaseBill, formatCurrency } from "./purchaseBillData";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

interface SyncLogEntry {
  id: string;
  timestamp: Date;
  method: 'GET' | 'POST' | 'PUT';
  endpoint: string;
  requestBody?: object;
  responseStatus: number;
  responseTime: number;
  responseBody?: object;
  error?: string;
}

interface XeroSyncPanelProps {
  isOpen: boolean;
  onClose: () => void;
  bill: PurchaseBill | null;
  onSyncComplete: (bill: PurchaseBill) => void;
}

export function XeroSyncPanel({ isOpen, onClose, bill, onSyncComplete }: XeroSyncPanelProps) {
  const [logs, setLogs] = useState<SyncLogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [simulateErrors, setSimulateErrors] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [syncComplete, setSyncComplete] = useState(false);

  // Lock background scroll when panel is open
  useBodyScrollLock(isOpen);

  // Reset state when panel opens
  useEffect(() => {
    if (isOpen && bill) {
      setLogs([]);
      setSyncComplete(false);
      setRetryCount(0);
      setIsSyncing(true);
      simulateSync(bill);
    }
  }, [isOpen, bill]);

  const addLog = useCallback((log: Omit<SyncLogEntry, 'id'>) => {
    setLogs(prev => [...prev, { ...log, id: `log-${Date.now()}-${Math.random()}` }]);
  }, []);

  const simulateSync = useCallback(async (billToSync: PurchaseBill) => {
    // Step 1: Check connection
    await new Promise(r => setTimeout(r, 500));
    addLog({
      timestamp: new Date(),
      method: 'GET',
      endpoint: '/connections',
      responseStatus: 200,
      responseTime: 89,
      responseBody: { tenantId: "ORG-001", tenantName: "Demo Company" }
    });

    // Step 2: Look up contact
    await new Promise(r => setTimeout(r, 800));
    addLog({
      timestamp: new Date(),
      method: 'GET',
      endpoint: `/Contacts?where=Name="${encodeURIComponent(billToSync.supplier_name)}"`,
      responseStatus: 200,
      responseTime: 156,
      responseBody: { 
        Contacts: [{ ContactID: "CON-" + billToSync.supplier_id, Name: billToSync.supplier_name }]
      }
    });

    // Step 3: Simulate potential error if enabled
    if (simulateErrors && Math.random() > 0.5) {
      await new Promise(r => setTimeout(r, 1000));
      const errorType = Math.random();
      
      if (errorType < 0.33) {
        addLog({
          timestamp: new Date(),
          method: 'POST',
          endpoint: '/Invoices',
          requestBody: { Type: "ACCPAY", Contact: { ContactID: "CON-" + billToSync.supplier_id } },
          responseStatus: 401,
          responseTime: 45,
          error: "OAuth token expired. Please re-authenticate."
        });
        setIsConnected(false);
        setIsSyncing(false);
        return;
      } else if (errorType < 0.66) {
        addLog({
          timestamp: new Date(),
          method: 'POST',
          endpoint: '/Invoices',
          requestBody: { Type: "ACCPAY" },
          responseStatus: 429,
          responseTime: 32,
          error: "Rate limit exceeded. Retry after 60 seconds."
        });
        setRetryCount(prev => prev + 1);
        await new Promise(r => setTimeout(r, 2000));
        // Retry
        addLog({
          timestamp: new Date(),
          method: 'POST',
          endpoint: '/Invoices (retry)',
          requestBody: { Type: "ACCPAY" },
          responseStatus: 201,
          responseTime: 312,
          responseBody: { InvoiceID: "INV-" + billToSync.id.slice(0, 8) }
        });
      } else {
        addLog({
          timestamp: new Date(),
          method: 'POST',
          endpoint: '/Invoices',
          requestBody: { Type: "ACCPAY" },
          responseStatus: 400,
          responseTime: 78,
          error: `Validation Error: Duplicate invoice number ${billToSync.invoice_number}`
        });
        setIsSyncing(false);
        return;
      }
    } else {
      // Normal flow - create invoice
      await new Promise(r => setTimeout(r, 1200));
      addLog({
        timestamp: new Date(),
        method: 'POST',
        endpoint: '/Invoices',
        requestBody: {
          Type: "ACCPAY",
          Contact: { ContactID: "CON-" + billToSync.supplier_id },
          InvoiceNumber: billToSync.invoice_number,
          Reference: billToSync.po_reference || "",
          LineItems: billToSync.line_items.map(li => ({
            Description: li.description,
            Quantity: li.quantity,
            UnitAmount: li.unit_price,
            AccountCode: "200"
          })),
          DueDate: billToSync.due_date.toISOString().split('T')[0],
          Total: billToSync.total_amount
        },
        responseStatus: 201,
        responseTime: 312,
        responseBody: {
          InvoiceID: "INV-" + billToSync.id.slice(0, 8),
          InvoiceNumber: billToSync.invoice_number,
          Status: "AUTHORISED",
          Total: billToSync.total_amount
        }
      });
    }

    // Step 4: Confirm sync
    await new Promise(r => setTimeout(r, 500));
    addLog({
      timestamp: new Date(),
      method: 'GET',
      endpoint: `/Invoices/INV-${billToSync.id.slice(0, 8)}`,
      responseStatus: 200,
      responseTime: 98,
      responseBody: {
        InvoiceID: "INV-" + billToSync.id.slice(0, 8),
        Status: "AUTHORISED",
        SentToContact: false
      }
    });

    setIsSyncing(false);
    setSyncComplete(true);
  }, [addLog, simulateErrors]);

  const handleRetry = useCallback(() => {
    if (bill) {
      setIsConnected(true);
      setIsSyncing(true);
      setRetryCount(prev => prev + 1);
      simulateSync(bill);
    }
  }, [bill, simulateSync]);

  const handleComplete = useCallback(() => {
    if (bill) {
      onSyncComplete(bill);
    }
  }, [bill, onSyncComplete]);

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "text-green-500";
    if (status >= 400 && status < 500) return "text-amber-500";
    return "text-red-500";
  };

  const getStatusBadge = (status: number) => {
    if (status >= 200 && status < 300) return "bg-green-500/10 text-green-500 border-green-500/30";
    if (status >= 400 && status < 500) return "bg-amber-500/10 text-amber-500 border-amber-500/30";
    return "bg-red-500/10 text-red-500 border-red-500/30";
  };

  if (!isOpen) return null;

  return (
    <SafeAnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-0 h-full w-full max-w-lg bg-card border-l border-border shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <img 
                  src="https://www.xero.com/etc.clientlibs/xero-cms/clientlibs/clientlib-base/resources/images/xero-logo.svg" 
                  alt="Xero" 
                  className="w-6 h-6"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Xero Sync</h3>
                <p className="text-xs text-muted-foreground">
                  {bill?.invoice_number || "No invoice selected"}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Connection Status */}
          <div className="p-4 border-b border-border bg-muted/30">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm font-medium">
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
                <Badge variant="outline" className="text-xs">
                  OAuth 2.0
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                api.xero.com
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Simulate Errors</span>
              <Switch 
                checked={simulateErrors} 
                onCheckedChange={setSimulateErrors}
                disabled={isSyncing}
              />
            </div>
          </div>

          {/* API Logs */}
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="p-4 space-y-3">
              {logs.length === 0 && isSyncing && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Initializing sync...</span>
                </div>
              )}
              
              {logs.map((log, index) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-muted/50 rounded-lg p-3 font-mono text-xs space-y-2"
                >
                  {/* Request line */}
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      [{log.timestamp.toLocaleTimeString()}]
                    </span>
                    <Badge variant="outline" className="text-[10px] px-1.5">
                      {log.method}
                    </Badge>
                    <span className="text-foreground truncate flex-1">
                      {log.endpoint}
                    </span>
                  </div>

                  {/* Request body (if present) */}
                  {log.requestBody && (
                    <details className="text-muted-foreground">
                      <summary className="cursor-pointer hover:text-foreground">
                        Request Body
                      </summary>
                      <pre className="mt-1 p-2 bg-background rounded text-[10px] overflow-x-auto">
                        {JSON.stringify(log.requestBody, null, 2).slice(0, 300)}
                        {JSON.stringify(log.requestBody).length > 300 && '...'}
                      </pre>
                    </details>
                  )}

                  {/* Response */}
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <Badge className={cn("text-[10px]", getStatusBadge(log.responseStatus))}>
                      {log.responseStatus}
                    </Badge>
                    <span className="text-muted-foreground">
                      {log.responseTime}ms
                    </span>
                    {log.error && (
                      <span className="text-red-500 flex-1 truncate">
                        {log.error}
                      </span>
                    )}
                  </div>

                  {/* Response body (if present and no error) */}
                  {log.responseBody && !log.error && (
                    <details className="text-muted-foreground">
                      <summary className="cursor-pointer hover:text-foreground">
                        Response Body
                      </summary>
                      <pre className="mt-1 p-2 bg-background rounded text-[10px] overflow-x-auto">
                        {JSON.stringify(log.responseBody, null, 2)}
                      </pre>
                    </details>
                  )}
                </motion.div>
              ))}

              {/* Syncing indicator */}
              {isSyncing && logs.length > 0 && (
                <div className="flex items-center gap-2 text-muted-foreground py-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Processing...</span>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card">
            {!isConnected && (
              <Button onClick={handleRetry} className="w-full gap-2">
                <RefreshCw className="w-4 h-4" />
                Reconnect & Retry
              </Button>
            )}

            {isConnected && !isSyncing && !syncComplete && logs.some(l => l.error) && (
              <Button onClick={handleRetry} variant="outline" className="w-full gap-2">
                <RefreshCw className="w-4 h-4" />
                Retry Sync {retryCount > 0 && `(Attempt ${retryCount + 1})`}
              </Button>
            )}

            {syncComplete && (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-green-500 py-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">Sync Complete</span>
                </div>
                <Button onClick={handleComplete} className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                  Done
                </Button>
              </div>
            )}

            {isSyncing && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Syncing to Xero...</span>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </SafeAnimatePresence>
  );
}

export default XeroSyncPanel;
