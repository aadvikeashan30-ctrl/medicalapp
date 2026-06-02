import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiHome, FiArrowLeft, FiSearch, FiHeart } from 'react-icons/fi';

export default function NotFound() {
  const navigate = useNavigate();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [count, setCount] = useState(10);

  // Auto-redirect countdown
  useEffect(() => {
    if (count <= 0) {
      navigate('/');
      return;
    }
    const timer = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [count, navigate]);

  // Parallax mouse effect
  useEffect(() => {
    const handleMouse = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      });
    };
    window.addEventListener('mousemove', handleMouse);
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-dots opacity-40" />
      <div className="absolute inset-0 bg-mesh-light" />

      {/* Floating orbs */}
      <div className="orb orb-indigo w-72 h-72 -top-20 -right-20 animate-orb opacity-40" />
      <div className="orb orb-purple w-56 h-56 -bottom-16 -left-16 animate-orb opacity-30" style={{ animationDelay: '-4s' }} />
      <div className="orb orb-cyan w-40 h-40 top-1/3 left-1/4 animate-orb opacity-20" style={{ animationDelay: '-8s' }} />

      {/* Main content */}
      <div className="relative z-10 text-center max-w-lg">
        {/* Animated 404 number */}
        <div
          className="mb-8 animate-bounce-in"
          style={{ transform: `translate(${mousePos.x * 0.3}px, ${mousePos.y * 0.3}px)` }}
        >
          <h1 className="text-[160px] md:text-[200px] font-black leading-none tracking-tighter select-none">
            <span className="gradient-text">4</span>
            <span className="relative inline-block">
              {/* Animated heart in the 0 */}
              <span className="gradient-text">0</span>
              <FiHeart
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl md:text-5xl text-rose-400 animate-float"
                style={{ animationDelay: '-2s' }}
              />
            </span>
            <span className="gradient-text">4</span>
          </h1>
        </div>

        {/* Message */}
        <div className="animate-slide-up-fade" style={{ animationDelay: '200ms' }}>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Page not found
          </h2>
          <p className="text-gray-500 text-base mb-8 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved.
            Don't worry — let's get you back on track.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-slide-up-fade" style={{ animationDelay: '400ms' }}>
          <Link to="/" className="btn-primary !px-8 !py-3">
            <FiHome className="text-base" />
            Go to Dashboard
          </Link>
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary !px-8 !py-3"
          >
            <FiArrowLeft className="text-base" />
            Go Back
          </button>
        </div>

        {/* Auto-redirect */}
        <p className="mt-8 text-sm text-gray-400 animate-slide-up-fade" style={{ animationDelay: '600ms' }}>
          Redirecting to dashboard in{' '}
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 font-bold text-xs border border-indigo-100">
            {count}
          </span>
          {' '}seconds
        </p>

        {/* Helpful links */}
        <div className="mt-10 pt-8 border-t border-gray-200 animate-slide-up-fade" style={{ animationDelay: '800ms' }}>
          <p className="text-sm text-gray-500 mb-4">Looking for something specific?</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/patients" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium hover:underline flex items-center gap-1">
              <FiSearch className="text-xs" /> Patients
            </Link>
            <span className="text-gray-300">·</span>
            <Link to="/appointments" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium hover:underline flex items-center gap-1">
              Appointments
            </Link>
            <span className="text-gray-300">·</span>
            <Link to="/billing" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium hover:underline flex items-center gap-1">
              Billing
            </Link>
            <span className="text-gray-300">·</span>
            <Link to="/prescriptions" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium hover:underline flex items-center gap-1">
              Prescriptions
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
