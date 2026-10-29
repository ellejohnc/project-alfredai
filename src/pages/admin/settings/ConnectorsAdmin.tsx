import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { ApiErrorBanner } from "@/components/ui/ApiErrorBanner";
import {
  Chrome,
  Unplug,
  RefreshCw,
  HardDrive,
  Calendar,
  AlertCircle,
  Plug,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

interface GoogleConnection {
  id: string;
  google_email: string;
  google_name: string | null;
  scopes: string[];
  connected_at: string;
  token_expires_at: string;
}

// ─── Google Connector Card ───────────────────────────────────────────────────

function GoogleConnectorCard() {
  const { user } = useAdminAuth();
  const { toast } = useToast();
  const [connection, setConnection] = useState<GoogleConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isRefreshingToken, setIsRefreshingToken] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const popupPollRef = useRef<number | null>(null);

  useEffect(() => {
    if (user) fetchConnection();
  }, [user]);


  // Handle URL-based callback (fallback)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isPopupWindow = !!window.opener && window.opener !== window;

    if (isPopupWindow && (params.get("google_connected") === "true" || params.get("google_error"))) {
      window.opener.postMessage(
        {
          type: "google_oauth_result",
          success: params.get("google_connected") === "true",
          errorKey: params.get("google_error") || null,
        },
        window.location.origin,
      );
      window.close();
      return;
    }

    if (params.get("google_connected") === "true") {
      toast({ title: "Google Account Connected", description: "Your Google account has been linked successfully." });
      fetchConnection();
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (params.get("google_error")) {
      const errorMsg = getGoogleErrorMessage(params.get("google_error") || "unknown");
      setApiError(errorMsg);
      toast({ title: "Connection Failed", description: errorMsg, variant: "destructive" });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const refreshGoogleTokenIfNeeded = async () => {
    try {
      setIsRefreshingToken(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) return false;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-gdrive-doc?action=check-connection`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );

      if (!response.ok) return false;
      const result = await response.json();
      return !!result?.connected;
    } catch {
      return false;
    } finally {
      setIsRefreshingToken(false);
    }
  };

  const fetchConnection = async () => {
    if (!user) return;
    setIsLoading(true);
    setApiError(null);
    try {
      const { data, error } = await supabase
        .from("user_google_connections")
        .select("id, google_email, google_name, scopes, connected_at, token_expires_at")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;

      if (data && new Date(data.token_expires_at).getTime() <= Date.now()) {
        const refreshed = await refreshGoogleTokenIfNeeded();
        if (refreshed) {
          const { data: refreshedData } = await supabase
            .from("user_google_connections")
            .select("id, google_email, google_name, scopes, connected_at, token_expires_at")
            .eq("user_id", user.id)
            .maybeSingle();
          setConnection(refreshedData || data);
          return;
        }
      }

      setConnection(data);
    } catch (err) {
      setApiError(err?.message || "Failed to load Google connection status.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const onGoogleOAuthMessage = (event: MessageEvent) => {
      const allowedOrigins = new Set([window.location.origin]);
      try {
        allowedOrigins.add(new URL(import.meta.env.VITE_SUPABASE_URL).origin);
      } catch {
        // no-op
      }
      if (!allowedOrigins.has(event.origin)) return;

      const payload = event.data as { type?: string; success?: boolean; errorKey?: string | null } | null;
      if (!payload || payload.type !== "google_oauth_result") return;

      if (popupPollRef.current) {
        window.clearInterval(popupPollRef.current);
        popupPollRef.current = null;
      }

      setIsConnecting(false);

      if (payload.success) {
        toast({ title: "Google Account Connected", description: "Your Google account has been linked successfully." });
        fetchConnection();
        return;
      }

      const errorMsg = getGoogleErrorMessage(payload.errorKey || "unknown");
      setApiError(errorMsg);
      toast({ title: "Connection Failed", description: errorMsg, variant: "destructive" });
    };

    window.addEventListener("message", onGoogleOAuthMessage);
    return () => {
      window.removeEventListener("message", onGoogleOAuthMessage);
      if (popupPollRef.current) {
        window.clearInterval(popupPollRef.current);
        popupPollRef.current = null;
      }
    };
  }, [toast]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setApiError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Session Expired", description: "Please log in again.", variant: "destructive" });
        setIsConnecting(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("google-oauth-initiate", {
        body: {
          returnUrl: window.location.pathname,
          appOrigin: window.location.origin,
        },
      });
      if (error) throw error;

      if (data?.url) {
        const popup = window.open(
          data.url,
          "google-oauth-popup",
          "popup=yes,width=520,height=720,left=200,top=120,toolbar=no,menubar=no,location=yes,resizable=yes,scrollbars=yes,status=no",
        );

        if (!popup || popup.closed || typeof popup.closed === "undefined") {
          window.location.assign(data.url);
          return;
        }

        popup.focus();

        if (popupPollRef.current) {
          window.clearInterval(popupPollRef.current);
        }

        popupPollRef.current = window.setInterval(() => {
          if (popup.closed) {
            if (popupPollRef.current) {
              window.clearInterval(popupPollRef.current);
              popupPollRef.current = null;
            }
            setIsConnecting(false);
            fetchConnection();
          }
        }, 500);

        return;
      }

      throw new Error("No Google OAuth URL returned.");
    } catch (err) {
      setApiError(err?.message || "Could not start Google connection.");
      toast({ title: "Connection Error", description: "Could not start Google connection. Please try again.", variant: "destructive" });
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!connection) return;
    setIsDisconnecting(true);
    setApiError(null);
    try {
      const { error } = await supabase.from("user_google_connections").delete().eq("id", connection.id);
      if (error) throw error;
      setConnection(null);
      toast({ title: "Disconnected", description: "Your Google account has been unlinked." });
    } catch (err) {
      setApiError(err?.message || "Failed to disconnect.");
      toast({ title: "Error", description: "Failed to disconnect. Please try again.", variant: "destructive" });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const isTokenExpired = connection ? new Date(connection.token_expires_at).getTime() <= Date.now() : false;
  const showExpiredState = isTokenExpired && !isRefreshingToken;

  const scopeLabels = [
    { scope: "drive.readonly", label: "Google Drive", icon: HardDrive },
    { scope: "calendar.readonly", label: "Google Calendar", icon: Calendar },
  ];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Chrome className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Google Workspace</CardTitle>
              <CardDescription className="text-xs">Drive & Calendar</CardDescription>
            </div>
          </div>
          {connection && (
            <Badge variant={showExpiredState ? "destructive" : "default"} className="text-xs">
              {isRefreshingToken ? "Refreshing" : showExpiredState ? "Expired" : "Connected"}
            </Badge>
          )}
          {!connection && (
            <Badge variant="outline" className="text-xs">Not Connected</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ApiErrorBanner error={apiError} onRetry={connection ? fetchConnection : handleConnect} onDismiss={() => setApiError(null)} context="connecting Google account" />

        {connection ? (
          <>
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <p className="text-sm font-medium">{connection.google_name || connection.google_email}</p>
              <p className="text-xs text-muted-foreground">{connection.google_email}</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {scopeLabels.map(({ scope, label, icon: Icon }) => {
                  const hasScope = connection.scopes?.some((s) => s.includes(scope));
                  return (
                    <Badge key={scope} variant={hasScope ? "secondary" : "outline"} className="text-xs gap-1">
                      <Icon className="h-3 w-3" />
                      {label}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {showExpiredState && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-xs text-destructive">Your token expired and could not auto-refresh. Reconnect to continue.</p>
              </div>
            )}

            <div className="flex gap-2">
              {showExpiredState && (
                <Button size="sm" onClick={handleConnect} disabled={isConnecting} className="flex-1 touch-manipulation min-h-[44px]">
                  <RefreshCw className="h-4 w-4 mr-1.5" />
                  {isConnecting ? "Reconnecting..." : "Reconnect"}
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={handleDisconnect} disabled={isDisconnecting} className="text-destructive hover:text-destructive flex-1 touch-manipulation min-h-[44px]">
                <Unplug className="h-4 w-4 mr-1.5" />
                {isDisconnecting ? "Disconnecting..." : "Disconnect"}
              </Button>
            </div>
          </>
        ) : (
          <Button onClick={handleConnect} disabled={isConnecting} className="w-full touch-manipulation min-h-[44px]">
            <Chrome className="h-4 w-4 mr-2" />
            {isConnecting ? "Connecting..." : "Connect Google Account"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ─── GHL Connector Card (Placeholder) ────────────────────────────────────────

function GHLConnectorCard() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
              <ExternalLink className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">GoHighLevel</CardTitle>
              <CardDescription className="text-xs">CRM & Automation</CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Configured
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
          <p className="text-sm font-medium">API Key Configured</p>
          <p className="text-xs text-muted-foreground">
            GHL integration is active. Leads and submissions are synced automatically.
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <Badge variant="secondary" className="text-xs">Lead Sync</Badge>
            <Badge variant="secondary" className="text-xs">Submissions</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function getGoogleErrorMessage(key: string): string {
  const map: Record<string, string> = {
    denied: "You cancelled the Google sign-in.",
    token_exchange: "Failed to exchange authorization code. Please try again.",
    auth_failed: "Session expired. Please log in again and retry.",
    save_failed: "Failed to save connection. Please try again.",
    missing_params: "Missing authorization parameters. Please try again.",
    invalid_state: "Invalid session state. Please try again.",
    userinfo: "Could not retrieve Google account info. Please try again.",
    no_refresh_token: "Google did not return offline access. Please reconnect and allow all permissions.",
    unknown: "An unexpected error occurred. Please try again.",
  };
  return map[key] || map.unknown;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ConnectorsAdmin() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Connectors</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage third-party integrations and connected accounts.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <GoogleConnectorCard />
        <GHLConnectorCard />
      </div>
    </div>
  );
}
