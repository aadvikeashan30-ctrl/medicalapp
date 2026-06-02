import React, { useEffect, useState } from 'react';
import { FiPlus, FiClock, FiCheck, FiX, FiPlay, FiCalendar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useApi } from '../hooks/useApi';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import AIScheduleInsights from '../components/AIScheduleInsights';

const timeSlots = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'
];

const statusStyles = {
  completed: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  'in-progress': { bg: 'bg-blue-50', text: 'text-blue-700' },
  scheduled: { bg: 'bg-gray-50', text: 'text-gray-700' },
  confirmed: { bg: 'bg-indigo-50', text: 'text-indigo-700' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-700' },
  'no-show': { bg: 'bg-orange-50', text: 'text-orange-700' }
};

const typeColors = {
  consultation: 'bg-blue-100 text-blue-700',
  'follow-up': 'bg-purple-100 text-purple-700',
  procedure: 'bg-orange-100 text-orange-700',
  emergency: 'bg-red-100 text-red-700',
  checkup: 'bg-green-100 text-green-700'
};

export default function Appointments() {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data, loading, error, refetch } = useApi(`/appointments?date=${selectedDate}`);
  const appointments = data?.appointments || [];

  // Patient list for the dropdown (top 100 most recent)
  const { data: patientsData } = useApi('/patients?limit=100');
  const patients = patientsData?.patients || [];

  const [form, setForm] = useState({
    patientId: '', date: selectedDate, timeSlot: '09:00 AM',
    type: 'consultation', symptoms: ''
  });

  useEffect(() => {
    setForm((f) => ({ ...f, date: selectedDate }));
  }, [selectedDate]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.patientId) return toast.error('Please select a patient');
    setSubmitting(true);
    try {
      await api.post('/appointments', form);
      toast.success('Appointment booked');
      setShowAddModal(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id, status, successMsg) => {
    try {
      await api.put(`/appointments/${id}`, { status });
      toast.success(successMsg);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const counts = {
    total: appointments.length,
    completed: appointments.filter((a) => a.status === 'completed').length,
    inProgress: appointments.filter((a) => a.status === 'in-progress').length,
    scheduled: appointments.filter((a) => a.status === 'scheduled' || a.status === 'confirmed').length
  };

  return (
    <div className="page-enter space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center glow-purple">
              <FiCalendar className="text-white text-lg" />
            </div>
            Appointments
          </h1>
          <p className="text-gray-500 mt-1 ml-[52px]">Manage your daily schedule</p>
        </div>
        <div className="flex gap-3">
          <input
            type="date" value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input-field py-2.5 px-4"
          />
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
            <FiPlus /> Book Appointment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up stagger-2">
        <div className="stat-card border-gradient-animated">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-100 to-slate-100 flex items-center justify-center mb-3 border border-gray-200">
            <FiCalendar className="text-gray-600 text-sm" />
          </div>
          <p className="text-2xl font-bold text-gray-900 tabular-nums">{counts.total}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Today</p>
        </div>
        <div className="stat-card">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center mb-3 border border-emerald-200">
            <FiCheck className="text-emerald-600 text-sm" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 tabular-nums">{counts.completed}</p>
          <p className="text-xs text-gray-500 mt-0.5">Completed</p>
        </div>
        <div className="stat-card">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center mb-3 border border-blue-200">
            <FiPlay className="text-blue-600 text-sm" />
          </div>
          <p className="text-2xl font-bold text-blue-600 tabular-nums">{counts.inProgress}</p>
          <p className="text-xs text-gray-500 mt-0.5">In Progress</p>
        </div>
        <div className="stat-card">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center mb-3 border border-amber-200">
            <FiClock className="text-amber-600 text-sm" />
          </div>
          <p className="text-2xl font-bold text-amber-600 tabular-nums">{counts.scheduled}</p>
          <p className="text-xs text-gray-500 mt-0.5">Waiting</p>
        </div>
      </div>

      {/* AI Schedule Insights */}
      <AIScheduleInsights />

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 text-red-700 px-4 py-3 text-sm">{error}</div>
      )}

      <div className="card">
        {loading ? (
          <Loader label="Loading appointments..." />
        ) : appointments.length === 0 ? (
          <EmptyState
            icon={FiCalendar}
            title="No appointments for this day"
            message="Book an appointment to populate the schedule."
            action={
              <button onClick={() => setShowAddModal(true)} className="btn-primary text-sm">
                Book Appointment
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Token</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Patient</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Time</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => (
                  <tr key={apt._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="w-8 h-8 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-bold text-sm">
                        {apt.tokenNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-gray-900">{apt.patientId?.name}</p>
                      <p className="text-xs text-gray-500">
                        {apt.patientId?.patientId} | {apt.patientId?.phone}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 text-gray-700">
                        <FiClock className="text-gray-400" />
                        <span className="font-medium">{apt.timeSlot}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeColors[apt.type] || ''}`}>
                        {apt.type.charAt(0).toUpperCase() + apt.type.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyles[apt.status]?.bg} ${statusStyles[apt.status]?.text}`}
                      >
                        {apt.status === 'in-progress'
                          ? 'In Progress'
                          : apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {apt.status === 'scheduled' || apt.status === 'confirmed' ? (
                          <button
                            onClick={() => updateStatus(apt._id, 'in-progress', 'Appointment started')}
                            className="p-2 bg-blue-50 rounded-lg text-blue-600 hover:bg-blue-100"
                            title="Start"
                            aria-label="Start"
                          >
                            <FiPlay className="text-sm" />
                          </button>
                        ) : null}
                        {apt.status === 'in-progress' && (
                          <button
                            onClick={() => updateStatus(apt._id, 'completed', 'Appointment completed')}
                            className="p-2 bg-emerald-50 rounded-lg text-emerald-600 hover:bg-emerald-100"
                            title="Complete"
                            aria-label="Complete"
                          >
                            <FiCheck className="text-sm" />
                          </button>
                        )}
                        {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                          <button
                            onClick={() => updateStatus(apt._id, 'cancelled', 'Appointment cancelled')}
                            className="p-2 bg-red-50 rounded-lg text-red-600 hover:bg-red-100"
                            title="Cancel"
                            aria-label="Cancel"
                          >
                            <FiX className="text-sm" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Book Appointment</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
                aria-label="Close"
              >
                <FiX className="text-xl" />
              </button>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient *</label>
                <select
                  className="input-field" value={form.patientId}
                  onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                  required
                >
                  <option value="">Select patient...</option>
                  {patients.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.patientId})
                    </option>
                  ))}
                </select>
                {patients.length === 0 && (
                  <p className="text-xs text-orange-600 mt-1">
                    No patients yet. Add a patient first from the Patients page.
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date" className="input-field" required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time Slot *</label>
                  <select
                    className="input-field" required
                    value={form.timeSlot}
                    onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}
                  >
                    {timeSlots.map((slot) => (
                      <option key={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  className="input-field" value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="consultation">Consultation</option>
                  <option value="follow-up">Follow-up</option>
                  <option value="procedure">Procedure</option>
                  <option value="emergency">Emergency</option>
                  <option value="checkup">Checkup</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Symptoms / Notes</label>
                <textarea
                  className="input-field" rows={3} placeholder="Brief description..."
                  value={form.symptoms}
                  onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? 'Booking...' : 'Book Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
