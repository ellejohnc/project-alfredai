import { useEffect, useRef } from 'react';
import { subscribeScroll } from '@/hooks/useScrollManager';

const ScrollProgress = () => {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return subscribeScroll((scrollY, maxScroll) => {
      if (maxScroll > 0 && barRef.current) {
        const pct = Math.min(100, Math.max(0, (scrollY / maxScroll) * 100));
        barRef.current.style.width = `${pct}%`;
      }
    });
  }, []);

  return (
    <div
      className="fixed top-0 left-0 w-full h-[3px] z-50 bg-transparent pointer-events-none"
      role="progressbar"
      aria-label="Scroll progress"
    >
      <div
        ref={barRef}
        className="h-full bg-foreground will-change-[width]"
        style={{ width: '0%', transition: 'none' }}
      />
    </div>
  );
};

export default ScrollProgress;
