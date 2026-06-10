import React, { useState } from 'react';
import {
  FiDollarSign, FiPlus, FiX, FiCheckCircle, FiClock, FiUsers, FiCreditCard
} from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useApi } from '../hooks/useApi';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import ThreeDCard from '../components/ThreeDCard';

const inr = (n) => `\u20b9${Number(n || 0).toLocaleString('en-IN')}`;
const monthNow = () => new Date().toISOString().slice(0, 7);
const statusCfg = { draft: 'badge-gray', approved: 'badge-info', paid: 'badge-success' };
const empty = { staffName: '', role: 'staff', month: monthNow(), baseSalary: '', allowances: '', deductions: '' };

export default function Payroll() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const { data, loading, refetch } = useApi('/payroll');
  const { data: statsData, refetch: refetchStats } = useApi('/payroll/stats/summary');
  const slips = data?.slips || [];
  const stats = statsData || { totalPayout: 0, paid: 0, pending: 0, count: 0 };
  const reload = () => { refetch(); refetchStats(); };

  const net = (Number(form.baseSalary) || 0) + (Number(form.allowances) || 0) - (Number(form.deductions) || 0);

  const create = async (e) => {
    e.preventDefault();
    if (!form.staffName.trim()) return toast.error('Staff name is required');
    setSaving(true);
    try {
      await api.post('/payroll', { ...form, baseSalary: Number(form.baseSalary) || 0, allowances: Number(form.allowances) || 0, deductions: Number(form.deductions) || 0 });
      toast.success('Salary slip created'); setShowModal(false); setForm(empty); reload();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const setStatus = async (slip, status) => {
    try { await api.put(`/payroll/${slip._id}`, { status }); toast.success(status === 'paid' ? 'Marked paid' : 'Approved'); reload(); }
    catch (e) { toast.error('Failed'); }
  };


  return (
    <div className="page-enter space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center"><FiDollarSign className="text-white text-lg" /></div>
            Payroll
          </h1>
          <p className="text-sm text-gray-500 mt-1">Generate salary slips, approve and record payouts</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><FiPlus /> New Salary Slip</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Monthly Payout', value: inr(stats.totalPayout), icon: FaRupeeSign, grad: 'from-green-500 to-emerald-600', bg: 'from-green-50 to-emerald-50', border: 'border-green-100' },
          { label: 'Slips', value: stats.count, icon: FiUsers, grad: 'from-blue-500 to-indigo-600', bg: 'from-blue-50 to-indigo-50', border: 'border-blue-100' },
          { label: 'Paid', value: stats.paid, icon: FiCheckCircle, grad: 'from-emerald-500 to-teal-600', bg: 'from-emerald-50 to-teal-50', border: 'border-emerald-100' },
          { label: 'Pending', value: stats.pending, icon: FiClock, grad: 'from-amber-500 to-orange-600', bg: 'from-amber-50 to-orange-50', border: 'border-amber-100' }
        ].map((s) => (
          <ThreeDCard key={s.label} intensity={8}>
            <div className={`p-5 bg-gradient-to-br ${s.bg} rounded-2xl border ${s.border}`}>
              <div className={`w-11 h-11 bg-gradient-to-br ${s.grad} rounded-xl flex items-center justify-center shadow-lg mb-3`}><s.icon className="text-white text-lg" /></div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          </ThreeDCard>
        ))}
      </div>

      {loading ? (
        <Loader label="Loading payroll..." />
      ) : slips.length === 0 ? (
        <EmptyState icon={FiCreditCard} title="No salary slips yet" message="Create salary slips for your staff — days present can auto-fill from attendance."
          action={<button onClick={() => setShowModal(true)} className="btn-primary text-sm">Create First Slip</button>} />
      ) : (
        <div className="space-y-3">
          {slips.map((p) => (
            <div key={p._id} className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center flex-shrink-0"><FiDollarSign className="text-emerald-600 text-lg" /></div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{p.staffName}</h3>
                    <span className="text-xs text-gray-400 capitalize">{p.role}</span>
                    <span className="badge badge-primary">{p.month}</span>
                  </div>
                  <p className="text-xs text-gray-500">Base {inr(p.baseSalary)} + Allow {inr(p.allowances)} − Ded {inr(p.deductions)}{p.daysPresent != null ? ` · ${p.daysPresent} days` : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-lg font-bold text-gray-900 dark:text-white">{inr(p.netPay)}</span>
                <span className={`badge ${statusCfg[p.status] || 'badge-gray'}`}>{p.status}</span>
                {p.status === 'draft' && <button onClick={() => setStatus(p, 'approved')} className="btn-secondary !py-1.5 !px-3 text-xs">Approve</button>}
                {p.status !== 'paid' && <button onClick={() => setStatus(p, 'paid')} className="btn-primary !py-1.5 !px-3 text-xs">Mark Paid</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">New Salary Slip</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><FiX className="text-gray-500" /></button>
            </div>
            <form onSubmit={create} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Staff Name *</label><input value={form.staffName} onChange={(e) => setForm({ ...form, staffName: e.target.value })} className="input-field" required /></div>
                <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Month</label><input type="month" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} className="input-field" /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Base</label><input type="number" value={form.baseSalary} onChange={(e) => setForm({ ...form, baseSalary: e.target.value })} className="input-field" /></div>
                <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Allowances</label><input type="number" value={form.allowances} onChange={(e) => setForm({ ...form, allowances: e.target.value })} className="input-field" /></div>
                <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Deductions</label><input type="number" value={form.deductions} onChange={(e) => setForm({ ...form, deductions: e.target.value })} className="input-field" /></div>
              </div>
              <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
                <span className="text-sm font-medium text-emerald-800">Net Pay</span>
                <span className="text-lg font-bold text-emerald-700">{inr(net)}</span>
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Create Slip'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
