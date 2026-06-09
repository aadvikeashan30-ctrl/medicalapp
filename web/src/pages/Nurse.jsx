import React, { useState, useEffect } from 'react';
import {
  FiActivity, FiSearch, FiHeart, FiThermometer, FiCheckCircle,
  FiPrinter, FiArrowRight, FiUser, FiSend, FiPlus, FiAlertCircle
} from 'react-icons/fi';
import { MdBloodtype } from 'react-icons/md';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { getUser } from '../utils/auth';
import Loader from '../components/Loader';

const TEMPLATE_COMPLAINTS = [
  'Fever', 'Headache', 'Knee Pain', 'Chest Pain', 'Abdominal Pain',
  'Cough & Cold', 'Skin Rash', 'High BP Check', 'Diabetes Routine'
];

export default function Nurse() {
  const currentUser = getUser();
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' or 'search'
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  
  // Pending Queue from Receptionist
  const [pendingQueue, setPendingQueue] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(false);

  // Selected patient & appointment context for vitals intake
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [currentAppointment, setCurrentAppointment] = useState(null);
  const [showVitalsForm, setShowVitalsForm] = useState(false);

  // Vitals form state
  const [vitalsForm, setVitalsForm] = useState({
    height: '',
    weight: '',
    bmi: '',
    bp: '120/80',
    pulse: '78',
    temperature: '98.6',
    spo2: '99',
    bloodSugar: '',
    chiefComplaint: ''
  });

  // Print Vitals overlay
  const [printMode, setPrintMode] = useState(false);

  // Auto calculate BMI
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

  // Fetch pending vitals appointments
  const fetchPendingQueue = async () => {
    setLoadingQueue(true);
    try {
      const { data } = await api.get('/appointments/queue/today');
      // Filter appointments in status VITALS_PENDING or PAYMENT_COMPLETED
      const filtered = (data || []).filter(apt => 
        ['VITALS_PENDING', 'PAYMENT_COMPLETED'].includes(apt.status)
      );
      setPendingQueue(filtered);
    } catch (err) {
      toast.error('Failed to load pending vitals queue');
    } finally {
      setLoadingQueue(false);
    }
  };

  useEffect(() => {
    fetchPendingQueue();
  }, []);

  // Search by Patient ID / Mobile
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const { data } = await api.get(`/patients?search=${encodeURIComponent(searchQuery)}`);
      setSearchResults(data.patients || []);
      if ((data.patients || []).length === 0) {
        toast.error('No patients found matching ID or phone');
      }
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  // Select patient to record vitals
  const selectPatientForVitals = async (patient, apt = null) => {
    setSelectedPatient(patient);
    setSearchResults([]);
    setSearchQuery('');
    
    if (apt) {
      setCurrentAppointment(apt);
      // Pre-fill vitals if they are already partially recorded
      setVitalsForm({
        height: apt.vitals?.height || '',
        weight: apt.vitals?.weight || '',
        bmi: apt.vitals?.bmi || '',
        bp: apt.vitals?.bp || '120/80',
        pulse: apt.vitals?.pulse || '78',
        temperature: apt.vitals?.temperature || '98.6',
        spo2: apt.vitals?.spo2 || '99',
        bloodSugar: apt.vitals?.bloodSugar || '',
        chiefComplaint: apt.chiefComplaint || ''
      });
      setShowVitalsForm(true);
      toast.success(`Recording vitals for ${patient.name}`);
    } else {
      // Find or create today's appointment for this patient
      try {
        setLoadingQueue(true);
        // Let's get today's queue first to see if patient has an appointment
        const { data } = await api.get('/appointments/queue/today');
        const existingApt = (data || []).find(a => 
          a.patientId?._id === patient._id || a.patientId === patient._id
        );

        if (existingApt) {
          setCurrentAppointment(existingApt);
          setVitalsForm({
            height: existingApt.vitals?.height || '',
            weight: existingApt.vitals?.weight || '',
            bmi: existingApt.vitals?.bmi || '',
            bp: existingApt.vitals?.bp || '120/80',
            pulse: existingApt.vitals?.pulse || '78',
            temperature: existingApt.vitals?.temperature || '98.6',
            spo2: existingApt.vitals?.spo2 || '99',
            bloodSugar: existingApt.vitals?.bloodSugar || '',
            chiefComplaint: existingApt.chiefComplaint || ''
          });
        } else {
          // Create dummy today appointment if receptionist check-in was skipped (for ease of use)
          const payload = {
            patientId: patient._id,
            date: new Date().toISOString().slice(0, 10),
            timeSlot: '10:00 AM',
            type: 'consultation',
            status: 'VITALS_PENDING',
            registrationFee: 0,
            consultationFee: 500
          };
          const res = await api.post('/appointments', payload);
          setCurrentAppointment(res.data);
          setVitalsForm({
            height: '', weight: '', bmi: '', bp: '120/80', pulse: '78',
            temperature: '98.6', spo2: '99', bloodSugar: '', chiefComplaint: ''
          });
        }
        setShowVitalsForm(true);
        toast.success(`Recording vitals for ${patient.name}`);
      } catch (err) {
        toast.error('Failed to resolve patient appointment context');
      } finally {
        setLoadingQueue(false);
      }
    }
  };

  // Push to Doctor (status: WAITING_FOR_DOCTOR)
  const handlePushToDoctor = async (e) => {
    e.preventDefault();
    if (!currentAppointment) return toast.error('No active patient loaded');
    if (!vitalsForm.chiefComplaint.trim()) return toast.error('Chief Complaint is required');

    try {
      const payload = {
        status: 'WAITING_FOR_DOCTOR',
        chiefComplaint: vitalsForm.chiefComplaint,
        vitals: {
          height: vitalsForm.height ? parseFloat(vitalsForm.height) : undefined,
          weight: vitalsForm.weight ? parseFloat(vitalsForm.weight) : undefined,
          bmi: vitalsForm.bmi ? parseFloat(vitalsForm.bmi) : undefined,
          bp: vitalsForm.bp || undefined,
          pulse: vitalsForm.pulse ? parseInt(vitalsForm.pulse) : undefined,
          temperature: vitalsForm.temperature ? parseFloat(vitalsForm.temperature) : undefined,
          spo2: vitalsForm.spo2 ? parseInt(vitalsForm.spo2) : undefined,
          bloodSugar: vitalsForm.bloodSugar ? parseFloat(vitalsForm.bloodSugar) : undefined
        }
      };

      const { data } = await api.put(`/appointments/${currentAppointment._id}`, payload);
      setCurrentAppointment(data);
      toast.success('Vitals successfully updated & pushed to doctor!');
      fetchPendingQueue();
      // Reset form states after push
      setShowVitalsForm(false);
      setSelectedPatient(null);
      setCurrentAppointment(null);
    } catch (err) {
      toast.error('Failed to push request to consultant doctor');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Vitals Slip Print Preview Overlay */}
      {printMode && currentAppointment && selectedPatient && (
        <div className="fixed inset-0 z-50 bg-white overflow-auto print:static">
          <div className="print:hidden flex items-center justify-between p-4 border-b bg-gray-50">
            <h2 className="font-bold text-gray-900">Vitals Slip Preview</h2>
            <div className="flex gap-2">
              <button onClick={handlePrint} className="btn-primary text-sm flex items-center gap-1">
                <FiPrinter /> Print Slip
              </button>
              <button onClick={() => setPrintMode(false)} className="btn-secondary text-sm">
                Close
              </button>
            </div>
          </div>

          <div className="max-w-md mx-auto p-8 border my-8 rounded-2xl shadow-sm print:shadow-none print:border-none print:my-0 print:p-0">
            <div className="text-center pb-4 border-b-2 border-dashed">
              <h2 className="text-xl font-bold text-gray-900">MEDCORE CLINICS</h2>
              <p className="text-xs text-gray-500 mt-0.5">Vitals Intake Card</p>
              <p className="text-xs text-gray-400 font-mono mt-1">
                Date: {new Date(currentAppointment.date).toLocaleDateString('en-IN')} | Token: T-{currentAppointment.tokenNumber || '—'}
              </p>
            </div>

            <div className="py-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Patient Name:</span>
                <span className="font-bold text-gray-900">{selectedPatient.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Patient ID (UHID):</span>
                <span className="font-mono text-gray-900 font-semibold">{selectedPatient.patientId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Age / Gender:</span>
                <span className="text-gray-900">{selectedPatient.age} yrs / {selectedPatient.gender}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Mobile:</span>
                <span className="text-gray-900 font-mono">{selectedPatient.phone}</span>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl space-y-2.5 border text-sm print:bg-transparent">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Vital Measurements</p>
              <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                <div className="flex justify-between border-b pb-1">
                  <span className="text-gray-500">BP:</span>
                  <span className="font-semibold">{vitalsForm.bp || '—'} mmHg</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="text-gray-500">Pulse:</span>
                  <span className="font-semibold">{vitalsForm.pulse || '—'} bpm</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="text-gray-500">Temp:</span>
                  <span className="font-semibold">{vitalsForm.temperature || '—'} °F</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="text-gray-500">SpO₂:</span>
                  <span className="font-semibold">{vitalsForm.spo2 || '—'} %</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="text-gray-500">Height:</span>
                  <span className="font-semibold">{vitalsForm.height || '—'} cm</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="text-gray-500">Weight:</span>
                  <span className="font-semibold">{vitalsForm.weight || '—'} kg</span>
                </div>
                <div className="flex justify-between col-span-2 border-b pb-1">
                  <span className="text-gray-500">BMI:</span>
                  <span className="font-semibold text-indigo-700">{vitalsForm.bmi || '—'}</span>
                </div>
                {vitalsForm.bloodSugar && (
                  <div className="flex justify-between col-span-2 border-b pb-1">
                    <span className="text-gray-500">Blood Sugar:</span>
                    <span className="font-semibold">{vitalsForm.bloodSugar} mg/dL</span>
                  </div>
                )}
              </div>
              <div className="pt-2 text-xs">
                <span className="text-gray-500 font-bold block mb-0.5">Chief Complaint:</span>
                <span className="text-gray-800 italic">"{vitalsForm.chiefComplaint || 'None'}"</span>
              </div>
            </div>

            <div className="text-center pt-6 text-[10px] text-gray-400 uppercase tracking-widest border-t border-dashed mt-6">
              Nurse Station Checkin • MedCore HMS
            </div>
          </div>
        </div>
      )}

      {/* Main header banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-700 via-teal-600 to-cyan-800 p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <FiActivity className="text-white text-xl animate-pulse" />
          Nurse Station Dashboard
        </h1>
        <p className="text-cyan-100 text-sm mt-1">Intake patient vitals, complaints, print slips, and push to doctors queue</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Work queues & Search */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Tab selector */}
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('queue')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'queue' ? 'bg-white text-gray-900 shadow' : 'text-gray-500'}`}
            >
              Push Queue ({pendingQueue.length})
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'search' ? 'bg-white text-gray-900 shadow' : 'text-gray-500'}`}
            >
              Search by ID
            </button>
          </div>

          {activeTab === 'queue' ? (
            <div className="card space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="font-bold text-gray-800 text-sm">Receptionist Requests</h3>
                <button onClick={fetchPendingQueue} className="text-xs font-bold text-teal-600 hover:underline">
                  Refresh
                </button>
              </div>

              {loadingQueue ? (
                <div className="text-center py-6 text-sm text-gray-400">Loading queue...</div>
              ) : pendingQueue.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-6">No pending vitals requests</p>
              ) : (
                <div className="space-y-3">
                  {pendingQueue.map(apt => (
                    <div key={apt._id} className="p-3 border rounded-xl hover:border-teal-300 transition-all bg-gray-50/50">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{apt.patientId?.name || 'Patient Name'}</p>
                          <p className="text-xs text-gray-500 font-mono mt-0.5">{apt.patientId?.patientId || 'UHID-NEW'}</p>
                          <p className="text-xs text-gray-600 mt-1 font-semibold">
                            Assigned to: {apt.doctorId?.name || 'Consultant'}
                          </p>
                        </div>
                        <span className="font-mono text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
                          T-{apt.tokenNumber || '0'}
                        </span>
                      </div>
                      <button
                        onClick={() => selectPatientForVitals(apt.patientId, apt)}
                        className="btn-primary w-full mt-3 !py-1.5 !text-xs flex items-center justify-center gap-1"
                      >
                        Accept & Record Vitals <FiArrowRight />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="card space-y-4">
              <h3 className="font-bold text-gray-800 text-sm">Find Patient</h3>
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Enter UHID or mobile number..."
                  className="input-field text-xs py-2 flex-1"
                />
                <button type="submit" className="btn-primary !py-2 !px-4 text-xs">
                  Search
                </button>
              </form>

              {searching ? (
                <div className="text-center py-6"><Loader label="Searching..." /></div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase">Search Results</p>
                  {searchResults.map(p => (
                    <div key={p._id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-teal-300 hover:bg-teal-50/10 transition-all">
                      <div>
                        <p className="text-xs font-bold text-gray-800">{p.name} ({p.age} • {p.gender})</p>
                        <p className="text-[10px] text-gray-500 font-mono">ID: {p.patientId} • Phone: {p.phone}</p>
                      </div>
                      <button 
                        onClick={() => selectPatientForVitals(p)}
                        className="btn-secondary !py-1 !px-2.5 text-[11px]"
                      >
                        Select
                      </button>
                    </div>
                  ))}
                </div>
              ) : searchQuery && (
                <p className="text-center text-xs text-gray-400 py-6">No matching patients found.</p>
              )}
            </div>
          )}
        </div>

        {/* Right workspace: Vitals Recording Sheet */}
        <div className="lg:col-span-2">
          {showVitalsForm && selectedPatient && currentAppointment ? (
            <div className="card space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Record Vitals & Complaints</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Patient: <span className="font-bold text-gray-700">{selectedPatient.name}</span> ({selectedPatient.age}y • {selectedPatient.gender}) | UHID: <span className="font-mono font-semibold">{selectedPatient.patientId}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPrintMode(true)}
                  className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1"
                >
                  <FiPrinter /> Save & Print Slip
                </button>
              </div>

              <form onSubmit={handlePushToDoctor} className="space-y-5">
                
                {/* Dialogue Bubble */}
                <div className="p-4 bg-cyan-50 border border-cyan-100 rounded-2xl flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold flex-shrink-0">N</div>
                  <div>
                    <p className="text-xs font-semibold text-cyan-800 uppercase tracking-wider">Nurse Dialogue</p>
                    <p className="text-sm text-cyan-900 font-medium mt-0.5">
                      "What brings you to the hospital today?"
                    </p>
                  </div>
                </div>

                {/* Chief Complaint */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Chief Complaint *</label>
                  <input
                    type="text" required
                    value={vitalsForm.chiefComplaint}
                    onChange={e => setVitalsForm({...vitalsForm, chiefComplaint: e.target.value})}
                    placeholder="e.g., Fever with chills since 2 days, chest congestion"
                    className="input-field text-sm"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {TEMPLATE_COMPLAINTS.map(comp => (
                      <button
                        key={comp} type="button"
                        onClick={() => setVitalsForm(prev => ({ ...prev, chiefComplaint: comp }))}
                        className="px-2.5 py-1 text-[10px] font-semibold bg-gray-100 hover:bg-teal-50 hover:text-teal-700 text-gray-600 rounded-lg transition-colors border"
                      >
                        + {comp}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vitals Form Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t pt-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Height (cm)</label>
                    <input
                      type="number"
                      value={vitalsForm.height}
                      onChange={e => setVitalsForm({...vitalsForm, height: e.target.value})}
                      className="input-field text-sm py-2" placeholder="e.g. 170"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      value={vitalsForm.weight}
                      onChange={e => setVitalsForm({...vitalsForm, weight: e.target.value})}
                      className="input-field text-sm py-2" placeholder="e.g. 70"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">BMI (Auto-calculated)</label>
                    <input
                      type="text" disabled
                      value={vitalsForm.bmi}
                      className="input-field text-sm py-2 bg-gray-50 font-bold text-teal-700 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Blood Pressure</label>
                    <div className="relative">
                      <MdBloodtype className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500 text-base" />
                      <input
                        type="text"
                        value={vitalsForm.bp}
                        onChange={e => setVitalsForm({...vitalsForm, bp: e.target.value})}
                        className="input-field text-sm py-2 pl-9" placeholder="e.g. 120/80"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Pulse Rate (bpm)</label>
                    <div className="relative">
                      <FiHeart className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500" />
                      <input
                        type="number"
                        value={vitalsForm.pulse}
                        onChange={e => setVitalsForm({...vitalsForm, pulse: e.target.value})}
                        className="input-field text-sm py-2 pl-9" placeholder="e.g. 78"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Temperature (°F)</label>
                    <div className="relative">
                      <FiThermometer className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" />
                      <input
                        type="number" step="0.1"
                        value={vitalsForm.temperature}
                        onChange={e => setVitalsForm({...vitalsForm, temperature: e.target.value})}
                        className="input-field text-sm py-2 pl-9" placeholder="e.g. 98.6"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">SpO₂ (%)</label>
                    <input
                      type="number"
                      value={vitalsForm.spo2}
                      onChange={e => setVitalsForm({...vitalsForm, spo2: e.target.value})}
                      className="input-field text-sm py-2" placeholder="e.g. 99"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Blood Sugar (mg/dL)</label>
                    <input
                      type="number"
                      value={vitalsForm.bloodSugar}
                      onChange={e => setVitalsForm({...vitalsForm, bloodSugar: e.target.value})}
                      className="input-field text-sm py-2" placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="flex gap-4 border-t pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowVitalsForm(false);
                      setSelectedPatient(null);
                      setCurrentAppointment(null);
                    }}
                    className="btn-secondary flex-1 py-3"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1 py-3 bg-teal-600 hover:bg-teal-700 border-teal-600 flex items-center justify-center gap-1.5"
                  >
                    <FiSend /> Push to Doctor Queue
                  </button>
                </div>

              </form>
            </div>
          ) : (
            <div className="card h-[400px] flex flex-col items-center justify-center text-center p-6 border-dashed">
              <div className="w-16 h-16 rounded-full bg-cyan-50 flex items-center justify-center text-cyan-500 mb-4 animate-pulse">
                <FiActivity size={32} />
              </div>
              <h3 className="font-bold text-gray-800 text-base">Select a patient to intake vitals</h3>
              <p className="text-xs text-gray-400 max-w-sm mt-1">
                You can select from the receptionist requests list or search using UHID/mobile number to record vitals stats.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
