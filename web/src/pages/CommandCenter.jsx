import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch, FiGrid, FiUsers, FiCalendar, FiClock, FiFileText, FiActivity,
  FiDollarSign, FiShield, FiVideo, FiMessageCircle, FiSmartphone, FiCpu,
  FiTrendingUp, FiHeart, FiAward, FiGift, FiSend, FiPackage, FiMapPin,
  FiBarChart2, FiBell, FiUserPlus, FiWatch, FiAlertOctagon, FiEdit3,
  FiStar, FiGlobe, FiShare2, FiInbox, FiZap, FiRefreshCw, FiDatabase, FiArrowRight
} from 'react-icons/fi';

// All 40 modules of the ecosystem. `to` = route if live, else status 'soon'.
const MODULES = [
  { n: 'Patient Management', d: 'Complete patient records & history', to: '/patients', icon: FiUsers, cat: 'Patients', g: 'from-blue-500 to-indigo-600' },
  { n: 'Appointment Scheduling', d: 'Book, reschedule & confirm visits', to: '/appointments', icon: FiCalendar, cat: 'Scheduling', g: 'from-violet-500 to-purple-600' },
  { n: 'Queue Management', d: 'Live OPD token & waiting queue', to: '/opd-queue', icon: FiClock, cat: 'Scheduling', g: 'from-amber-500 to-orange-600' },
  { n: 'Digital Prescription', d: 'e-Prescriptions with PDF & sharing', to: '/prescriptions', icon: FiFileText, cat: 'Clinical', g: 'from-teal-500 to-emerald-600' },
  { n: 'EMR / EHR', d: 'Electronic medical records & templates', to: '/health-records', icon: FiDatabase, cat: 'Patients', g: 'from-sky-500 to-blue-600' },
  { n: 'Billing & Invoicing', d: 'Invoices, payments & receipts', to: '/billing', icon: FiDollarSign, cat: 'Revenue', g: 'from-emerald-500 to-green-600' },
  { n: 'Insurance Claims', d: 'Pre-verify coverage & split bills', to: '/insurance', icon: FiShield, cat: 'Revenue', g: 'from-cyan-500 to-blue-600' },
  { n: 'Video Consultation', d: 'Run video visits with failover', to: '/teleconsult', icon: FiVideo, cat: 'Telehealth', g: 'from-blue-500 to-violet-600' },
  { n: 'WhatsApp Automation', d: 'Automated patient messaging', to: '/campaigns', icon: FiMessageCircle, cat: 'Engagement', g: 'from-green-500 to-emerald-600' },
  { n: 'SMS Automation', d: 'Reminders & alerts over SMS', to: '/campaigns', icon: FiSend, cat: 'Engagement', g: 'from-indigo-500 to-blue-600' },
  { n: 'AI Prescription Assistant', d: 'Ambient scribe → SOAP + Rx', to: '/ai-scribe', icon: FiCpu, cat: 'AI', g: 'from-teal-500 to-cyan-600' },
  { n: 'AI Symptom Checker', d: 'Patient self-triage assistant', to: '/symptom-checker', icon: FiActivity, cat: 'AI', g: 'from-rose-500 to-pink-600' },
  { n: 'AI Follow-up Prediction', d: 'Smart follow-up scheduling', to: '/follow-ups', icon: FiBell, cat: 'AI', g: 'from-purple-500 to-violet-600' },
  { n: 'Patient Reactivation', d: 'Win back lapsed patients', to: '/reactivation', icon: FiRefreshCw, cat: 'Growth', g: 'from-orange-500 to-red-500' },
  { n: 'Google Review Automation', d: 'Auto-request 5-star reviews', to: null, icon: FiStar, cat: 'Growth', g: 'from-yellow-500 to-amber-600' },
  { n: 'Doctor Website Generator', d: 'Instant personal clinic site', to: null, icon: FiGlobe, cat: 'Growth', g: 'from-fuchsia-500 to-purple-600' },
  { n: 'Online Booking Portal', d: 'Public self-booking page', to: '/find-doctor', icon: FiCalendar, cat: 'Growth', g: 'from-blue-500 to-cyan-600' },
  { n: 'Patient Mobile App', d: 'Companion app for patients', to: null, icon: FiSmartphone, cat: 'Engagement', g: 'from-slate-500 to-gray-700' },
  { n: 'Lab Integration', d: 'Order & track lab tests', to: '/lab-tests', icon: FiActivity, cat: 'Operations', g: 'from-indigo-500 to-blue-600' },
  { n: 'Pharmacy Integration', d: 'In-house dispensing & stock', to: '/medicines', icon: FiPackage, cat: 'Operations', g: 'from-violet-500 to-purple-600' },
  { n: 'Membership Plans', d: 'Recurring care memberships', to: '/memberships', icon: FiAward, cat: 'Revenue', g: 'from-amber-500 to-yellow-600' },
  { n: 'Health Packages', d: 'Bundled preventive checkups', to: '/health-packages', icon: FiPackage, cat: 'Revenue', g: 'from-emerald-500 to-teal-600' },
  { n: 'Referral Program', d: 'Reward patient referrals', to: '/referrals', icon: FiGift, cat: 'Growth', g: 'from-pink-500 to-rose-600' },
  { n: 'Inventory Management', d: 'Stock levels & reorder alerts', to: '/medicines', icon: FiPackage, cat: 'Operations', g: 'from-cyan-500 to-teal-600' },
  { n: 'Staff Attendance', d: 'Check-in/out & roster', to: '/attendance', icon: FiUserPlus, cat: 'Operations', g: 'from-blue-500 to-indigo-600' },
  { n: 'Payroll', d: 'Salary slips & payouts', to: '/payroll', icon: FiDollarSign, cat: 'Operations', g: 'from-green-500 to-emerald-600' },
  { n: 'Multi-Branch Management', d: 'Manage branches & teams', to: '/branches', icon: FiMapPin, cat: 'Operations', g: 'from-orange-500 to-amber-600' },
  { n: 'Analytics Dashboard', d: 'Practice insights & trends', to: '/practice-analytics', icon: FiTrendingUp, cat: 'Insights', g: 'from-indigo-500 to-blue-600' },
  { n: 'Revenue Dashboard', d: 'Routing & leakage prevention', to: '/revenue-routing', icon: FiDollarSign, cat: 'Insights', g: 'from-emerald-500 to-green-600' },
  { n: 'Marketing Campaigns', d: 'Automated outreach campaigns', to: '/campaigns', icon: FiSend, cat: 'Growth', g: 'from-violet-500 to-fuchsia-600' },
  { n: 'Medicine Reminders', d: 'Dose adherence nudges', to: '/medicine-reminders', icon: FiClock, cat: 'Engagement', g: 'from-teal-500 to-cyan-600' },
  { n: 'Vaccination Tracking', d: 'Immunization schedules', to: '/vaccinations', icon: FiShield, cat: 'Patients', g: 'from-blue-500 to-sky-600' },
  { n: 'Family Accounts', d: 'Manage dependents in one place', to: '/family-accounts', icon: FiUsers, cat: 'Patients', g: 'from-purple-500 to-indigo-600' },
  { n: 'Wearable Integration', d: 'Sync vitals with alerts', to: '/wearables', icon: FiWatch, cat: 'Telehealth', g: 'from-teal-500 to-emerald-600' },
  { n: 'Health Timeline', d: 'Chronological care history', to: '/health-records', icon: FiActivity, cat: 'Patients', g: 'from-rose-500 to-pink-600' },
  { n: 'Emergency SOS', d: 'Triage urgent patient alerts', to: '/emergency-sos', icon: FiAlertOctagon, cat: 'Telehealth', g: 'from-red-500 to-rose-600' },
  { n: 'Telemedicine', d: 'End-to-end remote care', to: '/teleconsult', icon: FiVideo, cat: 'Telehealth', g: 'from-blue-500 to-violet-600' },
  { n: 'E-Signature', d: 'Sign prescriptions & docs', to: '/e-signature', icon: FiEdit3, cat: 'Clinical', g: 'from-slate-500 to-gray-700' },
  { n: 'Digital Certificates', d: 'Sick-leave & fitness certs', to: '/certificates', icon: FiAward, cat: 'Clinical', g: 'from-violet-500 to-purple-600' },
  { n: 'Enterprise Reporting', d: 'Org-wide exports & reports', to: '/reports', icon: FiBarChart2, cat: 'Insights', g: 'from-indigo-500 to-violet-600' }
];

const CATEGORIES = ['All', 'Patients', 'Scheduling', 'Clinical', 'AI', 'Telehealth', 'Revenue', 'Growth', 'Operations', 'Insights', 'Engagement'];


export default function CommandCenter() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('All');

  const filtered = useMemo(() => MODULES.filter((m) => {
    const matchCat = cat === 'All' || m.cat === cat;
    const matchSearch = !search || m.n.toLowerCase().includes(search.toLowerCase()) || m.d.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  }), [search, cat]);

  const liveCount = MODULES.filter((m) => m.to).length;

  return (
    <div className="page-enter space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-700 text-white shadow-xl animate-fade-up">
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -right-20 bottom-0 w-64 h-64 rounded-full bg-fuchsia-400/20 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <FiGrid className="text-2xl" />
            <span className="text-xs font-semibold uppercase tracking-widest text-white/70">Command Center</span>
          </div>
          <h1 className="text-3xl font-bold mb-1">AI Healthcare Ecosystem</h1>
          <p className="text-white/80 max-w-xl">Your complete platform for clinics, doctors, hospitals & patients — {MODULES.length} modules to grow revenue, cut workload, and retain patients.</p>
          <div className="flex flex-wrap gap-6 mt-5">
            <div><p className="text-2xl font-bold">{MODULES.length}</p><p className="text-xs text-white/70">Modules</p></div>
            <div><p className="text-2xl font-bold">{liveCount}</p><p className="text-xs text-white/70">Live now</p></div>
            <div><p className="text-2xl font-bold">{CATEGORIES.length - 1}</p><p className="text-xs text-white/70">Categories</p></div>
          </div>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col gap-3 sticky top-0 z-10">
        <div className="relative">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search modules..." className="input-field !pl-10" />
        </div>
        <div className="flex gap-2 overflow-x-auto custom-scroll pb-1">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${cat === c ? 'bg-indigo-600 text-white shadow' : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300'}`}>{c}</button>
          ))}
        </div>
      </div>

      {/* Module grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((m, idx) => {
          const Icon = m.icon;
          const live = !!m.to;
          return (
            <button
              key={m.n}
              onClick={() => live && navigate(m.to)}
              disabled={!live}
              className={`group text-left relative overflow-hidden rounded-2xl p-4 border transition-all duration-300 animate-slide-in ${live ? 'bg-white border-gray-100 hover:shadow-xl hover:-translate-y-1 cursor-pointer' : 'bg-gray-50 border-gray-100 cursor-default'}`}
              style={{ animationDelay: `${idx * 20}ms` }}
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${m.g} flex items-center justify-center shadow-lg mb-3 ${!live && 'opacity-50 grayscale'}`}>
                <Icon className="text-white text-lg" />
              </div>
              <h3 className="font-semibold text-gray-900 text-sm leading-tight">{m.n}</h3>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{m.d}</p>
              <div className="flex items-center justify-between mt-3">
                {live ? (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">SOON</span>
                )}
                {live && <FiArrowRight className="text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />}
              </div>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <FiGrid className="text-4xl mx-auto mb-3" />
          <p className="text-sm">No modules match your search.</p>
        </div>
      )}
    </div>
  );
}
