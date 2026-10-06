import { useCallback, useEffect, useRef } from 'react';

export function useSfx() {
  const contextRef = useRef(null);

  useEffect(() => () => {
    contextRef.current?.close();
    contextRef.current = null;
  }, []);

  const play = useCallback((correct) => {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      const context = contextRef.current ?? new AudioContextClass();
      contextRef.current = context;
      if (context.state === 'suspended') void context.resume();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const now = context.currentTime;
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(correct ? 660 : 330, now);
      oscillator.frequency.exponentialRampToValueAtTime(correct ? 880 : 220, now + 0.16);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.21);
    } catch {
      // The diagnostic remains usable when the browser blocks audio.
    }
  }, []);

  return {
    playCorrect: () => play(true),
    playWrong: () => play(false),
  };
}
