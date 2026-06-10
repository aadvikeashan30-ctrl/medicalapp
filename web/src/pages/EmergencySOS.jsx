import React, { useState } from 'react';
import {
  FiAlertOctagon, FiPlus, FiX, FiPhone, FiMapPin, FiCheckCircle,
  FiClock, FiActivity, FiTruck, FiHeart
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useApi } from '../hooks/useApi';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';

const TYPES = {
  cardiac: { label: 'Cardiac', icon: FiHeart }, fall: { label: 'Fall', icon: FiActivity },
  breathing: { label: 'Breathing', icon: FiActivity }, accident: { label: 'Accident', icon: FiTruck },
  'severe-pain': { label: 'Severe Pain', icon: FiActivity }, other: { label: 'Other', icon: FiAlertOctagon }
};
const FLOW = ['active', 'acknowledged', 'dispatched', 'resolved'];
const statusColor = { active: 'bg-red-500', acknowledged: 'bg-amber-500', dispatched: 'bg-blue-500', resolved: 'bg-emerald-500' };
const since = (d) => { const m = Math.floor((Date.now() - new Date(d)) / 60000); return m < 60 ? `${m}m ago` : `${Math.floor(m / 60)}h ago`; };
const empty = { patientName: '', patientPhone: '', type: 'cardiac', location: '', note: '' };


export default function EmergencySOS() {
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(empty);

  const { data, loading, refetch } = useApi('/sos');
  const { data: statsData, refetch: refetchStats } = useApi('/sos/stats/summary');
  const alerts = data?.alerts || [];
  const stats = statsData || { active: 0, resolved: 0, total: 0 };
  const reload = () => { refetch(); refetchStats(); };

  const raise = async (e) => {
    e.preventDefault();
    if (!form.patientName.trim()) return toast.error('Patient name is required');
    setSaving(true);
    try {
      await api.post('/sos', form);
      toast.success('SOS alert raised');
      setShowModal(false); setForm(empty); reload();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const advance = async (a) => {
    const next = FLOW[Math.min(FLOW.indexOf(a.status) + 1, FLOW.length - 1)];
    try { await api.put(`/sos/${a._id}/status`, { status: next }); toast.success(`Marked ${next}`); reload(); }
    catch (e) { toast.error('Failed'); }
  };

  return (
    <div className="page-enter space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center"><FiAlertOctagon className="text-white text-lg" /></div>
            Emergency SOS
          </h1>
          <p className="text-sm text-gray-500 mt-1">Triage and dispatch urgent patient alerts in real time</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg hover:shadow-red-300 flex items-center gap-2"><FiPlus /> Raise SOS</button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active', value: stats.active, color: 'from-red-500 to-rose-600', bg: 'from-red-50 to-rose-50', border: 'border-red-100' },
          { label: 'Resolved', value: stats.resolved, color: 'from-emerald-500 to-teal-600', bg: 'from-emerald-50 to-teal-50', border: 'border-emerald-100' },
          { label: 'Total', value: stats.total, color: 'from-slate-500 to-gray-700', bg: 'from-gray-50 to-slate-50', border: 'border-gray-100' }
        ].map((s) => (
          <div key={s.label} className={`p-5 bg-gradient-to-br ${s.bg} rounded-2xl border ${s.border}`}>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <Loader label="Loading alerts..." />
      ) : alerts.length === 0 ? (
        <EmptyState icon={FiCheckCircle} title="No active emergencies" message="All clear. SOS alerts raised by patients or staff will appear here for triage." />
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => {
            const t = TYPES[a.type] || TYPES.other;
            const TIcon = t.icon;
            return (
              <div key={a._id} className={`card border-l-4 ${a.status === 'active' ? 'border-l-red-500 animate-pulse-subtle' : 'border-l-gray-200'}`} style={a.status === 'active' ? { boxShadow: '0 0 0 1px rgba(239,68,68,0.15)' } : {}}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white ${statusColor[a.status]}`}><TIcon className="text-lg" /></div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{a.patientName}</h3>
                        <span className="badge badge-danger">{t.label}</span>
                        <span className="text-xs text-gray-400 flex items-center gap-1"><FiClock className="text-[10px]" /> {since(a.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-500 flex items-center gap-3 mt-0.5 flex-wrap">
                        {a.patientPhone && <span className="flex items-center gap-1"><FiPhone className="text-xs" /> {a.patientPhone}</span>}
                        {a.location && <span className="flex items-center gap-1"><FiMapPin className="text-xs" /> {a.location}</span>}
                      </p>
                      {a.note && <p className="text-xs text-gray-400 mt-0.5">{a.note}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-bold text-white px-2 py-1 rounded-full ${statusColor[a.status]} capitalize`}>{a.status}</span>
                    {a.status !== 'resolved' && (
                      <button onClick={() => advance(a)} className="btn-secondary !py-1.5 !px-3 text-xs">
                        {a.status === 'active' ? 'Acknowledge' : a.status === 'acknowledged' ? 'Dispatch' : 'Resolve'}
                      </button>
                    )}
                  </div>
                </div>
                {/* progress */}
                <div className="flex items-center gap-1 mt-3">
                  {FLOW.map((s, i) => (
                    <div key={s} className={`h-1.5 flex-1 rounded-full ${FLOW.indexOf(a.status) >= i ? statusColor[a.status] : 'bg-gray-100'}`} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Raise Emergency SOS</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><FiX className="text-gray-500" /></button>
            </div>
            <form onSubmit={raise} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Patient Name *</label><input value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} className="input-field" required /></div>
                <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Phone</label><input value={form.patientPhone} onChange={(e) => setForm({ ...form, patientPhone: e.target.value })} className="input-field" /></div>
              </div>
              <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Emergency Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input-field">
                  {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Location</label><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input-field" placeholder="Address / ward" /></div>
              <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Note</label><textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={2} className="input-field" placeholder="Symptoms / details" /></div>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold px-4 py-2 rounded-xl">{saving ? 'Raising...' : 'Raise Alert'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
