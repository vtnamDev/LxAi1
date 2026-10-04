import { useState, useEffect } from 'react';
import { PerformanceTier } from '../types';

export function useAdaptivePerformance(manualTier?: PerformanceTier): {
  tier: PerformanceTier;
  fps: number;
  isLowEndDevice: boolean;
  setTier: (tier: PerformanceTier) => void;
} {
  const [tier, setTierState] = useState<PerformanceTier>(() => {
    try {
      const saved = localStorage.getItem('lx_performance_tier');
      if (saved) return saved as PerformanceTier;
    } catch (e) {}
    return manualTier || 'balanced';
  });

  const [fps, setFps] = useState(60);
  const [isLowEndDevice, setIsLowEndDevice] = useState(false);

  // Hardware capabilities detection
  useEffect(() => {
    let lowEnd = false;

    // Check device memory
    const nav = navigator as any;
    if (nav.deviceMemory && nav.deviceMemory <= 4) {
      lowEnd = true;
    }

    // Check logical processor count
    if (nav.hardwareConcurrency && nav.hardwareConcurrency <= 4) {
      lowEnd = true;
    }

    // Check reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      lowEnd = true;
    }

    setIsLowEndDevice(lowEnd);

    // If user hasn't explicitly chosen a tier and device is low-end, default to lite
    const saved = localStorage.getItem('lx_performance_tier');
    if (!saved && lowEnd) {
      setTierState('lite');
    }
  }, []);

  // Frame-drop runtime monitoring
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const measure = (now: number) => {
      frameCount++;
      const delta = now - lastTime;

      if (delta >= 1000) {
        const currentFps = Math.round((frameCount * 1000) / delta);
        setFps(currentFps);

        // Auto-throttle if frame rate severely drops (< 25 FPS) and not already in minimal
        if (currentFps < 25 && tier === 'full') {
          console.warn('[Adaptive Glass] Frame rate drop detected, throttling to balanced tier');
          setTierState('balanced');
        } else if (currentFps < 18 && tier === 'balanced') {
          console.warn('[Adaptive Glass] Severe frame drop detected, throttling to lite tier');
          setTierState('lite');
        }

        frameCount = 0;
        lastTime = now;
      }

      animId = requestAnimationFrame(measure);
    };

    animId = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(animId);
  }, [tier]);

  const setTier = (newTier: PerformanceTier) => {
    setTierState(newTier);
    try {
      localStorage.setItem('lx_performance_tier', newTier);
    } catch (e) {}
  };

  return { tier, fps, isLowEndDevice, setTier };
}
