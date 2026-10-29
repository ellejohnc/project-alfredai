import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Copy, ExternalLink, Check, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

interface EmailDraftPreviewProps {
  recipientName: string;
  recipientEmail: string;
  reportTitle: string;
  findings: string[];
  onOpenInClient?: () => void;
}

export function EmailDraftPreview({
  recipientName,
  recipientEmail,
  reportTitle,
  findings,
  onOpenInClient,
}: EmailDraftPreviewProps) {
  const [copied, setCopied] = useState(false);

  const emailContent = `Dear ${recipientName},

Please find attached the ${reportTitle} for your review.

Key Findings Summary:
${findings.map((f, i) => `${i + 1}. ${f}`).join('\n')}

The report includes detailed analysis, compliance verification against AS/NZS 3000 and ISO 55001 standards, and prioritized recommendations for your consideration.

Please don't hesitate to contact us if you have any questions or require clarification on any points.

Best regards,
Technical Assessment Team
alfred ai Engineering Services

---
This report was generated with AI assistance.
For questions, contact: reports@alfredai.bot`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(emailContent);
      setCopied(true);
      toast({
        title: "Email copied",
        description: "Email content copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Email Draft</span>
          </div>
          <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
            AI Generated
          </Badge>
        </div>
      </div>

      {/* Email preview */}
      <div className="p-4 space-y-4">
        {/* To/Subject */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-12">To:</span>
            <span className="text-foreground">{recipientName} &lt;{recipientEmail}&gt;</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-12">Subject:</span>
            <span className="text-foreground font-medium">{reportTitle} - Ready for Review</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-12">Attach:</span>
            <div className="flex items-center gap-1 text-primary">
              <Paperclip className="w-3 h-3" />
              <span>Technical_Report_Q1_2025.pdf</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Email body */}
        <div className="bg-muted/30 rounded-lg p-3 max-h-[200px] overflow-y-auto">
          <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">
            {emailContent}
          </pre>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleCopy}
            variant="outline"
            className="flex-1 gap-2 min-h-[44px]"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Email
              </>
            )}
          </Button>
          <Button
            onClick={onOpenInClient}
            className="flex-1 gap-2 min-h-[44px]"
          >
            <ExternalLink className="w-4 h-4" />
            Open in Client
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
