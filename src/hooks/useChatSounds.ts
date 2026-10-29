import { useCallback, useRef } from "react";

// Pleasant, professional sound frequencies
const SOUNDS = {
  open: {
    frequencies: [523.25, 659.25, 783.99], // C5, E5, G5 - major chord arpeggio
    durations: [0.08, 0.08, 0.12],
    delays: [0, 0.06, 0.12],
    gain: 0.12,
  },
  close: {
    frequencies: [783.99, 659.25, 523.25], // G5, E5, C5 - descending
    durations: [0.06, 0.06, 0.1],
    delays: [0, 0.04, 0.08],
    gain: 0.08,
  },
  message: {
    frequencies: [880, 1046.5], // A5, C6 - gentle notification
    durations: [0.05, 0.08],
    delays: [0, 0.04],
    gain: 0.1,
  },
  send: {
    frequencies: [392, 523.25], // G4, C5 - whoosh up
    durations: [0.04, 0.06],
    delays: [0, 0.03],
    gain: 0.08,
  },
};

type SoundType = keyof typeof SOUNDS;

export function useChatSounds() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const enabledRef = useRef(true);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playSound = useCallback((type: SoundType) => {
    if (!enabledRef.current) return;

    try {
      const ctx = getAudioContext();
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const sound = SOUNDS[type];
      const now = ctx.currentTime;

      sound.frequencies.forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(freq, now + sound.delays[i]);

        // Smooth envelope
        gainNode.gain.setValueAtTime(0, now + sound.delays[i]);
        gainNode.gain.linearRampToValueAtTime(sound.gain, now + sound.delays[i] + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + sound.delays[i] + sound.durations[i]);

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.start(now + sound.delays[i]);
        oscillator.stop(now + sound.delays[i] + sound.durations[i] + 0.05);
      });
    } catch (e) {
      // Silently fail if audio not supported
      console.debug("Audio not supported:", e);
    }
  }, [getAudioContext]);

  const setEnabled = useCallback((enabled: boolean) => {
    enabledRef.current = enabled;
  }, []);

  return {
    playOpen: useCallback(() => playSound("open"), [playSound]),
    playClose: useCallback(() => playSound("close"), [playSound]),
    playMessage: useCallback(() => playSound("message"), [playSound]),
    playSend: useCallback(() => playSound("send"), [playSound]),
    setEnabled,
  };
}
