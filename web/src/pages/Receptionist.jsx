import React, { useState, useEffect, useMemo } from 'react';
import {
  FiUserPlus, FiSearch, FiCreditCard, FiActivity, FiUsers,
  FiPlus, FiCheckCircle, FiCheck, FiUser, FiDollarSign,
  FiFolder, FiHeart, FiLayers, FiAlertCircle, FiClock,
  FiPrinter, FiArrowRight, FiShield, FiPhone, FiBookOpen, FiBookmark,
  FiSend, FiZap, FiRefreshCw
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { getUser } from '../utils/auth';
import Loader from '../components/Loader';
import { useTilt } from '../components/Premium3D';

/* Live-queue status display map (label + color theme) */
const QUEUE_STATUS = {
  REGISTERED:              { label: 'Registered',      dot: '#64748b', chip: 'bg-gray-100 text-gray-600 border-gray-200' },
  PAYMENT_PENDING:         { label: 'Payment Due',     dot: '#ef4444', chip: 'bg-red-50 text-red-700 border-red-100' },
  PAYMENT_COMPLETED:       { label: 'Paid',            dot: '#f59e0b', chip: 'bg-amber-50 text-amber-700 border-amber-100' },
  VITALS_PENDING:          { label: 'Vitals Pending',  dot: '#f59e0b', chip: 'bg-amber-50 text-amber-700 border-amber-100' },
  VITALS_COMPLETED:        { label: 'Vitals Done',     dot: '#3b82f6', chip: 'bg-blue-50 text-blue-700 border-blue-100' },
  WAITING_FOR_DOCTOR:      { label: 'Waiting',         dot: '#3b82f6', chip: 'bg-blue-50 text-blue-700 border-blue-100' },
  IN_CONSULTATION:         { label: 'In Consult',      dot: '#a855f7', chip: 'bg-purple-50 text-purple-700 border-purple-100' },
  CONSULTATION_COMPLETED:  { label: 'Completed',       dot: '#10b981', chip: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
};

/* Lightweight 3D tilt wrapper so each queue card can track the cursor */
function TiltCard({ className = '', style, children }) {
  const tilt = useTilt(6);
  return <div {...tilt} className={`tilt-3d ${className}`} style={style}>{children}</div>;
}

const DEPARTMENTS = [
  { value: 'general', label: 'General Medicine' },
  { value: 'pediatrics', label: 'Pediatrics' },
  { value: 'orthopedics', label: 'Orthopedics' },
  { value: 'cardiology', label: 'Cardiology' },
  { value: 'dermatology', label: 'Dermatology' }
];

const DOCTORS = [
  { value: 'current', label: 'Dr. Current User (General Medicine)' },
  { value: 'dr_rajesh', label: 'Dr. Rajesh Sharma (Pediatrics)' },
  { value: 'dr_amit', label: 'Dr. Amit Verma (Orthopedics)' },
  { value: 'dr_priya', label: 'Dr. Priya Sen (Cardiology)' },
  { value: 'dr_sunita', label: 'Dr. Sunita Rao (Dermatology)' }
];

const TEMPLATE_COMPLAINTS = [
  'Fever', 'Headache', 'Knee Pain', 'Chest Pain', 'Abdominal Pain',
  'Cough & Cold', 'Skin Rash', 'High BP Check', 'Diabetes Routine'
];

export default function Receptionist() {
  const currentUser = getUser();
  const [activeStep, setActiveStep] = useState(1);
  const [clock, setClock] = useState(new Date());
  const [queueFilter, setQueueFilter] = useState('ALL');
  const [queueSearch, setQueueSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Flow State
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [generatedUhid, setGeneratedUhid] = useState('');
  const [currentAppointment, setCurrentAppointment] = useState(null);
  const [todayQueue, setTodayQueue] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [printReceiptMode, setPrintReceiptMode] = useState(false);
  const [doctorsList, setDoctorsList] = useState(DOCTORS); // Use DOCTORS fallback

  // Step 1 Form: Registration
  const [regForm, setRegForm] = useState({
    name: '', age: '', gender: 'male', phone: '', email: '', address: '',
    emergencyName: '', emergencyPhone: '', emergencyRelation: '',
    allergies: '', diseases: '', medications: '',
    insuranceProvider: '', policyNumber: ''
  });

  // Step 2 Form: Doctor Selection
  const [docForm, setDocForm] = useState({
    department: 'general',
    doctor: 'current',
    date: new Date().toISOString().slice(0, 10),
    timeSlot: '10:00 AM'
  });

  // Step 3 Form: Payment
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // Step 4 Form: Vitals
  const [vitalsForm, setVitalsForm] = useState({
    height: '', weight: '', bmi: '', bp: '120/80', pulse: '78',
    temperature: '98.6', spo2: '99', bloodSugar: '', chiefComplaint: ''
  });

  // Step 5 Form: Consultation
  const [consultForm, setConsultForm] = useState({
    diagnosis: '',
    prescriptionDetails: '',
    labOrders: '',
    followUpDate: ''
  });

  // Fetch queue
  const fetchQueue = async () => {
    setLoadingQueue(true);
    try {
      const { data } = await api.get('/appointments/queue/today');
      setTodayQueue(data || []);
    } catch (err) {
      toast.error('Failed to load today\'s queue');
    } finally {
      setLoadingQueue(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const { data } = await api.get('/portal/doctors');
      if (Array.isArray(data)) {
        const list = data.map(d => ({
          value: d._id,
          label: `Dr. ${d.name} (${d.specialty ? d.specialty.charAt(0).toUpperCase() + d.specialty.slice(1) : 'General Medicine'})`
        }));
        // Merge without duplicates (using doctor ID)
        const combined = [{ value: 'current', label: 'Dr. Current User (General Medicine)' }];
        list.forEach(item => {
          if (!combined.some(x => x.value === item.value)) {
            combined.push(item);
          }
        });
        setDoctorsList(combined);
      } else {
        setDoctorsList(DOCTORS);
      }
    } catch (err) {
      setDoctorsList(DOCTORS);
    }
  };

  useEffect(() => {
    fetchQueue();
    fetchDoctors();
  }, []);

  // Live ticking clock
  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Real-time queue KPIs
  const queueStats = useMemo(() => ({
    total: todayQueue.length,
    paymentPending: todayQueue.filter(a => a.status === 'PAYMENT_PENDING').length,
    vitalsPending: todayQueue.filter(a => ['PAYMENT_COMPLETED', 'VITALS_PENDING'].includes(a.status)).length,
    waiting: todayQueue.filter(a => ['VITALS_COMPLETED', 'WAITING_FOR_DOCTOR'].includes(a.status)).length,
    inConsult: todayQueue.filter(a => a.status === 'IN_CONSULTATION').length,
    completed: todayQueue.filter(a => a.status === 'CONSULTATION_COMPLETED').length,
  }), [todayQueue]);

  // Queue filtering (status chips + search)
  const filteredQueue = useMemo(() => {
    const q = queueSearch.trim().toLowerCase();
    return todayQueue.filter(apt => {
      const matchStatus =
        queueFilter === 'ALL' ||
        (queueFilter === 'ACTIVE' && apt.status !== 'CONSULTATION_COMPLETED') ||
        apt.status === queueFilter;
      const matchSearch = !q ||
        apt.patientId?.name?.toLowerCase().includes(q) ||
        apt.patientId?.patientId?.toLowerCase().includes(q) ||
        String(apt.tokenNumber || '').includes(q);
      return matchStatus && matchSearch;
    });
  }, [todayQueue, queueFilter, queueSearch]);

  // Estimated wait (10 min per person ahead in the waiting line)
  const waitingOrder = useMemo(
    () => todayQueue.filter(a => ['VITALS_COMPLETED', 'WAITING_FOR_DOCTOR'].includes(a.status)).map(a => a._id),
    [todayQueue]
  );
  const estWait = (id) => {
    const i = waitingOrder.indexOf(id);
    return i >= 0 ? (i + 1) * 10 : 0;
  };

  // Recalculate BMI when height/weight changes
  useEffect(() => {
    const w = parseFloat(vitalsForm.weight);
    const h = parseFloat(vitalsForm.height);
    if (w && h) {
      const bmiVal = (w / ((h / 100) * (h / 100))).toFixed(1);
      setVitalsForm(prev => ({ ...prev, bmi: bmiVal }));
    } else {
      setVitalsForm(prev => ({ ...prev, bmi: '' }));
    }
  }, [vitalsForm.height, vitalsForm.weight]);

  // Handle patient search
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const { data } = await api.get(`/patients?search=${encodeURIComponent(searchQuery)}`);
      setSearchResults(data.patients || []);
      if ((data.patients || []).length === 0) {
        toast.error('No patients found matching query');
      }
    } catch (err) {
      toast.error('Patient search failed');
    } finally {
      setSearching(false);
    }
  };

  // Select patient
  const selectPatient = (patient) => {
    setSelectedPatient(patient);
    setIsNewPatient(false);
    setGeneratedUhid(patient.patientId);
    toast.success(`Selected patient: ${patient.name}`);
    setActiveStep(2);
  };

  // Register new patient
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regForm.name || !regForm.phone) {
      return toast.error('Name and Phone are required');
    }

    try {
      const payload = {
        name: regForm.name,
        phone: regForm.phone,
        email: regForm.email || undefined,
        age: regForm.age ? parseInt(regForm.age) : undefined,
        gender: regForm.gender,
        address: regForm.address || undefined,
        emergencyContact: regForm.emergencyName ? `${regForm.emergencyName} (${regForm.emergencyRelation}): ${regForm.emergencyPhone}` : undefined,
        allergies: regForm.allergies ? regForm.allergies.split(',').map(a => a.trim()) : [],
        medicalHistory: regForm.diseases ? regForm.diseases.split(',').map(d => d.trim()) : [],
        notes: regForm.medications ? `Current meds: ${regForm.medications}` : ''
      };

      const { data } = await api.post('/patients', payload);
      setSelectedPatient(data);
      setIsNewPatient(true);
      setGeneratedUhid(data.patientId);
      toast.success(`Patient registered successfully! ID: ${data.patientId}`);
      setActiveStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  // Book Appointment
  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return toast.error('No patient selected');

    try {
      const payload = {
        patientId: selectedPatient._id,
        date: docForm.date,
        timeSlot: docForm.timeSlot,
        type: 'consultation',
        status: 'PAYMENT_PENDING',
        registrationFee: isNewPatient ? 100 : 0,
        consultationFee: 500,
        doctorId: docForm.doctor === 'current' ? (currentUser.role === 'doctor' ? currentUser._id : 'demo-doctor-001') : docForm.doctor
      };

      const { data } = await api.post('/appointments', payload);
      setCurrentAppointment(data);
      toast.success('Appointment created! Status: PAYMENT_PENDING');
      setActiveStep(3);
      fetchQueue();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Appointment booking failed');
    }
  };

  // Complete Payment
  const handlePayment = async () => {
    if (!currentAppointment) return;
    try {
      const payload = {
        status: 'PAYMENT_COMPLETED',
        paymentStatus: 'paid',
        paymentMethod: paymentMethod
      };

      const { data } = await api.put(`/appointments/${currentAppointment._id}`, payload);
      setCurrentAppointment(data);
      setPaymentSuccess(true);
      toast.success('Payment completed successfully!');
      fetchQueue();
    } catch (err) {
      toast.error('Payment confirmation failed');
    }
  };

  const handlePushToNurse = async () => {
    if (!currentAppointment) return;
    try {
      if (currentAppointment.status !== 'VITALS_PENDING') {
        const { data } = await api.put(`/appointments/${currentAppointment._id}`, { status: 'VITALS_PENDING' });
        setCurrentAppointment(data);
      }
      toast.success('Patient pushed to Nurse Station queue!');
      resetFlow();
      fetchQueue();
    } catch (e) {
      toast.error('Failed to push to nurse station');
    }
  };

  const resetFlow = () => {
    setSelectedPatient(null);
    setIsNewPatient(false);
    setGeneratedUhid('');
    setCurrentAppointment(null);
    setPaymentSuccess(false);
    setPrintReceiptMode(false);
    setActiveStep(1);
    setRegForm({
      name: '', age: '', gender: 'male', phone: '', email: '', address: '',
      emergencyName: '', emergencyPhone: '', emergencyRelation: '',
      allergies: '', diseases: '', medications: '',
      insuranceProvider: '', policyNumber: ''
    });
    setDocForm({
      department: 'general',
      doctor: 'current',
      date: new Date().toISOString().slice(0, 10),
      timeSlot: '10:00 AM'
    });
    setPaymentMethod('cash');
  };

  const currentDoctorName = DOCTORS.find(d => d.value === docForm.doctor)?.label.split(' (')[0] || `Dr. ${currentUser.name}`;

  return (
    <div className="space-y-6 page-enter">
      {/* ── 3D Reception Command Hero ── */}
      <div className="hero-3d px-6 py-6 sm:px-8"
           style={{ background: 'radial-gradient(1200px 420px at 100% -20%, rgba(56,189,248,0.5), transparent 60%), linear-gradient(125deg,#312e81 0%,#1d4ed8 50%,#0e7490 100%)' }}>
        <div className="hero-grid" />
        <span className="orb-3d orb-a" />
        <span className="orb-3d orb-b" />
        <span className="orb-3d orb-c" />

        <div className="relative">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="text-white">
              <span className="inline-flex items-center gap-2 glass-chip px-3 py-1 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-300 live-dot" />
                <span className="text-[11px] font-medium text-white/90 tracking-wide">Front Desk · Live</span>
              </span>
              <h1 className="text-2xl sm:text-[26px] font-extrabold flex items-center gap-2.5">
                <FiLayers /> Reception Command Center
              </h1>
              <p className="text-white/75 text-sm mt-1">Check-in, registration, payments, vitals hand-off & live OPD queue</p>
            </div>
            <div className="glass-chip px-4 py-2 flex items-center gap-3 self-start">
              <FiClock className="text-cyan-200" size={18} />
              <div>
                <p className="text-white font-bold text-lg tabular-nums tracking-wider leading-none">
                  {clock.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </p>
                <p className="text-[10px] text-white/60 mt-0.5">{clock.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
              </div>
            </div>
          </div>

          {/* Live queue KPIs */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 mt-5">
            {[
              { label: 'In Queue', value: queueStats.total, icon: FiUsers },
              { label: 'Payment Due', value: queueStats.paymentPending, icon: FiDollarSign },
              { label: 'Vitals Pending', value: queueStats.vitalsPending, icon: FiActivity },
              { label: 'Waiting', value: queueStats.waiting, icon: FiClock },
              { label: 'In Consult', value: queueStats.inConsult, icon: FiZap },
              { label: 'Completed', value: queueStats.completed, icon: FiCheckCircle },
            ].map(k => (
              <div key={k.label} className="glass-chip px-3 py-2.5">
                <div className="flex items-center gap-1 text-white/70 mb-0.5">
                  <k.icon size={12} /><span className="text-[9px] uppercase tracking-wide truncate">{k.label}</span>
                </div>
                <p className="text-xl font-extrabold text-white tabular-nums leading-none">{k.value}</p>
              </div>
            ))}
          </div>

          {/* Animated step progress */}
          <div className="relative mt-7 hidden md:block">
            <div className="absolute left-0 right-0 top-4 h-1 rounded-full bg-white/15" />
            <div className="absolute left-0 top-4 h-1 rounded-full bg-gradient-to-r from-emerald-300 to-cyan-200 transition-all duration-500"
                 style={{ width: `${((Math.min(activeStep, 3) - 1) / 2) * 100}%` }} />
            <div className="relative flex items-start justify-between">
              {[
                { nr: 1, title: 'Check-In / Register', desc: 'Patient Arrival' },
                { nr: 2, title: 'Doctor Selection', desc: 'Select Clinic' },
                { nr: 3, title: 'Fee Settlement', desc: 'Collect Payment' },
              ].map(s => {
                const isCurrent = activeStep === s.nr;
                const isDone = activeStep > s.nr;
                return (
                  <div key={s.nr} className="flex flex-col items-center gap-1.5 text-center" style={{ width: '33%' }}>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all ${
                      isCurrent ? 'bg-white text-indigo-700 border-white scale-110 shadow-lg animate-glow' :
                      isDone ? 'bg-emerald-400 text-white border-emerald-400' :
                      'bg-white/10 text-white/70 border-white/30'
                    }`}>
                      {isDone ? <FiCheck /> : s.nr}
                    </div>
                    <div className="leading-tight">
                      <p className={`text-xs font-semibold ${isCurrent ? 'text-white' : 'text-white/70'}`}>{s.title}</p>
                      <p className="text-[10px] text-white/50">{s.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Step Workspace */}
        <div className="lg:col-span-2 space-y-6">
          {/* STEP 1: Arrival, Search & Registration */}
          {activeStep === 1 && (
            <div className="card space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FiUserPlus className="text-blue-600" /> Patient Check-In
                </h2>
                <span className="badge-primary px-3 py-1 text-xs">Step 1 of 5</span>
              </div>

              {/* Dialogue Bubble */}
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">R</div>
                <div>
                  <p className="text-xs font-semibold text-blue-800 uppercase tracking-wider">Receptionist Dialogue</p>
                  <p className="text-sm text-blue-900 font-medium mt-0.5">
                    "Good morning. Are you a new patient or an existing patient?"
                  </p>
                </div>
              </div>

              {/* Toggle new/existing */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
                <button
                  onClick={() => setIsNewPatient(false)}
                  className={`py-2 rounded-lg text-sm font-semibold transition-all ${!isNewPatient ? 'bg-white text-gray-900 shadow-md' : 'text-gray-600'}`}
                >
                  Existing Patient
                </button>
                <button
                  onClick={() => setIsNewPatient(true)}
                  className={`py-2 rounded-lg text-sm font-semibold transition-all ${isNewPatient ? 'bg-white text-gray-900 shadow-md' : 'text-gray-600'}`}
                >
                  New Patient (Registration)
                </button>
              </div>

              {/* Existing Patient Search */}
              {!isNewPatient ? (
                <div className="space-y-4">
                  <form onSubmit={handleSearch} className="flex gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search by Mobile, UHID, or Patient Name..."
                      className="input-field py-2.5 flex-1"
                    />
                    <button type="submit" disabled={searching} className="btn-primary flex items-center gap-2">
                      <FiSearch /> Search
                    </button>
                  </form>

                  {searching ? (
                    <div className="text-center py-6"><Loader label="Searching patient..." /></div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-400 uppercase">Search Results</p>
                      {searchResults.map(p => (
                        <div key={p._id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-blue-300 hover:bg-blue-50/20 transition-all">
                          <div>
                            <p className="text-sm font-bold text-gray-800">{p.name} ({p.age} • {p.gender})</p>
                            <p className="text-xs text-gray-500 font-mono">ID: {p.patientId} • Phone: {p.phone}</p>
                          </div>
                          <button onClick={() => selectPatient(p)} className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1">
                            Check In <FiArrowRight />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : searchQuery && (
                    <p className="text-center text-sm text-gray-400 py-6">No matching patients found. Switch to New Patient to register.</p>
                  )}
                </div>
              ) : (
                /* New Patient Registration */
                <form onSubmit={handleRegister} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Full Name *</label>
                      <input
                        type="text" required
                        value={regForm.name} onChange={e => setRegForm({...regForm, name: e.target.value})}
                        className="input-field py-2" placeholder="e.g. Ravi Kumar"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Mobile Number *</label>
                      <input
                        type="tel" required
                        value={regForm.phone} onChange={e => setRegForm({...regForm, phone: e.target.value})}
                        className="input-field py-2" placeholder="e.g. 9876543210"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Age / Date of Birth</label>
                      <input
                        type="number"
                        value={regForm.age} onChange={e => setRegForm({...regForm, age: e.target.value})}
                        className="input-field py-2" placeholder="e.g. 45"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Gender</label>
                      <select
                        value={regForm.gender} onChange={e => setRegForm({...regForm, gender: e.target.value})}
                        className="input-field py-2"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Address & City</label>
                    <input
                      type="text"
                      value={regForm.address} onChange={e => setRegForm({...regForm, address: e.target.value})}
                      className="input-field py-2" placeholder="e.g. 45 Flat, MG Road, Mumbai"
                    />
                  </div>

                  {/* Emergency Contact */}
                  <div className="border-t pt-4">
                    <p className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">Emergency Contact</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Contact Person Name</label>
                        <input
                          type="text"
                          value={regForm.emergencyName} onChange={e => setRegForm({...regForm, emergencyName: e.target.value})}
                          className="input-field py-2" placeholder="Name"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Phone Number</label>
                        <input
                          type="tel"
                          value={regForm.emergencyPhone} onChange={e => setRegForm({...regForm, emergencyPhone: e.target.value})}
                          className="input-field py-2" placeholder="Phone"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Relationship</label>
                        <input
                          type="text"
                          value={regForm.emergencyRelation} onChange={e => setRegForm({...regForm, emergencyRelation: e.target.value})}
                          className="input-field py-2" placeholder="Spouse, Father, etc."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Basic Medical Information */}
                  <div className="border-t pt-4">
                    <p className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">Basic Medical Information</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Allergies (comma-separated)</label>
                        <input
                          type="text"
                          value={regForm.allergies} onChange={e => setRegForm({...regForm, allergies: e.target.value})}
                          className="input-field py-2" placeholder="e.g. Penicillin, Aspirin"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Existing Diseases</label>
                        <input
                          type="text"
                          value={regForm.diseases} onChange={e => setRegForm({...regForm, diseases: e.target.value})}
                          className="input-field py-2" placeholder="e.g. Diabetes, BP"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Current Medications</label>
                        <input
                          type="text"
                          value={regForm.medications} onChange={e => setRegForm({...regForm, medications: e.target.value})}
                          className="input-field py-2" placeholder="e.g. Metformin 500mg"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Insurance details */}
                  <div className="border-t pt-4">
                    <p className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">Insurance Details (If Applicable)</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Insurance Provider</label>
                        <input
                          type="text"
                          value={regForm.insuranceProvider} onChange={e => setRegForm({...regForm, insuranceProvider: e.target.value})}
                          className="input-field py-2" placeholder="e.g. Star Health"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Policy Number</label>
                        <input
                          type="text"
                          value={regForm.policyNumber} onChange={e => setRegForm({...regForm, policyNumber: e.target.value})}
                          className="input-field py-2" placeholder="e.g. STAR-98271A"
                        />
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="btn-primary w-full py-3">
                    Register and Generate UHID
                  </button>
                </form>
              )}
            </div>
          )}

          {/* STEP 2: Department / Doctor Selection */}
          {activeStep === 2 && (
            <div className="card space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FiClock className="text-purple-600" /> Doctor & Department Selection
                </h2>
                <span className="badge-primary px-3 py-1 text-xs">Step 2 of 5</span>
              </div>

              {/* Patient Card Mini */}
              <div className="p-3 bg-gray-50 rounded-2xl flex items-center justify-between text-sm">
                <div>
                  <p className="text-xs text-gray-500">Selected Patient</p>
                  <p className="font-bold text-gray-800">{selectedPatient?.name} ({selectedPatient?.age}y • {selectedPatient?.gender})</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Unique ID (UHID)</p>
                  <p className="font-mono text-xs font-bold text-indigo-700">{generatedUhid}</p>
                </div>
              </div>

              {isNewPatient && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold flex-shrink-0">R</div>
                  <div>
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Receptionist Dialogue</p>
                    <p className="text-sm text-emerald-900 font-medium mt-0.5">
                      "Your patient ID is {generatedUhid || 'UHID-100245'}."
                    </p>
                  </div>
                </div>
              )}

              {/* Dialogue Bubble */}
              <div className="p-4 bg-purple-50 border border-purple-100 rounded-2xl flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">R</div>
                <div>
                  <p className="text-xs font-semibold text-purple-800 uppercase tracking-wider">Receptionist Dialogue</p>
                  <p className="text-sm text-purple-900 font-medium mt-0.5">
                    "Which department or doctor would you like to consult today?"
                  </p>
                </div>
              </div>

              <form onSubmit={handleBookAppointment} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Department</label>
                    <select
                      value={docForm.department} onChange={e => setDocForm({...docForm, department: e.target.value})}
                      className="input-field py-2"
                    >
                      {DEPARTMENTS.map(d => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Doctor</label>
                    <select
                      value={docForm.doctor} onChange={e => setDocForm({...docForm, doctor: e.target.value})}
                      className="input-field py-2"
                    >
                      {doctorsList.map(doc => (
                        <option key={doc.value} value={doc.value}>{doc.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Consultation Date</label>
                    <input
                      type="date"
                      value={docForm.date} onChange={e => setDocForm({...docForm, date: e.target.value})}
                      className="input-field py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Preferred Time Slot</label>
                    <input
                      type="text"
                      value={docForm.timeSlot} onChange={e => setDocForm({...docForm, timeSlot: e.target.value})}
                      className="input-field py-2" placeholder="e.g. 10:00 AM"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button type="button" onClick={() => setActiveStep(1)} className="btn-secondary flex-1 py-3">
                    Back to Check-in
                  </button>
                  <button type="submit" className="btn-primary flex-1 py-3">
                    Proceed to Fee Payment
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: Fee Payment */}
          {activeStep === 3 && (
            <div className="card space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FiDollarSign className="text-emerald-600" /> HMS Fee Settlement
                </h2>
                <span className="badge-primary px-3 py-1 text-xs">Step 3 of 3</span>
              </div>

              {/* Patient details & visit selection */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-2xl text-sm">
                <div>
                  <p className="text-xs text-gray-500">Patient</p>
                  <p className="font-bold text-gray-800">{selectedPatient?.name}</p>
                  <p className="text-xs text-gray-500 font-mono">{generatedUhid}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Assigned Consultant</p>
                  <p className="font-bold text-gray-800">{currentDoctorName}</p>
                  <p className="text-xs text-gray-500 capitalize">{docForm.department} Dept.</p>
                </div>
              </div>

              {!paymentSuccess ? (
                <div className="space-y-4">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Settlement Bill Summary</p>
                  <div className="border rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-3 font-semibold text-gray-600">Item Name</th>
                          <th className="text-right p-3 font-semibold text-gray-600">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-gray-700">
                        {isNewPatient && (
                          <tr>
                            <td className="p-3">Hospital Registration Fee (One-time)</td>
                            <td className="text-right p-3 font-medium">₹100</td>
                          </tr>
                        )}
                        <tr>
                          <td className="p-3">Doctor Consultation Fee ({docForm.department})</td>
                          <td className="text-right p-3 font-medium">₹500</td>
                        </tr>
                        <tr className="bg-indigo-50/30 font-bold text-gray-900 border-t-2">
                          <td className="p-3">Grand Total</td>
                          <td className="text-right p-3 text-indigo-700">
                            ₹{isNewPatient ? 600 : 500}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Payment Methods */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Select Payment Method</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { value: 'cash', label: 'Cash' },
                        { value: 'upi', label: 'UPI QR' },
                        { value: 'card', label: 'Credit/Debit Card' },
                        { value: 'net_banking', label: 'Net Banking' }
                      ].map(method => (
                        <button
                          key={method.value}
                          type="button"
                          onClick={() => setPaymentMethod(method.value)}
                          className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                            paymentMethod === method.value ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-gray-100 hover:border-gray-200 text-gray-600'
                          }`}
                        >
                          {method.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button type="button" onClick={() => setActiveStep(2)} className="btn-secondary flex-1 py-3">
                      Back to Doctor
                    </button>
                    <button type="button" onClick={handlePayment} className="btn-primary flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 border-emerald-600">
                      Mark Payment Completed
                    </button>
                  </div>
                </div>
              ) : (
                /* Payment Success state */
                <div className="space-y-6 animate-fade-in text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
                    <FiCheckCircle size={36} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Payment Settled Successfully!</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Grand Total Paid: <span className="font-bold text-gray-800">₹{isNewPatient ? 600 : 500}</span> ({paymentMethod.toUpperCase()})
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">Token Number: T-{currentAppointment?.tokenNumber || '—'}</p>
                  </div>

                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3 max-w-sm mx-auto text-left">
                    <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold flex-shrink-0">R</div>
                    <div>
                      <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Receptionist Dialogue</p>
                      <p className="text-sm text-emerald-900 font-medium mt-0.5">
                        "Payment received. Please proceed to the vitals desk."
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 max-w-sm mx-auto">
                    <button
                      type="button"
                      onClick={() => setPrintReceiptMode(true)}
                      className="btn-primary flex items-center justify-center gap-2 py-3"
                    >
                      <FiPrinter /> Save & Print Receipt
                    </button>
                    <button
                      type="button"
                      onClick={handlePushToNurse}
                      className="btn-success flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 border-indigo-600"
                    >
                      <FiSend /> Push to Nurse Station
                    </button>
                    <button
                      type="button"
                      onClick={resetFlow}
                      className="btn-secondary py-2"
                    >
                      Cancel & Reset Flow
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Live Queue Monitor (Right Side) */}
        <div className="space-y-4">
          <div className="card !p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg,#4338ca,#0e7490)' }}>
                  <FiUsers size={15} />
                </span>
                Live OPD Queue
                <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{queueStats.total}</span>
              </h3>
              <button onClick={fetchQueue} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                <FiRefreshCw size={12} /> Refresh
              </button>
            </div>

            {/* Search + status filter chips */}
            <div className="relative mb-2.5">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input value={queueSearch} onChange={e => setQueueSearch(e.target.value)} placeholder="Search token, name or UHID…"
                className="input-field !py-2 !pl-9 text-sm" />
            </div>
            <div className="flex gap-1.5 overflow-x-auto custom-scroll pb-2 mb-1">
              {[
                { v: 'ALL', l: 'All' },
                { v: 'ACTIVE', l: 'Active' },
                { v: 'PAYMENT_PENDING', l: 'Payment' },
                { v: 'WAITING_FOR_DOCTOR', l: 'Waiting' },
                { v: 'IN_CONSULTATION', l: 'In Consult' },
                { v: 'CONSULTATION_COMPLETED', l: 'Done' },
              ].map(f => (
                <button key={f.v} onClick={() => setQueueFilter(f.v)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all ${queueFilter === f.v ? 'bg-indigo-600 text-white shadow' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                  {f.l}
                </button>
              ))}
            </div>

            {loadingQueue ? (
              <div className="text-center py-6 text-sm text-gray-400">Loading queue...</div>
            ) : todayQueue.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-6">No active patients in queue today</p>
            ) : filteredQueue.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-6">No patients match this filter</p>
            ) : (
              <div className="scene-3d space-y-2.5 max-h-[460px] overflow-y-auto custom-scroll pr-1">
                {filteredQueue.map((apt, idx) => {
                  const cfg = QUEUE_STATUS[apt.status] || QUEUE_STATUS.REGISTERED;
                  const isCurrentSession = currentAppointment && currentAppointment._id === apt._id;
                  const wait = estWait(apt._id);
                  return (
                    <TiltCard
                      key={apt._id}
                      className={`module-3d !rounded-2xl p-3 text-sm animate-pop ${isCurrentSession ? 'ring-2 ring-indigo-500/40' : ''}`}
                      style={{ '--m-soft': 'rgba(67,56,202,0.12)', '--m-shadow': 'rgba(67,56,202,0.4)', animationDelay: `${idx * 35}ms`, borderLeft: `4px solid ${cfg.dot}` }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-white px-2 py-0.5 rounded-lg" style={{ background: 'linear-gradient(135deg,#4338ca,#0e7490)' }}>
                          T-{apt.tokenNumber || '0'}
                        </span>
                        <span className={`text-[10px] font-bold uppercase border px-2 py-0.5 rounded-full flex items-center gap-1 ${cfg.chip}`}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} /> {cfg.label}
                        </span>
                      </div>

                      <p className="font-bold text-gray-800 mt-2 depth-1">{apt.patientId?.name || 'Patient'}</p>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-gray-500 font-mono">{apt.patientId?.patientId || 'UHID-NEW'}</p>
                        {wait > 0 && (
                          <span className="text-[10px] font-semibold text-amber-600 flex items-center gap-0.5">
                            <FiClock size={10} /> ~{wait}m
                          </span>
                        )}
                      </div>

                      {apt.chiefComplaint && (
                        <p className="text-xs text-red-500 italic mt-1.5 line-clamp-1">Complaint: "{apt.chiefComplaint}"</p>
                      )}

                      <div className="mt-3 flex gap-1 bg-gray-50 p-1 rounded-xl">
                        <button
                          onClick={async () => {
                            try {
                              const { data } = await api.put(`/appointments/${apt._id}`, { status: 'IN_CONSULTATION' });
                              toast.success('Patient called into consultation');
                              fetchQueue();
                              if (isCurrentSession) setCurrentAppointment(data);
                            } catch (e) { toast.error('Action failed'); }
                          }}
                          className="flex-1 text-[11px] font-semibold py-1 bg-white hover:bg-indigo-50 text-indigo-700 border rounded-lg shadow-sm"
                        >
                          Consult
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const { data } = await api.put(`/appointments/${apt._id}`, { status: 'CONSULTATION_COMPLETED' });
                              toast.success('Consultation complete');
                              fetchQueue();
                              if (isCurrentSession) setCurrentAppointment(data);
                            } catch (e) { toast.error('Action failed'); }
                          }}
                          className="flex-1 text-[11px] font-semibold py-1 bg-white hover:bg-emerald-50 text-emerald-700 border rounded-lg shadow-sm"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => {
                            setCurrentAppointment(apt);
                            setSelectedPatient(apt.patientId);
                            setGeneratedUhid(apt.patientId?.patientId);
                            setIsNewPatient(false);
                            if (apt.status === 'PAYMENT_PENDING') {
                              setActiveStep(3);
                              setPaymentSuccess(false);
                            } else {
                              setActiveStep(3);
                              setPaymentSuccess(true);
                            }
                          }}
                          className="flex-1 text-[11px] font-semibold py-1 bg-white hover:bg-gray-100 text-gray-600 border rounded-lg shadow-sm"
                        >
                          Load
                        </button>
                      </div>
                    </TiltCard>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Stats Summary */}
          <div className="card bg-gray-50 border-gray-100">
            <h4 className="font-bold text-gray-700 text-xs uppercase mb-2">HMS Status Guide</h4>
            <div className="space-y-1.5 text-xs text-gray-500">
              <p>• <span className="font-semibold text-gray-700">REGISTERED</span>: Patient is check-in.</p>
              <p>• <span className="font-semibold text-gray-700">PAYMENT_PENDING</span>: Patient owes consultation fee.</p>
              <p>• <span className="font-semibold text-gray-700">VITALS_PENDING</span>: Waiting for vital stats collection.</p>
              <p>• <span className="font-semibold text-gray-700">WAITING_FOR_DOCTOR</span>: Vitals checked, patient is in queue.</p>
              <p>• <span className="font-semibold text-gray-700">IN_CONSULTATION</span>: Patient is inside doctor's office.</p>
              <p>• <span className="font-semibold text-gray-700">CONSULTATION_COMPLETED</span>: Prescribed & discharged.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Print Receipt Preview Overlay */}
      {printReceiptMode && currentAppointment && selectedPatient && (
        <div className="fixed inset-0 z-50 bg-white overflow-auto print:static">
          <div className="print:hidden flex items-center justify-between p-4 border-b bg-gray-50">
            <h2 className="font-bold text-gray-900">Check-in Receipt Preview</h2>
            <div className="flex gap-2">
              <button onClick={() => window.print()} className="btn-primary text-sm flex items-center gap-1">
                <FiPrinter /> Print Receipt
              </button>
              <button onClick={() => setPrintReceiptMode(false)} className="btn-secondary text-sm">
                Close
              </button>
            </div>
          </div>

          <div className="max-w-md mx-auto p-8 border my-8 rounded-2xl shadow-sm print:shadow-none print:border-none print:my-0 print:p-0">
            <div className="text-center pb-4 border-b-2 border-dashed">
              <h2 className="text-xl font-bold text-gray-900">MEDCORE CLINICS</h2>
              <p className="text-xs text-gray-500 mt-0.5">Patient Check-in & Payment Receipt</p>
              <p className="text-xs text-gray-400 font-mono mt-1">
                Receipt No: REC-{currentAppointment._id?.slice(-6).toUpperCase()} | Date: {new Date(currentAppointment.date).toLocaleDateString('en-IN')}
              </p>
            </div>

            <div className="py-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Patient Name:</span>
                <span className="font-bold text-gray-900">{selectedPatient.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Patient ID (UHID):</span>
                <span className="font-mono text-gray-900 font-semibold">{generatedUhid || selectedPatient.patientId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Age / Gender:</span>
                <span className="text-gray-900">{selectedPatient.age} yrs / {selectedPatient.gender}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Assigned Consultant:</span>
                <span className="text-gray-900 font-semibold">{currentDoctorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Time Slot / Token:</span>
                <span className="text-gray-900 font-semibold">{currentAppointment.timeSlot} | Token: T-{currentAppointment.tokenNumber}</span>
              </div>
            </div>

            <div className="border-t border-b py-3 space-y-2 text-sm my-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Billing Breakdown</p>
              {isNewPatient && (
                <div className="flex justify-between text-gray-700">
                  <span>Hospital Registration Fee:</span>
                  <span>₹100.00</span>
                </div>
              )}
              <div className="flex justify-between text-gray-700">
                <span>Doctor Consultation Fee:</span>
                <span>₹500.00</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-dashed">
                <span>Total Paid:</span>
                <span>₹{isNewPatient ? '600.00' : '500.00'}</span>
              </div>
            </div>

            <div className="py-2 text-xs text-gray-500">
              <p>Payment Method: <span className="font-semibold">{paymentMethod.toUpperCase()}</span></p>
              <p>Payment Status: <span className="font-semibold text-emerald-600">PAID</span></p>
            </div>

            <div className="text-center pt-6 text-[10px] text-gray-400 uppercase tracking-widest border-t border-dashed mt-6">
              Please proceed to the Nurse Station for vitals checking.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
