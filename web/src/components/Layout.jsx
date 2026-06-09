import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  FiHome, FiUsers, FiCalendar, FiFileText, FiDollarSign,
  FiSettings, FiLogOut, FiSearch, FiMenu, FiX,
  FiBell, FiActivity, FiPackage, FiBarChart2,
  FiCreditCard, FiHeart, FiUserPlus, FiClock,
  FiShield, FiMessageCircle, FiCpu, FiMic,
  FiEdit3, FiAward, FiGift, FiSend, FiStar,
  FiTrendingUp, FiMapPin, FiDatabase, FiGlobe,
  FiChevronDown, FiList, FiCamera, FiWifi,
  FiInbox, FiVideo, FiZap, FiWatch, FiShare2
} from 'react-icons/fi';
import { clearSession, getUser } from '../utils/auth';
import NotificationCenter from './NotificationCenter';
import AccessibilityWidget from './AccessibilityWidget';

/* ─── Primary nav items (shown in top bar) ───────────────────────── */
const primaryNav = [
  { path: '/',              icon: FiHome,      label: 'Dashboard',     end: true },
  { path: '/receptionist',  icon: FiUserPlus,  label: 'Receptionist' },
  { path: '/nurse',         icon: FiActivity,  label: 'Nurse Station' },
  { path: '/patients',      icon: FiUsers,     label: 'Patients' },
  { path: '/appointments',  icon: FiCalendar,  label: 'Appointments' },
  { path: '/prescriptions', icon: FiFileText,  label: 'Prescriptions' },
  { path: '/lab-tests',     icon: FiActivity,  label: 'Lab Reports' },
  { path: '/billing',       icon: FiDollarSign,label: 'Billing' },
  { path: '/medicines',     icon: FiPackage,   label: 'Pharmacy' },
  { path: '/settings',      icon: FiSettings,  label: 'Settings' },
];

/* ─── Secondary nav (shown in mobile menu / more dropdown) ──────── */
const moreNavGroups = [
  {
    label: 'Clinical',
    items: [
      { path: '/visit-pad',        icon: FiActivity,      label: 'Visit Pad' },
      { path: '/opd-queue',        icon: FiStar,          label: 'OPD Queue' },
      { path: '/teleconsult',      icon: FiVideo,         label: 'Teleconsult Hub' },
      { path: '/async-consults',   icon: FiInbox,         label: 'Async Consultations' },
      { path: '/smart-scheduler',  icon: FiZap,           label: 'Smart Day Planner' },
      { path: '/waitlist',         icon: FiClock,         label: 'Waitlist Auto-Fill' },
      { path: '/patient-insights', icon: FiTrendingUp,    label: 'Patient Insights' },
      { path: '/health-records',   icon: FiHeart,         label: 'Health Records' },
      { path: '/care-pathways',    icon: FiList,          label: 'Care Pathways' },
      { path: '/wound-tracker',    icon: FiCamera,        label: 'Wound & Skin Tracker' },
      { path: '/vaccinations',     icon: FiShield,        label: 'Vaccinations' },
      { path: '/certificates',     icon: FiAward,         label: 'Medical Certificates' },
      { path: '/availability',     icon: FiCalendar,      label: 'Availability & Leave' },
    ]
  },
  {
    label: 'AI Tools',
    items: [
      { path: '/ai-scribe',         icon: FiMic,           label: 'Ambient AI Scribe' },
      { path: '/ai-assistant',      icon: FiMessageCircle, label: 'AI Health Assistant' },
      { path: '/ai-lab-analyzer',   icon: FiSearch,        label: 'AI Lab Analyzer' },
      { path: '/rx-guard',          icon: FiShield,        label: 'Rx Interaction Guard' },
      { path: '/voice-prescription',icon: FiMic,           label: 'Voice Prescription' },
      { path: '/clinical-support',  icon: FiCpu,           label: 'Clinical Decision AI' },
      { path: '/emr-templates',     icon: FiFileText,      label: 'EMR Templates' },
      { path: '/e-signature',       icon: FiEdit3,         label: 'E-Signature' },
    ]
  },
  {
    label: 'Finance & Growth',
    items: [
      { path: '/expenses',         icon: FiCreditCard,    label: 'Expenses' },
      { path: '/reports',          icon: FiBarChart2,     label: 'Reports' },
      { path: '/practice-analytics',icon: FiTrendingUp,   label: 'Practice Analytics' },
      { path: '/revenue-routing',  icon: FiTrendingUp,    label: 'Revenue Routing' },
      { path: '/insurance',        icon: FiShield,        label: 'Insurance Desk' },
      { path: '/rpm',              icon: FiWifi,          label: 'RPM Reimbursement' },
      { path: '/memberships',      icon: FiAward,         label: 'Memberships' },
      { path: '/health-packages',  icon: FiPackage,       label: 'Health Packages' },
      { path: '/referrals',        icon: FiGift,          label: 'Referral Program' },
      { path: '/campaigns',        icon: FiSend,          label: 'Campaigns' },
    ]
  },
  {
    label: 'Engage & Enterprise',
    items: [
      { path: '/follow-ups',      icon: FiBell,          label: 'Follow-ups' },
      { path: '/patient-portal',  icon: FiGlobe,         label: 'Patient Portal' },
      { path: '/family-accounts', icon: FiUserPlus,      label: 'Family Accounts' },
      { path: '/medicine-reminders',icon: FiClock,       label: 'Medicine Reminders' },
      { path: '/wearables',       icon: FiWatch,         label: 'Wearable Monitoring' },
      { path: '/interoperability',icon: FiShare2,        label: 'FHIR Interoperability' },
      { path: '/branches',        icon: FiMapPin,        label: 'Branches & Team' },
      { path: '/audit-logs',      icon: FiDatabase,      label: 'Audit & Backup' },
    ]
  },
];

/* ─── Format current date/time ──────────────────────────────────── */
function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);
  const days  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months= ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const day   = days[now.getDay()];
  const month = months[now.getMonth()];
  const date  = now.getDate();
  const year  = now.getFullYear();
  const h     = now.getHours();
  const m     = now.getMinutes().toString().padStart(2,'0');
  const ampm  = h >= 12 ? 'PM' : 'AM';
  const h12   = (h % 12 || 12).toString().padStart(2,'0');
  return `${day}, ${month} ${date}, ${year}  ${h12}:${m} ${ampm}`;
}

export default function Layout() {
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [moreOpen,   setMoreOpen]     = useState(false);
  const [search, setSearch]           = useState('');
  const navigate  = useNavigate();
  const location  = useLocation();
  const user      = getUser();
  const clock     = useClock();

  const handleLogout = () => { clearSession(); navigate('/login'); };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    navigate(`/patients?search=${encodeURIComponent(search.trim())}`);
    setSearch('');
  };

  /* Close dropdowns on route change */
  useEffect(() => {
    setMobileOpen(false);
    setMoreOpen(false);
  }, [location.pathname]);

  const role = user?.role || 'doctor';

  const filteredPrimaryNav = primaryNav.filter(item => {
    if (role === 'receptionist') {
      return item.path === '/receptionist' || item.path === '/settings';
    }
    if (role === 'nurse') {
      return item.path === '/nurse' || item.path === '/settings';
    }
    return true;
  });

  const filteredMoreNavGroups = (role === 'receptionist' || role === 'nurse') ? [] : moreNavGroups;

  /* Determine if current route is in "more" section */
  const allMorePaths = filteredMoreNavGroups.flatMap(g => g.items.map(i => i.path));
  const moreIsActive = allMorePaths.some(p =>
    p === '/' ? location.pathname === '/' : location.pathname.startsWith(p)
  );

  /* Initials for avatar */
  const initials = (user.name || 'D').split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--page-bg)' }}>

      {/* ═══════════════════════════════════════════
          TOP NAVIGATION BAR
      ═══════════════════════════════════════════ */}
      <header className="topnav flex-shrink-0">
        <div className="flex items-center h-14 px-4 lg:px-6 gap-3">

          {/* Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0 mr-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.22)' }}
            >
              <FiActivity className="text-white text-base" />
            </div>
            <div className="hidden sm:block leading-tight">
              <p className="text-white font-bold text-sm leading-none">MedCore Clinic</p>
              <p className="text-white/60 text-[10px] leading-none mt-0.5">Hospital Management</p>
            </div>
          </div>

          {/* ── Primary Nav Links (desktop) ── */}
          <nav className="hidden lg:flex items-center gap-0.5 flex-1 overflow-x-auto">
            {filteredPrimaryNav.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  isActive ? 'nav-link-active' : 'nav-link'
                }
              >
                <item.icon className="text-sm flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            ))}

            {/* More dropdown */}
            <div className="relative">
              {filteredMoreNavGroups.length > 0 && (
                <>
                  <button
                    onClick={() => setMoreOpen(!moreOpen)}
                    className={`nav-link flex items-center gap-1 ${moreIsActive ? 'text-white font-semibold' : ''}`}
                  >
                    More
                    <FiChevronDown className={`text-xs transition-transform duration-200 ${moreOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {moreOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} />
                      <div className="absolute left-0 top-full mt-1 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 w-[680px] grid grid-cols-2 gap-6 animate-scale-in">
                        {filteredMoreNavGroups.map(group => (
                          <div key={group.label}>
                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">{group.label}</p>
                            <div className="space-y-0.5">
                              {group.items.map(item => (
                                <NavLink
                                  key={item.path}
                                  to={item.path}
                                  className={({ isActive }) =>
                                    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors duration-150 ${
                                      isActive
                                        ? 'bg-teal-50 text-teal-700 font-semibold'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`
                                  }
                                >
                                  <item.icon className="text-sm text-gray-400 flex-shrink-0" />
                                  {item.label}
                                </NavLink>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </nav>

          {/* ── Right section ── */}
          <div className="flex items-center gap-2 ml-auto flex-shrink-0">
            {/* Search */}
            <form onSubmit={handleSearch} className="relative hidden md:block">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 text-sm pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search patients..."
                className="pl-9 pr-4 py-1.5 rounded-lg w-48 focus:w-60 text-sm text-white placeholder:text-white/50 outline-none transition-all duration-300"
                style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}
                onFocus={e => e.target.style.background = 'rgba(255,255,255,0.22)'}
                onBlur={e => e.target.style.background  = 'rgba(255,255,255,0.15)'}
              />
            </form>

            {/* Date/Time */}
            <div className="hidden xl:block text-right leading-tight">
              <p className="text-white/90 text-xs font-medium">{clock}</p>
            </div>

            {/* Notification bell */}
            <div className="relative">
              <NotificationCenter />
            </div>

            {/* Doctor profile */}
            <div className="flex items-center gap-2 pl-2 ml-1 border-l border-white/20">
              <div className="hidden sm:block text-right leading-tight">
                <p className="text-white text-xs font-semibold">
                  {role === 'doctor' || !user.role ? 'Dr. ' : ''}{user.name || 'User'}
                </p>
                <p className="text-white/60 text-[10px]">
                  {role === 'receptionist' ? 'Receptionist' : role === 'nurse' ? 'Nurse Station' : (user.specialty || 'General Physician')}
                </p>
              </div>
              <div className="relative group">
                <button
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 transition-transform duration-200 hover:scale-105"
                  style={{ background: 'rgba(255,255,255,0.22)' }}
                  title="Account menu"
                >
                  {initials}
                </button>
                {/* Dropdown */}
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 animate-fade-in">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">
                      {role === 'doctor' || !user.role ? 'Dr. ' : ''}{user.name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{role || 'Doctor'}</p>
                  </div>
                  <NavLink to="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <FiSearch className="text-gray-400 text-sm" /> My Profile
                  </NavLink>
                  <NavLink to="/settings" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    <FiSettings className="text-gray-400 text-sm" /> Settings
                  </NavLink>
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full transition-colors"
                    >
                      <FiLogOut className="text-sm" /> Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile hamburger */}
            <button
              className="lg:hidden p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <FiX className="text-lg" /> : <FiMenu className="text-lg" />}
            </button>
          </div>
        </div>

        {/* ── Mobile Nav Drawer ── */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-white/15 bg-nav-dark px-4 py-4 animate-fade-in max-h-[80vh] overflow-y-auto custom-scroll"
               style={{ background: 'var(--nav-bg-dark)' }}>
            {/* Primary links */}
            <div className="grid grid-cols-2 gap-1 mb-4">
              {filteredPrimaryNav.map(item => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    isActive
                      ? 'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-white text-gray-800'
                      : 'flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/80 hover:text-white hover:bg-white/10'
                  }
                >
                  <item.icon className="text-sm" />
                  {item.label}
                </NavLink>
              ))}
            </div>

            {/* More groups */}
            {filteredMoreNavGroups.map(group => (
              <div key={group.label} className="mb-3">
                <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider px-3 mb-1">{group.label}</p>
                <div className="grid grid-cols-2 gap-1">
                  {group.items.map(item => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        isActive
                          ? 'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-white text-gray-800'
                          : 'flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/70 hover:text-white hover:bg-white/10'
                      }
                    >
                      <item.icon className="text-xs flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 mt-3 rounded-lg text-sm text-red-300 hover:bg-red-900/30 w-full transition-colors"
            >
              <FiLogOut className="text-sm" /> Sign Out
            </button>
          </div>
        )}
      </header>

      {/* ═══════════════════════════════════════════
          MAIN CONTENT
      ═══════════════════════════════════════════ */}
      <main className="flex-1 overflow-y-auto custom-scroll">
        <div className="p-4 lg:p-6 max-w-screen-2xl mx-auto">
          <Outlet />
        </div>
      </main>

      <AccessibilityWidget />
    </div>
  );
}
