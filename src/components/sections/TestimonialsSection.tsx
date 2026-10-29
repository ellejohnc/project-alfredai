import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { Quote, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import LazyImage from "@/components/ui/lazy-image";
import { usePublishedTestimonials } from "@/hooks/usePublishedContent";
import { formatPrivacyName, getUniqueHeadshot, initializeHeadshotAssignments } from "@/lib/headshotMapping";

const TestimonialsSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  // Fetch testimonials from database
  const { items: dbTestimonials, isLoading } = usePublishedTestimonials();

  // Initialize headshot assignments when testimonials load
  useEffect(() => {
    if (dbTestimonials.length > 0) {
      initializeHeadshotAssignments(
        dbTestimonials.map((t) => ({ id: t.id, clientName: t.client_name }))
      );
    }
  }, [dbTestimonials]);

  // Featured text testimonials only (video testimonials are in VideoTestimonialsSection)
  const textTestimonials = useMemo(() => {
    return dbTestimonials
      .filter(t => (!t.video_url || t.video_url.trim() === '') && t.is_featured)
      .slice(0, 5);
  }, [dbTestimonials]);

  // Max 5 quote cards for carousel
  const quoteCardTestimonials = textTestimonials;

  // Auto-cycle carousel
  useEffect(() => {
    if (quoteCardTestimonials.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % quoteCardTestimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [quoteCardTestimonials.length]);

  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev + 1) % quoteCardTestimonials.length);
  };

  const prevTestimonial = () => {
    setActiveIndex((prev) => (prev - 1 + quoteCardTestimonials.length) % quoteCardTestimonials.length);
  };

  // Show skeleton while loading
  if (isLoading) {
    return (
      <section className="py-16 bg-background-alt">
        <div className="container-wide">
          <div className="text-center mb-10">
            <div className="h-8 w-36 bg-muted rounded-full mx-auto mb-4 animate-pulse" />
            <div className="h-8 w-56 bg-muted rounded-lg mx-auto animate-pulse" />
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="bg-card rounded-2xl border border-border overflow-hidden h-[320px] md:h-[280px]">
              <div className="grid md:grid-cols-5 h-full">
                <div className="md:col-span-2 bg-muted animate-pulse hidden md:block" />
                <div className="md:col-span-3 p-5 md:p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <div key={s} className="w-4 h-4 bg-muted rounded animate-pulse" />
                      ))}
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="h-5 w-full bg-muted rounded animate-pulse" />
                      <div className="h-5 w-4/5 bg-muted rounded animate-pulse" />
                      <div className="h-5 w-3/5 bg-muted rounded animate-pulse" />
                    </div>
                    <div className="flex items-center gap-3 mt-auto">
                      <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
                      <div>
                        <div className="h-4 w-24 bg-muted rounded mb-2 animate-pulse" />
                        <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
                    <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
                    <div className="flex gap-2 flex-1 justify-center">
                      {[1, 2, 3].map((d) => (
                        <div key={d} className="h-2 w-2 bg-muted rounded-full animate-pulse" />
                      ))}
                    </div>
                    <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Show fallback when no featured text testimonials
  if (textTestimonials.length === 0) {
    return (
      <section className="py-16 bg-background-alt">
        <div className="container-wide">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-secondary/50 text-foreground px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Quote className="w-4 h-4" />
              Written Reviews
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-3">
              More Success Stories
            </h2>
          </div>
          <div className="max-w-xl mx-auto text-center py-12 px-6 bg-card rounded-2xl border border-border">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Featured reviews coming soon</h3>
            <p className="text-muted-foreground mb-6">
              We're curating the best success stories from our clients. Visit all testimonials to explore more.
            </p>
            <Link to="/impact-studies/testimonials">
              <Button variant="outline">
                View All Testimonials
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-4 pb-16 bg-background-alt">
      <div className="container-wide">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-secondary/50 text-foreground px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Quote className="w-4 h-4" />
            Written Reviews
          </div>
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-3">
            More Success Stories
          </h2>
        </div>

        {/* Featured Carousel */}
        {quoteCardTestimonials.length > 0 && (
          <div className="max-w-4xl mx-auto mb-10">
            <div className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden">
              <div className="grid md:grid-cols-5 h-full">
                {/* Visual Side - Fixed height matching container */}
                <div className="relative md:col-span-2 h-full bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/10 hidden md:block">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Quote className="w-20 h-20 text-primary/20 animate-[float_6s_ease-in-out_infinite]" />
                  </div>
                  <div className="absolute top-8 left-8">
                    <Quote className="w-7 h-7 text-primary/40 animate-[float_4s_ease-in-out_infinite_0.5s]" />
                  </div>
                  <div className="absolute bottom-8 right-8">
                    <Quote className="w-5 h-5 text-primary/30 rotate-180 animate-[float_5s_ease-in-out_infinite_1s]" />
                  </div>
                </div>

                {/* Content Side - Matching container height */}
                <div className="md:col-span-3 p-6 md:p-8 flex flex-col h-full">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={quoteCardTestimonials[activeIndex]?.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="flex-1 flex flex-col"
                    >
                      <div className="flex gap-1 mb-4">
                        {Array.from({ length: quoteCardTestimonials[activeIndex]?.rating || 5 }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-warning fill-warning" />
                        ))}
                      </div>

                      <blockquote className="text-base md:text-lg text-foreground font-medium leading-relaxed flex-1 mb-6">
                        "{quoteCardTestimonials[activeIndex]?.quote}"
                      </blockquote>

                      <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                          <LazyImage 
                            src={quoteCardTestimonials[activeIndex]?.client_avatar_url || getUniqueHeadshot(quoteCardTestimonials[activeIndex]?.id || '', quoteCardTestimonials[activeIndex]?.client_name || '', quoteCardTestimonials[activeIndex]?.headshot_key)} 
                            alt={formatPrivacyName(quoteCardTestimonials[activeIndex]?.client_name || '')}
                            className="w-full h-full object-cover"
                            width={40}
                            height={40}
                            placeholderColor="bg-primary/20"
                          />
                        </div>
                        <div>
                          <div className="font-semibold text-foreground text-sm">
                            {formatPrivacyName(quoteCardTestimonials[activeIndex]?.client_name || '')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {quoteCardTestimonials[activeIndex]?.client_title}{quoteCardTestimonials[activeIndex]?.industry ? `, ${quoteCardTestimonials[activeIndex]?.industry}` : ''}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Navigation */}
                  {quoteCardTestimonials.length > 1 && (
                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={prevTestimonial}
                        className="rounded-full h-8 w-8"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <div className="flex gap-2 flex-1 justify-center">
                        {quoteCardTestimonials.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setActiveIndex(i)}
                            className={`h-2 rounded-full transition-all ${
                              i === activeIndex
                                ? "bg-primary w-6"
                                : "bg-muted-foreground/30 hover:bg-muted-foreground/50 w-2"
                            }`}
                          />
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={nextTestimonial}
                        className="rounded-full h-8 w-8"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View All Link */}
        <div className="text-center">
          <Link to="/impact-studies/testimonials">
            <Button variant="outline" size="lg" className="group">
              View All Testimonials
              <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;