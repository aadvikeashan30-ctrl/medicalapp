import React, { useState, useMemo } from 'react';
import {
  FiPlus, FiSearch, FiEdit2, FiTrash2, FiX, FiDollarSign,
  FiFilter, FiDownload, FiChevronDown, FiCalendar, FiRepeat,
  FiTrendingDown, FiPieChart, FiHome, FiUsers as FiStaff,
  FiPackage, FiTool, FiZap, FiTruck, FiShield, FiGlobe
} from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useApi } from '../hooks/useApi';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import ThreeDCard from '../components/ThreeDCard';
import AnimatedCounter from '../components/AnimatedCounter';

ChartJS.register(ArcElement, Tooltip, Legend);

const CATEGORIES = [
  { value: 'rent', label: 'Rent', icon: FiHome, color: 'from-blue-500 to-indigo-600' },
  { value: 'salary', label: 'Salary', icon: FiStaff, color: 'from-purple-500 to-pink-600' },
  { value: 'supplies', label: 'Supplies', icon: FiPackage, color: 'from-emerald-500 to-teal-600' },
  { value: 'equipment', label: 'Equipment', icon: FiTool, color: 'from-orange-500 to-amber-600' },
  { value: 'utilities', label: 'Utilities', icon: FiZap, color: 'from-yellow-500 to-orange-500' },
  { value: 'marketing', label: 'Marketing', icon: FiGlobe, color: 'from-pink-500 to-rose-600' },
  { value: 'insurance', label: 'Insurance', icon: FiShield, color: 'from-cyan-500 to-blue-600' },
  { value: 'maintenance', label: 'Maintenance', icon: FiTool, color: 'from-gray-500 to-slate-600' },
  { value: 'travel', label: 'Travel', icon: FiTruck, color: 'from-indigo-500 to-violet-600' },
  { value: 'other', label: 'Other', icon: FiDollarSign, color: 'from-gray-400 to-gray-600' }
];

const PAYMENT_METHODS = ['cash', 'upi', 'card', 'online', 'cheque'];

const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function Expenses() {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    category: 'supplies', description: '', amount: '', date: new Date().toISOString().slice(0, 10),
    vendor: '', paymentMethod: 'cash', isRecurring: false, recurringFrequency: '', notes: ''
  });

  const queryParams = new URLSearchParams();
  if (filterCategory) queryParams.set('category', filterCategory);
  queryParams.set('limit', '100');

  const { data, loading, refetch } = useApi(`/expenses?${queryParams.toString()}`);
  const { data: summary, refetch: refetchSummary } = useApi('/expenses/summary');

  const expenses = data?.expenses || [];
  const total = data?.total || 0;

  const filteredExpenses = expenses.filter(e =>
    !search || e.description?.toLowerCase().includes(search.toLowerCase()) ||
    e.vendor?.toLowerCase().includes(search.toLowerCase()) ||
    e.category?.toLowerCase().includes(search.toLowerCase())
  );

  // Category chart data from summary
  const categoryChartData = useMemo(() => {
    const cats = summary?.byCategory || [];
    return {
      labels: cats.map(c => {
        const cat = CATEGORIES.find(x => x.value === c._id);
        return cat?.label || c._id;
      }),
      datasets: [{
        data: cats.map(c => c.total),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)', 'rgba(139, 92, 246, 0.8)', 'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)', 'rgba(234, 179, 8, 0.8)', 'rgba(236, 72, 153, 0.8)',
          'rgba(6, 182, 212, 0.8)', 'rgba(107, 114, 128, 0.8)', 'rgba(99, 102, 241, 0.8)',
          'rgba(156, 163, 175, 0.8)'
        ],
        borderWidth: 0
      }]
    };
  }, [summary]);

  const openAdd = () => {
    setEditing(null);
    setForm({
      category: 'supplies', description: '', amount: '', date: new Date().toISOString().slice(0, 10),
      vendor: '', paymentMethod: 'cash', isRecurring: false, recurringFrequency: '', notes: ''
    });
    setShowModal(true);
  };

  const openEdit = (exp) => {
    setEditing(exp);
    setForm({
      category: exp.category || 'other',
      description: exp.description || '',
      amount: exp.amount || '',
      date: exp.date ? new Date(exp.date).toISOString().slice(0, 10) : '',
      vendor: exp.vendor || '',
      paymentMethod: exp.paymentMethod || 'cash',
      isRecurring: exp.isRecurring || false,
      recurringFrequency: exp.recurringFrequency || '',
      notes: exp.notes || ''
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.description.trim() || !form.amount) return toast.error('Description and amount required');
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/expenses/${editing._id}`, form);
        toast.success('Expense updated');
      } else {
        await api.post('/expenses', form);
        toast.success('Expense recorded');
      }
      setShowModal(false);
      refetch();
      refetchSummary();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      toast.success('Expense deleted');
      refetch();
      refetchSummary();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const exportCSV = () => {
    const headers = ['Date', 'Category', 'Description', 'Amount', 'Vendor', 'Payment Method', 'Recurring', 'Notes'];
    const rows = expenses.map(e => [
      new Date(e.date).toLocaleDateString('en-IN'),
      e.category, e.description, e.amount, e.vendor || '',
      e.paymentMethod || '', e.isRecurring ? 'Yes' : 'No', e.notes || ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center glow-amber">
              <FiDollarSign className="text-white text-lg" />
            </div>
            Expenses
          </h1>
          <p className="text-sm text-gray-500 mt-1 ml-[52px]">Track clinic expenses, profit & loss</p>
        </div>
        <div className="flex gap-2">
          {expenses.length > 0 && (
            <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 text-sm !py-2">
              <FiDownload /> Export
            </button>
          )}
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <FiPlus /> Add Expense
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ThreeDCard intensity={10}>
          <div className="p-5 bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl border border-red-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <FiTrendingDown className="text-white text-lg" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatINR(summary?.thisMonth)}</p>
            <p className="text-xs text-gray-500 mt-1">This Month</p>
          </div>
        </ThreeDCard>

        <ThreeDCard intensity={10}>
          <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <FiCalendar className="text-white text-lg" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatINR(summary?.thisYear)}</p>
            <p className="text-xs text-gray-500 mt-1">This Year</p>
          </div>
        </ThreeDCard>

        <ThreeDCard intensity={10}>
          <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <FiPieChart className="text-white text-lg" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900"><AnimatedCounter end={summary?.thisMonthCount || 0} /></p>
            <p className="text-xs text-gray-500 mt-1">Entries This Month</p>
          </div>
        </ThreeDCard>

        <ThreeDCard intensity={10}>
          <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <FiRepeat className="text-white text-lg" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {expenses.filter(e => e.isRecurring).length}
            </p>
            <p className="text-xs text-gray-500 mt-1">Recurring</p>
          </div>
        </ThreeDCard>
      </div>

      {/* Category Breakdown + Expense List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Chart */}
        <div className="card">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <FiPieChart className="text-purple-600" /> By Category
          </h3>
          {(summary?.byCategory || []).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No data yet</p>
          ) : (
            <div className="h-56">
              <Doughnut
                data={categoryChartData}
                options={{
                  responsive: true, maintainAspectRatio: false, cutout: '60%',
                  plugins: { legend: { position: 'bottom', labels: { padding: 12, usePointStyle: true, font: { size: 10 } } } }
                }}
              />
            </div>
          )}
          {/* Category list */}
          <div className="mt-4 space-y-2 max-h-48 overflow-y-auto custom-scroll">
            {(summary?.byCategory || []).map(cat => {
              const config = CATEGORIES.find(c => c.value === cat._id) || CATEGORIES[9];
              const Icon = config.icon;
              return (
                <div key={cat._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center`}>
                      <Icon className="text-white text-xs" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{config.label}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{formatINR(cat.total)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expense List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search expenses..."
                className="input-field !pl-10"
              />
            </div>
            <div className="relative">
              <FiFilter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="input-field !pl-10 !pr-10 appearance-none min-w-[150px]"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <FiChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* List */}
          {loading ? (
            <Loader label="Loading expenses..." />
          ) : filteredExpenses.length === 0 ? (
            <EmptyState
              icon={FiDollarSign}
              title="No expenses found"
              message="Track your clinic expenses to understand profit & loss"
              action={<button onClick={openAdd} className="btn-primary text-sm">Add First Expense</button>}
            />
          ) : (
            <div className="space-y-2">
              {filteredExpenses.map((exp, idx) => {
                const config = CATEGORIES.find(c => c.value === exp.category) || CATEGORIES[9];
                const Icon = config.icon;
                return (
                  <div
                    key={exp._id}
                    className="card !p-4 flex items-center justify-between group animate-slide-in"
                    style={{ animationDelay: `${idx * 20}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center shadow-md flex-shrink-0`}>
                        <Icon className="text-white text-sm" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">{exp.description}</h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                          <span>{config.label}</span>
                          {exp.vendor && <><span>•</span><span>{exp.vendor}</span></>}
                          <span>•</span>
                          <span>{new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                          {exp.isRecurring && (
                            <span className="flex items-center gap-0.5 text-blue-600"><FiRepeat className="text-[10px]" /> {exp.recurringFrequency}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-base font-bold text-red-600">-{formatINR(exp.amount)}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(exp)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"><FiEdit2 className="text-sm" /></button>
                        <button onClick={() => handleDelete(exp._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><FiTrash2 className="text-sm" /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editing ? 'Edit Expense' : 'Add Expense'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <FiX className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Category *</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Amount (₹) *</label>
                  <input
                    type="number" min="0" step="0.01"
                    value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="input-field" placeholder="5000" required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Description *</label>
                <input
                  type="text" value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-field" placeholder="e.g. Monthly clinic rent" required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Date</label>
                  <input
                    type="date" value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Payment Method</label>
                  <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="input-field">
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Vendor / Payee</label>
                <input
                  type="text" value={form.vendor}
                  onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                  className="input-field" placeholder="e.g. Landlord, PharmaCo"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox" checked={form.isRecurring}
                    onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Recurring expense</span>
                </label>
                {form.isRecurring && (
                  <select
                    value={form.recurringFrequency}
                    onChange={(e) => setForm({ ...form, recurringFrequency: e.target.value })}
                    className="input-field !py-1.5 !px-3 text-sm w-32"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Notes</label>
                <textarea
                  value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="input-field" rows={2} placeholder="Additional notes..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Saving...' : editing ? 'Update' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
