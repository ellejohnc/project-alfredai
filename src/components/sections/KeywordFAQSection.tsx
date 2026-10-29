import { type FAQGroupId } from './homepageFaqData';

import { homepageFAQGroups } from './homepageFaqData';

import { memo, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { HelpCircle, ArrowRight, Calculator, ClipboardList, LayoutGrid, CalendarCheck } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { slugifyQuestion, useHashAccordion } from "@/lib/faqAnchors";
import { trackFaqOpen } from "@/lib/faqAnalytics";

// Keyword-targeted FAQs grouped by intent. Questions mirror the top
// question variations surfaced by Semrush for "construction estimating
// software" and "construction project management software" (AU market).
//
// IMPORTANT: The flattened `homepageKeywordFAQs` export below is consumed
// by <SEO /> on the homepage to render a SINGLE FAQPage JSON-LD block, so
// the schema stays unified even though the UI splits the questions into
// tabs. Keep questions/answers identical to what's rendered on screen.

const KeywordFAQSection = memo(() => {
  // Slug IDs so hash URLs (e.g. /#how-much-does-construction-estimating-software-cost)
  // open the right question, switch to its group, and scroll to it.
  const groupsWithSlugs = useMemo(
    () =>
      homepageFAQGroups.map((group) => ({
        ...group,
        faqs: group.faqs.map((faq) => ({ ...faq, id: slugifyQuestion(faq.question) })),
      })),
    []
  );

  const allSlugs = useMemo(
    () => groupsWithSlugs.flatMap((g) => g.faqs.map((f) => f.id)),
    [groupsWithSlugs]
  );

  const [activeGroup, setActiveGroup] = useState<FAQGroupId>("platform");
  const [openValue, setOpenValue] = useHashAccordion(allSlugs);

  // If a hash lands on a question in the inactive group, switch tabs so it's visible.
  useEffect(() => {
    if (!openValue) return;
    const owner = groupsWithSlugs.find((g) => g.faqs.some((f) => f.id === openValue));
    if (owner && owner.id !== activeGroup) {
      setActiveGroup(owner.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openValue]);

  const activeGroupData =
    groupsWithSlugs.find((g) => g.id === activeGroup) ?? groupsWithSlugs[0];

  return (
    <section
      id="faq"
      aria-labelledby="homepage-faq-heading"
      className="py-16 sm:py-24 bg-background"
    >
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 sm:mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-foreground text-sm font-medium mb-4">
            <HelpCircle className="w-4 h-4" aria-hidden="true" />
            <span>Frequently asked questions</span>
          </div>
          <h2
            id="homepage-faq-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight"
          >
            alfred ai, answered
          </h2>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            The questions owners and operations leaders ask before bringing alfred ai into their business.
          </p>
        </motion.div>

        {/* Group switcher — touch-friendly, accessible tablist */}
        <div
          role="tablist"
          aria-label="FAQ topics"
          className="flex flex-col sm:flex-row gap-2 p-1.5 rounded-2xl bg-muted/40 border border-border mb-6 sm:mb-8"
        >
          {groupsWithSlugs.map((group) => {
            const Icon = group.icon;
            const isActive = group.id === activeGroup;
            return (
              <button
                key={group.id}
                role="tab"
                type="button"
                aria-selected={isActive}
                aria-controls={`faq-panel-${group.id}`}
                id={`faq-tab-${group.id}`}
                onClick={() => setActiveGroup(group.id)}
                className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[44px] rounded-xl text-sm sm:text-base font-semibold transition-colors ${
                  isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                <span>{group.shortLabel}</span>
                <span className="hidden sm:inline text-xs font-normal text-muted-foreground">
                  ({group.faqs.length})
                </span>
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          id={`faq-panel-${activeGroupData.id}`}
          aria-labelledby={`faq-tab-${activeGroupData.id}`}
        >
          <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
            <LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{activeGroupData.description}</span>
          </p>

          <Accordion
            type="single"
            collapsible
            className="w-full space-y-3"
            value={openValue}
            onValueChange={(v) => {
              setOpenValue(v || undefined);
              if (v) {
                const faq = activeGroupData.faqs.find((f) => f.id === v);
                if (faq) {
                  trackFaqOpen({
                    slug: v,
                    group: activeGroupData.id,
                    question: faq.question,
                  });
                }
              }
            }}
          >
            {activeGroupData.faqs.map((faq) => (
              <AccordionItem
                key={faq.id}
                value={faq.id}
                id={faq.id}
                className="border border-border rounded-xl bg-card px-4 sm:px-6 data-[state=open]:shadow-sm scroll-mt-24"
              >
                <AccordionTrigger className="text-left text-base sm:text-lg font-semibold text-foreground hover:no-underline py-5 min-h-[44px]">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm sm:text-base text-muted-foreground leading-relaxed pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Fallback: if a user can't find their answer, get them to the highest-intent
            next step (book a call) and offer lower-intent paths underneath. */}
        <div className="mt-10 rounded-2xl border border-border bg-muted/30 p-6 sm:p-8 text-center">
          <h3 className="text-lg sm:text-xl font-semibold text-foreground">
            Still can't see your question?
          </h3>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Book a <strong className="text-foreground">free 30-minute Impact Conversation</strong> with
            our team. You'll get a tailored walkthrough of how alfred ai fits your business, a payback estimate in AUD, and answers to anything not covered above — no slides, no obligation.
          </p>

          <Link
            to="https://new.alfredai.bot/book"
            className="inline-flex items-center gap-2 mt-5 px-6 py-3 min-h-[48px] rounded-lg bg-cta text-cta-foreground font-semibold hover:bg-cta-hover transition-colors shadow-sm"
            aria-label="Book a free 30-minute Impact Conversation"
          >
            Book an Impact Conversation
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>

          <p className="mt-5 text-xs sm:text-sm text-muted-foreground">
            Prefer to self-serve? Browse the{" "}
            <Link to="/faq" className="text-foreground font-medium underline underline-offset-4 hover:no-underline">
              full FAQ library
            </Link>
            , explore{" "}
            <Link to="/solutions" className="text-foreground font-medium underline underline-offset-4 hover:no-underline">
              our solutions
            </Link>{" "}
            and{" "}
            <Link to="/products" className="text-foreground font-medium underline underline-offset-4 hover:no-underline">
              products
            </Link>
            , or{" "}
            <Link to="/contact" className="text-foreground font-medium underline underline-offset-4 hover:no-underline">
              email our team
            </Link>{" "}
            with your page URL and a screenshot — we'll respond within one business day.
          </p>
        </div>
      </div>
    </section>
  );
});

KeywordFAQSection.displayName = "KeywordFAQSection";

export default KeywordFAQSection;
