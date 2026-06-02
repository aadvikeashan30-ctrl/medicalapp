import React, { useEffect, useState, useRef } from 'react';

export default function AnimatedCounter({ end, duration = 2000, prefix = '', suffix = '', decimals = 0 }) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const numEnd = typeof end === 'string' ? parseFloat(end.replace(/[^0-9.]/g, '')) : end;
    if (isNaN(numEnd)) return;

    let startTime;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(eased * numEnd);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isVisible, end, duration]);

  const formatted = decimals > 0 ? count.toFixed(decimals) : Math.round(count);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}{typeof end === 'string' && end.includes(',')
        ? Number(formatted).toLocaleString('en-IN')
        : formatted}{suffix}
    </span>
  );
}
