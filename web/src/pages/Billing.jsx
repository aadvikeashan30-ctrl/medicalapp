import React, { useMemo, useState } from 'react';
import { FiPlus, FiX, FiPrinter, FiTrash2, FiDollarSign, FiDownload, FiCalendar, FiTrendingUp } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useApi } from '../hooks/useApi';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import PrintInvoice from '../components/PrintInvoice';
import PatientSearchSelect from '../components/PatientSearchSelect';
import { Hero3D, useTilt } from '../components/Premium3D';

const statusStyles = {
  paid: 'bg-emerald-100 text-emerald-700',
  partial: 'bg-yellow-100 text-yellow-700',
  pending: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-700'
};

const STATUS_ACCENT = {
  paid:    { dot: '#10b981', soft: 'rgba(16,185,129,0.12)', shadow: 'rgba(16,185,129,0.4)' },
  partial: { dot: '#f59e0b', soft: 'rgba(245,158,11,0.12)', shadow: 'rgba(245,158,11,0.4)' },
  pending: { dot: '#ef4444', soft: 'rgba(239,68,68,0.12)',  shadow: 'rgba(239,68,68,0.4)' },
  refunded:{ dot: '#64748b', soft: 'rgba(100,116,139,0.12)', shadow: 'rgba(100,116,139,0.4)' },
};

const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

/* Gradient revenue tile with 3D tilt + floating orb */
function RevenueTile({ label, value, icon: Icon, gradient, delay }) {
  const tilt = useTilt(9);
  return (
    <div {...tilt} className="tilt-3d relative overflow-hidden rounded-2xl p-5 text-white shadow-lg animate-pop"
         style={{ background: gradient, animationDelay: delay, boxShadow: '0 16px 36px -14px rgba(0,0,0,0.4)' }}>
      <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/15 blur-xl" />
      <div className="relative depth-1">
        <div className="flex items-center justify-between">
          <p className="text-white/80 text-sm font-medium">{label}</p>
          <span className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center"><Icon size={16} /></span>
        </div>
        <p className="text-3xl font-extrabold mt-2 tabular-nums">{value}</p>
      </div>
    </div>
  );
}

function TiltCard({ className = '', style, children }) {
  const tilt = useTilt(6);
  return <div {...tilt} className={`tilt-3d ${className}`} style={style}>{children}</div>;
}

export default function Billing() {
  const { data, loading, error, refetch } = useApi('/billing?limit=50');
  const { data: revenue } = useApi('/billing/revenue/summary');
  const { data: patientsData } = useApi('/patients?limit=100');

  const bills = data?.bills || [];
  const patients = patientsData?.patients || [];

  const [showAddModal, setShowAddModal] = useState(false);
  const [printBill, setPrintBill] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    patientId: '', items: [{ description: '', amount: '', quantity: 1 }],
    paymentMethod: 'cash', discount: 0, tax: 0, paidAmount: 0
  });

  const addItem = () =>
    setForm((f) => ({ ...f, items: [...f.items, { description: '', amount: '', quantity: 1 }] }));
  const removeItem = (idx) =>
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  const updateItem = (idx, key, val) =>
    setForm((f) => {
      const next = [...f.items];
      next[idx] = { ...next[idx], [key]: val };
      return { ...f, items: next };
    });

  const subtotal = useMemo(
    () =>
      form.items.reduce(
        (sum, i) => sum + Number(i.amount || 0) * Number(i.quantity || 1),
        0
      ),
    [form.items]
  );
  const total = Math.max(0, subtotal - Number(form.discount || 0) + Number(form.tax || 0));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.patientId) return toast.error('Please select a patient');
    if (!form.items.some((i) => i.description && i.amount)) {
      return toast.error('Add at least one item');
    }
    setSubmitting(true);
    try {
      await api.post('/billing', {
        ...form,
        items: form.items
          .filter((i) => i.description && i.amount)
          .map((i) => ({
            description: i.description,
            amount: Number(i.amount),
            quantity: Number(i.quantity || 1)
          })),
        discount: Number(form.discount || 0),
        tax: Number(form.tax || 0),
        paidAmount: Number(form.paidAmount || 0)
      });
      toast.success('Invoice created');
      setShowAddModal(false);
      setForm({
        patientId: '', items: [{ description: '', amount: '', quantity: 1 }],
        paymentMethod: 'cash', discount: 0, tax: 0, paidAmount: 0
      });
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create');
    } finally {
      setSubmitting(false);
    }
  };

  const markPaid = async (bill) => {
    try {
      await api.put(`/billing/${bill._id}`, { paidAmount: bill.totalAmount });
      toast.success('Marked as paid');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const exportBillingCSV = (bills) => {
    const headers = ['Invoice No', 'Patient', 'Date', 'Amount', 'Paid', 'Status', 'Method'];
    const rows = bills.map(b => [
      b.invoiceNo || '',
      b.patientId?.name || '',
      new Date(b.createdAt).toLocaleDateString('en-IN'),
      b.totalAmount || 0,
      b.paidAmount || 0,
      b.paymentStatus || '',
      b.paymentMethod || ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `billing-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  return (
    <div className="page-enter space-y-6">
      {/* Hero */}
      <Hero3D
        icon={FiDollarSign}
        badge="Revenue & Invoicing · Live"
        title="Billing"
        subtitle="Create invoices, collect payments & track revenue"
        gradient="radial-gradient(1200px 420px at 100% -20%, rgba(16,185,129,0.5), transparent 60%), linear-gradient(125deg,#065f46 0%,#0f766e 50%,#1d4ed8 100%)"
      >
        {bills.length > 0 && (
          <button onClick={() => exportBillingCSV(bills)} className="inline-flex items-center gap-2 glass-chip text-white px-3 py-2 text-sm font-semibold hover:bg-white/20 transition-colors">
            <FiDownload /> Export
          </button>
        )}
        <button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-2 bg-white text-emerald-700 px-4 py-2 rounded-[14px] text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
          <FiPlus /> Create Invoice
        </button>
      </Hero3D>

      <div className="scene-3d grid grid-cols-1 sm:grid-cols-3 gap-4">
        <RevenueTile label="Today's Collection" value={formatINR(revenue?.today)} icon={FiDollarSign} gradient="linear-gradient(135deg, #059669, #10b981)" delay="0ms" />
        <RevenueTile label="This Month" value={formatINR(revenue?.month)} icon={FiCalendar} gradient="linear-gradient(135deg, #4f46e5, #6366f1)" delay="80ms" />
        <RevenueTile label="Lifetime Revenue" value={formatINR(revenue?.total)} icon={FiTrendingUp} gradient="linear-gradient(135deg, #7c3aed, #a855f7)" delay="160ms" />
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 text-red-700 px-4 py-3 text-sm">{error}</div>
      )}

      {loading ? (
        <Loader label="Loading bills..." />
      ) : bills.length === 0 ? (
        <EmptyState
          icon={FiDollarSign}
          title="No invoices yet"
          message="Create your first invoice to start tracking revenue."
          action={
            <button onClick={() => setShowAddModal(true)} className="btn-primary text-sm">
              Create Invoice
            </button>
          }
        />
      ) : (
        <div className="scene-3d grid grid-cols-1 lg:grid-cols-2 gap-4">
          {bills.map((bill, idx) => {
            const ac = STATUS_ACCENT[bill.paymentStatus] || STATUS_ACCENT.pending;
            return (
              <TiltCard key={bill._id} className="module-3d p-4 animate-pop"
                style={{ '--m-soft': ac.soft, '--m-shadow': ac.shadow, animationDelay: `${Math.min(idx * 35, 320)}ms`, borderLeft: `4px solid ${ac.dot}` }}>
                <div className="flex items-start justify-between gap-3 depth-1">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md flex-shrink-0"
                         style={{ background: 'linear-gradient(135deg,#059669,#0891b2)', boxShadow: '0 8px 16px -5px rgba(5,150,105,0.5)' }}>
                      <FiDollarSign className="text-lg" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 truncate">{bill.patientId?.name || 'Patient'}</p>
                      <p className="text-xs text-gray-400">
                        <span className="font-mono">{bill.invoiceNo}</span> · {new Date(bill.createdAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${statusStyles[bill.paymentStatus] || ''}`}>
                    {bill.paymentStatus.charAt(0).toUpperCase() + bill.paymentStatus.slice(1)}
                  </span>
                </div>

                {bill.items?.length > 0 && (
                  <p className="text-xs text-gray-500 mt-3 line-clamp-1 depth-1">
                    {bill.items.map((i) => i.description).join(', ')}
                  </p>
                )}

                <div className="flex items-end justify-between mt-3 pt-3 border-t border-gray-100 depth-1">
                  <div>
                    <p className="text-2xl font-extrabold text-gray-900 tabular-nums">{formatINR(bill.totalAmount)}</p>
                    {bill.paymentStatus === 'partial' && (
                      <p className="text-xs text-yellow-600">Paid: {formatINR(bill.paidAmount)}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setPrintBill(bill)} className="p-2 bg-blue-50 rounded-lg text-blue-600 hover:bg-blue-100 active:scale-90 transition" aria-label="Print">
                      <FiPrinter className="text-sm" />
                    </button>
                    {bill.paymentStatus !== 'paid' && (
                      <button onClick={() => markPaid(bill)} className="text-xs font-semibold bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg hover:bg-emerald-100 active:scale-95 transition">
                        Mark Paid
                      </button>
                    )}
                  </div>
                </div>
              </TiltCard>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Create Invoice</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
                aria-label="Close"
              >
                <FiX className="text-xl" />
              </button>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient *</label>
                <PatientSearchSelect
                  patients={patients}
                  value={form.patientId}
                  onChange={(id) => setForm({ ...form, patientId: id })}
                  required
                  placeholder="Search by name or Patient ID..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">Items</label>
                  <button type="button" onClick={addItem} className="text-xs text-blue-600 font-medium">
                    + Add Item
                  </button>
                </div>
                {form.items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 mb-2 items-center">
                    <input
                      className="input-field flex-1 py-2" placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateItem(idx, 'description', e.target.value)}
                    />
                    <input
                      className="input-field w-20 py-2" placeholder="Qty" type="number" min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                    />
                    <input
                      className="input-field w-28 py-2" placeholder="Amount" type="number" min={0}
                      value={item.amount}
                      onChange={(e) => updateItem(idx, 'amount', e.target.value)}
                    />
                    {form.items.length > 1 && (
                      <button
                        type="button" onClick={() => removeItem(idx)}
                        className="p-2 text-red-500" aria-label="Remove item"
                      >
                        <FiTrash2 />
                      </button>
                    )}
                  </div>
                ))}
                <div className="text-right text-sm text-gray-500 mt-2">Subtotal: {formatINR(subtotal)}</div>
                <div className="text-right font-bold text-lg text-gray-900">Total: {formatINR(total)}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                  <select
                    className="input-field"
                    value={form.paymentMethod}
                    onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                    <option value="online">Online</option>
                    <option value="insurance">Insurance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount</label>
                  <input
                    type="number" min={0} className="input-field" placeholder="0"
                    value={form.discount}
                    onChange={(e) => setForm({ ...form, discount: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tax</label>
                  <input
                    type="number" min={0} className="input-field" placeholder="0"
                    value={form.tax}
                    onChange={(e) => setForm({ ...form, tax: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paid Amount</label>
                  <input
                    type="number" min={0} className="input-field" placeholder="0"
                    value={form.paidAmount}
                    onChange={(e) => setForm({ ...form, paidAmount: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? 'Creating...' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {printBill && <PrintInvoice invoice={printBill} onClose={() => setPrintBill(null)} />}
    </div>
  );
}
