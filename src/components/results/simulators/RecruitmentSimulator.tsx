import { useState } from "react";
import { Users, CheckCircle2, Star, Loader2, RotateCcw, Play, UserCheck, Award, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { getIndustryContent, type IndustryRecruitmentContent } from "./industryContent";
import { BeforeAfterCompare } from "./BeforeAfterCompare";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";

interface RecruitmentSimulatorProps {
  company: string;
  industry: string;
  onComplete?: () => void;
}

type SimulationStep = "idle" | "parsing" | "extracting" | "matching" | "ranking" | "complete";

interface CandidateResult {
  name: string;
  matchScore: number;
  highlight: string;
  skills: string[];
  status: "shortlisted" | "review" | "rejected";
}

export function RecruitmentSimulator({ company, industry, onComplete }: RecruitmentSimulatorProps) {
  const [step, setStep] = useState<SimulationStep>("idle");
  const [progress, setProgress] = useState(0);
  const [candidates, setCandidates] = useState<CandidateResult[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateResult | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  
  const content = getIndustryContent(industry).recruitment;
  
  const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  const handleReset = () => {
    setStep("idle");
    setProgress(0);
    setCandidates([]);
    setSelectedCandidate(null);
    setShowComparison(false);
  };
  
  const handleStart = async () => {
    // Step 1: Parsing resumes
    setStep("parsing");
    for (let i = 0; i <= 25; i += 5) {
      setProgress(i);
      await simulateDelay(80);
    }
    
    // Step 2: Extracting skills
    setStep("extracting");
    for (let i = 25; i <= 50; i += 5) {
      setProgress(i);
      await simulateDelay(100);
    }
    
    // Step 3: Matching to JD
    setStep("matching");
    for (let i = 50; i <= 75; i += 5) {
      setProgress(i);
      await simulateDelay(120);
    }
    
    // Step 4: Ranking
    setStep("ranking");
    for (let i = 75; i <= 100; i += 5) {
      setProgress(i);
      await simulateDelay(100);
    }
    
    // Generate candidate results from industry content
    const generatedCandidates: CandidateResult[] = content.candidates.map((c, idx) => ({
      name: c.name,
      matchScore: c.matchScore,
      highlight: c.highlight,
      skills: content.requiredSkills.slice(0, 3 + Math.floor(Math.random() * 2)),
      status: idx === 0 ? "shortlisted" : idx === 1 ? "review" : "review" as const,
    }));
    
    setCandidates(generatedCandidates);
    setSelectedCandidate(generatedCandidates[0]);
    
    // Complete
    setStep("complete");
    await simulateDelay(500);
    setShowComparison(true);
    onComplete?.();
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 80) return "text-yellow-500";
    return "text-muted-foreground";
  };
  
  const getScoreBg = (score: number) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 80) return "bg-yellow-500";
    return "bg-muted";
  };
  
  const getStepLabel = () => {
    switch (step) {
      case "idle":
        return "Ready to screen candidates";
      case "parsing":
        return "Parsing resume documents...";
      case "extracting":
        return "Extracting skills and experience...";
      case "matching":
        return "Matching against job requirements...";
      case "ranking":
        return "Ranking and scoring candidates...";
      case "complete":
        return "Screening complete";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="font-medium text-foreground">Candidate Screening</h4>
            <p className="text-sm text-muted-foreground">
              AI-powered {content.roleType} matching for {company}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {step === "idle" ? (
            <Button onClick={handleStart} size="sm" className="gap-2">
              <Play className="w-4 h-4" />
              Run Demo
            </Button>
          ) : step === "complete" ? (
            <Button onClick={handleReset} variant="outline" size="sm" className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
          ) : (
            <Button disabled size="sm" className="gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Screening...
            </Button>
          )}
        </div>
      </div>
      
      {/* Progress indicator */}
      {step !== "idle" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{getStepLabel()}</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}
      
      {/* Job Requirements */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Award className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Role: {content.roleType}</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {content.requiredSkills.map((skill, idx) => (
            <motion.span
              key={skill}
              initial={{ opacity: 0.5 }}
              animate={{ 
                opacity: step === "extracting" || step === "matching" || step === "ranking" || step === "complete" ? 1 : 0.5,
                scale: step === "matching" && progress > 55 + idx * 3 ? [1, 1.05, 1] : 1
              }}
              className={cn(
                "px-2 py-1 text-xs rounded-full border transition-colors",
                (step === "matching" || step === "ranking" || step === "complete") 
                  ? "border-primary/30 bg-primary/10 text-primary" 
                  : "border-border bg-muted/30 text-muted-foreground"
              )}
            >
              {skill}
            </motion.span>
          ))}
          {content.certifications.slice(0, 2).map((cert, idx) => (
            <motion.span
              key={cert}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: step === "complete" ? 1 : 0.5 }}
              className="px-2 py-1 text-xs rounded-full border border-border bg-muted/30 text-muted-foreground"
            >
              {cert}
            </motion.span>
          ))}
        </div>
      </div>
      
      {/* Main content grid */}
      <div className="grid md:grid-cols-2 gap-6 min-h-[350px]">
        {/* Candidate Rankings */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <UserCheck className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Candidate Rankings</span>
          </div>
          
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {step === "idle" ? (
                <div className="text-sm text-muted-foreground text-center py-8">
                  Click "Run Demo" to screen candidates
                </div>
              ) : step === "complete" && candidates.length > 0 ? (
                candidates.map((candidate, idx) => (
                  <motion.div
                    key={candidate.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.15 }}
                    onClick={() => setSelectedCandidate(candidate)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                      selectedCandidate?.name === candidate.name
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {/* Rank */}
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                      idx === 0 ? "bg-yellow-500/20 text-yellow-600" :
                      idx === 1 ? "bg-slate-300/30 text-slate-500" :
                      "bg-amber-700/20 text-amber-700"
                    )}>
                      {idx + 1}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{candidate.name}</span>
                        {candidate.status === "shortlisted" && (
                          <span className="px-1.5 py-0.5 text-[10px] rounded bg-green-500/20 text-green-600">
                            SHORTLISTED
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {candidate.highlight}
                      </div>
                    </div>
                    
                    {/* Score */}
                    <div className="text-right">
                      <div className={cn("text-lg font-bold", getScoreColor(candidate.matchScore))}>
                        {candidate.matchScore}%
                      </div>
                      <div className="text-[10px] text-muted-foreground">match</div>
                    </div>
                  </motion.div>
                ))
              ) : (
                // Loading state
                Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30 animate-pulse"
                  >
                    <div className="w-8 h-8 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/2" />
                      <div className="h-3 bg-muted rounded w-3/4" />
                    </div>
                    <div className="w-12 h-8 bg-muted rounded" />
                  </div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
        
        {/* Candidate Detail */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">AI Analysis</span>
          </div>
          
          {step === "complete" && selectedCandidate ? (
            <motion.div
              key={selectedCandidate.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {/* Match Score Visual */}
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 transform -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      className="text-muted"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray={`${selectedCandidate.matchScore * 1.76} 176`}
                      className={getScoreColor(selectedCandidate.matchScore)}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={cn("text-lg font-bold", getScoreColor(selectedCandidate.matchScore))}>
                      {selectedCandidate.matchScore}
                    </span>
                  </div>
                </div>
                
                <div>
                  <div className="font-medium">{selectedCandidate.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedCandidate.matchScore >= 90 ? "Strong match" : 
                     selectedCandidate.matchScore >= 80 ? "Good match" : "Potential match"}
                  </div>
                </div>
              </div>
              
              {/* Skills Match */}
              <div>
                <div className="text-xs text-muted-foreground mb-2">Matched Skills</div>
                <div className="flex flex-wrap gap-1">
                  {selectedCandidate.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 text-xs rounded-full bg-green-500/10 text-green-600 border border-green-500/20"
                    >
                      ✓ {skill}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Highlight */}
              <div>
                <div className="text-xs text-muted-foreground mb-1">AI Summary</div>
                <p className="text-sm text-foreground">{selectedCandidate.highlight}</p>
              </div>
              
              {/* Action */}
              {selectedCandidate.status === "shortlisted" && (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-500/10 rounded-lg p-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Recommended for interview</span>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-12">
              {step === "idle" ? "Run demo to see AI analysis" : "Analyzing candidates..."}
            </div>
          )}
        </div>
      </div>
      
      {/* Before/After Comparison */}
      {showComparison && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-4"
        >
          <BeforeAfterCompare
            title="Recruitment Efficiency with alfred ai"
            items={[
              { label: "Resume Screening", before: "4 hours", after: "5 minutes" },
              { label: "Candidate Shortlisting", before: "2 days", after: "Instant" },
              { label: "Skills Verification", before: "Manual", after: "Automated" },
              { label: "Time-to-Interview", before: "7 days", after: "24 hours" },
            ]}
          />
        </motion.div>
      )}
      
      {/* Completion CTA */}
      {step === "complete" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-2 text-sm text-primary"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{candidates.filter(c => c.status === "shortlisted").length} candidates shortlisted for interview</span>
          <ArrowRight className="w-4 h-4" />
        </motion.div>
      )}
    </div>
  );
}
