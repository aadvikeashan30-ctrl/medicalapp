import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiPhone, FiClock, FiSun, FiMoon, FiSunrise, FiCheckCircle,
  FiAlertCircle, FiBell, FiCalendar
} from 'react-icons/fi';
import { FaHeartbeat, FaPills, FaCapsules } from 'react-icons/fa';
import axios from 'axios';
const api = axios.create({ baseURL: '/api' });

const timingLabels = {
  'after-food': { label: 'After Food', icon: FiSun, color: 'text-amber-600', bg: 'bg-amber-50' },
  'before-food': { label: 'Before Food', icon: FiSunrise, color: 'text-orange-600', bg: 'bg-orange-50' },
  'empty-stomach': { label: 'Empty Stomach', icon: FiSunrise, color: 'text-red-600', bg: 'bg-red-50' },
  'bedtime': { label: 'Bedtime', icon: FiMoon, color: 'text-indigo-600', bg: 'bg-indigo-50' }
};

function parseFrequency(freq) {
  if (!freq) return [];
  const parts = freq.split('-').map(Number);
  const times = [];
  if (parts[0]) times.push('Morning');
  if (parts[1]) times.push('Afternoon');
  if (parts[2]) times.push('Night');
  return times;
}

export default function MedicationReminder() {
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [checkedMeds, setCheckedMeds] = useState({});

  const handleLookup = async (e) => {
    e.preventDefault();
    if (phone.length < 10) { setError('Enter valid 10-digit phone'); return; }
    setLoading(true); setError('');
    try {
      const { data: result } = await api.get(`/portal/medication-reminders?phone=${phone}`);
      setData(result);
      setStep('meds');
    } catch (err) {
      setError(err.response?.data?.message || 'No records found');
    } finally { setLoading(false); }
  };

  const toggleCheck = (idx) => {
    setCheckedMeds(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const allChecked = data?.medications?.length > 0 && 
    Object.keys(checkedMeds).length === data.medications.length &&
    Object.values(checkedMeds).every(v => v);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-white dark:from-gray-900 dark:to-gray-800">
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
              <FaHeartbeat className="text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">DocClinic Pro</span>
          </Link>
          <div className="flex gap-2">
            <Link to="/health-tips" className="btn-secondary text-sm !py-2">Tips</Link>
            <Link to="/book" className="btn-primary text-sm !py-2">Book</Link>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {step === 'phone' && (
          <div className="max-w-md mx-auto text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
              <FaPills className="text-white text-2xl" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">My Medications</h1>
            <p className="text-gray-500 mb-8">View your active prescriptions and track daily doses</p>
            <form onSubmit={handleLookup} className="card text-left space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Phone Number</label>
                <div className="relative">
                  <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g,'').slice(0,10))} className="input-field !pl-11" placeholder="9876543210" maxLength={10} required />
                </div>
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
              <button type="submit" disabled={loading || phone.length < 10} className="btn-primary w-full py-3">
                {loading ? 'Loading...' : 'View My Medications'}
              </button>
            </form>
          </div>
        )}

        {step === 'meds' && data && (
          <div className="animate-fade-in space-y-6">
            {/* Patient header */}
            <div className="card flex items-center gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-100 dark:border-blue-800">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {data.patient?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white">{data.patient?.name}</h2>
                <p className="text-sm text-gray-500">{data.totalActive} active medication{data.totalActive !== 1 ? 's' : ''}</p>
              </div>
            </div>

            {/* All checked congratulations */}
            {allChecked && (
              <div className="card bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-center py-6">
                <FiCheckCircle className="mx-auto text-3xl text-emerald-600 mb-2" />
                <h3 className="font-bold text-emerald-800 dark:text-emerald-300">All Done for Today!</h3>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">You've taken all your medications. Great job!</p>
              </div>
            )}

            {/* Medication list */}
            {(data.medications || []).length === 0 ? (
              <div className="card text-center py-10 text-gray-400">
                <FaCapsules className="mx-auto text-3xl mb-3" />
                <p>No active medications found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.medications.map((med, idx) => {
                  const timing = timingLabels[med.timing] || timingLabels['after-food'];
                  const TimingIcon = timing.icon;
                  const times = parseFrequency(med.frequency);
                  const isChecked = checkedMeds[idx];

                  return (
                    <div
                      key={idx}
                      className={`card !p-4 transition-all duration-300 ${isChecked ? 'opacity-60 scale-[0.98]' : 'hover:shadow-md'}`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Check button */}
                        <button
                          onClick={() => toggleCheck(idx)}
                          className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                            isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 hover:border-emerald-400'
                          }`}
                        >
                          {isChecked && <FiCheckCircle className="text-sm" />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={`font-bold text-gray-900 dark:text-white ${isChecked ? 'line-through' : ''}`}>
                              {med.name}
                            </h3>
                            {med.dosage && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{med.dosage}</span>}
                          </div>

                          {/* Schedule pills */}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {times.map(t => (
                              <span key={t} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium">
                                <FiClock className="text-[10px] text-gray-400" /> {t}
                              </span>
                            ))}
                            <span className={`text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium ${timing.bg} ${timing.color}`}>
                              <TimingIcon className="text-[10px]" /> {timing.label}
                            </span>
                          </div>

                          {/* Duration + diagnosis */}
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            {med.duration && <span className="flex items-center gap-1"><FiCalendar className="text-[10px]" /> {med.duration}</span>}
                            {med.diagnosis && <span>• For: {med.diagnosis}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Link to="/book" className="btn-primary text-sm flex items-center gap-2"><FiCalendar /> Book Follow-up</Link>
              <Link to="/health-tips" className="btn-secondary text-sm flex items-center gap-2"><FiSun /> Health Tips</Link>
              <button onClick={() => { setStep('phone'); setData(null); setCheckedMeds({}); }} className="btn-secondary text-sm">Change Phone</button>
            </div>

            {/* Disclaimer */}
            <p className="text-center text-xs text-gray-400 pt-4">
              <FiAlertCircle className="inline mr-1" /> Take medicines as prescribed. Contact your doctor for any changes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
