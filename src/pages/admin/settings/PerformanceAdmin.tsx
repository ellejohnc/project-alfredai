import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Activity, 
  Gauge, 
  TrendingUp, 
  Clock, 
  Monitor, 
  Smartphone,
  RefreshCw,
  Download,
  Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface MetricOverview {
  metric_name: string;
  avg_value: number;
  p75_value: number;
  p95_value: number;
  good_count: number;
  needs_improvement_count: number;
  poor_count: number;
  total_count: number;
}

interface DailyStats {
  date: string;
  metric_name: string;
  avg_value: number;
  sample_count: number;
}

const METRIC_LABELS: Record<string, string> = {
  LCP: "Largest Contentful Paint",
  FID: "First Input Delay",
  CLS: "Cumulative Layout Shift",
  FCP: "First Contentful Paint",
  TTFB: "Time to First Byte",
  INP: "Interaction to Next Paint",
};

const METRIC_UNITS: Record<string, string> = {
  LCP: "ms",
  FID: "ms",
  CLS: "",
  FCP: "ms",
  TTFB: "ms",
  INP: "ms",
};

const RATING_COLORS = {
  good: "#22c55e",
  "needs-improvement": "#f59e0b",
  poor: "#ef4444",
};

const PerformanceAdmin: React.FC = () => {
  const [daysBack, setDaysBack] = useState("7");

  // Fetch overview data
  const { data: overview, isLoading: loadingOverview, refetch: refetchOverview } = useQuery({
    queryKey: ["performance-overview", daysBack],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_performance_overview", {
        days_back: parseInt(daysBack),
      });
      if (error) throw error;
      return data as MetricOverview[];
    },
  });

  // Fetch daily stats
  const { data: dailyStats, isLoading: loadingDaily, refetch: refetchDaily } = useQuery({
    queryKey: ["performance-daily", daysBack],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_daily_performance_stats", {
        days_back: parseInt(daysBack),
      });
      if (error) throw error;
      return data as DailyStats[];
    },
  });

  // Fetch recent metrics
  const { data: recentMetrics } = useQuery({
    queryKey: ["performance-recent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("performance_metrics")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const handleRefresh = () => {
    refetchOverview();
    refetchDaily();
  };

  // Prepare chart data
  const prepareLineChartData = () => {
    if (!dailyStats) return [];
    
    const groupedByDate: Record<string, Record<string, number>> = {};
    
    dailyStats.forEach(stat => {
      if (!groupedByDate[stat.date]) {
        groupedByDate[stat.date] = {};
      }
      groupedByDate[stat.date][stat.metric_name] = stat.avg_value;
    });

    return Object.entries(groupedByDate).map(([date, metrics]) => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      ...metrics,
    }));
  };

  const getScoreColor = (metric: string, value: number): string => {
    const thresholds: Record<string, { good: number; poor: number }> = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      FCP: { good: 1800, poor: 3000 },
      TTFB: { good: 800, poor: 1800 },
      INP: { good: 200, poor: 500 },
    };
    
    const threshold = thresholds[metric];
    if (!threshold) return RATING_COLORS.good;
    
    if (value <= threshold.good) return RATING_COLORS.good;
    if (value <= threshold.poor) return RATING_COLORS["needs-improvement"];
    return RATING_COLORS.poor;
  };

  const isLoading = loadingOverview || loadingDaily;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6" />
            Performance Monitoring
          </h1>
          <p className="text-muted-foreground">
            Core Web Vitals and page performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={daysBack} onValueChange={setDaysBack}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last 24 hours</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {overview?.map(metric => (
          <Card key={metric.metric_name}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span>{metric.metric_name}</span>
                <Badge 
                  style={{ 
                    backgroundColor: `${getScoreColor(metric.metric_name, metric.avg_value)}20`,
                    color: getScoreColor(metric.metric_name, metric.avg_value),
                    borderColor: `${getScoreColor(metric.metric_name, metric.avg_value)}40`,
                  }}
                >
                  {metric.avg_value.toFixed(metric.metric_name === "CLS" ? 3 : 0)}
                  {METRIC_UNITS[metric.metric_name]}
                </Badge>
              </CardTitle>
              <CardDescription>{METRIC_LABELS[metric.metric_name]}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">P75</span>
                  <span>{metric.p75_value.toFixed(metric.metric_name === "CLS" ? 3 : 0)}{METRIC_UNITS[metric.metric_name]}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">P95</span>
                  <span>{metric.p95_value.toFixed(metric.metric_name === "CLS" ? 3 : 0)}{METRIC_UNITS[metric.metric_name]}</span>
                </div>
                <div className="flex gap-1 mt-3">
                  <div 
                    className="h-2 rounded-l"
                    style={{ 
                      width: `${(metric.good_count / metric.total_count) * 100}%`,
                      backgroundColor: RATING_COLORS.good,
                    }}
                  />
                  <div 
                    className="h-2"
                    style={{ 
                      width: `${(metric.needs_improvement_count / metric.total_count) * 100}%`,
                      backgroundColor: RATING_COLORS["needs-improvement"],
                    }}
                  />
                  <div 
                    className="h-2 rounded-r"
                    style={{ 
                      width: `${(metric.poor_count / metric.total_count) * 100}%`,
                      backgroundColor: RATING_COLORS.poor,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{metric.good_count} good</span>
                  <span>{metric.needs_improvement_count} needs work</span>
                  <span>{metric.poor_count} poor</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Performance Trends
              </CardTitle>
              <CardDescription>
                Average metric values over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={prepareLineChartData()}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="LCP" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="FCP" stroke="#06b6d4" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="TTFB" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="w-5 h-5" />
                Rating Distribution
              </CardTitle>
              <CardDescription>
                How metrics are distributed across rating categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overview}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="metric_name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="good_count" name="Good" fill={RATING_COLORS.good} stackId="a" />
                    <Bar dataKey="needs_improvement_count" name="Needs Improvement" fill={RATING_COLORS["needs-improvement"]} stackId="a" />
                    <Bar dataKey="poor_count" name="Poor" fill={RATING_COLORS.poor} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                Device Breakdown
              </CardTitle>
              <CardDescription>
                Performance samples by device type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Desktop", value: recentMetrics?.filter(m => m.device_type === "desktop").length || 0, fill: "#8b5cf6" },
                        { name: "Mobile", value: recentMetrics?.filter(m => m.device_type === "mobile").length || 0, fill: "#06b6d4" },
                        { name: "Tablet", value: recentMetrics?.filter(m => m.device_type === "tablet").length || 0, fill: "#f59e0b" },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {[0, 1, 2].map((_, index) => (
                        <Cell key={`cell-${index}`} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Samples Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Samples
          </CardTitle>
          <CardDescription>
            Last 100 performance measurements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Time</th>
                  <th className="text-left py-2 px-2">Page</th>
                  <th className="text-left py-2 px-2">Metric</th>
                  <th className="text-left py-2 px-2">Value</th>
                  <th className="text-left py-2 px-2">Rating</th>
                  <th className="text-left py-2 px-2">Device</th>
                </tr>
              </thead>
              <tbody>
                {recentMetrics?.slice(0, 20).map(metric => (
                  <tr key={metric.id} className="border-b border-muted/50 hover:bg-muted/30">
                    <td className="py-2 px-2 text-muted-foreground">
                      {new Date(metric.created_at).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-2 font-mono text-xs truncate max-w-[150px]">
                      {metric.page_url}
                    </td>
                    <td className="py-2 px-2 font-medium">{metric.metric_name}</td>
                    <td className="py-2 px-2">
                      {metric.metric_value.toFixed(metric.metric_name === "CLS" ? 3 : 0)}
                      {METRIC_UNITS[metric.metric_name]}
                    </td>
                    <td className="py-2 px-2">
                      <Badge
                        variant="outline"
                        style={{
                          backgroundColor: `${RATING_COLORS[metric.rating as keyof typeof RATING_COLORS]}20`,
                          color: RATING_COLORS[metric.rating as keyof typeof RATING_COLORS],
                          borderColor: `${RATING_COLORS[metric.rating as keyof typeof RATING_COLORS]}40`,
                        }}
                      >
                        {metric.rating}
                      </Badge>
                    </td>
                    <td className="py-2 px-2 capitalize text-muted-foreground">
                      {metric.device_type === "mobile" ? (
                        <Smartphone className="w-4 h-4 inline mr-1" />
                      ) : (
                        <Monitor className="w-4 h-4 inline mr-1" />
                      )}
                      {metric.device_type}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceAdmin;