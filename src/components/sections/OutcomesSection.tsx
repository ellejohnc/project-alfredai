import { useRef, memo } from "react";
import { ArrowRight, Clock, TrendingUp, CheckCircle, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useSafeInView } from "@/components/ui/../../hooks/useSafeInView";

const OutcomesSection = memo(() => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useSafeInView(ref, { once: true, margin: "-100px" });

  const outcomes = [
    {
      icon: Clock,
      title: "Cut Back-Office Time",
      description:
        "Eliminate up to 70% of repetitive coordination tasks. Free your PMs to focus on building — not chasing updates.",
      link: "/impact-studies?filter=admin",
      linkText: "See impact examples",
      gradient: "from-muted to-muted/40",
    },
    {
      icon: TrendingUp,
      title: "Increase Revenue Per PM",
      description:
        "Drive measurable productivity gains. Our clients see significant improvements in revenue per project manager within 90 days.",
      link: "/impact-studies?filter=revenue",
      linkText: "See impact examples",
      gradient: "from-muted to-muted/40",
    },
    {
      icon: CheckCircle,
      title: "Improve Site Accountability",
      description:
        "Real-time visibility into site progress, trade accountability, and what's actually driving project outcomes.",
      link: "/impact-studies?filter=execution",
      linkText: "See impact examples",
      gradient: "from-muted to-muted/40",
    },
    {
      icon: Users,
      title: "Take On More Projects",
      description:
        "Handle 2-3x the project volume without proportionally increasing office staff. AI amplifies your existing team's capacity.",
      link: "/impact-studies?filter=scaling",
      linkText: "See impact examples",
      gradient: "from-muted to-muted/40",
    },
  ];

  return (
    <section ref={ref} className="section-padding bg-background">
      <div className="container-wide">
        {/* Header with CSS-based animation */}
        <div
          className={`max-w-3xl mx-auto text-center mb-16 transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <span className="section-label">Outcomes</span>
          <h2 className="section-heading">
            Impact you can measure.{" "}
            <span className="text-muted-foreground">Results you can present.</span>
          </h2>
          <p className="section-subtitle">
            Every alfred ai implementation is designed around measurable outcomes — 
            the kind you can take to ownership with confidence.
          </p>
        </div>

        {/* Outcomes Grid with CSS-based staggered animation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {outcomes.map((outcome, index) => (
            <div
              key={index}
              className={`relative p-8 bg-gradient-to-br ${outcome.gradient} border border-border rounded-2xl overflow-hidden group card-hover transition-all duration-500 ${
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${100 + index * 100}ms` }}
            >
              <div className="relative z-10">
                <div className="icon-container-md bg-background shadow-sm mb-5">
                  <outcome.icon className="w-6 h-6 text-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{outcome.title}</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {outcome.description}
                </p>
                <Link to={outcome.link} className="link-arrow">
                  {outcome.linkText}
                  <ArrowRight />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

OutcomesSection.displayName = 'OutcomesSection';

export default OutcomesSection;
