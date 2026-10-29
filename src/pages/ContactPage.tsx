// Build trigger: 2026-01-10
import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Mail, Phone, MapPin, Linkedin, Youtube, Instagram, Globe, Calendar, HelpCircle, MessageSquare, Briefcase, Sparkles } from "lucide-react";
import { TikTokIcon } from "@/components/icons/TikTokIcon";
import SEO from "@/components/SEO";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import LeadCaptureChoice from "@/components/LeadCaptureChoice";
import { CONTACT_INFO } from "@/lib/contactInfo";
import { Button } from "@/components/ui/button";

type ContactType = "general" | "demo" | "support" | "partnerships";

const quickOptions = [
  { id: "demo" as ContactType, label: "Book an Impact Conversation", icon: Calendar, description: "See alfred ai in action", gradient: "from-primary/20 to-primary/5" },
  { id: "general" as ContactType, label: "General Inquiry", icon: MessageSquare, description: "Questions or feedback", gradient: "from-secondary/20 to-secondary/5" },
  { id: "support" as ContactType, label: "Support", icon: HelpCircle, description: "Get help with your account", gradient: "from-violet-500/20 to-violet-500/5" },
  { id: "partnerships" as ContactType, label: "Partnerships", icon: Briefcase, description: "Explore collaboration", gradient: "from-amber-500/20 to-amber-500/5" },
];

const contactCards = [
  {
    type: "email" as const,
    icon: Mail,
    label: "Email",
    content: CONTACT_INFO.email.general,
    href: `mailto:${CONTACT_INFO.email.general}`,
  },
  {
    type: "phone" as const,
    icon: Phone,
    label: "Call Us",
    content: CONTACT_INFO.phone,
    href: CONTACT_INFO.phoneHref,
    note: CONTACT_INFO.phoneNote,
  },
  {
    type: "location" as const,
    icon: MapPin,
    label: "Visit Us",
    content: `${CONTACT_INFO.location.street}, ${CONTACT_INFO.location.city}`,
    href: CONTACT_INFO.location.googleMapsUrl,
    note: CONTACT_INFO.location.note,
    external: true,
  },
  {
    type: "socials" as const,
    label: "Socials",
    content: "Follow us",
    links: [
      { icon: Linkedin, label: "LinkedIn", href: CONTACT_INFO.social.linkedin },
      { icon: Youtube, label: "YouTube", href: CONTACT_INFO.social.youtube },
      { icon: Instagram, label: "Instagram", href: CONTACT_INFO.social.instagram },
      { icon: TikTokIcon, label: "TikTok", href: CONTACT_INFO.social.tiktok },
    ],
    external: true,
  },
];

const ContactInfoSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const }
    },
  };

  const badgeVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const }
    },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={containerVariants}
      className="max-w-2xl mx-auto mt-12"
    >
      <motion.div 
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {contactCards.map((card) => {
          // Handle socials card with multiple links
          if (card.type === "socials" && 'links' in card) {
            return (
              <motion.div
                key={card.type}
                variants={cardVariants}
                className="flex flex-col gap-3 p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-all"
              >
                <p className="text-sm font-medium text-foreground">{card.label}</p>
                <div className="flex flex-wrap gap-2">
                  {card.links.map((link) => (
                    <motion.a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors group"
                    >
                      <link.icon className="w-4 h-4 text-primary" />
                      <span className="text-sm text-primary font-medium">{link.label}</span>
                    </motion.a>
                  ))}
                </div>
              </motion.div>
            );
          }

          const hasHref = 'href' in card && card.href;
          const CardWrapper = hasHref ? motion.a : motion.div;
          const externalProps = 'external' in card && card.external ? { target: "_blank", rel: "noopener noreferrer" } : {};
          const wrapperProps = hasHref ? {
            href: card.href,
            ...externalProps,
          } : {};

          return (
            <CardWrapper
              key={card.type}
              {...wrapperProps}
              variants={cardVariants}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={'href' in card && card.href ? { scale: 0.98 } : undefined}
              className="group flex items-start gap-4 p-5 rounded-xl bg-card border border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer"
            >
              {'icon' in card && (
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                  <card.icon className="w-5 h-5 text-primary" />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{card.label}</p>
                {card.type === "location" ? (
                  <>
                    <p className="text-muted-foreground text-sm">
                      {CONTACT_INFO.location.street}<br />
                      {CONTACT_INFO.location.city}
                    </p>
                    {'note' in card && (
                      <p className="text-xs text-primary font-medium mt-1">
                        {card.note}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    {'content' in card && <p className="text-primary text-sm">{card.content}</p>}
                    {'note' in card && card.note && (
                      <p className="text-xs text-muted-foreground mt-1">{card.note}</p>
                    )}
                  </>
                )}
              </div>
            </CardWrapper>
          );
        })}
      </motion.div>

      {/* Service Regions */}
      <motion.div 
        variants={cardVariants}
        className="mt-12 text-center"
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Where We Serve</h3>
        </div>
        <motion.div 
          variants={containerVariants}
          className="flex flex-wrap justify-center gap-2"
        >
          {CONTACT_INFO.serviceRegions.map((region, index) => (
            <motion.span
              key={region.code}
              variants={badgeVariants}
              whileHover={{ 
                scale: 1.1, 
                y: -2,
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium cursor-default hover:bg-primary hover:text-primary-foreground hover:shadow-md transition-all"
            >
              {region.name}
            </motion.span>
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

const ContactPage = () => {
  const [selectedType, setSelectedType] = useState<ContactType | null>(null);
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true, margin: "-100px" });

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Contact alfred ai - Construction AI Solutions" 
        description="Get in touch with alfred ai for construction and contracting AI solutions. Book a demo, explore partnerships, or get support."
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Contact", url: "/contact" }
        ]}
      />
      <Header />
      <main className="pt-24 pb-16">
        {/* Hero Section with Gradient */}
        <section ref={heroRef} className="relative overflow-hidden">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
          
          <div className="container-wide py-16 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="max-w-2xl mx-auto text-center mb-12"
            >
              <motion.span 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={heroInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 text-primary rounded-full text-sm font-medium mb-6"
              >
                <Sparkles className="w-4 h-4" />
                Contact
              </motion.span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                Get in{" "}
                <span className="text-gradient bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
                  Touch
                </span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Have questions? We'd love to hear from you.
              </p>
            </motion.div>

            {/* Quick Options */}
            {!selectedType && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="max-w-3xl mx-auto mb-12"
              >
                <p className="text-center text-muted-foreground mb-6">What can we help you with?</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {quickOptions.map((option, index) => (
                    <motion.button
                      key={option.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.05 }}
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedType(option.id)}
                      className={`group relative p-5 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 text-center overflow-hidden`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${option.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
                      <div className="relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                          <option.icon className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="font-semibold text-foreground mb-1">{option.label}</h3>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Selected Form */}
            {selectedType && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-xl mx-auto"
              >
                <Button
                  variant="ghost"
                  onClick={() => setSelectedType(null)}
                  className="mb-4"
                >
                  ← Back to options
                </Button>
                
                <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
                  <div className="flex items-center gap-3 mb-6">
                    {selectedType === "demo" && <Calendar className="w-6 h-6 text-primary" />}
                    {selectedType === "general" && <MessageSquare className="w-6 h-6 text-primary" />}
                    {selectedType === "support" && <HelpCircle className="w-6 h-6 text-primary" />}
                    {selectedType === "partnerships" && <Briefcase className="w-6 h-6 text-primary" />}
                    <h2 className="text-xl font-semibold text-foreground">
                      {selectedType === "demo" && "Book an Impact Conversation"}
                      {selectedType === "general" && "General Inquiry"}
                      {selectedType === "support" && "Get Support"}
                      {selectedType === "partnerships" && "Partnership Inquiry"}
                    </h2>
                  </div>
                  
                  <LeadCaptureChoice type={selectedType === "demo" ? "demo" : "contact"} />
                </div>
              </motion.div>
            )}

            {/* Additional contact info */}
            <ContactInfoSection />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;
