import React, { useState, useMemo } from 'react';
import {
  FiTrendingUp, FiUsers, FiCalendar, FiDollarSign,
  FiDownload, FiPieChart, FiBarChart2, FiActivity,
  FiClock, FiAlertCircle, FiCheckCircle, FiArrowUpRight, FiArrowDownRight
} from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { useApi } from '../hooks/useApi';
import Loader from '../components/Loader';
import ThreeDCard from '../components/ThreeDCard';
import AnimatedCounter from '../components/AnimatedCounter';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, ArcElement, Title, Tooltip, Legend, Filler
);

const PERIOD_OPTIONS = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 3 Months' },
  { value: '6m', label: 'Last 6 Months' },
  { value: '1y', label: 'Last 1 Year' }
];

const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function Reports() {
  const [period, setPeriod] = useState('30d');

  const { data: stats, loading: statsLoading } = useApi('/dashboard/stats');
  const { data: analytics, loading: analyticsLoading } = useApi('/dashboard/analytics');
  const { data: revenue } = useApi('/billing/revenue/summary');
  const { data: patientsData } = useApi('/patients?limit=500');
  const { data: appointmentsData } = useApi('/appointments?limit=500');
  const { data: billsData } = useApi('/billing?limit=200');

  const patients = patientsData?.patients || [];
  const appointments = appointmentsData?.appointments || appointmentsData || [];
  const bills = billsData?.bills || [];

  // Compute demographics
  const demographics = useMemo(() => {
    const genderMap = { male: 0, female: 0, other: 0 };
    const ageGroups = { '0-18': 0, '19-30': 0, '31-45': 0, '46-60': 0, '60+': 0 };
    const cityMap = {};

    patients.forEach(p => {
      if (p.gender) genderMap[p.gender] = (genderMap[p.gender] || 0) + 1;
      const age = p.age || 0;
      if (age <= 18) ageGroups['0-18']++;
      else if (age <= 30) ageGroups['19-30']++;
      else if (age <= 45) ageGroups['31-45']++;
      else if (age <= 60) ageGroups['46-60']++;
      else ageGroups['60+']++;

      const city = p.city || 'Unknown';
      cityMap[city] = (cityMap[city] || 0) + 1;
    });

    const topCities = Object.entries(cityMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { genderMap, ageGroups, topCities };
  }, [patients]);

  // Appointment analytics
  const appointmentStats = useMemo(() => {
    const statusMap = {};
    const typeMap = {};
    let totalCompleted = 0;
    let totalNoShow = 0;

    (Array.isArray(appointments) ? appointments : []).forEach(a => {
      statusMap[a.status] = (statusMap[a.status] || 0) + 1;
      typeMap[a.type] = (typeMap[a.type] || 0) + 1;
      if (a.status === 'completed') totalCompleted++;
      if (a.status === 'no-show') totalNoShow++;
    });

    const total = appointments.length || 1;
    const completionRate = Math.round((totalCompleted / total) * 100);
    const noShowRate = Math.round((totalNoShow / total) * 100);

    return { statusMap, typeMap, completionRate, noShowRate, total };
  }, [appointments]);

  // Revenue by payment method
  const revenueByMethod = useMemo(() => {
    const methodMap = {};
    bills.forEach(b => {
      const method = b.paymentMethod || 'cash';
      methodMap[method] = (methodMap[method] || 0) + (b.totalAmount || 0);
    });
    return methodMap;
  }, [bills]);

  // Monthly revenue chart data from analytics
  const revenueChartData = useMemo(() => {
    const monthly = analytics?.monthlyRevenue || [];
    return {
      labels: monthly.map(m => m.month || m._id || ''),
      datasets: [{
        label: 'Revenue (₹)',
        data: monthly.map(m => m.revenue || m.total || 0),
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointRadius: 4
      }]
    };
  }, [analytics]);

  // Patient growth chart
  const patientGrowthData = useMemo(() => {
    const monthly = analytics?.monthlyPatients || analytics?.monthlyRevenue || [];
    return {
      labels: monthly.map(m => m.month || m._id || ''),
      datasets: [{
        label: 'New Patients',
        data: monthly.map(m => m.patients || m.newPatients || m.count || 0),
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
        borderRadius: 8
      }]
    };
  }, [analytics]);

  // Gender doughnut
  const genderChartData = {
    labels: ['Male', 'Female', 'Other'],
    datasets: [{
      data: [demographics.genderMap.male, demographics.genderMap.female, demographics.genderMap.other],
      backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(236, 72, 153, 0.8)', 'rgba(168, 85, 247, 0.8)'],
      borderWidth: 0
    }]
  };

  // Payment method doughnut
  const paymentChartData = {
    labels: Object.keys(revenueByMethod).map(k => k.charAt(0).toUpperCase() + k.slice(1)),
    datasets: [{
      data: Object.values(revenueByMethod),
      backgroundColor: [
        'rgba(16, 185, 129, 0.8)', 'rgba(59, 130, 246, 0.8)',
        'rgba(245, 158, 11, 0.8)', 'rgba(139, 92, 246, 0.8)', 'rgba(236, 72, 153, 0.8)'
      ],
      borderWidth: 0
    }]
  };

  // Appointment type bar chart
  const appointmentTypeData = {
    labels: Object.keys(appointmentStats.typeMap).map(k => k.charAt(0).toUpperCase() + k.slice(1)),
    datasets: [{
      label: 'Count',
      data: Object.values(appointmentStats.typeMap),
      backgroundColor: [
        'rgba(59, 130, 246, 0.7)', 'rgba(16, 185, 129, 0.7)',
        'rgba(245, 158, 11, 0.7)', 'rgba(239, 68, 68, 0.7)', 'rgba(139, 92, 246, 0.7)'
      ],
      borderRadius: 8,
      borderWidth: 0
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1f2937', cornerRadius: 8 } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 11 } } }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { padding: 15, usePointStyle: true, font: { size: 11 } } } },
    cutout: '65%'
  };

  const exportReport = () => {
    const lines = [
      'DocClinic Pro - Clinic Report',
      `Generated: ${new Date().toLocaleDateString('en-IN')}`,
      '',
      'SUMMARY',
      `Total Patients: ${stats?.totalPatients || patients.length}`,
      `Today Appointments: ${stats?.todayAppointments || 0}`,
      `Month Revenue: ${formatINR(revenue?.month)}`,
      `Lifetime Revenue: ${formatINR(revenue?.total)}`,
      `Appointment Completion Rate: ${appointmentStats.completionRate}%`,
      `No-Show Rate: ${appointmentStats.noShowRate}%`,
      '',
      'PATIENT DEMOGRAPHICS',
      `Male: ${demographics.genderMap.male}, Female: ${demographics.genderMap.female}, Other: ${demographics.genderMap.other}`,
      '',
      'AGE DISTRIBUTION',
      ...Object.entries(demographics.ageGroups).map(([k, v]) => `  ${k}: ${v}`),
      '',
      'TOP CITIES',
      ...demographics.topCities.map(([city, count]) => `  ${city}: ${count}`),
      '',
      'REVENUE BY PAYMENT METHOD',
      ...Object.entries(revenueByMethod).map(([m, v]) => `  ${m}: ${formatINR(v)}`)
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clinic-report-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (statsLoading || analyticsLoading) return <Loader label="Loading reports..." />;

  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center glow-indigo">
              <FiBarChart2 className="text-white text-lg" />
            </div>
            Reports & Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-1">Comprehensive insights into your clinic performance</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="input-field !py-2 !px-4 text-sm min-w-[150px]"
          >
            {PERIOD_OPTIONS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <button onClick={exportReport} className="btn-secondary flex items-center gap-2 text-sm !py-2">
            <FiDownload /> Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ThreeDCard intensity={10}>
          <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <FiUsers className="text-white text-lg" />
              </div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <FiArrowUpRight className="text-[10px]" /> +{stats?.newPatientsThisMonth || 0}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900"><AnimatedCounter end={stats?.totalPatients || patients.length} /></p>
            <p className="text-xs text-gray-500 mt-1">Total Patients</p>
          </div>
        </ThreeDCard>

        <ThreeDCard intensity={10}>
          <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <FaRupeeSign className="text-white text-lg" />
              </div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <FiArrowUpRight className="text-[10px]" /> +12%
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatINR(revenue?.month)}</p>
            <p className="text-xs text-gray-500 mt-1">Monthly Revenue</p>
          </div>
        </ThreeDCard>

        <ThreeDCard intensity={10}>
          <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <FiCheckCircle className="text-white text-lg" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900"><AnimatedCounter end={appointmentStats.completionRate} suffix="%" /></p>
            <p className="text-xs text-gray-500 mt-1">Completion Rate</p>
          </div>
        </ThreeDCard>

        <ThreeDCard intensity={10}>
          <div className="p-5 bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl border border-orange-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                <FiAlertCircle className="text-white text-lg" />
              </div>
              {appointmentStats.noShowRate > 10 && (
                <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                  <FiArrowDownRight className="text-[10px]" /> High
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900"><AnimatedCounter end={appointmentStats.noShowRate} suffix="%" /></p>
            <p className="text-xs text-gray-500 mt-1">No-Show Rate</p>
          </div>
        </ThreeDCard>
      </div>

      {/* Revenue + Patient Growth Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FiTrendingUp className="text-blue-600" /> Revenue Trend
            </h3>
            <span className="text-sm text-gray-400">Last 6 months</span>
          </div>
          <div className="h-64">
            <Line data={revenueChartData} options={chartOptions} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FiUsers className="text-emerald-600" /> Patient Growth
            </h3>
            <span className="text-sm text-gray-400">Monthly new patients</span>
          </div>
          <div className="h-64">
            <Bar data={patientGrowthData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Demographics + Payment Method */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FiPieChart className="text-pink-600" /> Gender Distribution
          </h3>
          <div className="h-56">
            <Doughnut data={genderChartData} options={doughnutOptions} />
          </div>
        </div>

        <div className="card">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FiDollarSign className="text-emerald-600" /> Payment Methods
          </h3>
          <div className="h-56">
            <Doughnut data={paymentChartData} options={doughnutOptions} />
          </div>
        </div>

        <div className="card">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FiBarChart2 className="text-indigo-600" /> Appointment Types
          </h3>
          <div className="h-56">
            <Bar data={appointmentTypeData} options={{ ...chartOptions, indexAxis: 'y' }} />
          </div>
        </div>
      </div>

      {/* Age Distribution + Top Cities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FiActivity className="text-purple-600" /> Age Distribution
          </h3>
          <div className="space-y-3">
            {Object.entries(demographics.ageGroups).map(([range, count]) => {
              const total = patients.length || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={range} className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-12">{range}</span>
                  <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-700 flex items-center justify-end pr-2"
                      style={{ width: `${Math.max(pct, 3)}%` }}
                    >
                      {pct > 10 && <span className="text-[10px] text-white font-bold">{pct}%</span>}
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white w-10 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FiCalendar className="text-amber-600" /> Top Patient Locations
          </h3>
          {demographics.topCities.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No location data available</p>
          ) : (
            <div className="space-y-3">
              {demographics.topCities.map(([city, count], idx) => (
                <div key={city} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                    idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                    idx === 1 ? 'bg-gray-100 text-gray-600' :
                    idx === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-50 text-blue-600'
                  }`}>
                    #{idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{city}</p>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Revenue Summary Table */}
      <div className="card">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FaRupeeSign className="text-emerald-600" /> Revenue Summary
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Period</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Collection</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Invoices</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-50 dark:border-gray-800/50">
                <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">Today</td>
                <td className="py-3 px-4 text-right font-bold text-emerald-600">{formatINR(revenue?.today)}</td>
                <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">—</td>
              </tr>
              <tr className="border-b border-gray-50 dark:border-gray-800/50">
                <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">This Week</td>
                <td className="py-3 px-4 text-right font-bold text-emerald-600">{formatINR(revenue?.week)}</td>
                <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">—</td>
              </tr>
              <tr className="border-b border-gray-50 dark:border-gray-800/50">
                <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">This Month</td>
                <td className="py-3 px-4 text-right font-bold text-emerald-600">{formatINR(revenue?.month)}</td>
                <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">{bills.length}</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">Lifetime</td>
                <td className="py-3 px-4 text-right font-bold text-blue-600 text-lg">{formatINR(revenue?.total)}</td>
                <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
