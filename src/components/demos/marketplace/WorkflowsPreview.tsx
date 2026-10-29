import { useState } from "react";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  Plus, 
  Play, 
  Pause,
  Zap,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Integration } from "./types";
import { toast } from "sonner";

interface WorkflowsPreviewProps {
  integrations: Integration[];
}

type WorkflowItem = {
  id: string;
  name: string;
  description: string;
  nodes: { integrationId: string; action: string }[];
  active: boolean;
  runs: number;
};

const sampleWorkflows: WorkflowItem[] = [
  {
    id: "1",
    name: "New Lead Notification",
    description: "When a new lead is added in HubSpot, notify team in Slack",
    nodes: [
      { integrationId: "hubspot", action: "New Contact Created" },
      { integrationId: "gmail-api", action: "Send Email Notification" }
    ],
    active: true,
    runs: 234
  },
  {
    id: "2",
    name: "Invoice Automation",
    description: "Auto-create Xero invoice when Shopify order is placed",
    nodes: [
      { integrationId: "shopify", action: "Order Created" },
      { integrationId: "xero", action: "Create Invoice" },
      { integrationId: "pleasesign", action: "Request Signature" }
    ],
    active: true,
    runs: 89
  },
  {
    id: "3",
    name: "Meeting Prep AI",
    description: "Before a Calendly meeting, summarize contact history with AI",
    nodes: [
      { integrationId: "calendly", action: "Meeting Scheduled" },
      { integrationId: "chatgpt", action: "Generate Summary" },
      { integrationId: "gmail-api", action: "Send Prep Email" }
    ],
    active: false,
    runs: 45
  }
];

export default function WorkflowsPreview({ integrations }: WorkflowsPreviewProps) {
  const [workflows, setWorkflows] = useState(sampleWorkflows);

  const getIntegration = (id: string) => integrations.find(i => i.id === id);

  const toggleWorkflow = (workflowId: string) => {
    setWorkflows(prev => 
      prev.map(w => w.id === workflowId ? { ...w, active: !w.active } : w)
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-sm">Active Workflows</h4>
          <p className="text-xs text-muted-foreground">Automated flows between your integrations</p>
        </div>
        <Button 
          size="sm" 
          variant="outline" 
          className="h-7 text-xs gap-1"
          onClick={() => toast.info("Demo Mode", { description: "In production, this would open the workflow builder" })}
        >
          <Plus className="w-3 h-3" />
          New
        </Button>
      </div>

      {/* Workflows List */}
      <div className="space-y-3 max-h-[320px] overflow-y-auto">
        {workflows.map((workflow, idx) => (
          <motion.div
            key={workflow.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={cn(
              "p-4 rounded-xl border transition-all",
              workflow.active 
                ? "bg-card border-primary/20" 
                : "bg-muted/30 border-border"
            )}
          >
            {/* Workflow Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h5 className="font-medium text-sm">{workflow.name}</h5>
                  {workflow.active && (
                    <span className="px-1.5 py-0.5 bg-green-500/20 text-green-600 text-[10px] rounded-full font-medium">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">{workflow.description}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => toggleWorkflow(workflow.id)}
              >
                {workflow.active ? (
                  <Pause className="w-3.5 h-3.5 text-amber-500" />
                ) : (
                  <Play className="w-3.5 h-3.5 text-green-500" />
                )}
              </Button>
            </div>

            {/* Visual Flow */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {workflow.nodes.map((node, nodeIdx) => {
                const integration = getIntegration(node.integrationId);
                if (!integration) return null;
                
                return (
                  <div key={nodeIdx} className="flex items-center gap-2">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: idx * 0.1 + nodeIdx * 0.1 }}
                      className="flex flex-col items-center"
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br mb-1",
                        integration.color
                      )}>
                        <integration.icon className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-[9px] text-muted-foreground text-center max-w-[60px] truncate">
                        {node.action}
                      </span>
                    </motion.div>
                    
                    {nodeIdx < workflow.nodes.length - 1 && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: idx * 0.1 + nodeIdx * 0.1 + 0.05 }}
                      >
                        <ChevronRight className="w-4 h-4 text-primary/50" />
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {workflow.runs} runs this month
              </span>
              <Button 
                variant="link" 
                className="h-auto p-0 text-[10px]"
                onClick={() => toast.info("Demo Mode", { description: "In production, this would show workflow history" })}
              >
                View History →
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 text-xs gap-1"
          onClick={() => toast.info("Demo Mode", { description: "Templates gallery coming soon" })}
        >
          <Zap className="w-3 h-3" />
          Browse Templates
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 text-xs gap-1"
          onClick={() => toast.info("Demo Mode", { description: "AI workflow builder coming soon" })}
        >
          <Plus className="w-3 h-3" />
          AI Suggest Flow
        </Button>
      </div>
    </div>
  );
}
