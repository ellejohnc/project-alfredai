import { Mail, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    q: "How is a deal protected to me?",
    a: "Once you register a deal it's logged against your account while we confirm it. That protects the opportunity to you.",
  },
  {
    q: "When do I get paid commission?",
    a: "Commission is paid once the client's payment clears. Trailing commission runs for the first 12 months of each deal.",
  },
  {
    q: "Can I offer a discount to win a deal?",
    a: "All discounts need CEO approval. Talk to your alfred ai contact before committing to anything off the standard pricing.",
  },
  {
    q: "Who delivers the work once a client signs?",
    a: "alfred ai delivers. You focus on the relationship and the sale — we handle setup, onboarding and ongoing delivery.",
  },
];

export default function PortalSupport() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-portal-display text-2xl font-bold text-partner-navy">Support</h1>
        <p className="mt-1 text-sm text-slate-500">We're here to help you win.</p>
      </div>

      <Card className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Your dedicated alfred ai contact</p>
        <p className="mt-1 font-portal-display text-lg font-semibold text-partner-navy">
          William Zhang
        </p>
        <a href="mailto:william@alfredai.bot" className="text-sm text-partner-pink hover:underline">
          william@alfredai.bot
        </a>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <a
            href="https://alfredai.bot/book"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-partner-pink px-4 py-2.5 text-sm font-semibold text-white hover:bg-partner-pink-hover"
          >
            <Calendar className="h-4 w-4" />
            Book a call
          </a>
          <a
            href="mailto:william@alfredai.bot"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-partner-navy hover:bg-slate-50"
          >
            <Mail className="h-4 w-4" />
            Email partner support
          </a>
        </div>
      </Card>

      <div>
        <h2 className="mb-3 font-portal-display text-base font-semibold text-partner-navy">
          Frequently asked questions
        </h2>
        <Card className="rounded-xl border border-slate-200 bg-white px-6 shadow-sm">
          <Accordion type="single" collapsible>
            {FAQS.map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-slate-100">
                <AccordionTrigger className="text-left text-sm font-medium text-partner-navy">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-slate-600">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>
      </div>
    </div>
  );
}
