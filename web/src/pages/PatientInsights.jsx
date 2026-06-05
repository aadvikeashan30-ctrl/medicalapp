import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  FiTrendingUp, FiUsers, FiCalendar, FiActivity, FiHeart,
  FiBarChart2, FiAlertCircle, FiPieChart, FiClock,
  FiArrowUp, FiArrowDown, FiCheckCircle, FiSearch
} from 'react-icons/fi';
import { FaRobot } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useApi } from '../hooks/useApi';
import Loader from '../components/Loader';

// ──────────────────────────────────────────────
// Patient Insights & Analytics Dashboard
// Healthplix-style data-driven patient analytics
// ──────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color, gradient }) {
  return (
    <div className="card p-4">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3`}>
        <Icon className="text-white" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
      {sub && <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><FiArrowUp className="text-[10px]" /> {sub}</p>}
    </div>
  );
}

function DiagnosisChart({ data }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.count));
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-teal-500', 'bg-amber-500', 'bg-pink-500', 'bg-indigo-500', 'bg-rose-500', 'bg-cyan-500'];
  
  return (
    <div className="space-y-2">
      {data.slice(0, 8).map((d, i) => (
        <div key={d.name || i} className="flex items-center gap-3">
          <span className="text-xs text-gray-600 w-32 truncate">{d.name || d._id}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden relative">
            <div
              className={`h-full ${colors[i % colors.length]} rounded-full transition-all duration-700 flex items-center justify-end pr-2`}
              style={{ width: `${Math.max(10, (d.count / max) * 100)}%` }}
            >
              <span className="text-[10px] font-bold text-white">{d.count}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function VisitTrendChart({ monthly }) {
  if (!monthly || monthly.length === 0) return null;
  const max = Math.max(...monthly.map(m => m.count), 1);
  
  return (
    <div className="flex items-end gap-2 h-32">
      {monthly.map((m, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[9px] text-gray-500 font-medium">{m.count}</span>
          <div
            className="w-full bg-gradient-to-t from-indigo-500 to-indigo-300 rounded-t-md transition-all duration-500 hover:from-indigo-600 hover:to-indigo-400"
            style={{ height: `${Math.max(5, (m.count / max) * 100)}%` }}
          />
          <span className="text-[9px] text-gray-400">{m.month}</span>
        </div>
      ))}
    </div>
  );
}

export default function PatientInsights() {
  const [searchParams] = useSearchParams();
  const patientIdParam = searchParams.get('patientId');
  const [patientId, setPatientId] = useState(patientIdParam || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('clinic'); // clinic | patient
  const [patientResults, setPatientResults] = useState([]);

  // Clinic-wide analytics
  const { data: clinicStats } = useApi('/dashboard/stats');
  const { data: analytics } = useApi('/dashboard/analytics');

  // Compute derived analytics
  const [topDiagnoses, setTopDiagnoses] = useState([]);
  const [ageGroups, setAgeGroups] = useState([]);
  const [visitTrend, setVisitTrend] = useState([]);
  const [adherenceRate, setAdherenceRate] = useState(78);
  const [noShowRate, setNoShowRate] = useState(12);

  useEffect(() => {
    // Mock analytics (in real app, these would come from API)
    setTopDiagnoses([
      { name: 'Viral Fever', count: 145 },
      { name: 'URTI', count: 98 },
      { name: 'Hypertension', count: 87 },
      { name: 'Type 2 Diabetes', count: 76 },
      { name: 'Gastroenteritis', count: 54 },
      { name: 'UTI', count: 42 },
      { name: 'Dengue', count: 38 },
      { name: 'Migraine', count: 29 },
    ]);
    setAgeGroups([
      { group: '0-18', count: 85, color: 'bg-blue-500' },
      { group: '19-35', count: 190, color: 'bg-teal-500' },
      { group: '36-50', count: 245, color: 'bg-amber-500' },
      { group: '51-65', count: 175, color: 'bg-purple-500' },
      { group: '65+', count: 95, color: 'bg-rose-500' },
    ]);
    setVisitTrend([
      { month: 'Jan', count: 145 },
      { month: 'Feb', count: 168 },
      { month: 'Mar', count: 152 },
      { month: 'Apr', count: 195 },
      { month: 'May', count: 210 },
      { month: 'Jun', count: 188 },
    ]);
  }, [analytics]);

  // Patient search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) { setPatientResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get(`/patients?search=${encodeURIComponent(searchQuery)}&limit=5`);
        setPatientResults(data?.patients || []);
      } catch { setPatientResults([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Load patient insights
  const loadPatientInsights = async (pid) => {
    setLoading(true);
    setPatientId(pid);
    setView('patient');
    setSearchQuery('');
    setPatientResults([]);
    try {
      const [patientRes, aptsRes, rxRes, labRes] = await Promise.all([
        api.get(`/patients/${pid}`),
        api.get(`/appointments?patientId=${pid}&limit=50`),
        api.get(`/prescriptions?patientId=${pid}&limit=50`),
        api.get(`/labtests?patientId=${pid}&limit=20`),
      ]);
      const patient = patientRes.data;
      const appointments = aptsRes.data?.appointments || aptsRes.data || [];
      const prescriptions = rxRes.data?.prescriptions || rxRes.data || [];
      const labTests = labRes.data?.tests || labRes.data || [];

      // Compute insights
      const totalVisits = appointments.length;
      const completedVisits = appointments.filter(a => a.status === 'completed').length;
      const cancelledVisits = appointments.filter(a => a.status === 'cancelled').length;
      const allMeds = prescriptions.flatMap(p => p.medicines || []);
      const uniqueMeds = [...new Set(allMeds.map(m => m.name))];
      const diagnoses = prescriptions.map(p => p.diagnosis).filter(Boolean);
      const diagCounts = {};
      diagnoses.forEach(d => { diagCounts[d] = (diagCounts[d] || 0) + 1; });
      const topPatientDiagnoses = Object.entries(diagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      // Visit frequency
      const visitDates = appointments.map(a => new Date(a.date || a.createdAt));
      let avgGap = 0;
      if (visitDates.length > 1) {
        visitDates.sort((a, b) => a - b);
        const gaps = [];
        for (let i = 1; i < visitDates.length; i++) {
          gaps.push((visitDates[i] - visitDates[i - 1]) / (1000 * 60 * 60 * 24));
        }
        avgGap = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
      }

      setInsights({
        patient,
        totalVisits,
        completedVisits,
        cancelledVisits,
        totalPrescriptions: prescriptions.length,
        totalLabTests: labTests.length,
        uniqueMedicines: uniqueMeds.length,
        topDiagnoses: topPatientDiagnoses,
        recentMedicines: uniqueMeds.slice(0, 10),
        avgVisitGap: avgGap,
        lastVisit: appointments[0] ? new Date(appointments[0].date || appointments[0].createdAt).toLocaleDateString('en-IN') : 'Never',
        adherence: completedVisits > 0 ? Math.round((completedVisits / totalVisits) * 100) : 0,
      });
    } catch (err) {
      toast.error('Failed to load patient insights');
      console.error(err);
    }
    setLoading(false);
  };

  // Auto-load if patientId in URL
  useEffect(() => {
    if (patientIdParam) loadPatientInsights(patientIdParam);
  }, [patientIdParam]);

  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <FiTrendingUp className="text-white text-lg" />
            </div>
            Patient Insights & Analytics
          </h1>
          <p className="text-gray-500 mt-1 ml-[52px] text-sm">Data-driven patient analytics like Healthplix</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView('clinic')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              view === 'clinic' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FiPieChart className="inline mr-1" /> Clinic Analytics
          </button>
          <button
            onClick={() => setView('patient')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              view === 'patient' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <FiUsers className="inline mr-1" /> Patient View
          </button>
        </div>
      </div>

      {/* ════════ CLINIC VIEW ════════ */}
      {view === 'clinic' && (
        <div className="space-y-6 animate-fade-in">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={FiUsers} label="Total Patients" value={clinicStats?.totalPatients || 0} sub={`+${clinicStats?.newPatientsThisMonth || 0} this month`} gradient="from-indigo-500 to-purple-600" />
            <StatCard icon={FiCalendar} label="Monthly Visits" value={clinicStats?.monthAppointments || visitTrend[visitTrend.length-1]?.count || 0} gradient="from-cyan-500 to-blue-600" />
            <StatCard icon={FiCheckCircle} label="Visit Adherence" value={`${adherenceRate}%`} gradient="from-emerald-500 to-teal-600" />
            <StatCard icon={FiAlertCircle} label="No-Show Rate" value={`${noShowRate}%`} gradient="from-amber-500 to-orange-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Diagnoses */}
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiActivity className="text-blue-500" /> Top Diagnoses
              </h3>
              <DiagnosisChart data={topDiagnoses} />
            </div>

            {/* Visit Trend */}
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiBarChart2 className="text-indigo-500" /> Visit Trend (6 months)
              </h3>
              <VisitTrendChart monthly={visitTrend} />
            </div>

            {/* Age Distribution */}
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FiUsers className="text-purple-500" /> Age Distribution
              </h3>
              <div className="space-y-2">
                {ageGroups.map(g => {
                  const total = ageGroups.reduce((a, b) => a + b.count, 0);
                  const pct = Math.round((g.count / total) * 100);
                  return (
                    <div key={g.group} className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 w-12">{g.group}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                        <div className={`h-full ${g.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-12 text-right">{g.count} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Key Insights */}
            <div className="card bg-gradient-to-br from-violet-50 to-indigo-50 border-violet-100">
              <h3 className="font-semibold text-violet-900 mb-4 flex items-center gap-2">
                <FaRobot className="text-violet-600" /> AI Insights
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-white/80 rounded-xl border border-violet-100">
                  <p className="text-sm text-gray-800">📈 <strong>Peak hours:</strong> 10 AM - 12 PM sees highest patient footfall</p>
                </div>
                <div className="p-3 bg-white/80 rounded-xl border border-violet-100">
                  <p className="text-sm text-gray-800">🦠 <strong>Seasonal trend:</strong> Viral fever cases increased 35% this month (monsoon season)</p>
                </div>
                <div className="p-3 bg-white/80 rounded-xl border border-violet-100">
                  <p className="text-sm text-gray-800">💊 <strong>Prescription pattern:</strong> Paracetamol + Cetirizine most prescribed combo</p>
                </div>
                <div className="p-3 bg-white/80 rounded-xl border border-violet-100">
                  <p className="text-sm text-gray-800">⚠️ <strong>Follow-up gap:</strong> 23% of diabetic patients missed follow-up this month</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════ PATIENT VIEW ════════ */}
      {view === 'patient' && (
        <div className="space-y-6 animate-fade-in">
          {/* Search patient */}
          <div className="card max-w-md relative">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search patient by name, phone, ID..."
                className="input-field pl-9"
              />
            </div>
            {patientResults.length > 0 && (
              <div className="mt-2 space-y-1">
                {patientResults.map(p => (
                  <button
                    key={p._id}
                    onClick={() => loadPatientInsights(p._id)}
                    className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-indigo-50 transition-all text-sm"
                  >
                    <span className="font-medium text-gray-900">{p.name}</span>
                    <span className="text-gray-500 ml-2">{p.patientId} • {p.age ? `${p.age}y` : ''}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {loading && <Loader label="Loading patient insights..." />}

          {insights && !loading && (
            <div className="space-y-6">
              {/* Patient header */}
              <div className="card bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center font-bold text-2xl">
                    {insights.patient?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{insights.patient?.name}</h2>
                    <p className="text-indigo-200 text-sm">
                      {insights.patient?.patientId} • {insights.patient?.gender || '—'} • {insights.patient?.age || '—'} yrs
                    </p>
                  </div>
                  <Link
                    to={`/patients/${insights.patient?._id}`}
                    className="ml-auto text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-white transition-all"
                  >
                    View Full Profile →
                  </Link>
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="card p-3 text-center">
                  <p className="text-2xl font-bold text-indigo-600">{insights.totalVisits}</p>
                  <p className="text-xs text-gray-500">Total Visits</p>
                </div>
                <div className="card p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-600">{insights.totalPrescriptions}</p>
                  <p className="text-xs text-gray-500">Prescriptions</p>
                </div>
                <div className="card p-3 text-center">
                  <p className="text-2xl font-bold text-amber-600">{insights.totalLabTests}</p>
                  <p className="text-xs text-gray-500">Lab Tests</p>
                </div>
                <div className="card p-3 text-center">
                  <p className="text-2xl font-bold text-purple-600">{insights.uniqueMedicines}</p>
                  <p className="text-xs text-gray-500">Unique Medicines</p>
                </div>
                <div className="card p-3 text-center">
                  <p className="text-2xl font-bold text-teal-600">{insights.adherence}%</p>
                  <p className="text-xs text-gray-500">Adherence</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Visit pattern */}
                <div className="card">
                  <h3 className="font-semibold text-gray-900 mb-3">Visit Pattern</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Last Visit</span>
                      <span className="font-medium">{insights.lastVisit}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Avg. Visit Gap</span>
                      <span className="font-medium">{insights.avgVisitGap} days</span>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Completed Visits</span>
                      <span className="font-medium text-emerald-600">{insights.completedVisits}</span>
                    </div>
                    <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Cancelled</span>
                      <span className="font-medium text-red-500">{insights.cancelledVisits}</span>
                    </div>
                  </div>
                </div>

                {/* Top diagnoses */}
                <div className="card">
                  <h3 className="font-semibold text-gray-900 mb-3">Diagnosis History</h3>
                  {insights.topDiagnoses.length > 0 ? (
                    <DiagnosisChart data={insights.topDiagnoses} />
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-4">No diagnosis records</p>
                  )}
                </div>

                {/* Medicine history */}
                <div className="card lg:col-span-2">
                  <h3 className="font-semibold text-gray-900 mb-3">Medicine History</h3>
                  {insights.recentMedicines.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {insights.recentMedicines.map((med, i) => (
                        <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs rounded-full font-medium border border-blue-100">
                          {med}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No medicines prescribed yet</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {!insights && !loading && (
            <div className="card text-center py-12">
              <FiTrendingUp className="mx-auto text-4xl text-gray-300 mb-3" />
              <p className="text-gray-500">Search for a patient to view their insights</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
