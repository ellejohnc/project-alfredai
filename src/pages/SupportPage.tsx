import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { Book, MessageCircle, HelpCircle, ArrowRight, Sparkles, Headphones } from "lucide-react";
import SEO from "@/components/SEO";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const resources = [
  { 
    icon: <Book className="w-6 h-6" />, 
    title: "Documentation", 
    description: "Guides and tutorials to get started", 
    href: "/documentation", 
    comingSoon: false,
    gradient: "from-blue-500/20 to-cyan-500/20",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500"
  },
  { 
    icon: <HelpCircle className="w-6 h-6" />, 
    title: "FAQ", 
    description: "Common questions answered", 
    href: "/faq", 
    comingSoon: false,
    gradient: "from-violet-500/20 to-purple-500/20",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-500"
  },
  { 
    icon: <MessageCircle className="w-6 h-6" />, 
    title: "Live Chat", 
    description: "Chat with our team", 
    href: "#", 
    comingSoon: true,
    gradient: "from-emerald-500/20 to-teal-500/20",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-500"
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1] as const
    }
  })
};

const SupportPage = () => {
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true, margin: "-100px" });

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Support" 
        description="Get help with alfred ai. Access documentation, FAQ, and contact our support team."
        breadcrumbs={[
          { name: "Home", url: "/" },
          { name: "Support", url: "/support" }
        ]}
      />
      <Header />
      <main className="pt-24 pb-16">
        {/* Hero Section with Gradient */}
        <section ref={heroRef} className="relative overflow-hidden">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-background to-primary/5" />
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          
          <div className="container-wide py-16 relative z-10 text-center">
            <motion.div 
              initial={{ opacity: 0, y: 30 }} 
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <motion.span 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={heroInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/10 border border-secondary/20 text-secondary rounded-full text-sm font-medium mb-6"
              >
                <Headphones className="w-4 h-4" />
                Support
              </motion.span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                How Can We{" "}
                <span className="text-gradient bg-gradient-to-r from-secondary via-primary to-primary bg-clip-text text-transparent">
                  Help?
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Get the support you need to succeed with alfred ai.
              </p>
            </motion.div>
          </div>
        </section>
        
        {/* Resources Section */}
        <section className="py-12 bg-background-alt">
          <div className="container-wide">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {resources.map((item, i) => {
                const CardContent = (
                  <motion.div
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    variants={cardVariants}
                    whileHover={!item.comingSoon ? { y: -4, scale: 1.02 } : {}}
                    className="relative h-full"
                  >
                    {/* Gradient background on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`} />
                    
                    <div className="relative p-6 h-full flex flex-col">
                      {item.comingSoon && (
                        <span className="absolute top-4 right-4 px-2.5 py-1 bg-muted/80 backdrop-blur-sm text-muted-foreground text-xs font-medium rounded-full border border-border/50">
                          Coming Soon
                        </span>
                      )}
                      
                      <div className={`w-14 h-14 ${item.iconBg} rounded-xl flex items-center justify-center mb-5 ${item.iconColor} ${item.comingSoon ? 'opacity-50' : ''} transition-transform duration-300 group-hover:scale-110`}>
                        {item.icon}
                      </div>
                      
                      <h3 className={`text-lg font-semibold text-foreground mb-2 ${item.comingSoon ? 'opacity-50' : ''}`}>
                        {item.title}
                      </h3>
                      
                      <p className={`text-sm text-muted-foreground mb-4 flex-grow ${item.comingSoon ? 'opacity-50' : ''}`}>
                        {item.description}
                      </p>
                      
                      {!item.comingSoon && (
                        <div className="flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <span>Learn more about {item.title}</span>
                          <ArrowRight className="w-4 h-4 ml-1 transition-transform duration-300 group-hover:translate-x-1" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
                
                return item.comingSoon ? (
                  <div 
                    key={i} 
                    className="group relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl cursor-not-allowed overflow-hidden"
                  >
                    {CardContent}
                  </div>
                ) : (
                  <Link 
                    key={i} 
                    to={item.href} 
                    className="group relative bg-card border border-border rounded-2xl hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 overflow-hidden"
                  >
                    {CardContent}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Additional Help Section */}
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
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/5 to-primary/10" />
              <div className="absolute inset-0 backdrop-blur-sm" />
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-secondary/20 rounded-full blur-3xl" />
              
              <div className="relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-3">Can't find what you're looking for?</h2>
                <p className="text-muted-foreground mb-6">Our team is ready to help you with any questions.</p>
                <Link 
                  to="/explained/contact" 
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25 group"
                >
                  Contact Us
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default SupportPage;
