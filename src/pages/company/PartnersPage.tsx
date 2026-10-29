import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Handshake, TrendingUp, Users, Award, ArrowRight, Check, Sparkles, Building2, Briefcase, HardHat, Stethoscope, Scale, ShoppingBag, Factory, Truck, Megaphone, Bot, Calculator, Compass, PenTool, ClipboardCheck, UtensilsCrossed, Plane, UserCheck, Wrench, Home, FlaskConical, Star, Zap, Shield, MessageCircle, LogIn } from "lucide-react";
import SEO from "@/components/SEO";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PartnershipInquiryModal from "@/components/PartnershipInquiryModal";
import { PartnerChatModal } from "@/components/partners";

const partnerTypes = [
  {
    id: "product-development",
    icon: <Zap className="w-6 h-6" />,
    title: "Product Development Partners",
    description: "Collaborate on building new capabilities, integrations, and product extensions that deepen alfred ai's value.",
    benefits: ["Joint product roadmap access", "Co-development resources", "Early access to APIs & features"],
    gradient: "from-rose-500 to-rose-400",
    bgGradient: "from-rose-500/15 via-rose-500/5 to-transparent",
    chatbotEnabled: true,
  },
  {
    id: "referral",
    icon: <Handshake className="w-6 h-6" />,
    title: "Referral Partners",
    description: "Earn 20-50% commission (avg 27%) by introducing qualified leads. Get 90-day deal protection, co-marketing support, and a dedicated success manager.",
    benefits: ["20-50% commission on closed deals", "90-day deal registration protection", "Dedicated success manager"],
    gradient: "from-primary to-primary/60",
    bgGradient: "from-primary/15 via-primary/5 to-transparent",
    chatbotEnabled: true,
  },
  {
    id: "implementation",
    icon: <Users className="w-6 h-6" />,
    title: "Implementation Partners",
    description: "Help clients implement and optimize alfred ai for their specific needs.",
    benefits: ["Partner certification", "Technical training", "Priority support access"],
    gradient: "from-secondary to-secondary/60",
    bgGradient: "from-secondary/15 via-secondary/5 to-transparent",
    chatbotEnabled: true,
  },
  {
    id: "technology",
    icon: <TrendingUp className="w-6 h-6" />,
    title: "Technology Partners",
    description: "Integrate your product with alfred ai to create enhanced solutions.",
    benefits: ["API access", "Joint solution development", "Go-to-market support"],
    gradient: "from-violet-500 to-violet-400",
    bgGradient: "from-violet-500/15 via-violet-500/5 to-transparent",
    chatbotEnabled: true,
  },
  {
    id: "sales",
    icon: <Briefcase className="w-6 h-6" />,
    title: "Sales Partners",
    description: "Represent alfred ai in your region with dedicated sales support and resources.",
    benefits: ["Territory exclusivity", "Sales enablement tools", "Recurring revenue share"],
    gradient: "from-amber-500 to-amber-400",
    bgGradient: "from-amber-500/15 via-amber-500/5 to-transparent",
    chatbotEnabled: true,
  },
  {
    id: "consulting",
    icon: <Sparkles className="w-6 h-6" />,
    title: "Consulting Partners",
    description: "Advise clients on digital transformation with alfred ai as your automation backbone.",
    benefits: ["Strategic advisory resources", "Custom solution design", "Executive briefing access"],
    gradient: "from-emerald-500 to-emerald-400",
    bgGradient: "from-emerald-500/15 via-emerald-500/5 to-transparent",
    chatbotEnabled: true,
  },
  {
    id: "training",
    icon: <Award className="w-6 h-6" />,
    title: "Training Partners",
    description: "Deliver alfred ai training and certification programs to enterprise clients.",
    benefits: ["Certified trainer status", "Training materials & LMS", "Per-student revenue share"],
    gradient: "from-cyan-500 to-cyan-400",
    bgGradient: "from-cyan-500/15 via-cyan-500/5 to-transparent",
    chatbotEnabled: true,
  },
];

const whitelabelVerticals = [
  { icon: <Megaphone className="w-5 h-5" />, title: "Marketing Agencies", description: "Campaign automation, client reporting, and lead management workflows." },
  { icon: <Bot className="w-5 h-5" />, title: "AI Automation Agencies", description: "Custom AI solutions, workflow orchestration, and integration delivery." },
  { icon: <Calculator className="w-5 h-5" />, title: "Accountant Firms", description: "Financial reporting, client portals, and compliance automation." },
  { icon: <Compass className="w-5 h-5" />, title: "Engineering Firms", description: "Project tracking, technical documentation, and resource planning." },
  { icon: <PenTool className="w-5 h-5" />, title: "Architects", description: "Design workflows, client collaboration, and project delivery." },
  { icon: <ClipboardCheck className="w-5 h-5" />, title: "Building Consultants", description: "Inspection management, compliance reporting, and certification tracking." },
  { icon: <UtensilsCrossed className="w-5 h-5" />, title: "Hospitality", description: "Booking management, guest experience, and operations automation." },
  { icon: <Plane className="w-5 h-5" />, title: "Migration Agencies", description: "Visa processing, document management, and client case tracking." },
  { icon: <UserCheck className="w-5 h-5" />, title: "Recruitment Agents", description: "Candidate sourcing, interview scheduling, and placement workflows." },
  { icon: <HardHat className="w-5 h-5" />, title: "Construction", description: "Project management, site compliance, and subcontractor coordination." },
  { icon: <Wrench className="w-5 h-5" />, title: "Trades & Services", description: "Job scheduling, quoting, invoicing, and field service management." },
  { icon: <Scale className="w-5 h-5" />, title: "Legal & Professional Services", description: "Document automation, client intake, and matter management." },
  { icon: <Stethoscope className="w-5 h-5" />, title: "Healthcare & Allied Health", description: "Patient engagement, scheduling, and clinical documentation." },
  { icon: <Building2 className="w-5 h-5" />, title: "Property & Real Estate", description: "Tenant management, inspections, and maintenance workflows." },
  { icon: <Home className="w-5 h-5" />, title: "Buyers Agents", description: "Property search, client matching, and transaction management." },
  { icon: <Briefcase className="w-5 h-5" />, title: "Financial Services", description: "Client onboarding, compliance, and portfolio reporting." },
  { icon: <ShoppingBag className="w-5 h-5" />, title: "Retail & E-commerce", description: "Inventory management, order processing, and customer service." },
  { icon: <Factory className="w-5 h-5" />, title: "Manufacturing", description: "Quality control, production scheduling, and supply chain." },
  { icon: <Truck className="w-5 h-5" />, title: "Logistics & Distribution", description: "Fleet management, route optimization, and delivery tracking." },
  { icon: <FlaskConical className="w-5 h-5" />, title: "Research & Product Development", description: "Innovation tracking, prototype management, and R&D workflow automation." },
];

const stats = [
  { value: "20+", label: "Industry Verticals", icon: <Building2 className="w-5 h-5" /> },
  { value: "27%", label: "Avg Commission (20%-50%)", icon: <TrendingUp className="w-5 h-5" /> },
  { value: "7", label: "Partner Models", icon: <Star className="w-5 h-5" /> },
];

const whitelabelBenefits = [
  { icon: <Shield className="w-4 h-4" />, text: "Your branding & domain" },
  { icon: <Zap className="w-4 h-4" />, text: "Custom pricing control" },
  { icon: <Users className="w-4 h-4" />, text: "Partner portal access" },
  { icon: <TrendingUp className="w-4 h-4" />, text: "Revenue share model" },
];

const PartnersPage = () => {
  const heroRef = useRef(null);
  const statsRef = useRef(null);
  const typesRef = useRef(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<{ id: string; title: string; gradient?: string } | null>(null);
  
  const heroInView = useInView(heroRef, { once: true, margin: "-100px" });
  const statsInView = useInView(statsRef, { once: true, margin: "-100px" });
  const typesInView = useInView(typesRef, { once: true, margin: "-100px" });

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Partner Program" 
        description="Join alfred ai's partner ecosystem. Referral, implementation, technology, and consulting partner opportunities."
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Company", url: "/company/about" },
          { name: "Partners", url: "/company/partners" }
        ]}
      />
      <Header />
      
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section ref={heroRef} className="relative overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
          <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[100px] animate-pulse" />
          <div className="absolute -bottom-20 right-1/4 w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[80px]" />
          <div className="absolute top-1/2 right-10 w-[200px] h-[200px] bg-violet-500/5 rounded-full blur-[60px]" />
          
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,black,transparent)]" />
          
          <div className="container-wide py-24 md:py-32 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-center max-w-4xl mx-auto"
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={heroInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary/15 to-secondary/15 border border-primary/20 text-primary rounded-full text-sm font-medium mb-8 backdrop-blur-sm shadow-lg shadow-primary/5"
              >
                <Handshake className="w-4 h-4" />
                Partner Program
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground mb-6 leading-[1.1] tracking-tight"
              >
                Grow With{" "}
                <span className="relative">
                  <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient_3s_linear_infinite]">
                    alfred ai
                  </span>
                  <motion.span 
                    className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0 rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={heroInView ? { scaleX: 1 } : {}}
                    transition={{ delay: 0.5, duration: 0.8 }}
                  />
                </span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto"
              >
                Join our partner ecosystem and help businesses transform their operations with AI-powered automation.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <button
                  onClick={() => setIsBookingOpen(true)}
                  className="group relative inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 hover:shadow-2xl hover:shadow-primary/30 hover:scale-[1.02] overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Become a Partner 
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/20 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                </button>
                <Link
                  to="/partners/portal"
                  className="group inline-flex items-center justify-center gap-2 bg-card border border-border/60 text-foreground px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 hover:border-primary/40 hover:bg-primary/5 hover:shadow-lg"
                >
                  <LogIn className="w-5 h-5 text-primary" />
                  Partner Portal
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section ref={statsRef} className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background-alt to-background" />
          
          <div className="container-wide relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={statsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto"
            >
              {stats.map((stat, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={statsInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8 text-center hover:border-primary/30 transition-all duration-300 hover:shadow-lg h-full min-h-[200px] flex flex-col items-center justify-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4 text-primary group-hover:scale-110 transition-transform">
                      {stat.icon}
                    </div>
                    <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                      {stat.value}
                    </div>
                    <p className="text-muted-foreground font-medium">{stat.label}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Partner Types */}
        <section ref={typesRef} className="py-24 md:py-32 bg-background relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          
          <div className="container-wide">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={typesInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <motion.span 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={typesInView ? { opacity: 1, scale: 1 } : {}}
                className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 border border-secondary/20 text-secondary rounded-full text-sm font-medium mb-6"
              >
                <Sparkles className="w-4 h-4" />
                Ways to Partner
              </motion.span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                Partnership Opportunities
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Choose the partnership model that best fits your business and expertise
              </p>
            </motion.div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
              {partnerTypes.map((type, index) => {
                const isClickable = type.chatbotEnabled;
                const CardWrapper = isClickable ? 'button' : 'div';
                
                return (
                  <motion.div 
                    key={type.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={typesInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ y: -8, transition: { duration: 0.3 } }}
                    className="group relative"
                  >
                    {/* Card glow effect */}
                    <div className={`absolute -inset-0.5 bg-gradient-to-br ${type.gradient} rounded-[20px] opacity-0 group-hover:opacity-100 blur transition-all duration-500`} />
                    
                    <CardWrapper
                      {...(isClickable ? {
                        onClick: () => setSelectedPartner({ id: type.id, title: type.title, gradient: type.gradient }),
                        type: "button" as const,
                      } : {})}
                      className={`relative h-full w-full text-left bg-card border border-border/50 rounded-2xl p-8 backdrop-blur-sm overflow-hidden ${isClickable ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50' : ''}`}
                    >
                      {/* Background gradient */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${type.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                      
                      <div className="relative z-10">
                        {/* Icon */}
                        <div className={`w-14 h-14 bg-gradient-to-br ${type.gradient} rounded-xl flex items-center justify-center mb-6 text-white shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
                          {type.icon}
                        </div>
                        
                        {/* Content */}
                        <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">
                          {type.title}
                        </h3>
                        <p className="text-muted-foreground mb-6 leading-relaxed text-sm">
                          {type.description}
                        </p>
                        
                        {/* Benefits */}
                        <ul className="space-y-2">
                          {type.benefits.slice(0, 3).map((benefit, i) => (
                            <motion.li 
                              key={i} 
                              className="flex items-center gap-3 text-sm"
                              initial={{ opacity: 0, x: -10 }}
                              animate={typesInView ? { opacity: 1, x: 0 } : {}}
                              transition={{ delay: index * 0.1 + i * 0.05 + 0.3 }}
                            >
                              <div className={`w-5 h-5 bg-gradient-to-br ${type.gradient} rounded-full flex items-center justify-center flex-shrink-0 shadow-sm`}>
                                <Check className="w-3 h-3 text-white" />
                              </div>
                              <span className="text-foreground/80 text-xs">{benefit}</span>
                            </motion.li>
                          ))}
                        </ul>
                        
                        {/* Chat CTA for enabled partners */}
                        {isClickable && (
                          <div className="mt-6 flex items-center gap-2 text-primary font-medium text-sm group-hover:translate-x-1 transition-transform">
                            <MessageCircle className="w-4 h-4" />
                            <span>Learn more →</span>
                          </div>
                        )}
                      </div>
                    </CardWrapper>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Whitelabel Industry Vertical Partners */}
        <section className="py-24 md:py-32 bg-background-alt relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-[100px]" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/5 rounded-full blur-[100px]" />
          
          <div className="container-wide relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <motion.span 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 text-violet-500 rounded-full text-sm font-medium mb-6"
              >
                <Shield className="w-4 h-4" />
                Whitelabel Solutions
              </motion.span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                Industry Vertical Partners
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Resell alfred ai under your own brand with industry-specific configurations. 
                We provide the platform, you own the customer relationship.
              </p>
            </motion.div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-w-7xl mx-auto">
              {whitelabelVerticals.map((vertical, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.03 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="group bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-5 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 cursor-default"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg flex items-center justify-center mb-3 text-primary group-hover:from-primary/20 group-hover:to-secondary/20 group-hover:scale-110 transition-all duration-300">
                    {vertical.icon}
                  </div>
                  <h3 className="font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors text-sm">
                    {vertical.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {vertical.description}
                  </p>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex justify-center mt-12"
            >
              <div className="inline-flex flex-wrap justify-center gap-4 md:gap-6 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl px-8 py-5">
                {whitelabelBenefits.map((benefit, index) => (
                  <motion.span 
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="flex items-center gap-2 text-sm text-foreground"
                  >
                    <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                      {benefit.icon}
                    </div>
                    {benefit.text}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 md:py-32 bg-background relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          
          <div className="container-wide">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative overflow-hidden rounded-[2rem] max-w-5xl mx-auto"
            >
              {/* Complex gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-secondary/10 to-violet-500/15" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.15),transparent_50%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(217,70,239,0.1),transparent_50%)]" />
              <div className="absolute inset-0 backdrop-blur-sm" />
              
              {/* Animated orbs */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-[80px] animate-pulse" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-secondary/20 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
              
              {/* Border glow */}
              <div className="absolute inset-0 rounded-[2rem] border border-white/10" />
              
              <div className="relative z-10 p-10 md:p-16 text-center">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-primary/30"
                >
                  <Award className="w-10 h-10 text-white" />
                </motion.div>
                
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6"
                >
                  Ready to Partner?
                </motion.h2>
                
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
                >
                  Let's explore how we can grow together. Fill out our partner application and our team will be in touch within 48 hours.
                </motion.p>
                
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                  onClick={() => setIsBookingOpen(true)}
                  className="group relative inline-flex items-center justify-center gap-3 bg-gradient-to-r from-primary to-secondary text-white px-10 py-5 rounded-full font-semibold text-lg transition-all duration-300 hover:shadow-2xl hover:shadow-primary/40 hover:scale-[1.03] overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Apply Now 
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/25 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                </motion.button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
      
      {/* Partnership Inquiry Modal */}
      <PartnershipInquiryModal 
        isOpen={isBookingOpen} 
        onClose={() => setIsBookingOpen(false)} 
      />
      
      {/* Partner Chat Modal */}
      {selectedPartner && (
        <PartnerChatModal
          isOpen={!!selectedPartner}
          onClose={() => setSelectedPartner(null)}
          partnerType={selectedPartner.id}
          partnerTitle={selectedPartner.title}
        />
      )}
    </div>
  );
};

export default PartnersPage;
