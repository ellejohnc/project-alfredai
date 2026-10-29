import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useHaptics } from "@/hooks/useHaptics";

interface PremiumCTASectionProps {
  title: string;
  description: string;
  buttonText: string;
  onButtonClick: () => void;
  variant?: "dark" | "light";
}

const PremiumCTASection = ({
  title,
  description,
  buttonText,
  onButtonClick,
  variant = "light"
}: PremiumCTASectionProps) => {
  const isDark = variant === "dark";
  const { vibrate } = useHaptics();

  const handleClick = () => {
    vibrate('medium');
    onButtonClick();
  };

  return (
    <section className={`py-20 relative overflow-hidden ${isDark ? 'bg-[hsl(220,25%,10%)]' : ''}`}>
      {/* Gradient background for light variant */}
      {!isDark && (
        <div className="absolute inset-0 bg-gradient-to-r from-pink-100/80 via-white to-cyan-100/80 pointer-events-none" />
      )}
      
      
      {/* Animated gradient orbs */}
      <motion.div 
        className={`absolute top-1/2 left-1/4 w-[400px] h-[400px] ${isDark ? 'bg-primary/20' : 'bg-pink-200/40'} rounded-full blur-[100px] pointer-events-none -translate-y-1/2`}
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className={`absolute top-1/2 right-1/4 w-[350px] h-[350px] ${isDark ? 'bg-accent/15' : 'bg-cyan-200/40'} rounded-full blur-[80px] pointer-events-none -translate-y-1/2`}
        animate={{ 
          scale: [1, 1.15, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <motion.div 
        className={`absolute bottom-0 right-1/3 w-[300px] h-[300px] ${isDark ? 'bg-secondary/15' : 'bg-purple-200/30'} rounded-full blur-[70px] pointer-events-none`}
        animate={{ 
          y: [0, -20, 0],
          opacity: [0.2, 0.4, 0.2]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      
      <div className="container-wide relative text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className={`text-2xl md:text-3xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-foreground'}`}>
            {title}
          </h2>
          <p className={`mb-8 max-w-xl mx-auto ${isDark ? 'text-white/70' : 'text-muted-foreground'}`}>
            {description}
          </p>
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              size="lg" 
              className={`${isDark ? 'bg-primary hover:bg-primary-hover' : 'bg-pink-500 hover:bg-pink-500'} text-white glow-pulse shadow-lg ${!isDark && 'shadow-pink-300/50'}`}
              onClick={handleClick}
            >
              {buttonText}
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default PremiumCTASection;
