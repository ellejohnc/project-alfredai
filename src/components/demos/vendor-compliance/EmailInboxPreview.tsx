import { useMemo, useState } from "react";
import { IncomingEmail, formatFileSize, getDocumentTypeLabel } from "./vendorComplianceData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Mail, 
  Paperclip, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  FileText,
  Image as ImageIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EmailInboxPreviewProps {
  emails: IncomingEmail[];
  onSelectEmail?: (email: IncomingEmail) => void;
}

export function EmailInboxPreview({ emails, onSelectEmail }: EmailInboxPreviewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
  };

  const getStatusBadge = (status: IncomingEmail["status"]) => {
    switch (status) {
      case "new":
        return (
          <Badge className="bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 text-[10px]">
            New
          </Badge>
        );
      case "processing":
        return (
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px]">
            <Clock className="w-2.5 h-2.5 mr-1 animate-pulse" />
            Processing
          </Badge>
        );
      case "processed":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px]">
            <CheckCircle className="w-2.5 h-2.5 mr-1" />
            Processed
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 text-[10px]">
            <AlertCircle className="w-2.5 h-2.5 mr-1" />
            Failed
          </Badge>
        );
    }
  };

  const getFileIcon = (type: string) => {
    if (type === "pdf") return <FileText className="w-3 h-3 text-rose-500" />;
    if (["jpg", "png"].includes(type)) return <ImageIcon className="w-3 h-3 text-sky-500" />;
    return <FileText className="w-3 h-3 text-muted-foreground" />;
  };

  const stats = useMemo(() => ({
    new: emails.filter(e => e.status === "new").length,
    processing: emails.filter(e => e.status === "processing").length,
    processed: emails.filter(e => e.status === "processed").length,
    totalAttachments: emails.reduce((sum, e) => sum + e.attachments.length, 0),
  }), [emails]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Email Inbox
          </CardTitle>
          <div className="flex items-center gap-2">
            {stats.new > 0 && (
              <Badge variant="secondary" className="text-xs">
                {stats.new} new
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              <Paperclip className="w-3 h-3 mr-1" />
              {stats.totalAttachments}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="divide-y divide-border">
            {emails.map((email) => {
              const isSelected = email.id === selectedId;
              
              return (
                <button
                  key={email.id}
                  onClick={() => {
                    setSelectedId(email.id);
                    onSelectEmail?.(email);
                  }}
                  className={cn(
                    "w-full text-left p-3 transition-colors",
                    "hover:bg-muted/50",
                    isSelected && "bg-primary/5",
                    email.status === "new" && "bg-sky-50/50 dark:bg-sky-950/20"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {email.status === "new" && (
                          <div className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                        )}
                        <span className={cn(
                          "text-sm truncate",
                          email.status === "new" && "font-semibold"
                        )}>
                          {email.from_name}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground truncate mt-0.5">
                        {email.from}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[10px] text-muted-foreground">
                        {formatTime(email.received_at)}
                      </div>
                      {getStatusBadge(email.status)}
                    </div>
                  </div>

                  <div className="mt-2">
                    <p className={cn(
                      "text-sm truncate",
                      email.status === "new" ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {email.subject}
                    </p>
                  </div>

                  {/* Attachments */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {email.attachments.slice(0, 3).map((attachment, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded text-[10px]",
                          "bg-muted/50 text-muted-foreground",
                          attachment.extracted && "bg-emerald-50 dark:bg-emerald-950/30"
                        )}
                      >
                        {getFileIcon(attachment.type)}
                        <span className="truncate max-w-[100px]">{attachment.name}</span>
                        {attachment.confidence !== undefined && (
                          <Badge variant="outline" className="text-[8px] h-3 px-1 ml-1">
                            {attachment.confidence}%
                          </Badge>
                        )}
                      </div>
                    ))}
                    {email.attachments.length > 3 && (
                      <span className="text-[10px] text-muted-foreground px-2 py-1">
                        +{email.attachments.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* Matched Vendor */}
                  {email.matched_vendor && (
                    <div className="flex items-center gap-1 mt-2 text-[10px] text-emerald-600 dark:text-emerald-400">
                      <CheckCircle className="w-3 h-3" />
                      Matched to: {email.matched_vendor}
                    </div>
                  )}
                </button>
              );
            })}
            
            {emails.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No emails in inbox
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default EmailInboxPreview;
