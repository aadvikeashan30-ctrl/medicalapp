import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  FiClock, FiCheckCircle, FiUsers, FiMapPin,
  FiRefreshCw, FiCalendar, FiAlertCircle, FiPhone
} from 'react-icons/fi';
import { FaHeartbeat, FaStethoscope } from 'react-icons/fa';
import axios from 'axios';
const api = axios.create({ baseURL: '/api' });

const statusConfig = {
  scheduled: { label: 'Waiting', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  confirmed: { label: 'Confirmed', color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  'in-progress': { label: 'With Doctor Now', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  completed: { label: 'Completed', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200' },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' }
};

export default function TrackAppointment() {
  const { appointmentId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [phoneInput, setPhoneInput] = useState('');
  const [lookupMode, setLookupMode] = useState(!appointmentId);
  const [appointments, setAppointments] = useState([]);
  const refreshInterval = useRef(null);

  const fetchTrack = async (id) => {
    try {
      const { data: result } = await api.get(`/portal/track/${id}`);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Appointment not found');
    } finally { setLoading(false); }
  };

  const lookupByPhone = async (e) => {
    e.preventDefault();
    if (phoneInput.length < 10) return;
    setLoading(true); setError(null);
    try {
      const { data: result } = await api.get(`/portal/my-appointments?phone=${phoneInput}`);
      setAppointments(result.appointments || []);
      if (result.appointments?.length === 0) setError('No appointments found');
    } catch (err) {
      setError(err.response?.data?.message || 'No appointments found');
    } finally { setLoading(false); }
  };

  const selectAppointment = (apt) => {
    setLookupMode(false);
    setLoading(true);
    fetchTrack(apt._id);
  };

  useEffect(() => {
    if (appointmentId) { fetchTrack(appointmentId); }
    else { setLoading(false); }
  }, [appointmentId]);

  // Auto-refresh every 30s if tracking active appointment
  useEffect(() => {
    if (data && ['scheduled', 'confirmed'].includes(data.appointment?.status)) {
      refreshInterval.current = setInterval(() => {
        fetchTrack(data.appointment.id || appointmentId);
      }, 30000);
    }
    return () => { if (refreshInterval.current) clearInterval(refreshInterval.current); };
  }, [data]);

  const queueProgress = data?.queue ?
    Math.round(((data.queue.completed) / Math.max(data.queue.totalToday, 1)) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
              <FaHeartbeat className="text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">DocClinic Pro</span>
          </Link>
          <Link to="/my-records" className="btn-secondary text-sm !py-2">My Records</Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Phone lookup mode */}
        {lookupMode && !appointmentId && (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
                <FiClock className="text-white text-2xl" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Track My Appointment</h1>
              <p className="text-gray-500">Check your live queue position and estimated wait time</p>
            </div>

            <form onSubmit={lookupByPhone} className="card max-w-md mx-auto space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Phone Number</label>
                <div className="relative">
                  <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="tel" value={phoneInput} onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g,'').slice(0,10))} className="input-field !pl-11" placeholder="9876543210" maxLength={10} required />
                </div>
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
              <button type="submit" disabled={loading || phoneInput.length < 10} className="btn-primary w-full py-3">
                {loading ? 'Searching...' : 'Find My Appointments'}
              </button>
            </form>

            {/* Appointment list */}
            {appointments.length > 0 && (
              <div className="mt-6 space-y-3 max-w-md mx-auto">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Select appointment to track:</p>
                {appointments.map(apt => (
                  <button
                    key={apt._id}
                    onClick={() => selectAppointment(apt)}
                    className="w-full card !p-4 text-left hover:shadow-md transition-all flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">
                        {apt.type || 'Consultation'} — Token #{apt.tokenNumber}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(apt.date).toLocaleDateString('en-IN')} • {apt.timeSlot}
                        {apt.doctorId?.name && ` • Dr. ${apt.doctorId.name}`}
                      </p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      apt.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      apt.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>{apt.status}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Live tracking view */}
        {data && !lookupMode && (
          <div className="animate-fade-in space-y-6">
            {/* Token Number - Big Display */}
            <div className="text-center">
              <div className="inline-block relative">
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/30">
                  <div>
                    <p className="text-[10px] text-blue-200 uppercase tracking-wider">Your Token</p>
                    <p className="text-5xl font-bold text-white">#{data.appointment?.tokenNumber}</p>
                  </div>
                </div>
                {data.appointment?.status === 'in-progress' && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                    <FiCheckCircle className="text-white text-sm" />
                  </div>
                )}
              </div>
            </div>

            {/* Status */}
            <div className={`card text-center ${statusConfig[data.appointment?.status]?.bg} ${statusConfig[data.appointment?.status]?.border} border-2`}>
              <p className={`text-lg font-bold ${statusConfig[data.appointment?.status]?.color}`}>
                {statusConfig[data.appointment?.status]?.label || data.appointment?.status}
              </p>
              {data.appointment?.status === 'in-progress' && (
                <p className="text-sm text-emerald-600 mt-1">You are currently with the doctor</p>
              )}
              {['scheduled', 'confirmed'].includes(data.appointment?.status) && data.queue?.patientsAhead > 0 && (
                <p className="text-sm text-blue-600 mt-1">
                  {data.queue.patientsAhead} patient{data.queue.patientsAhead > 1 ? 's' : ''} ahead of you • ~{data.queue.estimatedWaitMinutes} min wait
                </p>
              )}
              {['scheduled', 'confirmed'].includes(data.appointment?.status) && data.queue?.patientsAhead === 0 && (
                <p className="text-sm text-emerald-600 mt-1 font-semibold">You're next! Please be ready.</p>
              )}
            </div>

            {/* Queue Progress */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FiUsers className="text-blue-600" /> Today's Queue
                </h3>
                <button onClick={() => fetchTrack(data.appointment?.id || appointmentId)} className="text-xs text-blue-600 flex items-center gap-1 hover:text-blue-800">
                  <FiRefreshCw className="text-[10px]" /> Refresh
                </button>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{data.queue?.completed} completed</span>
                  <span>{data.queue?.totalToday} total</span>
                </div>
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-700" style={{ width: `${queueProgress}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{data.queue?.currentToken || '—'}</p>
                  <p className="text-[10px] text-gray-500 uppercase">Current</p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <p className="text-xl font-bold text-blue-700">{data.queue?.myToken}</p>
                  <p className="text-[10px] text-blue-600 uppercase">Your Token</p>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                  <p className="text-xl font-bold text-emerald-700">{data.queue?.patientsAhead}</p>
                  <p className="text-[10px] text-emerald-600 uppercase">Ahead</p>
                </div>
              </div>
            </div>

            {/* Doctor & Appointment Info */}
            <div className="card">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FaStethoscope className="text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">Dr. {data.doctor?.name}</h4>
                  <p className="text-sm text-gray-500 capitalize">{data.doctor?.specialty} • {data.doctor?.clinicName}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600"><FiCalendar className="text-gray-400" /> {new Date(data.appointment?.date).toLocaleDateString('en-IN')}</div>
                <div className="flex items-center gap-2 text-gray-600"><FiClock className="text-gray-400" /> {data.appointment?.timeSlot}</div>
              </div>
            </div>

            {/* Auto-refresh notice */}
            {['scheduled', 'confirmed'].includes(data.appointment?.status) && (
              <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
                <FiRefreshCw className="text-[10px] animate-spin" /> Auto-refreshes every 30 seconds
              </p>
            )}

            {/* Back button */}
            <div className="flex justify-center pt-2">
              <button onClick={() => { setLookupMode(true); setData(null); }} className="btn-secondary text-sm">
                Track Another Appointment
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && !lookupMode && (
          <div className="text-center py-16">
            <FiRefreshCw className="mx-auto text-3xl text-blue-500 animate-spin mb-3" />
            <p className="text-gray-500">Loading appointment status...</p>
          </div>
        )}
      </div>
    </div>
  );
}
