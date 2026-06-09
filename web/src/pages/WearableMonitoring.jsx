import React, { useState } from 'react';
import {
  FiWatch, FiPlus, FiX, FiActivity, FiAlertTriangle, FiRefreshCw,
  FiWifi, FiHeart, FiDroplet, FiTrash2, FiTrendingUp, FiCheckCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useApi } from '../hooks/useApi';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import ThreeDCard from '../components/ThreeDCard';
import PatientSearchSelect from '../components/PatientSearchSelect';

const METRICS = {
  'heart-rate': { label: 'Heart Rate', unit: 'bpm', icon: FiHeart },
  glucose: { label: 'Glucose', unit: 'mg/dL', icon: FiDroplet },
  'blood-pressure': { label: 'Blood Pressure', unit: 'mmHg', icon: FiActivity },
  spo2: { label: 'SpO2', unit: '%', icon: FiActivity },
  weight: { label: 'Weight', unit: 'kg', icon: FiTrendingUp },
  steps: { label: 'Steps', unit: 'steps', icon: FiActivity },
  temperature: { label: 'Temperature', unit: '\u00b0F', icon: FiActivity }
};
const DEVICES = [
  { value: 'apple-watch', label: 'Apple Watch' }, { value: 'fitbit', label: 'Fitbit' },
  { value: 'cgm', label: 'CGM' }, { value: 'bp-cuff', label: 'BP Cuff' },
  { value: 'pulse-ox', label: 'Pulse Oximeter' }, { value: 'smart-scale', label: 'Smart Scale' }
];
const fmtVal = (r) => (r.secondaryValue != null ? `${r.value}/${r.secondaryValue}` : r.value);


export default function WearableMonitoring() {
  const [showConnect, setShowConnect] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(null);
  const [form, setForm] = useState({ patientId: '', deviceType: 'apple-watch', metric: 'heart-rate' });

  const { data, loading, refetch } = useApi('/wearables');
  const { data: statsData, refetch: refetchStats } = useApi('/wearables/stats/summary');
  const { data: patients } = useApi('/patients?limit=200');
  const devices = data?.devices || [];
  const stats = statsData || { connected: 0, alerts: 0, total: 0 };

  const reload = () => { refetch(); refetchStats(); };

  const connect = async (e) => {
    e.preventDefault();
    if (!form.patientId) return toast.error('Select a patient');
    setSaving(true);
    try {
      await api.post('/wearables', form);
      toast.success('Device connected');
      setShowConnect(false);
      setForm({ patientId: '', deviceType: 'apple-watch', metric: 'heart-rate' });
      reload();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const sync = async (d) => {
    setSyncing(d._id);
    try {
      const res = await api.post(`/wearables/${d._id}/sync`, {});
      const alert = res.data?.device?.alertActive;
      alert ? toast.error('Synced — readings out of safe range!') : toast.success('Synced — readings normal');
      reload();
    } catch (err) { toast.error('Sync failed'); }
    finally { setSyncing(null); }
  };

  const remove = async (id) => {
    if (!confirm('Disconnect this device?')) return;
    try { await api.delete(`/wearables/${id}`); toast.success('Removed'); reload(); }
    catch (e) { toast.error('Failed'); }
  };


  return (
    <div className="page-enter space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
              <FiWatch className="text-white text-lg" />
            </div>
            Wearable Monitoring
          </h1>
          <p className="text-sm text-gray-500 mt-1">Sync vitals from connected devices with smart out-of-range alerts</p>
        </div>
        <button onClick={() => setShowConnect(true)} className="btn-primary flex items-center gap-2"><FiPlus /> Connect Device</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Connected', value: stats.connected, icon: FiWifi, grad: 'from-teal-500 to-emerald-600', bg: 'from-teal-50 to-emerald-50', border: 'border-teal-100' },
          { label: 'Active Alerts', value: stats.alerts, icon: FiAlertTriangle, grad: 'from-red-500 to-rose-600', bg: 'from-red-50 to-rose-50', border: 'border-red-100' },
          { label: 'Total Devices', value: stats.total, icon: FiWatch, grad: 'from-violet-500 to-purple-600', bg: 'from-violet-50 to-purple-50', border: 'border-violet-100' }
        ].map((s) => (
          <ThreeDCard key={s.label} intensity={8}>
            <div className={`p-5 bg-gradient-to-br ${s.bg} rounded-2xl border ${s.border}`}>
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 bg-gradient-to-br ${s.grad} rounded-xl flex items-center justify-center shadow-lg`}><s.icon className="text-white text-lg" /></div>
                <div><p className="text-2xl font-bold text-gray-900">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></div>
              </div>
            </div>
          </ThreeDCard>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <Loader label="Loading devices..." />
      ) : devices.length === 0 ? (
        <EmptyState icon={FiWatch} title="No devices connected" message="Connect a patient's wearable or home medical device to continuously track vitals and get threshold alerts."
          action={<button onClick={() => setShowConnect(true)} className="btn-primary text-sm">Connect First Device</button>} />
      ) : (
        <div className="space-y-3">
          {devices.map((d) => {
            const meta = METRICS[d.metric] || { label: d.metric, unit: d.unit, icon: FiActivity };
            const Icon = meta.icon;
            const latest = d.readings?.[d.readings.length - 1];
            return (
              <div key={d._id} className={`card group ${d.alertActive ? 'border-2 border-red-200' : ''}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${d.alertActive ? 'bg-red-50 text-red-600' : 'bg-teal-50 text-teal-600'}`}><Icon className="text-lg" /></div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{d.patientName || d.patientId?.name}</h3>
                        <span className="badge badge-primary">{meta.label}</span>
                        {d.alertActive ? <span className="badge badge-danger flex items-center gap-1"><FiAlertTriangle className="text-xs" /> Alert</span> : <span className="badge badge-success">Normal</span>}
                      </div>
                      <p className="text-sm text-gray-500">
                        {latest ? <>Latest: <span className={`font-semibold ${latest.flagged ? 'text-red-600' : 'text-gray-700'}`}>{fmtVal(latest)} {d.unit}</span></> : 'No readings yet'}
                        {d.thresholds?.min != null && <span className="text-xs text-gray-400"> · safe {d.thresholds.min}-{d.thresholds.max} {d.unit}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => sync(d)} disabled={syncing === d._id} className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1">
                      <FiRefreshCw className={syncing === d._id ? 'animate-spin' : ''} /> Sync
                    </button>
                    <button onClick={() => remove(d._id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-all"><FiTrash2 className="text-sm" /></button>
                  </div>
                </div>
                {d.readings?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-end gap-1.5 h-12">
                    {d.readings.slice(-16).map((r, i) => {
                      const vals = d.readings.slice(-16).map((x) => x.value);
                      const max = Math.max(...vals, 1); const min = Math.min(...vals);
                      const h = max === min ? 50 : 20 + ((r.value - min) / (max - min)) * 80;
                      return <div key={i} className={`flex-1 rounded-t ${r.flagged ? 'bg-red-400' : 'bg-teal-400'}`} style={{ height: `${h}%` }} title={`${fmtVal(r)} ${d.unit}`} />;
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showConnect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Connect Device</h2>
              <button onClick={() => setShowConnect(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><FiX className="text-gray-500" /></button>
            </div>
            <form onSubmit={connect} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Patient *</label>
                <PatientSearchSelect patients={(patients?.patients || patients || [])} value={form.patientId} onChange={(id) => setForm({ ...form, patientId: id })} placeholder="Search patient..." required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Device</label>
                  <select value={form.deviceType} onChange={(e) => setForm({ ...form, deviceType: e.target.value })} className="input-field">
                    {DEVICES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Metric</label>
                  <select value={form.metric} onChange={(e) => setForm({ ...form, metric: e.target.value })} className="input-field">
                    {Object.entries(METRICS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <p className="text-xs text-gray-400">Safe-range thresholds are pre-filled per metric and can be tuned later. Use "Sync" to pull readings.</p>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowConnect(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Connecting...' : 'Connect'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
