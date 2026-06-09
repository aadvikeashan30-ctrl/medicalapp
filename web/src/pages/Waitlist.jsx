import React, { useState } from 'react';
import {
  FiUsers, FiPlus, FiX, FiTrash2, FiSend, FiZap, FiClock,
  FiCheckCircle, FiBell, FiPhone, FiStar, FiActivity
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useApi } from '../hooks/useApi';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import ThreeDCard from '../components/ThreeDCard';

const statusConfig = {
  waiting: { label: 'Waiting', class: 'badge-info' },
  notified: { label: 'Notified', class: 'badge-warning' },
  booked: { label: 'Booked', class: 'badge-success' },
  expired: { label: 'Expired', class: 'badge-gray' },
  cancelled: { label: 'Cancelled', class: 'badge-danger' }
};

const priorityConfig = {
  high: { label: 'High', class: 'text-red-600 bg-red-50 border-red-100' },
  normal: { label: 'Normal', class: 'text-gray-600 bg-gray-50 border-gray-100' },
  low: { label: 'Low', class: 'text-gray-500 bg-gray-50 border-gray-100' }
};

const emptyForm = { patientName: '', patientPhone: '', service: 'consultation', priority: 'normal', preferredDate: '', note: '' };

export default function Waitlist() {
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [filling, setFilling] = useState(false);

  const { data, loading, refetch } = useApi('/waitlist');
  const { data: statsData, refetch: refetchStats } = useApi('/waitlist/stats/summary');
  const entries = data?.entries || [];
  const stats = statsData || { waiting: 0, notified: 0, booked: 0, high: 0 };

  const reload = () => { refetch(); refetchStats(); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patientName.trim() || !form.patientPhone.trim()) return toast.error('Name and phone are required');
    setSaving(true);
    try {
      await api.post('/waitlist', form);
      toast.success('Added to waitlist');
      setShowModal(false);
      setForm(emptyForm);
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add');
    } finally {
      setSaving(false);
    }
  };

  const notifyOne = async (entry) => {
    try {
      await api.post(`/waitlist/${entry._id}/notify`, {});
      toast.success(`${entry.patientName} notified`);
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const fillAll = async () => {
    setFilling(true);
    try {
      const res = await api.post('/waitlist/fill', { limit: 5 });
      toast.success(res.data?.message || 'Waitlist notified');
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setFilling(false);
    }
  };

  const markBooked = async (entry) => {
    try {
      await api.put(`/waitlist/${entry._id}`, { status: 'booked' });
      toast.success('Marked as booked');
      reload();
    } catch (err) {
      toast.error('Failed');
    }
  };

  const remove = async (id) => {
    if (!confirm('Remove from waitlist?')) return;
    try {
      await api.delete(`/waitlist/${id}`);
      toast.success('Removed');
      reload();
    } catch (err) {
      toast.error('Failed');
    }
  };

  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <FiUsers className="text-white text-lg" />
            </div>
            Waitlist Auto-Fill
          </h1>
          <p className="text-sm text-gray-500 mt-1">Fill cancelled & no-show slots instantly — keep high-value appointments and equipment in use</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fillAll} disabled={filling || stats.waiting === 0} className="btn-secondary flex items-center gap-2">
            <FiZap /> {filling ? 'Notifying...' : 'Notify Waiting'}
          </button>
          <button onClick={() => { setForm(emptyForm); setShowModal(true); }} className="btn-primary flex items-center gap-2">
            <FiPlus /> Add to Waitlist
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Waiting', value: stats.waiting, icon: FiClock, from: 'from-blue-500', to: 'to-indigo-600', bg: 'from-blue-50 to-indigo-50', border: 'border-blue-100' },
          { label: 'Notified', value: stats.notified, icon: FiBell, from: 'from-amber-500', to: 'to-orange-600', bg: 'from-amber-50 to-orange-50', border: 'border-amber-100' },
          { label: 'Booked', value: stats.booked, icon: FiCheckCircle, from: 'from-emerald-500', to: 'to-teal-600', bg: 'from-emerald-50 to-teal-50', border: 'border-emerald-100' },
          { label: 'High Priority', value: stats.high, icon: FiStar, from: 'from-rose-500', to: 'to-red-600', bg: 'from-rose-50 to-red-50', border: 'border-rose-100' }
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
        <Loader label="Loading waitlist..." />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={FiUsers}
          title="Waitlist is empty"
          message="Add patients waiting for high-demand slots (MRI, CT, specialist visits). When a slot frees up, notify them in one tap."
          action={<button onClick={() => setShowModal(true)} className="btn-primary text-sm">Add First Patient</button>}
        />
      ) : (
        <div className="space-y-3">
          {entries.map((entry, idx) => {
            const sc = statusConfig[entry.status] || statusConfig.waiting;
            const pc = priorityConfig[entry.priority] || priorityConfig.normal;
            return (
              <div
                key={entry._id}
                className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4 group animate-slide-in"
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                    <FiActivity className="text-orange-600 text-lg" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{entry.patientName}</h3>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${pc.class}`}>{pc.label}</span>
                      <span className="badge badge-primary capitalize">{entry.service}</span>
                    </div>
                    <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                      <FiPhone className="text-xs" /> {entry.patientPhone}
                      {entry.notifyCount > 0 && <span className="text-xs text-gray-400">· notified {entry.notifyCount}x</span>}
                    </p>
                    {entry.note && <p className="text-xs text-gray-400 mt-0.5">{entry.note}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${sc.class}`}>{sc.label}</span>
                  {entry.status !== 'booked' && (
                    <button onClick={() => notifyOne(entry)} className="p-2 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors" title="Notify of open slot">
                      <FiSend className="text-sm" />
                    </button>
                  )}
                  {entry.status === 'notified' && (
                    <button onClick={() => markBooked(entry)} className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors" title="Mark booked">
                      <FiCheckCircle className="text-sm" />
                    </button>
                  )}
                  <button onClick={() => remove(entry._id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-all" title="Remove">
                    <FiTrash2 className="text-sm" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Add to Waitlist</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><FiX className="text-gray-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Patient Name *</label>
                  <input value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} className="input-field" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Phone *</label>
                  <input value={form.patientPhone} onChange={(e) => setForm({ ...form, patientPhone: e.target.value })} className="input-field" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Service</label>
                  <input value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} className="input-field" placeholder="e.g. MRI, consultation" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="input-field">
                    <option value="high">High</option>
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Preferred Date (optional)</label>
                <input type="date" value={form.preferredDate} onChange={(e) => setForm({ ...form, preferredDate: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Note</label>
                <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="input-field" placeholder="e.g. Flexible timing, prefers mornings" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Adding...' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
