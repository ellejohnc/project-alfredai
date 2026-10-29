import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "celebration-sound-enabled";

export function useSoundPreference() {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === "true";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(soundEnabled));
  }, [soundEnabled]);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, []);

  const playCelebrationSound = useCallback(() => {
    if (!soundEnabled) return;

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Meditation/healing frequency scale based on 432Hz tuning
      // 432Hz (A4) - "Verdi tuning", known for calming/healing properties
      // 528Hz - "Love frequency", associated with transformation and DNA repair
      // 396Hz - Liberation from fear
      // 639Hz - Connection and relationships
      const notes = [432, 528, 639, 528]; // Ascending meditation sequence
      
      notes.forEach((freq, i) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Use sine wave for pure, meditative tone
        oscillator.type = "sine";
        oscillator.frequency.value = freq;
        
        const startTime = audioContext.currentTime + i * 0.25;
        const duration = 0.6;
        
        // Gentle fade in/out for soothing sound
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.08);
        gainNode.gain.setValueAtTime(0.15, startTime + duration * 0.6);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      });
    } catch (e) {
      console.log("Audio not supported");
    }
  }, [soundEnabled]);

  return { soundEnabled, toggleSound, playCelebrationSound };
}
