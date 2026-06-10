import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch, FiGrid, FiUsers, FiCalendar, FiClock, FiFileText, FiActivity,
  FiDollarSign, FiShield, FiVideo, FiMessageCircle, FiSmartphone, FiCpu,
  FiTrendingUp, FiAward, FiGift, FiSend, FiPackage, FiMapPin,
  FiBarChart2, FiBell, FiUserPlus, FiWatch, FiAlertOctagon, FiEdit3,
  FiStar, FiGlobe, FiRefreshCw, FiDatabase, FiArrowRight, FiZap, FiCornerDownLeft
} from 'react-icons/fi';
import { useApi } from '../hooks/useApi';
import AnimatedCounter from '../components/AnimatedCounter';
import { useTilt } from '../components/Premium3D';

/* hex shadow/soft helpers keyed by tailwind gradient "from-" color */
const GRAD_HEX = {
  blue: '#3b82f6', indigo: '#6366f1', violet: '#8b5cf6', purple: '#a855f7',
  teal: '#14b8a6', emerald: '#10b981', sky: '#0ea5e9', cyan: '#06b6d4',
  green: '#22c55e', amber: '#f59e0b', orange: '#f97316', yellow: '#eab308',
  rose: '#f43f5e', pink: '#ec4899', fuchsia: '#d946ef', red: '#ef4444', slate: '#64748b',
};
function gradHex(g) {
  const m = /from-(\w+)-\d+/.exec(g || '');
  const a = (m && GRAD_HEX[m[1]]) || '#6366f1';
  const t = /to-(\w+)-\d+/.exec(g || '');
  const b = (t && GRAD_HEX[t[1]]) || a;
  return [a, b];
}
function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

// All modules of the ecosystem. `to` = route if live, else null = 'soon'.
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
  { n: 'SMS Automation', d: 'Reminders & alerts over SMS', to: '/sms-center', icon: FiSend, cat: 'Engagement', g: 'from-indigo-500 to-blue-600' },
  { n: 'AI Prescription Assistant', d: 'Ambient scribe → SOAP + Rx', to: '/ai-scribe', icon: FiCpu, cat: 'AI', g: 'from-teal-500 to-cyan-600' },
  { n: 'AI Symptom Checker', d: 'Patient self-triage assistant', to: '/symptom-checker', icon: FiActivity, cat: 'AI', g: 'from-rose-500 to-pink-600' },
  { n: 'AI Follow-up Prediction', d: 'Smart follow-up scheduling', to: '/follow-ups', icon: FiBell, cat: 'AI', g: 'from-purple-500 to-violet-600' },
  { n: 'Patient Reactivation', d: 'Win back lapsed patients', to: '/reactivation', icon: FiRefreshCw, cat: 'Growth', g: 'from-orange-500 to-red-500' },
  { n: 'Google Review Automation', d: 'Auto-request 5-star reviews', to: '/reviews', icon: FiStar, cat: 'Growth', g: 'from-yellow-500 to-amber-600' },
  { n: 'Doctor Website Generator', d: 'Instant personal clinic site', to: '/website-generator', icon: FiGlobe, cat: 'Growth', g: 'from-fuchsia-500 to-purple-600' },
  { n: 'Online Booking Portal', d: 'Public self-booking page', to: '/find-doctor', icon: FiCalendar, cat: 'Growth', g: 'from-blue-500 to-cyan-600' },
  { n: 'Pharmacy Inventory', d: 'Stock, batches, expiry & sales', to: '/pharmacy-inventory', icon: FiPackage, cat: 'Operations', g: 'from-emerald-500 to-teal-600' },
  { n: 'Equipment & AMC', d: 'Asset registry & service tracking', to: '/equipment', icon: FiActivity, cat: 'Operations', g: 'from-slate-500 to-gray-700' },
  { n: 'Lab Integration', d: 'Order & track lab tests', to: '/lab-tests', icon: FiActivity, cat: 'Operations', g: 'from-indigo-500 to-blue-600' },
  { n: 'Membership Plans', d: 'Recurring care memberships', to: '/memberships', icon: FiAward, cat: 'Revenue', g: 'from-amber-500 to-yellow-600' },
  { n: 'Health Packages', d: 'Bundled preventive checkups', to: '/health-packages', icon: FiPackage, cat: 'Revenue', g: 'from-emerald-500 to-teal-600' },
  { n: 'Referral Program', d: 'Reward patient referrals', to: '/referrals', icon: FiGift, cat: 'Growth', g: 'from-pink-500 to-rose-600' },
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
  { n: 'Enterprise Reporting', d: 'Org-wide exports & reports', to: '/reports', icon: FiBarChart2, cat: 'Insights', g: 'from-indigo-500 to-violet-600' },
  { n: 'Patient Mobile App', d: 'Companion app for patients', to: null, icon: FiSmartphone, cat: 'Engagement', g: 'from-slate-500 to-gray-700' },
];

const CATEGORIES = ['All', 'Patients', 'Scheduling', 'Clinical', 'AI', 'Telehealth', 'Revenue', 'Growth', 'Operations', 'Insights', 'Engagement'];
const PIN_KEY = 'cc_pins_v1';
const RECENT_KEY = 'cc_recent_v1';
const lsGet = (k) => { try { return JSON.parse(localStorage.getItem(k)) || []; } catch { return []; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } };
const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

/* ─── Single 3D module card ─────────────────────────────────────── */
function ModuleCard({ m, idx, pinned, onOpen, onTogglePin }) {
  const tilt = useTilt(9);
  const Icon = m.icon;
  const live = !!m.to;
  const [a, b] = gradHex(m.g);
  return (
    <div
      {...(live ? tilt : {})}
      onClick={() => live && onOpen(m)}
      className={`module-3d ${live ? 'tilt-3d cursor-pointer' : 'opacity-70 cursor-default'} p-4 animate-pop`}
      style={{ '--m-soft': hexA(a, 0.16), '--m-shadow': hexA(a, 0.5), animationDelay: `${idx * 22}ms` }}
      role={live ? 'button' : undefined}
      tabIndex={live ? 0 : undefined}
      onKeyDown={(e) => { if (live && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onOpen(m); } }}
    >
      {live && (
        <button
          className={`pin-btn ${pinned ? 'pinned' : ''}`}
          onClick={(e) => { e.stopPropagation(); onTogglePin(m.n); }}
          title={pinned ? 'Unpin' : 'Pin to top'}
        >
          <FiStar size={15} fill={pinned ? '#f59e0b' : 'none'} />
        </button>
      )}
      <div className="module-icon depth-2" style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}>
        <Icon className="text-white" size={20} />
      </div>
      <h3 className="font-semibold text-gray-900 text-sm leading-tight mt-3 depth-1">{m.n}</h3>
      <p className="text-xs text-gray-500 mt-1 line-clamp-2 depth-1">{m.d}</p>
      <div className="flex items-center justify-between mt-3 depth-1">
        {live ? (
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 live-dot" /> LIVE
          </span>
        ) : (
          <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">SOON</span>
        )}
        {live && <FiArrowRight className="text-gray-300 transition-transform" style={{ color: a }} />}
      </div>
    </div>
  );
}

export default function CommandCenter() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('All');
  const [pins, setPins] = useState(lsGet(PIN_KEY));
  const [recent, setRecent] = useState(lsGet(RECENT_KEY));
  const searchRef = useRef(null);

  const { data: stats } = useApi('/dashboard/stats');
  const { data: dailyRev } = useApi('/dashboard/revenue-daily?days=1');

  const liveCount = MODULES.filter((m) => m.to).length;

  /* keyboard: "/" focuses search, Esc clears */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && document.activeElement !== searchRef.current) {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === 'Escape' && document.activeElement === searchRef.current) {
        setSearch('');
        searchRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const filtered = useMemo(() => MODULES.filter((m) => {
    const matchCat = cat === 'All' || m.cat === cat;
    const q = search.trim().toLowerCase();
    const matchSearch = !q || m.n.toLowerCase().includes(q) || m.d.toLowerCase().includes(q) || m.cat.toLowerCase().includes(q);
    return matchCat && matchSearch;
  }), [search, cat]);

  const catCounts = useMemo(() => {
    const c = {};
    MODULES.forEach((m) => { c[m.cat] = (c[m.cat] || 0) + 1; });
    c.All = MODULES.length;
    return c;
  }, []);

  const openModule = useCallback((m) => {
    if (!m.to) return;
    const next = [m.n, ...recent.filter((x) => x !== m.n)].slice(0, 6);
    setRecent(next); lsSet(RECENT_KEY, next);
    navigate(m.to);
  }, [recent, navigate]);

  const togglePin = useCallback((name) => {
    setPins((prev) => {
      const next = prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name];
      lsSet(PIN_KEY, next);
      return next;
    });
  }, []);

  const onSearchKey = (e) => {
    if (e.key === 'Enter' && filtered.length) openModule(filtered.find((m) => m.to) || filtered[0]);
  };

  const pinnedModules = pins.map((n) => MODULES.find((m) => m.n === n)).filter(Boolean).filter((m) => m.to);
  const recentModules = recent.map((n) => MODULES.find((m) => m.n === n)).filter(Boolean).filter((m) => m.to);

  return (
    <div className="page-enter space-y-6">
      {/* ── 3D Hero ── */}
      <div className="hero-3d px-6 py-7 sm:px-8"
           style={{ background: 'radial-gradient(1200px 420px at 100% -20%, rgba(139,92,246,0.55), transparent 60%), linear-gradient(125deg,#312e81 0%,#5b21b6 45%,#1e40af 100%)' }}>
        <div className="hero-grid" />
        <span className="orb-3d orb-a" style={{ background: 'radial-gradient(circle,#a78bfa,transparent 70%)' }} />
        <span className="orb-3d orb-b" style={{ background: 'radial-gradient(circle,#22d3ee,transparent 70%)' }} />
        <span className="orb-3d orb-c" style={{ background: 'radial-gradient(circle,#818cf8,transparent 70%)' }} />

        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-2 glass-chip px-3 py-1">
              <FiGrid className="text-white" size={14} />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-white/90">Command Center</span>
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white leading-tight">AI Healthcare Operating System</h1>
          <p className="text-white/75 max-w-2xl mt-1.5">
            One control plane for clinics, doctors, hospitals & patients — launch any of {MODULES.length} modules to grow revenue, cut workload & retain patients.
          </p>

          {/* Live KPI tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6">
            {[
              { label: 'Modules', value: MODULES.length, icon: FiGrid },
              { label: 'Live now', value: liveCount, icon: FiZap },
              { label: "Today's Visits", value: stats?.todayAppointments ?? 0, icon: FiCalendar },
              { label: 'In Queue', value: stats?.waitingCount ?? stats?.todayWaiting ?? 0, icon: FiClock },
              { label: "Today's Revenue", value: dailyRev?.today?.total ?? 0, icon: FiDollarSign, money: true },
            ].map((k) => (
              <div key={k.label} className="glass-chip px-4 py-3">
                <div className="flex items-center gap-1.5 text-white/70 mb-1">
                  <k.icon size={13} /><span className="text-[10px] uppercase tracking-wide">{k.label}</span>
                </div>
                <p className="text-xl font-extrabold text-white tabular-nums">
                  {k.money ? inr(k.value) : <AnimatedCounter end={Number(k.value || 0)} />}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Search + category chips ── */}
      <div className="space-y-3">
        <div className="relative">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={onSearchKey}
            placeholder="Search modules, categories…  (press / to focus, Enter to launch)"
            className="input-field !pl-10 !pr-24"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 text-gray-400">
            <span className="kbd !text-gray-500 !bg-gray-100 !border-gray-200">/</span>
            <FiCornerDownLeft size={13} />
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto custom-scroll pb-1">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCat(c)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${cat === c ? 'bg-indigo-600 text-white shadow' : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300'}`}>
              {c}
              <span className={`text-[10px] font-bold px-1.5 rounded-full ${cat === c ? 'bg-white/25' : 'bg-gray-100 text-gray-500'}`}>{catCounts[c] || 0}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Pinned ── */}
      {pinnedModules.length > 0 && cat === 'All' && !search && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FiStar className="text-amber-500" size={15} />
            <h2 className="text-sm font-bold text-gray-700">Pinned</h2>
          </div>
          <div className="scene-3d grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {pinnedModules.map((m, idx) => (
              <ModuleCard key={`pin-${m.n}`} m={m} idx={idx} pinned onOpen={openModule} onTogglePin={togglePin} />
            ))}
          </div>
        </div>
      )}

      {/* ── Recently used ── */}
      {recentModules.length > 0 && cat === 'All' && !search && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FiClock className="text-indigo-500" size={15} />
            <h2 className="text-sm font-bold text-gray-700">Recently used</h2>
          </div>
          <div className="flex gap-2 flex-wrap">
            {recentModules.map((m) => {
              const [a] = gradHex(m.g);
              const Icon = m.icon;
              return (
                <button key={`rec-${m.n}`} onClick={() => openModule(m)}
                  className="flex items-center gap-2 bg-white border border-gray-200 rounded-full pl-1.5 pr-3.5 py-1.5 text-sm font-medium text-gray-700 hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-white" style={{ background: a }}>
                    <Icon size={12} />
                  </span>
                  {m.n}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── All modules ── */}
      <div>
        {(cat !== 'All' || search) && (
          <p className="text-sm text-gray-400 mb-3">{filtered.length} module{filtered.length !== 1 ? 's' : ''}{cat !== 'All' ? ` in ${cat}` : ''}</p>
        )}
        <div className="scene-3d grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((m, idx) => (
            <ModuleCard key={m.n} m={m} idx={idx} pinned={pins.includes(m.n)} onOpen={openModule} onTogglePin={togglePin} />
          ))}
        </div>
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
