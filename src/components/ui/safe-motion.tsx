import { Component, ReactNode, forwardRef, HTMLAttributes, memo, useState, useEffect, RefObject } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

// Error boundary for motion components
class MotionErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn('SafeMotion caught animation error:', error.message);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Extract only safe HTML props for fallback - avoid any motion-specific props
function extractSafeHtmlProps(props: Record<string, unknown>): Record<string, unknown> {
  const motionPropKeys = [
    'animate', 'initial', 'exit', 'whileHover', 'whileInView', 'whileTap',
    'whileFocus', 'whileDrag', 'transition', 'viewport', 'variants',
    'layout', 'layoutId', 'drag', 'dragConstraints', 'dragElastic',
    'dragMomentum', 'dragTransition', 'dragPropagation', 'dragControls',
    'dragSnapToOrigin', 'dragListener', 'onDrag', 'onDragStart', 'onDragEnd',
    'onAnimationComplete', 'onAnimationStart', 'onPan', 'onPanStart', 'onPanEnd',
    'onTap', 'onTapStart', 'onTapCancel', 'onHoverStart', 'onHoverEnd',
    'transformTemplate', 'custom', 'inherit', 'style'
  ];
  
  const safeProps: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(props)) {
    if (!motionPropKeys.includes(key)) {
      safeProps[key] = value;
    }
  }
  
  // Preserve className and style if they exist and are safe
  if (typeof props.className === 'string') {
    safeProps.className = props.className;
  }
  if (props.style && typeof props.style === 'object') {
    safeProps.style = props.style;
  }
  
  return safeProps;
}

// Safe motion div that falls back to static div on error
type SafeMotionDivProps = HTMLMotionProps<'div'>;

export const SafeMotionDiv = memo(forwardRef<HTMLDivElement, SafeMotionDivProps>(
  (props, ref) => {
    const safeProps = extractSafeHtmlProps(props as Record<string, unknown>);
    
    return (
      <MotionErrorBoundary fallback={<div ref={ref} {...safeProps as HTMLAttributes<HTMLDivElement>} />}>
        <motion.div ref={ref} {...props} />
      </MotionErrorBoundary>
    );
  }
));

SafeMotionDiv.displayName = 'SafeMotionDiv';

// Safe motion span
type SafeMotionSpanProps = HTMLMotionProps<'span'>;

export const SafeMotionSpan = memo(forwardRef<HTMLSpanElement, SafeMotionSpanProps>(
  (props, ref) => {
    const safeProps = extractSafeHtmlProps(props as Record<string, unknown>);
    
    return (
      <MotionErrorBoundary fallback={<span ref={ref} {...safeProps as HTMLAttributes<HTMLSpanElement>} />}>
        <motion.span ref={ref} {...props} />
      </MotionErrorBoundary>
    );
  }
));

SafeMotionSpan.displayName = 'SafeMotionSpan';

// Safe motion button
type SafeMotionButtonProps = HTMLMotionProps<'button'>;

export const SafeMotionButton = memo(forwardRef<HTMLButtonElement, SafeMotionButtonProps>(
  (props, ref) => {
    const safeProps = extractSafeHtmlProps(props as Record<string, unknown>);
    
    return (
      <MotionErrorBoundary fallback={<button ref={ref} {...safeProps as HTMLAttributes<HTMLButtonElement>} />}>
        <motion.button ref={ref} {...props} />
      </MotionErrorBoundary>
    );
  }
));

SafeMotionButton.displayName = 'SafeMotionButton';

interface FloatingStarProps {
  left: string;
  top: string;
  size: number;
  delay: number;
  duration: number;
}

export const FloatingStar = memo(({ left, top, size, delay, duration }: FloatingStarProps) => (
  <div
    className="absolute rounded-full bg-white animate-star-pulse"
    style={{
      left,
      top,
      width: size,
      height: size,
      animationDelay: `${delay}s`,
      animationDuration: `${duration}s`,
    }}
  />
));

FloatingStar.displayName = 'FloatingStar';

// CSS-based accent star
export const AccentStar = memo(({ left, top, size, delay }: { left: string; top: string; size: number; delay: number }) => (
  <div
    className="absolute rounded-full bg-gradient-to-r from-primary/40 via-secondary/30 to-accent/20 animate-star-glow blur-sm"
    style={{
      left,
      top,
      width: size,
      height: size,
      animationDelay: `${delay}s`,
    }}
  />
));

AccentStar.displayName = 'AccentStar';

// Animated section wrapper with CSS transitions
interface AnimatedSectionProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export const AnimatedSection = memo(forwardRef<HTMLDivElement, AnimatedSectionProps>(
  ({ children, delay = 0, direction = 'up', className, style, ...props }, ref) => {
    const directionClass = {
      up: 'animate-fade-in-up',
      down: 'animate-fade-in-down',
      left: 'animate-fade-in-left',
      right: 'animate-fade-in-right',
    }[direction];
    
    return (
      <div
        ref={ref}
        className={cn('opacity-0', directionClass, className)}
        style={{ animationDelay: `${delay}s`, animationFillMode: 'forwards', ...style }}
        {...props}
      >
        {children}
      </div>
    );
  }
));

AnimatedSection.displayName = 'AnimatedSection';

export default {
  div: SafeMotionDiv,
  span: SafeMotionSpan,
  button: SafeMotionButton,
};
