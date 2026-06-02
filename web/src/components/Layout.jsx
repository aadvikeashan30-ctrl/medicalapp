import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  FiHome, FiUsers, FiCalendar, FiFileText, FiDollarSign,
  FiSettings, FiLogOut, FiMenu, FiX, FiSearch, FiUser,
  FiMoon, FiSun, FiPackage, FiActivity,
  FiBarChart2, FiCreditCard, FiBell, FiGlobe,
  FiHeart, FiUserPlus, FiClock, FiShield, FiMessageCircle,
  FiCpu, FiMic, FiEdit3, FiAlertTriangle,
  FiAward, FiGift, FiSend, FiStar,
  FiMapPin, FiDatabase, FiTrendingUp
} from 'react-icons/fi';
import { clearSession, getUser } from '../utils/auth';
import { useDarkMode } from '../hooks/useDarkMode';
import NotificationCenter from './NotificationCenter';

const navGroups = [
  {
    label: 'Overview',
    items: [
      { path: '/', icon: FiHome, label: 'Dashboard', end: true },
    ]
  },
  {
    label: 'Clinical',
    items: [
      { path: '/patients', icon: FiUsers, label: 'Patients' },
      { path: '/appointments', icon: FiCalendar, label: 'Appointments' },
      { path: '/prescriptions', icon: FiFileText, label: 'Prescriptions' },
      { path: '/medicines', icon: FiPackage, label: 'Medicines' },
      { path: '/lab-tests', icon: FiActivity, label: 'Lab Tests' },
    ]
  },
  {
    label: 'Patient Features',
    items: [
      { path: '/health-records', icon: FiHeart, label: 'Health Records (PHR)' },
      { path: '/family-accounts', icon: FiUserPlus, label: 'Family Accounts' },
      { path: '/medicine-reminders', icon: FiClock, label: 'Medicine Reminders' },
      { path: '/vaccinations', icon: FiShield, label: 'Vaccinations' },
      { path: '/ai-assistant', icon: FiMessageCircle, label: 'AI Health Assistant' },
      { path: '/ai-lab-analyzer', icon: FiSearch, label: 'AI Lab Analyzer' },
    ]
  },
  {
    label: 'AI Doctor Tools',
    items: [
      { path: '/voice-prescription', icon: FiMic, label: 'Voice Prescription' },
      { path: '/clinical-support', icon: FiCpu, label: 'Clinical Decision AI' },
      { path: '/emr-templates', icon: FiFileText, label: 'EMR Templates' },
      { path: '/e-signature', icon: FiEdit3, label: 'E-Signature' },
    ]
  },
  {
    label: 'Finance',
    items: [
      { path: '/billing', icon: FiDollarSign, label: 'Billing' },
      { path: '/expenses', icon: FiCreditCard, label: 'Expenses' },
      { path: '/reports', icon: FiBarChart2, label: 'Reports' },
    ]
  },
  {
    label: 'Business Growth',
    items: [
      { path: '/memberships', icon: FiAward, label: 'Memberships' },
      { path: '/health-packages', icon: FiPackage, label: 'Health Packages' },
      { path: '/referrals', icon: FiGift, label: 'Referral Program' },
      { path: '/campaigns', icon: FiSend, label: 'Campaigns & Reviews' },
    ]
  },
  {
    label: 'Engage',
    items: [
      { path: '/follow-ups', icon: FiBell, label: 'Follow-ups' },
      { path: '/patient-portal', icon: FiGlobe, label: 'Patient Portal' },
    ]
  },
  {
    label: 'Enterprise',
    items: [
      { path: '/branches', icon: FiMapPin, label: 'Branches & Team' },
      { path: '/audit-logs', icon: FiDatabase, label: 'Audit & Backup' },
    ]
  }
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!search.trim()) return;
    navigate(`/patients?search=${encodeURIComponent(search.trim())}`);
    setSearch('');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Background mesh */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'radial-gradient(at 30% 20%, rgba(99,102,241,0.03) 0%, transparent 50%), radial-gradient(at 80% 80%, rgba(16,185,129,0.02) 0%, transparent 50%)' }} />

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* ═══════ SIDEBAR ═══════ */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 ease-out
        sidebar-glass
        ${sidebarOpen ? 'w-64' : 'w-[68px]'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
            <FiActivity className="text-white text-sm" />
          </div>
          {sidebarOpen && (
            <div className="animate-fade-up">
              <h1 className="text-base font-bold text-gray-900">DocClinic</h1>
              <p className="text-[10px] text-indigo-500 font-medium tracking-[0.15em] uppercase">Pro</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto custom-scroll space-y-5">
          {navGroups.map((group) => (
            <div key={group.label}>
              {sidebarOpen && (
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">{group.label}</p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    className={({ isActive }) =>
                      isActive ? 'sidebar-link-active' : 'sidebar-link'
                    }
                    onClick={() => setMobileOpen(false)}
                    title={!sidebarOpen ? item.label : undefined}
                  >
                    <item.icon className="text-lg flex-shrink-0" />
                    {sidebarOpen && <span className="text-sm">{item.label}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User card */}
        <div className="p-3 border-t border-gray-100">
          {sidebarOpen ? (
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
                <span className="text-white text-xs font-bold">{(user.name || 'D')[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">Dr. {user.name || 'Doctor'}</p>
                <p className="text-[11px] text-gray-500 truncate capitalize">{user.plan || 'free'} plan</p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
                <span className="text-white text-xs font-bold">{(user.name || 'D')[0]}</span>
              </div>
            </div>
          )}
          <div className="flex items-center gap-1 mt-2">
            <NavLink to="/profile" className="sidebar-link flex-1 !py-2 !text-xs" onClick={() => setMobileOpen(false)}>
              <FiUser className="text-sm" />
              {sidebarOpen && <span>Profile</span>}
            </NavLink>
            <NavLink to="/settings" className="sidebar-link flex-1 !py-2 !text-xs" onClick={() => setMobileOpen(false)}>
              <FiSettings className="text-sm" />
              {sidebarOpen && <span>Settings</span>}
            </NavLink>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 mt-1 w-full rounded-xl text-rose-500 hover:bg-rose-50 transition-all font-medium text-xs"
          >
            <FiLogOut className="text-sm" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ═══════ MAIN ═══════ */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="header-glass px-4 lg:px-6 py-3 flex items-center justify-between z-30 relative">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors">
              <FiMenu className="text-lg" />
            </button>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="hidden lg:flex p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
              {sidebarOpen ? <FiX className="text-base" /> : <FiMenu className="text-base" />}
            </button>

            {/* Search */}
            <form onSubmit={handleSearch} className="relative hidden md:block">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patients..."
                className="pl-9 pr-4 py-2 rounded-lg w-56 focus:w-72 text-sm text-gray-900 placeholder:text-gray-400 bg-gray-50 border border-gray-200 outline-none transition-all duration-300 focus:border-indigo-300 focus:bg-white"
                style={{ boxShadow: 'none' }}
              />
            </form>
          </div>

          <div className="flex items-center gap-1.5">
            <NotificationCenter />
            <div className="hidden sm:flex items-center gap-2 pl-3 ml-1.5 border-l border-gray-200">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.clinicName || 'My Clinic'}</p>
                <p className="text-[11px] text-gray-500 capitalize flex items-center gap-1.5 justify-end">
                  <span className="status-dot status-online" />
                  {user.plan || 'free'}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scroll relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
