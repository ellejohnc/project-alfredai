/**
 * In-view detection, with and without framer-motion.
 *
 * Hooks alongside components stop a file hot-reloading, and these are used
 * well beyond safe-motion.
 */

import { Component, ReactNode, forwardRef, HTMLAttributes, memo, useState, useEffect, RefObject } from 'react';

// Safe useInView hook - uses native Intersection Observer as primary implementation
// This avoids framer-motion hook conflicts that cause "Cannot read properties of null (reading 'useRef')"
export function useSafeInView(
  ref: RefObject<Element>, 
  options?: { once?: boolean; margin?: string; threshold?: number }
): boolean {
  const [inView, setInView] = useState(false);
  
  useEffect(() => {
    // If ref is not available yet, don't observe
    if (!ref.current) {
      return;
    }
    
    const element = ref.current;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (options?.once) {
            observer.disconnect();
          }
        } else if (!options?.once) {
          setInView(false);
        }
      },
      { 
        rootMargin: options?.margin || '0px',
        threshold: options?.threshold || 0 
      }
    );
    
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, options?.once, options?.margin, options?.threshold]);
  
  return inView;
}

// Native Intersection Observer hook (no framer-motion dependency)

// Native Intersection Observer hook (no framer-motion dependency)
export function useNativeInView(
  ref: RefObject<Element>, 
  options?: { once?: boolean; margin?: string; threshold?: number }
): boolean {
  const [inView, setInView] = useState(false);
  
  useEffect(() => {
    if (!ref.current) {
      return;
    }
    
    const element = ref.current;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (options?.once) {
            observer.disconnect();
          }
        } else if (!options?.once) {
          setInView(false);
        }
      },
      { 
        rootMargin: options?.margin || '0px',
        threshold: options?.threshold || 0 
      }
    );
    
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, options?.once, options?.margin, options?.threshold]);
  
  return inView;
}

// CSS-based animated star component (no framer-motion)
