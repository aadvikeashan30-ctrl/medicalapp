import React, { useState } from 'react';
import {
  FiActivity, FiPlus, FiX, FiClock, FiTrendingUp, FiHeart,
  FiWifi, FiCheckCircle, FiPlusCircle, FiUser, FiTrash2
} from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useApi } from '../hooks/useApi';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import ThreeDCard from '../components/ThreeDCard';
import PatientSearchSelect from '../components/PatientSearchSelect';

const inr = (n) => `\u20b9${Number(n || 0).toLocaleString('en-IN')}`;

const DEVICES = [
  { value: 'bp-cuff', label: 'BP Cuff' },
  { value: 'cgm', label: 'CGM (Glucose)' },
  { value: 'weight-scale', label: 'Weight Scale' },
  { value: 'pulse-ox', label: 'Pulse Oximeter' },
  { value: 'spirometer', label: 'Spirometer' },
  { value: 'ecg', label: 'ECG' },
  { value: 'other', label: 'Other' }
];


export default function RPMTracker() {
  const [showEnroll, setShowEnroll] = useState(false);
  const [logFor, setLogFor] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ patientId: '', deviceType: 'bp-cuff', condition: '' });
  const [logForm, setLogForm] = useState({ minutes: '', readings: '', note: '' });

  const { data, loading, refetch } = useApi('/rpm');
  const { data: statsData, refetch: refetchStats } = useApi('/rpm/stats/summary');
  const { data: patients } = useApi('/patients?limit=200');
  const records = data?.records || [];
  const stats = statsData || { enrolled: 0, active: 0, totalMinutes: 0, estimatedReimbursement: 0, readyToBill: 0 };

  const reload = () => { refetch(); refetchStats(); };

  const enroll = async (e) => {
    e.preventDefault();
    if (!form.patientId) return toast.error('Select a patient');
    setSaving(true);
    try {
      await api.post('/rpm', form);
      toast.success('Patient enrolled in RPM');
      setShowEnroll(false);
      setForm({ patientId: '', deviceType: 'bp-cuff', condition: '' });
      reload();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const submitLog = async (e) => {
    e.preventDefault();
    if (!logForm.minutes && !logForm.readings) return toast.error('Enter minutes or readings');
    setSaving(true);
    try {
      await api.post(`/rpm/${logFor._id}/log`, { minutes: Number(logForm.minutes || 0), readings: Number(logForm.readings || 0), note: logForm.note });
      toast.success('Monitoring time logged');
      setLogFor(null);
      setLogForm({ minutes: '', readings: '', note: '' });
      reload();
    } catch (err) { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  const removeRecord = async (id) => {
    if (!confirm('Remove this RPM enrollment?')) return;
    try { await api.delete(`/rpm/${id}`); toast.success('Removed'); reload(); }
    catch (err) { toast.error('Failed'); }
  };


  return (
    <div className="page-enter space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <FiWifi className="text-white text-lg" />
            </div>
            RPM Reimbursement
          </h1>
          <p className="text-sm text-gray-500 mt-1">Track remote monitoring minutes & transmissions, auto-derive billable CPT codes</p>
        </div>
        <button onClick={() => setShowEnroll(true)} className="btn-primary flex items-center gap-2"><FiPlus /> Enroll Patient</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Enrolled', value: stats.enrolled, icon: FiUser, grad: 'from-blue-500 to-cyan-600', bg: 'from-blue-50 to-cyan-50', border: 'border-blue-100' },
          { label: 'Active', value: stats.active, icon: FiActivity, grad: 'from-emerald-500 to-teal-600', bg: 'from-emerald-50 to-teal-50', border: 'border-emerald-100' },
          { label: 'Monitoring Min (mo)', value: stats.totalMinutes, icon: FiClock, grad: 'from-violet-500 to-purple-600', bg: 'from-violet-50 to-purple-50', border: 'border-violet-100' },
          { label: 'Est. Reimbursement', value: inr(stats.estimatedReimbursement), icon: FaRupeeSign, grad: 'from-amber-500 to-orange-600', bg: 'from-amber-50 to-orange-50', border: 'border-amber-100' }
        ].map((s) => (
          <ThreeDCard key={s.label} intensity={8}>
            <div className={`p-5 bg-gradient-to-br ${s.bg} rounded-2xl border ${s.border}`}>
              <div className={`w-11 h-11 bg-gradient-to-br ${s.grad} rounded-xl flex items-center justify-center shadow-lg mb-3`}><s.icon className="text-white text-lg" /></div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          </ThreeDCard>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <Loader label="Loading RPM patients..." />
      ) : records.length === 0 ? (
        <EmptyState icon={FiWifi} title="No RPM enrollments" message="Enroll chronic-care patients on connected devices to log monitoring time and claim reimbursement."
          action={<button onClick={() => setShowEnroll(true)} className="btn-primary text-sm">Enroll First Patient</button>} />
      ) : (
        <div className="space-y-3">
          {records.map((r) => {
            const b = r.billing || { minutes: 0, daysTransmitted: 0, codes: [], estimatedReimbursement: 0 };
            return (
              <div key={r._id} className="card group">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center"><FiHeart className="text-blue-600 text-lg" /></div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{r.patientName || r.patientId?.name}</h3>
                        <span className="badge badge-primary">{(DEVICES.find((d) => d.value === r.deviceType) || {}).label || r.deviceType}</span>
                        <span className={`badge ${r.status === 'active' ? 'badge-success' : 'badge-gray'}`}>{r.status}</span>
                      </div>
                      <p className="text-sm text-gray-500">{r.condition || 'Chronic care'} · {b.minutes} min · {b.daysTransmitted} days transmitted</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-bold text-emerald-600">{inr(b.estimatedReimbursement)}</span>
                    <button onClick={() => setLogFor(r)} className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1"><FiPlusCircle /> Log</button>
                    <button onClick={() => removeRecord(r._id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-all"><FiTrash2 className="text-sm" /></button>
                  </div>
                </div>
                {b.codes.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-2">
                    {b.codes.map((c) => (
                      <span key={c.code} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-xs" title={c.label}>
                        <FiCheckCircle className="text-emerald-500" /> <span className="font-bold text-emerald-700">{c.code}</span>
                        <span className="text-gray-500">{c.units > 1 ? `x${c.units} · ` : ''}{inr(c.rate * c.units)}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Enroll Modal */}
      {showEnroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Enroll in RPM</h2>
              <button onClick={() => setShowEnroll(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><FiX className="text-gray-500" /></button>
            </div>
            <form onSubmit={enroll} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Patient *</label>
                <PatientSearchSelect patients={(patients?.patients || patients || [])} value={form.patientId} onChange={(id) => setForm({ ...form, patientId: id })} placeholder="Search patient..." required />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Device</label>
                <select value={form.deviceType} onChange={(e) => setForm({ ...form, deviceType: e.target.value })} className="input-field">
                  {DEVICES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Condition</label>
                <input value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} className="input-field" placeholder="e.g. Hypertension" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowEnroll(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Enrolling...' : 'Enroll'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Time Modal */}
      {logFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Log Monitoring · {logFor.patientName || logFor.patientId?.name}</h2>
              <button onClick={() => setLogFor(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><FiX className="text-gray-500" /></button>
            </div>
            <form onSubmit={submitLog} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Minutes</label>
                  <input type="number" min="0" value={logForm.minutes} onChange={(e) => setLogForm({ ...logForm, minutes: e.target.value })} className="input-field" placeholder="e.g. 15" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Readings (days)</label>
                  <input type="number" min="0" value={logForm.readings} onChange={(e) => setLogForm({ ...logForm, readings: e.target.value })} className="input-field" placeholder="e.g. 1" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Note</label>
                <input value={logForm.note} onChange={(e) => setLogForm({ ...logForm, note: e.target.value })} className="input-field" placeholder="Optional" />
              </div>
              <p className="text-xs text-gray-400">CPT codes (99453/99454/99457/99458) are derived automatically from accumulated minutes &amp; transmission days this month.</p>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setLogFor(null)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Log Time'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
