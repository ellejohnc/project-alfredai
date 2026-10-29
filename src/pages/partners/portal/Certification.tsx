import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, XCircle, RotateCcw, Award, Mail } from "lucide-react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { usePartnerProfile } from "@/hooks/usePartnerProfile";
import { usePartnerPortal } from "@/contexts/PartnerPortalContext";
import { useUserAuth } from "@/contexts/UserAuthContext";
import Confetti from "@/components/partners/Confetti";

interface Question {
  q: string;
  options: string[];
  /** index of the correct option (as authored) */
  answer: number;
  /** why this is correct — shown when the user gets it wrong */
  explain: string;
}

/**
 * CORE knowledge — every certification test always includes all 10 of these.
 * These are the non-negotiable facts every partner must know.
 */
const CORE_QUESTIONS: Question[] = [
  {
    q: "What kind of company is alfred ai?",
    options: [
      "A fixed-package SaaS vendor",
      "A specialist that customises AI and software solutions for the construction industry",
      "A general IT reseller",
      "A hardware manufacturer",
    ],
    answer: 1,
    explain:
      "alfred ai is not a SaaS company. We specialise in customising AI and software solutions for the construction industry.",
  },
  {
    q: "What is alfred ai's fundamental technology?",
    options: [
      "Blockchain and crypto",
      "Spreadsheets and templates",
      "Machine learning and knowledge management",
      "Social media automation",
    ],
    answer: 2,
    explain:
      "Our fundamental tech is machine learning and knowledge management, delivered with AI-assisted infrastructure.",
  },
  {
    q: "How much faster can alfred ai deliver custom software versus conventional methods?",
    options: ["2x faster", "5x faster", "10x faster", "About the same"],
    answer: 2,
    explain:
      "With AI-assisted infrastructure we deliver custom software solutions 10x faster than conventional methods.",
  },
  {
    q: "Who is alfred ai's ideal client?",
    options: [
      "Early-stage startups with no processes",
      "Established construction and contracting firms wanting to upgrade non-AI systems to agentic-native",
      "Individual consumers",
      "Government departments only",
    ],
    answer: 1,
    explain:
      "We serve established construction and contracting firms who want to upgrade their non-AI systems and workflows to agentic-native systems.",
  },
  {
    q: "How is alfred ai pricing quoted across regions?",
    options: [
      "Always in AUD regardless of country",
      "In the client's local currency at 1:1 (e.g. $10,000 = A$10,000, US$10,000, C$10,000)",
      "In US dollars only",
      "In cryptocurrency",
    ],
    answer: 1,
    explain:
      "Pricing is quoted in the client's local currency at 1:1 — $10,000 AUD in Australia equals US$10,000 in the US and C$10,000 in Canada.",
  },
  {
    q: "In Australia, what is added to pricing?",
    options: ["Nothing extra", "10% GST", "25% tariff", "A subscription surcharge"],
    answer: 1,
    explain:
      "All financials in Australia include 10% GST. Local taxes are applied accordingly in other regions.",
  },
  {
    q: "What is the golden rule on discounts?",
    options: [
      "Partners can discount up to 10% on the spot",
      "All discounts need CEO approval — no exceptions",
      "Discounts are unlimited to win the deal",
      "Discounts are decided by the client",
    ],
    answer: 1,
    explain:
      "All discounts need CEO approval. No exceptions. Protecting price protects your commission and the partnership.",
  },
  {
    q: "How is trailing commission paid on a deal?",
    options: [
      "Forever, at 10% of the monthly fee",
      "10% of the monthly fee for the first 12 months of each deal, then it stops",
      "A one-off 10% of the setup fee",
      "For 6 months only",
    ],
    answer: 1,
    explain:
      "Trailing commission is 10% of the monthly fee for the first 12 months of each deal, then it stops.",
  },
  {
    q: "Which deals count toward a partner's tier and payout?",
    options: [
      "Any deal that is verbally agreed",
      "Only deals where the client payment has cleared in Stripe",
      "All registered deals immediately",
      "Deals that are still in the pipeline",
    ],
    answer: 1,
    explain:
      "Only deals where the client payment has cleared in Stripe count toward your tier and payout.",
  },
  {
    q: "Which best reflects alfred ai's brand voice when speaking to clients?",
    options: [
      "Empowering and action-oriented, addressing the client directly as 'you'",
      "Distant and third-person, referring to 'the client'",
      "Technical jargon only",
      "Casual slang",
    ],
    answer: 0,
    explain:
      "Our voice is empowering and action-oriented, always addressing the client directly ('you/your'), never 'they'.",
  },
];

/**
 * POOL — 50 additional questions. Each test randomly draws 10 of these,
 * so the test stays fresh and can't be memorised by position.
 */
const POOL_QUESTIONS: Question[] = [
  {
    q: "Why does 10x delivery speed matter to clients?",
    options: [
      "Clients must accept a fixed SaaS package",
      "Clients avoid rigid fixed SaaS packages — alfred ai adapts the system to their workflow",
      "It only reduces alfred ai's internal delivery costs",
      "It has no real benefit for clients",
    ],
    answer: 1,
    explain:
      "Because alfred ai builds faster than conventional methods, clients don't have to settle for rigid, fixed SaaS packages. Their systems adapt to the client's existing workflow.",
  },
  {
    q: "What does 'agentic-native' mean in our positioning?",
    options: [
      "Manual processes with no automation",
      "Intelligent, agentic AI capacity built natively into the workflow rather than bolted on",
      "A single chatbot",
      "Outsourcing work offshore",
    ],
    answer: 1,
    explain:
      "Agentic-native means intelligent agentic AI capacity expands the firm's capabilities natively within their systems and workflows.",
  },
  {
    q: "Which of these is a core outcome we help clients achieve?",
    options: [
      "Accelerate growth, reduce onsite rework, and make quicker decisions with clear data",
      "Replace all their staff",
      "Sell their data",
      "Move them onto generic software",
    ],
    answer: 0,
    explain:
      "We help clients accelerate growth, reduce rework onsite, gain clearer data for quicker decisions, win more jobs, grow without overhead, and improve EBITDA for exit.",
  },
  {
    q: "How does alfred ai help a firm preparing for exit?",
    options: [
      "By lowering their valuation",
      "By improving EBITDA",
      "By increasing overhead",
      "It does not relate to exit",
    ],
    answer: 1,
    explain: "Improving EBITDA for exit is one of the key outcomes we deliver for established firms.",
  },
  {
    q: "What value does alfred ai emphasise about growth?",
    options: [
      "Grow by adding lots of overhead",
      "Grow without adding overhead",
      "Avoid growing",
      "Growth is not a goal",
    ],
    answer: 1,
    explain:
      "We help firms grow without overhead — scaling capacity through agentic AI rather than headcount.",
  },
  {
    q: "Which certifications is alfred ai targeting?",
    options: [
      "PCI-DSS only",
      "ISO 27001, SOC 2 Type II, and GDPR compliance",
      "None",
      "HIPAA only",
    ],
    answer: 1,
    explain: "We are targeting ISO 27001, SOC 2 Type II, and GDPR compliance.",
  },
  {
    q: "When is approval of those certifications expected?",
    options: ["Already approved", "By 31 August 2026", "By 2030", "No timeline set"],
    answer: 1,
    explain: "Approval for ISO 27001, SOC 2 Type II, and GDPR is expected by 31 August 2026.",
  },
  {
    q: "What is the correct order of the deal-to-payout process?",
    options: [
      "Funds released → deal won → client pays",
      "Deal won → client pays → payment clears → deal approved → funds released",
      "Client pays → deal won → funds released → approved",
      "Deal approved → deal won → client pays",
    ],
    answer: 1,
    explain:
      "The process is: deal won, client pays, payment clears in Stripe, deal approved, then funds released.",
  },
  {
    q: "What sets a partner's setup-fee commission rate for a deal?",
    options: [
      "The size of the single deal",
      "Their cumulative sales before this deal (their tier)",
      "A random rate",
      "The client's location",
    ],
    answer: 1,
    explain:
      "The setup rate is set by your cumulative sales before this deal — higher cumulative sales unlock higher tiers.",
  },
  {
    q: "What is the Tier 1 setup-fee commission rate?",
    options: ["5%", "10%", "15%", "25%"],
    answer: 1,
    explain: "Tier 1 (cumulative sales from $0) earns a 10% setup-fee commission rate.",
  },
  {
    q: "What is the top-tier (Tier 4) setup-fee commission rate?",
    options: ["20%", "25%", "30%", "50%"],
    answer: 2,
    explain:
      "Tier 4 — reached above $500,000 cumulative sales — earns the highest 30% setup-fee rate.",
  },
  {
    q: "What cumulative sales unlock Tier 2 (15% setup rate)?",
    options: ["Over $50,000", "Over $100,000", "Over $250,000", "Over $1,000,000"],
    answer: 1,
    explain: "Tier 2 (15%) is reached once cumulative sales pass $100,000 for the financial year.",
  },
  {
    q: "What is EVA?",
    options: [
      "A marketing email tool",
      "A two-way security boundary layer — an AI security guard that protects enterprise data",
      "A payroll system",
      "A project scheduling app",
    ],
    answer: 1,
    explain:
      "EVA is our two-way security boundary layer that lets staff use personal AI without leaking enterprise data or injecting private memory into company workflows.",
  },
  {
    q: "How does EVA handle sensitive data leaving company workflows?",
    options: [
      "It does nothing",
      "DLP and redaction detect and strip sensitive data before it goes out",
      "It emails it to an admin",
      "It deletes the workflow",
    ],
    answer: 1,
    explain:
      "EVA uses DLP and redaction so sensitive data is detected and stripped before it ever leaves company workflows.",
  },
  {
    q: "What does EVA require for high-risk actions?",
    options: [
      "Nothing — they run automatically",
      "Human approval — a person must sign off",
      "A second AI to approve",
      "A paid upgrade",
    ],
    answer: 1,
    explain: "In EVA, high-risk actions require a human to approve and sign off before they proceed.",
  },
  {
    q: "What is Axiom in the alfred ai suite?",
    options: [
      "Custom AI / machine learning trained on the client's own data, processes and decisions",
      "A generic chatbot",
      "An accounting package",
      "A hardware device",
    ],
    answer: 0,
    explain:
      "Axiom is custom AI learning — machine learning trained on your data that gets sharper the more your business runs.",
  },
  {
    q: "What is Butler in the alfred ai suite?",
    options: [
      "A document scanner",
      "Agentic AI agents that work alongside teams, handling repetitive and complex work",
      "A CRM template",
      "A payroll bot",
    ],
    answer: 1,
    explain:
      "Butler is agentic AI — always-on agents embedded in workflows that scale capacity without adding headcount.",
  },
  {
    q: "What is Watch in the alfred ai suite?",
    options: [
      "A time-tracking timesheet",
      "Mission Control for owners — forward-looking signals, risks and opportunities",
      "A video conferencing tool",
      "A security camera feed",
    ],
    answer: 1,
    explain:
      "Watch is Mission Control for owners and operators — it surfaces predictive signals so leadership acts early instead of reacting late.",
  },
  {
    q: "What does Omega (your organisation's brain) do?",
    options: [
      "Stores files",
      "Connects every person, agent, workflow, system and action in real time",
      "Sends invoices only",
      "Replaces the client's website",
    ],
    answer: 1,
    explain:
      "Omega is the brain at the centre. It holds what the business knows, generates the right SOP for the situation, and directs the Butler agents — with human approval at every consequential step.",
  },
  {
    q: "What is AOS (the agentic operating system)?",
    options: [
      "A phone operating system",
      "It connects team, tools and daily work into one place, automating routine tasks and tracking ownership",
      "A spreadsheet add-on",
      "An offline backup tool",
    ],
    answer: 1,
    explain:
      "AOS links the software a business already uses, automates routine work, tracks who owns what, and gives clearer visibility and control.",
  },
  {
    q: "When should you run the alfredBID demo?",
    options: [
      "When the client wants payroll",
      "When the client chases tenders or bids — it shows opportunity capture, tender extraction and bid strategy",
      "Only for consumers",
      "Never",
    ],
    answer: 1,
    explain:
      "alfredBID is for clients who tender or bid — it shows AI-powered opportunity capture, tender document extraction, and bid-strategy synthesis.",
  },
  {
    q: "What does 'agentic AI' mean when describing alfred ai?",
    options: [
      "It is just a chatbot",
      "It does work for you — not just answering questions",
      "It is a human call centre",
      "It only stores data",
    ],
    answer: 1,
    explain: "Agentic AI does work for you; it isn't just a chatbot that responds to prompts.",
  },
  {
    q: "How should you handle an IT buyer worried about lock-in?",
    options: [
      "Tell them it's a rigid SaaS platform they must conform to",
      "Explain it adapts to their existing way of working — the system looks their way and applies accordingly",
      "Tell them to change all their processes",
      "Say it only works one fixed way",
    ],
    answer: 1,
    explain:
      "alfred ai's systems look at your way of working and apply accordingly, so clients aren't forced into a fixed package.",
  },
  {
    q: "A prospect says 'We don't want another SaaS subscription.' What's the best response?",
    options: [
      "alfred ai is a standard SaaS subscription",
      "alfred ai isn't SaaS — it's a customised AI and software solution built around your workflow",
      "Agree it's just another subscription",
      "End the conversation",
    ],
    answer: 1,
    explain:
      "alfred ai isn't SaaS. It's a customised solution shaped to the client's data and processes — they own the outcome.",
  },
  {
    q: "A prospect asks 'Will this replace my staff?' What's the right answer?",
    options: [
      "Yes, it replaces most staff",
      "No — it expands their capacity by removing repetitive work and giving clearer data",
      "Maybe, depending on price",
      "It replaces management only",
    ],
    answer: 1,
    explain:
      "It expands capacity, not replaces people — removing repetitive work so the team focuses on winning and delivering jobs.",
  },
  {
    q: "What size firm is the typical ideal client?",
    options: [
      "Sole operators with no team",
      "Established builders and contractors, typically 10–200 staff",
      "Only firms with 1,000+ staff",
      "Pre-revenue startups",
    ],
    answer: 1,
    explain:
      "The ideal client is an established builder or contractor, typically 10–200 staff, ready to upgrade to an agentic-native model.",
  },
  {
    q: "Who should you avoid targeting (for now)?",
    options: [
      "Established contractors with real quoting workload",
      "Sole operators with no team and little admin load",
      "Firms missing bids",
      "Owners focused on EBITDA",
    ],
    answer: 1,
    explain:
      "Avoid sole operators with no team, bargain SaaS hunters, and firms with no regular quoting or project workflow pain.",
  },
  {
    q: "Which is a strong buying signal?",
    options: [
      "They love their current generic SaaS",
      "They complain off-the-shelf SaaS is too generic or forces them to change how they work",
      "They have no admin load",
      "They want a free one-off",
    ],
    answer: 1,
    explain:
      "A strong signal is frustration that fixed SaaS packages are too generic or force process changes.",
  },
  {
    q: "What's the right approach to building a target list?",
    options: [
      "A cold list of hundreds, quantity over quality",
      "Quality over volume — a focused list of 30–50 genuine fits",
      "Only random businesses",
      "Only overseas firms",
    ],
    answer: 1,
    explain: "A focused list of 30–50 genuine fits out-performs a cold list of hundreds.",
  },
  {
    q: "Roughly how much admin does alfred ai typically automate each week?",
    options: ["A few minutes", "40+ hours", "2 hours", "It adds admin"],
    answer: 1,
    explain: "Headline outcome: 40+ hours of admin automated every week.",
  },
  {
    q: "What is the typical return-on-investment timeframe?",
    options: ["5 years", "90 days", "10 years", "Never"],
    answer: 1,
    explain: "Typical return on investment is around 90 days.",
  },
  {
    q: "What reduction in administrative tasks does alfred ai typically deliver?",
    options: ["5%", "70%", "100%", "No reduction"],
    answer: 1,
    explain: "A typical headline outcome is a 70% reduction in administrative tasks.",
  },
  {
    q: "How is a deal's first-year value calculated?",
    options: [
      "Setup fee only",
      "Setup fee + (monthly fee × 12)",
      "Monthly fee only",
      "Setup fee × 12",
    ],
    answer: 1,
    explain: "First-year value = setup fee + (monthly fee × 12). Only cleared deals count.",
  },
  {
    q: "How is alfred ai pricing structured?",
    options: [
      "A fixed monthly SaaS subscription",
      "Each solution is scoped and priced as a tailored project, with an optional ongoing managed service",
      "Free with ads",
      "Per-seat licensing only",
    ],
    answer: 1,
    explain:
      "alfred ai is not SaaS — each solution is scoped and priced as a tailored project with an optional ongoing managed service component.",
  },
  {
    q: "What is the shape of a great first discovery call?",
    options: [
      "Pitch the whole time",
      "Open, discover (listen), connect to alfred ai, then agree a next step",
      "Send a quote immediately",
      "Only talk price",
    ],
    answer: 1,
    explain:
      "Open and set the agenda, discover by listening, connect what you heard to alfred ai, then agree a clear next step (usually a demo).",
  },
  {
    q: "What is the goal of outreach?",
    options: ["To close on the first message", "A conversation, not a close", "To send a contract", "To collect payment"],
    answer: 1,
    explain: "The goal of outreach is a conversation, not a close — keep messages short, plain and about them.",
  },
  {
    q: "What is the day-14 follow-up message?",
    options: [
      "A hard-sell discount",
      "The break-up: 'Happy to close this off for now — should I check back in a few months?'",
      "A legal threat",
      "A price list",
    ],
    answer: 1,
    explain: "The day-14 'break-up' message often gets the reply that earlier nudges didn't.",
  },
  {
    q: "How does alfred ai handle accuracy and trust concerns?",
    options: [
      "It runs fully unsupervised",
      "It works with a human in the loop — AI does the heavy lifting, people review and approve",
      "It guarantees zero human involvement",
      "It ignores the concern",
    ],
    answer: 1,
    explain:
      "alfred ai works alongside the team with a human in the loop — it does the heavy lifting; people review and approve.",
  },
  {
    q: "How is client data treated for model training?",
    options: [
      "It trains shared models for all customers",
      "Customer data is never used to train models for other customers",
      "It is sold to partners",
      "It is published openly",
    ],
    answer: 1,
    explain: "Customer data is never used to train models for other customers.",
  },
  {
    q: "What level of encryption does alfred ai use?",
    options: [
      "None",
      "Enterprise-grade encryption for data in transit and at rest",
      "Only at rest",
      "Only for emails",
    ],
    answer: 1,
    explain: "alfred ai uses enterprise-grade encryption for data both in transit and at rest.",
  },
  {
    q: "What is the 'SaaS straitjacket' message about?",
    options: [
      "Forcing clients onto a fixed feature list",
      "Escaping fixed SaaS — custom solutions that fit your workflow, not a vendor's fixed feature list",
      "Selling more seats",
      "Locking clients in",
    ],
    answer: 1,
    explain:
      "Lead with escaping the SaaS straitjacket — custom solutions that fit the client's workflow rather than a vendor's fixed feature list.",
  },
  {
    q: "What is the alfred ai iOS app mainly used for?",
    options: [
      "Playing games",
      "Scanning business cards, discovering nearby leads, and a daily feed of high-fit prospects",
      "Video editing",
      "Accounting",
    ],
    answer: 1,
    explain:
      "The iOS app helps partners scan cards, discover nearby leads, and get a daily feed of high-fit prospects matched to their territory.",
  },
  {
    q: "What is the status of the Android app?",
    options: ["Already released", "Coming soon — join the waitlist", "Cancelled", "Never planned"],
    answer: 1,
    explain: "Android is coming soon — partners can join the waitlist or check back for updates.",
  },
  {
    q: "When does a deal start counting toward your cumulative sales and tier?",
    options: [
      "As soon as it is logged",
      "Once funds settle and clear in Stripe",
      "When the client verbally agrees",
      "After 12 months",
    ],
    answer: 1,
    explain:
      "A deal moves from pending to confirmed and starts counting once funds settle and clear in Stripe.",
  },
  {
    q: "What does deal approval lock in?",
    options: [
      "The client's contract length",
      "Your applicable tier (commission rate) for that deal",
      "The product roadmap",
      "Nothing",
    ],
    answer: 1,
    explain: "Approval confirms scope and locks in your applicable tier — and commission rate — for that deal.",
  },
  {
    q: "How is trailing commission paid out over the year?",
    options: [
      "In one lump sum upfront",
      "Monthly for 12 months as each client payment clears",
      "Only at year end",
      "It isn't paid",
    ],
    answer: 1,
    explain: "Trailing commission follows monthly for 12 months as each client payment clears.",
  },
  {
    q: "A solution priced at $10,000 — how is it quoted across regions?",
    options: [
      "A$15,000 everywhere",
      "A$10,000 in Australia, US$10,000 in the US, C$10,000 in Canada (1:1)",
      "Converted via daily FX rates",
      "US$10,000 only",
    ],
    answer: 1,
    explain:
      "Pricing is quoted 1:1 in the client's local currency — $10,000 is A$10,000, US$10,000, or C$10,000.",
  },
  {
    q: "Beyond construction, alfred ai is positioned as the agentic AI execution layer for what?",
    options: [
      "Retail consumers",
      "Construction and professional services",
      "Gaming",
      "Hospitality only",
    ],
    answer: 1,
    explain:
      "alfred ai is the agentic AI execution layer for construction and professional services, orchestrating workflows end-to-end.",
  },
  {
    q: "What is alfred ai's headline tagline in the sales kit?",
    options: [
      "Cheaper software, guaranteed",
      "From Requests to Outcome — 10x Faster",
      "The world's biggest SaaS",
      "AI for everyone",
    ],
    answer: 1,
    explain: "The headline is 'From Requests to Outcome — 10x Faster.'",
  },
  {
    q: "When pitching an estimator or take-off lead, what should you focus on?",
    options: [
      "Speed and accuracy of take-offs and estimates",
      "Payroll automation",
      "Marketing campaigns",
      "Office furniture",
    ],
    answer: 0,
    explain:
      "For estimators, focus on speed and accuracy — a custom AI layer that fits their estimating process and reduces manual work and errors.",
  },
  {
    q: "If a prospect asks something you don't know, what should you do?",
    options: [
      "Make up an answer",
      "Say so honestly and bring in your alfred ai contact",
      "Ignore the question",
      "Promise anything to close",
    ],
    answer: 1,
    explain:
      "If you don't know the answer, say so and bring in your alfred ai contact. Honesty builds trust and protects the deal.",
  },
];

const QUIZ_SIZE = 20; // total questions per test
const POOL_PICK = QUIZ_SIZE - CORE_QUESTIONS.length; // 10 drawn from the pool
const STORAGE_KEY = "alfredai-certification-progress-v2";

/** Fisher–Yates shuffle returning a new array. */
function shuffle<T>(input: T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** A question resolved for a single test instance — options already shuffled. */
interface ResolvedQuestion {
  q: string;
  options: string[];
  answer: number; // index into the shuffled options
  explain: string;
}

function shuffleOptions(question: Question): ResolvedQuestion {
  const order = shuffle(question.options.map((_, i) => i));
  return {
    q: question.q,
    explain: question.explain,
    options: order.map((i) => question.options[i]),
    answer: order.indexOf(question.answer),
  };
}

/** Build a fresh test: all core + random pool picks, questions & options shuffled. */
function buildQuiz(): ResolvedQuestion[] {
  const picked = shuffle(POOL_QUESTIONS).slice(0, POOL_PICK);
  const combined = shuffle([...CORE_QUESTIONS, ...picked]);
  return combined.map(shuffleOptions);
}

const PASS_RATE = 1; // 100% to pass

interface SavedProgress {
  quiz: ResolvedQuestion[];
  answers: (number | null)[];
  submitted: boolean;
}

function isValidResolved(q: unknown): q is ResolvedQuestion {
  const r = q as ResolvedQuestion;
  return (
    !!r &&
    typeof r.q === "string" &&
    Array.isArray(r.options) &&
    r.options.length > 0 &&
    typeof r.answer === "number" &&
    typeof r.explain === "string"
  );
}

function loadProgress(): SavedProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedProgress;
    if (
      !parsed ||
      !Array.isArray(parsed.quiz) ||
      parsed.quiz.length !== QUIZ_SIZE ||
      !parsed.quiz.every(isValidResolved) ||
      !Array.isArray(parsed.answers) ||
      parsed.answers.length !== parsed.quiz.length
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export default function Certification() {
  const { profile } = usePartnerProfile();
  const { profile: portalProfile, updateOnboarding } = usePartnerPortal();
  const { user } = useUserAuth();
  const saved = loadProgress();
  const [quiz, setQuiz] = useState<ResolvedQuestion[]>(() => saved?.quiz ?? buildQuiz());
  const [answers, setAnswers] = useState<(number | null)[]>(
    () => saved?.answers ?? Array(QUIZ_SIZE).fill(null),
  );
  const [submitted, setSubmitted] = useState(saved?.submitted ?? false);
  const [savedTick, setSavedTick] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  // null = not attempted, "ok" = emailed, "failed" = email failed (show fallback)
  const [notifyState, setNotifyState] = useState<null | "ok" | "failed">(null);
  const notifiedRef = useRef(false);

  // Refs hold the latest state for click-away / unload persistence.
  const quizRef = useRef(quiz);
  const answersRef = useRef(answers);
  const submittedRef = useRef(submitted);
  quizRef.current = quiz;
  answersRef.current = answers;
  submittedRef.current = submitted;

  const persist = (next: SavedProgress) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage unavailable (private mode / quota) — fail silently; UI still works.
    }
  };

  // Autosave on every answer / quiz / submit change.
  useEffect(() => {
    persist({ quiz, answers, submitted });
    setSavedTick(true);
    const t = setTimeout(() => setSavedTick(false), 1500);
    return () => clearTimeout(t);
  }, [quiz, answers, submitted]);

  // Fallback: persist when the user clicks away, switches tab, or closes.
  useEffect(() => {
    const save = () =>
      persist({
        quiz: quizRef.current,
        answers: answersRef.current,
        submitted: submittedRef.current,
      });
    window.addEventListener("beforeunload", save);
    window.addEventListener("pagehide", save);
    const onVisibility = () => {
      if (document.visibilityState === "hidden") save();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("beforeunload", save);
      window.removeEventListener("pagehide", save);
      document.removeEventListener("visibilitychange", onVisibility);
      save(); // persist on unmount (navigating to another page)
    };
  }, []);

  const correctCount = useMemo(
    () => answers.reduce((acc, a, i) => acc + (a === quiz[i].answer ? 1 : 0), 0),
    [answers, quiz],
  );
  const allAnswered = answers.every((a) => a !== null);
  const passed = submitted && correctCount === quiz.length;
  const wrong = useMemo(
    () => quiz.map((_, i) => i).filter((i) => answers[i] !== quiz[i].answer),
    [answers, quiz],
  );

  // On a successful pass: celebrate on screen and email the result to William.
  // Guarded by a ref so it fires once per passed attempt.
  useEffect(() => {
    if (!passed || notifiedRef.current) return;
    notifiedRef.current = true;
    setShowConfetti(true);

    // Mark the "pass_certification" onboarding step complete so the partner's
    // qualification progress reflects the passed assessment.
    if (portalProfile && !portalProfile.onboarding?.pass_certification) {
      updateOnboarding({ ...portalProfile.onboarding, pass_certification: true }).catch(
        () => {
          /* non-blocking — progress also re-syncs on next portal load */
        },
      );
    }


    const sendResult = async () => {
      try {
        const { data, error } = await supabase.functions.invoke(
          "notify-certification-result",
          {
            body: {
              partnerName: profile?.full_name ?? user?.email ?? "Partner",
              partnerEmail: user?.email ?? null,
              company: profile?.company ?? null,
              territory: profile?.territory ?? null,
              score: correctCount,
              total: quiz.length,
              passed: true,
            },
          },
        );
        if (error || !data?.success) {
          setNotifyState("failed");
          return;
        }
        setNotifyState("ok");
      } catch {
        // Network/unexpected failure — surface a fallback so the partner can
        // still report their result manually.
        setNotifyState("failed");
      }
    };
    sendResult();
    // notifiedRef (set on line 850) makes this send once per pass, so the
    // effect must NOT re-run when the profile object identity changes — that
    // would be a second result notification for the same attempt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passed, profile, user, correctCount, quiz.length]);

  // Allow re-notifying after a fresh attempt.
  useEffect(() => {
    if (!submitted) {
      notifiedRef.current = false;
      setNotifyState(null);
    }
  }, [submitted]);

  const select = (qi: number, oi: number) => {
    if (submitted) return;
    setAnswers((prev) => {
      const next = [...prev];
      next[qi] = oi;
      return next;
    });
  };

  // Reset builds a brand-new test: new question selection, new question order,
  // and freshly shuffled answer options for every question.
  const reset = () => {
    const freshQuiz = buildQuiz();
    const freshAnswers = Array(QUIZ_SIZE).fill(null);
    setQuiz(freshQuiz);
    setAnswers(freshAnswers);
    setSubmitted(false);
    persist({ quiz: freshQuiz, answers: freshAnswers, submitted: false });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const supportHref = `mailto:partners@alfredai.bot?subject=${encodeURIComponent(
    "Certification issue",
  )}&body=${encodeURIComponent(
    `I hit a problem on the certification page.\nPage URL: ${
      typeof window !== "undefined" ? window.location.href : ""
    }\nPlease describe the issue and attach a screenshot.`,
  )}`;

  return (
    <div className="space-y-8">
      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
      <div>
        <Link
          to="/partners/portal/training"
          className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-partner-navy"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Product &amp; Training
        </Link>
        <h1 className="mt-2 font-portal-display text-2xl font-bold text-partner-navy">
          Short certification
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Pass this to be signed off to sell alfred ai. {QUIZ_SIZE} questions — you need 100% to pass.
          Each attempt draws a fresh mix of questions in a random order, so retries are always a bit
          different. Any questions you miss will show the correct answer so you can learn and retry.
        </p>
      </div>

      {/* Result banner */}
      {submitted && (
        <Card
          className={`rounded-xl border p-6 shadow-sm ${
            passed
              ? "border-partner-teal/30 bg-partner-teal/5"
              : "border-amber-200 bg-amber-50"
          }`}
        >
          <div className="flex items-start gap-3">
            {passed ? (
              <Award className="mt-0.5 h-6 w-6 shrink-0 text-partner-teal" />
            ) : (
              <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-amber-500" />
            )}
            <div className="flex-1">
              <h2 className="font-portal-display text-lg font-semibold text-partner-navy">
                {passed
                  ? "Certified — you scored 100%"
                  : `Not passed yet — ${correctCount}/${quiz.length} correct`}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {passed
                  ? "You're signed off to sell alfred ai. Nice work."
                  : "You need 100% to pass. Review the correct answers below, then try again — you'll get a fresh set of questions in a new order."}
              </p>
              {passed && notifyState === "ok" && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-partner-teal">
                  <CheckCircle2 className="h-4 w-4" />
                  Your result has been sent to the alfred ai team.
                </p>
              )}
              {passed && notifyState === "failed" && (
                <p className="mt-2 text-sm text-amber-600">
                  We couldn't automatically send your result.{" "}
                  <a
                    href={`mailto:william@alfredai.bot?subject=${encodeURIComponent(
                      "Certification result",
                    )}&body=${encodeURIComponent(
                      `I passed the certification (${correctCount}/${quiz.length}).\nName: ${
                        profile?.full_name ?? ""
                      }\nEmail: ${user?.email ?? ""}\nCompany: ${
                        profile?.company ?? ""
                      }\nPage URL: ${
                        typeof window !== "undefined" ? window.location.href : ""
                      }\nPlease attach a screenshot of your result.`,
                    )}`}
                    className="font-medium text-partner-navy underline"
                  >
                    Email your result to the team
                  </a>{" "}
                  with a screenshot.
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={reset}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-partner-pink px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-partner-pink-hover"
                >
                  <RotateCcw className="h-4 w-4" />
                  {passed ? "Retake" : "Try again"}
                </button>
                {passed && (
                  <Link
                    to="/partners/portal/training"
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-partner-navy transition-colors hover:bg-slate-50"
                  >
                    Back to training
                  </Link>
                )}
              </div>
            </div>
          </div>

          {!passed && (
            <div className="mt-5 space-y-3 border-t border-amber-200 pt-4">
              <p className="text-sm font-semibold text-partner-navy">
                Review — correct answers for the {wrong.length} you missed:
              </p>
              {wrong.map((i) => (
                <div key={i} className="rounded-lg bg-white/70 p-3 text-sm">
                  <p className="font-medium text-partner-navy">{quiz[i].q}</p>
                  <p className="mt-1 flex items-start gap-1.5 text-partner-teal">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span className="font-medium">{quiz[i].options[quiz[i].answer]}</span>
                  </p>
                  <p className="mt-1 text-slate-600">{quiz[i].explain}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Questions */}
      <div className="space-y-5">
        {quiz.map((question, qi) => {
          const selected = answers[qi];
          const isCorrect = submitted && selected === question.answer;
          const isWrong = submitted && selected !== question.answer;
          return (
            <Card
              key={qi}
              className={`rounded-xl border p-5 shadow-sm ${
                isWrong
                  ? "border-amber-300"
                  : isCorrect
                  ? "border-partner-teal/40"
                  : "border-slate-200"
              } bg-white`}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-partner-navy text-xs font-bold text-white">
                  {qi + 1}
                </span>
                <h3 className="pt-0.5 text-sm font-semibold text-partner-navy">{question.q}</h3>
              </div>
              <div className="mt-4 space-y-2">
                {question.options.map((opt, oi) => {
                  const chosen = selected === oi;
                  const correctOpt = submitted && oi === question.answer;
                  const wrongChoice = submitted && chosen && oi !== question.answer;
                  return (
                    <button
                      key={oi}
                      onClick={() => select(qi, oi)}
                      disabled={submitted}
                      className={`flex min-h-[44px] w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                        correctOpt
                          ? "border-partner-teal bg-partner-teal/10 text-partner-navy"
                          : wrongChoice
                          ? "border-amber-400 bg-amber-50 text-partner-navy"
                          : chosen
                          ? "border-partner-pink bg-partner-pink/5 text-partner-navy"
                          : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      } ${submitted ? "cursor-default" : ""}`}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold ${
                          chosen || correctOpt
                            ? "border-current"
                            : "border-slate-300 text-slate-400"
                        }`}
                      >
                        {String.fromCharCode(65 + oi)}
                      </span>
                      <span className="flex-1">{opt}</span>
                      {correctOpt && (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-partner-teal" />
                      )}
                      {wrongChoice && <XCircle className="h-4 w-4 shrink-0 text-amber-500" />}
                    </button>
                  );
                })}
              </div>
              {isWrong && (
                <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-slate-600">
                  <strong className="text-partner-navy">Correct answer:</strong>{" "}
                  {question.options[question.answer]} — {question.explain}
                </p>
              )}
            </Card>
          );
        })}
      </div>

      {/* Submit */}
      {!submitted && (
        <div className="sticky bottom-4 z-10">
          <Card className="flex flex-col items-stretch gap-3 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-md backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-0.5">
              <p className="text-sm text-slate-600">
                {allAnswered
                  ? "All questions answered. Submit to see your result."
                  : `${answers.filter((a) => a !== null).length}/${quiz.length} answered — answer all to submit.`}
              </p>
              <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                <CheckCircle2
                  className={`h-3.5 w-3.5 ${savedTick ? "text-partner-teal" : "text-slate-300"}`}
                />
                {savedTick ? "Progress saved" : "Your progress saves automatically"}
              </span>
            </div>
            <button
              onClick={() => {
                setSubmitted(true);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              disabled={!allAnswered}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-partner-pink px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-partner-pink-hover disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            >
              Submit assessment
            </button>
          </Card>
        </div>
      )}

      <p className="flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
        Something not working?
        <a
          href={supportHref}
          className="inline-flex items-center gap-1 font-medium text-slate-500 underline hover:text-partner-navy"
        >
          <Mail className="h-3.5 w-3.5" />
          Email us the issue with a screenshot and the page URL.
        </a>
      </p>
    </div>
  );
}
