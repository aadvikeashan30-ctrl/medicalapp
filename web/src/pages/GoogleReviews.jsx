import React, { useState } from 'react';
import {
  FiStar, FiSend, FiX, FiUser, FiCheckCircle, FiEye, FiTrendingUp, FiMessageCircle, FiPhone
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useApi } from '../hooks/useApi';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import ThreeDCard from '../components/ThreeDCard';

const statusCfg = {
  requested: { label: 'Requested', class: 'badge-info' },
  opened: { label: 'Opened', class: 'badge-warning' },
  reviewed: { label: 'Reviewed', class: 'badge-success' },
  declined: { label: 'Declined', class: 'badge-gray' }
};
const empty = { patientName: '', patientPhone: '', channel: 'whatsapp' };

export default function GoogleReviews() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const { data, loading, refetch } = useApi('/reviews');
  const { data: statsData, refetch: refetchStats } = useApi('/reviews/stats/summary');
  const reviews = data?.reviews || [];
  const stats = statsData || { requested: 0, opened: 0, reviewed: 0, conversion: 0 };
  const reload = () => { refetch(); refetchStats(); };

  const sendReq = async (e) => {
    e.preventDefault();
    if (!form.patientName.trim()) return toast.error('Patient name is required');
    setSaving(true);
    try { await api.post('/reviews/request', form); toast.success('Review request sent'); setShowModal(false); setForm(empty); reload(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const markReviewed = async (r) => {
    try { await api.put(`/reviews/${r._id}`, { status: 'reviewed', rating: 5 }); toast.success('Marked reviewed'); reload(); }
    catch (e) { toast.error('Failed'); }
  };


  return (
    <div className="page-enter space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center"><FiStar className="text-white text-lg" /></div>
            Google Review Automation
          </h1>
          <p className="text-sm text-gray-500 mt-1">Turn happy patients into 5-star reviews with automated requests</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><FiSend /> Request Review</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Requests Sent', value: stats.requested, icon: FiSend, grad: 'from-blue-500 to-indigo-600', bg: 'from-blue-50 to-indigo-50', border: 'border-blue-100' },
          { label: 'Opened', value: stats.opened, icon: FiEye, grad: 'from-amber-500 to-orange-600', bg: 'from-amber-50 to-orange-50', border: 'border-amber-100' },
          { label: 'Reviews', value: stats.reviewed, icon: FiStar, grad: 'from-yellow-400 to-amber-500', bg: 'from-yellow-50 to-amber-50', border: 'border-yellow-100' },
          { label: 'Conversion', value: `${stats.conversion}%`, icon: FiTrendingUp, grad: 'from-emerald-500 to-teal-600', bg: 'from-emerald-50 to-teal-50', border: 'border-emerald-100' }
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
        <Loader label="Loading review requests..." />
      ) : reviews.length === 0 ? (
        <EmptyState icon={FiStar} title="No review requests yet" message="Send a review request to patients after a good visit — it's the fastest way to grow your Google rating."
          action={<button onClick={() => setShowModal(true)} className="btn-primary text-sm">Send First Request</button>} />
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => {
            const sc = statusCfg[r.status] || statusCfg.requested;
            return (
              <div key={r._id} className="card flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-yellow-100 to-amber-100 flex items-center justify-center flex-shrink-0"><FiUser className="text-amber-600 text-lg" /></div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{r.patientName}</h3>
                      {r.rating && <span className="text-amber-500 text-sm">{'\u2605'.repeat(r.rating)}</span>}
                      <span className="badge badge-primary flex items-center gap-1">{r.channel === 'sms' ? <FiPhone className="text-[10px]" /> : <FiMessageCircle className="text-[10px]" />} {r.channel}</span>
                    </div>
                    <p className="text-xs text-gray-400">{new Date(r.requestedAt || r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}{r.patientPhone ? ` · ${r.patientPhone}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${sc.class}`}>{sc.label}</span>
                  {r.status !== 'reviewed' && <button onClick={() => markReviewed(r)} className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600" title="Mark reviewed"><FiCheckCircle className="text-sm" /></button>}
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
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Request a Review</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><FiX className="text-gray-500" /></button>
            </div>
            <form onSubmit={sendReq} className="p-6 space-y-4">
              <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Patient Name *</label><input value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} className="input-field" required /></div>
              <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Phone</label><input value={form.patientPhone} onChange={(e) => setForm({ ...form, patientPhone: e.target.value })} className="input-field" /></div>
              <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Channel</label>
                <div className="grid grid-cols-2 gap-2">
                  {['whatsapp', 'sms'].map((c) => (
                    <button key={c} type="button" onClick={() => setForm({ ...form, channel: c })} className={`py-2 rounded-xl border text-sm font-medium capitalize ${form.channel === c ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-gray-200 text-gray-500'}`}>{c}</button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-400">A review link is sent automatically. Configure your Google link in the Website Generator.</p>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Sending...' : 'Send Request'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
