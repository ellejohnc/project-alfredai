import { useState } from "react";
import { IncomingDocument } from "./vendorComplianceData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Cloud, 
  Loader2, 
  CheckCircle,
  FolderOpen,
  File
} from "lucide-react";
import { toast } from "sonner";

interface SharePointSyncProps {
  documents: IncomingDocument[];
  onSync: (docs: IncomingDocument[]) => void;
}

export function SharePointSync({ documents, onSync }: SharePointSyncProps) {
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncedCount, setSyncedCount] = useState(0);

  const verifiedDocs = documents.filter(d => d.status === "verified");

  const handleSync = () => {
    if (verifiedDocs.length === 0) {
      toast.info("No verified documents to sync");
      return;
    }

    setSyncing(true);
    setSyncProgress(0);
    setSyncedCount(0);

    verifiedDocs.forEach((doc, idx) => {
      setTimeout(() => {
        setSyncedCount(idx + 1);
        setSyncProgress(Math.round(((idx + 1) / verifiedDocs.length) * 100));

        if (idx === verifiedDocs.length - 1) {
          setSyncing(false);
          toast.success(`${verifiedDocs.length} documents synced to SharePoint`);
          onSync(verifiedDocs);
        }
      }, (idx + 1) * 200);
    });
  };

  // Group documents by vendor for folder preview
  const docsByVendor = verifiedDocs.reduce((acc, doc) => {
    const vendorName = doc.matched_vendor?.name || "Unknown";
    if (!acc[vendorName]) acc[vendorName] = [];
    acc[vendorName].push(doc);
    return acc;
  }, {} as Record<string, IncomingDocument[]>);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Cloud className="w-5 h-5 text-primary" />
          SharePoint Sync
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-4">
        {/* Stats */}
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Documents ready to sync:</span>
            <span className="font-semibold">{verifiedDocs.length}</span>
          </div>
        </div>

        {/* Folder Structure Preview */}
        <div className="bg-muted/20 rounded-lg p-3 text-xs font-mono space-y-1 max-h-[200px] overflow-auto">
          <div className="flex items-center gap-1 font-semibold">
            <FolderOpen className="w-3 h-3 text-amber-500" />
            <span>Vendors/</span>
          </div>
          {Object.entries(docsByVendor).slice(0, 5).map(([vendor, docs]) => (
            <div key={vendor} className="ml-4 space-y-0.5">
              <div className="flex items-center gap-1">
                <FolderOpen className="w-3 h-3 text-amber-500" />
                <span className="truncate">{vendor}/</span>
              </div>
              {docs.slice(0, 2).map((doc, idx) => (
                <div key={idx} className="ml-4 flex items-center gap-1 text-muted-foreground">
                  <File className="w-3 h-3" />
                  <span className="truncate">{doc.attachment_name}</span>
                  {syncedCount > 0 && (
                    <CheckCircle className="w-3 h-3 text-emerald-500 ml-1 shrink-0" />
                  )}
                </div>
              ))}
              {docs.length > 2 && (
                <div className="ml-4 text-muted-foreground">
                  +{docs.length - 2} more files
                </div>
              )}
            </div>
          ))}
          {Object.keys(docsByVendor).length > 5 && (
            <div className="ml-4 text-muted-foreground">
              +{Object.keys(docsByVendor).length - 5} more vendors
            </div>
          )}
        </div>

        {/* Progress */}
        {syncing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Syncing files...</span>
              <span className="font-medium">{syncedCount} / {verifiedDocs.length}</span>
            </div>
            <Progress value={syncProgress} className="h-2" />
          </div>
        )}

        {/* Sync Button */}
        <Button 
          onClick={handleSync}
          disabled={syncing || verifiedDocs.length === 0}
          className="w-full"
          variant="outline"
        >
          {syncing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <Cloud className="w-4 h-4 mr-2" />
              Sync {verifiedDocs.length} Documents
            </>
          )}
        </Button>

        {/* Info */}
        <p className="text-xs text-muted-foreground">
          Documents are auto-organized into vendor folders based on document type and expiry date.
        </p>
      </CardContent>
    </Card>
  );
}

export default SharePointSync;
