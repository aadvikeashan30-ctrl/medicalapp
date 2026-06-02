import React from 'react';

/**
 * Animated 3D floating orb background element.
 * Used for decorative purposes on dashboard and cards.
 */
export default function FloatingOrb({ 
  size = 200, 
  color = 'blue', 
  top, 
  left, 
  right, 
  bottom, 
  delay = 0,
  opacity = 0.15 
}) {
  const colors = {
    blue: 'from-blue-400 to-indigo-600',
    purple: 'from-purple-400 to-pink-600',
    emerald: 'from-emerald-400 to-teal-600',
    orange: 'from-orange-400 to-red-500',
    cyan: 'from-cyan-400 to-blue-500'
  };

  return (
    <div
      className={`absolute rounded-full bg-gradient-to-br ${colors[color] || colors.blue} blur-3xl pointer-events-none floating-orb`}
      style={{
        width: size,
        height: size,
        top,
        left,
        right,
        bottom,
        opacity,
        animationDelay: `${delay}s`
      }}
    />
  );
}
