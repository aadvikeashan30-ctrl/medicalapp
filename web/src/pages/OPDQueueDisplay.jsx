import React, { useState, useEffect } from 'react';
import {
  FiMonitor, FiClock, FiUsers, FiPlay, FiCheck,
  FiArrowRight, FiRefreshCw, FiVolume2, FiBell
} from 'react-icons/fi';
import { FaStethoscope } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useApi } from '../hooks/useApi';
import { getUser } from '../utils/auth';

// ──────────────────────────────────────────────
// OPD Queue Display - Live Token Management
// Healthplix-inspired queue management system
// ──────────────────────────────────────────────

function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function getWaitTime(appointments, currentIndex) {
  const avgConsultTime = 8; // minutes
  return (currentIndex) * avgConsultTime;
}

export default function OPDQueueDisplay() {
  const user = getUser();
  const { data: queue, loading, refetch } = useApi('/appointments/queue/today');
  const [viewMode, setViewMode] = useState('manage'); // manage | display
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [currentlyServing, setCurrentlyServing] = useState(null);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => refetch(), 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  // Find currently serving patient
  useEffect(() => {
    if (queue?.length) {
      const inProgress = queue.find(a => a.status === 'in-progress');
      setCurrentlyServing(inProgress || null);
    }
  }, [queue]);

  const callNext = async () => {
    const nextPatient = queue?.find(a => a.status === 'scheduled' || a.status === 'confirmed');
    if (!nextPatient) { toast.error('No more patients in queue'); return; }
    try {
      await api.put(`/appointments/${nextPatient._id}`, { status: 'in-progress' });
      toast.success(`Calling Token #${nextPatient.tokenNumber}: ${nextPatient.patientId?.name || 'Patient'}`);
      refetch();
    } catch { toast.error('Failed to call patient'); }
  };

  const completeCurrentPatient = async () => {
    if (!currentlyServing) return;
    try {
      await api.put(`/appointments/${currentlyServing._id}`, { status: 'completed' });
      toast.success('Patient marked as done');
      refetch();
    } catch { toast.error('Failed to complete'); }
  };

  const skipPatient = async (id) => {
    try {
      await api.put(`/appointments/${id}`, { status: 'cancelled' });
      toast.success('Patient skipped');
      refetch();
    } catch { toast.error('Failed'); }
  };

  const waiting = queue?.filter(a => a.status === 'scheduled' || a.status === 'confirmed') || [];
  const completed = queue?.filter(a => a.status === 'completed') || [];
  const totalToday = queue?.length || 0;

  const avgConsultTime = 8;

  return (
    <div className="page-enter space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <FiMonitor className="text-white text-lg" />
            </div>
            OPD Queue Display
          </h1>
          <p className="text-gray-500 mt-1 ml-[52px] text-sm">Live token display & queue management</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'manage' ? 'display' : 'manage')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'display'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FiMonitor className="inline mr-1" /> {viewMode === 'display' ? 'TV Display Mode' : 'Switch to Display'}
          </button>
          <button onClick={() => refetch()} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-600 transition-colors">
            <FiRefreshCw className="text-sm" />
          </button>
          <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
              className="accent-blue-600"
            />
            Auto-refresh
          </label>
        </div>
      </div>

      {/* ════════ MANAGEMENT VIEW ════════ */}
      {viewMode === 'manage' && (
        <div className="space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="card p-4 bg-blue-50 border-blue-100">
              <p className="text-2xl font-bold text-blue-700">{totalToday}</p>
              <p className="text-xs text-blue-600">Total Today</p>
            </div>
            <div className="card p-4 bg-amber-50 border-amber-100">
              <div className="flex items-center gap-1">
                <p className="text-2xl font-bold text-amber-700">{waiting.length}</p>
                <FiClock className="text-amber-500" />
              </div>
              <p className="text-xs text-amber-600">Waiting</p>
            </div>
            <div className="card p-4 bg-cyan-50 border-cyan-100">
              <p className="text-2xl font-bold text-cyan-700">{currentlyServing ? '1' : '0'}</p>
              <p className="text-xs text-cyan-600">In Consultation</p>
            </div>
            <div className="card p-4 bg-emerald-50 border-emerald-100">
              <p className="text-2xl font-bold text-emerald-700">{completed.length}</p>
              <p className="text-xs text-emerald-600">Completed</p>
            </div>
          </div>

          {/* Current patient banner */}
          {currentlyServing && (
            <div className="card bg-gradient-to-r from-cyan-600 to-blue-700 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center">
                    <span className="text-2xl font-bold">#{currentlyServing.tokenNumber}</span>
                  </div>
                  <div>
                    <p className="text-xs text-blue-100 uppercase font-semibold">Now Serving</p>
                    <p className="text-xl font-bold">{currentlyServing.patientId?.name || 'Patient'}</p>
                    <p className="text-blue-200 text-sm">
                      {currentlyServing.timeSlot} • {currentlyServing.type || 'Consultation'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={completeCurrentPatient}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium transition-all"
                  >
                    <FiCheck /> Done
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Call next button */}
          <button
            onClick={callNext}
            disabled={waiting.length === 0}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-semibold text-lg hover:shadow-lg hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <FiBell /> Call Next Patient {waiting.length > 0 && `(#${waiting[0]?.tokenNumber})`}
          </button>

          {/* Waiting list */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FiUsers className="text-amber-500" /> Waiting Queue ({waiting.length})
            </h3>
            {waiting.length === 0 ? (
              <p className="text-center text-gray-400 py-6 text-sm">No patients waiting</p>
            ) : (
              <div className="space-y-2">
                {waiting.map((apt, idx) => (
                  <div
                    key={apt._id}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                        <span className="text-sm font-bold text-amber-700">#{apt.tokenNumber}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{apt.patientId?.name || 'Patient'}</p>
                        <p className="text-xs text-gray-500">
                          {apt.timeSlot} • {apt.type || 'Consultation'}
                          <span className="ml-2 text-amber-600">~{getWaitTime(waiting, idx)} min wait</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => {
                          api.put(`/appointments/${apt._id}`, { status: 'in-progress' }).then(() => { refetch(); toast.success('Called in'); });
                        }}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100"
                      >
                        <FiPlay className="inline mr-0.5" /> Call
                      </button>
                      <button
                        onClick={() => skipPatient(apt._id)}
                        className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100"
                      >
                        Skip
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed today */}
          {completed.length > 0 && (
            <details className="card">
              <summary className="font-semibold text-gray-900 cursor-pointer flex items-center gap-2">
                <FiCheck className="text-emerald-500" /> Completed Today ({completed.length})
              </summary>
              <div className="mt-3 space-y-2">
                {completed.map(apt => (
                  <div key={apt._id} className="flex items-center gap-3 p-2 bg-emerald-50/50 rounded-lg text-sm">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <FiCheck className="text-emerald-600 text-xs" />
                    </div>
                    <span className="text-gray-600">{apt.patientId?.name || 'Patient'}</span>
                    <span className="text-xs text-gray-400 ml-auto">#{apt.tokenNumber}</span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {/* ════════ TV DISPLAY MODE ════════ */}
      {viewMode === 'display' && (
        <div className="min-h-[70vh] bg-gradient-to-br from-gray-900 via-blue-950 to-indigo-950 rounded-2xl p-8 text-white relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />

          {/* Clinic name */}
          <div className="text-center mb-8 relative z-10">
            <h2 className="text-3xl font-bold text-white">{user.clinicName || 'DocClinic'}</h2>
            <p className="text-blue-300 text-sm mt-1">
              <FiClock className="inline mr-1" /> {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
            {/* Now Serving - Big display */}
            <div className="lg:col-span-1">
              <div className="text-center">
                <p className="text-sm uppercase tracking-widest text-blue-400 mb-4 font-semibold">Now Serving</p>
                {currentlyServing ? (
                  <div className="animate-pulse-slow">
                    <div className="w-40 h-40 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 mx-auto flex items-center justify-center shadow-2xl shadow-blue-500/30">
                      <span className="text-6xl font-black text-white">#{currentlyServing.tokenNumber}</span>
                    </div>
                    <p className="text-xl font-bold mt-4 text-white">{currentlyServing.patientId?.name || 'Patient'}</p>
                    <p className="text-blue-300 text-sm">{currentlyServing.type || 'Consultation'}</p>
                  </div>
                ) : (
                  <div className="w-40 h-40 rounded-2xl bg-gray-800 mx-auto flex items-center justify-center border border-gray-700">
                    <span className="text-gray-500 text-lg">—</span>
                  </div>
                )}
              </div>
            </div>

            {/* Waiting list */}
            <div className="lg:col-span-2">
              <p className="text-sm uppercase tracking-widest text-amber-400 mb-4 font-semibold flex items-center gap-2">
                <FiUsers /> Waiting ({waiting.length})
              </p>
              {waiting.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No patients waiting</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {waiting.slice(0, 8).map((apt, idx) => (
                    <div
                      key={apt._id}
                      className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                        idx === 0
                          ? 'bg-amber-500/20 border border-amber-500/30'
                          : 'bg-white/5 border border-white/10'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                        idx === 0 ? 'bg-amber-500 text-white' : 'bg-gray-700 text-gray-300'
                      }`}>
                        #{apt.tokenNumber}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{apt.patientId?.name || 'Patient'}</p>
                        <p className="text-xs text-gray-400">
                          {apt.timeSlot}
                          {idx === 0 && <span className="ml-2 text-amber-400">← Next</span>}
                        </p>
                      </div>
                      <span className="ml-auto text-xs text-gray-500">
                        ~{getWaitTime(waiting, idx)} min
                      </span>
                    </div>
                  ))}
                  {waiting.length > 8 && (
                    <div className="text-center text-gray-500 py-2 col-span-2">
                      +{waiting.length - 8} more patients waiting
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer stats */}
          <div className="mt-8 pt-6 border-t border-white/10 flex justify-center gap-8 relative z-10">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">{completed.length}</p>
              <p className="text-xs text-gray-400">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-400">{waiting.length}</p>
              <p className="text-xs text-gray-400">Waiting</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">~{avgConsultTime} min</p>
              <p className="text-xs text-gray-400">Avg. Consult</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
