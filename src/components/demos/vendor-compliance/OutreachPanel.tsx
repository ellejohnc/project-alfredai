import { useState } from "react";
import { useDemoSpeed } from "@/contexts/DemoSpeedContext";
import { ComplianceVendor } from "./vendorComplianceData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Send, 
  Mail, 
  MessageSquare, 
  Phone, 
  Loader2,
  CheckCircle,
  Clock,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface OutreachPanelProps {
  vendors: ComplianceVendor[];
  onSendReminders: (vendors: ComplianceVendor[], channel?: "email" | "sms" | "voice") => void;
}

export function OutreachPanel({ vendors, onSendReminders }: OutreachPanelProps) {
  const { applySpeed } = useDemoSpeed();
  const [sendingReminders, setSendingReminders] = useState(false);
  const [sentCount, setSentCount] = useState({ sms: 0, email: 0, voice: 0 });
  const [progress, setProgress] = useState(0);

  const expiringVendors = vendors.filter(v => v.overall_status === "expiring");
  const nonCompliantVendors = vendors.filter(v => v.overall_status === "non_compliant");
  const targetVendors = [...expiringVendors, ...nonCompliantVendors];

  const channelCounts = {
    email: targetVendors.filter(v => v.preferred_channel === "email").length,
    sms: targetVendors.filter(v => v.preferred_channel === "sms").length,
    voice: targetVendors.filter(v => v.preferred_channel === "voice").length,
  };

  const handleBatchReminders = () => {
    if (targetVendors.length === 0) {
      toast.info("No vendors require reminders");
      return;
    }

    setSendingReminders(true);
    setSentCount({ email: 0, sms: 0, voice: 0 });
    setProgress(0);
    
    let emailCount = 0, smsCount = 0, voiceCount = 0;
    
    targetVendors.forEach((vendor, idx) => {
      setTimeout(() => {
        if (vendor.preferred_channel === "email") emailCount++;
        else if (vendor.preferred_channel === "sms") smsCount++;
        else voiceCount++;
        
        setSentCount({ email: emailCount, sms: smsCount, voice: voiceCount });
        setProgress(Math.round(((idx + 1) / targetVendors.length) * 100));
        
        if (idx === targetVendors.length - 1) {
          setSendingReminders(false);
          toast.success(`Sent ${targetVendors.length} reminders successfully`);
          onSendReminders(targetVendors);
        }
      }, applySpeed(idx * 80));
    });
  };

  const totalSent = sentCount.email + sentCount.sms + sentCount.voice;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Send className="w-5 h-5 text-primary" />
          Outreach Campaign
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-4">
        {/* Target Summary */}
        <div className="bg-muted/30 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Vendors to contact:</span>
            <span className="font-semibold">{targetVendors.length}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <Clock className="w-3 h-3" />
              <span>{expiringVendors.length} expiring</span>
            </div>
            <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-3 h-3" />
              <span>{nonCompliantVendors.length} non-compliant</span>
            </div>
          </div>
        </div>

        {/* Channel Breakdown */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <ChannelCard
            icon={Mail}
            label="Email"
            count={channelCounts.email}
            sent={sentCount.email}
            color="blue"
          />
          <ChannelCard
            icon={MessageSquare}
            label="SMS"
            count={channelCounts.sms}
            sent={sentCount.sms}
            color="green"
          />
          <ChannelCard
            icon={Phone}
            label="Voice"
            count={channelCounts.voice}
            sent={sentCount.voice}
            color="purple"
          />
        </div>

        {/* Progress */}
        {sendingReminders && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Sending reminders...</span>
              <span className="font-medium">{totalSent} / {targetVendors.length}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Send Button */}
        <Button 
          onClick={handleBatchReminders}
          disabled={sendingReminders || targetVendors.length === 0}
          className="w-full"
          size="lg"
        >
          {sendingReminders ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send to {targetVendors.length} Vendors
            </>
          )}
        </Button>

        {/* Escalation Rules */}
        <div className="text-xs text-muted-foreground space-y-1.5 pt-2 border-t border-border">
          <p className="font-medium text-foreground">Escalation Rules:</p>
          <div className="flex items-start gap-2 flex-wrap">
            <Badge variant="outline" className="text-[10px] shrink-0">30 days</Badge>
            <span className="break-words">Email reminder</span>
          </div>
          <div className="flex items-start gap-2 flex-wrap">
            <Badge variant="outline" className="text-[10px] shrink-0">14 days</Badge>
            <span className="break-words">SMS + Email</span>
          </div>
          <div className="flex items-start gap-2 flex-wrap">
            <Badge variant="outline" className="text-[10px] shrink-0">7 days</Badge>
            <span className="break-words">Voice call</span>
          </div>
          <div className="flex items-start gap-2 flex-wrap">
            <Badge variant="outline" className="text-[10px] border-rose-300 text-rose-600 shrink-0">Expired</Badge>
            <span className="break-words">Block from new POs</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChannelCard({
  icon: Icon,
  label,
  count,
  sent,
  color
}: {
  icon: React.ElementType;
  label: string;
  count: number;
  sent: number;
  color: "blue" | "green" | "purple";
}) {
  const colorClasses = {
    blue: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    purple: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  };

  return (
    <div className={cn("p-3 rounded-lg", colorClasses[color])}>
      <Icon className="w-5 h-5 mx-auto" />
      <div className="font-bold mt-1">
        {sent > 0 ? (
          <span className="flex items-center justify-center gap-1">
            <CheckCircle className="w-3 h-3" />
            {sent}
          </span>
        ) : (
          count
        )}
      </div>
      <div className="text-xs opacity-80">{label}</div>
    </div>
  );
}

export default OutreachPanel;
