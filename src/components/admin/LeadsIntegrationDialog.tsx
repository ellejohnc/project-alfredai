import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plug, Copy, Check, Webhook } from "lucide-react";

/**
 * Webhook integration panel for the Leads section.
 * Lets a custom third-party system push leads in real time via a POST webhook.
 */
export function LeadsIntegrationDialog() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // The deployed edge function endpoint
  const projectUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const webhookUrl = `${projectUrl}/functions/v1/inject-lead`;

  const examplePayload = JSON.stringify(
    {
      email: "jane@acme.com",
      name: "Jane Smith",
      phone: "+61 400 000 000",
      company: "Acme Construction",
      job_title: "Estimator",
      message: "Interested in a demo",
      lead_type: "demo_request",
      source_campaign: "spring_outreach",
      external_source: "my_custom_system",
    },
    null,
    2,
  );

  const curlExample = `curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '${JSON.stringify({ email: "jane@acme.com", name: "Jane Smith", company: "Acme Construction" })}'`;

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(null), 1500);
    } catch {
      toast.error("Could not copy. Please copy manually.");
    }
  };

  const CopyBtn = ({ text, k }: { text: string; k: string }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 gap-1.5 shrink-0"
      onClick={() => copy(text, k)}
    >
      {copied === k ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      <span className="hidden sm:inline">{copied === k ? "Copied" : "Copy"}</span>
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Plug className="w-4 h-4" />
          <span className="hidden sm:inline">Integrate</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Webhook className="w-5 h-5" />
            Connect a third-party system
          </DialogTitle>
          <DialogDescription>
            Push leads from your custom software straight into this section in real
            time. Send a secure POST request to the webhook below — new leads appear
            here instantly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Step 1: URL */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">Step 1</Badge>
              <span className="text-sm font-semibold text-foreground">Webhook URL</span>
            </div>
            <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-2">
              <code className="flex-1 text-xs break-all text-foreground">{webhookUrl}</code>
              <CopyBtn text={webhookUrl} k="url" />
            </div>
            <p className="text-xs text-muted-foreground">Send a <strong>POST</strong> request with a JSON body.</p>
          </div>

          {/* Step 2: Auth */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">Step 2</Badge>
              <span className="text-sm font-semibold text-foreground">Authenticate</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Add your secret API key as an <code className="text-xs">x-api-key</code> header
              (or <code className="text-xs">Authorization: Bearer YOUR_API_KEY</code>). Your
              key is stored securely in the backend — share it only with your trusted system.
            </p>
          </div>

          {/* Step 3: Payload */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">Step 3</Badge>
              <span className="text-sm font-semibold text-foreground">Send lead data</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Only <code className="text-xs">email</code> is required. Send one lead, or a
              batch with <code className="text-xs">{`{ "leads": [ ... ] }`}</code> (max 100).
            </p>
            <div className="rounded-md border bg-muted/40">
              <div className="flex items-center justify-between border-b px-3 py-1.5">
                <span className="text-xs font-medium text-muted-foreground">Example JSON</span>
                <CopyBtn text={examplePayload} k="payload" />
              </div>
              <pre className="overflow-x-auto p-3 text-xs leading-relaxed text-foreground">{examplePayload}</pre>
            </div>
          </div>

          {/* cURL */}
          <div className="space-y-2">
            <span className="text-sm font-semibold text-foreground">Quick test (cURL)</span>
            <div className="rounded-md border bg-muted/40">
              <div className="flex items-center justify-between border-b px-3 py-1.5">
                <span className="text-xs font-medium text-muted-foreground">Replace YOUR_API_KEY</span>
                <CopyBtn text={curlExample} k="curl" />
              </div>
              <pre className="overflow-x-auto p-3 text-xs leading-relaxed text-foreground">{curlExample}</pre>
            </div>
          </div>

          <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground">
            Need the API key or having trouble? The key is managed in your backend
            secrets as <code className="text-xs">LEADS_WEBHOOK_API_KEY</code>. If a request
            fails, the response includes a clear error message and which leads were skipped.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
