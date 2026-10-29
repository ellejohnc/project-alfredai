import { useState, useMemo, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { HelpCircle, Search, X, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import DOMPurify from "dompurify";
import SEO from "@/components/SEO";
import Header from "@/components/layout/Header";
import GEOCitationBlock from "@/components/geo/GEOCitationBlock";
import Footer from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { usePublishedFAQs } from "@/hooks/usePublishedContent";
import AdminQuickEditBanner from "@/components/admin/AdminQuickEditBanner";
import { slugifyQuestion, useHashAccordion } from "@/lib/faqAnchors";
import { trackFaqOpen } from "@/lib/faqAnalytics";

// Static fallback data
const staticFaqCategories = [
  {
    title: "Getting Started",
    faqs: [
      {
        question: "What is alfred ai?",
        answer: "alfred ai is an AI-powered operating layer designed for mid-market firms ($10M–$300M revenue). It helps professional and operational firms automate workflows, gain execution visibility, and scale output without hiring additional headcount.",
      },
      {
        question: "Who is alfred ai designed for?",
        answer: "alfred ai is built for professional services firms, operations-heavy businesses, and mid-market companies where leadership needs better execution visibility, accountability tracking, and the ability to scale efficiently without growing the team proportionally.",
      },
      {
        question: "How long does implementation take?",
        answer: "Most teams are up and running within 2-4 weeks. Our implementation process includes workflow analysis, system configuration, team training, and ongoing support to ensure successful adoption.",
      },
    ],
  },
  {
    title: "Features & Capabilities",
    faqs: [
      {
        question: "What workflows can alfred ai automate?",
        answer: "alfred ai can automate a wide range of workflows including contract review, invoice processing, site inspections, recruitment screening, proposal generation, procurement tracking, and customer support. Our platform adapts to your specific business processes.",
      },
      {
        question: "Does alfred ai integrate with existing tools?",
        answer: "Yes! alfred ai integrates with popular business tools including CRMs, ERPs, project management software, document management systems, and communication platforms. We also support custom integrations via our API.",
      },
      {
        question: "How does the AI learn my business processes?",
        answer: "alfred ai uses a combination of pre-built industry templates and adaptive learning. During onboarding, we analyze your existing workflows, documents, and processes to customize the AI for your specific needs.",
      },
    ],
  },
  {
    title: "Pricing & Plans",
    faqs: [
      {
        question: "How is alfred ai priced?",
        answer: "alfred ai offers flexible pricing based on your team size and usage. We offer monthly and annual plans with volume discounts. Contact our sales team for a customized quote based on your specific requirements.",
      },
      {
        question: "Is there a free trial available?",
        answer: "Yes, we offer a personalized demo and pilot program. Book a demo to see alfred ai in action with your actual workflows, and discuss a trial period to evaluate the platform with your team.",
      },
      {
        question: "What's included in the subscription?",
        answer: "All plans include access to the core platform, workflow automation, analytics dashboard, integrations, email support, and regular platform updates. Enterprise plans include dedicated support, custom integrations, and SLA guarantees.",
      },
    ],
  },
  {
    title: "Security & Compliance",
    faqs: [
      {
        question: "Is my data secure with alfred ai?",
        answer: "Absolutely. We use enterprise-grade encryption for data in transit and at rest, maintain SOC 2 Type II compliance, and follow industry best practices for data security. Your data is never used to train models for other customers.",
      },
      {
        question: "Where is my data stored?",
        answer: "Data is stored in secure, SOC 2 certified data centers. We offer data residency options for customers with specific geographic requirements. Contact us for details about regional data storage options.",
      },
      {
        question: "Do you comply with GDPR?",
        answer: "Yes, alfred ai is fully GDPR compliant. We provide data processing agreements, support data subject access requests, and give you complete control over your data retention and deletion policies.",
      },
    ],
  },
  {
    title: "Support",
    faqs: [
      {
        question: "What support is available?",
        answer: "All customers receive email support with response within 24 hours. Business and Enterprise plans include priority support, dedicated account managers, and phone/video call support during business hours.",
      },
      {
        question: "Do you provide training?",
        answer: "Yes! Every implementation includes comprehensive training for your team. We also provide ongoing training resources, documentation, video tutorials, and webinars to help you get the most from alfred ai.",
      },
      {
        question: "How do I get help if something isn't working?",
        answer: "You can reach our support team via email at support@alfredai.bot, through the in-app help center, or by contacting your dedicated account manager (for Business/Enterprise plans). We also maintain a comprehensive knowledge base.",
      },
    ],
  },
];

// Storage key for category order (same as admin panel)
const CATEGORY_ORDER_KEY = 'faq-category-order';

const FAQPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true, margin: "-100px" });
  
  // Fetch published FAQs from database
  const { items: dbFaqs, isLoading } = usePublishedFAQs();

  // Load category order from localStorage
  useEffect(() => {
    const savedOrder = localStorage.getItem(CATEGORY_ORDER_KEY);
    if (savedOrder) {
      try {
        setCategoryOrder(JSON.parse(savedOrder));
      } catch (e) {
        console.error('Failed to parse category order:', e);
      }
    }
  }, []);

  // Default category order (fallback if no custom order set)
  const defaultCategoryOrder = [
    'Getting Started',
    'Features & Capabilities', 
    'Pricing & Plans',
    'Security & Compliance',
    'Support',
    'General'
  ];

  const faqCategories = useMemo(() => {
    if (dbFaqs.length === 0) {
      return staticFaqCategories;
    }

    // Group database FAQs by category
    const grouped = dbFaqs.reduce((acc, faq) => {
      const category = faq.category || 'General';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push({
        question: faq.question,
        answer: faq.answer,
        sort_order: faq.sort_order || 0,
      });
      return acc;
    }, {} as Record<string, { question: string; answer: string; sort_order: number }[]>);

    // Sort FAQs within each category by sort_order
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => a.sort_order - b.sort_order);
    });

    // Use custom order from admin, fall back to default order
    const orderToUse = categoryOrder.length > 0 ? categoryOrder : defaultCategoryOrder;

    // Sort categories by custom/predefined order, then alphabetically for unlisted ones
    const sortedCategories = Object.entries(grouped).sort(([a], [b]) => {
      const indexA = orderToUse.indexOf(a);
      const indexB = orderToUse.indexOf(b);
      
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.localeCompare(b);
    });

    return sortedCategories.map(([title, faqs]) => ({
      title,
      faqs: faqs.map(({ question, answer }) => ({ question, answer })),
    }));
  }, [dbFaqs, categoryOrder]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return faqCategories;
    
    const query = searchQuery.toLowerCase();
    return faqCategories
      .map(category => ({
        ...category,
        faqs: category.faqs.filter(
          faq =>
            faq.question.toLowerCase().includes(query) ||
            faq.answer.toLowerCase().includes(query)
        ),
      }))
      .filter(category => category.faqs.length > 0);
  }, [searchQuery, faqCategories]);

  const totalResults = filteredCategories.reduce((acc, cat) => acc + cat.faqs.length, 0);

  // Flatten all FAQs for JSON-LD schema
  const allFaqs = useMemo(() => {
    return faqCategories.flatMap(category => 
      category.faqs.map(faq => ({
        question: faq.question,
        answer: faq.answer
      }))
    );
  }, [faqCategories]);

  // Deep-link anchors: build slug list and bind to URL hash so /faq#<slug>
  // auto-expands and scrolls to the matching question.
  const allSlugs = useMemo(
    () => allFaqs.map((f) => slugifyQuestion(f.question)),
    [allFaqs]
  );
  const [openValue, setOpenValue] = useHashAccordion(allSlugs);

  // If the user lands via a hash, clear any active search so the target
  // question isn't filtered out of view (fallback behaviour).
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash && searchQuery) {
      setSearchQuery("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Construction AI FAQ - Agentic AI for Contractors" 
        description="Find answers about agentic AI for construction: implementation timelines, ROI expectations, workflow automation, and how to achieve 10x faster project delivery."
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "FAQ", url: "/faq" }
        ]}
        faqs={allFaqs}
      />
      <Header />
      <main className="pt-24 pb-16">
        {/* Hero Section with Gradient */}
        <section ref={heroRef} className="relative overflow-hidden">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-background to-primary/5" />
          <div className="absolute top-0 left-1/3 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          
          <div className="container-wide py-16 relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 30 }} 
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto text-center mb-12"
            >
              <motion.span 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={heroInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 text-violet-500 rounded-full text-sm font-medium mb-6"
              >
                <HelpCircle className="w-4 h-4" />
                FAQ
              </motion.span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                Frequently Asked{" "}
                <span className="text-gradient bg-gradient-to-r from-violet-500 via-primary to-primary bg-clip-text text-transparent">
                  Questions
                </span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">Find answers to common questions about alfred ai</p>
              
              {/* Search Bar */}
              <div className="max-w-md mx-auto relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-10 py-3 h-12 text-base bg-card border-border rounded-xl"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              {searchQuery && (
                <p className="text-sm text-muted-foreground mt-3">
                  {totalResults} result{totalResults !== 1 ? 's' : ''} found
                </p>
              )}
            </motion.div>
          </div>
        </section>


        {/* Admin Quick Edit Banner */}
        <AdminQuickEditBanner adminPath="/admin/faqs" label="Manage FAQs" />

        {/* FAQ Content */}
        <section className="py-8 bg-background-alt">
          <div className="container-wide">
            <div className="max-w-3xl mx-auto space-y-8">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((category, categoryIndex) => (
                      <motion.div
                        key={category.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: categoryIndex * 0.05, duration: 0.3 }}
                        layout
                        className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:border-primary/20 transition-all"
                      >
                        <h2 className="text-xl font-semibold text-foreground mb-4">{category.title}</h2>
                        <Accordion
                          type="single"
                          collapsible
                          className="w-full"
                          value={openValue}
                          onValueChange={(v) => {
                            setOpenValue(v || undefined);
                            if (v) {
                              const opened = category.faqs.find(
                                (f) => slugifyQuestion(f.question) === v
                              );
                              if (opened) {
                                trackFaqOpen({
                                  slug: v,
                                  group: category.title,
                                  question: opened.question,
                                });
                              }
                            }
                          }}
                        >
                          {category.faqs.map((faq, faqIndex) => {
                            const slug = slugifyQuestion(faq.question);
                            return (
                            <AccordionItem key={faqIndex} value={slug} id={slug} className="border-border overflow-hidden scroll-mt-24">
                              <AccordionTrigger className="text-left text-foreground hover:text-primary transition-colors duration-200">
                                {faq.question}
                              </AccordionTrigger>
                              <AccordionContent className="text-muted-foreground leading-relaxed">
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ duration: 0.2 }}
                                  dangerouslySetInnerHTML={{ 
                                    __html: DOMPurify.sanitize(faq.answer, {
                                      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3'],
                                      ALLOWED_ATTR: ['href', 'target', 'rel']
                                    })
                                  }}
                                />
                              </AccordionContent>
                            </AccordionItem>
                            );
                          })}
                        </Accordion>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12"
                    >
                      <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No results found</h3>
                      <p className="text-muted-foreground">Try adjusting your search terms</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-background">
          <div className="container-wide">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative overflow-hidden rounded-3xl p-10 md:p-12 text-center max-w-3xl mx-auto"
            >
              {/* Gradient Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-violet-500/5 to-secondary/10" />
              <div className="absolute inset-0 backdrop-blur-sm" />
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-violet-500/20 rounded-full blur-3xl" />
              
              <div className="relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">Still have questions?</h3>
                <p className="text-muted-foreground mb-6">Can't find what you're looking for? Our team is here to help.</p>
                <div className="flex gap-4 justify-center flex-wrap">
                  <Link 
                    to="/explained/contact" 
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25 group"
                  >
                    Contact Us
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link 
                    to="https://new.alfredai.bot/book" 
                    className="inline-flex items-center px-6 py-3 border border-border bg-card text-foreground rounded-full font-medium hover:bg-accent hover:border-primary/30 transition-all"
                  >
                    Book an Impact Conversation
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* GEO: Citation-friendly FAQ summary for AI engines */}
      <GEOCitationBlock
        topic="alfred ai FAQ"
        citations={[
          { claim: "alfred ai implementation typically takes 2-4 weeks, including workflow analysis, system configuration, team training, and ongoing support.", source: "alfred ai" },
          { claim: "alfred ai uses enterprise-grade encryption for data in transit and at rest, maintains SOC 2 Type II compliance, and never uses customer data to train models for other customers.", source: "alfred ai Security" },
          { claim: "alfred ai is fully GDPR compliant with data processing agreements, data subject access request support, and complete control over data retention and deletion.", source: "alfred ai Compliance" },
          { claim: "alfred ai integrates with popular business tools including CRMs, ERPs, project management software, document management systems, and communication platforms.", source: "alfred ai" },
        ]}
      />

      <Footer />
    </div>
  );
};

export default FAQPage;
