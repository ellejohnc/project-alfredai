import { motion } from "framer-motion";
import { 
  FileText, 
  Users, 
  FileSignature, 
  UserCheck, 
  GraduationCap, 
  CheckCircle,
  Map,
  Rocket,
  Settings,
  Zap,
  Clock,
  TrendingUp
} from "lucide-react";
import { SafeAnimatePresence } from "@/components/ui/safe-animate-presence";
import AnimatedNumber from "@/components/ui/AnimatedNumber";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface Milestone {
  phase: string;
  duration: string;
  daysStart: number;
  daysEnd: number;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  details: string[];
}

const fteTimeline: Milestone[] = [
  {
    phase: "Job Posting",
    duration: "2-4 weeks",
    daysStart: 0,
    daysEnd: 28,
    icon: FileText,
    description: "Write JD, post to boards, wait for applications",
    details: ["Market competition", "Recruiter fees (15-25%)"],
  },
  {
    phase: "Interviews",
    duration: "4-8 weeks",
    daysStart: 28,
    daysEnd: 84,
    icon: Users,
    description: "Resume review, phone screens, multiple rounds",
    details: ["Manager time investment", "Candidate ghosting"],
  },
  {
    phase: "Offer & Negotiation",
    duration: "1-2 weeks",
    daysStart: 84,
    daysEnd: 98,
    icon: FileSignature,
    description: "Reference checks, offer letter, acceptance",
    details: ["Counter-offers", "Notice periods"],
  },
  {
    phase: "Onboarding",
    duration: "2-4 weeks",
    daysStart: 98,
    daysEnd: 126,
    icon: UserCheck,
    description: "HR paperwork, IT setup, team introductions",
    details: ["Admin overhead", "New hire anxiety"],
  },
  {
    phase: "Training",
    duration: "4-8 weeks",
    daysStart: 126,
    daysEnd: 180,
    icon: GraduationCap,
    description: "Role-specific training, shadowing, learning curve",
    details: ["Low productivity", "Mentor time drain"],
  },
];

const agenticTimeline: Milestone[] = [
  {
    phase: "Discovery",
    duration: "3-5 days",
    daysStart: 0,
    daysEnd: 5,
    icon: Map,
    description: "Map workflows, identify opportunities",
    details: ["No expertise needed", "Immediate visibility"],
  },
  {
    phase: "Deployment",
    duration: "7-14 days",
    daysStart: 5,
    daysEnd: 19,
    icon: Rocket,
    description: "Configure AI agents, integrate tools",
    details: ["Works 24/7 immediately", "Zero learning curve"],
  },
  {
    phase: "Calibration",
    duration: "7-21 days",
    daysStart: 19,
    daysEnd: 40,
    icon: Settings,
    description: "Fine-tune based on real usage",
    details: ["Already productive", "Continuous improvement"],
  },
  {
    phase: "Full Capacity",
    duration: "Day 14-45",
    daysStart: 40,
    daysEnd: 45,
    icon: Zap,
    description: "Operating at full efficiency",
    details: ["Gets smarter every week", "Scales instantly"],
  },
];

interface TimelineTrackProps {
  milestones: Milestone[];
  variant: "fte" | "agentic";
  animationDelay?: number;
}

function TimelineTrack({ milestones, variant, animationDelay = 0 }: TimelineTrackProps) {
  const isMobile = useIsMobile();
  const isFTE = variant === "fte";
  
  return (
    <div className="space-y-4">
      {/* Track Header */}
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          isFTE 
            ? "bg-amber-500/20 text-amber-600" 
            : "bg-primary/20 text-primary"
        )}>
          {isFTE ? <Users className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
        </div>
        <div>
          <h4 className={cn(
            "font-semibold",
            isFTE ? "text-amber-600 dark:text-amber-400" : "text-primary"
          )}>
            {isFTE ? "Traditional Hiring" : "Agentic AI Deployment"}
          </h4>
          <p className="text-sm text-muted-foreground">
            {isFTE ? "3-6 months" : "14-45 days"}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: "100%" }}
          viewport={{ once: true }}
          transition={{ 
            delay: animationDelay, 
            duration: isFTE ? 3 : 0.8, 
            ease: "easeOut" 
          }}
          className={cn(
            "h-full rounded-full relative overflow-hidden",
            isFTE 
              ? "bg-gradient-to-r from-amber-400 to-amber-500" 
              : "bg-gradient-to-r from-primary to-primary/80"
          )}
        >
          {!isFTE && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_ease-in-out_infinite]" />
          )}
        </motion.div>
      </div>

      {/* Milestones */}
      <div className={cn(
        "grid gap-2",
        isMobile ? "grid-cols-2" : isFTE ? "grid-cols-5" : "grid-cols-4"
      )}>
        {milestones.map((milestone, idx) => {
          const Icon = milestone.icon;
          return (
            <motion.div
              key={milestone.phase}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: animationDelay + 0.1 + idx * (isFTE ? 0.15 : 0.1) }}
              className={cn(
                "p-3 rounded-lg border transition-colors",
                isFTE 
                  ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/30" 
                  : "bg-primary/5 border-primary/20"
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={cn(
                  "w-4 h-4",
                  isFTE ? "text-amber-600" : "text-primary"
                )} />
                <span className="text-xs font-medium truncate">{milestone.phase}</span>
              </div>
              <p className={cn(
                "text-[10px] font-medium",
                isFTE ? "text-amber-600/80" : "text-primary/80"
              )}>
                {milestone.duration}
              </p>
              {!isMobile && (
                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                  {milestone.description}
                </p>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export function DeploymentTimeline() {
  const isMobile = useIsMobile();

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-muted/30 to-background">
      <div className="container max-w-5xl mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 mb-4">
            <Clock className="w-3 h-3" />
            Time to Productivity
          </span>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            The Real Difference in Deployment Time
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Traditional hiring takes 3-6 months. Your Agentic AI workforce? 14-45 days.
          </p>
        </motion.div>

        {/* Timeline Comparison */}
        <div className="space-y-8 md:space-y-12">
          <SafeAnimatePresence>
            <TimelineTrack 
              milestones={fteTimeline} 
              variant="fte" 
              animationDelay={0}
            />
          </SafeAnimatePresence>

          {/* VS Divider */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, type: "spring" }}
            className="flex items-center justify-center gap-4"
          >
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-amber-500/10 via-muted to-primary/10 border border-border">
              <span className="text-sm font-medium text-muted-foreground">VS</span>
              <div className="flex items-center gap-2 text-primary">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm font-semibold">
                  <AnimatedNumber value={150} suffix="+ days faster" duration={1500} />
                </span>
              </div>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          </motion.div>

          <SafeAnimatePresence>
            <TimelineTrack 
              milestones={agenticTimeline} 
              variant="agentic" 
              animationDelay={0.3}
            />
          </SafeAnimatePresence>
        </div>

        {/* "While They're Still Interviewing" Callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-12 p-6 rounded-xl bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 border border-primary/20"
        >
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-primary mb-1">
                While they're still interviewing...
              </p>
              <p className="text-muted-foreground">
                Your AI agents have already processed{" "}
                <span className="font-semibold text-foreground">2,500+ tasks</span>,{" "}
                saved <span className="font-semibold text-foreground">120+ hours</span>,{" "}
                and <span className="font-semibold text-foreground">paid for themselves</span>.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-secondary" />
              <span className="text-sm font-medium text-secondary">Already ROI positive</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
