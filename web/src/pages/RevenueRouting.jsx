import React, { useState } from 'react';
import {
  FiTrendingUp, FiPackage, FiActivity, FiImage, FiShield,
  FiArrowRight, FiCheckCircle, FiAlertTriangle, FiFilter, FiChevronDown
} from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useApi } from '../hooks/useApi';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import ThreeDCard from '../components/ThreeDCard';

const inr = (n) => `\u20b9${Number(n || 0).toLocaleString('en-IN')}`;

const typeMeta = {
  pharmacy: { label: 'Pharmacy', icon: FiPackage, color: 'text-violet-600 bg-violet-50' },
  lab: { label: 'Lab', icon: FiActivity, color: 'text-blue-600 bg-blue-50' },
  imaging: { label: 'Imaging', icon: FiImage, color: 'text-amber-600 bg-amber-50' }
};


export default function RevenueRouting() {
  const [typeFilter, setTypeFilter] = useState('');
  const [destFilter, setDestFilter] = useState('');

  const params = new URLSearchParams();
  if (typeFilter) params.set('type', typeFilter);
  if (destFilter) params.set('destination', destFilter);

  const { data, loading, refetch } = useApi(`/fulfillment?${params.toString()}`, { deps: [typeFilter, destFilter] });
  const { data: statsData, refetch: refetchStats } = useApi('/fulfillment/stats/summary');
  const records = data?.records || [];
  const stats = statsData || { retainedRevenue: 0, leakedRevenue: 0, captureRate: 100, retainedCount: 0, leakedCount: 0, pending: 0 };

  const reload = () => { refetch(); refetchStats(); };

  const flipDestination = async (rec) => {
    const destination = rec.destination === 'internal' ? 'external' : 'internal';
    try {
      await api.put(`/fulfillment/${rec._id}`, { destination });
      toast.success(destination === 'internal' ? 'Routed in-network' : 'Marked external');
      reload();
    } catch (err) { toast.error('Failed'); }
  };

  const markFulfilled = async (rec) => {
    try {
      await api.put(`/fulfillment/${rec._id}`, { status: 'fulfilled' });
      toast.success('Marked fulfilled');
      reload();
    } catch (err) { toast.error('Failed'); }
  };


  return (
    <div className="page-enter space-y-6">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
            <FiTrendingUp className="text-white text-lg" />
          </div>
          Revenue Routing
        </h1>
        <p className="text-sm text-gray-500 mt-1">Keep pharmacy & diagnostic revenue in-network — track every order and prevent leakage</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ThreeDCard intensity={10}>
          <div className="p-5 bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border border-emerald-100">
            <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg mb-3"><FaRupeeSign className="text-white text-lg" /></div>
            <p className="text-2xl font-bold text-gray-900">{inr(stats.retainedRevenue)}</p>
            <p className="text-xs text-gray-500 mt-1">Revenue Retained ({stats.retainedCount})</p>
          </div>
        </ThreeDCard>
        <ThreeDCard intensity={10}>
          <div className="p-5 bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl border border-red-100">
            <div className="w-11 h-11 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg mb-3"><FiAlertTriangle className="text-white text-lg" /></div>
            <p className="text-2xl font-bold text-gray-900">{inr(stats.leakedRevenue)}</p>
            <p className="text-xs text-gray-500 mt-1">At-Risk / External ({stats.leakedCount})</p>
          </div>
        </ThreeDCard>
        <ThreeDCard intensity={10}>
          <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg mb-3"><FiShield className="text-white text-lg" /></div>
            <p className="text-2xl font-bold text-gray-900">{stats.captureRate}%</p>
            <p className="text-xs text-gray-500 mt-1">In-Network Capture</p>
          </div>
        </ThreeDCard>
        <ThreeDCard intensity={10}>
          <div className="p-5 bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border border-violet-100">
            <div className="w-11 h-11 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg mb-3"><FiPackage className="text-white text-lg" /></div>
            <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            <p className="text-xs text-gray-500 mt-1">Pending Fulfillment</p>
          </div>
        </ThreeDCard>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <FiFilter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input-field !pl-10 !pr-10 appearance-none min-w-[160px]">
            <option value="">All Types</option>
            <option value="pharmacy">Pharmacy</option>
            <option value="lab">Lab</option>
            <option value="imaging">Imaging</option>
          </select>
          <FiChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
        <div className="relative">
          <FiFilter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <select value={destFilter} onChange={(e) => setDestFilter(e.target.value)} className="input-field !pl-10 !pr-10 appearance-none min-w-[160px]">
            <option value="">All Destinations</option>
            <option value="internal">In-Network</option>
            <option value="external">External</option>
          </select>
          <FiChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>


      {/* List */}
      {loading ? (
        <Loader label="Loading fulfillment queue..." />
      ) : records.length === 0 ? (
        <EmptyState icon={FiPackage} title="No fulfillment records yet" message="When you create prescriptions or order lab tests, they're auto-routed to your in-house pharmacy and lab to keep revenue in-network." />
      ) : (
        <div className="space-y-3">
          {records.map((rec, idx) => {
            const meta = typeMeta[rec.type] || typeMeta.pharmacy;
            const Icon = meta.icon;
            const internal = rec.destination === 'internal';
            return (
              <div key={rec._id} className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4 group animate-slide-in" style={{ animationDelay: `${idx * 30}ms` }}>
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${meta.color}`}><Icon className="text-lg" /></div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{rec.patientName || rec.patientId?.name || 'Patient'}</h3>
                      <span className="badge badge-primary">{meta.label}</span>
                      <span className="text-xs text-gray-400 capitalize">from {rec.source}</span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">{(rec.items || []).map((i) => i.name).join(', ') || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{inr(rec.estimatedValue)}</span>
                  <button onClick={() => flipDestination(rec)} className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${internal ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-red-700 bg-red-50 border-red-200'}`} title="Toggle in-network / external">
                    {internal ? <><FiShield className="text-xs" /> In-Network</> : <><FiArrowRight className="text-xs" /> External</>}
                  </button>
                  {rec.status !== 'fulfilled' ? (
                    <button onClick={() => markFulfilled(rec)} className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600" title="Mark fulfilled"><FiCheckCircle className="text-sm" /></button>
                  ) : (
                    <span className="badge badge-success">Fulfilled</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
