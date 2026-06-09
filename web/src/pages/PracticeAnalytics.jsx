import React, { useState } from 'react';
import {
  FiTrendingUp, FiActivity, FiClock, FiPieChart, FiCpu,
  FiCheckCircle, FiAlertCircle, FiCalendar, FiZap, FiUser,
  FiFileText, FiPackage, FiBarChart2, FiChevronRight, FiAlertTriangle
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useApi } from '../hooks/useApi';
import Loader from '../components/Loader';
import ThreeDCard from '../components/ThreeDCard';
import AnimatedCounter from '../components/AnimatedCounter';

const PERIODS = [
  { value: 30, label: 'Last 30 Days' },
  { value: 90, label: 'Last 90 Days' },
  { value: 180, label: 'Last 6 Months' },
  { value: 365, label: 'Last 1 Year' }
];

const BAR_COLORS = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-violet-500 to-purple-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-blue-600',
  'from-lime-500 to-green-600',
  'from-fuchsia-500 to-pink-600'
];

const riskStyles = {
  low: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  moderate: 'text-amber-700 bg-amber-50 border-amber-200',
  high: 'text-orange-700 bg-orange-50 border-orange-200',
  critical: 'text-red-700 bg-red-50 border-red-200'
};

function RankedBars({ items, labelKey, valueKey, colorOffset = 0 }) {
  const max = Math.max(...items.map((i) => i[valueKey]), 1);
  return (
    <div className="space-y-2.5">
      {items.map((item, idx) => {
        const pct = Math.round((item[valueKey] / max) * 100);
        return (
          <div key={idx} className="flex items-center gap-3">
            <span className="text-sm text-gray-700 dark:text-gray-300 w-40 truncate capitalize" title={item[labelKey]}>
              {item[labelKey] || 'Unknown'}
            </span>
            <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${BAR_COLORS[(idx + colorOffset) % BAR_COLORS.length]} rounded-full transition-all duration-700`}
                style={{ width: `${Math.max(pct, 4)}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-gray-900 dark:text-white w-8 text-right">{item[valueKey]}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function PracticeAnalytics() {
  const [days, setDays] = useState(90);
  const { data, loading } = useApi(`/dashboard/practice?days=${days}`, { deps: [days] });
  const { data: patientsData } = useApi('/patients?limit=200');

  // AI Schedule Optimizer state
  const [optDate, setOptDate] = useState(new Date().toISOString().slice(0, 10));
  const [optLoading, setOptLoading] = useState(false);
  const [optResult, setOptResult] = useState(null);

  // AI Patient Risk state
  const [riskPatient, setRiskPatient] = useState('');
  const [riskLoading, setRiskLoading] = useState(false);
  const [riskResult, setRiskResult] = useState(null);

  const patients = patientsData?.patients || patientsData || [];

  const m = data?.appointmentMetrics || {};
  const totals = data?.totals || {};

  const runOptimizer = async () => {
    setOptLoading(true);
    setOptResult(null);
    try {
      const res = await api.post('/doctor/optimize-schedule', { date: optDate });
      setOptResult(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to optimize');
    } finally {
      setOptLoading(false);
    }
  };

  const runRisk = async () => {
    if (!riskPatient) return toast.error('Select a patient first');
    setRiskLoading(true);
    setRiskResult(null);
    try {
      const res = await api.post('/doctor/patient-risk', { patientId: riskPatient });
      setRiskResult(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assess risk');
    } finally {
      setRiskLoading(false);
    }
  };

  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
              <FiTrendingUp className="text-white text-lg" />
            </div>
            Practice Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-1">Your prescribing patterns, no-show rate, and AI-powered insights</p>
        </div>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="input-field !py-2 !px-4 text-sm min-w-[150px]">
          {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>

      {loading ? (
        <Loader label="Crunching your practice data..." />
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <ThreeDCard intensity={10}>
              <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg mb-3">
                  <FiCalendar className="text-white text-lg" />
                </div>
                <p className="text-2xl font-bold text-gray-900"><AnimatedCounter end={totals.appointments || 0} /></p>
                <p className="text-xs text-gray-500 mt-1">Appointments</p>
              </div>
            </ThreeDCard>
            <ThreeDCard intensity={10}>
              <div className="p-5 bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border border-violet-100">
                <div className="w-11 h-11 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg mb-3">
                  <FiFileText className="text-white text-lg" />
                </div>
                <p className="text-2xl font-bold text-gray-900"><AnimatedCounter end={totals.prescriptions || 0} /></p>
                <p className="text-xs text-gray-500 mt-1">Prescriptions</p>
              </div>
            </ThreeDCard>
            <ThreeDCard intensity={10}>
              <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100">
                <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg mb-3">
                  <FiCheckCircle className="text-white text-lg" />
                </div>
                <p className="text-2xl font-bold text-gray-900"><AnimatedCounter end={m.completionRate || 0} suffix="%" /></p>
                <p className="text-xs text-gray-500 mt-1">Completion Rate</p>
              </div>
            </ThreeDCard>
            <ThreeDCard intensity={10}>
              <div className="p-5 bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl border border-orange-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                    <FiAlertCircle className="text-white text-lg" />
                  </div>
                  {m.noShowRate > 10 && <span className="badge badge-danger">High</span>}
                </div>
                <p className="text-2xl font-bold text-gray-900"><AnimatedCounter end={m.noShowRate || 0} suffix="%" /></p>
                <p className="text-xs text-gray-500 mt-1">No-Show Rate</p>
              </div>
            </ThreeDCard>
          </div>

          {/* Top diagnoses + medicines */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FiActivity className="text-blue-600" /> Top Diagnoses
              </h3>
              {(data?.topDiagnoses || []).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No diagnosis data in this period</p>
              ) : (
                <RankedBars items={data.topDiagnoses} labelKey="diagnosis" valueKey="count" />
              )}
            </div>
            <div className="card">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FiPackage className="text-violet-600" /> Most Prescribed Medicines
              </h3>
              {(data?.topMedicines || []).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No prescription data in this period</p>
              ) : (
                <RankedBars items={data.topMedicines} labelKey="medicine" valueKey="count" colorOffset={2} />
              )}
            </div>
          </div>

          {/* Appointment types + peak hours */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FiPieChart className="text-emerald-600" /> Appointment Types
              </h3>
              {(data?.appointmentTypes || []).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No appointment data</p>
              ) : (
                <RankedBars items={data.appointmentTypes} labelKey="type" valueKey="count" colorOffset={1} />
              )}
            </div>
            <div className="card">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FiClock className="text-amber-600" /> Peak Booking Hours
              </h3>
              {(data?.peakHours || []).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No time-slot data</p>
              ) : (
                <RankedBars items={data.peakHours} labelKey="slot" valueKey="count" colorOffset={3} />
              )}
            </div>
          </div>

          {/* AI TOOLS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Schedule Optimizer */}
            <div className="card border-2 border-indigo-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FiZap className="text-indigo-600" /> AI Schedule Optimizer
                </h3>
                <span className="badge badge-info">AI</span>
              </div>
              <div className="flex gap-2 mb-4">
                <input type="date" value={optDate} onChange={(e) => setOptDate(e.target.value)} className="input-field !py-2 text-sm" />
                <button onClick={runOptimizer} disabled={optLoading} className="btn-primary text-sm whitespace-nowrap flex items-center gap-1.5">
                  <FiCpu /> {optLoading ? 'Analyzing...' : 'Optimize'}
                </button>
              </div>
              {optResult ? (
                <div className="space-y-3 text-sm animate-fade-in">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-indigo-50 rounded-xl">
                      <p className="text-xs text-gray-500">Predicted Load</p>
                      <p className="font-bold text-indigo-700">{optResult.insights?.predictedLoad ?? optResult.appointmentCount ?? '—'} patients</p>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-xl">
                      <p className="text-xs text-gray-500">Peak Hours</p>
                      <p className="font-bold text-amber-700">{(optResult.insights?.peakHours || []).join(', ') || '—'}</p>
                    </div>
                  </div>
                  {(optResult.optimizations || []).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Suggestions</p>
                      <ul className="space-y-1.5">
                        {optResult.optimizations.map((o, i) => (
                          <li key={i} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                            <FiChevronRight className="text-indigo-500 mt-0.5 flex-shrink-0" /> {o}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {optResult.suggestedSlots?.emergencyBuffer?.length > 0 && (
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-500">Suggested emergency buffers</p>
                      <p className="font-medium text-gray-800">{optResult.suggestedSlots.emergencyBuffer.join(', ')}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-6">Pick a date and let AI analyze your day's load, peak hours, and suggest buffers.</p>
              )}
            </div>

            {/* AI Patient Risk */}
            <div className="card border-2 border-rose-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FiAlertTriangle className="text-rose-600" /> AI Patient Risk Assessment
                </h3>
                <span className="badge badge-danger">AI</span>
              </div>
              <div className="flex gap-2 mb-4">
                <select value={riskPatient} onChange={(e) => setRiskPatient(e.target.value)} className="input-field !py-2 text-sm flex-1">
                  <option value="">Select patient...</option>
                  {patients.map((p) => (
                    <option key={p._id} value={p._id}>{p.name} ({p.patientId})</option>
                  ))}
                </select>
                <button onClick={runRisk} disabled={riskLoading} className="btn-primary text-sm whitespace-nowrap flex items-center gap-1.5">
                  <FiUser /> {riskLoading ? 'Assessing...' : 'Assess'}
                </button>
              </div>
              {riskResult ? (
                <div className="space-y-3 text-sm animate-fade-in">
                  <div className={`flex items-center justify-between p-3 rounded-xl border ${riskStyles[riskResult.riskLevel] || riskStyles.moderate}`}>
                    <span className="font-semibold capitalize">{riskResult.riskLevel || 'moderate'} risk</span>
                    <span className="text-2xl font-bold">{riskResult.riskScore ?? '—'}<span className="text-sm font-normal">/10</span></span>
                  </div>
                  {typeof riskResult.predictedNoShowProbability === 'number' && (
                    <div className="p-3 bg-gray-50 rounded-xl flex items-center justify-between">
                      <span className="text-gray-500 text-xs">Predicted no-show probability</span>
                      <span className="font-bold text-gray-800">{riskResult.predictedNoShowProbability}%</span>
                    </div>
                  )}
                  {(riskResult.factors || []).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Risk Factors</p>
                      <ul className="space-y-1">
                        {riskResult.factors.map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                            <FiAlertCircle className="text-rose-400 mt-0.5 flex-shrink-0" /> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(riskResult.recommendations || []).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Recommendations</p>
                      <ul className="space-y-1">
                        {riskResult.recommendations.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                            <FiCheckCircle className="text-emerald-400 mt-0.5 flex-shrink-0" /> {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="text-[11px] text-gray-400 italic">{riskResult.disclaimer || 'AI assessment is for reference only.'}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-6">Select a patient to get an AI risk score, no-show probability, and care recommendations.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
