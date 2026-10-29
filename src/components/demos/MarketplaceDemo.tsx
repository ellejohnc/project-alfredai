import { useState } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { LayoutGrid, Search, Sparkles, Plug } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DragScrollArea } from "@/components/ui/drag-scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { integrations as integrationData, categories } from "./marketplace/integrationData";
import { Integration } from "./marketplace/types";
import IntegrationCard from "./marketplace/IntegrationCard";
import IntegrationDetail from "./marketplace/IntegrationDetail";
import SetupWizard from "./marketplace/SetupWizard";
import MyIntegrations from "./marketplace/MyIntegrations";
import WorkflowsPreview from "./marketplace/WorkflowsPreview";

export default function MarketplaceDemo() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [localIntegrations, setLocalIntegrations] = useState<Integration[]>(integrationData);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [activeTab, setActiveTab] = useState("browse");

  const filteredIntegrations = localIntegrations.filter(int => {
    const matchesSearch = int.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         int.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || 
                           int.category.toLowerCase().replace(/[\s/]/g, '-') === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleInstall = (integration: Integration) => {
    setSelectedIntegration(integration);
    setShowDetail(false);
    setShowWizard(true);
  };

  const handleInstallComplete = (integrationId: string) => {
    setLocalIntegrations(prev => 
      prev.map(int => int.id === integrationId ? { ...int, installed: true } : int)
    );
    toast.success("Integration Connected!", { 
      description: `${localIntegrations.find(i => i.id === integrationId)?.name} is now active` 
    });
  };

  const installedCount = localIntegrations.filter(i => i.installed).length;
  const agentProtocolCount = localIntegrations.filter(i => i.supportsAgentProtocol).length;

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden relative">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500/10 to-rose-500/10 px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center">
              <LayoutGrid className="w-4 h-4 text-pink-500" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">alfred ai Enterprise Agents</h3>
              <p className="text-[10px] text-muted-foreground">{localIntegrations.length}+ agents & integrations</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Sparkles className="w-3 h-3 text-violet-500" />
            <span>{agentProtocolCount} Agent Protocol</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-4 pt-3 border-b border-border">
          <TabsList className="h-8 w-full grid grid-cols-3 bg-muted/50">
            <TabsTrigger value="browse" className="text-xs h-7">Browse</TabsTrigger>
            <TabsTrigger value="my-integrations" className="text-xs h-7">
              My Integrations {installedCount > 0 && `(${installedCount})`}
            </TabsTrigger>
            <TabsTrigger value="workflows" className="text-xs h-7">Workflows</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="browse" className="mt-0">
          {/* Search & Filter */}
          <div className="p-3 border-b border-border space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search integrations..."
                className="pl-9 h-8 rounded-lg text-sm"
              />
            </div>
            <DragScrollArea contentClassName="pb-1">
              <div className="flex gap-1">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={cn(
                      "px-2 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-colors flex items-center gap-1",
                      activeCategory === cat.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    <cat.icon className="w-3 h-3" />
                    {cat.name}
                  </button>
                ))}
              </div>
            </DragScrollArea>
          </div>

          {/* Integrations Grid */}
          <div className="p-3 grid grid-cols-2 gap-2 max-h-[320px] overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {filteredIntegrations.map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  isInstalling={installingId === integration.id}
                  onInstall={() => handleInstall(integration)}
                  onDetails={() => {
                    setSelectedIntegration(integration);
                    setShowDetail(true);
                  }}
                />
              ))}
            </AnimatePresence>
          </div>
        </TabsContent>

        <TabsContent value="my-integrations" className="mt-0 p-3">
          <MyIntegrations 
            integrations={localIntegrations} 
            onConfigure={(int) => {
              setSelectedIntegration(int);
              setShowWizard(true);
            }}
          />
        </TabsContent>

        <TabsContent value="workflows" className="mt-0 p-3">
          <WorkflowsPreview integrations={localIntegrations} />
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="px-4 py-2 bg-muted/30 border-t border-border flex items-center justify-between text-[10px]">
        <span className="text-muted-foreground flex items-center gap-1">
          <Plug className="w-3 h-3" />
          {installedCount} connected
        </span>
        <Button 
          variant="link" 
          size="sm" 
          className="text-[10px] h-auto p-0"
          onClick={() => toast.info("Demo Mode", { description: "Full marketplace with 5,000+ connectors available in production" })}
        >
          View all integrations →
        </Button>
      </div>

      {/* Integration Detail Slide-out */}
      <AnimatePresence>
        {showDetail && selectedIntegration && (
          <IntegrationDetail
            integration={selectedIntegration}
            isOpen={showDetail}
            onClose={() => setShowDetail(false)}
            onInstall={() => handleInstall(selectedIntegration)}
          />
        )}
      </AnimatePresence>

      {/* Setup Wizard Modal */}
      {selectedIntegration && (
        <SetupWizard
          integration={selectedIntegration}
          isOpen={showWizard}
          onClose={() => setShowWizard(false)}
          onComplete={handleInstallComplete}
        />
      )}
    </div>
  );
}
