import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePartnerPortal } from "@/contexts/PartnerPortalContext";
import { useUserAuth } from "@/contexts/UserAuthContext";
import { ShieldCheck, Loader2 } from "lucide-react";
import logo from "/alfred-ai-logo.png";
import { SUPPORT_EMAIL } from "@/lib/siteConfig";

export default function ChangePassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, refresh } = usePartnerPortal();
  const { signOut } = useUserAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: "Password too short", description: "Use at least 8 characters.", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "Passwords don't match", description: "Please re-enter them.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      if (profile) {
        const { error: profileErr } = await supabase
          .from("partner_profiles")
          .update({ must_change_password: false })
          .eq("user_id", profile.user_id);
        if (profileErr) throw profileErr;
      }

      await refresh();
      toast({ title: "Password updated", description: "Welcome to the partner portal." });
      navigate("/partners/portal", { replace: true });
    } catch (err) {
      toast({
        title: "Couldn't update password",
        description:
          err instanceof Error
            ? `${err.message} If this keeps happening, email ${SUPPORT_EMAIL} with a screenshot of this page.`
            : `Something went wrong. Please email ${SUPPORT_EMAIL}.`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-partner-bg px-4 py-10 font-portal">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src={logo} alt="alfred ai" className="mb-4 h-9 w-auto" />
          <h1 className="font-portal-display text-2xl font-bold text-partner-navy">Set your password</h1>
          <p className="mt-1 text-sm text-slate-500">
            For your security, please replace your temporary password before continuing.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-5 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-partner-pink/10 text-partner-pink">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <p className="text-sm font-medium text-partner-navy">Create a new password</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-partner-navy">New password</span>
              <input
                required
                type="password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="portal-input"
                placeholder="At least 8 characters"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-partner-navy">Confirm password</span>
              <input
                required
                type="password"
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="portal-input"
                placeholder="Re-enter your password"
              />
            </label>

            <button
              type="submit"
              disabled={saving}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-partner-pink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-partner-pink-hover disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                "Save password & continue"
              )}
            </button>
          </form>

          <button
            onClick={() => signOut()}
            className="mt-4 block w-full text-center text-sm font-medium text-slate-500 hover:text-partner-navy"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
