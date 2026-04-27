"use client";

import { useEffect, useRef, useState } from "react";

export type AnimatedMetricFormat = "currency" | "percentage" | "number" | "months";

export interface AnimatedMetricProps {
  value: number;
  format?: AnimatedMetricFormat;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  ariaLabel?: string;
}

/**
 * Smoothly animates a numeric value using requestAnimationFrame. Holds the
 * previous value in a ref so consecutive prop changes interpolate from the
 * last visible number rather than restarting from zero.
 */
export function AnimatedMetric({
  value,
  format = "number",
  duration = 1000,
  className = "",
  prefix = "",
  suffix = "",
  ariaLabel,
}: AnimatedMetricProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValueRef = useRef(0);

  useEffect(() => {
    const startValue = prevValueRef.current;
    if (startValue === value) return;

    const difference = value - startValue;
    const startTime = performance.now();
    let rafId = 0;
    let cancelled = false;

    const step = (now: number) => {
      if (cancelled) return;
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      const next = startValue + difference * eased;

      setDisplayValue(next);

      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
        prevValueRef.current = value;
      }
    };

    rafId = requestAnimationFrame(step);
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [value, duration]);

  const formatted = formatValue(displayValue, format);

  return (
    <span aria-label={ariaLabel ?? `${prefix}${formatted}${suffix}`} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

function formatValue(value: number, format: AnimatedMetricFormat): string {
  switch (format) {
    case "currency":
      return `$${Math.round(value).toLocaleString()}`;
    case "percentage":
      return `${Math.round(value)}%`;
    case "months": {
      const rounded = Math.round(value);
      return `${rounded} ${rounded === 1 ? "month" : "months"}`;
    }
    default:
      return Math.round(value).toLocaleString();
  }
}
