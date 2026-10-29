import { useState } from "react";
import { Check, Copy, Download, Linkedin, Mail, PartyPopper, Undo2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { usePartnerPortal } from "@/contexts/PartnerPortalContext";


const LINKEDIN_HEADLINE = "alfred ai Consulting Partner";

const LINKEDIN_EXPERIENCE = `alfred ai Consulting Partner

I help builders and contractors put AI to work — from automated take-offs and smart estimating to client follow-up and project intelligence.

If you're looking to reduce admin, speed up bids or give your team an AI advantage, I can show you what's possible with alfred ai.`;

const LINKEDIN_COMPANY_URL = "https://www.linkedin.com/company/alfred-ai-transformation/";
const BRAND_KIT_URL = "https://drive.google.com/drive/folders/1qu0UQao-zexp013ur0OBsU53u8Jx-E4F?usp=sharing";


const EMAIL_SIGNATURE = `Kind regards,
[Your name]
[Your title] | [Your company]

alfred ai Consulting Partner
From Requests to Outcome 10x Faster.

[Phone] | [Email] | [Website]

———
Partner of alfred ai — https://www.alfredai.bot
`;

function CopyBlock({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({ title: "Copied", description: `${label} copied to clipboard.` });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Copy failed", description: "Please copy the text manually.", variant: "destructive" });
    }
  };

  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{text}</p>
      </div>
      <div className="mt-3 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="min-h-[44px] touch-manipulation"
          aria-label={`Copy ${label}`}
        >
          {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-partner-teal/15 text-sm font-semibold text-partner-teal">
        {number}
      </div>
      <div className="flex-1">
        <h3 className="font-portal-display text-base font-semibold text-partner-navy">{title}</h3>
        <div className="mt-1 text-sm leading-relaxed text-slate-600">{children}</div>
      </div>
    </div>
  );
}


export default function BrandIdentity() {
  const { profile, updateOnboarding } = usePartnerPortal();
  const [markedDone, setMarkedDone] = useState(false);
  const [undoing, setUndoing] = useState(false);
  const [copiedLinkedIn, setCopiedLinkedIn] = useState(false);

  const handleMarkDone = async () => {
    try {
      await updateOnboarding({ ...(profile?.onboarding ?? {}), follow_company: true });
      setMarkedDone(true);
      toast({ title: "All done", description: "Your onboarding has been updated." });
    } catch {
      toast({
        title: "Could not save progress",
        description: "Please refresh the page and try again. If this keeps happening, email us at partners@alfredai.bot with a screenshot and the page URL.",
        variant: "destructive",
      });
    }
  };

  const handleUndo = async () => {
    setUndoing(true);
    try {
      await updateOnboarding({ ...(profile?.onboarding ?? {}), follow_company: false });
      setMarkedDone(false);
      toast({ title: "Undone", description: "This step is now marked as not done." });
    } catch {
      toast({
        title: "Could not undo",
        description: "Please refresh the page and try again. If this keeps happening, email us at partners@alfredai.bot with a screenshot and the page URL.",
        variant: "destructive",
      });
    } finally {
      setUndoing(false);
    }
  };

  const copyLinkedInUrl = async () => {
    try {
      await navigator.clipboard.writeText(LINKEDIN_COMPANY_URL);
      setCopiedLinkedIn(true);
      toast({ title: "Copied", description: "LinkedIn URL copied to clipboard." });
      setTimeout(() => setCopiedLinkedIn(false), 2000);
    } catch {
      toast({ title: "Copy failed", description: "Please copy the URL manually.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-portal-display text-2xl font-bold text-partner-navy">
          Update your LinkedIn and email signature
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Show prospects you are an alfred ai Consulting Partner with simple profile and signature updates.
        </p>
      </div>

      <Card className="overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <Tabs defaultValue="linkedin" className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-2 sm:w-auto sm:inline-grid">
            <TabsTrigger value="linkedin" className="gap-2 min-h-[44px]">
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-2 min-h-[44px]">
              <Mail className="h-4 w-4" />
              Email signature
            </TabsTrigger>
          </TabsList>

          <TabsContent value="linkedin" className="space-y-6">
            <Step number={1} title="Update your headline">
              <p>
                Add “alfred ai Consulting Partner” to your LinkedIn headline so it appears under your name in search and posts.
              </p>
              <CopyBlock text={LINKEDIN_HEADLINE} label="LinkedIn headline" />
            </Step>

            <Step number={2} title="Add an Experience entry">
              <p>
                Create a new Experience entry (or edit your current role) and use the copy below. Keep the title as “alfred ai Consulting Partner”.
              </p>
              <p className="mt-2">
                In the <strong>Company</strong> field, search for and select the official alfred ai page. If it does not autocomplete, paste the URL below.
              </p>
              <CopyBlock text={LINKEDIN_COMPANY_URL} label="alfred ai LinkedIn company URL" />
              <CopyBlock text={LINKEDIN_EXPERIENCE} label="LinkedIn Experience copy" />
            </Step>

            <Step number={3} title="Follow the alfred ai company page">
              <p>
                Stay connected with alfred ai updates, product releases and partner content. Follow the official company page on LinkedIn.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href="https://www.linkedin.com/company/alfred-ai-transformation/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] touch-manipulation items-center justify-center gap-2 rounded-lg bg-cta px-4 py-2 text-sm font-medium text-cta-foreground transition-colors hover:bg-cta/90 active:bg-cta/80"
                >
                  <Linkedin className="h-4 w-4" />
                  Visit alfred ai on LinkedIn
                </a>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyLinkedInUrl}
                  className="min-h-[44px] touch-manipulation"
                  aria-label="Copy alfred ai LinkedIn company URL"
                >
                  {copiedLinkedIn ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  {copiedLinkedIn ? "Copied" : "Copy LinkedIn URL"}
                </Button>
              </div>
            </Step>
          </TabsContent>

          <TabsContent value="email" className="space-y-6">
            <Step number={1} title="Open your email signature settings">
              <p>
                In Gmail, Outlook or Apple Mail, go to your signature settings. If you need help finding them, search your email app for “signature”.
              </p>
            </Step>

            <Step number={2} title="Paste the signature template">
              <p>
                Copy the template below and replace the placeholder details in [brackets] with your own. The “alfred ai Consulting Partner” line tells every recipient you are an official partner.
              </p>
              <CopyBlock text={EMAIL_SIGNATURE} label="Email signature template" />
            </Step>

          </TabsContent>
        </Tabs>

        <div className="mt-8 border-t border-slate-100 pt-6">
          <Step number={4} title="Download all branding assets">
            <p>
              Get the full partner kit — logos, badges, colour palettes, one-pagers and templates. Click below to open the Google Drive folder; you will be asked to request access, and the alfred ai team will approve it as quickly as possible.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = BRAND_KIT_URL}
              className="mt-3 min-h-[44px] touch-manipulation"
              aria-label="Download all branding assets from Google Drive"
            >
              <Download className="mr-2 h-4 w-4" />
              Download all branding assets
            </Button>
          </Step>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-6">
          {markedDone || profile?.onboarding?.follow_company ? (
            <div className="flex flex-col gap-3 rounded-lg bg-green-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                <PartyPopper className="h-4 w-4" />
                You have marked this step as done. Nice work.
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
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
              onClick={handleMarkDone}
              className="w-full min-h-[44px] touch-manipulation sm:w-auto"
            >
              I have updated my LinkedIn and email signature
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
