import React, { useRef, useCallback } from 'react';
import AnimatedCounter from './AnimatedCounter';

/* Shared premium 3D building blocks used across dashboards. */

/* Mouse-tracking tilt — sets --rx/--ry/--mx/--my CSS vars */
export function useTilt(max = 10) {
  const ref = useRef(null);
  const onMouseMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty('--ry', `${(px - 0.5) * max * 2}deg`);
    el.style.setProperty('--rx', `${(0.5 - py) * max * 2}deg`);
    el.style.setProperty('--mx', `${px * 100}%`);
    el.style.setProperty('--my', `${py * 100}%`);
  }, [max]);
  const onMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--ry', '0deg');
    el.style.setProperty('--rx', '0deg');
  }, []);
  return { ref, onMouseMove, onMouseLeave };
}

/* Gradient hero banner with floating orbs + grid */
export function Hero3D({ icon: Icon, title, subtitle, badge, children, gradient }) {
  return (
    <div
      className="hero-3d px-6 py-6 sm:px-7"
      style={gradient ? { background: gradient } : undefined}
    >
      <div className="hero-grid" />
      <span className="orb-3d orb-a" />
      <span className="orb-3d orb-b" />
      <span className="orb-3d orb-c" />
      <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4 text-white">
          {Icon && (
            <div className="w-14 h-14 rounded-2xl glass-chip flex items-center justify-center flex-shrink-0">
              <Icon size={26} className="text-white" />
            </div>
          )}
          <div>
            {badge && (
              <span className="inline-flex items-center gap-2 glass-chip px-3 py-1 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-300 live-dot" />
                <span className="text-[11px] font-medium text-white/90 tracking-wide">{badge}</span>
              </span>
            )}
            <h1 className="text-2xl sm:text-[26px] font-extrabold leading-tight">{title}</h1>
            {subtitle && <p className="text-sm text-white/70 mt-1">{subtitle}</p>}
          </div>
        </div>
        {children && <div className="relative flex items-center gap-2 flex-wrap">{children}</div>}
      </div>
    </div>
  );
}

/* 3D tilt stat card with accent theme + animated counter */
export function Stat3D({ icon: Icon, accent = 'accent-teal', label, value, prefix, suffix, badge, badgeCls, animate = true, delay = '0ms' }) {
  const tilt = useTilt(10);
  const numeric = typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value));
  return (
    <div {...tilt} className={`stat-3d tilt-3d ${accent} animate-pop`} style={{ animationDelay: delay }}>
      <div className="flex items-start justify-between mb-3 depth-2">
        <div className="stat-3d-icon">{Icon && <Icon size={22} />}</div>
        {badge != null && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${badgeCls || 'bg-gray-100 text-gray-600'}`}>{badge}</span>
        )}
      </div>
      <p className="text-[26px] font-extrabold text-gray-900 tabular-nums leading-none depth-1">
        {prefix && <span className="text-lg opacity-50">{prefix}</span>}
        {animate && numeric ? <AnimatedCounter end={Number(value || 0)} /> : value}
        {suffix && <span className="text-base font-medium text-gray-400 ml-1">{suffix}</span>}
      </p>
      <p className="text-sm text-gray-500 mt-1.5 depth-1">{label}</p>
    </div>
  );
}
