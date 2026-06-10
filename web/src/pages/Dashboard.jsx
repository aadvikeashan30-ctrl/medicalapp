import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiUsers, FiCalendar, FiClock, FiCheckCircle,
  FiAlertCircle, FiUserPlus, FiActivity, FiDollarSign,
  FiRefreshCw, FiArrowUpRight, FiPlay, FiCheck,
  FiFileText, FiMonitor, FiFilter
} from 'react-icons/fi';
import { FaWhatsapp, FaFlask, FaRupeeSign, FaVideo } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useApi } from '../hooks/useApi';
import api from '../utils/api';
import { getUser } from '../utils/auth';
import Loader from '../components/Loader';
import AnimatedCounter from '../components/AnimatedCounter';
import { useDoctorSocket } from '../hooks/useQueueSocket';

/* ─── Helpers ──────────────────────────────────────────────────── */
const now = new Date();
const DAY_NAMES  = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MON_NAMES  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const formatDate = () =>
  `${DAY_NAMES[now.getDay()]}, ${MON_NAMES[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

function fmtTime(str) {
  if (!str) return '';
  // Already formatted like "10:30 AM"
  if (/\d{1,2}:\d{2}\s?(AM|PM)/i.test(str)) return str;
  // ISO date string — extract time
  if (str.includes('T')) {
    const d = new Date(str);
    if (!isNaN(d)) {
      const h = d.getHours(), m = d.getMinutes();
      const ampm = h >= 12 ? 'PM' : 'AM';
      return `${(h % 12 || 12).toString().padStart(2,'0')}:${m.toString().padStart(2,'0')} ${ampm}`;
    }
  }
  // "HH:MM" or "HH:MM:SS"
  const parts = str.split(':');
  if (parts.length >= 2) {
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (!isNaN(h) && !isNaN(m)) {
      const ampm = h >= 12 ? 'PM' : 'AM';
      return `${(h % 12 || 12).toString().padStart(2,'0')}:${m.toString().padStart(2,'0')} ${ampm}`;
    }
  }
  return str; // return as-is if unrecognised
}

/* Avatar colour palette (cycle by index) */
const AVATAR_COLORS = [
  { bg: '#dbeafe', text: '#1d4ed8' }, // blue
  { bg: '#fce7f3', text: '#be185d' }, // pink
  { bg: '#d1fae5', text: '#065f46' }, // green
  { bg: '#fef3c7', text: '#92400e' }, // amber
  { bg: '#ede9fe', text: '#5b21b6' }, // purple
  { bg: '#fee2e2', text: '#991b1b' }, // red
  { bg: '#e0f2fe', text: '#0c4a6e' }, // sky
];

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

/* Status display config */
const STATUS_CFG = {
  'in-progress': { label: 'In Consultation', cls: 'status-consultation' },
  'completed':   { label: 'Completed',        cls: 'status-completed' },
  'scheduled':   { label: 'Scheduled',        cls: 'status-scheduled' },
  'confirmed':   { label: 'Scheduled',        cls: 'status-scheduled' },
  'waiting':     { label: 'Waiting',           cls: 'status-waiting' },
  'cancelled':   { label: 'Cancelled',         cls: 'status-cancelled' },
  'WAITING_FOR_DOCTOR': { label: 'Waiting (Vitals Checked)', cls: 'status-waiting font-semibold animate-pulse' },
  'IN_CONSULTATION': { label: 'In Consultation', cls: 'status-consultation font-semibold animate-pulse' },
  'CONSULTATION_COMPLETED': { label: 'Completed', cls: 'status-completed' },
  'REGISTERED': { label: 'Registered', cls: 'status-scheduled' },
  'PAYMENT_PENDING': { label: 'Payment Pending', cls: 'status-waiting' },
  'PAYMENT_COMPLETED': { label: 'Paid', cls: 'status-completed' },
  'VITALS_PENDING': { label: 'Vitals Pending', cls: 'status-waiting' },
  'VITALS_COMPLETED': { label: 'Vitals Completed', cls: 'status-completed' },
  'CHECKOUT_COMPLETED': { label: 'Checked Out', cls: 'status-completed' },
};

/* ─── Stat Card ─────────────────────────────────────────────────── */
function StatCard({ icon: Icon, iconCls, label, value, suffix, badge, badgeCls, isRevenue, delay }) {
  return (
    <div className="stat-card animate-fade-up" style={{ animationDelay: delay }}>
      <div className="flex items-start justify-between mb-3">
        <div className={`stat-icon ${iconCls}`}>
          <Icon size={20} />
        </div>
        {badge && (
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${badgeCls}`}>
            {badge}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 tabular-nums leading-none">
        {isRevenue && <span className="text-base opacity-60">₹</span>}
        <AnimatedCounter end={Number(value || 0)} />
        {suffix && <span className="text-base font-medium text-gray-500 ml-1">{suffix}</span>}
      </p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

/* ─── Quick Action Tile ─────────────────────────────────────────── */
function QuickAction({ icon: Icon, label, to, colorCls, iconColor }) {
  return (
    <Link to={to} className={`quick-action-btn ${colorCls} hover-lift`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center`}
           style={{ background: iconColor + '22' }}>
        <Icon size={18} style={{ color: iconColor }} />
      </div>
      <span className="text-xs font-semibold text-gray-700 leading-tight">{label}</span>
    </Link>
  );
}

/* ─── Upcoming Appointment Row ──────────────────────────────────── */
function UpcomingRow({ time, name, sub, idx }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <div className="text-right min-w-[42px]">
        <p className="text-xs font-bold text-gray-800 leading-none">{fmtTime(time).split(' ')[0]}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">{fmtTime(time).split(' ')[1]}</p>
      </div>
      <div className="w-px self-stretch bg-gray-200 mx-1" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 leading-none truncate">{name}</p>
        <p className="text-[11px] text-gray-400 mt-0.5 truncate">{sub}</p>
      </div>
    </div>
  );
}

/* ─── Daily Revenue (day-wise, multi-source) ───────────────────── */
const REV_SOURCES = [
  { key: 'consultation', label: 'Consultation', color: '#1a8c8c' },
  { key: 'lab',          label: 'Lab',          color: '#0369a1' },
  { key: 'pharmacy',     label: 'Pharmacy / Medicines', color: '#b45309' },
];
const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

function DailyRevenueCard({ data, loading }) {
  const series = data?.series || [];
  const totals = data?.totals || { consultation: 0, lab: 0, pharmacy: 0, total: 0 };
  const today = data?.today;
  const maxTotal = Math.max(...series.map(s => s.total), 1);

  return (
    <div className="card animate-fade-up stagger-4">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-base font-bold text-gray-900">Daily Revenue</h2>
          <p className="text-xs text-gray-400">Last {data?.days || 14} days · consultation + lab + pharmacy</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-gray-400">Today</p>
          <p className="text-xl font-bold tabular-nums" style={{ color: 'var(--nav-bg)' }}>{inr(today?.total)}</p>
        </div>
      </div>

      {loading ? (
        <Loader label="Loading revenue…" />
      ) : series.length === 0 ? (
        <div className="py-10 text-center text-sm text-gray-400">No revenue recorded yet</div>
      ) : (
        <>
          {/* Stacked bar chart */}
          <div className="flex items-end gap-1.5 h-44 overflow-x-auto pb-1">
            {series.map((d, i) => {
              const h = Math.round((d.total / maxTotal) * 100);
              const isToday = i === series.length - 1;
              return (
                <div key={d.date} className="flex flex-col items-center gap-1 flex-1 min-w-[26px] group">
                  <span className="text-[9px] font-semibold text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                    {d.total >= 1000 ? `${(d.total / 1000).toFixed(1)}k` : d.total}
                  </span>
                  <div
                    className="w-full flex flex-col-reverse rounded-t-md overflow-hidden bg-gray-100 transition-all"
                    style={{ height: `${Math.max(h, 2)}%` }}
                    title={`${d.label}: ${inr(d.total)}\nConsultation ${inr(d.consultation)} · Lab ${inr(d.lab)} · Pharmacy ${inr(d.pharmacy)}`}
                  >
                    {REV_SOURCES.map(s => {
                      const seg = d.total ? (d[s.key] / d.total) * 100 : 0;
                      return seg > 0 ? (
                        <div key={s.key} style={{ height: `${seg}%`, background: s.color }} />
                      ) : null;
                    })}
                  </div>
                  <span className={`text-[9px] tabular-nums ${isToday ? 'font-bold text-gray-700' : 'text-gray-400'}`}>
                    {d.label.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Legend + per-source totals */}
          <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {REV_SOURCES.map(s => (
              <div key={s.key} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: s.color }} />
                <div className="min-w-0">
                  <p className="text-[11px] text-gray-500 truncate">{s.label}</p>
                  <p className="text-sm font-semibold text-gray-800 tabular-nums">{inr(totals[s.key])}</p>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0 bg-gray-800" />
              <div className="min-w-0">
                <p className="text-[11px] text-gray-500 truncate">Total ({data?.days || 14}d)</p>
                <p className="text-sm font-bold text-gray-900 tabular-nums">{inr(totals.total)}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const user = getUser();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [sendingReminders, setSendingReminders] = useState(false);

  const { data: stats,   loading: statsLoading, error: statsError, refetch: refetchStats } = useApi('/dashboard/stats');
  const { data: queueRaw, loading: queueLoading, refetch: refetchQueue } = useApi('/appointments/queue/today');

  const doctorId = user?._id || user?.id;
  const { refreshTrigger } = useDoctorSocket(user?.role === 'doctor' || !user?.role ? doctorId : null);

  useEffect(() => {
    if (refreshTrigger > 0) {
      refetchQueue();
      refetchStats();
    }
  }, [refreshTrigger, refetchQueue, refetchStats]);
  const { data: analytics } = useApi('/dashboard/analytics');
  const { data: revenue }   = useApi('/billing/revenue/summary');
  const { data: dailyRevenue, loading: dailyRevenueLoading } = useApi('/dashboard/revenue-daily?days=14');

  /* Upcoming appointments (next few from queue) */
  const upcoming = useMemo(() => {
    if (!queueRaw) return [];
    return [...queueRaw]
      .filter(a => a.status === 'scheduled' || a.status === 'confirmed' || a.status === 'WAITING_FOR_DOCTOR')
      .slice(0, 4);
  }, [queueRaw]);

  /* Filtered queue */
  const queue = useMemo(() => {
    if (!queueRaw) return [];
    if (activeFilter === 'waiting')     return queueRaw.filter(a => a.status === 'waiting' || a.status === 'scheduled' || a.status === 'confirmed' || a.status === 'WAITING_FOR_DOCTOR');
    if (activeFilter === 'in-progress') return queueRaw.filter(a => a.status === 'in-progress' || a.status === 'IN_CONSULTATION');
    return queueRaw;
  }, [queueRaw, activeFilter]);

  const sendReminders = async () => {
    setSendingReminders(true);
    try {
      const { data } = await api.post('/whatsapp/run-reminders');
      toast.success(`Sent ${data.sent}/${data.processed} reminders`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reminders');
    } finally {
      setSendingReminders(false);
    }
  };

  const startAppt = async (id) => {
    try {
      await api.put(`/appointments/${id}`, { status: 'IN_CONSULTATION' });
      refetchQueue(); refetchStats();
      toast.success('Patient called in');
      navigate(`/visit-pad?appointmentId=${id}`);
    } catch { toast.error('Failed to call patient in'); }
  };

  const completeAppt = async (id) => {
    try {
      await api.put(`/appointments/${id}`, { status: 'CONSULTATION_COMPLETED' });
      refetchQueue(); refetchStats();
      toast.success('Appointment completed');
    } catch { toast.error('Failed to complete appointment'); }
  };

  /* ── Stat card config ── */
  const statCards = [
    {
      icon: FiUsers,
      iconCls: 'stat-icon-teal',
      label: 'Total Patients',
      value: stats?.totalPatients ?? 0,
      badge: stats?.newPatientsThisMonth ? `+${stats.newPatientsThisMonth}%` : null,
      badgeCls: 'bg-green-100 text-green-700',
      delay: '0ms',
    },
    {
      icon: FiCalendar,
      iconCls: 'stat-icon-cyan',
      label: 'Appointments Today',
      value: stats?.todayAppointments ?? 0,
      badge: 'Today',
      badgeCls: 'bg-cyan-100 text-cyan-700',
      delay: '80ms',
    },
    {
      icon: FiCheckCircle,
      iconCls: 'stat-icon-green',
      label: 'Completed Visits',
      value: stats?.todayCompleted ?? 0,
      badge: stats?.completionRate ? `${stats.completionRate}%` : null,
      badgeCls: 'bg-green-100 text-green-700',
      delay: '160ms',
    },
    {
      icon: FiClock,
      iconCls: 'stat-icon-orange',
      label: 'Avg Wait Time',
      value: stats?.avgWaitTime ?? 12,
      suffix: 'min',
      badge: 'Avg',
      badgeCls: 'bg-orange-100 text-orange-700',
      delay: '240ms',
    },
  ];

  return (
    <div className="space-y-5 page-enter">

      {/* ── Top action row ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'},
            {' '}Dr. {user.name || 'Doctor'} 👋
          </h1>
          <p className="text-sm text-gray-500">{formatDate()}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { refetchStats(); refetchQueue(); toast.success('Refreshed'); }}
            className="btn-secondary !py-1.5 !text-xs"
          >
            <FiRefreshCw size={13} /> Refresh
          </button>
          <Link to="/patients" className="btn-primary !py-1.5 !text-xs">
            <FiUserPlus size={13} /> New Patient
          </Link>
          <button
            onClick={sendReminders}
            disabled={sendingReminders}
            className="btn-success !py-1.5 !text-xs"
          >
            <FaWhatsapp size={13} />
            {sendingReminders ? 'Sending…' : 'Send Reminders'}
          </button>
        </div>
      </div>

      {/* ── Error ── */}
      {statsError && (
        <div className="rounded-xl border border-red-200 px-4 py-3 text-sm text-red-700 bg-red-50 flex items-center gap-2">
          <FiAlertCircle /> {statsError}
        </div>
      )}

      {/* ── Stat Cards ── */}
      {statsLoading ? (
        <Loader skeleton rows={2} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(c => <StatCard key={c.label} {...c} />)}
        </div>
      )}

      {/* ── Daily Revenue (day-wise: consultation + lab + pharmacy) ── */}
      <DailyRevenueCard data={dailyRevenue} loading={dailyRevenueLoading} />

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Patient Queue (left 2/3) ── */}
        <div className="lg:col-span-2 card animate-fade-up stagger-3">
          {/* Header + filter tabs */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-base font-bold text-gray-900">Today's Patient Queue</h2>
            <div className="flex items-center gap-1 bg-gray-100 rounded-full p-0.5">
              {[
                { key: 'all',         label: 'All' },
                { key: 'waiting',     label: 'Waiting' },
                { key: 'in-progress', label: 'In Progress' },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={activeFilter === f.key ? 'filter-tab-active' : 'filter-tab'}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {queueLoading ? (
            <Loader label="Loading queue…" />
          ) : !queue || queue.length === 0 ? (
            <div className="py-12 text-center">
              <FiCalendar size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-500">No patients in queue</p>
              <p className="text-xs text-gray-400 mt-1">Appointments for today will appear here</p>
              <Link to="/appointments" className="btn-primary text-xs mt-4 inline-flex">
                Book Appointment
              </Link>
            </div>
          ) : (
            <div>
              {/* Table header */}
              <div className="grid grid-cols-12 gap-2 px-2 pb-2 border-b border-gray-100">
                <div className="col-span-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Patient</div>
                <div className="col-span-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Status</div>
                <div className="col-span-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Time</div>
                <div className="col-span-1" />
              </div>

              {/* Rows */}
              <div className="divide-y divide-gray-100">
                {queue.map((apt, idx) => {
                  const cfg      = STATUS_CFG[apt.status] || { label: apt.status, cls: 'status-scheduled' };
                  const clr      = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                  const name     = apt.patientId?.name || 'Patient';
                  const initials = getInitials(name);
                  const meta     = [
                    apt.patientId?.gender === 'male' ? 'Male' : apt.patientId?.gender === 'female' ? 'Female' : null,
                    apt.patientId?.age ? `${apt.patientId.age} yrs` : null,
                    `Token #${String(apt.tokenNumber || idx + 1).padStart(2,'0')}`,
                  ].filter(Boolean).join(' • ');

                  return (
                    <div
                      key={apt._id}
                      className={`grid grid-cols-12 gap-2 items-center px-2 py-3 rounded-lg transition-colors duration-150 animate-slide-in group
                        ${apt.status === 'in-progress' ? 'bg-green-50/60' : 'hover:bg-gray-50/80'}`}
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      {/* Patient */}
                      <div className="col-span-5 flex items-center gap-3">
                        <div
                          className="avatar text-sm font-bold flex-shrink-0"
                          style={{ background: clr.bg, color: clr.text, width: 38, height: 38, borderRadius: 9999 }}
                        >
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{name}</p>
                          <p className="text-[11px] text-gray-400 truncate">{meta}</p>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="col-span-4">
                        <span className={cfg.cls}>{cfg.label}</span>
                      </div>

                      {/* Time */}
                      <div className="col-span-2">
                        <span className="text-xs text-gray-500 font-medium">{fmtTime(apt.timeSlot)}</span>
                      </div>

                      {/* Actions */}
                      <div className="col-span-1 flex justify-end">
                        {apt.status === 'scheduled' || apt.status === 'confirmed' || apt.status === 'WAITING_FOR_DOCTOR' ? (
                          <button
                            onClick={() => startAppt(apt._id)}
                            title="Call In"
                            className="p-1.5 rounded-lg bg-teal-100 text-teal-700 hover:bg-teal-200 shadow-sm"
                          >
                            <FiPlay size={12} />
                          </button>
                        ) : apt.status === 'in-progress' || apt.status === 'IN_CONSULTATION' ? (
                          <button
                            onClick={() => completeAppt(apt._id)}
                            title="Mark Done"
                            className="p-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 shadow-sm"
                          >
                            <FiCheck size={12} />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                <Link to="/appointments" className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800 transition-colors">
                  View All Appointments <FiArrowUpRight size={12} />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ── Right Panel ── */}
        <div className="space-y-5">

          {/* Quick Actions */}
          <div className="card animate-fade-up stagger-3">
            <h2 className="text-base font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <QuickAction
                icon={FiFileText}
                label="New Rx"
                to="/prescriptions"
                colorCls="quick-action-teal"
                iconColor="#1a8c8c"
              />
              <QuickAction
                icon={FaFlask}
                label="Order Lab"
                to="/lab-tests"
                colorCls="quick-action-blue"
                iconColor="#0369a1"
              />
              <QuickAction
                icon={FaVideo}
                label="Teleconsult"
                to="/appointments"
                colorCls="quick-action-purple"
                iconColor="#6d28d9"
              />
              <QuickAction
                icon={FaRupeeSign}
                label="Invoice"
                to="/billing"
                colorCls="quick-action-orange"
                iconColor="#b45309"
              />
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div className="card animate-fade-up stagger-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-gray-900">Upcoming Appointments</h2>
              <Link to="/appointments" className="text-xs font-medium text-teal-700 hover:text-teal-800 transition-colors">
                View All
              </Link>
            </div>

            {upcoming.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-xs text-gray-400">No upcoming appointments</p>
              </div>
            ) : (
              <div>
                {upcoming.map((apt, idx) => {
                  const name = apt.patientId?.name || 'Patient';
                  const type = apt.type || 'Consultation';
                  return (
                    <UpcomingRow
                      key={apt._id}
                      time={apt.timeSlot}
                      name={name}
                      sub={`${type}${apt.patientId?.age ? ` • ${apt.patientId.age} yrs` : ''}`}
                      idx={idx}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Revenue Summary (compact) */}
          {revenue && (
            <div className="card animate-fade-up stagger-5">
              <h2 className="text-base font-bold text-gray-900 mb-3">Revenue</h2>
              <div className="space-y-2.5">
                {[
                  { label: 'Today',      value: revenue.today },
                  { label: 'This Week',  value: revenue.week },
                  { label: 'This Month', value: revenue.month },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{r.label}</span>
                    <span className="text-sm font-semibold text-gray-800 tabular-nums">
                      ₹{(r.value || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
                <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700">All Time</span>
                  <span className="text-base font-bold tabular-nums" style={{ color: 'var(--nav-bg)' }}>
                    ₹{(revenue.total || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
