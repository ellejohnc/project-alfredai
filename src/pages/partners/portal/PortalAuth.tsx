import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { APP_URL, SUPPORT_EMAIL } from "@/lib/siteConfig";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2 } from "lucide-react";
import logo from "/alfred-ai-logo.png";
import type { Territory } from "@/lib/partnerCommission";

const TERRITORIES: { value: Territory; label: string }[] = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "ANZ", label: "Australia / New Zealand" },
];

export default function PortalAuth() {
  const [mode, setMode] = useState<"signin" | "apply">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [territory, setTerritory] = useState<Territory>("ANZ");
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "apply") {
        const applicantEmail = email.trim().toLowerCase();
        const { error } = await supabase.from("partner_applications").insert({
          full_name: fullName.trim(),
          email: applicantEmail,
          company: company.trim() || null,
          phone: phone.trim() || null,
          territory,
          status: "pending",
        });
        if (error) throw error;
        // Fire-and-forget admin alert. Never block or fail the application on this.
        supabase.functions
          .invoke("notify-partner-application", { body: { email: applicantEmail } })
          .catch((notifyErr) => console.warn("Partner application alert failed:", notifyErr));
        setApplied(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/partners/portal");
      }
    } catch (err) {
      toast({
        title: "Something went wrong",
        description:
          err instanceof Error
            ? `${err.message} If this keeps happening, email ${SUPPORT_EMAIL}.`
            : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${APP_URL}/partners/portal`,
      });
      if (result.error) throw new Error(result.error.message ?? "Google sign-in failed");
      if (result.redirected) return;
      navigate("/partners/portal");
    } catch (err) {
      toast({
        title: "Google sign-in failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-partner-bg px-4 py-10 font-portal">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <img src={logo} alt="alfred ai" className="mb-4 h-9 w-auto" />
          <h1 className="font-portal-display text-2xl font-bold text-partner-navy">
            Consulting Partner Portal
          </h1>
          <p className="mt-1 text-sm text-slate-500">Secure · Done-for-you · ROI Guaranteed</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {applied ? (
            <div className="py-4 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-partner-teal/15">
                <CheckCircle2 className="h-6 w-6 text-partner-teal" />
              </div>
              <h2 className="font-portal-display text-lg font-semibold text-partner-navy">
                Application received
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Thanks, {fullName.split(" ")[0] || "there"}. An alfred ai team member will review your
                application. Once you're approved, we'll email your login details so you can access
                the portal.
              </p>
              <button
                onClick={() => {
                  setApplied(false);
                  setMode("signin");
                }}
                className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-partner-pink px-5 py-2.5 text-sm font-semibold text-white hover:bg-partner-pink-hover"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6 flex rounded-lg bg-slate-100 p-1">
                {([
                  { key: "signin", label: "Sign in" },
                  { key: "apply", label: "Apply" },
                ] as const).map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setMode(m.key)}
                    className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
                      mode === m.key ? "bg-white text-partner-navy shadow-sm" : "text-slate-500"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "apply" && (
                  <>
                    <Field label="Full name">
                      <input
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="portal-input"
                        placeholder="Jane Smith"
                      />
                    </Field>
                    <Field label="Company">
                      <input
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="portal-input"
                        placeholder="Acme Advisory"
                      />
                    </Field>
                    <Field label="Phone (optional)">
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="portal-input"
                        placeholder="+61 ..."
                      />
                    </Field>
                    <Field label="Territory">
                      <select
                        value={territory}
                        onChange={(e) => setTerritory(e.target.value as Territory)}
                        className="portal-input"
                      >
                        {TERRITORIES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </>
                )}
                <Field label="Email">
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="portal-input"
                    placeholder="you@company.com"
                  />
                </Field>
                {mode === "signin" && (
                  <Field label="Password">
                    <input
                      required
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="portal-input"
                      placeholder="••••••••"
                    />
                  </Field>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex min-h-[44px] w-full items-center justify-center rounded-lg bg-partner-pink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-partner-pink-hover disabled:opacity-60"
                >
                  {loading
                    ? "Please wait…"
                    : mode === "signin"
                      ? "Sign in"
                      : "Submit application"}
                </button>
              </form>

              {mode === "signin" && (
                <>
                  <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
                    <div className="h-px flex-1 bg-slate-200" />
                    or
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>

                  <button
                    onClick={handleGoogle}
                    className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-partner-navy transition-colors hover:bg-slate-50"
                  >
                    <img src="https://www.google.com/favicon.ico" alt="" className="h-4 w-4" />
                    Continue with Google
                  </button>
                </>
              )}

              {mode === "apply" && (
                <p className="mt-4 text-center text-xs leading-relaxed text-slate-500">
                  Applications are reviewed by alfred ai. Once approved, we'll email your login
                  details — you'll set your own password on first sign-in.
                </p>
              )}
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          <Link to="/" className="hover:text-partner-navy">
            ← Back to alfredai.bot
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-partner-navy">{label}</span>
      {children}
    </label>
  );
}
