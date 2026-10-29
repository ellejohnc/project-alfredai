import { motion } from "framer-motion";
import { Globe, MapPin, Calendar, ArrowRight } from "lucide-react";

const expansionPhases = [
  {
    id: "anz",
    name: "ANZ",
    period: "2024-2025",
    status: "Current",
    color: "#22c55e",
    description: "Australia & New Zealand foundation",
    cities: ["Sydney", "Melbourne", "Auckland", "Brisbane"],
  },
  {
    id: "uk-ksa",
    name: "UK & KSA",
    period: "Late 2025-2026",
    status: "Next",
    color: "#3b82f6",
    description: "UK expansion and Middle East entry",
    cities: ["London", "Riyadh", "Dubai"],
  },
  {
    id: "apac",
    name: "APAC",
    period: "2026-2027",
    status: "Expansion",
    color: "#8b5cf6",
    description: "Asia-Pacific growth markets",
    cities: ["Singapore", "Hong Kong", "Tokyo"],
  },
  {
    id: "global",
    name: "Global",
    period: "2028+",
    status: "Vision",
    color: "#f59e0b",
    description: "North America & Europe",
    cities: ["New York", "San Francisco", "Zurich"],
  },
];

export default function GeographicExpansionMap() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className="bg-card border border-border rounded-2xl p-6 md:p-8"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <Globe className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">Geographic Expansion</h3>
          <p className="text-sm text-muted-foreground">Phased global rollout strategy</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Connection line */}
        <div className="hidden md:block absolute top-8 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 via-blue-500 via-purple-500 to-amber-500 opacity-30" />
        
        <div className="grid md:grid-cols-4 gap-4 md:gap-6">
          {expansionPhases.map((phase, i) => (
            <motion.div
              key={phase.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Timeline dot */}
              <div className="hidden md:flex items-center justify-center mb-4">
                <div 
                  className="w-4 h-4 rounded-full border-2 border-background z-10"
                  style={{ backgroundColor: phase.color, boxShadow: `0 0 12px ${phase.color}60` }}
                />
              </div>

              {/* Card */}
              <div 
                className="p-4 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors"
                style={{ borderColor: `${phase.color}40` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span 
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: `${phase.color}20`, color: phase.color }}
                  >
                    {phase.status}
                  </span>
                </div>
                
                <h4 className="font-bold text-foreground text-lg mb-1">{phase.name}</h4>
                <p className="text-sm text-muted-foreground mb-3">{phase.description}</p>
                
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                  <Calendar className="w-3 h-3" />
                  {phase.period}
                </div>

                {/* Cities */}
                <div className="flex flex-wrap gap-1.5">
                  {phase.cities.map((city) => (
                    <span 
                      key={city}
                      className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-background/50 text-muted-foreground"
                    >
                      <MapPin className="w-2.5 h-2.5" />
                      {city}
                    </span>
                  ))}
                </div>
              </div>

              {/* Arrow (mobile hidden, shown between cards on desktop) */}
              {i < expansionPhases.length - 1 && (
                <div className="hidden md:flex absolute -right-3 top-8 z-10">
                  <ArrowRight className="w-4 h-4 text-muted-foreground/50" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
