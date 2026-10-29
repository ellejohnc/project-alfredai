import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Mail, Ruler, FileCheck2, FileText, ShieldCheck, BarChart3, MessageSquare, FolderInput,
  FileDiff, ClipboardCheck, MailCheck, ChevronDown, Check, AlertTriangle, Inbox, ScanLine, GitCompare,
  UserCheck, BookCheck, Plug, Brain, PackageCheck, FileSignature, HardHat, type LucideIcon,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SEO from "@/components/SEO";
import { BOOKING_PAGE_URL } from "@/lib/bookingConfig";

const PATH = "/solutions/ai-for-construction/operations";

type Status = "Available" | "Pilot" | "Customised";
type Dept = "Estimating" | "Project Delivery" | "Commercial" | "Finance" | "Compliance" | "Administration";

type Employee = {
  id: string; role: string; dept: Dept; icon: LucideIcon; status: Status; summary: string;
  responsibilities: string[]; inputs: string[]; outputs: string[]; tools: string[]; outcome: string;
};

const DEPTS: Dept[] = ["Estimating", "Project Delivery", "Commercial", "Finance", "Compliance", "Administration"];

/** Status wording: Available / Pilot / Customised only — never "planned" or "roadmap". */
const EMPLOYEES: Employee[] = [
  { id: "takeoff", role: "Take-Off Estimator", dept: "Estimating", icon: Ruler, status: "Available",
    summary: "Measures quantities from your PDF drawings and drafts the estimate.",
    responsibilities: ["Read drawing sets and schedules", "Measure quantities by trade", "Flag ambiguous or missing items"],
    inputs: ["PDF drawings", "Specifications", "Your rate library"], outputs: ["Quantity schedule", "Draft estimate", "Query list"],
    tools: ["Excel", "Your estimating software"], outcome: "Your estimators review a measured draft instead of starting from a blank sheet." },
  { id: "tender", role: "Tender Coordinator", dept: "Estimating", icon: FileCheck2, status: "Available",
    summary: "Completes tender and bid forms from your governed company knowledge.",
    responsibilities: ["Extract every required field", "Fill company details, licences and insurances", "Report gaps"],
    inputs: ["Tender forms (DOCX, PDF)", "Company profile", "Certificates"], outputs: ["Completed tender form", "Gap report"],
    tools: ["Word", "SharePoint / Google Drive"], outcome: "Submission-ready forms with a clear list of what still needs you." },
  { id: "precon", role: "Pre-Construction Manager", dept: "Estimating", icon: HardHat, status: "Customised",
    summary: "Runs the run-up to a job — documents, enquiries, subcontractor quotes and the bid pack.",
    responsibilities: ["Build and track the pre-construction checklist", "Send and chase subcontractor enquiries", "Assemble the bid pack and handover file"],
    inputs: ["Tender documents", "Drawing and spec revisions", "Subcontractor enquiries"], outputs: ["Pre-construction checklist", "Enquiry and response tracker", "Bid pack and handover file"],
    tools: ["Excel", "Your project platform", "Email"], outcome: "Nothing gets discovered on site that should have been closed out before the job started." },
  { id: "accounts", role: "Accounts Assistant", dept: "Finance", icon: FileText, status: "Available",
    summary: "Reads supplier invoices, matches them to purchase orders and routes them for approval.",
    responsibilities: ["Read invoice line items", "Match to purchase orders", "Route variances to approvers"],
    inputs: ["Supplier invoices (email, PDF)", "Purchase orders"], outputs: ["Coded bill", "Variance note", "Approval request"],
    tools: ["Xero / MYOB", "Your ERP", "Email"], outcome: "Bills arrive coded and matched, with only exceptions needing a person." },
  { id: "reports", role: "Technical Report Writer", dept: "Project Delivery", icon: ClipboardCheck, status: "Available",
    summary: "Turns site findings, photos and notes into consistent inspection reports.",
    responsibilities: ["Organise site photos and notes", "Draft findings in your template", "Prepare for sign-off"],
    inputs: ["Site photos", "Inspection notes"], outputs: ["Draft inspection report"],
    tools: ["Word", "Your project platform"], outcome: "Reports in your format, ready for an engineer to check and sign." },
  { id: "presend", role: "Correspondence Reviewer", dept: "Commercial", icon: MailCheck, status: "Pilot",
    summary: "Checks higher-risk outgoing emails against your contracts and programme before they're sent.",
    responsibilities: ["Spot variations, instructions and notices", "Cross-check contract and programme", "Suggest safer wording"],
    inputs: ["Draft emails", "Contracts", "Programme"], outputs: ["Pre-send advisory with sources"],
    tools: ["Outlook / Gmail"], outcome: "Commercial risks raised before an email leaves the business." },
  { id: "variations", role: "Variations Clerk", dept: "Commercial", icon: FileDiff, status: "Customised",
    summary: "Captures scope changes and keeps an audit trail for each variation.",
    responsibilities: ["Log instructions as variations", "Track pricing and approval", "Keep the register current"],
    inputs: ["Site instructions", "RFIs", "Emails"], outputs: ["Variations register", "Approval requests"],
    tools: ["Excel", "Your project platform"], outcome: "No instruction goes unrecorded or unclaimed." },
  { id: "contracts", role: "Contract Admin", dept: "Commercial", icon: FileSignature, status: "Customised",
    summary: "Keeps contracts, subcontractor agreements and claims organised and on time.",
    responsibilities: ["Track obligations, dates and conditions", "Prepare progress claim and variation paperwork", "Chase signatures and expiries"],
    inputs: ["Executed contracts", "Subcontractor agreements", "Programme dates"], outputs: ["Obligation tracker", "Progress claim pack", "Milestone and expiry reminders"],
    tools: ["Excel", "Your project platform", "Email"], outcome: "Contract dates and obligations stay in front of you, not buried in a folder." },
  { id: "compliance", role: "Compliance Officer", dept: "Compliance", icon: ShieldCheck, status: "Customised",
    summary: "Tracks subcontractor insurances, licences and certificates, and chases expiries.",
    responsibilities: ["Read certificates", "Track expiry dates", "Send reminders and alert you"],
    inputs: ["Certificates of currency", "Licences", "SWMS"], outputs: ["Compliance register", "Expiry alerts"],
    tools: ["Email", "Your project platform"], outcome: "Nobody steps on site with an expired insurance." },
  { id: "reporting", role: "Reporting Analyst", dept: "Project Delivery", icon: BarChart3, status: "Customised",
    summary: "Drafts weekly progress reports and dashboards from your project data.",
    responsibilities: ["Collect progress, cost and programme data", "Draft the weekly report", "Highlight slippage"],
    inputs: ["Daily diaries", "Cost reports", "Programme"], outputs: ["Weekly progress report", "Dashboard"],
    tools: ["Excel", "Power BI", "Your project platform"], outcome: "Project managers review the report rather than build it." },
  { id: "docs", role: "Document Controller", dept: "Administration", icon: FolderInput, status: "Customised",
    summary: "Classifies, files and routes incoming documents so nothing slips through.",
    responsibilities: ["Classify incoming documents", "File to the right project", "Notify the right person"],
    inputs: ["Email attachments", "Drawing revisions", "Transmittals"], outputs: ["Filed documents", "Transmittal log"],
    tools: ["SharePoint / Google Drive", "Email"], outcome: "The latest revision is always where your team expects it." },
  { id: "comms", role: "Client & Subbie Coordinator", dept: "Administration", icon: MessageSquare, status: "Customised",
    summary: "Answers routine enquiries, sends follow-ups and books times.",
    responsibilities: ["Answer routine questions", "Send follow-ups", "Book site visits and meetings"],
    inputs: ["Enquiries by email, chat or phone"], outputs: ["Replies", "Bookings", "Call notes"],
    tools: ["Email", "Calendar", "Your CRM"], outcome: "Routine questions answered without pulling your team off the job." },
];

/** How it learns — the three layers, in plain words. */
const LEARN: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Brain, title: "Omega — your company knowledge", text: "Your documents, rates, rules and past projects, so every task starts with your context." },
  { icon: Plug, title: "Axiom — the reasoning engine", text: "Works out what a task needs and checks the result against your own data." },
  { icon: PackageCheck, title: "alfred Assist — learns from approvals", text: "When your team corrects or approves a result, it's remembered for the next task." },
];

const OVERSIGHT: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: ShieldCheck, title: "Permissions", text: "Each AI Employee only sees and does what its role allows." },
  { icon: UserCheck, title: "Approvals", text: "Anything that matters waits for a person to approve it." },
  { icon: BookCheck, title: "Audit trail", text: "Every action is logged: what it did, from which source, and who approved it." },
  { icon: Plug, title: "Your existing software", text: "It works across the tools you already own — no moving into one vendor's system." },
];

const ROI: { title: string; text: string }[] = [
  { title: "Time saved", text: "Admin hours your team gets back from data entry, chasing and checking." },
  { title: "Work capacity", text: "More invoices, tenders and reports handled with the same team." },
  { title: "Business impact", text: "Fewer missed variations, late payments and errors that cost margin." },
];

const STATUS_STYLE: Record<Status, string> = {
  Available: "border-foreground text-foreground",
  Pilot: "border-primary/40 text-primary",
  Customised: "border-border text-muted-foreground",
};

/** One coherent identity: the same butler-collar mark for every employee, role shown by a small icon. */
function ButlerAvatar({ icon: Icon, size = 44 }: { icon: LucideIcon; size?: number }) {
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden className="text-foreground">
        <circle cx="24" cy="24" r="23" className="fill-muted stroke-border" strokeWidth="1" />
        <circle cx="24" cy="18" r="7" fill="currentColor" />
        <path d="M10 40c2-8 8-12 14-12s12 4 14 12" fill="currentColor" />
        <path d="M20 31l4 3 4-3-4-2z" className="fill-primary" />
      </svg>
      <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-card">
        <Icon className="h-3 w-3" aria-hidden />
      </span>
    </span>
  );
}

function StatusPill({ status }: { status: Status }) {
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STATUS_STYLE[status]}`}>{status}</span>;
}

function EmployeeCard({ e, open, onToggle }: { e: Employee; open: boolean; onToggle: () => void }) {
  const rows: [string, string[]][] = [["Responsibilities", e.responsibilities], ["Inputs", e.inputs], ["Outputs", e.outputs], ["Connected tools", e.tools]];
  return (
    <article className="flex flex-col rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <ButlerAvatar icon={e.icon} />
        <StatusPill status={e.status} />
      </div>
      <p className="mt-4 text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground">{e.dept}</p>
      <h3 className="mt-1 text-lg font-semibold">{e.role}</h3>
      <p className="mt-1 flex-1 text-sm leading-relaxed text-muted-foreground">{e.summary}</p>
      <button type="button" onClick={onToggle} aria-expanded={open} aria-controls={`profile-${e.id}`}
        className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium">
        {open ? "Hide profile" : "View profile"}
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && (
        <div id={`profile-${e.id}`} className="mt-2 space-y-3 border-t border-border pt-4">
          {rows.map(([label, items]) => (
            <div key={label} className="grid grid-cols-[110px_1fr] gap-3 text-sm">
              <span className="text-muted-foreground">{label}</span>
              <span>{items.join(" · ")}</span>
            </div>
          ))}
          <div className="grid grid-cols-[110px_1fr] gap-3 text-sm">
            <span className="text-muted-foreground">Expected outcome</span>
            <span className="font-medium">{e.outcome}</span>
          </div>
        </div>
      )}
    </article>
  );
}

/* ---------- Workflow demo: Accounts Assistant (illustrative data) ---------- */
const DEMO_STEPS: { icon: LucideIcon; title: string; actor: "AI Employee" | "Your team" }[] = [
  { icon: Inbox, title: "Invoice arrives", actor: "AI Employee" },
  { icon: ScanLine, title: "Line items read", actor: "AI Employee" },
  { icon: GitCompare, title: "Matched to the PO", actor: "AI Employee" },
  { icon: UserCheck, title: "Variance approved", actor: "Your team" },
  { icon: BookCheck, title: "Bill posted", actor: "AI Employee" },
];

const LINES = [
  { item: "N12 reinforcing bar, 6m", qty: "120", inv: "$4,320.00", po: "$4,320.00", ok: true },
  { item: "SL82 mesh sheets", qty: "40", inv: "$3,960.00", po: "$3,600.00", ok: false },
  { item: "Bar chairs, 50mm (bag)", qty: "25", inv: "$487.50", po: "$487.50", ok: true },
];

function DemoScreen({ step }: { step: number }) {
  if (step === 0) return (
    <div className="space-y-2 text-sm">
      <p className="text-muted-foreground">accounts@yourbusiness.com.au · 07:42</p>
      <p className="font-semibold">INV-20418 — Example Steel Supplies Pty Ltd</p>
      <p className="text-muted-foreground">Attachment: INV-20418.pdf · Project: Example Street Apartments</p>
      <p className="mt-3 rounded-lg border border-border bg-muted/50 p-3">The Accounts Assistant picks up the email and identifies it as a supplier invoice.</p>
    </div>
  );
  if (step === 1 || step === 2) return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-sm">
        <thead><tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
          <th className="py-2 font-medium">Item</th><th className="font-medium">Qty</th><th className="font-medium">Invoice</th>
          {step === 2 && <><th className="font-medium">PO-3391</th><th className="font-medium">Match</th></>}
        </tr></thead>
        <tbody>{LINES.map((l) => (
          <tr key={l.item} className="border-t border-border">
            <td className="py-2.5">{l.item}</td><td>{l.qty}</td><td className="tabular-nums">{l.inv}</td>
            {step === 2 && <><td className="tabular-nums">{l.po}</td><td>{l.ok
              ? <span className="inline-flex items-center gap-1"><Check className="h-4 w-4" aria-hidden />Matched</span>
              : <span className="inline-flex items-center gap-1 text-primary"><AlertTriangle className="h-4 w-4" aria-hidden />+$360.00</span>}</td></>}
          </tr>))}</tbody>
      </table>
      {step === 2 && <p className="mt-3 text-sm text-muted-foreground">One line is $360.00 above the purchase order, so it goes to a person instead of being posted.</p>}
    </div>
  );
  if (step === 3) return (
    <div className="space-y-3 text-sm">
      <p className="font-semibold">Approval request → Project Manager</p>
      <p className="rounded-lg border border-border p-3">SL82 mesh is invoiced at $99.00/sheet against $90.00 on PO-3391. The supplier's email of 3 March mentions a price rise. Approve the difference?</p>
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex min-h-[40px] items-center rounded-full bg-foreground px-4 text-background">Approve $360.00</span>
        <span className="inline-flex min-h-[40px] items-center rounded-full border border-border px-4">Query supplier</span>
      </div>
      <p className="text-muted-foreground">Your project manager approves. The decision and reason are logged.</p>
    </div>
  );
  return (
    <div className="space-y-2 text-sm">
      <p className="inline-flex items-center gap-1.5 font-semibold"><Check className="h-4 w-4" aria-hidden /> Posted to your accounts software as a draft bill</p>
      <p className="text-muted-foreground">Coded to Example Street Apartments · Reinforcement · $8,767.50 ex GST</p>
      <p className="rounded-lg border border-border bg-muted/50 p-3">Audit trail: received 07:42 · read 07:42 · matched 07:43 · approved by Project Manager 09:15 · posted 09:15</p>
    </div>
  );
}

function WorkflowDemo() {
  const [step, setStep] = useState(0);
  const last = DEMO_STEPS.length - 1;
  return (
    <div className="rounded-2xl border border-border bg-card">
      <ol className="grid grid-cols-5 border-b border-border" aria-label="Workflow steps">
        {DEMO_STEPS.map((s, i) => (
          <li key={s.title}>
            <button type="button" onClick={() => setStep(i)} aria-current={i === step ? "step" : undefined}
              className={`flex min-h-[64px] w-full flex-col items-center justify-center gap-1 px-1 py-3 text-center text-[11px] sm:text-xs transition-colors ${i === step ? "bg-muted font-semibold" : "text-muted-foreground hover:bg-muted/50"}`}>
              <s.icon className={`h-4 w-4 ${i <= step ? "text-foreground" : ""}`} aria-hidden />
              <span className="hidden sm:block">{s.title}</span>
              <span className="sm:hidden">{i + 1}</span>
            </button>
          </li>
        ))}
      </ol>
      <div className="p-5 md:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold">{step + 1}. {DEMO_STEPS[step].title}</h3>
          <span className={`text-[10px] font-semibold uppercase tracking-wider ${DEMO_STEPS[step].actor === "Your team" ? "text-foreground" : "text-primary"}`}>{DEMO_STEPS[step].actor}</span>
        </div>
        <div aria-live="polite" className="min-h-[200px]"><DemoScreen step={step} /></div>
        <div className="mt-6 flex justify-between gap-3">
          <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
            className="min-h-[44px] rounded-full border border-border px-5 text-sm font-medium disabled:opacity-40">Back</button>
          {step < last
            ? <button type="button" onClick={() => setStep((s) => s + 1)} className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-cta px-5 text-sm font-medium text-cta-foreground">Next step <ArrowRight className="h-4 w-4" aria-hidden /></button>
            : <button type="button" onClick={() => setStep(0)} className="min-h-[44px] rounded-full bg-cta px-5 text-sm font-medium text-cta-foreground">Run it again</button>}
        </div>
      </div>
    </div>
  );
}

export default function ConstructionAiSoftwareOperations() {
  const [dept, setDept] = useState<Dept | "All">("All");
  const [openId, setOpenId] = useState<string | null>(null);
  const list = useMemo(() => (dept === "All" ? EMPLOYEES : EMPLOYEES.filter((e) => e.dept === dept)), [dept]);
  const reportHref = `mailto:hello@alfredai.bot?subject=${encodeURIComponent("AI Employees page issue")}&body=${encodeURIComponent(`Page: ${typeof window !== "undefined" ? window.location.href : PATH}\n\nPlease attach a screenshot.`)}`;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="AI Employees for Construction — Meet Your New AI Workforce | alfred ai"
        description="Specialised AI Employees that understand your projects, connect with your existing systems and help execute everyday construction workflows — with your team approving what matters."
        path={PATH}
        breadcrumbs={[{ name: "Home", url: "/" }, { name: "Use Cases", url: "/products/use-cases" }, { name: "AI Employees", url: PATH }]}
      />
      <Header />

      <main>
        {/* Hero — dark charcoal */}
        <section className="bg-foreground pt-24 pb-16 text-background md:pt-32 md:pb-20">
          <div className="container-wide grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-70">AI Employees · The Construction Intelligence Company</p>
              <h1 className="mt-5 text-background text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">Meet Your New AI Workforce.</h1>
              <p className="mt-4 text-xl font-medium text-background md:text-2xl">Built for Construction. <span className="text-primary">Ready to Work.</span></p>
              <p className="mt-5 max-w-xl text-base leading-relaxed opacity-75 md:text-lg">
                AI Employees that understand your projects, connect with your existing systems and help execute everyday construction workflows.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href={BOOKING_PAGE_URL} className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-background px-6 font-medium text-foreground hover:opacity-90">Book a demo <ArrowRight className="h-4 w-4" aria-hidden /></a>
              </div>
            </div>
            {/* Butler-inspired vector: one identity, many roles */}
            <div className="relative mx-auto aspect-square w-full max-w-[380px]" aria-hidden>
              <svg viewBox="0 0 400 400" className="h-full w-full">
                <circle cx="200" cy="200" r="150" fill="none" stroke="currentColor" strokeOpacity="0.15" strokeDasharray="4 6" />
                <circle cx="200" cy="200" r="90" fill="none" stroke="currentColor" strokeOpacity="0.25" />
                {Array.from({ length: 6 }).map((_, i) => {
                  const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
                  const x = 200 + 150 * Math.cos(a), y = 200 + 150 * Math.sin(a);
                  return (
                    <g key={i}>
                      <line x1="200" y1="200" x2={x} y2={y} stroke="currentColor" strokeOpacity="0.15" />
                      <circle cx={x} cy={y} r="22" className="fill-foreground" stroke="currentColor" strokeOpacity="0.5" />
                      <circle cx={x} cy={y - 4} r="6" fill="currentColor" />
                      <path d={`M${x - 11} ${y + 13}c2-7 6-9 11-9s9 2 11 9`} fill="currentColor" />
                      <circle cx={x} cy={y} r="3" className="fill-primary motion-safe:animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} transform={`translate(${-(x - 200) * 0.45} ${-(y - 200) * 0.45})`} />
                    </g>
                  );
                })}
                <circle cx="200" cy="200" r="54" fill="currentColor" />
                <circle cx="200" cy="186" r="15" className="fill-foreground" />
                <path d="M172 228c4-16 14-22 28-22s24 6 28 22" className="fill-foreground" />
                <path d="M192 212l8 6 8-6-8-4z" className="fill-primary" />
              </svg>
            </div>
          </div>
        </section>

        {/* Directory */}
        <section aria-labelledby="directory-heading" className="py-14 md:py-20">
          <div className="container-wide">
            <h2 id="directory-heading" className="text-2xl font-bold tracking-tight md:text-4xl">The AI Employee directory</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">Specialised digital colleagues that work alongside your team — not chatbots, not replacements. Open any role to see what it does, uses and delivers.</p>
            <div role="group" aria-label="Filter by department" className="mt-6 flex gap-2 overflow-x-auto pb-2">
              {(["All", ...DEPTS] as const).map((d) => (
                <button key={d} type="button" onClick={() => setDept(d)} aria-pressed={dept === d}
                  className={`min-h-[44px] shrink-0 rounded-full border px-4 text-sm font-medium transition-colors ${dept === d ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/40"}`}>
                  {d}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              <strong>Available</strong> — running today · <strong>Pilot</strong> — in controlled pilots · <strong>Customised</strong> — built and trained for your business on request.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((e) => <EmployeeCard key={e.id} e={e} open={openId === e.id} onToggle={() => setOpenId(openId === e.id ? null : e.id)} />)}
            </div>
          </div>
        </section>

        {/* Workflow demo */}
        <section aria-labelledby="demo-heading" className="border-y border-border bg-muted/30 py-14 md:py-20">
          <div className="container-wide max-w-5xl">
            <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground">See one at work · Accounts Assistant</p>
            <h2 id="demo-heading" className="mt-2 text-2xl font-bold tracking-tight md:text-4xl">From supplier invoice to posted bill</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">Step through a real-world task. The AI Employee does the routine work; your team decides on the exception.</p>
            <div className="mt-6"><WorkflowDemo /></div>
            <p className="mt-3 text-xs text-muted-foreground">Illustrative example — supplier, project, amounts and times are sample data.</p>
          </div>
        </section>

        {/* How it learns */}
        <section aria-labelledby="learn-heading" className="py-14 md:py-20">
          <div className="container-wide">
            <h2 id="learn-heading" className="text-2xl font-bold tracking-tight md:text-4xl">How it learns your way of working</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">Approved corrections become company knowledge, so the next task starts smarter.</p>
            <ul className="mt-8 grid gap-4 md:grid-cols-3">
              {LEARN.map(({ icon: Icon, title, text }) => (
                <li key={title} className="rounded-2xl border border-border bg-card p-6">
                  <Icon className="h-5 w-5" aria-hidden />
                  <h3 className="mt-3 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Human oversight */}
        <section aria-labelledby="oversight-heading" className="border-y border-border bg-muted/30 py-14 md:py-20">
          <div className="container-wide">
            <h2 id="oversight-heading" className="text-2xl font-bold tracking-tight md:text-4xl">Your team stays in control</h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {OVERSIGHT.map(({ icon: Icon, title, text }) => (
                <li key={title} className="rounded-2xl border border-border bg-card p-6">
                  <Icon className="h-5 w-5" aria-hidden />
                  <h3 className="mt-3 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ROI */}
        <section aria-labelledby="roi-heading" className="py-14 md:py-20">
          <div className="container-wide">
            <h2 id="roi-heading" className="text-2xl font-bold tracking-tight md:text-4xl">What you get back</h2>
            <ol className="mt-8 grid gap-4 md:grid-cols-3">
              {ROI.map(({ title, text }, i) => (
                <li key={title} className="rounded-2xl border border-border bg-card p-6">
                  <span className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="mt-2 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-sm text-muted-foreground">We measure these on your own work during the consultation — no generic figures.</p>
          </div>
        </section>


        <div className="container-wide flex flex-col items-center gap-2 pb-16 text-center">
          <Link to="/products/use-cases" className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium">See all workflows <ArrowRight className="h-4 w-4" aria-hidden /></Link>
          <a href={reportHref} className="inline-flex min-h-[44px] items-center gap-1.5 text-xs text-muted-foreground"><Mail className="h-3.5 w-3.5" aria-hidden /> Something not working? Report an issue</a>
        </div>
      </main>

      <Footer />
    </div>
  );
}
