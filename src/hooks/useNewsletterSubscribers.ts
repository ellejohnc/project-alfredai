import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface NewsletterSubscriber {
  id: string;
  email: string;
  source: string | null;
  is_active: boolean;
  subscribed_at: string;
  unsubscribed_at: string | null;
  resubscribed_at: string | null;
  ip_address: string | null;
  user_agent: string | null;
}

export interface SubscriberFilters {
  status: "all" | "active" | "inactive";
  source: string | null;
  searchQuery: string;
}

export interface SubscriberStats {
  total: number;
  active: number;
  inactive: number;
  sources: Record<string, number>;
}

export function useNewsletterSubscribers() {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<SubscriberStats>({
    total: 0,
    active: 0,
    inactive: 0,
    sources: {},
  });
  const [sources, setSources] = useState<string[]>([]);
  const { toast } = useToast();

  const fetchSubscribers = useCallback(async (filters: SubscriberFilters) => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("newsletter_subscribers")
        .select("*")
        .order("subscribed_at", { ascending: false });

      // Apply status filter
      if (filters.status === "active") {
        query = query.eq("is_active", true);
      } else if (filters.status === "inactive") {
        query = query.eq("is_active", false);
      }

      // Apply source filter
      if (filters.source) {
        query = query.eq("source", filters.source);
      }

      // Apply search
      if (filters.searchQuery) {
        query = query.ilike("email", `%${filters.searchQuery}%`);
      }

      const { data, error } = await query.limit(500);

      if (error) throw error;
      setSubscribers(data || []);
    } catch (error) {
      console.error("Error fetching subscribers:", error);
      toast({
        title: "Error",
        description: "Failed to fetch subscribers",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchStats = useCallback(async () => {
    try {
      const [totalResult, activeResult, sourcesResult] = await Promise.all([
        supabase
          .from("newsletter_subscribers")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("newsletter_subscribers")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true),
        supabase
          .from("newsletter_subscribers")
          .select("source"),
      ]);

      const total = totalResult.count || 0;
      const active = activeResult.count || 0;

      // Calculate source distribution
      const sourceMap: Record<string, number> = {};
      const uniqueSources: string[] = [];
      
      (sourcesResult.data || []).forEach((row) => {
        const source = row.source || "unknown";
        sourceMap[source] = (sourceMap[source] || 0) + 1;
        if (!uniqueSources.includes(source)) {
          uniqueSources.push(source);
        }
      });

      setStats({
        total,
        active,
        inactive: total - active,
        sources: sourceMap,
      });
      setSources(uniqueSources.sort());
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, []);

  const updateSubscriberStatus = useCallback(async (id: string, isActive: boolean) => {
    try {
      const updates: Partial<NewsletterSubscriber> = {
        is_active: isActive,
      };

      // Track status change timestamps
      if (isActive) {
        updates.resubscribed_at = new Date().toISOString();
      } else {
        updates.unsubscribed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("newsletter_subscribers")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      // Update local state
      setSubscribers((prev) =>
        prev.map((sub) =>
          sub.id === id ? { ...sub, is_active: isActive, ...updates } : sub
        )
      );

      toast({
        title: "Status updated",
        description: `Subscriber ${isActive ? "reactivated" : "deactivated"} successfully`,
      });

      // Refresh stats
      fetchStats();
    } catch (error) {
      console.error("Error updating subscriber:", error);
      toast({
        title: "Error",
        description: "Failed to update subscriber status",
        variant: "destructive",
      });
    }
  }, [toast, fetchStats]);

  const deleteSubscriber = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setSubscribers((prev) => prev.filter((sub) => sub.id !== id));

      toast({
        title: "Subscriber deleted",
        description: "Subscriber has been removed from the list",
      });

      // Refresh stats
      fetchStats();
    } catch (error) {
      console.error("Error deleting subscriber:", error);
      toast({
        title: "Error",
        description: "Failed to delete subscriber",
        variant: "destructive",
      });
    }
  }, [toast, fetchStats]);

  const exportToCsv = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("email, source, is_active, subscribed_at, unsubscribed_at")
        .order("subscribed_at", { ascending: false });

      if (error) throw error;

      // Create CSV content
      const headers = ["Email", "Source", "Status", "Subscribed At", "Unsubscribed At"];
      const rows = (data || []).map((sub) => [
        sub.email,
        sub.source || "unknown",
        sub.is_active ? "Active" : "Inactive",
        new Date(sub.subscribed_at).toLocaleString(),
        sub.unsubscribed_at ? new Date(sub.unsubscribed_at).toLocaleString() : "",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n");

      // Download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `newsletter-subscribers-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export complete",
        description: `Exported ${data?.length || 0} subscribers to CSV`,
      });
    } catch (error) {
      console.error("Error exporting subscribers:", error);
      toast({
        title: "Error",
        description: "Failed to export subscribers",
        variant: "destructive",
      });
    }
  }, [toast]);

  return {
    subscribers,
    isLoading,
    stats,
    sources,
    fetchSubscribers,
    fetchStats,
    updateSubscriberStatus,
    deleteSubscriber,
    exportToCsv,
  };
}
