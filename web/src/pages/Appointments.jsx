import React, { useEffect, useState } from 'react';
import {
  FiPlus, FiClock, FiCheck, FiX, FiPlay, FiCalendar,
  FiChevronLeft, FiChevronRight, FiPhone, FiUser
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useApi } from '../hooks/useApi';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import AIScheduleInsights from '../components/AIScheduleInsights';
import PatientSearchSelect from '../components/PatientSearchSelect';
import AnimatedCounter from '../components/AnimatedCounter';
import { Hero3D, useTilt } from '../components/Premium3D';

const STATUS_THEME = {
  completed:     { label: 'Completed',   dot: '#10b981', chip: 'bg-emerald-50 text-emerald-700 border-emerald-100', soft: 'rgba(16,185,129,0.16)', shadow: 'rgba(16,185,129,0.4)' },
  'in-progress': { label: 'In Progress', dot: '#3b82f6', chip: 'bg-blue-50 text-blue-700 border-blue-100',          soft: 'rgba(59,130,246,0.16)', shadow: 'rgba(59,130,246,0.4)' },
  scheduled:     { label: 'Scheduled',   dot: '#64748b', chip: 'bg-gray-50 text-gray-700 border-gray-200',          soft: 'rgba(100,116,139,0.14)', shadow: 'rgba(100,116,139,0.4)' },
  confirmed:     { label: 'Confirmed',   dot: '#6366f1', chip: 'bg-indigo-50 text-indigo-700 border-indigo-100',    soft: 'rgba(99,102,241,0.16)', shadow: 'rgba(99,102,241,0.4)' },
  cancelled:     { label: 'Cancelled',   dot: '#ef4444', chip: 'bg-red-50 text-red-700 border-red-100',             soft: 'rgba(239,68,68,0.14)',  shadow: 'rgba(239,68,68,0.4)' },
  'no-show':     { label: 'No Show',     dot: '#f97316', chip: 'bg-orange-50 text-orange-700 border-orange-100',    soft: 'rgba(249,115,22,0.16)', shadow: 'rgba(249,115,22,0.4)' },
};

const typeColors = {
  consultation: 'bg-blue-100 text-blue-700',
  'follow-up': 'bg-purple-100 text-purple-700',
  procedure: 'bg-orange-100 text-orange-700',
  emergency: 'bg-red-100 text-red-700',
  checkup: 'bg-green-100 text-green-700'
};

/* ─── 3D KPI tile ───────────────────────────────────────────────── */
function KpiTile({ icon: Icon, accent, label, value, delay }) {
  const tilt = useTilt(10);
  return (
    <div {...tilt} className={`stat-3d tilt-3d ${accent} animate-pop`} style={{ animationDelay: delay }}>
      <div className="flex items-start justify-between mb-3 depth-2">
        <div className="stat-3d-icon"><Icon size={22} /></div>
      </div>
      <p className="text-[26px] font-extrabold text-gray-900 tabular-nums leading-none depth-1">
        <AnimatedCounter end={Number(value || 0)} />
      </p>
      <p className="text-sm text-gray-500 mt-1.5 depth-1">{label}</p>
    </div>
  );
}

/* ─── 3D tilt appointment card ──────────────────────────────────── */
function AppointmentCard({ apt, idx, onStatus }) {
  const tilt = useTilt(6);
  const th = STATUS_THEME[apt.status] || STATUS_THEME.scheduled;
  const canStart = apt.status === 'scheduled' || apt.status === 'confirmed';
  const canCancel = apt.status !== 'cancelled' && apt.status !== 'completed';
  return (
    <div
      {...tilt}
      className="module-3d tilt-3d p-4 animate-pop"
      style={{ '--m-soft': th.soft, '--m-shadow': th.shadow, animationDelay: `${Math.min(idx * 40, 360)}ms`, borderLeft: `4px solid ${th.dot}` }}
    >
      <div className="flex items-start gap-3 depth-1">
        {/* token + time */}
        <div className="text-center flex-shrink-0">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white shadow-md"
               style={{ background: 'linear-gradient(135deg,#7c3aed,#db2777)', boxShadow: '0 8px 16px -5px rgba(124,58,237,0.5)' }}>
            {apt.tokenNumber}
          </div>
          <p className="text-[11px] font-semibold text-gray-500 mt-1 flex items-center gap-0.5 justify-center">
            <FiClock size={10} /> {apt.timeSlot}
          </p>
        </div>

        {/* details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-bold text-gray-900 truncate">{apt.patientId?.name || 'Patient'}</p>
              <p className="text-xs text-gray-400 flex items-center gap-2 mt-0.5 truncate">
                <span className="font-mono">{apt.patientId?.patientId}</span>
                {apt.patientId?.phone && <span className="flex items-center gap-0.5"><FiPhone size={10} /> {apt.patientId.phone}</span>}
              </p>
            </div>
            <span className={`text-[10px] font-bold uppercase border px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0 ${th.chip}`}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: th.dot }} /> {th.label}
            </span>
          </div>

          <div className="flex items-center justify-between mt-3">
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${typeColors[apt.type] || 'bg-gray-100 text-gray-600'}`}>
              {apt.type?.charAt(0).toUpperCase() + apt.type?.slice(1)}
            </span>
            <div className="flex gap-1.5">
              {canStart && (
                <button onClick={() => onStatus(apt._id, 'in-progress', 'Appointment started')}
                  className="p-2 bg-blue-50 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors active:scale-90" title="Start" aria-label="Start">
                  <FiPlay className="text-sm" />
                </button>
              )}
              {apt.status === 'in-progress' && (
                <button onClick={() => onStatus(apt._id, 'completed', 'Appointment completed')}
                  className="p-2 bg-emerald-50 rounded-lg text-emerald-600 hover:bg-emerald-100 transition-colors active:scale-90" title="Complete" aria-label="Complete">
                  <FiCheck className="text-sm" />
                </button>
              )}
              {canCancel && (
                <button onClick={() => onStatus(apt._id, 'cancelled', 'Appointment cancelled')}
                  className="p-2 bg-red-50 rounded-lg text-red-600 hover:bg-red-100 transition-colors active:scale-90" title="Cancel" aria-label="Cancel">
                  <FiX className="text-sm" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const timeSlots = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'
];

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

  const shiftDate = (delta) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

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
      {/* ── 3D Hero with date navigator ── */}
      <Hero3D
        icon={FiCalendar}
        badge="Smart Scheduling · Live"
        title="Appointments"
        subtitle={`${counts.total} appointment${counts.total !== 1 ? 's' : ''} on ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}`}
        gradient="radial-gradient(1200px 420px at 100% -20%, rgba(217,70,239,0.5), transparent 60%), linear-gradient(125deg,#581c87 0%,#7c3aed 50%,#be185d 100%)"
      >
        <div className="flex items-center gap-1 glass-chip p-1">
          <button onClick={() => shiftDate(-1)} className="p-1.5 rounded-lg hover:bg-white/20 text-white" aria-label="Previous day"><FiChevronLeft size={16} /></button>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-white text-sm font-semibold outline-none cursor-pointer [color-scheme:dark] px-1" />
          <button onClick={() => shiftDate(1)} className="p-1.5 rounded-lg hover:bg-white/20 text-white" aria-label="Next day"><FiChevronRight size={16} /></button>
        </div>
        {selectedDate !== todayStr && (
          <button onClick={() => setSelectedDate(todayStr)} className="glass-chip text-white text-xs font-semibold px-3 py-2 hover:bg-white/20 transition-colors">Today</button>
        )}
        <button onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 bg-white text-purple-700 px-4 py-2 rounded-[14px] text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
          <FiPlus /> Book
        </button>
      </Hero3D>

      {/* ── KPI tiles ── */}
      <div className="scene-3d grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiTile icon={FiCalendar} accent="accent-cyan"   label="Total Today" value={counts.total} delay="0ms" />
        <KpiTile icon={FiCheck}    accent="accent-green"  label="Completed"   value={counts.completed} delay="70ms" />
        <KpiTile icon={FiPlay}     accent="accent-purple" label="In Progress" value={counts.inProgress} delay="140ms" />
        <KpiTile icon={FiClock}    accent="accent-orange" label="Waiting"     value={counts.scheduled} delay="210ms" />
      </div>

      {/* AI Schedule Insights */}
      <AIScheduleInsights />

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 text-red-700 px-4 py-3 text-sm">{error}</div>
      )}

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
        <div className="scene-3d grid grid-cols-1 lg:grid-cols-2 gap-4">
          {appointments.map((apt, idx) => (
            <AppointmentCard key={apt._id} apt={apt} idx={idx} onStatus={updateStatus} />
          ))}
        </div>
      )}

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
                <PatientSearchSelect
                  patients={patients}
                  value={form.patientId}
                  onChange={(id) => setForm({ ...form, patientId: id })}
                  required
                  placeholder="Search by name or Patient ID..."
                />
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
