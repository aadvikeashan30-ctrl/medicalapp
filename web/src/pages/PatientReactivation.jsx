import React, { useState } from 'react';
import {
  FiRefreshCw, FiSend, FiUser, FiClock, FiDollarSign, FiCheckCircle, FiZap, FiPhone
} from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useApi } from '../hooks/useApi';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import ThreeDCard from '../components/ThreeDCard';

const inr = (n) => `\u20b9${Number(n || 0).toLocaleString('en-IN')}`;

export default function PatientReactivation() {
  const [days, setDays] = useState(120);
  const [selected, setSelected] = useState([]);
  const [sending, setSending] = useState(false);

  const { data, loading, refetch } = useApi(`/reactivation/lapsed?days=${days}`, { deps: [days] });
  const { data: statsData, refetch: refetchStats } = useApi('/reactivation/stats/summary');
  const patients = data?.patients || [];
  const stats = statsData || { lapsed: 0, contacted: 0, rebooked: 0, potentialRevenue: 0 };
  const reload = () => { refetch(); refetchStats(); };

  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const allSelected = patients.length > 0 && selected.length === patients.length;
  const toggleAll = () => setSelected(allSelected ? [] : patients.map((p) => p._id));

  const reachOne = async (p) => {
    try { await api.post('/reactivation/reach-out', { patientId: p._id }); toast.success(`Messaged ${p.name}`); reload(); }
    catch (e) { toast.error('Failed'); }
  };

  const reachBulk = async () => {
    if (selected.length === 0) return toast.error('Select patients first');
    setSending(true);
    try {
      const res = await api.post('/reactivation/reach-out/bulk', { patientIds: selected });
      toast.success(res.data?.message || 'Sent');
      setSelected([]); reload();
    } catch (e) { toast.error('Failed'); }
    finally { setSending(false); }
  };


  return (
    <div className="page-enter space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center"><FiRefreshCw className="text-white text-lg" /></div>
            Patient Reactivation
          </h1>
          <p className="text-sm text-gray-500 mt-1">Win back lapsed patients and recover lost revenue with one-tap outreach</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="input-field !py-2 text-sm">
            <option value={90}>Inactive 90+ days</option>
            <option value={120}>Inactive 120+ days</option>
            <option value={180}>Inactive 180+ days</option>
            <option value={365}>Inactive 1+ year</option>
          </select>
          <button onClick={reachBulk} disabled={sending || selected.length === 0} className="btn-primary flex items-center gap-2"><FiSend /> Reach {selected.length > 0 ? `(${selected.length})` : 'All Selected'}</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Lapsed Patients', value: stats.lapsed, icon: FiUser, grad: 'from-orange-500 to-red-500', bg: 'from-orange-50 to-red-50', border: 'border-orange-100' },
          { label: 'Recoverable Revenue', value: inr(stats.potentialRevenue), icon: FaRupeeSign, grad: 'from-emerald-500 to-green-600', bg: 'from-emerald-50 to-green-50', border: 'border-emerald-100' },
          { label: 'Contacted', value: stats.contacted, icon: FiSend, grad: 'from-blue-500 to-indigo-600', bg: 'from-blue-50 to-indigo-50', border: 'border-blue-100' },
          { label: 'Re-booked', value: stats.rebooked, icon: FiCheckCircle, grad: 'from-violet-500 to-purple-600', bg: 'from-violet-50 to-purple-50', border: 'border-violet-100' }
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

      {loading ? (
        <Loader label="Finding lapsed patients..." />
      ) : patients.length === 0 ? (
        <EmptyState icon={FiCheckCircle} title="No lapsed patients" message="Every patient in this window has visited recently. Great retention!" />
      ) : (
        <div className="card !p-0 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-4 h-4 rounded accent-orange-500" />
            <span className="text-sm font-medium text-gray-600">Select all ({patients.length})</span>
          </div>
          <div className="divide-y divide-gray-50">
            {patients.map((p) => (
              <div key={p._id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/50 transition-colors">
                <input type="checkbox" checked={selected.includes(p._id)} onChange={() => toggle(p._id)} className="w-4 h-4 rounded accent-orange-500" />
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center flex-shrink-0"><FiUser className="text-orange-600 text-sm" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{p.name}</h3>
                    <span className="text-xs text-gray-400 font-mono">{p.patientId}</span>
                    {p.lastOutreach && <span className="badge badge-info text-[10px]">contacted</span>}
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1"><FiPhone className="text-[10px]" /> {p.phone}</span>
                    <span className="flex items-center gap-1"><FiClock className="text-[10px]" /> {p.daysSinceVisit != null ? `${p.daysSinceVisit}d since visit` : 'never visited'}</span>
                    <span className="text-gray-400">{p.totalVisits || 0} visits</span>
                  </p>
                </div>
                <button onClick={() => reachOne(p)} className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1 flex-shrink-0"><FiSend /> Reach out</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
