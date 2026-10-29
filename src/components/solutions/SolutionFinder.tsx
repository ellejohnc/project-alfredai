import { getActiveRoleFallbacks, getActiveRoleIndustryEngines } from './solutionFinderData';

import { useState } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { ArrowRight, Sparkles, Mail, CheckCircle2 } from "lucide-react";
import { HELLO_EMAIL } from "@/lib/siteConfig";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "react-router-dom";
import { engineMetadata, getSyncStatus } from "@/lib/demoEngineSync";
import { roles as liveRoles, industries as liveIndustries } from "@/data/solutionsData";

interface Role {
  id: string;
  title: string;
}

interface Industry {
  id: string;
  title: string;
}

interface SolutionFinderProps {
  roles: Role[];
  industries: Industry[];
  onBookCall: () => void;
}

export const SolutionFinder = ({ roles, industries, onBookCall }: SolutionFinderProps) => {
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("");

  // Pruned at render so any mapping key without a matching live selector
  // option is automatically dropped. This guarantees stale entries can't
  // re-surface even if someone re-adds them by mistake.
  const activeEngines = getActiveRoleIndustryEngines();
  const activeFallbacks = getActiveRoleFallbacks();

  const getRecommendation = () => {
    if (!selectedRole || !selectedIndustry) return null;
    const key = `${selectedRole}-${selectedIndustry}`;
    if (activeEngines[key]) return activeEngines[key];
    return activeFallbacks[selectedRole] || null;
  };

  const recommendation = getRecommendation();
  const syncStatus = getSyncStatus();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl border border-border overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 md:p-8 border-b border-border bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-xl md:text-2xl font-semibold text-foreground">
            Find Your AI Stack
          </h3>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <p className="text-muted-foreground flex-1">
            Select your role and industry to see your recommended AI engines
          </p>
          {/* Sync Status Indicator */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium self-start sm:self-center"
            title={`${syncStatus.mappedDemos} of ${syncStatus.totalDemos} demos mapped to recommendations`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <CheckCircle2 className="w-3 h-3" />
            Up to date with demos
          </div>
        </div>
      </div>

      {/* Selectors */}
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <label className="block text-sm font-medium text-foreground mb-2">
              I'm a...
            </label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-full h-12 text-base">
                <SelectValue placeholder="Select your role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-end justify-center px-4 py-3 text-muted-foreground font-medium">
            in
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-foreground mb-2">
              Industry
            </label>
            <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
              <SelectTrigger className="w-full h-12 text-base">
                <SelectValue placeholder="Select your industry" />
              </SelectTrigger>
              <SelectContent>
                {industries.map((industry) => (
                  <SelectItem key={industry.id} value={industry.id}>
                    {industry.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {recommendation ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Outcome statement */}
              <div className="bg-primary/5 rounded-xl p-4 mb-6 border border-primary/10">
                <p className="text-foreground font-medium text-center">
                  <span className="text-primary">Your AI stack will help you:</span>{" "}
                  {recommendation.outcome}
                </p>
              </div>

              {/* Engine cards */}
              <div className="grid gap-4">
                {recommendation.engines.map((engineName, index) => {
                  const engine = engineMetadata[engineName];
                  if (!engine) return null;
                  const Icon = engine.icon;

                  return (
                    <motion.div
                      key={engineName}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group bg-background hover:bg-muted/50 rounded-xl p-4 border border-border hover:border-primary/30 transition-all duration-200"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground mb-1">
                            {engineName}
                          </h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            {engine.description}
                          </p>
                          <Link
                            to={engine.demo}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                          >
                            See demo
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* CTA */}
              <div className="mt-8 pt-6 border-t border-border">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-muted-foreground text-center sm:text-left">
                    Ready to see these engines in action for your business?
                  </p>
                  <Button 
                    onClick={onBookCall}
                    className="shrink-0"
                    size="lg"
                  >
                    Book an Impact Conversation
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : selectedRole && selectedIndustry ? (
            // No engines found even with fallback - show helpful message
            <motion.div
              key="no-results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/20 mx-auto mb-4 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">
                We're building recommendations for this combination
              </h4>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Our team is working on tailored AI solutions for your role and industry. Book a call for personalized recommendations.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button onClick={onBookCall} size="lg">
                  Book a Personalized Consultation
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <a 
                  href={`mailto:${HELLO_EMAIL}?subject=Missing AI Stack Combination&body=Hi, I was looking for AI recommendations for my role and industry but couldn't find a match.%0A%0ARole: ${selectedRole}%0AIndustry: ${selectedIndustry}%0A%0APage: ${window.location.href}`}
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Report this combination
                </a>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                Select your role and industry above to see your recommended AI stack
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
