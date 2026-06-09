import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  FiUser, FiActivity, FiFileText, FiCheckCircle, FiPlus,
  FiTrash2, FiSave, FiPrinter, FiX, FiSearch, FiZap,
  FiAlertTriangle, FiClock, FiHeart, FiThermometer,
  FiArrowRight, FiMessageSquare, FiBookOpen
} from 'react-icons/fi';
import { FaWhatsapp, FaRobot, FaStethoscope } from 'react-icons/fa';
import { MdBloodtype } from 'react-icons/md';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useApi } from '../hooks/useApi';
import Loader from '../components/Loader';
import PrintPrescription from '../components/PrintPrescription';

// ──────────────────────────────────────────────
// Chief Complaint chips per specialty
// ──────────────────────────────────────────────
const CC_BY_SPECIALTY = {
  general: ['Fever', 'Cough', 'Cold', 'Headache', 'Body ache', 'Vomiting', 'Diarrhoea', 'Fatigue', 'Sore throat', 'Chest pain', 'Back pain', 'Abdominal pain', 'Dizziness', 'Loss of appetite', 'Weakness'],
  cardiology: ['Chest pain', 'Palpitations', 'Breathlessness', 'Leg swelling', 'Syncope', 'Hypertension', 'Irregular heartbeat', 'Orthopnoea', 'Fatigue', 'Angina'],
  pediatric: ['Fever', 'Cough', 'Cold', 'Vomiting', 'Loose stools', 'Rash', 'Poor feeding', 'Ear pain', 'Throat pain', 'Convulsion'],
  gynecology: ['Irregular periods', 'Pain during periods', 'White discharge', 'Lower abdominal pain', 'Missed period', 'Pregnancy checkup', 'Infertility', 'Hot flushes'],
  ortho: ['Back pain', 'Knee pain', 'Shoulder pain', 'Hip pain', 'Neck pain', 'Swelling in joint', 'Fracture', 'Limping', 'Muscle cramp', 'Numbness'],
  dermatology: ['Rash', 'Itching', 'Acne', 'Hair loss', 'Skin discolouration', 'Eczema', 'Psoriasis', 'Fungal infection', 'Wart', 'Nail problem'],
  ent: ['Earache', 'Hearing loss', 'Nasal block', 'Sore throat', 'Tonsillitis', 'Nose bleed', 'Snoring', 'Tinnitus', 'Difficulty swallowing'],
  dental: ['Tooth pain', 'Bleeding gums', 'Sensitivity', 'Bad breath', 'Cavity', 'Gum swelling', 'Loose tooth', 'Broken tooth'],
  ophthalmology: ['Blurred vision', 'Eye pain', 'Redness', 'Watering eyes', 'Double vision', 'Foreign body sensation', 'Night blindness'],
  neurology: ['Headache', 'Dizziness', 'Seizure', 'Numbness', 'Weakness in limbs', 'Memory loss', 'Tremor', 'Slurred speech'],
  endocrinology: ['Increased thirst', 'Frequent urination', 'Weight gain', 'Weight loss', 'Fatigue', 'Hair fall', 'Cold intolerance', 'Irregular periods'],
  pulmonology: ['Breathlessness', 'Cough', 'Wheezing', 'Chest tightness', 'Hemoptysis', 'Cyanosis', 'Snoring', 'Sleep apnoea'],
};

// Quick diagnosis suggestions
const QUICK_DIAGNOSES = {
  general: ['Viral Fever', 'URTI', 'Dengue Fever', 'Typhoid', 'Gastroenteritis', 'Malaria', 'COVID-19', 'Pneumonia', 'UTI', 'Hypertension', 'Type 2 Diabetes', 'Anaemia'],
  cardiology: ['Hypertension', 'Angina', 'Heart Failure', 'AF', 'Myocardial Infarction', 'Dyslipidaemia'],
  pediatric: ['Febrile Illness', 'URTI', 'Bronchitis', 'GERD', 'Acute Diarrhoea', 'Viral Exanthem'],
};

const emptyMed = { name: '', dosage: '', frequency: '', duration: '', timing: 'after-food' };

const FREQ_SHORTCUTS = ['1-0-1', '1-1-1', '0-0-1', '1-0-0', '0-1-0', 'SOS', 'OD', 'BD', 'TDS', 'QID'];
const DUR_SHORTCUTS = ['3 days', '5 days', '7 days', '10 days', '14 days', '1 month', '2 months', '3 months'];

// ──────────────────────────────────────────────
// Main VisitPad Component
// ──────────────────────────────────────────────
export default function VisitPad() {
  const [searchParams] = useSearchParams();
  const preselectedPatientId = searchParams.get('patientId');
  const preselectedAppointmentId = searchParams.get('appointmentId');

  // Patient search
  const [patientQuery, setPatientQuery] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searching, setSearching] = useState(false);

  // Specialty
  const [specialty, setSpecialty] = useState('general');

  // Visit form
  const [chiefComplaints, setChiefComplaints] = useState([]);
  const [customCC, setCustomCC] = useState('');
  const [vitals, setVitals] = useState({ bp: '', pulse: '', weight: '', temp: '', spo2: '', rbs: '', height: '' });
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [advice, setAdvice] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [medicines, setMedicines] = useState([{ ...emptyMed }]);

  // AI
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [ddiAlerts, setDdiAlerts] = useState([]);
  const [ddiChecking, setDdiChecking] = useState(false);

  // UI state
  const [step, setStep] = useState(1); // 1=patient, 2=visit, 3=rx, 4=done
  const [saving, setSaving] = useState(false);
  const [savedRx, setSavedRx] = useState(null);
  const [printRx, setPrintRx] = useState(null);
  const [activeSection, setActiveSection] = useState('complaints');

  const [currentAppointment, setCurrentAppointment] = useState(null);
  const [waitingQueue, setWaitingQueue] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(false);

  const fetchWaitingQueue = async () => {
    setLoadingQueue(true);
    try {
      const { data } = await api.get('/appointments/queue/today');
      const filtered = (data || []).filter(apt => 
        ['WAITING_FOR_DOCTOR', 'IN_CONSULTATION'].includes(apt.status)
      );
      setWaitingQueue(filtered);
    } catch {
      setWaitingQueue([]);
    } finally {
      setLoadingQueue(false);
    }
  };

  useEffect(() => {
    if (step === 1) {
      fetchWaitingQueue();
    }
  }, [step]);

  const acceptWaitingPatient = async (apt) => {
    try {
      const { data } = await api.put(`/appointments/${apt._id}`, { status: 'IN_CONSULTATION' });
      setCurrentAppointment(data);
      const patient = apt.patientId;
      setSelectedPatient(patient);
      
      setVitals({
        bp: apt.vitals?.bp || '',
        pulse: apt.vitals?.pulse || '',
        weight: apt.vitals?.weight || '',
        temp: apt.vitals?.temperature || '',
        spo2: apt.vitals?.spo2 || '',
        rbs: apt.vitals?.bloodSugar || '',
        height: apt.vitals?.height || '',
      });
      
      if (apt.chiefComplaint) {
        setChiefComplaints([apt.chiefComplaint]);
      } else {
        setChiefComplaints([]);
      }
      
      setStep(2);
      toast.success(`Consultation started for ${patient.name}`);
    } catch (e) {
      toast.error('Failed to accept patient consultation request');
    }
  };

  // Load pre-selected patient
  const { data: prePatient } = useApi(preselectedPatientId ? `/patients/${preselectedPatientId}` : null);
  useEffect(() => {
    if (prePatient && !selectedPatient) {
      setSelectedPatient(prePatient);
      setStep(2);
    }
  }, [prePatient, selectedPatient]);

  // Load pre-selected appointment
  const { data: preAppointment } = useApi(preselectedAppointmentId ? `/appointments/${preselectedAppointmentId}` : null);
  useEffect(() => {
    if (preAppointment && !currentAppointment) {
      setCurrentAppointment(preAppointment);
      const patient = preAppointment.patientId;
      setSelectedPatient(patient);
      
      setVitals({
        bp: preAppointment.vitals?.bp || '',
        pulse: preAppointment.vitals?.pulse || '',
        weight: preAppointment.vitals?.weight || '',
        temp: preAppointment.vitals?.temperature || '',
        spo2: preAppointment.vitals?.spo2 || '',
        rbs: preAppointment.vitals?.bloodSugar || '',
        height: preAppointment.vitals?.height || '',
      });
      
      if (preAppointment.chiefComplaint) {
        setChiefComplaints([preAppointment.chiefComplaint]);
      } else {
        setChiefComplaints([]);
      }
      
      setStep(2);
    }
  }, [preAppointment, currentAppointment]);

  // Patient search
  useEffect(() => {
    if (!patientQuery.trim() || patientQuery.length < 2) { setPatientResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await api.get(`/patients?search=${encodeURIComponent(patientQuery)}&limit=8`);
        setPatientResults(data?.patients || []);
      } catch { setPatientResults([]); }
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [patientQuery]);

  // DDI check whenever medicines change
  useEffect(() => {
    const named = medicines.filter(m => m.name?.trim());
    if (named.length < 2) { setDdiAlerts([]); return; }
    const t = setTimeout(async () => {
      setDdiChecking(true);
      try {
        const { data } = await api.post('/doctor/drug-interactions/check', {
          medicines: named.map(m => m.name.trim())
        });
        setDdiAlerts(data?.interactions?.filter(i => i.severity === 'major' || i.severity === 'contraindicated') || []);
      } catch { setDdiAlerts([]); }
      setDdiChecking(false);
    }, 800);
    return () => clearTimeout(t);
  }, [medicines]);

  // AI prescription suggestions
  const getAISuggestions = async () => {
    if (!diagnosis.trim()) { toast.error('Enter a diagnosis first'); return; }
    setAiLoading(true);
    setAiSuggestions(null);
    try {
      const { data } = await api.post('/ai/prescribe', {
        diagnosis,
        age: selectedPatient?.age,
        allergies: selectedPatient?.allergies || [],
        symptoms: chiefComplaints.join(', ')
      });
      setAiSuggestions(data);
    } catch {
      toast.error('AI suggestion failed');
    }
    setAiLoading(false);
  };

  const addAIMedicines = (meds) => {
    const newMeds = meds.map(m => ({
      name: m.name + (m.dosage ? ` ${m.dosage}` : ''),
      dosage: m.dosage || '',
      frequency: m.frequency || '',
      duration: m.duration || '',
      timing: m.timing || 'after-food'
    }));
    setMedicines(prev => [...prev.filter(m => m.name?.trim()), ...newMeds]);
    setAiSuggestions(null);
    toast.success(`Added ${newMeds.length} medicines`);
  };

  const toggleCC = (cc) => {
    setChiefComplaints(prev =>
      prev.includes(cc) ? prev.filter(c => c !== cc) : [...prev, cc]
    );
  };

  const addCustomCC = () => {
    if (!customCC.trim()) return;
    if (!chiefComplaints.includes(customCC.trim())) {
      setChiefComplaints(prev => [...prev, customCC.trim()]);
    }
    setCustomCC('');
  };

  const updateMed = (idx, key, val) => {
    setMedicines(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: val };
      return next;
    });
  };

  const saveVisit = async () => {
    if (!selectedPatient) return toast.error('Select a patient first');
    if (chiefComplaints.length === 0 && !diagnosis) return toast.error('Add complaints or diagnosis');
    setSaving(true);
    try {
      const payload = {
        patientId: selectedPatient._id,
        diagnosis,
        chiefComplaints,
        advice: [advice, notes].filter(Boolean).join('\n\n'),
        followUpDate: followUpDate || undefined,
        vitals: {
          bp: vitals.bp || undefined,
          pulse: vitals.pulse ? Number(vitals.pulse) : undefined,
          weight: vitals.weight ? Number(vitals.weight) : undefined,
          temperature: vitals.temp ? Number(vitals.temp) : undefined,
          spo2: vitals.spo2 ? Number(vitals.spo2) : undefined,
          rbs: vitals.rbs ? Number(vitals.rbs) : undefined,
          height: vitals.height ? Number(vitals.height) : undefined,
        },
        medicines: medicines.filter(m => m.name?.trim()),
        visitType: 'consultation',
        specialty,
      };
      const { data } = await api.post('/prescriptions', payload);
      
      if (currentAppointment) {
        await api.put(`/appointments/${currentAppointment._id}`, {
          status: 'CONSULTATION_COMPLETED',
          vitals: {
            bp: vitals.bp || undefined,
            pulse: vitals.pulse ? Number(vitals.pulse) : undefined,
            weight: vitals.weight ? Number(vitals.weight) : undefined,
            temperature: vitals.temp ? Number(vitals.temp) : undefined,
            spo2: vitals.spo2 ? Number(vitals.spo2) : undefined,
            bloodSugar: vitals.rbs ? Number(vitals.rbs) : undefined,
            height: vitals.height ? Number(vitals.height) : undefined,
          },
          chiefComplaint: chiefComplaints.join(', '),
          diagnosis,
          prescriptionDetails: medicines.filter(m => m.name?.trim()).map(m => `${m.name} (${m.dosage || ''}) - ${m.frequency} for ${m.duration}`).join('\n')
        });
      }

      setSavedRx(data);
      // Enrich patientId with full patient object so name/age/gender/UHID display correctly on print
      const enrichedRx = { ...data, patientId: selectedPatient || data.patientId };
      setPrintRx(enrichedRx); // Auto-open print prescription pad
      setStep(4);
      toast.success('Visit saved successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save visit');
    }
    setSaving(false);
  };

  const sendWhatsApp = async () => {
    if (!selectedPatient?.phone) return toast.error('Patient has no phone number');
    try {
      await api.post('/whatsapp/prescription', {
        phone: selectedPatient.phone,
        prescriptionUrl: `${window.location.origin}/prescriptions/${savedRx?._id}`,
        patientName: selectedPatient.name
      });
      toast.success('Sent via WhatsApp!');
    } catch { toast.error('Failed to send WhatsApp'); }
  };

  const resetVisit = () => {
    setSelectedPatient(null); setStep(1); setPatientQuery('');
    setChiefComplaints([]); setVitals({ bp: '', pulse: '', weight: '', temp: '', spo2: '', rbs: '', height: '' });
    setDiagnosis(''); setNotes(''); setAdvice(''); setFollowUpDate('');
    setMedicines([{ ...emptyMed }]); setAiSuggestions(null); setDdiAlerts([]); setSavedRx(null);
    setCurrentAppointment(null);
    setActiveSection('complaints');
  };

  const specialties = Object.keys(CC_BY_SPECIALTY);

  return (
    <div className="page-enter space-y-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
              <FaStethoscope className="text-white text-base" />
            </div>
            Visit Pad
          </h1>
          <p className="text-gray-500 mt-1 ml-[52px] text-sm">Complete a patient visit — Complaints → Vitals → Diagnosis → Rx</p>
        </div>
        {step > 1 && step < 4 && (
          <button onClick={resetVisit} className="text-sm text-gray-500 hover:text-red-500 flex items-center gap-1 transition-colors">
            <FiX /> New Visit
          </button>
        )}
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 text-sm">
        {[
          { n: 1, label: 'Patient' },
          { n: 2, label: 'Examine' },
          { n: 3, label: 'Prescribe' },
          { n: 4, label: 'Done' }
        ].map((s, i, arr) => (
          <React.Fragment key={s.n}>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              step === s.n ? 'bg-teal-600 text-white shadow-sm' :
              step > s.n ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'
            }`}>
              {step > s.n ? <FiCheckCircle className="text-xs" /> : <span>{s.n}</span>}
              {s.label}
            </div>
            {i < arr.length - 1 && <FiArrowRight className="text-gray-300 flex-shrink-0" />}
          </React.Fragment>
        ))}
      </div>

      {/* ══════════ STEP 1: SELECT PATIENT ══════════ */}
      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          {/* Find Patient search */}
          <div className="card h-fit">
            <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FiSearch className="text-teal-500" /> Search Patient by ID / Name
            </h2>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={patientQuery}
                onChange={e => setPatientQuery(e.target.value)}
                placeholder="Search by name, phone, or patient ID..."
                className="input-field pl-9 text-sm"
                autoFocus
              />
            </div>
            {searching && <p className="text-xs text-gray-400 mt-2">Searching...</p>}
            {patientResults.length > 0 && (
              <div className="mt-2 space-y-1 max-h-[300px] overflow-y-auto custom-scroll">
                {patientResults.map(p => (
                  <button
                    key={p._id}
                    onClick={async () => {
                      setPatientQuery('');
                      setPatientResults([]);
                      try {
                        const { data } = await api.get('/appointments/queue/today');
                        const apt = (data || []).find(a => 
                          a.patientId?._id === p._id || a.patientId === p._id
                        );
                        if (apt) {
                          acceptWaitingPatient(apt);
                        } else {
                          setSelectedPatient(p);
                          setCurrentAppointment(null);
                          setVitals({ bp: '', pulse: '', weight: '', temp: '', spo2: '', rbs: '', height: '' });
                          setChiefComplaints([]);
                          setStep(2);
                        }
                      } catch {
                        setSelectedPatient(p);
                        setCurrentAppointment(null);
                        setStep(2);
                      }
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-teal-50 border border-transparent hover:border-teal-200 transition-all text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xs flex-shrink-0">
                        {p.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{p.name}</p>
                        <p className="text-[10px] text-gray-500">{p.patientId} • {p.age ? `${p.age} yrs` : ''} • {p.phone || 'No phone'}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <p className="text-[11px] text-gray-400 mt-4">Don't have the patient? <Link to="/patients" className="text-teal-600 font-medium">Add new patient →</Link></p>
          </div>

          {/* Clinical queue list */}
          <div className="card">
            <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
              <FiActivity className="text-teal-500 animate-pulse" /> Pending Consultations (From Nurse)
            </h2>
            {loadingQueue ? (
              <div className="py-8 text-center"><Loader label="Loading queue..." /></div>
            ) : waitingQueue.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                <FiClock className="mx-auto text-gray-300 text-lg mb-2" />
                No patients waiting in queue from Nurse Station.
              </div>
            ) : (
              <div className="space-y-2 max-h-[350px] overflow-y-auto custom-scroll pr-1">
                {waitingQueue.map(apt => (
                  <div key={apt._id} className="p-3 border rounded-xl bg-gray-50/50 hover:border-teal-200 transition-all flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-gray-900">{apt.patientId?.name}</p>
                      <p className="text-[10px] font-mono text-gray-500 mt-0.5">ID: {apt.patientId?.patientId} | Token: T-{apt.tokenNumber}</p>
                      {apt.chiefComplaint && (
                        <p className="text-[10px] text-red-500 italic mt-1">Complaint: "{apt.chiefComplaint}"</p>
                      )}
                      <p className="text-[10px] text-gray-400 mt-0.5">Vitals Checked: {apt.vitals?.bp ? `BP ${apt.vitals.bp}, Pulse ${apt.vitals.pulse}` : 'Partial'}</p>
                    </div>
                    <button
                      onClick={() => acceptWaitingPatient(apt)}
                      className="btn-primary !py-1.5 !px-3 text-[11px] flex items-center gap-1"
                    >
                      Accept <FiArrowRight />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════ STEP 2+3: VISIT FORM ══════════ */}
      {(step === 2 || step === 3) && selectedPatient && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-in">
          {/* Left: Patient card + specialty */}
          <div className="space-y-4">
            {/* Patient banner */}
            <div className="card bg-gradient-to-br from-teal-600 to-emerald-700 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center font-bold text-xl flex-shrink-0">
                  {selectedPatient.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold">{selectedPatient.name}</p>
                  <p className="text-teal-100 text-xs mt-0.5">
                    {selectedPatient.gender || '—'} • {selectedPatient.age ? `${selectedPatient.age} yrs` : '—'}
                  </p>
                  <p className="text-teal-200 text-xs">{selectedPatient.patientId}</p>
                </div>
              </div>
              {selectedPatient.allergies && (
                <div className="mt-3 px-3 py-1.5 bg-red-500/30 rounded-lg flex items-center gap-1.5 text-xs">
                  <FiAlertTriangle className="flex-shrink-0" />
                  <span>Allergic: {selectedPatient.allergies}</span>
                </div>
              )}
              {selectedPatient.conditions && (
                <div className="mt-2 px-3 py-1.5 bg-white/10 rounded-lg text-xs">
                  🩺 {selectedPatient.conditions}
                </div>
              )}
              <button onClick={() => { setStep(1); setSelectedPatient(null); }} className="mt-3 text-xs text-teal-200 hover:text-white transition-colors">
                ← Change patient
              </button>
            </div>

            {/* Patient Vitals (Nurse Intake) Summary */}
            {Object.values(vitals).some(v => v) && (
              <div className="card bg-gray-50 border-gray-200 text-gray-700 p-4 space-y-2.5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FiActivity className="text-rose-500 animate-pulse" /> Patient Vitals (Nurse Intake)
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {vitals.bp && (
                    <div className="bg-white p-2 rounded-lg border flex flex-col">
                      <span className="text-[10px] text-gray-400 font-medium">Blood Pressure</span>
                      <span className="font-bold text-gray-800">{vitals.bp} mmHg</span>
                    </div>
                  )}
                  {vitals.pulse && (
                    <div className="bg-white p-2 rounded-lg border flex flex-col">
                      <span className="text-[10px] text-gray-400 font-medium">Pulse Rate</span>
                      <span className="font-bold text-gray-800">{vitals.pulse} bpm</span>
                    </div>
                  )}
                  {vitals.temp && (
                    <div className="bg-white p-2 rounded-lg border flex flex-col">
                      <span className="text-[10px] text-gray-400 font-medium">Temperature</span>
                      <span className="font-bold text-gray-800">{vitals.temp} °F</span>
                    </div>
                  )}
                  {vitals.weight && (
                    <div className="bg-white p-2 rounded-lg border flex flex-col">
                      <span className="text-[10px] text-gray-400 font-medium">Weight</span>
                      <span className="font-bold text-gray-800">{vitals.weight} kg</span>
                    </div>
                  )}
                  {vitals.height && (
                    <div className="bg-white p-2 rounded-lg border flex flex-col">
                      <span className="text-[10px] text-gray-400 font-medium">Height</span>
                      <span className="font-bold text-gray-800">{vitals.height} cm</span>
                    </div>
                  )}
                  {vitals.spo2 && (
                    <div className="bg-white p-2 rounded-lg border flex flex-col">
                      <span className="text-[10px] text-gray-400 font-medium">SpO₂</span>
                      <span className="font-bold text-gray-800">{vitals.spo2} %</span>
                    </div>
                  )}
                  {vitals.rbs && (
                    <div className="bg-white p-2 rounded-lg border flex flex-col col-span-2">
                      <span className="text-[10px] text-gray-400 font-medium">Blood Sugar (RBS)</span>
                      <span className="font-bold text-gray-800">{vitals.rbs} mg/dL</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Specialty */}
            <div className="card">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Specialty</label>
              <select
                value={specialty}
                onChange={e => setSpecialty(e.target.value)}
                className="input-field text-sm"
              >
                {specialties.map(s => (
                  <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>

            {/* Section nav */}
            <div className="card space-y-1">
              {[
                { id: 'complaints', label: 'Chief Complaints', icon: FiMessageSquare, count: chiefComplaints.length },
                { id: 'vitals', label: 'Vitals', icon: FiActivity },
                { id: 'diagnosis', label: 'Diagnosis & Notes', icon: FaStethoscope },
                { id: 'medicines', label: 'Medicines', icon: FiFileText, count: medicines.filter(m=>m.name).length },
                { id: 'advice', label: 'Advice & Follow-up', icon: FiCheckCircle },
              ].map(sec => (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeSection === sec.id
                      ? 'bg-teal-50 text-teal-700 border border-teal-200'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <sec.icon className="text-base" /> {sec.label}
                  </span>
                  {sec.count > 0 && (
                    <span className="text-xs bg-teal-100 text-teal-700 rounded-full px-2 py-0.5">{sec.count}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Save button */}
            <button
              onClick={saveVisit}
              disabled={saving}
              className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-3"
            >
              {saving ? (
                <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Saving...</>
              ) : (
                <><FiSave /> Save Visit & Generate Rx</>
              )}
            </button>
          </div>

          {/* Right: Active section */}
          <div className="lg:col-span-2 space-y-4">
            {/* ── Chief Complaints ── */}
            {activeSection === 'complaints' && (
              <div className="card animate-fade-in space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FiMessageSquare className="text-teal-500" /> Chief Complaints
                </h3>
                {/* Quick chips */}
                <div className="flex flex-wrap gap-2">
                  {(CC_BY_SPECIALTY[specialty] || CC_BY_SPECIALTY.general).map(cc => (
                    <button
                      key={cc}
                      onClick={() => toggleCC(cc)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                        chiefComplaints.includes(cc)
                          ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-teal-300 hover:text-teal-600'
                      }`}
                    >
                      {cc}
                    </button>
                  ))}
                </div>
                {/* Custom complaint */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customCC}
                    onChange={e => setCustomCC(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addCustomCC()}
                    placeholder="Type custom complaint..."
                    className="input-field flex-1 text-sm"
                  />
                  <button onClick={addCustomCC} className="btn-primary px-4 text-sm">Add</button>
                </div>
                {/* Selected complaints */}
                {chiefComplaints.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Selected ({chiefComplaints.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {chiefComplaints.map(cc => (
                        <span key={cc} className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white rounded-full text-xs font-medium">
                          {cc}
                          <button onClick={() => toggleCC(cc)} className="hover:text-red-200 transition-colors">
                            <FiX className="text-[10px]" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Vitals ── */}
            {activeSection === 'vitals' && (
              <div className="card animate-fade-in space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FiActivity className="text-rose-500" /> Vitals
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { key: 'bp', label: 'Blood Pressure', placeholder: '120/80 mmHg', icon: <MdBloodtype className="text-red-500" /> },
                    { key: 'pulse', label: 'Pulse Rate', placeholder: '72 bpm', icon: <FiHeart className="text-pink-500" /> },
                    { key: 'temp', label: 'Temperature', placeholder: '98.6 °F', icon: <FiThermometer className="text-orange-500" /> },
                    { key: 'weight', label: 'Weight', placeholder: '65 kg', icon: <span className="text-blue-500 font-bold text-xs">kg</span> },
                    { key: 'height', label: 'Height', placeholder: '170 cm', icon: <span className="text-indigo-500 font-bold text-xs">cm</span> },
                    { key: 'spo2', label: 'SpO₂', placeholder: '98 %', icon: <span className="text-cyan-500 font-bold text-xs">%</span> },
                    { key: 'rbs', label: 'RBS', placeholder: '120 mg/dL', icon: <span className="text-amber-500 font-bold text-xs">mg</span> },
                  ].map(v => (
                    <div key={v.key} className="relative">
                      <label className="block text-xs font-medium text-gray-500 mb-1">{v.label}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2">{v.icon}</span>
                        <input
                          type="text"
                          value={vitals[v.key]}
                          onChange={e => setVitals(prev => ({ ...prev, [v.key]: e.target.value }))}
                          placeholder={v.placeholder}
                          className="input-field pl-8 text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Diagnosis & Notes ── */}
            {activeSection === 'diagnosis' && (
              <div className="card animate-fade-in space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FaStethoscope className="text-violet-500" /> Diagnosis & Clinical Notes
                </h3>
                {/* Quick diagnosis chips */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Quick Diagnosis</p>
                  <div className="flex flex-wrap gap-2">
                    {(QUICK_DIAGNOSES[specialty] || QUICK_DIAGNOSES.general).map(d => (
                      <button
                        key={d}
                        onClick={() => setDiagnosis(d)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                          diagnosis === d
                            ? 'bg-violet-600 text-white border-violet-600'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-violet-300 hover:text-violet-600'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis *</label>
                  <input
                    type="text"
                    value={diagnosis}
                    onChange={e => setDiagnosis(e.target.value)}
                    placeholder="e.g., Viral Fever, Type 2 DM, Hypertension"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Notes (SOAP)</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={4}
                    placeholder="Subjective: Patient complaints...\nObjective: Examination findings...\nAssessment: ...\nPlan: ..."
                    className="input-field resize-none font-mono text-sm"
                  />
                </div>
              </div>
            )}

            {/* ── Medicines ── */}
            {activeSection === 'medicines' && (
              <div className="card animate-fade-in space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <FiFileText className="text-blue-500" /> Medicines
                  </h3>
                  <button
                    onClick={getAISuggestions}
                    disabled={aiLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 text-violet-700 text-xs font-medium hover:bg-violet-100 transition-all border border-violet-200"
                  >
                    {aiLoading ? (
                      <span className="w-3 h-3 border border-violet-400 border-t-violet-700 rounded-full animate-spin" />
                    ) : (
                      <FaRobot className="text-xs" />
                    )}
                    AI Suggest
                  </button>
                </div>

                {/* DDI Alert */}
                {ddiAlerts.length > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-xs font-bold text-red-700 flex items-center gap-1 mb-1">
                      <FiAlertTriangle /> Drug Interaction Alert
                    </p>
                    {ddiAlerts.map((alert, i) => (
                      <p key={i} className="text-xs text-red-600">
                        ⚠️ <strong>{alert.drug1}</strong> + <strong>{alert.drug2}</strong>: {alert.description}
                      </p>
                    ))}
                  </div>
                )}
                {ddiChecking && (
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <span className="w-3 h-3 border border-gray-300 border-t-gray-600 rounded-full animate-spin" /> Checking drug interactions...
                  </p>
                )}

                {/* AI Suggestions panel */}
                {aiSuggestions?.medicines?.length > 0 && (
                  <div className="p-3 bg-violet-50 border border-violet-200 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-violet-700 uppercase">AI Suggestions for "{diagnosis}"</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => addAIMedicines(aiSuggestions.medicines)}
                          className="text-xs bg-violet-600 text-white px-3 py-1 rounded-lg hover:bg-violet-700"
                        >
                          Add All
                        </button>
                        <button onClick={() => setAiSuggestions(null)} className="text-xs text-gray-400 hover:text-gray-600">
                          <FiX />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {aiSuggestions.medicines.map((m, i) => (
                        <div key={i} className="flex items-center justify-between text-xs bg-white rounded-lg p-2 border border-violet-100">
                          <div>
                            <span className="font-semibold text-gray-900">{m.name}</span>
                            {m.dosage && <span className="text-gray-500 ml-1">{m.dosage}</span>}
                            <span className="text-gray-400 ml-2">{[m.frequency, m.duration].filter(Boolean).join(' · ')}</span>
                          </div>
                          <button
                            onClick={() => addAIMedicines([m])}
                            className="p-1 text-violet-600 hover:bg-violet-100 rounded"
                          >
                            <FiPlus />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Medicine rows */}
                <div className="space-y-2">
                  {medicines.map((med, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={med.name}
                          onChange={e => updateMed(idx, 'name', e.target.value)}
                          placeholder="Medicine name (e.g., Tab. Paracetamol 500mg)"
                          className="input-field flex-1 text-sm py-2"
                        />
                        {medicines.length > 1 && (
                          <button
                            onClick={() => setMedicines(prev => prev.filter((_, i) => i !== idx))}
                            className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <FiTrash2 className="text-sm" />
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <div className="flex-1 min-w-[120px]">
                          <p className="text-[10px] text-gray-400 mb-1">Frequency</p>
                          <div className="flex gap-1 flex-wrap">
                            {FREQ_SHORTCUTS.map(f => (
                              <button
                                key={f}
                                type="button"
                                onClick={() => updateMed(idx, 'frequency', f)}
                                className={`text-[10px] px-2 py-0.5 rounded border transition-all ${
                                  med.frequency === f
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                                }`}
                              >
                                {f}
                              </button>
                            ))}
                            <input
                              type="text"
                              value={med.frequency}
                              onChange={e => updateMed(idx, 'frequency', e.target.value)}
                              placeholder="custom..."
                              className="text-[11px] border border-gray-200 rounded px-2 py-0.5 w-20 outline-none"
                            />
                          </div>
                        </div>
                        <div className="flex-1 min-w-[120px]">
                          <p className="text-[10px] text-gray-400 mb-1">Duration</p>
                          <div className="flex gap-1 flex-wrap">
                            {DUR_SHORTCUTS.map(d => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => updateMed(idx, 'duration', d)}
                                className={`text-[10px] px-2 py-0.5 rounded border transition-all ${
                                  med.duration === d
                                    ? 'bg-teal-600 text-white border-teal-600'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300'
                                }`}
                              >
                                {d}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="w-32">
                          <p className="text-[10px] text-gray-400 mb-1">Timing</p>
                          <select
                            value={med.timing}
                            onChange={e => updateMed(idx, 'timing', e.target.value)}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1 w-full outline-none focus:border-blue-300"
                          >
                            <option value="after-food">After food</option>
                            <option value="before-food">Before food</option>
                            <option value="empty-stomach">Empty stomach</option>
                            <option value="bedtime">Bedtime</option>
                            <option value="sos">SOS</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setMedicines(prev => [...prev, { ...emptyMed }])}
                  className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-all flex items-center justify-center gap-1.5"
                >
                  <FiPlus /> Add Another Medicine
                </button>
              </div>
            )}

            {/* ── Advice & Follow-up ── */}
            {activeSection === 'advice' && (
              <div className="card animate-fade-in space-y-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FiCheckCircle className="text-emerald-500" /> Advice & Follow-up
                </h3>
                {/* Quick advice chips */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Quick Advice</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'Take rest for 2-3 days',
                      'Drink plenty of fluids',
                      'Avoid spicy food',
                      'Continue medicines as prescribed',
                      'Monitor blood pressure daily',
                      'Check blood sugar regularly',
                      'Avoid alcohol',
                      'Walk 30 mins daily',
                      'Low-salt diet',
                      'Consult if symptoms worsen',
                    ].map(a => (
                      <button
                        key={a}
                        onClick={() => setAdvice(prev => prev ? prev + '\n' + a : a)}
                        className="px-3 py-1.5 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full hover:bg-emerald-100 transition-all"
                      >
                        + {a}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Advice to Patient</label>
                  <textarea
                    value={advice}
                    onChange={e => setAdvice(e.target.value)}
                    rows={3}
                    placeholder="Rest well, avoid cold drinks, drink warm water..."
                    className="input-field resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={e => setFollowUpDate(e.target.value)}
                      className="input-field flex-1"
                    />
                    <div className="flex gap-1">
                      {['3 days', '1 week', '2 weeks', '1 month'].map(d => {
                        const date = new Date();
                        if (d === '3 days') date.setDate(date.getDate() + 3);
                        else if (d === '1 week') date.setDate(date.getDate() + 7);
                        else if (d === '2 weeks') date.setDate(date.getDate() + 14);
                        else date.setMonth(date.getMonth() + 1);
                        const val = date.toISOString().split('T')[0];
                        return (
                          <button
                            key={d}
                            onClick={() => setFollowUpDate(val)}
                            className="text-xs px-2.5 py-2 bg-gray-100 hover:bg-teal-100 hover:text-teal-700 rounded-lg transition-all whitespace-nowrap"
                          >
                            {d}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Summary bar */}
            <div className="card bg-gray-50 border-dashed">
              <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                <span className={chiefComplaints.length ? 'text-teal-700 font-medium' : ''}>
                  {chiefComplaints.length > 0 ? `✓ ${chiefComplaints.length} complaints` : '○ Complaints'}
                </span>
                <span className={Object.values(vitals).some(v => v) ? 'text-teal-700 font-medium' : ''}>
                  {Object.values(vitals).some(v => v) ? '✓ Vitals recorded' : '○ Vitals'}
                </span>
                <span className={diagnosis ? 'text-teal-700 font-medium' : ''}>
                  {diagnosis ? `✓ ${diagnosis}` : '○ Diagnosis'}
                </span>
                <span className={medicines.filter(m => m.name).length > 0 ? 'text-teal-700 font-medium' : ''}>
                  {medicines.filter(m => m.name).length > 0 ? `✓ ${medicines.filter(m => m.name).length} medicine(s)` : '○ Medicines'}
                </span>
                <span className={followUpDate ? 'text-teal-700 font-medium' : ''}>
                  {followUpDate ? `✓ Follow-up: ${new Date(followUpDate).toLocaleDateString('en-IN')}` : '○ Follow-up'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ STEP 4: DONE ══════════ */}
      {step === 4 && savedRx && (
        <div className="card max-w-lg mx-auto text-center animate-fade-in space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <FiCheckCircle className="text-emerald-600 text-3xl" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Visit Completed!</h2>
            <p className="text-gray-500 text-sm mt-1">
              Prescription #{savedRx.prescriptionNo || savedRx._id?.slice(-6)} created for <strong>{selectedPatient?.name}</strong>
            </p>
            {diagnosis && (
              <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {diagnosis}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setPrintRx({ ...savedRx, patientId: selectedPatient || savedRx.patientId })}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <FiPrinter /> Print Prescription
            </button>
            <button
              onClick={sendWhatsApp}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold text-sm transition-all"
            >
              <FaWhatsapp /> Send via WhatsApp
            </button>
            <button
              onClick={resetVisit}
              className="btn-secondary flex items-center justify-center gap-2"
            >
              <FiPlus /> Start New Visit
            </button>
            <Link
              to={`/patients/${selectedPatient?._id}`}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium mt-1"
            >
              View Patient Profile →
            </Link>
          </div>
        </div>
      )}

      {printRx && <PrintPrescription prescription={printRx} onClose={() => setPrintRx(null)} />}
    </div>
  );
}
