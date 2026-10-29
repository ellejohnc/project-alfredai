import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Clock, Loader2, AlertCircle, Calculator, ExternalLink, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useUserAuth } from "@/contexts/UserAuthContext";
import { usePartnerPortal } from "@/contexts/PartnerPortalContext";
import { useToast } from "@/hooks/use-toast";
import { CONTACT_INFO } from "@/lib/contactInfo";

const SUPPORT_EMAIL = CONTACT_INFO.email.support;

type RequestStatus = "pending" | "approved" | "rejected";

interface AccessRequest {
  id: string;
  status: RequestStatus;
  reason: string | null;
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export default function DIYAccess() {
  const { user } = useUserAuth();
  const { profile } = usePartnerPortal();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [request, setRequest] = useState<AccessRequest | null>(null);
  const [reason, setReason] = useState("");
  // Admin / super_admin roles supersede the approval flow — they already have full access.
  const [isAdminUser, setIsAdminUser] = useState(false);

  const fetchRequest = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(false);
    try {
      // Admins (and super_admins) bypass the request flow entirely.
      const { data: roleRows } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      const admin = !!roleRows?.some(
        (r) => r.role === "super_admin" || r.role === "admin",
      );
      setIsAdminUser(admin);
      if (admin) {
        setRequest(null);
        return;
      }

      const { data, error } = await supabase
        .from("diy_access_requests")
        .select("id, status, reason, review_note, reviewed_at, created_at")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      setRequest((data as AccessRequest) ?? null);
      if (data?.reason) setReason(data.reason);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const payload = {
        user_id: user.id,
        full_name: profile?.full_name ?? null,
        email: user.email ?? null,
        company: profile?.company ?? null,
        reason: reason.trim() || null,
      };
      // Upsert: re-applying after a rejection re-opens the request as pending.
      const { error } = await supabase
        .from("diy_access_requests")
        .upsert(payload, { onConflict: "user_id" });
      if (error) throw error;
      toast({
        title: "Request submitted",
        description: "An admin will review your DIY Quote Builder access shortly.",
      });
      await fetchRequest();
    } catch {
      toast({
        variant: "destructive",
        title: "Couldn't submit your request",
        description: (
          <span>
            Please try again, or{" "}
            <a
              className="underline"
              href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
                "DIY Quote access request error",
              )}&body=${encodeURIComponent(
                `I hit an error requesting DIY Quote Builder access.\n\nPage: ${window.location.href}\n\n(Please attach a screenshot.)`,
              )}`}
            >
              email support
            </a>
            .
          </span>
        ) as unknown as string,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Calculator className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">DIY Quote Builder access</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Get approved to build, save and load client quotes. Your access is scoped to the
            quotes you manage — you won't see company-wide quotes.
          </p>
        </div>
      </div>

      {loadError && (
        <Card className="p-4 border-destructive/30 bg-destructive/5">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-foreground">We couldn't load your request status.</p>
              <button
                onClick={fetchRequest}
                className="text-primary underline underline-offset-2 mt-1 min-h-[40px]"
              >
                Try again
              </button>
              <span className="text-muted-foreground">
                {" "}or{" "}
                <a className="text-primary underline" href={`mailto:${SUPPORT_EMAIL}`}>
                  email support
                </a>
                .
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Admin / super_admin — already has full access, no request needed */}
      {isAdminUser && (
        <Card className="p-5 border-partner-teal/40 bg-partner-teal/5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-partner-teal/15 flex items-center justify-center shrink-0">
              <Check className="w-5 h-5 text-partner-teal" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">You have full access</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your admin role already grants full Quote Builder access — no approval needed.
              </p>
              <Button asChild className="mt-3 min-h-[44px]">
                <a href="/explained/pricing/diy-quote">
                  Open the Quote Builder
                  <ExternalLink className="w-4 h-4 ml-1" />
                </a>
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Approved */}
      {!isAdminUser && request?.status === "approved" && (
        <Card className="p-5 border-partner-teal/40 bg-partner-teal/5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-partner-teal/15 flex items-center justify-center shrink-0">
              <Check className="w-5 h-5 text-partner-teal" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">You're approved 🎉</p>
              <p className="text-sm text-muted-foreground mt-1">
                Sign in to the Quote Builder to start creating quotes. You'll only see and manage
                the quotes you create.
              </p>
              <Button asChild className="mt-3 min-h-[44px]">
                <a href="/explained/pricing/diy-quote">
                  Open the Quote Builder
                  <ExternalLink className="w-4 h-4 ml-1" />
                </a>
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Pending */}
      {!isAdminUser && request?.status === "pending" && (
        <Card className="p-5 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Request pending review</p>
              <p className="text-sm text-muted-foreground mt-1">
                Thanks — an admin will review your request and approve your access. You'll be able to
                build quotes here once approved.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Rejected */}
      {!isAdminUser && request?.status === "rejected" && (
        <Card className="p-5 border-destructive/30 bg-destructive/5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-destructive/15 flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Request not approved</p>
              {request.review_note ? (
                <p className="text-sm text-muted-foreground mt-1">{request.review_note}</p>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">
                  Your request wasn't approved this time. You can update your reason and re-apply
                  below, or{" "}
                  <a className="text-primary underline" href={`mailto:${SUPPORT_EMAIL}`}>
                    contact support
                  </a>
                  .
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Apply / re-apply form (hidden once approved) */}
      {!isAdminUser && request?.status !== "approved" && (
        <Card className="p-5 space-y-4">
          <div>
            <h2 className="font-semibold text-foreground">
              {request ? "Update your request" : "Apply for access"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Tell us briefly how you plan to use the Quote Builder (optional).
            </p>
          </div>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. I'm working with two prospects and need to send them proposals."
            rows={4}
            maxLength={1000}
            className="resize-none"
          />
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full min-h-[44px]"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting…
              </>
            ) : request?.status === "rejected" ? (
              "Re-apply for access"
            ) : request ? (
              "Update request"
            ) : (
              "Request access"
            )}
          </Button>
        </Card>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Need help?{" "}
        <Link to="/partners/portal/support" className="text-primary underline underline-offset-2">
          Visit support
        </Link>{" "}
        or{" "}
        <a className="text-primary underline underline-offset-2" href={`mailto:${SUPPORT_EMAIL}`}>
          email us
        </a>
        .
      </p>
    </div>
  );
}
