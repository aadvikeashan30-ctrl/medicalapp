import React, { useState } from 'react';
import {
  FiVideo, FiPhone, FiPhoneCall, FiUser, FiClock, FiWifi, FiZap, FiExternalLink, FiAlertTriangle
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useApi } from '../hooks/useApi';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import ThreeDCard from '../components/ThreeDCard';

export default function TeleconsultHub() {
  const { data, loading, refetch } = useApi('/telemedicine/today');
  const appts = data?.appointments || [];
  const [busy, setBusy] = useState(null);

  const startVideo = async (a) => {
    setBusy(a._id);
    try {
      const res = await api.post(`/telemedicine/start/${a._id}`, {});
      if (res.data?.doctorUrl) window.open(res.data.doctorUrl, '_blank');
      toast.success('Video room started — link sent to patient');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start');
    } finally { setBusy(null); }
  };

  const failover = async (a) => {
    setBusy(a._id);
    try {
      const res = await api.post(`/telemedicine/failover/${a._id}`, { reason: 'video-drop' });
      toast.success(res.data?.voipConfigured ? 'Calling patient now…' : 'Failover simulated (no telephony provider configured)');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failover failed');
    } finally { setBusy(null); }
  };


  return (
    <div className="page-enter space-y-6">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
            <FiVideo className="text-white text-lg" />
          </div>
          Teleconsult Hub
        </h1>
        <p className="text-sm text-gray-500 mt-1">Run today's video visits — and if a call drops, fail over to an encrypted phone call in one tap</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Video Today', value: data?.total || 0, icon: FiVideo, grad: 'from-blue-500 to-violet-600', bg: 'from-blue-50 to-violet-50', border: 'border-blue-100' },
          { label: 'In Progress', value: data?.inProgress || 0, icon: FiWifi, grad: 'from-amber-500 to-orange-600', bg: 'from-amber-50 to-orange-50', border: 'border-amber-100' },
          { label: 'Pending', value: data?.pending || 0, icon: FiClock, grad: 'from-cyan-500 to-blue-600', bg: 'from-cyan-50 to-blue-50', border: 'border-cyan-100' },
          { label: 'Completed', value: data?.completed || 0, icon: FiPhoneCall, grad: 'from-emerald-500 to-teal-600', bg: 'from-emerald-50 to-teal-50', border: 'border-emerald-100' }
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

      <div className="card flex items-start gap-2 !py-3 bg-blue-50/50 border-blue-100">
        <FiZap className="text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-700">If a patient's network drops mid-call, tap <b>Failover to Call</b> — the app bridges an encrypted phone call so the visit finishes uninterrupted. (Connect a telephony provider via env to enable live dialing.)</p>
      </div>

      {loading ? (
        <Loader label="Loading today's video visits..." />
      ) : appts.length === 0 ? (
        <EmptyState icon={FiVideo} title="No video visits today" message="Appointments booked as video consultations will appear here, ready to start." />
      ) : (
        <div className="space-y-3">
          {appts.map((a) => (
            <div key={a._id} className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-100 to-violet-100 flex items-center justify-center flex-shrink-0"><FiUser className="text-violet-600 text-lg" /></div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{a.patientId?.name || 'Patient'}</h3>
                    <span className="badge badge-primary">Token #{a.tokenNumber}</span>
                    {a.consultationMode === 'phone' && <span className="badge badge-warning flex items-center gap-1"><FiPhone className="text-xs" /> On Call</span>}
                  </div>
                  <p className="text-sm text-gray-500">{a.timeSlot} · {a.symptoms || a.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => startVideo(a)} disabled={busy === a._id} className="btn-primary !py-1.5 !px-3 text-xs flex items-center gap-1"><FiVideo /> Start Video <FiExternalLink className="text-[10px]" /></button>
                <button onClick={() => failover(a)} disabled={busy === a._id} className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1 border border-amber-200 text-amber-700"><FiPhoneCall /> Failover to Call</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
