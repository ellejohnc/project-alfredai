import { useState, useCallback } from "react";
import { useDemoSpeed } from "@/contexts/DemoSpeedContext";
import { InlineDemoSpeedControl } from "@/components/demos/shared/InlineDemoSpeedControl";
import { 
  generateBillBatch, 
  getBatchStats, 
  PurchaseBill, 
  Industry 
} from "./purchase-bill/purchaseBillData";
import { BillQueue } from "./purchase-bill/BillQueue";
import { BillDetailPanel } from "./purchase-bill/BillDetailPanel";
import { AIAssistPanel } from "./purchase-bill/AIAssistPanel";
import { BatchStatsHeader } from "./purchase-bill/BatchStatsHeader";
import { StatusStepper } from "./purchase-bill/StatusStepper";
import { toast } from "sonner";

export function PurchaseBillIntakeDemo() {
  const { applySpeed } = useDemoSpeed();
  const [industry, setIndustry] = useState<Industry>("construction");
  const [bills, setBills] = useState<PurchaseBill[]>(() => generateBillBatch(industry, 15));
  const [selectedBill, setSelectedBill] = useState<PurchaseBill | null>(bills[0] || null);
  const [isProcessing, setIsProcessing] = useState(false);

  const stats = getBatchStats(bills);

  const handleIndustryChange = useCallback((newIndustry: Industry) => {
    setIndustry(newIndustry);
    const newBills = generateBillBatch(newIndustry, 15);
    setBills(newBills);
    setSelectedBill(newBills[0] || null);
  }, []);

  const handleRefresh = useCallback(() => {
    const newBills = generateBillBatch(industry, 15);
    setBills(newBills);
    setSelectedBill(newBills[0] || null);
    toast.success("Bills refreshed with new data");
  }, [industry]);

  const updateBillStatus = useCallback((billId: string, newStatus: PurchaseBill["status"]) => {
    setBills(prev => prev.map(b => b.id === billId ? { ...b, status: newStatus } : b));
    setSelectedBill(prev => prev?.id === billId ? { ...prev, status: newStatus } : prev);
  }, []);

  const handleApprove = useCallback((bill: PurchaseBill) => {
    setIsProcessing(true);
    setTimeout(() => {
      updateBillStatus(bill.id, "approved");
      toast.success(`${bill.invoice_number} approved`);
      setIsProcessing(false);
    }, applySpeed(800));
  }, [updateBillStatus]);

  const handleDelegate = useCallback((bill: PurchaseBill) => {
    toast.info(`${bill.invoice_number} delegated for review`);
  }, []);

  const handleQuery = useCallback((bill: PurchaseBill) => {
    toast.info(`Query sent to ${bill.supplier_name}`);
  }, []);

  const handleSyncToXero = useCallback((bill: PurchaseBill) => {
    setIsProcessing(true);
    setTimeout(() => {
      updateBillStatus(bill.id, "synced");
      toast.success(`${bill.invoice_number} synced to Xero`);
      setIsProcessing(false);
    }, applySpeed(1500));
  }, [updateBillStatus]);

  const handleBatchProcess = useCallback(() => {
    setIsProcessing(true);
    const eligible = bills.filter(b => b.ai_recommendation === "auto_approve" && b.status !== "approved" && b.status !== "synced");
    let processed = 0;
    
    eligible.forEach((bill, idx) => {
      setTimeout(() => {
        updateBillStatus(bill.id, "approved");
        processed++;
        if (processed === eligible.length) {
          toast.success(`${eligible.length} bills auto-approved`);
          setIsProcessing(false);
        }
      }, applySpeed((idx + 1) * 300));
    });
  }, [bills, updateBillStatus]);

  return (
    <div className="flex flex-col h-full min-h-[600px] gap-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <BatchStatsHeader
            industry={industry}
            onIndustryChange={handleIndustryChange}
            stats={stats}
            onRefresh={handleRefresh}
            onBatchProcess={handleBatchProcess}
            isProcessing={isProcessing}
          />
        </div>
        <InlineDemoSpeedControl compact className="hidden sm:flex ml-2" />
      </div>

      {selectedBill && (
        <div className="bg-card border border-border rounded-lg p-3">
          <StatusStepper currentStatus={selectedBill.status} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        <div className="lg:col-span-3 h-[400px] lg:h-auto">
          <BillQueue bills={bills} selectedBillId={selectedBill?.id || null} onSelectBill={setSelectedBill} />
        </div>
        <div className="lg:col-span-5 h-[500px] lg:h-auto">
          <BillDetailPanel bill={selectedBill} />
        </div>
        <div className="lg:col-span-4 h-[450px] lg:h-auto">
          <AIAssistPanel
            bill={selectedBill}
            onApprove={handleApprove}
            onDelegate={handleDelegate}
            onQuery={handleQuery}
            onSyncToXero={handleSyncToXero}
            isProcessing={isProcessing}
          />
        </div>
      </div>
    </div>
  );
}

export default PurchaseBillIntakeDemo;
