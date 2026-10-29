import { useState, useCallback } from "react";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

// ========================================
// 🔑 INSERT YOUR GOOGLE CLIENT ID HERE
// Get it from: https://console.cloud.google.com/apis/credentials
// ========================================
const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";

const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar",
].join(" ");

interface GoogleCalendarConnectProps {
  /** Called with the authorization code after successful sign-in */
  onSuccess?: (code: string) => void;
  /** Called when the user denies access or closes the popup */
  onError?: (error: string) => void;
}

function GoogleCalendarButton({ onSuccess, onError }: GoogleCalendarConnectProps) {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);

  const login = useGoogleLogin({
    flow: "auth-code",
    scope: SCOPES,
    ux_mode: "popup",
    onSuccess: async (codeResponse) => {
      setIsConnecting(false);
      console.log("✅ Authorization code received:", codeResponse.code);

      // ========================================
      // 🔌 INSERT YOUR BACKEND API CALL HERE
      // Exchange the authorization code for tokens server-side:
      //
      // const res = await fetch("/api/google/exchange-token", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ code: codeResponse.code }),
      // });
      // const data = await res.json();
      // setConnectedEmail(data.email);
      // ========================================

      setIsConnected(true);
      toast({
        title: "Google Calendar Connected",
        description: "Your Google account has been linked successfully.",
      });
      onSuccess?.(codeResponse.code);
    },
    onError: (errorResponse) => {
      setIsConnecting(false);
      const message = errorResponse?.error_description || errorResponse?.error || "Google sign-in failed.";
      console.error("❌ Google OAuth error:", message);
      toast({ title: "Connection Failed", description: message, variant: "destructive" });
      onError?.(message);
    },
    onNonOAuthError: () => {
      setIsConnecting(false);
      toast({
        title: "Popup Closed",
        description: "You closed the sign-in window. Try again when ready.",
        variant: "destructive",
      });
      onError?.("Popup closed by user");
    },
  });

  const handleDisconnect = () => {
    setIsConnected(false);
    setConnectedEmail(null);
    toast({ title: "Disconnected", description: "Google Calendar has been disconnected." });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Google Calendar</CardTitle>
          </div>
          {isConnected && (
            <Badge variant="default" className="text-xs gap-1">
              <CheckCircle className="h-3 w-3" />
              Connected
            </Badge>
          )}
        </div>
        <CardDescription>
          Connect your Google account to sync calendar events.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {isConnected ? (
          <>
            {connectedEmail && (
              <div className="rounded-lg border p-3">
                <p className="text-sm font-medium">{connectedEmail}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Calendar access granted</p>
              </div>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handleDisconnect}
              className="w-full text-destructive hover:text-destructive touch-manipulation min-h-[44px]"
            >
              Disconnect
            </Button>
          </>
        ) : (
          <Button
            onClick={() => { setIsConnecting(true); login(); }}
            disabled={isConnecting}
            className="w-full touch-manipulation min-h-[44px] gap-2"
          >
            {isConnecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            {isConnecting ? "Connecting..." : "Connect Google Calendar"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Google Calendar Connect component with OAuth provider wrapper.
 * Replace GOOGLE_CLIENT_ID at the top of this file with your actual client ID.
 */
export function GoogleCalendarConnect(props: GoogleCalendarConnectProps) {
  if (GOOGLE_CLIENT_ID.includes("YOUR_GOOGLE_CLIENT_ID")) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="py-6">
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-xs text-destructive">
              Google Client ID not configured. Open{" "}
              <code className="font-mono text-[11px]">GoogleCalendarConnect.tsx</code> and replace the placeholder.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <GoogleCalendarButton {...props} />
    </GoogleOAuthProvider>
  );
}
