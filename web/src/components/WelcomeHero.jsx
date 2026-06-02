import React from 'react';
import { FiCalendar, FiTrendingUp, FiUsers, FiZap } from 'react-icons/fi';

export default function WelcomeHero({ greeting, doctorName, stats }) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-6 lg:p-8 animate-fade-up shadow-3d" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed, #4f46e5)' }}>
      {/* Decorative orbs */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div>
          <p className="text-indigo-200 text-sm font-medium flex items-center gap-1.5">
            <FiZap className="text-xs" /> {greeting}
          </p>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mt-1">
            Dr. {doctorName}
          </h1>
          <p className="text-indigo-200 mt-1 text-sm">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Stat pills */}
        <div className="flex flex-wrap gap-2.5">
          <div className="glass-pill">
            <FiCalendar className="text-cyan-300 text-xs" />
            <span className="text-sm text-white">{stats?.todayAppointments || 0} today</span>
          </div>
          <div className="glass-pill">
            <FiUsers className="text-purple-300 text-xs" />
            <span className="text-sm text-white">{stats?.totalPatients || 0} patients</span>
          </div>
          <div className="glass-pill">
            <FiTrendingUp className="text-emerald-300 text-xs" />
            <span className="text-sm text-white">₹{((stats?.monthRevenue || 0) / 1000).toFixed(0)}K revenue</span>
          </div>
        </div>
      </div>
    </div>
  );
}
