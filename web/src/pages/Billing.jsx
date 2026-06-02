import React, { useMemo, useState } from 'react';
import { FiPlus, FiX, FiPrinter, FiTrash2, FiDollarSign, FiDownload } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useApi } from '../hooks/useApi';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import PrintInvoice from '../components/PrintInvoice';

const statusStyles = {
  paid: 'bg-emerald-100 text-emerald-700',
  partial: 'bg-yellow-100 text-yellow-700',
  pending: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-700'
};

const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center glow-emerald">
              <FiDollarSign className="text-white text-lg" />
            </div>
            Billing
          </h1>
          <p className="text-gray-500 mt-1 ml-[52px]">Manage invoices and payments</p>
        </div>
        <div className="flex gap-2">
          {bills.length > 0 && (
            <button onClick={() => exportBillingCSV(bills)} className="btn-secondary flex items-center gap-2 text-sm">
              <FiDownload /> Export CSV
            </button>
          )}
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
            <FiPlus /> Create Invoice
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-up stagger-2">
        <div className="relative overflow-hidden rounded-2xl p-5 text-white border-gradient-animated" style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}>
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
          <p className="text-emerald-100 text-sm font-medium">Today's Collection</p>
          <p className="text-3xl font-bold mt-1 tabular-nums">{formatINR(revenue?.today)}</p>
        </div>
        <div className="relative overflow-hidden rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)' }}>
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
          <p className="text-indigo-100 text-sm font-medium">This Month</p>
          <p className="text-3xl font-bold mt-1 tabular-nums">{formatINR(revenue?.month)}</p>
        </div>
        <div className="relative overflow-hidden rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
          <p className="text-purple-100 text-sm font-medium">Lifetime Revenue</p>
          <p className="text-3xl font-bold mt-1 tabular-nums">{formatINR(revenue?.total)}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 text-red-700 px-4 py-3 text-sm">{error}</div>
      )}

      <div className="card">
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Invoice</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Patient</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Items</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <tr key={bill._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-gray-900">{bill.invoiceNo}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(bill.createdAt).toLocaleDateString('en-IN')}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">{bill.patientId?.name}</p>
                      <p className="text-xs text-gray-500">{bill.patientId?.patientId}</p>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {bill.items?.map((i) => i.description).join(', ')}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-gray-900">{formatINR(bill.totalAmount)}</p>
                      {bill.paymentStatus === 'partial' && (
                        <p className="text-xs text-yellow-600">Paid: {formatINR(bill.paidAmount)}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${statusStyles[bill.paymentStatus] || ''}`}
                      >
                        {bill.paymentStatus.charAt(0).toUpperCase() + bill.paymentStatus.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPrintBill(bill)}
                          className="p-2 bg-blue-50 rounded-lg text-blue-600 hover:bg-blue-100"
                          aria-label="Print"
                        >
                          <FiPrinter className="text-sm" />
                        </button>
                        {bill.paymentStatus !== 'paid' && (
                          <button
                            onClick={() => markPaid(bill)}
                            className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-100"
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
                <select
                  className="input-field" required
                  value={form.patientId}
                  onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                >
                  <option value="">Select patient...</option>
                  {patients.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.patientId})
                    </option>
                  ))}
                </select>
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
