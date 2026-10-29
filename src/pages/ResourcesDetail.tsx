import { useState } from "react";
import { motion } from "framer-motion";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Video, Calendar, FileText, Newspaper, Play, Download, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BookingChatModal from "@/components/BookingChatModal";
import SEO from "@/components/SEO";

const resourceData: Record<string, {
  title: string;
  description: string;
  icon: React.ElementType;
  items: { title: string; description: string; meta?: string }[];
}> = {
  demos: {
    title: "Demos",
    description: "Interactive product demonstrations and walkthroughs",
    icon: Video,
    items: [
      { title: "Knowledge Intelligence Demo", description: "See how AI transforms document management", meta: "15 min" },
      { title: "Business Operations Demo", description: "Automate workflows and track accountability", meta: "12 min" },
      { title: "Customer Experience Demo", description: "AI-powered customer service in action", meta: "10 min" },
      { title: "Butler On The Go Demo", description: "Voice AI assistant demonstration", meta: "8 min" },
      { title: "Platform Overview Demo", description: "Complete alfred ai platform walkthrough", meta: "20 min" },
    ],
  },
  webinars: {
    title: "Webinars & Events",
    description: "Live sessions and recorded presentations",
    icon: Calendar,
    items: [
      { title: "AI for Operations: Q&A Session", description: "Live discussion with industry leaders", meta: "Upcoming" },
      { title: "Scaling Without Hiring", description: "How AI enables growth without headcount", meta: "Recording" },
      { title: "Knowledge Management Best Practices", description: "Maximising your AI investment", meta: "Recording" },
      { title: "Customer Success Stories", description: "Real implementations, real results", meta: "Recording" },
    ],
  },
  guides: {
    title: "Guides & Playbooks",
    description: "Step-by-step implementation guides",
    icon: FileText,
    items: [
      { title: "Getting Started Guide", description: "Complete implementation roadmap", meta: "PDF" },
      { title: "Admin Automation Playbook", description: "Reduce admin time by 70%", meta: "PDF" },
      { title: "ROI Calculation Framework", description: "Measure your AI investment", meta: "PDF" },
      { title: "Security & Compliance Guide", description: "Enterprise deployment best practices", meta: "PDF" },
    ],
  },
  blog: {
    title: "Blog / Insights",
    description: "Latest articles and industry insights",
    icon: Newspaper,
    items: [
      { title: "The Future of Business AI", description: "Trends shaping enterprise automation", meta: "5 min read" },
      { title: "Case Study: Construction Firm Transformation", description: "65% admin reduction in 3 months", meta: "8 min read" },
      { title: "AI Ethics in Business", description: "Responsible AI implementation", meta: "6 min read" },
      { title: "Measuring AI ROI", description: "Frameworks for quantifying impact", meta: "7 min read" },
    ],
  },
};


const resourceSeo: Record<string, { title: string; description: string }> = {
  demos: {
    title: "AI Demos for Construction Teams",
    description: "Watch short alfred ai product demos covering document intelligence, operations automation, customer experience and voice AI for construction businesses.",
  },
  webinars: {
    title: "AI Webinars & Events for Builders",
    description: "Live and recorded alfred ai sessions on scaling without hiring, knowledge management and real construction AI implementations.",
  },
  guides: {
    title: "AI Implementation Guides & Playbooks",
    description: "Step-by-step alfred ai playbooks for rollout, admin automation, ROI measurement and enterprise security in construction and contracting.",
  },
  blog: {
    title: "alfred ai Insights & Case Studies",
    description: "Articles on agentic AI for construction: automation trends, ROI frameworks, responsible AI and real transformation case studies.",
  },
};

const ResourcesDetail = () => {
  const { category } = useParams<{ category: string }>();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const data = category ? resourceData[category] : null;

  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <SEO
          title="Resource Not Found"
          description="This alfred ai resource category does not exist. Browse demos, guides, webinars and insights for construction AI instead."
          noindex
          path="/resources"
        />
        <Header />
        <main className="pt-32 pb-16">
          <div className="container-wide text-center">
            <h1 className="text-2xl font-semibold text-foreground mb-4">Resource not found</h1>
            <Link to="/resources" className="text-primary hover:underline">
              Back to Resources
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const Icon = data.icon;
  const seo = (category && resourceSeo[category]) || {
    title: `${data.title} — alfred ai Resources`,
    description: data.description,
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={seo.title}
        description={seo.description}
        path={`/resources/${category}`}
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Resources", url: "/resources" },
          { name: data.title, url: `/resources/${category}` },
        ]}
      />
      <Header />

      
      <main>
        {/* Hero */}
        <section className="pt-32 pb-16 md:pt-40 md:pb-20 bg-background relative overflow-hidden">
          {/* Premium gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent pointer-events-none" />
          <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="container-wide relative">
            <Link
              to="/resources"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Resources
            </Link>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <Icon className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-semibold text-foreground mb-4 leading-tight">
                {data.title}
              </h1>
              <p className="text-xl text-muted-foreground">
                {data.description}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Items Grid */}
        <section className="py-16 bg-background-alt">
          <div className="container-wide">
            <div className="grid md:grid-cols-2 gap-6">
              {data.items.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card rounded-xl border border-border p-6 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    {item.meta && (
                      <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground flex-shrink-0">
                        {item.meta}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-accent">
          <div className="container-wide text-center">
            <h2 className="text-2xl md:text-3xl font-semibold text-accent-foreground mb-4">
              Need personalised guidance?
            </h2>
            <p className="text-accent-foreground/70 mb-6">
              Book a conversation with our team for tailored recommendations.
            </p>
            <Button 
              onClick={() => setIsBookingOpen(true)}
              className="bg-primary hover:bg-primary-hover text-primary-foreground"
            >
              Book an Impact Conversation
            </Button>
          </div>
        </section>
      </main>

      <Footer />
      <BookingChatModal isOpen={isBookingOpen} onClose={() => setIsBookingOpen(false)} />
    </div>
  );
};

export default ResourcesDetail;