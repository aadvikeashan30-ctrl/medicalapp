import React from 'react';

/**
 * An animated 3D DNA helix component rendered with CSS.
 * Decorative element for the medical app dashboard/hero section.
 */
export default function MedicalDNA({ className = '' }) {
  const rungs = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className={`dna-helix-container ${className}`}>
      <div className="dna-helix">
        {rungs.map((i) => (
          <div
            key={i}
            className="dna-rung"
            style={{ animationDelay: `${i * 0.15}s` }}
          >
            <div className="dna-dot dna-dot-left" />
            <div className="dna-connector" />
            <div className="dna-dot dna-dot-right" />
          </div>
        ))}
      </div>
    </div>
  );
}
