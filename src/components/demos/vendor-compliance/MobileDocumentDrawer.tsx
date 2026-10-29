import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader,
  DrawerTitle,
  DrawerDescription
} from "@/components/ui/drawer";
import { IncomingDocument } from "./vendorComplianceData";
import { DocumentDetailPanel } from "./DocumentDetailPanel";
import { AIVerificationPanel } from "./AIVerificationPanel";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MobileDocumentDrawerProps {
  document: IncomingDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (doc: IncomingDocument) => void;
  onReject: (doc: IncomingDocument) => void;
  onRequestUpdate: (doc: IncomingDocument, channel: "email" | "sms" | "voice") => void;
  onSyncToSharePoint: (doc: IncomingDocument) => void;
  isProcessing: boolean;
}

export function MobileDocumentDrawer({ 
  document, 
  open, 
  onOpenChange,
  onApprove,
  onReject,
  onRequestUpdate,
  onSyncToSharePoint,
  isProcessing
}: MobileDocumentDrawerProps) {
  if (!document) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="sr-only">
          <DrawerTitle>Document Details</DrawerTitle>
          <DrawerDescription>Review and verify document</DrawerDescription>
        </DrawerHeader>
        
        <ScrollArea className="flex-1 px-4 pb-4 max-h-[calc(90vh-120px)] overflow-x-hidden">
          <div className="space-y-4">
            {/* Compact Document Details */}
            <div className="[&_.h-full]:h-auto [&_[id='vc-document-detail']]:h-auto">
              <DocumentDetailPanel document={document} />
            </div>
            
            {/* Compact AI Verification */}
            <div className="[&_.h-full]:h-auto [&_[id='vc-ai-panel']]:h-auto">
              <AIVerificationPanel
                document={document}
                onApprove={onApprove}
                onReject={onReject}
                onRequestUpdate={onRequestUpdate}
                onSyncToSharePoint={onSyncToSharePoint}
                isProcessing={isProcessing}
              />
            </div>
          </div>
        </ScrollArea>

        {/* Sticky Action Buttons */}
        <div className="border-t border-border p-4 bg-background">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="default"
              className="bg-emerald-600 hover:bg-emerald-700 min-h-[48px] text-base"
              onClick={() => {
                onApprove(document);
                onOpenChange(false);
              }}
              disabled={isProcessing || document.status === "verified"}
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-5 h-5 mr-2" />
              )}
              Approve
            </Button>
            <Button
              variant="outline"
              className="border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-700 dark:text-rose-400 dark:hover:bg-rose-950/30 min-h-[48px] text-base"
              onClick={() => {
                onReject(document);
                onOpenChange(false);
              }}
              disabled={isProcessing || document.status === "rejected"}
            >
              <XCircle className="w-5 h-5 mr-2" />
              Reject
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default MobileDocumentDrawer;
