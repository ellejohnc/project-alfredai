import { useState } from "react";
import { Check, Copy, ExternalLink, Linkedin, Instagram, Youtube, PartyPopper, Undo2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { usePartnerPortal } from "@/contexts/PartnerPortalContext";
import { CONTACT_INFO } from "@/lib/contactInfo";
import TikTokIcon from "@/components/icons/TikTokIcon";

interface SocialChannel {
  id: string;
  label: string;
  handle: string;
  url: string;
  icon: React.ReactNode;
}

const CHANNELS: SocialChannel[] = [
  {
    id: "linkedin",
    label: "LinkedIn",
    handle: "alfred ai",
    url: CONTACT_INFO.social.linkedin,
    icon: <Linkedin className="h-5 w-5" />,
  },
  {
    id: "youtube",
    label: "YouTube",
    handle: "@alfred ai-agent",
    url: CONTACT_INFO.social.youtube,
    icon: <Youtube className="h-5 w-5" />,
  },
  {
    id: "instagram",
    label: "Instagram",
    handle: "@alfredai.bot",
    url: CONTACT_INFO.social.instagram,
    icon: <Instagram className="h-5 w-5" />,
  },
  {
    id: "tiktok",
    label: "TikTok",
    handle: "@alfredaiservices",
    url: CONTACT_INFO.social.tiktok,
    icon: <TikTokIcon className="h-5 w-5" />,
  },
];

export default function FollowSupport() {
  const { profile, updateOnboarding } = usePartnerPortal();
  const [copied, setCopied] = useState<string | null>(null);
  const [undoing, setUndoing] = useState(false);

  const done = !!profile?.onboarding?.follow_socials;

  const handleVisit = (url: string) => {
    // Same-tab navigation to bypass popup blockers
    window.location.href = url;
  };

  const handleCopy = async (id: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(id);
      toast({ title: "Copied", description: "Link copied to clipboard." });
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast({ title: "Copy failed", description: "Please copy the link manually.", variant: "destructive" });
    }
  };

  const markDone = async (value: boolean) => {
    setUndoing(value === false);
    try {
      await updateOnboarding({ ...(profile?.onboarding ?? {}), follow_socials: value });
      toast({
        title: value ? "Thank you for the support!" : "Undone",
        description: value ? "This step is now marked as done." : "This step is marked as not done.",
      });
    } catch {
      toast({
        title: "Could not save progress",
        description:
          "Please refresh and try again. If this keeps happening, email partners@alfredai.bot with a screenshot and the page URL.",
        variant: "destructive",
      });
    } finally {
      setUndoing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-portal-display text-2xl font-bold text-partner-navy">Follow &amp; support alfred ai</h1>
        <p className="mt-1 text-sm text-slate-500">
          Follow our channels and help amplify alfred ai. Liking, sharing and commenting on our posts builds your
          credibility as a partner and puts alfred ai in front of more of your network.
        </p>
      </div>

      <Card className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <ul className="space-y-3">
          {CHANNELS.map((c) => (
            <li
              key={c.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-partner-teal/10 text-partner-teal">
                  {c.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold text-partner-navy">{c.label}</p>
                  <p className="text-xs text-slate-500">{c.handle}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="cta"
                  size="sm"
                  onClick={() => handleVisit(c.url)}
                  className="min-h-[44px] touch-manipulation"
                  aria-label={`Follow alfred ai on ${c.label}`}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Follow
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(c.id, c.url)}
                  className="min-h-[44px] touch-manipulation"
                  aria-label={`Copy ${c.label} link`}
                >
                  {copied === c.id ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  {copied === c.id ? "Copied" : "Copy link"}
                </Button>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-8 border-t border-slate-100 pt-6">
          {done ? (
            <div className="flex flex-col gap-3 rounded-lg bg-green-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                <PartyPopper className="h-4 w-4" />
                You have followed and supported alfred ai. Thank you!
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => markDone(false)}
                disabled={undoing}
                className="min-h-[44px] touch-manipulation border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              >
                <Undo2 className="mr-2 h-4 w-4" />
                {undoing ? "Undoing…" : "Undo"}
              </Button>
            </div>
          ) : (
            <Button
              variant="cta"
              onClick={() => markDone(true)}
              className="w-full min-h-[44px] touch-manipulation sm:w-auto"
            >
              I have followed and supported alfred ai
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
