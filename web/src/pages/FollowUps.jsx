import React, { useState, useMemo } from 'react';
import {
  FiClock, FiPhone, FiCalendar, FiCheckCircle, FiAlertCircle,
  FiUser, FiArrowRight, FiFilter, FiSearch, FiBell
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useApi } from '../hooks/useApi';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import ThreeDCard from '../components/ThreeDCard';

function getDaysDiff(dateStr) {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
  return diff;
}

function getUrgencyClass(days) {
  if (days === null) return 'badge-blue';
  if (days < 0) return 'badge-red';
  if (days === 0) return 'badge-amber';
  if (days <= 3) return 'badge-amber';
  return 'badge-green';
}

function getUrgencyLabel(days) {
  if (days === null) return 'No date';
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
}

export default function FollowUps() {
  const [filter, setFilter] = useState('upcoming');
  const [search, setSearch] = useState('');

  const { data, loading, refetch } = useApi('/prescriptions?limit=200');
  const prescriptions = data?.prescriptions || [];

  // Extract follow-ups from prescriptions
  const followUps = useMemo(() => {
    return prescriptions
      .filter(rx => rx.followUpDate)
      .map(rx => {
        const days = getDaysDiff(rx.followUpDate);
        return {
          ...rx,
          daysDiff: days,
          urgency: days < 0 ? 'overdue' : days === 0 ? 'today' : days <= 3 ? 'soon' : 'upcoming'
        };
      })
      .sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate));
  }, [prescriptions]);

  const filtered = useMemo(() => {
    let list = followUps;
    if (filter === 'overdue') list = list.filter(f => f.daysDiff < 0);
    else if (filter === 'today') list = list.filter(f => f.daysDiff === 0);
    else if (filter === 'upcoming') list = list.filter(f => f.daysDiff >= 0);
    else if (filter === 'all') list = followUps;

    if (search) {
      const s = search.toLowerCase();
      list = list.filter(f =>
        f.patientId?.name?.toLowerCase().includes(s) ||
        f.diagnosis?.toLowerCase().includes(s)
      );
    }
    return list;
  }, [followUps, filter, search]);

  const stats = {
    overdue: followUps.filter(f => f.daysDiff < 0).length,
    today: followUps.filter(f => f.daysDiff === 0).length,
    thisWeek: followUps.filter(f => f.daysDiff >= 0 && f.daysDiff <= 7).length,
    total: followUps.length
  };

  const sendReminder = async (rx) => {
    if (!rx.patientId?.phone) return toast.error('Patient has no phone number');
    try {
      await api.post('/whatsapp/send', {
        phone: rx.patientId.phone,
        message: `Hello ${rx.patientId.name}, this is a reminder for your follow-up appointment scheduled for ${new Date(rx.followUpDate).toLocaleDateString('en-IN')}. Please book your appointment or contact the clinic. Thank you!`
      });
      toast.success('Follow-up reminder sent via WhatsApp');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send');
    }
  };

  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center glow-pink">
              <FiBell className="text-white text-lg" />
            </div>
            Follow-up Tracker
          </h1>
          <p className="text-sm text-gray-500 mt-1 ml-[52px]">Never miss a patient follow-up. Auto-tracked from prescriptions.</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <ThreeDCard intensity={8}>
          <div className="p-4 bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl border border-red-100 cursor-pointer" onClick={() => setFilter('overdue')}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg">
                <FiAlertCircle className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.overdue}</p>
                <p className="text-xs text-gray-500">Overdue</p>
              </div>
            </div>
          </div>
        </ThreeDCard>

        <ThreeDCard intensity={8}>
          <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-100 cursor-pointer" onClick={() => setFilter('today')}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <FiClock className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.today}</p>
                <p className="text-xs text-gray-500">Today</p>
              </div>
            </div>
          </div>
        </ThreeDCard>

        <ThreeDCard intensity={8}>
          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 cursor-pointer" onClick={() => setFilter('upcoming')}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <FiCalendar className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.thisWeek}</p>
                <p className="text-xs text-gray-500">This Week</p>
              </div>
            </div>
          </div>
        </ThreeDCard>

        <ThreeDCard intensity={8}>
          <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 cursor-pointer" onClick={() => setFilter('all')}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <FiCheckCircle className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
            </div>
          </div>
        </ThreeDCard>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient name or diagnosis..."
            className="input-field !pl-10"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'overdue', 'today', 'upcoming'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Follow-up List */}
      {loading ? (
        <Loader label="Loading follow-ups..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FiCalendar}
          title="No follow-ups found"
          message={filter === 'all'
            ? 'Create prescriptions with follow-up dates to track them here automatically.'
            : 'No follow-ups match this filter.'}
          action={filter !== 'all' && (
            <button onClick={() => setFilter('all')} className="btn-secondary text-sm">Show All</button>
          )}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((rx, idx) => {
            const urgencyClass = getUrgencyClass(rx.daysDiff);
            const urgencyLabel = getUrgencyLabel(rx.daysDiff);
            return (
              <div
                key={rx._id}
                className={`card !p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group animate-slide-in ${
                  rx.daysDiff < 0 ? 'border-l-4 border-l-red-400' :
                  rx.daysDiff === 0 ? 'border-l-4 border-l-amber-400' :
                  'border-l-4 border-l-blue-200'
                }`}
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm ${
                    rx.daysDiff < 0 ? 'bg-red-100 text-red-700' :
                    rx.daysDiff === 0 ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {rx.patientId?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Link to={`/patients/${rx.patientId?._id}`} className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 transition-colors">
                        {rx.patientId?.name || 'Unknown'}
                      </Link>
                      <span className={`badge ${urgencyClass}`}>{urgencyLabel}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {rx.diagnosis || 'No diagnosis'} •
                      Follow-up: {new Date(rx.followUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    {rx.patientId?.phone && (
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <FiPhone className="text-[10px]" /> {rx.patientId.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => sendReminder(rx)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 text-xs font-medium transition-colors"
                    title="Send WhatsApp Reminder"
                  >
                    <FaWhatsapp /> Remind
                  </button>
                  <Link
                    to="/appointments"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-medium transition-colors"
                  >
                    <FiCalendar className="text-[11px]" /> Book
                  </Link>
                  <Link
                    to={`/patients/${rx.patientId?._id}`}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <FiArrowRight className="text-sm" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
