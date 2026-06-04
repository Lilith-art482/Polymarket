'use client';

import { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  value: string;
  duration?: number;
}

export function AnimatedCounter({ value, duration = 2000 }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    // Извлекаем числовую часть для анимации
    const match = value.match(/^([^0-9]*)(\d+)(.*)$/);
    
    if (!match) {
      // Нет числа для анимации — показываем как есть
      setDisplayValue(value);
      return;
    }

    const prefix = match[1];
    const numericValue = parseInt(match[2]);
    const suffix = match[3];
    const steps = 60;
    const stepDuration = duration / steps;
    let current = 0;

    setDisplayValue(`${prefix}0${suffix}`);

    const timer = setInterval(() => {
      current++;
      const progress = current / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(numericValue * eased);
      setDisplayValue(`${prefix}${currentValue}${suffix}`);

      if (current >= steps) {
        setDisplayValue(`${prefix}${numericValue}${suffix}`);
        clearInterval(timer);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [isVisible, value, duration]);

  return <div ref={ref}>{displayValue}</div>;
}
