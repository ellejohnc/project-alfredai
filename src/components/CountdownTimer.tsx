import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CountdownTimerProps {
  targetDate: Date;
  className?: string;
  compact?: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

const calculateTimeLeft = (targetDate: Date): TimeLeft => {
  const difference = targetDate.getTime() - new Date().getTime();
  
  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    total: difference
  };
};

const CountdownTimer = ({ targetDate, className = '', compact = false }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft.total <= 0) {
    return (
      <div className={`text-emerald-600 font-medium ${className}`}>
        Event is live now!
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 text-sm font-medium ${className}`}>
        <span className="text-primary">{timeLeft.days}d</span>
        <span className="text-muted-foreground">:</span>
        <span className="text-primary">{String(timeLeft.hours).padStart(2, '0')}h</span>
        <span className="text-muted-foreground">:</span>
        <span className="text-primary">{String(timeLeft.minutes).padStart(2, '0')}m</span>
        <span className="text-muted-foreground">:</span>
        <span className="text-primary">{String(timeLeft.seconds).padStart(2, '0')}s</span>
      </div>
    );
  }

  const timeUnits = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds },
  ];

  return (
    <div className={`flex items-center gap-2 md:gap-3 ${className}`}>
      {timeUnits.map((unit, index) => (
        <div key={unit.label} className="flex items-center gap-2 md:gap-3">
          <motion.div 
            className="flex flex-col items-center"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <motion.span 
                key={unit.value}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-xl md:text-2xl font-bold text-primary"
              >
                {String(unit.value).padStart(2, '0')}
              </motion.span>
            </div>
            <span className="text-xs text-muted-foreground mt-1.5 uppercase tracking-wider">
              {unit.label}
            </span>
          </motion.div>
          {index < timeUnits.length - 1 && (
            <span className="text-2xl text-muted-foreground/50 font-light mt-[-1rem]">:</span>
          )}
        </div>
      ))}
    </div>
  );
};

export default CountdownTimer;
