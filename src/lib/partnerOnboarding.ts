export interface OnboardingStep {
  id: string;
  label: string;
  description?: string;
  /** Internal portal route to complete the step */
  to?: string;
  /** External link (opens in same tab to bypass popup blockers) */
  href?: string;
  /** Label for the action button */
  actionLabel: string;
}

const PORTAL = "/partners/portal";

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "sign_agreement",
    label: "Read and sign the Consulting Partner Agreement",
    description: "Review the terms and confirm your partnership.",
    to: `${PORTAL}/agreement`,
    actionLabel: "Open agreement",
  },
  {
    id: "payment_details",
    label: "Set up your payment and tax details",
    description: "So we can pay your commission when client payments clear.",
    to: `${PORTAL}/payment-details`,
    actionLabel: "Add payment details",
  },
  {
    id: "add_badge",
    label: 'Add the "alfred ai Consulting Partner" badge to your LinkedIn and email signature',
    description: "Grab the badge and brand assets.",
    to: `${PORTAL}/brand`,
    actionLabel: "Update your Linkedin and Email Signature",
  },
  {
    id: "follow_socials",
    label: "Follow and support alfred ai on social media",
    description: "Follow our channels and help amplify alfred ai to your network.",
    to: `${PORTAL}/follow-support`,
    actionLabel: "Follow & support",
  },
  {
    id: "download_kit",
    label: "Download the sales kit",
    description: "Decks, one-pagers and email templates.",
    to: `${PORTAL}/sales-kit`,
    actionLabel: "Open sales kit",
  },
  {
    id: "apply_diy_quote",
    label: "Apply for DIY Quote Builder access",
    description: "Get approved to build client quotes and proposals in the alfred ai tool.",
    to: `${PORTAL}/diy-access`,
    actionLabel: "Apply for access",
  },
  {
    id: "watch_training",
    label: "Watch the product training",
    description: "Learn how to position and demo alfred ai.",
    to: `${PORTAL}/training`,
    actionLabel: "Start training",
  },
  {
    id: "pass_certification",
    label: "Pass the short certification",
    description: "Score 100% on the assessment to be signed off to sell alfred ai.",
    to: `${PORTAL}/training/certification`,
    actionLabel: "Take the assessment",
  },
  {
    id: "register_account",
    label: "Register an account at alfred ai",
    description: "After the product training, create your alfred ai account to get started.",
    href: "https://app.alfredai.bot",
    actionLabel: "Register account",
  },
  {
    id: "use_notetaker",
    label: "Use alfred ai's meeting notetaker for all online meetings",
    description: "Always run the alfred ai notetaker on every online meeting so nothing is missed.",
    href: "https://app.alfredai.bot",
    actionLabel: "Open alfred ai",
  },
  {
    id: "register_deal",
    label: "Register your first deal",
    description: "Lock in your commission on a live opportunity.",
    to: `${PORTAL}/register-deal`,
    actionLabel: "Register a deal",
  },
  {
    id: "kickoff_call",
    label: "Book your kickoff call with your alfred ai contact",
    description: "Get aligned on your go-to-market plan.",
    to: `${PORTAL}/support`,
    actionLabel: "Book kickoff call",
  },
];

export const LOCKED_UNTIL_AGREEMENT_ROUTES = [
  "/partners/portal/payment-details",
  "/partners/portal/brand",
  "/partners/portal/follow-support",
  "/partners/portal/sales-kit",
  "/partners/portal/training",
  "/partners/portal/training/certification",
  "/partners/portal/playbook",
  "/partners/portal/diy-access",
  "/partners/portal/register-deal",
  "/partners/portal/earnings",
];

export function onboardingProgress(state: Record<string, boolean>) {
  const complete = ONBOARDING_STEPS.filter((s) => state?.[s.id]).length;
  return { complete, total: ONBOARDING_STEPS.length };
}
