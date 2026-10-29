import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search, 
  TrendingUp, 
  AlertCircle, 
  MousePointerClick, 
  Sparkles,
  RefreshCw,
  Calendar,
  BarChart3
} from "lucide-react";
import { format, subDays } from "date-fns";
import { fetchAllRows } from "@/lib/supabasePaging";

interface SearchAnalyticsRow {
  id: string;
  query: string;
  results_count: number;
  selected_path: string | null;
  selected_title: string | null;
  ai_enhanced: boolean;
  device_type: string | null;
  created_at: string;
}

interface PopularSearch {
  query: string;
  count: number;
  avg_results: number;
  click_rate: number;
}

interface ZeroResultSearch {
  query: string;
  count: number;
  last_searched: string;
}

export default function SearchAnalyticsAdmin() {
  const [timeRange, setTimeRange] = useState("7");
  const [searchFilter, setSearchFilter] = useState("");

  // Fetch raw search data
  const { data: searchData, isLoading, refetch } = useQuery({
    queryKey: ["search-analytics", timeRange],
    queryFn: async () => {
      const startDate = subDays(new Date(), parseInt(timeRange)).toISOString();
      
      // Paged: this page reports totals, and `.limit(1000)` quietly caps them.
      return await fetchAllRows<SearchAnalyticsRow>(
        "search_analytics",
        (q) => q.gte("created_at", startDate),
      );
    },
  });

  // Compute aggregated stats
  const stats = searchData ? computeStats(searchData) : null;

  // Filter data for display
  const filteredData = searchData?.filter(row =>
    row.query.toLowerCase().includes(searchFilter.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Search Analytics</h1>
            <p className="text-muted-foreground">
              Track search patterns, popular queries, and zero-result searches
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Last 24h</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Searches</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalSearches || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.aiEnhancedRate || 0}% AI-enhanced
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Queries</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.uniqueQueries || 0}</div>
              <p className="text-xs text-muted-foreground">
                Distinct search terms
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Zero Results</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.zeroResultCount || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.zeroResultRate || 0}% of searches
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Click-Through Rate</CardTitle>
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.clickThroughRate || 0}%</div>
              <p className="text-xs text-muted-foreground">
                Searches with selection
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Popular Searches */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Popular Searches
              </CardTitle>
              <CardDescription>Most frequently searched terms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.popularSearches.slice(0, 10).map((search, index) => (
                  <div key={search.query} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-5">{index + 1}</span>
                      <span className="text-sm font-medium truncate max-w-[200px]">
                        {search.query}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{search.count}×</Badge>
                      {search.avg_results > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {search.avg_results.toFixed(1)} results
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {(!stats?.popularSearches || stats.popularSearches.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No search data yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Zero Result Searches */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                Zero-Result Searches
              </CardTitle>
              <CardDescription>Queries that returned no results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.zeroResultSearches.slice(0, 10).map((search) => (
                  <div key={search.query} className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate max-w-[200px]">
                      {search.query}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">{search.count}×</Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(search.last_searched), "MMM d")}
                      </span>
                    </div>
                  </div>
                ))}
                {(!stats?.zeroResultSearches || stats.zeroResultSearches.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No zero-result searches 🎉
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Searches Table */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Recent Searches</CardTitle>
                <CardDescription>Individual search events</CardDescription>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter queries..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Query</TableHead>
                    <TableHead className="w-24 text-center">Results</TableHead>
                    <TableHead className="w-32">Selected</TableHead>
                    <TableHead className="w-24 text-center">AI</TableHead>
                    <TableHead className="w-24">Device</TableHead>
                    <TableHead className="w-32">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No search data found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.slice(0, 50).map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {row.query}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant={row.results_count === 0 ? "destructive" : "secondary"}
                          >
                            {row.results_count}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground truncate max-w-[120px]">
                          {row.selected_title || "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.ai_enhanced && (
                            <Sparkles className="w-4 h-4 text-primary mx-auto" />
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {row.device_type || "unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(row.created_at), "MMM d, HH:mm")}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {filteredData.length > 50 && (
              <p className="text-sm text-muted-foreground text-center mt-4">
                Showing 50 of {filteredData.length} results
              </p>
            )}
          </CardContent>
        </Card>
      </div>
  );
}

// Compute aggregated statistics from raw data
function computeStats(data: SearchAnalyticsRow[]) {
  const totalSearches = data.length;
  const aiEnhanced = data.filter(d => d.ai_enhanced).length;
  const aiEnhancedRate = totalSearches > 0 ? Math.round((aiEnhanced / totalSearches) * 100) : 0;
  
  const uniqueQueries = new Set(data.map(d => d.query.toLowerCase())).size;
  
  const zeroResults = data.filter(d => d.results_count === 0);
  const zeroResultCount = zeroResults.length;
  const zeroResultRate = totalSearches > 0 ? Math.round((zeroResultCount / totalSearches) * 100) : 0;
  
  const withSelection = data.filter(d => d.selected_path).length;
  const clickThroughRate = totalSearches > 0 ? Math.round((withSelection / totalSearches) * 100) : 0;

  // Popular searches aggregation
  const queryMap = new Map<string, { count: number; totalResults: number }>();
  data.forEach(d => {
    const key = d.query.toLowerCase().trim();
    const existing = queryMap.get(key) || { count: 0, totalResults: 0 };
    queryMap.set(key, {
      count: existing.count + 1,
      totalResults: existing.totalResults + d.results_count,
    });
  });
  
  const popularSearches: PopularSearch[] = Array.from(queryMap.entries())
    .map(([query, stats]) => ({
      query,
      count: stats.count,
      avg_results: stats.totalResults / stats.count,
      click_rate: 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Zero result searches
  const zeroQueryMap = new Map<string, { count: number; lastSearched: string }>();
  zeroResults.forEach(d => {
    const key = d.query.toLowerCase().trim();
    const existing = zeroQueryMap.get(key);
    if (!existing || new Date(d.created_at) > new Date(existing.lastSearched)) {
      zeroQueryMap.set(key, {
        count: (existing?.count || 0) + 1,
        lastSearched: d.created_at,
      });
    } else {
      zeroQueryMap.set(key, {
        count: existing.count + 1,
        lastSearched: existing.lastSearched,
      });
    }
  });
  
  const zeroResultSearches: ZeroResultSearch[] = Array.from(zeroQueryMap.entries())
    .map(([query, stats]) => ({
      query,
      count: stats.count,
      last_searched: stats.lastSearched,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    totalSearches,
    aiEnhancedRate,
    uniqueQueries,
    zeroResultCount,
    zeroResultRate,
    clickThroughRate,
    popularSearches,
    zeroResultSearches,
  };
}
