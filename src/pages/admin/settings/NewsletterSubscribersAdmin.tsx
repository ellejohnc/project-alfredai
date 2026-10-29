import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import {
  Mail,
  Download,
  RefreshCw,
  Search,
  Users,
  UserCheck,
  UserX,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermissions } from "@/hooks/usePermissions";
import AccessDenied from "@/components/admin/AccessDenied";
import {
  useNewsletterSubscribers,
  SubscriberFilters,
  NewsletterSubscriber,
} from "@/hooks/useNewsletterSubscribers";

export default function NewsletterSubscribersAdmin() {
  const { canManageEmailTemplates } = usePermissions();
  const {
    subscribers,
    isLoading,
    stats,
    sources,
    fetchSubscribers,
    fetchStats,
    updateSubscriberStatus,
    deleteSubscriber,
    exportToCsv,
  } = useNewsletterSubscribers();

  const [filters, setFilters] = useState<SubscriberFilters>({
    status: "all",
    source: null,
    searchQuery: "",
  });
  const [subscriberToDelete, setSubscriberToDelete] = useState<NewsletterSubscriber | null>(null);

  // Initial fetch
  useEffect(() => {
    fetchStats();
    fetchSubscribers(filters);
  }, []);

  // Refetch when filters change
  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchSubscribers(filters);
    }, 300);
    return () => clearTimeout(debounce);
  }, [filters, fetchSubscribers]);

  const handleRefresh = () => {
    fetchStats();
    fetchSubscribers(filters);
  };

  const topSources = useMemo(() => {
    return Object.entries(stats.sources)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [stats.sources]);

  if (!canManageEmailTemplates) {
    return <AccessDenied />;
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            Newsletter Subscribers
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your newsletter subscriber list
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="min-h-[44px]"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCsv}
            className="min-h-[44px]"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <UserX className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.inactive.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Source</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">
              {topSources[0]?.[0] || "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {topSources[0]?.[1] ? `${topSources[0][1]} subscribers` : "No data"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email..."
            value={filters.searchQuery}
            onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
            className="pl-10 h-11"
          />
        </div>
        <Select
          value={filters.status}
          onValueChange={(value) =>
            setFilters((prev) => ({ ...prev, status: value as SubscriberFilters["status"] }))
          }
        >
          <SelectTrigger className="w-full sm:w-[150px] h-11">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.source || "all"}
          onValueChange={(value) =>
            setFilters((prev) => ({ ...prev, source: value === "all" ? null : value }))
          }
        >
          <SelectTrigger className="w-full sm:w-[150px] h-11">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {sources.map((source) => (
              <SelectItem key={source} value={source}>
                {source}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Subscribers Table - Desktop */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Subscribed</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : subscribers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No subscribers found
                </TableCell>
              </TableRow>
            ) : (
              subscribers.map((subscriber) => (
                <TableRow key={subscriber.id}>
                  <TableCell className="font-medium">{subscriber.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{subscriber.source || "unknown"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={subscriber.is_active ? "default" : "outline"}>
                      {subscriber.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(subscriber.subscribed_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          updateSubscriberStatus(subscriber.id, !subscriber.is_active)
                        }
                        title={subscriber.is_active ? "Deactivate" : "Reactivate"}
                        className="h-9 w-9"
                      >
                        {subscriber.is_active ? (
                          <ToggleRight className="h-4 w-4 text-green-500" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                      <AlertDialog
                        open={subscriberToDelete?.id === subscriber.id}
                        onOpenChange={(open) => !open && setSubscriberToDelete(null)}
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSubscriberToDelete(subscriber)}
                            className="h-9 w-9 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Subscriber</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete{" "}
                              <strong>{subscriberToDelete?.email}</strong>? This action cannot be
                              undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="min-h-[44px] bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => {
                                if (subscriberToDelete) {
                                  deleteSubscriber(subscriberToDelete.id);
                                  setSubscriberToDelete(null);
                                }
                              }}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Subscribers Cards - Mobile */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))
        ) : subscribers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No subscribers found
            </CardContent>
          </Card>
        ) : (
          subscribers.map((subscriber) => (
            <Card key={subscriber.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{subscriber.email}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant={subscriber.is_active ? "default" : "outline"} className="text-xs">
                        {subscriber.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {subscriber.source || "unknown"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Subscribed {format(new Date(subscriber.subscribed_at), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        updateSubscriberStatus(subscriber.id, !subscriber.is_active)
                      }
                      className="h-10 w-10"
                    >
                      {subscriber.is_active ? (
                        <ToggleRight className="h-5 w-5 text-green-500" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                      )}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 text-destructive"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Subscriber</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete{" "}
                            <strong>{subscriber.email}</strong>?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="min-h-[44px]">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="min-h-[44px] bg-destructive text-destructive-foreground"
                            onClick={() => deleteSubscriber(subscriber.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Results count */}
      {!isLoading && subscribers.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing {subscribers.length} subscriber{subscribers.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
