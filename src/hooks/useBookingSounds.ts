import { useCallback, useRef, useEffect } from 'react';

// Addictive frequencies based on harmonic ratios and binaural patterns
// 528Hz - Love/DNA repair frequency
// 432Hz - Natural harmony frequency  
// 396Hz - Liberation frequency
// These create pleasant, rewarding audio feedback

const FREQUENCIES = {
  click: 880,       // A5 - crisp click
  success: 528,     // C5 - satisfying success (love frequency)
  complete: 432,    // A4 - warm completion (natural harmony)
  celebration: [523.25, 659.25, 783.99], // C5-E5-G5 major chord
  hover: 1320,      // High E for subtle hover
};

const STORAGE_KEY = 'alfred-booking-sound-enabled';

// Haptic feedback patterns (in ms)
const HAPTIC_PATTERNS = {
  click: [10],
  success: [15, 30, 15],
  stepComplete: [20, 40, 20, 40, 30],
  celebration: [30, 50, 30, 50, 30, 100, 50],
};

export const useBookingSounds = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const isEnabledRef = useRef(true);

  // Load preference from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      isEnabledRef.current = stored === 'true';
    }
  }, []);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Trigger haptic feedback if supported
  const triggerHaptic = useCallback((pattern: number[]) => {
    if (!isEnabledRef.current) return;
    
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch (e) {
      // Haptic not supported or blocked
    }
  }, []);

  // Play a single tone
  const playTone = useCallback((frequency: number, duration: number = 0.1, volume: number = 0.15, type: OscillatorType = 'sine') => {
    if (!isEnabledRef.current) return;
    
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      
      // Smooth envelope for pleasant sound
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio playback failed:', e);
    }
  }, [getAudioContext]);

  // Click sound - short, crisp
  const playClick = useCallback(() => {
    playTone(FREQUENCIES.click, 0.05, 0.08, 'sine');
    triggerHaptic(HAPTIC_PATTERNS.click);
  }, [playTone, triggerHaptic]);

  // Success sound - satisfying ascending tone
  const playSuccess = useCallback(() => {
    if (!isEnabledRef.current) return;
    
    triggerHaptic(HAPTIC_PATTERNS.success);
    
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      
      // Rising two-note pattern
      [FREQUENCIES.success, FREQUENCIES.success * 1.25].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        
        gain.gain.setValueAtTime(0, now + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.12, now + i * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.15);
        
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.2);
      });
    } catch (e) {
      console.warn('Audio playback failed:', e);
    }
  }, [getAudioContext, triggerHaptic]);

  // Step complete sound - warm, rewarding
  const playStepComplete = useCallback(() => {
    if (!isEnabledRef.current) return;
    
    triggerHaptic(HAPTIC_PATTERNS.stepComplete);
    
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      
      // Three ascending notes
      const notes = [FREQUENCIES.complete, FREQUENCIES.complete * 1.25, FREQUENCIES.complete * 1.5];
      
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        
        gain.gain.setValueAtTime(0, now + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.1, now + i * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.2);
        
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.25);
      });
    } catch (e) {
      console.warn('Audio playback failed:', e);
    }
  }, [getAudioContext, triggerHaptic]);

  // Celebration sound - major chord arpeggio
  const playCelebration = useCallback(() => {
    if (!isEnabledRef.current) return;
    
    triggerHaptic(HAPTIC_PATTERNS.celebration);
    
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      
      // Play major chord as arpeggio then together
      const chord = FREQUENCIES.celebration;
      
      // Arpeggio up
      chord.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        
        gain.gain.setValueAtTime(0, now + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.12, now + i * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.4);
        
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.5);
      });
      
      // Chord together at the end
      setTimeout(() => {
        chord.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          
          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
          
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.7);
        });
      }, 300);
    } catch (e) {
      console.warn('Audio playback failed:', e);
    }
  }, [getAudioContext, triggerHaptic]);

  // Toggle sounds on/off and persist to localStorage
  const toggleSounds = useCallback((enabled: boolean) => {
    isEnabledRef.current = enabled;
    localStorage.setItem(STORAGE_KEY, String(enabled));
  }, []);
  
  // Get initial sound preference
  const getInitialSoundEnabled = useCallback(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === 'true';
  }, []);

  return {
    playClick,
    playSuccess,
    playStepComplete,
    playCelebration,
    toggleSounds,
    getInitialSoundEnabled,
  };
};

export default useBookingSounds;
