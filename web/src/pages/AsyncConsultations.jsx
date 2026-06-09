import React, { useState } from 'react';
import {
  FiInbox, FiClock, FiCheckCircle, FiAlertTriangle, FiSend, FiX,
  FiImage, FiUser, FiFilter, FiChevronDown, FiMessageSquare, FiEye
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useApi } from '../hooks/useApi';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import ThreeDCard from '../components/ThreeDCard';

const CATS = {
  dermatology: 'Dermatology', 'wound-check': 'Wound Check', 'follow-up': 'Follow-up',
  'medication-query': 'Medication', 'lab-review': 'Lab Review', general: 'General'
};
const statusCfg = {
  pending: { label: 'Pending', class: 'badge-warning' },
  'in-review': { label: 'In Review', class: 'badge-info' },
  responded: { label: 'Responded', class: 'badge-success' },
  closed: { label: 'Closed', class: 'badge-gray' }
};
const prioCfg = {
  high: 'text-red-600 bg-red-50 border-red-100',
  normal: 'text-gray-600 bg-gray-50 border-gray-100',
  low: 'text-gray-500 bg-gray-50 border-gray-100'
};
const FILE_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');


export default function AsyncConsultations() {
  const [statusFilter, setStatusFilter] = useState('');
  const [active, setActive] = useState(null);
  const [reply, setReply] = useState('');
  const [saving, setSaving] = useState(false);

  const params = new URLSearchParams();
  if (statusFilter) params.set('status', statusFilter);
  const { data, loading, refetch } = useApi(`/async-consults?${params.toString()}`, { deps: [statusFilter] });
  const { data: statsData, refetch: refetchStats } = useApi('/async-consults/stats/summary');
  const consults = data?.consults || [];
  const stats = statsData || { pending: 0, inReview: 0, responded: 0, high: 0, openTotal: 0 };

  const reload = () => { refetch(); refetchStats(); };

  const openCase = async (c) => {
    setActive(c);
    setReply('');
    if (c.status === 'pending') {
      try { await api.post(`/async-consults/${c._id}/claim`, {}); reload(); } catch (e) { /* ignore */ }
    }
  };

  const sendReply = async () => {
    if (!reply.trim()) return toast.error('Write a response');
    setSaving(true);
    try {
      await api.post(`/async-consults/${active._id}/respond`, { text: reply });
      toast.success('Response sent to patient');
      setActive(null);
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const closeCase = async (id) => {
    try { await api.put(`/async-consults/${id}`, { status: 'closed' }); toast.success('Closed'); setActive(null); reload(); }
    catch (e) { toast.error('Failed'); }
  };


  return (
    <div className="page-enter space-y-6">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <FiInbox className="text-white text-lg" />
          </div>
          Async Consultations
        </h1>
        <p className="text-sm text-gray-500 mt-1">Review routine, image-based cases from your queue during downtime — no live slot needed</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pending', value: stats.pending, icon: FiClock, grad: 'from-amber-500 to-orange-600', bg: 'from-amber-50 to-orange-50', border: 'border-amber-100' },
          { label: 'In Review', value: stats.inReview, icon: FiEye, grad: 'from-blue-500 to-indigo-600', bg: 'from-blue-50 to-indigo-50', border: 'border-blue-100' },
          { label: 'Responded', value: stats.responded, icon: FiCheckCircle, grad: 'from-emerald-500 to-teal-600', bg: 'from-emerald-50 to-teal-50', border: 'border-emerald-100' },
          { label: 'High Priority', value: stats.high, icon: FiAlertTriangle, grad: 'from-red-500 to-rose-600', bg: 'from-red-50 to-rose-50', border: 'border-red-100' }
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

      {/* Filter */}
      <div className="relative w-fit">
        <FiFilter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field !pl-10 !pr-10 appearance-none min-w-[170px]">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in-review">In Review</option>
          <option value="responded">Responded</option>
          <option value="closed">Closed</option>
        </select>
        <FiChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>

      {/* List */}
      {loading ? (
        <Loader label="Loading consultation queue..." />
      ) : consults.length === 0 ? (
        <EmptyState icon={FiInbox} title="Queue is empty" message="Routine image-based cases submitted by patients will appear here for you to review asynchronously." />
      ) : (
        <div className="space-y-3">
          {consults.map((c, idx) => {
            const sc = statusCfg[c.status] || statusCfg.pending;
            return (
              <div key={c._id} onClick={() => openCase(c)} className="card flex items-center justify-between gap-4 cursor-pointer hover:shadow-md transition-shadow animate-slide-in" style={{ animationDelay: `${idx * 30}ms` }}>
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center flex-shrink-0">
                    {c.photos?.length ? <FiImage className="text-violet-600 text-lg" /> : <FiMessageSquare className="text-violet-600 text-lg" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{c.patientName}</h3>
                      <span className="badge badge-primary">{CATS[c.category] || c.category}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${prioCfg[c.priority]}`}>{c.priority}</span>
                    </div>
                    <p className="text-sm text-gray-500 truncate max-w-md">{c.description}</p>
                  </div>
                </div>
                <span className={`badge ${sc.class} flex-shrink-0`}>{sc.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Case detail / respond drawer */}
      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg animate-scale-in max-h-[90vh] overflow-y-auto custom-scroll">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{active.patientName}</h2>
                <p className="text-xs text-gray-500">{CATS[active.category] || active.category} · {active.priority} priority</p>
              </div>
              <button onClick={() => setActive(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><FiX className="text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <p className="text-xs font-semibold text-gray-400 uppercase mb-1 flex items-center gap-1.5"><FiUser /> Patient message</p>
                <p className="text-sm text-gray-800 dark:text-gray-200">{active.description}</p>
              </div>
              {active.photos?.length > 0 && (
                <div className="flex gap-3 overflow-x-auto custom-scroll pb-1">
                  {active.photos.map((ph, i) => (
                    <img key={i} src={ph.startsWith('http') ? ph : `${FILE_BASE}${ph}`} alt="" onError={(e) => { e.target.src = 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22160%22 height=%22120%22><rect width=%22100%25%22 height=%22100%25%22 fill=%22%23f1f5f9%22/><text x=%2250%25%22 y=%2250%25%22 fill=%22%2394a3b8%22 font-size=%2212%22 text-anchor=%22middle%22 dy=%22.3em%22>photo</text></svg>'; }} className="w-32 h-24 rounded-xl object-cover border border-gray-200 flex-shrink-0" />
                  ))}
                </div>
              )}
              {active.response?.text ? (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-xs font-semibold text-emerald-600 uppercase mb-1">Your response</p>
                  <p className="text-sm text-gray-800">{active.response.text}</p>
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Your Response</label>
                  <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={4} className="input-field" placeholder="Type advice for the patient (sent via WhatsApp if a number is on file)..." />
                </div>
              )}
              <div className="flex justify-between gap-3 pt-1">
                <button onClick={() => closeCase(active._id)} className="btn-secondary text-sm">Close Case</button>
                {!active.response?.text && (
                  <button onClick={sendReply} disabled={saving} className="btn-primary flex items-center gap-2"><FiSend /> {saving ? 'Sending...' : 'Send Response'}</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
