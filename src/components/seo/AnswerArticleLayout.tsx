import { ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BookingChatModal from "@/components/BookingChatModal";
import PremiumCTASection from "@/components/sections/PremiumCTASection";
import SEO from "@/components/SEO";

export interface AnswerFAQ {
  question: string;
  answer: string;
}

export interface RelatedLink {
  label: string;
  to: string;
}

interface AnswerArticleLayoutProps {
  /** SEO meta */
  metaTitle: string;
  metaDescription: string;
  path: string;
  breadcrumbs: { name: string; url: string }[];
  /** Page header */
  badge: string;
  h1: string;
  /** The direct, citable answer (lifted verbatim by AI engines). Keep 2–4 sentences. */
  answer: string;
  faqs: AnswerFAQ[];
  /** Main body content (sections) */
  children: ReactNode;
  related?: RelatedLink[];
  ctaTitle?: string;
  ctaDescription?: string;
  /** Article structured data (Article schema) */
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
}

/**
 * Reusable answer-first page for SEO + AEO (AI engine) ranking.
 * - Leads with a concise direct answer that LLMs can quote.
 * - Ships FAQPage JSON-LD via the SEO component.
 * - Mobile-first, touch-friendly, with a fallback contact path on every page.
 */
const AnswerArticleLayout = ({
  metaTitle,
  metaDescription,
  path,
  breadcrumbs,
  badge,
  h1,
  answer,
  faqs,
  children,
  related,
  ctaTitle = "See alfred ai on your own projects",
  ctaDescription = "Book an impact conversation. We'll show the time, cost and win-rate impact of agentic AI for your construction business.",
  publishedTime = "2026-01-15T00:00:00+11:00",
  modifiedTime,
  author = "alfred ai",
  section = "Construction AI",
  tags,
}: AnswerArticleLayoutProps) => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={metaTitle}
        description={metaDescription}
        path={path}
        type="article"
        breadcrumbs={breadcrumbs}
        faqs={faqs}
        article={{
          publishedTime,
          modifiedTime: modifiedTime || publishedTime,
          author,
          authorUrl: "https://new.alfredai.bot/about",
          section,
          ...(tags && tags.length > 0 ? { tags } : {}),
        }}
      />
      <Header />

      <main>
        {/* Hero + direct answer */}
        <section className="pt-32 pb-10 md:pt-40 md:pb-14 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent pointer-events-none" />
          <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="container-wide relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl"
            >
              <Badge className="bg-primary mb-4">{badge}</Badge>
              <h1 className="text-3xl md:text-5xl font-semibold text-foreground mb-5 leading-tight">
                {h1}
              </h1>
              {/* Direct answer — AEO citation target */}
              <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
                <p className="text-base md:text-lg text-foreground leading-relaxed">{answer}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <Button size="lg" onClick={() => setIsBookingOpen(true)} className="text-base h-12 px-6">
                  Book an impact conversation
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <Button size="lg" variant="outline" asChild className="text-base h-12 px-6">
                  <Link to="/resources/demos">
                    <Sparkles className="w-4 h-4 mr-2" />
                    See the live demos
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Body */}
        <section className="py-10 md:py-14 bg-background-alt">
          <div className="container-wide max-w-3xl prose-content space-y-10">{children}</div>
        </section>

        {/* FAQ */}
        <section className="py-14 bg-background">
          <div className="container-wide max-w-3xl">
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-8 text-center">
              Frequently asked questions
            </h2>
            <div className="space-y-4">
              {faqs.map((f) => (
                <details
                  key={f.question}
                  className="group bg-card rounded-xl border border-border p-5 [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex items-center justify-between cursor-pointer font-medium text-foreground gap-4">
                    <span>{f.question}</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-90 shrink-0" />
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.answer}</p>
                </details>
              ))}
            </div>

            {related && related.length > 0 && (
              <div className="mt-10">
                <h3 className="text-sm font-semibold text-foreground mb-3">Keep reading</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {related.map((r) => (
                    <Link
                      key={r.to}
                      to={r.to}
                      className="flex items-center justify-between gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary transition-colors"
                    >
                      <span className="text-sm text-foreground">{r.label}</span>
                      <ArrowRight className="w-4 h-4 text-primary shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Fallback contact on every page */}
            <div className="mt-8 p-5 rounded-xl bg-card border border-border flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div className="text-sm text-muted-foreground">
                Can't find what you need?{" "}
                <Link to="/contact" className="text-primary underline">
                  Email us
                </Link>{" "}
                with your question (and a screenshot of this page if something looks off) and we'll
                reply within one business day.
              </div>
            </div>
          </div>
        </section>

        <PremiumCTASection
          title={ctaTitle}
          description={ctaDescription}
          buttonText="Book an impact conversation"
          onButtonClick={() => setIsBookingOpen(true)}
          variant="light"
        />
      </main>

      <Footer />
      <BookingChatModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />
    </div>
  );
};

export default AnswerArticleLayout;
