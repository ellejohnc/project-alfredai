import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "@/components/ui/safe-animate-presence";
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Loader2,
  KeyRound,
  Settings,
  ArrowRightLeft,
  RefreshCw,
  Zap,
  CheckCircle2,
  ExternalLink,
  GripVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Integration, SetupStep } from "./types";
import confetti from "canvas-confetti";

interface SetupWizardProps {
  integration: Integration;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (integrationId: string) => void;
}

const stepIcons = {
  auth: KeyRound,
  config: Settings,
  mapping: ArrowRightLeft,
  sync: RefreshCw,
  test: Zap
};

// Field mapping simulation data
const sourceFields = ["customer_id", "name", "email", "phone", "company", "created_at"];
const targetFields = ["id", "full_name", "email_address", "phone_number", "organization", "created_date"];

export default function SetupWizard({ integration, isOpen, onClose, onComplete }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [testProgress, setTestProgress] = useState(0);
  const [testStage, setTestStage] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [oauthConnected, setOauthConnected] = useState(false);

  const steps = integration.setupSteps;
  const step = steps[currentStep];
  const StepIcon = stepIcons[step.type];

  const testStages = [
    "Connecting to " + integration.name + "...",
    "Authenticating...",
    "Fetching sample data...",
    "Validating mappings...",
    "Connection successful!"
  ];

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setFormData({});
      setMappings({});
      setTestProgress(0);
      setTestStage(0);
      setIsComplete(false);
      setOauthConnected(false);
    }
  }, [isOpen]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleOAuthConnect = () => {
    setIsProcessing(true);
    // Simulate OAuth flow
    setTimeout(() => {
      setOauthConnected(true);
      setIsProcessing(false);
    }, 2000);
  };

  const handleTestConnection = () => {
    setIsProcessing(true);
    setTestProgress(0);
    setTestStage(0);

    const interval = setInterval(() => {
      setTestProgress(prev => {
        const newProgress = prev + 5;
        const newStage = Math.floor(newProgress / 25);
        setTestStage(Math.min(newStage, testStages.length - 1));
        
        if (newProgress >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
        }
        return Math.min(newProgress, 100);
      });
    }, 150);
  };

  const handleActivate = () => {
    setIsComplete(true);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    
    setTimeout(() => {
      onComplete(integration.id);
      onClose();
    }, 2000);
  };

  const renderStepContent = () => {
    switch (step.type) {
      case "auth":
        return renderAuthStep();
      case "config":
        return renderConfigStep();
      case "mapping":
        return renderMappingStep();
      case "sync":
        return renderSyncStep();
      case "test":
        return renderTestStep();
      default:
        return null;
    }
  };

  const renderAuthStep = () => {
    const hasOAuth = step.fields?.some(f => f.type === "oauth");
    
    if (hasOAuth) {
      return (
        <div className="space-y-6">
          <div className="text-center py-8">
            <div className={cn(
              "w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4 bg-gradient-to-br",
              integration.color
            )}>
              <integration.icon className="w-10 h-10 text-primary" />
            </div>
            <h4 className="font-semibold text-lg mb-2">Connect to {integration.name}</h4>
            <p className="text-sm text-muted-foreground mb-6">
              Click below to authorize alfred ai to access your {integration.name} account
            </p>
            
            {oauthConnected ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center justify-center gap-2 text-green-500"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Connected successfully!</span>
              </motion.div>
            ) : (
              <Button 
                onClick={handleOAuthConnect}
                disabled={isProcessing}
                className="gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4" />
                    Connect with {integration.name}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {step.fields?.map(field => (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.label}</Label>
            <Input
              id={field.name}
              type={field.type === "password" ? "password" : "text"}
              placeholder={field.placeholder}
              value={formData[field.name] || ""}
              onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
            />
          </div>
        ))}
      </div>
    );
  };

  const renderConfigStep = () => (
    <div className="space-y-4">
      {step.fields?.map(field => (
        <div key={field.name} className="space-y-2">
          {field.type === "toggle" ? (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <Label htmlFor={field.name}>{field.label}</Label>
              <Switch
                id={field.name}
                checked={formData[field.name] ?? field.defaultValue ?? false}
                onCheckedChange={checked => setFormData({ ...formData, [field.name]: checked })}
              />
            </div>
          ) : field.type === "select" ? (
            <>
              <Label htmlFor={field.name}>{field.label}</Label>
              <Select
                value={formData[field.name] || field.options?.[0]}
                onValueChange={value => setFormData({ ...formData, [field.name]: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map(option => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          ) : (
            <>
              <Label htmlFor={field.name}>{field.label}</Label>
              <Input
                id={field.name}
                placeholder={field.placeholder}
                value={formData[field.name] || ""}
                onChange={e => setFormData({ ...formData, [field.name]: e.target.value })}
              />
            </>
          )}
        </div>
      ))}
    </div>
  );

  const renderMappingStep = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        Map fields from {integration.name} to alfred ai
      </p>
      
      <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center mb-2">
        <div className="text-xs font-medium text-muted-foreground">Source Field</div>
        <div className="w-8" />
        <div className="text-xs font-medium text-muted-foreground">Target Field</div>
      </div>
      
      {sourceFields.map((source, idx) => (
        <motion.div
          key={source}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center"
        >
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg text-sm">
            <GripVertical className="w-3 h-3 text-muted-foreground" />
            {source}
          </div>
          <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
          <Select
            value={mappings[source] || targetFields[idx]}
            onValueChange={value => setMappings({ ...mappings, [source]: value })}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {targetFields.map(target => (
                <SelectItem key={target} value={target}>
                  {target}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>
      ))}
      
      <Button variant="outline" size="sm" className="w-full mt-4 gap-2">
        <Zap className="w-3 h-3" />
        AI Auto-Map Fields
      </Button>
    </div>
  );

  const renderSyncStep = () => (
    <div className="space-y-4">
      {step.fields?.map(field => (
        <div key={field.name} className="space-y-2">
          <Label>{field.label}</Label>
          {field.type === "select" ? (
            <div className="grid grid-cols-2 gap-2">
              {field.options?.map(option => (
                <button
                  key={option}
                  onClick={() => setFormData({ ...formData, [field.name]: option })}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-medium transition-colors border",
                    formData[field.name] === option || (!formData[field.name] && option === field.options?.[0])
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 text-muted-foreground border-transparent hover:border-primary/40"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ))}
      
      <div className="mt-6 p-4 bg-muted/30 rounded-lg">
        <h5 className="text-sm font-medium mb-2">Sync Preview</h5>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>Next sync: In 15 minutes</span>
          </div>
          <div className="flex items-center gap-1">
            <RefreshCw className="w-3 h-3" />
            <span>Est. 250 records</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTestStep = () => (
    <div className="space-y-6">
      {!isComplete ? (
        <>
          <div className="text-center py-4">
            <h4 className="font-semibold mb-2">Test Your Connection</h4>
            <p className="text-sm text-muted-foreground">
              Verify everything is working before activating
            </p>
          </div>
          
          {testProgress > 0 ? (
            <div className="space-y-4">
              <Progress value={testProgress} className="h-2" />
              <div className="space-y-2">
                {testStages.map((stage, idx) => (
                  <motion.div
                    key={stage}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ 
                      opacity: testStage >= idx ? 1 : 0.3,
                      x: 0
                    }}
                    className={cn(
                      "flex items-center gap-2 text-sm",
                      testStage >= idx ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {testStage > idx ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : testStage === idx ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-muted-foreground/30" />
                    )}
                    {stage}
                  </motion.div>
                ))}
              </div>
              
              {testProgress === 100 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg"
                >
                  <h5 className="font-medium text-green-600 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Connection Test Passed
                  </h5>
                  <p className="text-sm text-muted-foreground">
                    Sample data retrieved successfully. Ready to activate.
                  </p>
                  
                  <div className="mt-3 p-2 bg-card rounded border text-xs font-mono overflow-x-auto">
                    <pre className="text-muted-foreground">
{`{
  "records": 3,
  "sample": [
    { "id": "1", "name": "John Doe" },
    { "id": "2", "name": "Jane Smith" },
    { "id": "3", "name": "Bob Wilson" }
  ]
}`}
                    </pre>
                  </div>
                </motion.div>
              )}
            </div>
          ) : (
            <Button 
              onClick={handleTestConnection} 
              className="w-full gap-2"
              disabled={isProcessing}
            >
              <Zap className="w-4 h-4" />
              Run Connection Test
            </Button>
          )}
        </>
      ) : (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center py-8"
        >
          <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h4 className="text-xl font-semibold mb-2">Integration Activated!</h4>
          <p className="text-muted-foreground">
            {integration.name} is now connected to alfred ai
          </p>
        </motion.div>
      )}
    </div>
  );

  const canProceed = () => {
    if (step.type === "auth") {
      const hasOAuth = step.fields?.some(f => f.type === "oauth");
      if (hasOAuth) return oauthConnected;
      return step.fields?.filter(f => f.required).every(f => formData[f.name]);
    }
    if (step.type === "test") return testProgress === 100;
    return true;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
        >
          {/* Header */}
          <div className={cn(
            "px-6 py-4 border-b border-border flex items-center justify-between bg-gradient-to-r",
            integration.color
          )}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-background/50 flex items-center justify-center">
                <integration.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{integration.name} Setup</h3>
                <p className="text-xs text-muted-foreground">Step {currentStep + 1} of {steps.length}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Progress Steps */}
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              {steps.map((s, idx) => {
                const Icon = stepIcons[s.type];
                const isActive = idx === currentStep;
                const isCompleted = idx < currentStep;
                
                return (
                  <div key={s.id} className="flex items-center">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                      isCompleted ? "bg-green-500 text-white" :
                      isActive ? "bg-primary text-primary-foreground" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {isCompleted ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>
                    {idx < steps.length - 1 && (
                      <div className={cn(
                        "w-8 h-0.5 mx-1",
                        isCompleted ? "bg-green-500" : "bg-muted"
                      )} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step Content */}
          <div className="px-6 py-6">
            <div className="mb-4">
              <h4 className="font-semibold flex items-center gap-2">
                <StepIcon className="w-4 h-4 text-primary" />
                {step.title}
              </h4>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderStepContent()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-muted/30">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
            
            {currentStep === steps.length - 1 && testProgress === 100 && !isComplete ? (
              <Button onClick={handleActivate} className="gap-2 bg-green-500 hover:bg-green-600">
                <Zap className="w-4 h-4" />
                Activate Integration
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={currentStep === steps.length - 1 || !canProceed()}
                className="gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
