import React, { useState, useEffect, useCallback } from 'react';
import {
  FiPlus, FiFileText, FiPrinter, FiX, FiTrash2, FiSave,
  FiBookOpen, FiPlay, FiCheck, FiRefreshCw, FiClock,
  FiUser, FiActivity, FiArrowRight, FiCheckCircle,
  FiList, FiAlertCircle, FiHeart
} from 'react-icons/fi';
import { FaWhatsapp, FaStethoscope } from 'react-icons/fa';
import { MdBloodtype } from 'react-icons/md';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useApi } from '../hooks/useApi';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import AIPrescriptionHelper from '../components/AIPrescriptionHelper';
import VoiceNotes from '../components/VoiceNotes';
import PrintPrescription from '../components/PrintPrescription';
import PatientSearchSelect from '../components/PatientSearchSelect';
import AnimatedCounter from '../components/AnimatedCounter';
import { Hero3D, useTilt } from '../components/Premium3D';

const emptyMed = { name: '', dosage: '', frequency: '', duration: '', timing: 'after-food' };

/* Lightweight 3D tilt wrapper so list cards can track the cursor */
function TiltCard({ className = '', style, children }) {
  const tilt = useTilt(6);
  return <div {...tilt} className={`tilt-3d ${className}`} style={style}>{children}</div>;
}

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

/* ─── Status config for queue badges ──────────────────────────────── */
const QUEUE_STATUS = {
  'WAITING_FOR_DOCTOR':   { label: 'Waiting', color: '#f59e0b', bg: '#fef3c7', pulse: true },
  'IN_CONSULTATION':      { label: 'In Consultation', color: '#10b981', bg: '#d1fae5', pulse: true },
  'scheduled':            { label: 'Scheduled', color: '#6366f1', bg: '#eef2ff', pulse: false },
  'confirmed':            { label: 'Scheduled', color: '#6366f1', bg: '#eef2ff', pulse: false },
  'CONSULTATION_COMPLETED': { label: 'Completed', color: '#64748b', bg: '#f1f5f9', pulse: false },
};

/* ─── Avatar palette ─────────────────────────────────────────────── */
const AVATAR_COLORS = [
  { bg: '#dbeafe', text: '#1d4ed8' },
  { bg: '#fce7f3', text: '#be185d' },
  { bg: '#d1fae5', text: '#065f46' },
  { bg: '#fef3c7', text: '#92400e' },
  { bg: '#ede9fe', text: '#5b21b6' },
  { bg: '#fee2e2', text: '#991b1b' },
];

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

/* ─── Vitals Display Chip ─────────────────────────────────────────── */
function VitalChip({ icon: Icon, label, value, color }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium" style={{ background: color + '18', color }}>
      <Icon size={11} />
      <span>{label}: <strong>{value}</strong></span>
    </div>
  );
}

/* ─── Queue Patient Card ──────────────────────────────────────────── */
function QueueCard({ apt, idx, onPrescribe, onCallIn, onComplete }) {
  const tilt = useTilt(6);
  const cfg = QUEUE_STATUS[apt.status] || { label: apt.status, color: '#94a3b8', bg: '#f8fafc', pulse: false };
  const clr = AVATAR_COLORS[idx % AVATAR_COLORS.length];
  const name = apt.patientId?.name || 'Patient';
  const initials = getInitials(name);
  const isWaiting = apt.status === 'WAITING_FOR_DOCTOR';
  const isInConsultation = apt.status === 'IN_CONSULTATION';

  const hexToA = (hex, a) => {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  };

  return (
    <div
      {...tilt}
      className="module-3d tilt-3d p-4 animate-pop"
      style={{ '--m-soft': hexToA(cfg.color, 0.14), '--m-shadow': hexToA(cfg.color, 0.4), animationDelay: `${Math.min(idx * 45, 360)}ms`, borderLeft: `4px solid ${cfg.color}` }}
    >
      {/* Patient row */}
      <div className="flex items-start justify-between gap-3 depth-1">
        <div className="flex items-center gap-3 min-w-0">
          {/* Token badge */}
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 relative"
            style={{ background: clr.bg, color: clr.text }}
          >
            {initials}
            {cfg.pulse && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-ping" style={{ background: cfg.color, opacity: 0.6 }} />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold text-gray-900 truncate">{name}</p>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                style={{ background: cfg.bg, color: cfg.color }}
              >
                {cfg.label}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5 truncate">
              Token #{String(apt.tokenNumber || idx + 1).padStart(2, '0')}
              {apt.patientId?.age ? ` · ${apt.patientId.age}y` : ''}
              {apt.patientId?.gender ? ` · ${apt.patientId.gender}` : ''}
            </p>
          </div>
        </div>
        {/* Action buttons */}
        <div className="flex gap-1.5 shrink-0">
          {isWaiting && (
            <button
              onClick={() => onCallIn(apt)}
              title="Call In Patient"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-sm active:scale-90"
            >
              <FiPlay size={11} /> Call In
            </button>
          )}
          {(isWaiting || isInConsultation) && (
            <button
              onClick={() => onPrescribe(apt)}
              title="Write Prescription"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-sm active:scale-90"
            >
              <FiFileText size={11} /> Rx
            </button>
          )}
          {isInConsultation && (
            <button
              onClick={() => onComplete(apt)}
              title="Mark Consultation Complete"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm active:scale-90"
            >
              <FiCheck size={11} /> Done
            </button>
          )}
        </div>
      </div>

      {/* Chief complaint */}
      {apt.chiefComplaint && (
        <div className="mt-2.5 flex items-start gap-2 depth-1">
          <FiAlertCircle size={12} className="text-orange-400 mt-0.5 shrink-0" />
          <p className="text-xs text-gray-600 italic leading-snug">"{apt.chiefComplaint}"</p>
        </div>
      )}

      {/* Nurse vitals strip */}
      {apt.vitals && Object.values(apt.vitals).some(Boolean) && (
        <div className="mt-2.5 flex flex-wrap gap-1.5 depth-1">
          <VitalChip icon={FiHeart} label="BP" value={apt.vitals.bp} color="#ef4444" />
          <VitalChip icon={FiActivity} label="Pulse" value={apt.vitals.pulse ? `${apt.vitals.pulse} bpm` : null} color="#f97316" />
          <VitalChip icon={() => <span className="text-[9px] font-bold">°F</span>} label="Temp" value={apt.vitals.temperature ? `${apt.vitals.temperature}°F` : null} color="#8b5cf6" />
          <VitalChip icon={MdBloodtype} label="SPO2" value={apt.vitals.spo2 ? `${apt.vitals.spo2}%` : null} color="#06b6d4" />
          <VitalChip icon={FiUser} label="Wt" value={apt.vitals.weight ? `${apt.vitals.weight} kg` : null} color="#10b981" />
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PRESCRIPTIONS PAGE (with Queue System)
═══════════════════════════════════════════════════ */
export default function Prescriptions() {
  const { data, loading, error, refetch } = useApi('/prescriptions?limit=50');
  const { data: patientsData } = useApi('/patients?limit=100');
  const prescriptions = data?.prescriptions || [];
  const patients = patientsData?.patients || [];

  /* ── Queue state ── */
  const [queue, setQueue] = useState([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [activeQueueTab, setActiveQueueTab] = useState('waiting'); // 'waiting' | 'all'

  /* ── Modals & write prescription ── */
  const [showAddModal, setShowAddModal] = useState(false);
  const [printRx, setPrintRx] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [queuePatient, setQueuePatient] = useState(null); // Linked appointment when writing from queue
  const [form, setForm] = useState({
    patientId: '', diagnosis: '', advice: '', followUpDate: '',
    vitals: { bp: '', weight: '', temperature: '', pulse: '', spo2: '' },
    medicines: [{ ...emptyMed }]
  });

  /* ── Fetch today's queue ── */
  const fetchQueue = useCallback(async () => {
    setQueueLoading(true);
    try {
      const { data: queueData } = await api.get('/appointments/queue/today');
      setQueue(queueData || []);
    } catch {
      // silently ignore if API not available
    } finally {
      setQueueLoading(false);
    }
  }, []);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  // Auto-refresh queue every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  /* ── Filtered queue ── */
  const filteredQueue = activeQueueTab === 'waiting'
    ? queue.filter(a => ['WAITING_FOR_DOCTOR', 'IN_CONSULTATION'].includes(a.status))
    : queue.filter(a => !['CONSULTATION_COMPLETED', 'CHECKOUT_COMPLETED', 'cancelled'].includes(a.status));

  const waitingCount = queue.filter(a => a.status === 'WAITING_FOR_DOCTOR').length;
  const inConsultCount = queue.filter(a => a.status === 'IN_CONSULTATION').length;
  const todayRxCount = prescriptions.filter(rx => {
    if (!rx.createdAt) return false;
    const d = new Date(rx.createdAt); const n = new Date();
    return d.toDateString() === n.toDateString();
  }).length;

  /* ── Queue actions ── */
  const handleCallIn = async (apt) => {
    try {
      await api.put(`/appointments/${apt._id}`, { status: 'IN_CONSULTATION' });
      toast.success(`${apt.patientId?.name} called in`);
      fetchQueue();
    } catch { toast.error('Failed to call patient in'); }
  };

  const handleComplete = async (apt) => {
    try {
      await api.put(`/appointments/${apt._id}`, { status: 'CONSULTATION_COMPLETED' });
      toast.success('Consultation marked complete');
      fetchQueue();
    } catch { toast.error('Failed to mark complete'); }
  };

  const handlePrescribeFromQueue = (apt) => {
    setQueuePatient(apt);
    setForm({
      patientId: apt.patientId?._id || '',
      diagnosis: apt.diagnosis || '',
      advice: '',
      followUpDate: '',
      vitals: {
        bp: apt.vitals?.bp || '',
        weight: apt.vitals?.weight ? String(apt.vitals.weight) : '',
        temperature: apt.vitals?.temperature ? String(apt.vitals.temperature) : '',
        pulse: apt.vitals?.pulse ? String(apt.vitals.pulse) : '',
        spo2: apt.vitals?.spo2 ? String(apt.vitals.spo2) : '',
      },
      medicines: [{ ...emptyMed }]
    });
    setShowAddModal(true);
  };

  /* ── Medicine helpers ── */
  const addMedicine = () =>
    setForm(f => ({ ...f, medicines: [...f.medicines, { ...emptyMed }] }));
  const removeMedicine = (idx) =>
    setForm(f => ({ ...f, medicines: f.medicines.filter((_, i) => i !== idx) }));
  const updateMedicine = (idx, key, value) =>
    setForm(f => {
      const next = [...f.medicines];
      next[idx] = { ...next[idx], [key]: value };
      return { ...f, medicines: next };
    });

  /* ── Submit prescription ── */
  const submit = async (e) => {
    e.preventDefault();
    if (!form.patientId) return toast.error('Please select a patient');
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        medicines: form.medicines.filter(m => m.name?.trim()),
        followUpDate: form.followUpDate || undefined,
        vitals: {
          bp: form.vitals.bp || undefined,
          weight: form.vitals.weight ? Number(form.vitals.weight) : undefined,
          temperature: form.vitals.temperature ? Number(form.vitals.temperature) : undefined,
          pulse: form.vitals.pulse ? Number(form.vitals.pulse) : undefined,
          spo2: form.vitals.spo2 ? Number(form.vitals.spo2) : undefined,
        }
      };
      const { data: created } = await api.post('/prescriptions', payload);
      toast.success('Prescription created');

      // If linked to a queue appointment, update status to IN_CONSULTATION (if not already)
      if (queuePatient) {
        try {
          if (queuePatient.status === 'WAITING_FOR_DOCTOR') {
            await api.put(`/appointments/${queuePatient._id}`, {
              status: 'IN_CONSULTATION',
              diagnosis: form.diagnosis,
            });
          }
          fetchQueue();
        } catch { /* non-critical */ }
      }

      setShowAddModal(false);
      setQueuePatient(null);
      setForm({
        patientId: '', diagnosis: '', advice: '', followUpDate: '',
        vitals: { bp: '', weight: '', temperature: '', pulse: '', spo2: '' },
        medicines: [{ ...emptyMed }]
      });
      refetch();
      // Auto-open print — enrich patientId with full patient object so name/age/gender/UHID show correctly
      if (created) {
        // Prefer queuePatient (already has populated patientId) or look up from patients list
        const patientObj = queuePatient?.patientId
          || patients.find(p => p._id === (form.patientId || created.patientId));
        const enriched = {
          ...created,
          patientId: patientObj || created.patientId,
        };
        setPrintRx(enriched);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── WhatsApp ── */
  const sendWhatsapp = async (rx) => {
    if (!rx.patientId?.phone) return toast.error('Patient has no phone number');
    const url = `${window.location.origin}/prescriptions/${rx._id}`;
    try {
      await api.post('/whatsapp/prescription', {
        phone: rx.patientId.phone,
        prescriptionUrl: url,
        patientName: rx.patientId.name
      });
      toast.success('Prescription sent via WhatsApp');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send');
    }
  };

  /* ── Templates ── */
  const saveAsTemplate = async () => {
    const templateName = prompt('Enter template name (e.g. "Fever Basic", "Diabetes Follow-up"):');
    if (!templateName?.trim()) return;
    try {
      await api.post('/prescriptions', {
        ...form,
        patientId: form.patientId || undefined,
        isTemplate: true,
        templateName: templateName.trim(),
        medicines: form.medicines.filter(m => m.name?.trim())
      });
      toast.success(`Template "${templateName}" saved!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save template');
    }
  };

  const loadTemplate = (tpl) => {
    setForm(f => ({
      ...f,
      diagnosis: tpl.diagnosis || f.diagnosis,
      advice: tpl.advice || f.advice,
      medicines: tpl.medicines?.length ? tpl.medicines.map(m => ({
        name: m.name || '', dosage: m.dosage || '', frequency: m.frequency || '',
        duration: m.duration || '', timing: m.timing || 'after-food'
      })) : f.medicines
    }));
    setShowTemplates(false);
    toast.success('Template loaded');
  };

  const { data: templateData } = useApi('/prescriptions?isTemplate=true&limit=20');

  return (
    <div className="page-enter space-y-6">

      {/* ── 3D Hero ── */}
      <Hero3D
        icon={FiFileText}
        badge="Consultation Desk · Live"
        title="Prescriptions"
        subtitle="Live patient queue & digital prescriptions"
        gradient="radial-gradient(1200px 420px at 100% -20%, rgba(45,212,191,0.5), transparent 60%), linear-gradient(125deg,#0f766e 0%,#0891b2 50%,#1d4ed8 100%)"
      >
        <button onClick={fetchQueue} disabled={queueLoading}
          className="inline-flex items-center gap-2 glass-chip text-white px-3 py-2 text-sm font-semibold hover:bg-white/20 transition-colors">
          <FiRefreshCw className={queueLoading ? 'animate-spin' : ''} /> Refresh
        </button>
        <button onClick={() => { setQueuePatient(null); setShowAddModal(true); }}
          className="inline-flex items-center gap-2 bg-white text-teal-700 px-4 py-2 rounded-[14px] text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
          <FiPlus /> New Prescription
        </button>
      </Hero3D>

      {/* ── KPI tiles ── */}
      <div className="scene-3d grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile icon={FiClock}       accent="accent-orange" label="Waiting"         value={waitingCount} delay="0ms" />
        <KpiTile icon={FiActivity}    accent="accent-green"  label="In Consultation" value={inConsultCount} delay="70ms" />
        <KpiTile icon={FiFileText}    accent="accent-cyan"   label="Total Rx"        value={data?.total ?? prescriptions.length} delay="140ms" />
        <KpiTile icon={FiCheckCircle} accent="accent-purple" label="Today"           value={todayRxCount} delay="210ms" />
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 text-red-700 px-4 py-3 text-sm">{error}</div>
      )}

      {/* ════════════════════════════════════════════════
          LIVE PATIENT QUEUE PANEL
      ════════════════════════════════════════════════ */}
      <div className="card animate-fade-up" style={{ border: '1px solid #e0f2fe', background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfeff 100%)' }}>
        {/* Queue header */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
              <FaStethoscope className="text-white text-sm" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Today's Patient Queue</h2>
              <p className="text-xs text-gray-500">
                {waitingCount > 0 && <span className="text-amber-600 font-semibold">{waitingCount} waiting</span>}
                {waitingCount > 0 && inConsultCount > 0 && ' · '}
                {inConsultCount > 0 && <span className="text-emerald-600 font-semibold">{inConsultCount} in consultation</span>}
                {waitingCount === 0 && inConsultCount === 0 && <span>No active patients right now</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Filter tabs */}
            <div className="flex items-center gap-0.5 bg-white/80 rounded-full p-0.5 border border-gray-200">
              {[
                { key: 'waiting', label: 'Active' },
                { key: 'all', label: 'All Today' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveQueueTab(tab.key)}
                  className={activeQueueTab === tab.key ? 'filter-tab-active' : 'filter-tab'}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <button
              onClick={fetchQueue}
              disabled={queueLoading}
              className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-teal-600 hover:border-teal-200 transition-colors"
              title="Refresh queue"
            >
              <FiRefreshCw size={14} className={queueLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Queue content */}
        {queueLoading && queue.length === 0 ? (
          <div className="py-6 text-center">
            <FiRefreshCw size={20} className="mx-auto text-teal-400 animate-spin mb-2" />
            <p className="text-sm text-gray-400">Loading queue...</p>
          </div>
        ) : filteredQueue.length === 0 ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <FiList size={20} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">
              {activeQueueTab === 'waiting' ? 'No active patients in queue' : 'No patients today'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {activeQueueTab === 'waiting' ? 'Patients pushed from Nurse Station will appear here' : 'Check back after receptionist check-in'}
            </p>
          </div>
        ) : (
          <div className="scene-3d grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredQueue.map((apt, idx) => (
              <QueueCard
                key={apt._id}
                apt={apt}
                idx={idx}
                onPrescribe={handlePrescribeFromQueue}
                onCallIn={handleCallIn}
                onComplete={handleComplete}
              />
            ))}
          </div>
        )}

        {/* Queue status legend */}
        {filteredQueue.length > 0 && (
          <div className="mt-4 pt-3 border-t border-white/60 flex items-center gap-4 flex-wrap">
            <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">Legend:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs text-gray-500">Waiting for Doctor</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-gray-500">In Consultation</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
              <span className="text-xs text-gray-500">Scheduled</span>
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════
          PRESCRIPTION HISTORY
      ════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <FiList className="text-teal-500" /> Prescription History
          </h2>
        </div>

        {loading ? (
          <Loader label="Loading prescriptions..." />
        ) : prescriptions.length === 0 ? (
          <EmptyState
            icon={FiFileText}
            title="No prescriptions yet"
            message="Create a digital prescription or write one from the queue above."
            action={
              <button onClick={() => setShowAddModal(true)} className="btn-primary text-sm">
                Create Prescription
              </button>
            }
          />
        ) : (
          <div className="scene-3d space-y-3">
            {prescriptions.map((rx, ridx) => (
              <TiltCard key={rx._id} className="module-3d p-5 animate-pop" style={{ '--m-soft': 'rgba(20,184,166,0.12)', '--m-shadow': 'rgba(20,184,166,0.4)', animationDelay: `${Math.min(ridx * 40, 320)}ms`, borderLeft: '4px solid #14b8a6' }}>
                <div className="flex items-start justify-between depth-1">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 text-white shadow-md"
                         style={{ background: 'linear-gradient(135deg,#0f766e,#0891b2)', boxShadow: '0 8px 16px -5px rgba(20,184,166,0.5)' }}>
                      <FiFileText className="text-lg" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">{rx.patientId?.name}</h3>
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-500 font-mono">
                          {rx.prescriptionNo}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {rx.patientId?.patientId}
                        {rx.patientId?.age ? ` | Age: ${rx.patientId.age}` : ''} |{' '}
                        {new Date(rx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      {rx.diagnosis && (
                        <p className="text-sm font-medium text-blue-600 mt-0.5">Dx: {rx.diagnosis}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => sendWhatsapp(rx)}
                      className="p-2 bg-green-50 rounded-xl text-green-600 hover:bg-green-100 transition-colors"
                      title="Send via WhatsApp"
                      aria-label="Send via WhatsApp"
                    >
                      <FaWhatsapp />
                    </button>
                    <button
                      onClick={() => {
                        // Enrich patientId if not already populated
                        const patientObj = (typeof rx.patientId === 'object' && rx.patientId)
                          ? rx.patientId
                          : patients.find(p => p._id === rx.patientId);
                        setPrintRx({ ...rx, patientId: patientObj || rx.patientId });
                      }}
                      className="p-2 bg-blue-50 rounded-xl text-blue-600 hover:bg-blue-100 transition-colors"
                      title="Print"
                      aria-label="Print"
                    >
                      <FiPrinter />
                    </button>
                  </div>
                </div>
                {rx.medicines?.length > 0 && (
                  <div className="mt-3 depth-1">
                    <div className="flex flex-wrap gap-2">
                      {rx.medicines.slice(0, 4).map((med, i) => (
                        <span key={i} className="text-xs bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg text-gray-700 font-medium">
                          {med.name} {med.dosage && <span className="text-gray-400">{med.dosage}</span>}
                          {med.frequency && <span className="text-gray-400"> · {med.frequency}</span>}
                        </span>
                      ))}
                      {rx.medicines.length > 4 && (
                        <span className="text-xs text-gray-400 px-2 py-1">+{rx.medicines.length - 4} more</span>
                      )}
                    </div>
                  </div>
                )}
              </TiltCard>
            ))}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════
          WRITE PRESCRIPTION MODAL
      ════════════════════════════════════════════════ */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl animate-scale-in my-8 shadow-2xl max-h-[90vh] overflow-y-auto">

            {/* Modal header */}
            <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                  <FiFileText className="text-white text-sm" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    {queuePatient ? `Rx for ${queuePatient.patientId?.name}` : 'Create Prescription'}
                  </h2>
                  {queuePatient && (
                    <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                      <FiClock size={11} /> Token #{String(queuePatient.tokenNumber || '').padStart(2, '0')} · Queue Patient
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="text-xs bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-100 flex items-center gap-1 font-medium"
                >
                  <FiBookOpen className="text-sm" /> Templates
                </button>
                <button
                  onClick={() => { setShowAddModal(false); setQueuePatient(null); }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <FiX className="text-xl" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">

              {/* Linked queue patient vitals banner */}
              {queuePatient?.vitals && Object.values(queuePatient.vitals).some(Boolean) && (
                <div className="rounded-xl p-3 border border-emerald-200 bg-emerald-50">
                  <p className="text-xs font-semibold text-emerald-700 mb-2 flex items-center gap-1.5">
                    <FiActivity size={12} /> Nurse Vitals (Pre-filled)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {queuePatient.vitals.bp && <span className="text-xs bg-white px-2 py-1 rounded-lg border border-emerald-100 font-medium text-gray-700">BP: {queuePatient.vitals.bp}</span>}
                    {queuePatient.vitals.pulse && <span className="text-xs bg-white px-2 py-1 rounded-lg border border-emerald-100 font-medium text-gray-700">Pulse: {queuePatient.vitals.pulse} bpm</span>}
                    {queuePatient.vitals.temperature && <span className="text-xs bg-white px-2 py-1 rounded-lg border border-emerald-100 font-medium text-gray-700">Temp: {queuePatient.vitals.temperature}°F</span>}
                    {queuePatient.vitals.spo2 && <span className="text-xs bg-white px-2 py-1 rounded-lg border border-emerald-100 font-medium text-gray-700">SpO2: {queuePatient.vitals.spo2}%</span>}
                    {queuePatient.vitals.weight && <span className="text-xs bg-white px-2 py-1 rounded-lg border border-emerald-100 font-medium text-gray-700">Wt: {queuePatient.vitals.weight} kg</span>}
                  </div>
                </div>
              )}

              {/* Chief complaint banner */}
              {queuePatient?.chiefComplaint && (
                <div className="rounded-xl p-3 border border-amber-200 bg-amber-50">
                  <p className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1.5">
                    <FiAlertCircle size={12} /> Chief Complaint
                  </p>
                  <p className="text-sm text-gray-700 italic">"{queuePatient.chiefComplaint}"</p>
                </div>
              )}

              {/* Templates */}
              {showTemplates && (
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                  <p className="text-xs font-semibold text-purple-700 mb-2">Load a saved template:</p>
                  {(templateData?.prescriptions || []).length === 0 ? (
                    <p className="text-xs text-gray-500">No templates saved yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {(templateData?.prescriptions || []).map(tpl => (
                        <button
                          key={tpl._id}
                          type="button"
                          onClick={() => loadTemplate(tpl)}
                          className="text-xs bg-white text-purple-700 px-3 py-1.5 rounded-lg border border-purple-200 hover:bg-purple-100 font-medium"
                        >
                          {tpl.templateName || tpl.diagnosis || 'Unnamed'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={submit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Patient *</label>
                    {queuePatient ? (
                      <div className="input-field bg-gray-50 flex items-center gap-2 text-sm text-gray-700 cursor-not-allowed">
                        <FiUser size={14} className="text-gray-400" />
                        {queuePatient.patientId?.name}
                      </div>
                    ) : (
                      <PatientSearchSelect
                        patients={patients}
                        value={form.patientId}
                        onChange={(id) => setForm({ ...form, patientId: id })}
                        required
                        placeholder="Search by name or ID..."
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
                    <input
                      type="text" className="input-field" placeholder="e.g., Viral Fever"
                      value={form.diagnosis}
                      onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                    />
                  </div>
                </div>

                {/* Vitals */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Vitals</p>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { key: 'bp', label: 'BP', placeholder: '120/80' },
                      { key: 'pulse', label: 'Pulse', placeholder: '78' },
                      { key: 'temperature', label: 'Temp°F', placeholder: '98.6' },
                      { key: 'spo2', label: 'SpO2%', placeholder: '99' },
                      { key: 'weight', label: 'Weight', placeholder: '70' },
                    ].map(v => (
                      <div key={v.key}>
                        <label className="block text-[11px] font-medium text-gray-500 mb-1">{v.label}</label>
                        <input
                          className="input-field py-1.5 text-sm"
                          placeholder={v.placeholder}
                          value={form.vitals[v.key]}
                          onChange={(e) => setForm({ ...form, vitals: { ...form.vitals, [v.key]: e.target.value } })}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Prescription Assistant */}
                <AIPrescriptionHelper
                  patientAge={queuePatient?.patientId?.age || patients.find(p => p._id === form.patientId)?.age}
                  patientAllergies={queuePatient?.patientId?.allergies || patients.find(p => p._id === form.patientId)?.allergies}
                  onAddMedicines={(meds) => {
                    setForm(f => ({
                      ...f,
                      medicines: [
                        ...f.medicines.filter(m => m.name?.trim()),
                        ...meds
                      ]
                    }));
                    toast.success(`Added ${meds.length} medicine${meds.length > 1 ? 's' : ''} from AI`);
                  }}
                />

                {/* Medicines */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-700">Medicines</label>
                    <button
                      type="button" onClick={addMedicine}
                      className="text-xs text-teal-600 font-medium hover:text-teal-700 flex items-center gap-1"
                    >
                      <FiPlus size={12} /> Add Medicine
                    </button>
                  </div>
                  {form.medicines.map((med, idx) => (
                    <div key={idx} className="flex gap-2 mb-2 items-center">
                      <input
                        className="input-field flex-1 py-2" placeholder="Medicine name"
                        value={med.name}
                        onChange={(e) => updateMedicine(idx, 'name', e.target.value)}
                      />
                      <input
                        className="input-field w-20 py-2" placeholder="1-0-1"
                        value={med.frequency}
                        onChange={(e) => updateMedicine(idx, 'frequency', e.target.value)}
                      />
                      <input
                        className="input-field w-20 py-2" placeholder="5 days"
                        value={med.duration}
                        onChange={(e) => updateMedicine(idx, 'duration', e.target.value)}
                      />
                      <select
                        className="input-field w-28 py-2"
                        value={med.timing}
                        onChange={(e) => updateMedicine(idx, 'timing', e.target.value)}
                      >
                        <option value="after-food">After food</option>
                        <option value="before-food">Before food</option>
                        <option value="empty-stomach">Empty stomach</option>
                        <option value="bedtime">Bedtime</option>
                      </select>
                      {form.medicines.length > 1 && (
                        <button
                          type="button" onClick={() => removeMedicine(idx)}
                          className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label="Remove medicine"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Advice */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Advice</label>
                  <textarea
                    className="input-field" rows={2} placeholder="Rest, drink fluids..."
                    value={form.advice}
                    onChange={(e) => setForm({ ...form, advice: e.target.value })}
                  />
                </div>

                {/* Voice Notes */}
                <VoiceNotes
                  onInsertText={(text) => {
                    setForm(f => ({ ...f, advice: f.advice ? f.advice + '\n\n' + text : text }));
                    toast.success('Notes inserted into advice field');
                  }}
                />

                {/* Follow-up */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
                  <input
                    type="date" className="input-field"
                    value={form.followUpDate}
                    onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
                  />
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setShowAddModal(false); setQueuePatient(null); }} className="btn-secondary flex-1">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveAsTemplate}
                    className="flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl border border-purple-200 text-purple-700 font-semibold text-sm hover:bg-purple-50 transition-colors"
                  >
                    <FiSave size={14} /> Save Template
                  </button>
                  <button type="submit" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {submitting ? (
                      <><FiRefreshCw size={14} className="animate-spin" /> Saving...</>
                    ) : (
                      <><FiCheckCircle size={14} /> {queuePatient ? 'Save & Print Rx' : 'Create Prescription'}</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Print Overlay */}
      {printRx && <PrintPrescription prescription={printRx} onClose={() => setPrintRx(null)} />}
    </div>
  );
}
