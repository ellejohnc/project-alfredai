import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Database, 
  HardDrive, 
  Shield,
  Globe,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet";

interface HealthCheck {
  status: string;
  latency?: number;
  error?: string;
}

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  checks: {
    database: HealthCheck;
    storage: HealthCheck;
    auth: HealthCheck;
  };
}

const StatusPage: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke("health-check");
      
      if (fnError) throw fnError;
      
      setHealth(data);
      setLastChecked(new Date());
    } catch (e) {
      setError(e.message || "Failed to fetch health status");
      // Set a fallback unhealthy status
      setHealth({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        version: "unknown",
        checks: {
          database: { status: "unknown", error: "Unable to check" },
          storage: { status: "unknown", error: "Unable to check" },
          auth: { status: "unknown", error: "Unable to check" },
        },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "degraded":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "unhealthy":
      case "unknown":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Operational</Badge>;
      case "degraded":
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Degraded</Badge>;
      case "unhealthy":
      case "unknown":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Outage</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case "database":
        return <Database className="w-5 h-5" />;
      case "storage":
        return <HardDrive className="w-5 h-5" />;
      case "auth":
        return <Shield className="w-5 h-5" />;
      default:
        return <Globe className="w-5 h-5" />;
    }
  };

  const overallStatus = health?.status || "unknown";

  return (
    <>
      <Helmet>
        <title>System Status | alfred ai</title>
        <meta name="description" content="Check the current operational status of alfred ai services." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-16">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold mb-4">System Status</h1>
            <p className="text-muted-foreground">
              Current operational status of alfred ai services
            </p>
          </motion.div>

          {/* Overall Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                      overallStatus === "healthy" ? "bg-green-500/10" :
                      overallStatus === "degraded" ? "bg-yellow-500/10" :
                      "bg-red-500/10"
                    }`}>
                      {loading ? (
                        <RefreshCw className="w-8 h-8 text-muted-foreground animate-spin" />
                      ) : (
                        getStatusIcon(overallStatus)
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold">
                        {overallStatus === "healthy" ? "All Systems Operational" :
                         overallStatus === "degraded" ? "Partial System Outage" :
                         "System Outage"}
                      </h2>
                      <p className="text-muted-foreground">
                        {lastChecked && (
                          <>Last checked: {lastChecked.toLocaleTimeString()}</>
                        )}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={fetchHealth}
                    disabled={loading}
                    className="gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Service Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Services</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {health && Object.entries(health.checks).map(([service, check]) => (
                  <div 
                    key={service}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center">
                        {getServiceIcon(service)}
                      </div>
                      <div>
                        <h3 className="font-medium capitalize">{service}</h3>
                        {check.latency && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {check.latency}ms
                          </p>
                        )}
                        {check.error && (
                          <p className="text-sm text-red-500">{check.error}</p>
                        )}
                      </div>
                    </div>
                    {getStatusBadge(check.status)}
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Error State */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-8"
            >
              <Card className="border-red-500/20 bg-red-500/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 text-red-600">
                    <XCircle className="w-5 h-5" />
                    <p>Unable to fetch health status: {error}</p>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    If you're experiencing issues, please <a href="/contact" className="text-primary underline">contact support</a>.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Version Info */}
          {health && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-8 text-center text-sm text-muted-foreground"
            >
              <p>Version: {health.version} | Last updated: {new Date(health.timestamp).toLocaleString()}</p>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
};

export default StatusPage;