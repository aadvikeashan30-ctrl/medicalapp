import React, { useState } from 'react';
import {
  FiCalendar, FiPlus, FiX, FiTrash2, FiClock, FiSun,
  FiCoffee, FiBriefcase, FiAlertTriangle, FiMapPin, FiUmbrella,
  FiSlash, FiCheckCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useApi } from '../hooks/useApi';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import ThreeDCard from '../components/ThreeDCard';

const REASONS = [
  { value: 'leave', label: 'On Leave', icon: FiUmbrella, color: 'text-blue-600 bg-blue-50' },
  { value: 'holiday', label: 'Holiday', icon: FiSun, color: 'text-amber-600 bg-amber-50' },
  { value: 'conference', label: 'Conference', icon: FiBriefcase, color: 'text-violet-600 bg-violet-50' },
  { value: 'personal', label: 'Personal', icon: FiMapPin, color: 'text-pink-600 bg-pink-50' },
  { value: 'break', label: 'Break', icon: FiCoffee, color: 'text-emerald-600 bg-emerald-50' },
  { value: 'emergency', label: 'Emergency', icon: FiAlertTriangle, color: 'text-red-600 bg-red-50' },
  { value: 'other', label: 'Other', icon: FiSlash, color: 'text-gray-600 bg-gray-50' }
];

const reasonMeta = (r) => REASONS.find((x) => x.value === r) || REASONS[0];

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

const todayStr = () => new Date().toISOString().slice(0, 10);

const emptyForm = {
  type: 'full-day',
  startDate: todayStr(),
  endDate: todayStr(),
  startTime: '13:00',
  endTime: '14:00',
  reason: 'leave',
  note: ''
};

export default function DoctorAvailability() {
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data, loading, refetch } = useApi('/availability?upcoming=true');
  const blocks = data?.blocks || [];

  const fullDayCount = blocks.filter((b) => b.type === 'full-day').length;
  const slotCount = blocks.filter((b) => b.type === 'slot').length;

  const openAdd = () => {
    setForm(emptyForm);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.startDate) return toast.error('Please pick a start date');
    if (form.type === 'full-day' && form.endDate < form.startDate) {
      return toast.error('End date cannot be before start date');
    }
    if (form.type === 'slot' && form.endTime <= form.startTime) {
      return toast.error('End time must be after start time');
    }

    setSaving(true);
    try {
      const payload = { ...form };
      if (payload.type === 'slot') payload.endDate = payload.startDate;
      const res = await api.post('/availability', payload);
      const affected = res.data?.affectedAppointments;
      toast.success(
        affected > 0
          ? `Block added — ${affected} existing appointment${affected > 1 ? 's' : ''} fall in this window`
          : 'Availability block added'
      );
      setShowModal(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add block');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this availability block? Patients will be able to book this time again.')) return;
    try {
      await api.delete(`/availability/${id}`);
      toast.success('Block removed');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
              <FiCalendar className="text-white text-lg" />
            </div>
            Availability & Leave
          </h1>
          <p className="text-sm text-gray-500 mt-1">Block off leave, holidays & breaks — the scheduler will stop accepting bookings for these times</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <FiPlus /> Block Time
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Upcoming Blocks', value: blocks.length, icon: FiCalendar, from: 'from-rose-500', to: 'to-pink-600', bg: 'from-rose-50 to-pink-50', border: 'border-rose-100' },
          { label: 'Full-Day / Leave', value: fullDayCount, icon: FiUmbrella, from: 'from-blue-500', to: 'to-indigo-600', bg: 'from-blue-50 to-indigo-50', border: 'border-blue-100' },
          { label: 'Slot Blocks', value: slotCount, icon: FiClock, from: 'from-emerald-500', to: 'to-teal-600', bg: 'from-emerald-50 to-teal-50', border: 'border-emerald-100' }
        ].map((s) => (
          <ThreeDCard key={s.label} intensity={8}>
            <div className={`p-5 bg-gradient-to-br ${s.bg} rounded-2xl border ${s.border}`}>
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 bg-gradient-to-br ${s.from} ${s.to} rounded-xl flex items-center justify-center shadow-lg`}>
                  <s.icon className="text-white text-lg" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </div>
            </div>
          </ThreeDCard>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <Loader label="Loading availability..." />
      ) : blocks.length === 0 ? (
        <EmptyState
          icon={FiCalendar}
          title="No blocks scheduled"
          message="Your calendar is fully open. Block time when you're on leave, attending events, or need a break."
          action={<button onClick={openAdd} className="btn-primary text-sm">Block Your First Time</button>}
        />
      ) : (
        <div className="space-y-3">
          {blocks.map((block, idx) => {
            const meta = reasonMeta(block.reason);
            const Icon = meta.icon;
            return (
              <div
                key={block._id}
                className="card flex items-center justify-between gap-4 group animate-slide-in"
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${meta.color}`}>
                    <Icon className="text-lg" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 dark:text-white capitalize">{meta.label}</h3>
                      <span className={`badge ${block.type === 'full-day' ? 'badge-info' : 'badge-success'}`}>
                        {block.type === 'full-day' ? 'Full Day' : 'Slot'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                      {block.type === 'full-day' ? (
                        block.startDate === block.endDate || fmtDate(block.startDate) === fmtDate(block.endDate)
                          ? fmtDate(block.startDate)
                          : `${fmtDate(block.startDate)} → ${fmtDate(block.endDate)}`
                      ) : (
                        <>
                          {fmtDate(block.startDate)}
                          <span className="text-gray-400"> · </span>
                          <span className="font-medium">{block.startTime} – {block.endTime}</span>
                        </>
                      )}
                    </p>
                    {block.note && <p className="text-xs text-gray-400 mt-0.5">{block.note}</p>}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(block._id)}
                  className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                  title="Remove block"
                >
                  <FiTrash2 className="text-sm" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg animate-scale-in max-h-[90vh] overflow-y-auto custom-scroll">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Block Time</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <FiX className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Type toggle */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Block Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'full-day', label: 'Full Day(s)', icon: FiSun },
                    { value: 'slot', label: 'Time Slot', icon: FiClock }
                  ].map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setForm({ ...form, type: t.value })}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        form.type === t.value
                          ? 'border-rose-400 bg-rose-50 text-rose-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <t.icon className="text-base" /> {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dates */}
              {form.type === 'full-day' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">From</label>
                    <input type="date" value={form.startDate} min={todayStr()} onChange={(e) => setForm({ ...form, startDate: e.target.value, endDate: e.target.value > form.endDate ? e.target.value : form.endDate })} className="input-field" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">To</label>
                    <input type="date" value={form.endDate} min={form.startDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="input-field" required />
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Date</label>
                    <input type="date" value={form.startDate} min={todayStr()} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="input-field" required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Start Time</label>
                      <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="input-field" required />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">End Time</label>
                      <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="input-field" required />
                    </div>
                  </div>
                </>
              )}

              {/* Reason */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Reason</label>
                <div className="flex flex-wrap gap-2">
                  {REASONS.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setForm({ ...form, reason: r.value })}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        form.reason === r.value ? 'border-rose-400 bg-rose-50 text-rose-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <r.icon className="text-sm" /> {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Note (optional)</label>
                <input type="text" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="input-field" placeholder="e.g. Out of town, Medical camp..." />
              </div>

              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <FiCheckCircle className="text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700">New bookings during this time will be automatically declined. Existing appointments are not cancelled — reschedule them manually if needed.</p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Saving...' : 'Add Block'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
