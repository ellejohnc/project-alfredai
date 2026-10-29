import { useState, useCallback, useEffect, useRef } from "react";
import { useConversation } from "@elevenlabs/react";
import { Button } from "@/components/ui/button";
import { Mic, PhoneOff, Volume2, RefreshCw, MessageCircle, WifiOff, AlertCircle, Sparkles, Radio, VolumeX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { SafeAnimatePresence } from "@/components/ui/safe-animate-presence";
import { cn } from "@/lib/utils";
import { ChatAvatar } from "@/components/chat/shared";

// Ambient floating particles that respond to audio
const AmbientParticles = ({ isActive, intensity = 0 }: { isActive: boolean; intensity: number }) => {
  const particles = 20;
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: particles }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary/30"
          initial={{
            x: `${Math.random() * 100}%`,
            y: `${Math.random() * 100}%`,
            opacity: 0.3,
          }}
          animate={isActive ? {
            y: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
            x: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
            opacity: [0.2, 0.5 + intensity * 0.3, 0.2],
            scale: [1, 1.5 + intensity, 1],
          } : {
            opacity: 0.1,
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
};

// Pulsing ring animation for the microphone button
const PulsingRings = ({ isActive, color = "primary" }: { isActive: boolean; color?: string }) => {
  if (!isActive) return null;
  
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={cn(
            "absolute rounded-full border-2",
            color === "primary" ? "border-primary/40" : "border-emerald-500/40"
          )}
          initial={{ width: 80, height: 80, opacity: 0.6 }}
          animate={{
            width: [80, 140 + i * 20],
            height: [80, 140 + i * 20],
            opacity: [0.6, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.4,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
};

// Glow effect behind mic button
const MicGlow = ({ isActive, isSpeaking }: { isActive: boolean; isSpeaking: boolean }) => {
  if (!isActive) return null;
  
  return (
    <motion.div
      className={cn(
        "absolute inset-0 rounded-full blur-xl",
        isSpeaking ? "bg-primary/40" : "bg-emerald-500/40"
      )}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.4, 0.6, 0.4],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
};

// Voice activity visualization component
const VoiceActivityVisualizer = ({ conversation, isConnected }: { conversation: any; isConnected: boolean }) => {
  const [inputLevel, setInputLevel] = useState(0);
  const [outputLevel, setOutputLevel] = useState(0);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!isConnected) {
      setInputLevel(0);
      setOutputLevel(0);
      return;
    }

    const updateLevels = () => {
      try {
        const input = conversation.getInputVolume?.() || 0;
        const output = conversation.getOutputVolume?.() || 0;
        setInputLevel(input);
        setOutputLevel(output);
      } catch (e) {
        // Ignore errors when not connected
      }
      animationRef.current = requestAnimationFrame(updateLevels);
    };

    animationRef.current = requestAnimationFrame(updateLevels);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [conversation, isConnected]);

  if (!isConnected) return null;

  const bars = 32;
  const activeLevel = conversation.isSpeaking ? outputLevel : inputLevel;
  const isSpeaking = conversation.isSpeaking;

  return (
    <div className="flex items-center justify-center gap-[2px] h-16 px-4">
      {Array.from({ length: bars }).map((_, i) => {
        const centerIndex = bars / 2;
        const distanceFromCenter = Math.abs(i - centerIndex) / centerIndex;
        const baseHeight = Math.max(0.15, 1 - distanceFromCenter * 0.7);
        const barHeight = Math.min(100, Math.max(6, activeLevel * 150 * baseHeight * (1 + Math.sin(i * 0.4 + Date.now() * 0.01) * 0.3)));
        const isActive = (i / bars) < activeLevel + 0.2 || activeLevel > 0.03;
        
        return (
          <motion.div
            key={i}
            className={cn(
              "w-1 rounded-full transition-all duration-50",
              isActive 
                ? isSpeaking 
                  ? "bg-gradient-to-t from-primary via-primary/80 to-primary/40" 
                  : "bg-gradient-to-t from-emerald-500 via-emerald-400 to-emerald-300"
                : "bg-slate-700/40"
            )}
            animate={{
              height: isActive ? `${Math.max(4, barHeight * 0.6)}px` : "4px",
              opacity: isActive ? 0.85 + (barHeight / 250) : 0.2,
            }}
            transition={{
              duration: 0.04,
              ease: "linear",
            }}
          />
        );
      })}
    </div>
  );
};

type VoiceErrorType = "microphone" | "network" | "service" | "timeout" | null;

const ERROR_MESSAGES: Record<Exclude<VoiceErrorType, null>, { title: string; message: string; action: string; icon: typeof AlertCircle }> = {
  microphone: {
    title: "Microphone Access Denied",
    message: "Please allow microphone access in your browser settings to use voice chat.",
    action: "Try Again",
    icon: Mic,
  },
  network: {
    title: "Connection Lost",
    message: "Your internet connection appears to be unstable. Please check your connection.",
    action: "Reconnect",
    icon: WifiOff,
  },
  service: {
    title: "Service Unavailable",
    message: "The voice agent is temporarily unavailable. Try text chat instead!",
    action: "Retry Voice",
    icon: AlertCircle,
  },
  timeout: {
    title: "Connection Timeout",
    message: "The connection is taking too long. Please try again.",
    action: "Try Again",
    icon: RefreshCw,
  },
};

const VoiceAgentDemo = () => {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcript, setTranscript] = useState<{ role: string; text: string }[]>([]);
  const [errorType, setErrorType] = useState<VoiceErrorType>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showTextChatFallback, setShowTextChatFallback] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioIntensity, setAudioIntensity] = useState(0);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to voice agent");
      setErrorType(null);
      setRetryCount(0);
      toast({
        title: "Connected",
        description: "Voice agent is ready. Start speaking!",
      });
    },
    onDisconnect: () => {
      console.log("Disconnected from agent");
      toast({
        title: "Disconnected",
        description: "Voice conversation ended.",
      });
    },
    onMessage: (message: any) => {
      console.log("Message received:", message);
      if (message.type === "user_transcript") {
        const userText = message.user_transcription_event?.user_transcript;
        if (userText) {
          setTranscript(prev => [...prev, { role: "user", text: userText }]);
        }
      } else if (message.type === "agent_response") {
        const agentText = message.agent_response_event?.agent_response;
        if (agentText) {
          setTranscript(prev => [...prev, { role: "agent", text: agentText }]);
        }
      }
    },
    onError: (error) => {
      console.error("Conversation error:", error);
      const errorMsg = (typeof error === "string" ? error : "").toLowerCase();
      
      if (errorMsg.includes("network") || !navigator.onLine) {
        setErrorType("network");
      } else if (errorMsg.includes("timeout")) {
        setErrorType("timeout");
      } else {
        setErrorType("service");
      }
      
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Failed to connect to voice agent. Please try again.",
      });
      setIsConnecting(false);
    },
  });

  // Track audio intensity for ambient effects
  useEffect(() => {
    if (conversation.status !== "connected") {
      setAudioIntensity(0);
      return;
    }

    const interval = setInterval(() => {
      try {
        const input = conversation.getInputVolume?.() || 0;
        const output = conversation.getOutputVolume?.() || 0;
        setAudioIntensity(Math.max(input, output));
      } catch (e) {
        // Ignore
      }
    }, 100);

    return () => clearInterval(interval);
  }, [conversation]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  const startConversation = useCallback(async () => {
    if (!navigator.onLine) {
      setErrorType("network");
      toast({
        variant: "destructive",
        title: "No Internet Connection",
        description: "Please check your connection and try again.",
      });
      return;
    }

    setIsConnecting(true);
    setTranscript([]);
    setErrorType(null);

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (micError) {
      console.error("Microphone permission denied:", micError);
      setErrorType("microphone");
      setIsConnecting(false);
      toast({
        variant: "destructive",
        title: "Microphone Access Required",
        description: "Please allow microphone access to use voice chat.",
      });
      return;
    }

    try {
      const timeoutId = setTimeout(() => {
        if (isConnecting) {
          setErrorType("timeout");
          setIsConnecting(false);
        }
      }, 15000);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-conversation-token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ agentId: "rKYOvICmpWx6HERoeBKh" }),
        }
      );

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok || !data.signed_url) {
        throw new Error(data.error || "Failed to get conversation token");
      }

      await conversation.startSession({
        signedUrl: data.signed_url,
      });

    } catch (error) {
      console.error("Failed to start conversation:", error);
      setRetryCount(prev => prev + 1);
      
      if (!navigator.onLine) {
        setErrorType("network");
      } else {
        setErrorType("service");
      }
      
      if (retryCount >= 2) {
        setShowTextChatFallback(true);
      }
      
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Could not start voice conversation.",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, toast, isConnecting, retryCount]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  const handleRetry = useCallback(() => {
    setErrorType(null);
    startConversation();
  }, [startConversation]);

  const isConnected = conversation.status === "connected";

  return (
    <div className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-700/50 rounded-2xl overflow-hidden max-w-2xl mx-auto shadow-2xl shadow-primary/5">
      {/* Ambient particles */}
      <AmbientParticles isActive={isConnected} intensity={audioIntensity} />
      
      {/* Header */}
      <div className="relative px-6 pt-6 pb-4 border-b border-slate-800/50">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                Voice Agent
                <Sparkles className="w-4 h-4 text-primary" />
              </h3>
              <p className="text-xs text-slate-400">Real-time AI conversation</p>
            </div>
          </div>
          
          {/* Status badge */}
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300",
            isConnected 
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : isConnecting
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                : errorType
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "bg-slate-800 text-slate-400 border border-slate-700"
          )}>
            <motion.div
              className={cn(
                "w-2 h-2 rounded-full",
                isConnected ? "bg-emerald-400" : isConnecting ? "bg-amber-400" : errorType ? "bg-red-400" : "bg-slate-500"
              )}
              animate={isConnected || isConnecting ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            {isConnected ? "Live" : isConnecting ? "Connecting" : errorType ? "Error" : "Ready"}
          </div>
        </div>
      </div>

      {/* Offline Banner */}
      {!navigator.onLine && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="flex items-center justify-center gap-2 bg-red-500/10 border-b border-red-500/20 px-4 py-3"
        >
          <WifiOff className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-400">You're offline. Please check your connection.</span>
        </motion.div>
      )}

      {/* Error Fallback */}
      <SafeAnimatePresence>
        {errorType && !isConnecting && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-slate-800/50"
          >
            <div className="bg-red-500/5 p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  {(() => {
                    const ErrorIcon = ERROR_MESSAGES[errorType].icon;
                    return <ErrorIcon className="w-4 h-4 text-red-400" />;
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-white text-sm">{ERROR_MESSAGES[errorType].title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{ERROR_MESSAGES[errorType].message}</p>
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRetry}
                      className="gap-1.5 text-xs h-8 border-slate-700 bg-slate-800/50 hover:bg-slate-700"
                    >
                      <RefreshCw className="w-3 h-3" />
                      {ERROR_MESSAGES[errorType].action}
                    </Button>
                    
                    {showTextChatFallback && (
                      <Button
                        size="sm"
                        onClick={() => {
                          document.querySelector('[aria-label="Open chat"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                        }}
                        className="gap-1.5 text-xs h-8 bg-primary hover:bg-primary/90"
                      >
                        <MessageCircle className="w-3 h-3" />
                        Use Text Chat
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </SafeAnimatePresence>

      {/* Main Content */}
      <div className="relative p-6">
        {/* Central Control Area */}
        <div className="flex flex-col items-center py-6">
          {/* Microphone Button with Glow and Pulsing Rings */}
          <div className="relative mb-6">
            <MicGlow isActive={isConnected} isSpeaking={conversation.isSpeaking} />
            <PulsingRings isActive={isConnected} color={conversation.isSpeaking ? "primary" : "green"} />
            
            {!isConnected ? (
              <motion.button
                onClick={startConversation}
                disabled={isConnecting || !navigator.onLine}
                className={cn(
                  "relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300",
                  "bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
                  "shadow-xl shadow-primary/30 hover:shadow-primary/40",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={!isConnecting ? { 
                  boxShadow: ["0 25px 50px -12px rgba(var(--primary), 0.3)", "0 25px 50px -12px rgba(var(--primary), 0.5)", "0 25px 50px -12px rgba(var(--primary), 0.3)"]
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {isConnecting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  >
                    <Mic className="w-8 h-8 text-white" />
                  </motion.div>
                ) : (
                  <Mic className="w-8 h-8 text-white" />
                )}
              </motion.button>
            ) : (
              <motion.button
                onClick={stopConversation}
                className={cn(
                  "relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300",
                  "bg-gradient-to-br from-red-500 to-red-600 hover:from-red-400 hover:to-red-500",
                  "shadow-xl shadow-red-500/30"
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <PhoneOff className="w-8 h-8 text-white" />
              </motion.button>
            )}
          </div>

          {/* Mute button when connected */}
          {isConnected && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setIsMuted(!isMuted)}
              className={cn(
                "absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-xl transition-all",
                isMuted 
                  ? "bg-red-500/20 text-red-400 border border-red-500/30" 
                  : "bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-700/50"
              )}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </motion.button>
          )}

          {/* Status Text */}
          <div className="text-center mb-2">
            <p className="text-sm font-medium text-white">
              {isConnected 
                ? conversation.isSpeaking 
                  ? "Alfred is speaking..." 
                  : "Listening to you..."
                : isConnecting 
                  ? "Connecting to voice agent..." 
                  : "Tap to start conversation"}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {isConnected 
                ? "Speak naturally, I'm listening"
                : "Experience real-time AI voice chat"}
            </p>
          </div>

          {/* Speaking/Listening Indicator */}
          {isConnected && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mt-2"
            >
              {conversation.isSpeaking ? (
                <Volume2 className="w-4 h-4 text-primary animate-pulse" />
              ) : (
                <Mic className="w-4 h-4 text-emerald-400" />
              )}
              <span className={cn(
                "text-xs font-medium",
                conversation.isSpeaking ? "text-primary" : "text-emerald-400"
              )}>
                {conversation.isSpeaking ? "Agent responding" : "Your turn"}
              </span>
            </motion.div>
          )}
        </div>

        {/* Voice Activity Visualization */}
        <SafeAnimatePresence>
          {isConnected && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden">
                <VoiceActivityVisualizer conversation={conversation} isConnected={isConnected} />
              </div>
            </motion.div>
          )}
        </SafeAnimatePresence>

        {/* Live Transcript with improved styling */}
        <SafeAnimatePresence>
          {transcript.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
                <h4 className="text-sm font-medium text-white flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-primary" />
                  Conversation
                </h4>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Live transcript</span>
              </div>
              
              <div className="p-4 max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                <div className="space-y-3">
                  {transcript.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: item.role === "user" ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn("flex gap-2.5", item.role === "user" ? "justify-end" : "justify-start")}
                    >
                      {item.role !== "user" && (
                        <ChatAvatar role="assistant" size="sm" className="mt-0.5" />
                      )}
                      <div
                        className={cn(
                          "max-w-[80%] px-4 py-2.5 rounded-2xl text-sm shadow-sm",
                          item.role === "user"
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-slate-700/70 text-slate-200 rounded-bl-md border border-slate-600/30"
                        )}
                      >
                        {item.text}
                      </div>
                    </motion.div>
                  ))}
                  <div ref={transcriptEndRef} />
                </div>
              </div>
            </motion.div>
          )}
        </SafeAnimatePresence>

        {/* Empty State Hint with breathing animation */}
        {!isConnected && !isConnecting && !errorType && transcript.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center py-4"
          >
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-xs text-slate-400">Press the microphone to begin</span>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default VoiceAgentDemo;
