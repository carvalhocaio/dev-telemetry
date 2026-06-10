"use client";

import { useEffect, useState } from "react";

function getPrefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Reveals `text` progressively, one character at a time. When the user prefers
 * reduced motion, the full text is returned immediately with no animation.
 *
 * @param text  The full string to reveal.
 * @param speed Milliseconds between characters (default 18ms).
 */
export function useTypewriter(text: string, speed = 18): string {
  // Resolved once on mount; SSR renders the fallback (false) on the server.
  const [reducedMotion] = useState(getPrefersReducedMotion);
  const [count, setCount] = useState(0);
  // "Adjust state during render" pattern: when the text changes, reset the
  // reveal to zero without a synchronous setState inside an effect.
  const [renderedText, setRenderedText] = useState(text);
  if (text !== renderedText) {
    setRenderedText(text);
    setCount(0);
  }

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    let revealed = 0;
    const interval = window.setInterval(() => {
      revealed += 1;
      setCount(revealed);
      if (revealed >= text.length) {
        window.clearInterval(interval);
      }
    }, speed);

    return () => window.clearInterval(interval);
  }, [text, speed, reducedMotion]);

  if (reducedMotion) {
    return text;
  }
  return text.slice(0, count);
}
