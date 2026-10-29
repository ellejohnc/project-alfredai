import { memo } from 'react';

interface WaveDividerProps {
  className?: string;
  flip?: boolean;
}

const WaveDivider = memo(({ className = '', flip = false }: WaveDividerProps) => {
  return (
    <div 
      className={`absolute left-0 right-0 w-full overflow-hidden pointer-events-none z-10 ${flip ? 'rotate-180' : ''} ${className}`}
      style={{ height: '250px' }}
    >
      <svg
        className="absolute w-full h-full"
        viewBox="0 0 1440 250"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'blur(4px)' }}
      >
        <defs>
          <linearGradient id="ultraSoftWave1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(222,47%,7%)" stopOpacity="0" />
            <stop offset="50%" stopColor="hsl(222,47%,7%)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="hsl(222,47%,7%)" stopOpacity="0.9" />
          </linearGradient>

          <linearGradient id="ultraSoftWave2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(222,47%,7%)" stopOpacity="0" />
            <stop offset="40%" stopColor="hsl(222,47%,7%)" stopOpacity="0.3" />
            <stop offset="80%" stopColor="hsl(222,47%,7%)" stopOpacity="0.7" />
            <stop offset="100%" stopColor="hsl(222,47%,7%)" stopOpacity="1" />
          </linearGradient>

          <linearGradient id="ultraSoftWave3" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(222,47%,7%)" stopOpacity="0" />
            <stop offset="60%" stopColor="hsl(222,47%,7%)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="hsl(222,47%,7%)" stopOpacity="1" />
          </linearGradient>
        </defs>
        
        {/* Wave layer 1 — CSS animation */}
        <path
          className="animate-wave-slow"
          fill="url(#ultraSoftWave1)"
          d="M0,60 C360,100 720,30 1080,70 C1260,90 1380,50 1440,60 L1440,250 L0,250 Z"
        />
        
        {/* Wave layer 2 — CSS animation */}
        <path
          className="animate-wave-mid"
          fill="url(#ultraSoftWave2)"
          d="M0,90 C240,60 480,120 720,80 C960,40 1200,100 1440,90 L1440,250 L0,250 Z"
        />
        
        {/* Wave layer 3 — CSS animation */}
        <path
          className="animate-wave-fast"
          fill="url(#ultraSoftWave3)"
          d="M0,120 C360,100 720,150 1080,110 C1260,95 1350,130 1440,120 L1440,250 L0,250 Z"
        />
      </svg>
      
      {/* Soft blend at bottom — merges into page background */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[hsl(222,47%,7%)] to-transparent" />
    </div>
  );
});

WaveDivider.displayName = 'WaveDivider';

export default WaveDivider;
