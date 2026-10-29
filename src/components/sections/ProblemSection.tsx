import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Timer, Users, Eye, TrendingUp } from "lucide-react";

const ProblemSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  const problems = [
    {
      icon: Timer,
      title: "Project Delays",
      description: "Schedules are set, but execution lags. Work starts on site but milestones keep slipping.",
    },
    {
      icon: Users,
      title: "Accountability Gaps",
      description: "Tasks get assigned, ownership gets lost. Nobody knows who's responsible for which trade or deadline.",
    },
    {
      icon: Eye,
      title: "Site Visibility Gaps",
      description: "You can't see what's happening across sites in real time. Decisions are made on last week's data.",
    },
    {
      icon: TrendingUp,
      title: "Scaling Without Overhead",
      description: "More projects means more admin staff. Revenue per head stagnates as back-office costs balloon.",
    },
  ];

  return (
    <section ref={ref} className="section-padding bg-background">
      <div className="container-wide">
        <motion.div
          className="max-w-3xl mx-auto text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="section-label">The Problem</span>
          <h2 className="section-heading">
            Scattered systems. Delayed tenders. Shrinking margins.{" "}
            <span className="text-muted-foreground">Time for an upgrade.</span>
          </h2>
          <p className="section-subtitle">
            The issue isn't your crews or your plans. It's the disconnected tools and scattered 
            workflows that delay projects — and the lack of real-time visibility that keeps you chasing updates instead of building.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {problems.map((problem, index) => (
            <motion.div
              key={index}
              className="card-base card-hover p-8"
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
            >
              <div className="icon-container-md icon-container-destructive mb-5">
                <problem.icon className="w-6 h-6 text-destructive" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{problem.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{problem.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
