import { useState } from "react";
import { motion } from "framer-motion";
import { Flag, Loader2, RefreshCw, ToggleLeft, ToggleRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useFeatureFlags, updateFeatureFlag, type FeatureFlag } from "@/hooks/useFeatureFlags";

const FeatureFlagsAdmin = () => {
  const { flags, isLoading, error, refetch } = useFeatureFlags();
  const [updatingFlags, setUpdatingFlags] = useState<Set<string>>(new Set());

  const handleToggle = async (flag: FeatureFlag) => {
    const newValue = !flag.is_enabled;
    setUpdatingFlags((prev) => new Set(prev).add(flag.flag_key));
    
    try {
      await updateFeatureFlag(flag.flag_key, newValue);
      await refetch();
      toast.success(
        `${flag.flag_key} ${newValue ? "enabled" : "disabled"}`
      );
    } catch (err) {
      console.error("Failed to update flag:", err);
      toast.error("Failed to update feature flag");
    } finally {
      setUpdatingFlags((prev) => {
        const next = new Set(prev);
        next.delete(flag.flag_key);
        return next;
      });
    }
  };

  const getFlagDisplayName = (key: string) => {
    return key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Flag className="w-6 h-6 text-primary" />
            Feature Flags
          </h1>
          <p className="text-muted-foreground mt-1">
            Toggle features on or off without code changes
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <p className="text-destructive text-sm">
              Failed to load feature flags. Please try again.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && flags.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Flag className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No Feature Flags
            </h3>
            <p className="text-muted-foreground text-center max-w-sm">
              Feature flags will appear here once they are created in the database.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Feature Flags Grid */}
      {!isLoading && !error && flags.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {flags.map((flag, index) => {
            const isUpdating = updatingFlags.has(flag.flag_key);
            
            return (
              <motion.div
                key={flag.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`transition-all ${flag.is_enabled ? 'border-primary/30 bg-primary/5' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base flex items-center gap-2">
                          {flag.is_enabled ? (
                            <ToggleRight className="w-4 h-4 text-primary shrink-0" />
                          ) : (
                            <ToggleLeft className="w-4 h-4 text-muted-foreground shrink-0" />
                          )}
                          <span className="truncate">
                            {getFlagDisplayName(flag.flag_key)}
                          </span>
                        </CardTitle>
                        <CardDescription className="mt-1.5 text-xs">
                          <code className="px-1.5 py-0.5 bg-muted rounded text-xs">
                            {flag.flag_key}
                          </code>
                        </CardDescription>
                      </div>
                      <Badge 
                        variant={flag.is_enabled ? "default" : "secondary"}
                        className="shrink-0"
                      >
                        {flag.is_enabled ? "ON" : "OFF"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {flag.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {flag.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs">
                          <p className="text-xs">
                            Toggle this flag to immediately enable or disable the feature across the site.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <div className="flex items-center gap-2">
                        {isUpdating && (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                        <Switch
                          checked={flag.is_enabled}
                          onCheckedChange={() => handleToggle(flag)}
                          disabled={isUpdating}
                          aria-label={`Toggle ${flag.flag_key}`}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Info Footer */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">How Feature Flags Work</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Changes take effect immediately after toggling</li>
                <li>Users may need to refresh their page to see updates</li>
                <li>Flags default to "enabled" if not found in the database</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeatureFlagsAdmin;
