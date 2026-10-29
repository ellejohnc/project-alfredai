import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { Chrome, Unplug, RefreshCw, Mail, HardDrive, FileText, AlertCircle } from "lucide-react";
import { ApiErrorBanner } from "@/components/ui/ApiErrorBanner";

interface GoogleConnection {
  id: string;
  google_email: string;
  google_name: string | null;
  scopes: string[];
  connected_at: string;
  token_expires_at: string;
}

export function GoogleAccountConnect() {
  const { user } = useAdminAuth();
  const { toast } = useToast();
  const [connection, setConnection] = useState<GoogleConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isRefreshingToken, setIsRefreshingToken] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchConnection();
    }
  }, [user]);

  // Handle URL-based callback (fallback if popup didn't work)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('google_connected') === 'true') {
      toast({ title: "Google Account Connected", description: "Your Google account has been linked successfully." });
      fetchConnection();
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (params.get('google_error')) {
      const errorMap: Record<string, string> = {
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
      const errorKey = params.get('google_error') || 'unknown';
      const errorMsg = errorMap[errorKey] || errorMap.unknown;
      setApiError(errorMsg);
      toast({ title: "Connection Failed", description: errorMsg, variant: "destructive" });
      window.history.replaceState({}, '', window.location.pathname);
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
        .from('user_google_connections')
        .select('id, google_email, google_name, scopes, connected_at, token_expires_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data && new Date(data.token_expires_at).getTime() <= Date.now()) {
        const refreshed = await refreshGoogleTokenIfNeeded();
        if (refreshed) {
          const { data: refreshedData } = await supabase
            .from('user_google_connections')
            .select('id, google_email, google_name, scopes, connected_at, token_expires_at')
            .eq('user_id', user.id)
            .maybeSingle();
          setConnection(refreshedData || data);
          return;
        }
      }

      setConnection(data);
    } catch (err) {
      console.error('Error fetching Google connection:', err);
      setApiError(err?.message || "Failed to load Google connection status.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setApiError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Session Expired", description: "Please log in again.", variant: "destructive" });
        return;
      }

      const { data, error } = await supabase.functions.invoke('google-oauth-initiate', {
        body: {
          returnUrl: window.location.pathname,
          appOrigin: window.location.origin,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.assign(data.url);
        return;
      }

      throw new Error('No Google OAuth URL returned.');
    } catch (err) {
      console.error('Error initiating Google OAuth:', err);
      setApiError(err?.message || "Could not start Google connection. Please try again or contact support.");
      toast({
        title: "Connection Error",
        description: "Could not start Google connection. Please try again or contact support.",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!connection) return;
    setIsDisconnecting(true);
    setApiError(null);
    try {
      const { error } = await supabase
        .from('user_google_connections')
        .delete()
        .eq('id', connection.id);

      if (error) throw error;
      setConnection(null);
      toast({ title: "Disconnected", description: "Your Google account has been unlinked." });
    } catch (err) {
      console.error('Error disconnecting Google:', err);
      setApiError(err?.message || "Failed to disconnect. Please try again.");
      toast({
        title: "Error",
        description: "Failed to disconnect. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const isTokenExpired = connection
    ? new Date(connection.token_expires_at).getTime() <= Date.now()
    : false;
  const showExpiredState = isTokenExpired && !isRefreshingToken;

  const scopeLabels = [
    { scope: 'drive.readonly', label: 'Google Drive', icon: HardDrive },
    { scope: 'documents.readonly', label: 'Google Docs', icon: FileText },
    { scope: 'gmail.send', label: 'Gmail', icon: Mail },
  ];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading Google connection...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Chrome className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Google Workspace</CardTitle>
          </div>
          {connection && (
            <Badge variant={showExpiredState ? "destructive" : "default"} className="text-xs">
              {isRefreshingToken ? "Refreshing" : showExpiredState ? "Expired" : "Connected"}
            </Badge>
          )}
        </div>
        <CardDescription>
          Connect your Google account to access Drive, Docs, and Gmail directly.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ApiErrorBanner
          error={apiError}
          onRetry={connection ? fetchConnection : handleConnect}
          onDismiss={() => setApiError(null)}
          context="connecting Google account"
        />

        {connection ? (
          <>
            <div className="rounded-lg border p-3 space-y-2">
              <p className="text-sm font-medium">{connection.google_name || connection.google_email}</p>
              <p className="text-xs text-muted-foreground">{connection.google_email}</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {scopeLabels.map(({ scope, label, icon: Icon }) => {
                  const hasScope = connection.scopes?.some(s => s.includes(scope));
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
                <p className="text-xs text-destructive">
                  Your token expired and could not auto-refresh. Reconnect to continue accessing Google services.
                </p>
              </div>
            )}

            <div className="flex gap-2">
              {showExpiredState && (
                <Button size="sm" onClick={handleConnect} disabled={isConnecting} className="flex-1 touch-manipulation min-h-[44px]">
                  <RefreshCw className="h-4 w-4 mr-1.5" />
                  {isConnecting ? "Reconnecting..." : "Reconnect"}
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="text-destructive hover:text-destructive flex-1 touch-manipulation min-h-[44px]"
              >
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