import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiUsers, FiCalendar, FiTrendingUp, FiClock,
  FiAlertCircle, FiUserPlus, FiActivity, FiDollarSign, FiRefreshCw,
  FiArrowUpRight, FiCheckCircle, FiArrowUp, FiPlay, FiCheck
} from 'react-icons/fi';
import { FaWhatsapp, FaRupeeSign } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useApi } from '../hooks/useApi';
import api from '../utils/api';
import { getUser } from '../utils/auth';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import RevenueChart from '../components/RevenueChart';
import WelcomeHero from '../components/WelcomeHero';
import AnimatedCounter from '../components/AnimatedCounter';
import ProfitLossWidget from '../components/ProfitLossWidget';
import TodayScheduleWidget from '../components/TodayScheduleWidget';

const greetingForHour = (h) => (h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening');

// Daily Revenue Target component
function DailyRevenueTarget({ todayRevenue, target }) {
  const percent = Math.min(100, Math.round((todayRevenue / target) * 100));
  const isAchieved = percent >= 100;

  return (
    <div className={`p-3 rounded-xl border ${isAchieved ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-100'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-600">
          {isAchieved ? '🎉 Target Achieved!' : 'Daily Target'}
        </span>
        <span className={`text-xs font-bold ${isAchieved ? 'text-emerald-600' : 'text-indigo-600'}`}>
          {percent}%
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${isAchieved ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-gradient-to-r from-indigo-400 to-indigo-600'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-[11px] text-gray-500 mt-1.5">
        ₹{todayRevenue.toLocaleString('en-IN')} of ₹{target.toLocaleString('en-IN')} goal
      </p>
    </div>
  );
}

const statusColors = {
  completed: 'badge-success',
  'in-progress': 'badge-info',
  scheduled: 'badge-primary',
  confirmed: 'badge-primary',
  cancelled: 'badge-danger'
};

export default function Dashboard() {
  const user = getUser();
  const [greeting, setGreeting] = useState('');
  const [sendingReminders, setSendingReminders] = useState(false);

  useEffect(() => setGreeting(greetingForHour(new Date().getHours())), []);

  const { data: stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useApi('/dashboard/stats');
  const { data: queue, loading: queueLoading, refetch: refetchQueue } = useApi('/appointments/queue/today');
  const { data: analytics } = useApi('/dashboard/analytics');
  const { data: revenue } = useApi('/billing/revenue/summary');

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
      await api.put(`/appointments/${id}`, { status: 'in-progress' });
      refetchQueue();
      refetchStats();
      toast.success('Patient called in');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const completeAppt = async (id) => {
    try {
      await api.put(`/appointments/${id}`, { status: 'completed' });
      refetchQueue();
      refetchStats();
      toast.success('Appointment completed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const statCards = [
    {
      icon: FiUsers,
      label: 'Total Patients',
      value: stats?.totalPatients ?? 0,
      sub: stats?.newPatientsThisMonth ? `+${stats.newPatientsThisMonth} this month` : null,
      gradient: 'from-indigo-500 to-purple-600',
      glow: '--glow-primary',
      iconGlow: 'glow-indigo'
    },
    {
      icon: FiCalendar,
      label: "Today's Appointments",
      value: stats?.todayAppointments ?? 0,
      sub: stats?.todayCompleted ? `${stats.todayCompleted} completed` : null,
      gradient: 'from-cyan-500 to-blue-600',
      glow: '--glow-cyan',
      iconGlow: 'glow-cyan'
    },
    {
      icon: FaRupeeSign,
      label: 'Monthly Revenue',
      value: stats?.monthRevenue ?? 0,
      isRevenue: true,
      sub: revenue?.today ? `₹${revenue.today.toLocaleString('en-IN')} today` : null,
      gradient: 'from-emerald-500 to-teal-600',
      glow: '--glow-emerald',
      iconGlow: 'glow-emerald'
    },
    {
      icon: FiAlertCircle,
      label: 'Pending Payments',
      value: stats?.pendingPayments ?? 0,
      sub: 'Requires follow-up',
      gradient: 'from-amber-500 to-orange-600',
      glow: '--glow-amber',
      iconGlow: 'glow-amber'
    }
  ];

  return (
    <div className="space-y-6 page-enter">
      {/* Welcome Hero */}
      <WelcomeHero greeting={greeting} doctorName={user.name || 'Doctor'} stats={stats} />

      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-2 animate-fade-up" style={{ animationDelay: '100ms' }}>
        <button
          onClick={() => { refetchStats(); refetchQueue(); toast.success('Refreshed'); }}
          className="btn-ghost text-sm !py-2 !px-3"
        >
          <FiRefreshCw className="text-sm" /> Refresh
        </button>
        <Link to="/patients" className="btn-primary text-sm !py-2 !px-4">
          <FiUserPlus className="text-sm" /> New Patient
        </Link>
        <button
          onClick={sendReminders}
          disabled={sendingReminders}
          className="btn-success text-sm !py-2 !px-4"
        >
          <FaWhatsapp />
          {sendingReminders ? 'Sending...' : 'Send Reminders'}
        </button>
      </div>

      {/* Error */}
      {statsError && (
        <div className="rounded-xl border border-rose-200 px-4 py-3 text-sm text-rose-700 bg-rose-50 flex items-center gap-2">
          <FiAlertCircle /> {statsError}
        </div>
      )}

      {/* ═══════ STAT CARDS ═══════ */}
      {statsLoading ? (
        <Loader skeleton rows={3} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((c, idx) => (
            <div
              key={c.label}
              className="stat-card card-3d border-gradient-animated animate-fade-up"
              style={{ animationDelay: `${(idx + 1) * 100}ms` }}
            >
              {/* Gradient icon with 3D glow */}
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center ${c.iconGlow} mb-4 icon-3d`}>
                <c.icon className="text-white text-xl" />
              </div>

              {/* Value */}
              <p className="text-3xl font-bold text-gray-900 tabular-nums animate-counter">
                {c.isRevenue ? (
                  <><span className="text-xl opacity-60">₹</span><AnimatedCounter end={Number(c.value || 0)} /></>
                ) : (
                  <AnimatedCounter end={c.value} />
                )}
              </p>
              <p className="text-sm text-gray-600 mt-1">{c.label}</p>

              {/* Sub info */}
              {c.sub && (
                <div className="flex items-center gap-1.5 mt-3 text-xs font-medium text-emerald-600">
                  <FiArrowUp className="text-[10px]" />
                  <span>{c.sub}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ═══════ MAIN GRID ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Queue - 2 columns */}
        <div className="lg:col-span-2 card animate-fade-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Queue
              {queue && queue.length > 0 && (
                <span className="badge badge-primary ml-2">{queue.length}</span>
              )}
            </h3>
            <Link to="/appointments" className="text-sm text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-1 transition-colors">
              View All <FiArrowUpRight className="text-xs" />
            </Link>
          </div>

          {queueLoading ? (
            <Loader label="Loading queue..." />
          ) : !queue || queue.length === 0 ? (
            <EmptyState
              icon={FiCalendar}
              title="No patients in queue"
              message="Appointments for today will appear here."
              action={<Link to="/appointments" className="btn-primary text-sm !py-2">Book Appointment</Link>}
            />
          ) : (
            <div className="space-y-2">
              {queue.map((apt, idx) => (
                <div
                  key={apt._id}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300 group animate-slide-in ${
                    apt.status === 'in-progress'
                      ? 'border-cyan-200 bg-cyan-50'
                      : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50'
                  }`}
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <div className="flex items-center gap-3">
                    {/* Token */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold ${
                      apt.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : apt.status === 'in-progress'
                        ? 'bg-cyan-50 text-cyan-600 border border-cyan-200'
                        : 'bg-gray-50 text-gray-600 border border-gray-200'
                    }`}>
                      {apt.status === 'completed' ? <FiCheckCircle /> : `#${apt.tokenNumber}`}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{apt.patientId?.name || 'Patient'}</p>
                      <p className="text-xs text-gray-500">{apt.timeSlot} · {apt.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${statusColors[apt.status] || 'badge-info'}`}>
                      {apt.status === 'in-progress' ? 'In Progress' : apt.status?.charAt(0).toUpperCase() + apt.status?.slice(1)}
                    </span>
                    {apt.status === 'scheduled' && (
                      <button
                        onClick={() => startAppt(apt._id)}
                        className="opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg border border-indigo-200"
                      >
                        <FiPlay className="text-[10px]" /> Call In
                      </button>
                    )}
                    {apt.status === 'in-progress' && (
                      <button
                        onClick={() => completeAppt(apt._id)}
                        className="opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg border border-emerald-200"
                      >
                        <FiCheck className="text-[10px]" /> Done
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="card animate-fade-up" style={{ animationDelay: '400ms' }}>
            <h3 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2.5">
              <Link to="/patients" className="quick-action-btn card-3d-left">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center icon-3d">
                  <FiUserPlus className="text-white text-sm" />
                </div>
                <span className="text-xs font-medium text-gray-600">Add Patient</span>
              </Link>
              <Link to="/appointments" className="quick-action-btn card-3d-right">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center icon-3d">
                  <FiCalendar className="text-white text-sm" />
                </div>
                <span className="text-xs font-medium text-gray-600">Book Appt</span>
              </Link>
              <Link to="/prescriptions" className="quick-action-btn card-3d-left">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center icon-3d">
                  <FiActivity className="text-white text-sm" />
                </div>
                <span className="text-xs font-medium text-gray-600">Prescribe</span>
              </Link>
              <Link to="/billing" className="quick-action-btn card-3d-right">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center icon-3d">
                  <FiDollarSign className="text-white text-sm" />
                </div>
                <span className="text-xs font-medium text-gray-600">Create Bill</span>
              </Link>
            </div>
          </div>

          {/* Revenue Summary + Daily Target */}
          {revenue && (
            <div className="card animate-fade-up" style={{ animationDelay: '500ms' }}>
              <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiTrendingUp className="text-emerald-500" /> Revenue
              </h3>

              {/* Daily Revenue Target Progress */}
              <DailyRevenueTarget todayRevenue={revenue.today || 0} target={user.consultationFee ? user.consultationFee * 10 : 5000} />

              <div className="space-y-3 mt-4">
                {[
                  { label: 'Today', value: revenue.today },
                  { label: 'This Week', value: revenue.week },
                  { label: 'This Month', value: revenue.month },
                ].map((r) => (
                  <div key={r.label} className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{r.label}</span>
                    <span className="text-sm font-semibold text-gray-900 tabular-nums">₹{(r.value || 0).toLocaleString('en-IN')}</span>
                  </div>
                ))}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">All Time</span>
                  <span className="text-lg font-bold text-indigo-600 tabular-nums">₹{(revenue.total || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════ CHARTS ROW ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card animate-fade-up" style={{ animationDelay: '600ms' }}>
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiTrendingUp className="text-indigo-500" /> Revenue Trend
          </h3>
          <RevenueChart monthly={analytics?.monthlyRevenue || []} />
        </div>
        <ProfitLossWidget />
      </div>

      {/* Today Schedule */}
      <TodayScheduleWidget />
    </div>
  );
}
