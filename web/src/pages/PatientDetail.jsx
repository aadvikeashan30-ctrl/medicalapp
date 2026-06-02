import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiUser, FiPhone, FiMail, FiCalendar,
  FiFileText, FiDollarSign, FiActivity, FiEdit2,
  FiMapPin, FiClock, FiHeart, FiPrinter
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import api from '../utils/api';
import { useApi } from '../hooks/useApi';
import Loader from '../components/Loader';
import PatientTimeline from '../components/PatientTimeline';
import ThreeDCard from '../components/ThreeDCard';
import FloatingOrb from '../components/FloatingOrb';


export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: patient, loading } = useApi(`/patients/${id}`);
  const { data: appointments } = useApi(`/appointments?patientId=${id}&limit=20`);
  const { data: prescriptions } = useApi(`/prescriptions?patientId=${id}&limit=20`);
  const { data: billings } = useApi(`/billing?patientId=${id}&limit=20`);
  const { data: labData } = useApi(`/labtests?patientId=${id}&limit=20`);

  const labTests = labData?.tests || [];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiUser },
    { id: 'history', label: 'Visit History', icon: FiClock },
    { id: 'appointments', label: 'Appointments', icon: FiCalendar },
    { id: 'prescriptions', label: 'Prescriptions', icon: FiFileText },
    { id: 'labtests', label: 'Lab Tests', icon: FiActivity },
    { id: 'billing', label: 'Billing', icon: FiDollarSign }
  ];

  if (loading) return <Loader label="Loading patient..." />;
  if (!patient) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Patient not found</p>
      <Link to="/patients" className="text-blue-600 text-sm mt-2 inline-block">← Back to patients</Link>
    </div>
  );

  const age = patient.age || (patient.dateOfBirth
    ? Math.floor((Date.now() - new Date(patient.dateOfBirth)) / 31557600000)
    : '—');


  // Build timeline events from all data
  const timelineEvents = [
    ...(appointments || []).slice(0, 5).map(a => ({
      type: 'appointment',
      title: `${a.type || 'Consultation'} - ${a.status}`,
      description: a.notes || `Token #${a.tokenNumber}`,
      date: new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      doctor: 'You'
    })),
    ...(prescriptions || []).slice(0, 3).map(p => ({
      type: 'prescription',
      title: `Prescription - ${p.medicines?.length || 0} medicines`,
      description: p.diagnosis || '',
      date: new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    })),
    ...labTests.slice(0, 3).map(l => ({
      type: 'labtest',
      title: l.name,
      description: `Status: ${l.status}`,
      date: new Date(l.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Back button */}
      <button onClick={() => navigate('/patients')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors">
        <FiArrowLeft /> Back to Patients
      </button>

      {/* Patient Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-700 p-8 text-white shadow-2xl">
        <FloatingOrb size={200} color="purple" top="-40px" right="-30px" opacity={0.2} />
        <FloatingOrb size={150} color="cyan" bottom="-20px" left="10%" opacity={0.15} delay={1} />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center text-3xl font-bold">
            {patient.name?.charAt(0).toUpperCase()}
          </div>
          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl font-bold">{patient.name}</h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-2 text-blue-100 text-sm">
              <span>{patient.gender || '—'} • {age} yrs</span>
              {patient.phone && <span className="flex items-center gap-1"><FiPhone /> {patient.phone}</span>}
              {patient.email && <span className="flex items-center gap-1"><FiMail /> {patient.email}</span>}
            </div>
            {patient.address && (
              <p className="text-blue-200 text-sm mt-1 flex items-center gap-1"><FiMapPin /> {patient.address}</p>
            )}
          </div>


          {/* Quick stats */}
          <div className="flex gap-3">
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
              <p className="text-xl font-bold">{(appointments || []).length}</p>
              <p className="text-[11px] text-blue-200">Visits</p>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
              <p className="text-xl font-bold">{(prescriptions || []).length}</p>
              <p className="text-[11px] text-blue-200">Rx</p>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
              <p className="text-xl font-bold">{labTests.length}</p>
              <p className="text-[11px] text-blue-200">Tests</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <tab.icon className="text-base" /> {tab.label}
          </button>
        ))}
      </div>


      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          <div className="lg:col-span-2 space-y-6">
            {/* Medical Info */}
            <div className="card">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FiHeart className="text-red-500" /> Medical Info
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Blood Group:</span> <span className="font-medium">{patient.bloodGroup || '—'}</span></div>
                <div><span className="text-gray-500">Allergies:</span> <span className="font-medium">{patient.allergies || 'None known'}</span></div>
                <div><span className="text-gray-500">Conditions:</span> <span className="font-medium">{patient.conditions || '—'}</span></div>
                <div><span className="text-gray-500">Emergency:</span> <span className="font-medium">{patient.emergencyContact || '—'}</span></div>
              </div>
              {patient.notes && (
                <div className="mt-4 p-3 bg-amber-50 rounded-xl text-sm text-amber-800 border border-amber-100">
                  <strong>Notes:</strong> {patient.notes}
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="card">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FiClock className="text-purple-600" /> Recent Activity
              </h3>
              <PatientTimeline events={timelineEvents} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <ThreeDCard intensity={8}>
              <div className="p-5 bg-white rounded-2xl border border-gray-100">
                <h4 className="font-bold text-gray-900 mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  <Link to="/appointments" className="block w-full text-left text-sm px-4 py-2.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors font-medium">
                    + Book Appointment
                  </Link>
                  <Link to="/prescriptions" className="block w-full text-left text-sm px-4 py-2.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors font-medium">
                    + Create Prescription
                  </Link>
                  <Link to="/lab-tests" className="block w-full text-left text-sm px-4 py-2.5 rounded-xl bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors font-medium">
                    + Order Lab Test
                  </Link>
                  <Link to="/billing" className="block w-full text-left text-sm px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors font-medium">
                    + Create Bill
                  </Link>
                </div>
              </div>
            </ThreeDCard>

            <div className="card">
              <h4 className="font-bold text-gray-900 mb-3">Registration</h4>
              <p className="text-sm text-gray-500">
                Patient ID: <span className="font-mono text-gray-900">{patient.patientId || patient._id?.slice(-6)}</span>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Registered: {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString('en-IN') : '—'}
              </p>
            </div>
          </div>
        </div>
      )}


      {activeTab === 'history' && (
        <div className="card animate-fade-in">
          <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
            <FiClock className="text-indigo-500" /> Complete Visit History
          </h3>
          {timelineEvents.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No visit history yet</p>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-5 top-2 bottom-2 w-px bg-gradient-to-b from-indigo-200 via-purple-200 to-emerald-200" />

              <div className="space-y-4">
                {timelineEvents.map((event, idx) => {
                  const typeConfig = {
                    appointment: { color: 'bg-blue-500', border: 'border-blue-200', bgLight: 'bg-blue-50', icon: '📋' },
                    prescription: { color: 'bg-purple-500', border: 'border-purple-200', bgLight: 'bg-purple-50', icon: '💊' },
                    billing: { color: 'bg-emerald-500', border: 'border-emerald-200', bgLight: 'bg-emerald-50', icon: '💰' },
                    labtest: { color: 'bg-rose-500', border: 'border-rose-200', bgLight: 'bg-rose-50', icon: '🔬' },
                    checkup: { color: 'bg-amber-500', border: 'border-amber-200', bgLight: 'bg-amber-50', icon: '🩺' },
                  };
                  const cfg = typeConfig[event.type] || typeConfig.appointment;

                  return (
                    <div key={idx} className="flex gap-4 animate-slide-in" style={{ animationDelay: `${idx * 60}ms` }}>
                      {/* Dot */}
                      <div className="relative flex-shrink-0">
                        <div className={`w-10 h-10 rounded-xl ${cfg.bgLight} border ${cfg.border} flex items-center justify-center text-base`}>
                          {cfg.icon}
                        </div>
                      </div>
                      {/* Content */}
                      <div className={`flex-1 p-4 rounded-xl border ${cfg.border} ${cfg.bgLight} transition-all hover:shadow-sm`}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{event.title}</p>
                            {event.description && (
                              <p className="text-xs text-gray-600 mt-0.5">{event.description}</p>
                            )}
                          </div>
                          <span className="text-[11px] text-gray-400 whitespace-nowrap">{event.date}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'appointments' && (
        <div className="space-y-3 animate-fade-in">
          {(appointments || []).length === 0 ? (
            <div className="card text-center py-10 text-gray-400">No appointments found</div>
          ) : (
            (appointments || []).map((apt) => (
              <div key={apt._id} className="card flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                    #{apt.tokenNumber}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{apt.type || 'Consultation'}</p>
                    <p className="text-sm text-gray-500">{new Date(apt.date).toLocaleDateString('en-IN')} • {apt.timeSlot}</p>
                  </div>
                </div>
                <span className={`badge ${apt.status === 'completed' ? 'badge-green' : apt.status === 'in-progress' ? 'badge-blue' : 'badge-amber'}`}>
                  {apt.status}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'prescriptions' && (
        <div className="space-y-3 animate-fade-in">
          {(prescriptions || []).length === 0 ? (
            <div className="card text-center py-10 text-gray-400">No prescriptions found</div>
          ) : (
            (prescriptions || []).map((rx) => (
              <div key={rx._id} className="card">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-gray-900">
                    {rx.diagnosis || 'Prescription'} — {rx.medicines?.length || 0} medicines
                  </p>
                  <span className="text-xs text-gray-400">{new Date(rx.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
                {rx.medicines?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {rx.medicines.slice(0, 5).map((m, i) => (
                      <span key={i} className="badge badge-purple">{m.name} {m.strength || ''}</span>
                    ))}
                    {rx.medicines.length > 5 && <span className="badge badge-blue">+{rx.medicines.length - 5} more</span>}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'labtests' && (
        <div className="space-y-3 animate-fade-in">
          {labTests.length === 0 ? (
            <div className="card text-center py-10 text-gray-400">No lab tests found</div>
          ) : (
            labTests.map((lt) => (
              <div key={lt._id} className="card flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{lt.name}</p>
                  <p className="text-sm text-gray-500">{lt.category || '—'} • {new Date(lt.createdAt).toLocaleDateString('en-IN')}</p>
                  {lt.resultSummary && <p className="text-xs text-emerald-600 mt-1">{lt.resultSummary}</p>}
                </div>
                <span className={`badge ${lt.status === 'reported' ? 'badge-green' : lt.status === 'ordered' ? 'badge-blue' : 'badge-amber'}`}>
                  {lt.status}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="space-y-3 animate-fade-in">
          {(billings || []).length === 0 ? (
            <div className="card text-center py-10 text-gray-400">No billing records found</div>
          ) : (
            (billings || []).map((bill) => (
              <div key={bill._id} className="card flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">Invoice #{bill.invoiceNumber || bill._id?.slice(-6)}</p>
                  <p className="text-sm text-gray-500">{new Date(bill.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">₹{(bill.totalAmount || 0).toLocaleString('en-IN')}</p>
                  <span className={`badge ${bill.status === 'paid' ? 'badge-green' : 'badge-red'}`}>{bill.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
