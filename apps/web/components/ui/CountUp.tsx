"use client";

import { useEffect, useRef, useState } from "react";

export interface CountUpProps {
  to: number;
  from?: number;
  duration?: number; // duration in seconds
  delay?: number; // delay in seconds
  className?: string;
  decimals?: number;
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export default function CountUp({
  to,
  from,
  duration = 1,
  delay = 0,
  className = "",
  decimals = 0,
}: CountUpProps) {
  const [displayValue, setDisplayValue] = useState<number>(from ?? 0);
  const prevToRef = useRef<number>(from ?? 0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (duration <= 0) {
      frameRef.current = requestAnimationFrame(() => {
        setDisplayValue(to);
        prevToRef.current = to;
      });
      return () => {
        if (frameRef.current !== null) {
          cancelAnimationFrame(frameRef.current);
        }
      };
    }

    // Check prefers-reduced-motion
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
    ) {
      frameRef.current = requestAnimationFrame(() => {
        setDisplayValue(to);
        prevToRef.current = to;
      });
      return () => {
        if (frameRef.current !== null) {
          cancelAnimationFrame(frameRef.current);
        }
      };
    }

    const startVal = prevToRef.current;
    const endVal = to;
    const startTime = performance.now() + delay * 1000;
    const durationMs = duration * 1000;

    function tick(now: number) {
      if (now < startTime) {
        frameRef.current = requestAnimationFrame(tick);
        return;
      }

      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const easedProgress = easeOutExpo(progress);

      const current = startVal + (endVal - startVal) * easedProgress;
      setDisplayValue(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setDisplayValue(endVal);
        prevToRef.current = endVal;
      }
    }

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
      prevToRef.current = endVal;
    };
  }, [to, delay, duration]);

  const formatted =
    decimals > 0
      ? displayValue.toLocaleString("pt-BR", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : Math.round(displayValue).toLocaleString("pt-BR");

  return <span className={className}>{formatted}</span>;
}
