import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiActivity, FiAlertTriangle, FiCheckCircle, FiClock,
  FiArrowRight, FiHeart, FiShield, FiSend
} from 'react-icons/fi';
import { FaHeartbeat, FaStethoscope, FaRobot } from 'react-icons/fa';
import axios from 'axios';

const urgencyConfig = {
  emergency: { color: 'red', icon: FiAlertTriangle, label: 'EMERGENCY', bg: 'from-red-500 to-rose-600', advice: 'Call 108 / Visit nearest ER immediately' },
  urgent: { color: 'orange', icon: FiClock, label: 'URGENT', bg: 'from-orange-500 to-amber-600', advice: 'Visit a doctor within 24 hours' },
  routine: { color: 'emerald', icon: FiCheckCircle, label: 'ROUTINE', bg: 'from-emerald-500 to-teal-600', advice: 'Schedule an appointment at your convenience' }
};

const api = axios.create({ baseURL: '/api' });

export default function SymptomChecker() {
  const [form, setForm] = useState({ symptoms: '', age: '', gender: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.symptoms.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data } = await api.post('/portal/symptom-check', form);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to analyze symptoms. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const config = result ? urgencyConfig[result.urgency] || urgencyConfig.routine : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
              <FaHeartbeat className="text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">DocClinic Pro</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/book" className="btn-secondary text-sm !py-2 !px-4">Book Appointment</Link>
            <Link to="/login" className="btn-primary text-sm !py-2 !px-4">Doctor Login</Link>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
            <FaRobot className="text-white text-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">AI Symptom Checker</h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
            Describe your symptoms and our AI will assess urgency, suggest possible conditions, and recommend next steps.
          </p>
          <div className="flex items-center justify-center gap-2 mt-3 text-xs text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 rounded-full px-4 py-1.5 w-fit mx-auto">
            <FiShield /> Not a replacement for medical advice
          </div>
        </div>

        {/* Form */}
        {!result && (
          <form onSubmit={handleSubmit} className="card max-w-xl mx-auto space-y-5 animate-fade-in">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Describe your symptoms *
              </label>
              <textarea
                value={form.symptoms}
                onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
                className="input-field"
                rows={4}
                placeholder="E.g., I have a headache for 2 days, mild fever, and body pain..."
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Age</label>
                <input
                  type="number" min={1} max={120}
                  value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })}
                  className="input-field" placeholder="25"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Gender</label>
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="input-field">
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl">
                <FiAlertTriangle /> {error}
              </div>
            )}

            <button type="submit" disabled={loading || !form.symptoms.trim()} className="btn-primary w-full py-3.5 text-center flex items-center justify-center gap-2">
              {loading ? (
                <><FiActivity className="animate-spin" /> Analyzing symptoms...</>
              ) : (
                <><FaRobot /> Check My Symptoms</>
              )}
            </button>
          </form>
        )}

        {/* Result */}
        {result && config && (
          <div className="space-y-6 animate-fade-in">
            {/* Urgency Banner */}
            <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${config.bg} p-6 text-white shadow-xl`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                  <config.icon className="text-2xl" />
                </div>
                <div>
                  <p className="text-sm opacity-80 uppercase tracking-wider font-medium">Urgency Level</p>
                  <h2 className="text-2xl font-bold">{config.label}</h2>
                  <p className="text-sm opacity-90 mt-1">{config.advice}</p>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Possible Conditions */}
              <div className="card">
                <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <FiActivity className="text-blue-600" /> Possible Conditions
                </h3>
                <div className="space-y-2">
                  {(result.possibleConditions || []).map((c, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                      {c}
                    </div>
                  ))}
                </div>
              </div>

              {/* Red Flags */}
              {result.redFlags?.length > 0 && (
                <div className="card border-red-100 dark:border-red-800">
                  <h3 className="font-bold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
                    <FiAlertTriangle /> Watch For
                  </h3>
                  <div className="space-y-2">
                    {result.redFlags.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
                        <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Home Remedies */}
              {result.homeRemedies?.length > 0 && (
                <div className="card">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <FiHeart className="text-emerald-600" /> Home Care
                  </h3>
                  <div className="space-y-2">
                    {result.homeRemedies.map((r, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <FiCheckCircle className="text-emerald-500 flex-shrink-0 text-xs" />
                        {r}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Immediate Advice */}
              <div className="card bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800">
                <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                  <FaStethoscope /> Recommended Action
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-400">{result.immediateAdvice}</p>
                {result.suggestedSpecialty && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                    Suggested specialist: <strong className="capitalize">{result.suggestedSpecialty}</strong>
                  </p>
                )}
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/book" className="btn-primary flex-1 text-center py-3 flex items-center justify-center gap-2">
                <FiArrowRight /> Book Doctor Appointment
              </Link>
              <button onClick={() => { setResult(null); setForm({ symptoms: '', age: '', gender: '' }); }} className="btn-secondary flex-1 text-center py-3">
                Check Another Symptom
              </button>
            </div>

            {/* Disclaimer */}
            <div className="text-center text-xs text-gray-400 dark:text-gray-500 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
              <FiShield className="inline mr-1" />
              {result.disclaimer || 'This AI assessment is for informational purposes only. Always consult a qualified healthcare professional.'}
              <br />
              <span className="text-gray-300 dark:text-gray-600">Provider: {result.provider || 'AI'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
