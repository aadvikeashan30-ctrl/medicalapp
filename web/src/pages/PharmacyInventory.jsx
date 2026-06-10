import React, { useState } from 'react';
import {
  FiPlus, FiSearch, FiEdit2, FiTrash2, FiX, FiPackage, FiAlertTriangle,
  FiClock, FiTrendingUp, FiShoppingCart, FiDollarSign, FiLayers, FiZap
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useApi } from '../hooks/useApi';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import { Hero3D, Stat3D } from '../components/Premium3D';

const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

const FILTERS = [
  { value: '', label: 'All Items' },
  { value: 'low-stock', label: 'Low / Out of Stock' },
  { value: 'near-expiry', label: 'Near Expiry' },
  { value: 'expired', label: 'Expired' }
];

const emptyForm = {
  name: '', genericName: '', strength: '', form: 'tablet', category: '', manufacturer: '',
  unitsPerStrip: 10, reorderLevel: 50, rackLocation: '', barcode: '',
  batchNo: '', expiryDate: '', quantity: '', purchasePrice: '', sellingPrice: '', supplier: ''
};

export default function PharmacyInventory() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [sellItem, setSellItem] = useState(null);
  const [sellQty, setSellQty] = useState('');
  const [sellPatient, setSellPatient] = useState('');

  const qs = new URLSearchParams();
  if (search) qs.set('search', search);
  if (filter) qs.set('filter', filter);

  const { data, loading, refetch } = useApi(`/pharmacy?${qs.toString()}`, { deps: [search, filter] });
  const { data: stats, refetch: refetchStats } = useApi('/pharmacy/stats/summary');
  const { data: revenue, refetch: refetchRevenue } = useApi('/pharmacy/revenue');
  const { data: suggestions, refetch: refetchSuggestions } = useApi('/pharmacy/purchase-suggestions');

  const items = data?.items || [];

  const refreshAll = () => { refetch(); refetchStats(); refetchRevenue(); refetchSuggestions(); };

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (item) => {
    setEditing(item);
    setForm({
      ...emptyForm,
      name: item.name || '', genericName: item.genericName || '', strength: item.strength || '',
      form: item.form || 'tablet', category: item.category || '', manufacturer: item.manufacturer || '',
      unitsPerStrip: item.unitsPerStrip || 10, reorderLevel: item.reorderLevel || 50,
      rackLocation: item.rackLocation || '', barcode: item.barcode || ''
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Medicine name is required');
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/pharmacy/${editing._id}`, form);
        toast.success('Item updated');
      } else {
        await api.post('/pharmacy', form);
        toast.success('Medicine added to inventory');
      }
      setShowModal(false);
      refreshAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this item from inventory?')) return;
    try {
      await api.delete(`/pharmacy/${id}`);
      toast.success('Item removed');
      refreshAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleSell = async (e) => {
    e.preventDefault();
    const qty = Number(sellQty);
    if (!qty || qty <= 0) return toast.error('Enter a valid quantity');
    try {
      const res = await api.post(`/pharmacy/${sellItem._id}/sell`, { quantity: qty, patientName: sellPatient });
      toast.success(`Sold ${qty} units · ${formatINR(res.data.revenue)}`);
      setSellItem(null); setSellQty(''); setSellPatient('');
      refreshAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sale failed');
    }
  };

  const flagBadge = (flags) => {
    if (flags.expired) return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700">Expired</span>;
    if (flags.outOfStock) return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-200 text-gray-700">Out of stock</span>;
    if (flags.nearExpiry) return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">Near expiry</span>;
    if (flags.lowStock) return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-100 text-orange-700">Low stock</span>;
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">In stock</span>;
  };

  return (
    <div className="page-enter space-y-6">
      {/* Hero */}
      <Hero3D
        icon={FiPackage}
        badge="Smart Pharmacy · Live Stock"
        title="Smart Pharmacy"
        subtitle="Real-time stock, multi-batch inventory, expiry & reorder intelligence"
        gradient="radial-gradient(1200px 400px at 100% -20%, rgba(16,185,129,0.5), transparent 60%), linear-gradient(125deg,#065f46 0%,#0d8080 45%,#0891b2 100%)"
      >
        <button onClick={openAdd} className="inline-flex items-center gap-2 bg-white text-emerald-700 px-4 py-2 rounded-[14px] text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
          <FiPlus /> Add Medicine
        </button>
      </Hero3D>

      {/* Stat cards */}
      <div className="scene-3d grid grid-cols-2 lg:grid-cols-6 gap-3">
        <Stat3D icon={FiLayers}        accent="accent-cyan"   label="Total Items"  value={stats?.totalItems ?? 0} delay="0ms" />
        <Stat3D icon={FiDollarSign}    accent="accent-green"  label="Stock Value"  value={stats?.stockValue ?? 0} prefix="₹" delay="60ms" />
        <Stat3D icon={FiAlertTriangle} accent="accent-purple" label="Out of Stock" value={stats?.outOfStock ?? 0} delay="120ms" />
        <Stat3D icon={FiShoppingCart}  accent="accent-orange" label="Low Stock"    value={stats?.lowStock ?? 0} delay="180ms" />
        <Stat3D icon={FiClock}         accent="accent-orange" label="Near Expiry"  value={stats?.nearExpiry ?? 0} delay="240ms" />
        <Stat3D icon={FiX}             accent="accent-teal"   label="Expired"      value={stats?.expired ?? 0} delay="300ms" />
      </div>

      {/* Revenue + purchase suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FiTrendingUp className="text-emerald-600" /> Pharmacy Revenue
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
              <p className="text-lg font-bold text-emerald-700">{formatINR(revenue?.dailyRevenue)}</p>
              <p className="text-[11px] text-gray-500">Today</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
              <p className="text-lg font-bold text-blue-700">{formatINR(revenue?.monthRevenue)}</p>
              <p className="text-[11px] text-gray-500">This Month</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-50 border border-purple-100">
              <p className="text-lg font-bold text-purple-700">{formatINR(revenue?.monthProfit)}</p>
              <p className="text-[11px] text-gray-500">Profit (mo)</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
              <p className="text-lg font-bold text-amber-700">{revenue?.margin ?? 0}%</p>
              <p className="text-[11px] text-gray-500">Margin</p>
            </div>
          </div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Best Sellers</p>
          {(revenue?.bestSellers || []).length === 0 ? (
            <p className="text-sm text-gray-400">No sales recorded yet.</p>
          ) : (
            <div className="space-y-1.5">
              {revenue.bestSellers.map((b, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{i + 1}. {b.name} <span className="text-gray-400">· {b.quantity} units</span></span>
                  <span className="font-semibold text-gray-900">{formatINR(b.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <FiZap className="text-orange-500" /> Smart Purchase Suggestions
          </h3>
          {(suggestions?.suggestions || []).length === 0 ? (
            <p className="text-sm text-gray-400">All items are well-stocked. 👍</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto custom-scroll">
              {suggestions.suggestions.map((s) => (
                <div key={s._id} className="p-2.5 rounded-lg bg-orange-50 border border-orange-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-800">{s.name} {s.strength}</span>
                    <span className="text-sm font-bold text-orange-600">+{s.suggestedPurchase} units</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Stock {s.currentStock} / min {s.minimumRequired} · est. {formatINR(s.estimatedCost)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Search & filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, generic or barcode..." className="input-field !pl-10" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input-field sm:w-56">
          {FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>

      {/* Inventory table */}
      {loading ? (
        <Loader label="Loading inventory..." />
      ) : items.length === 0 ? (
        <EmptyState icon={FiPackage} title="No medicines found" message="Add medicines to start tracking stock, batches and expiry."
          action={<button onClick={openAdd} className="btn-primary text-sm">Add First Medicine</button>} />
      ) : (
        <div className="card !p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-100">
                <th className="px-4 py-3">Medicine</th>
                <th className="px-4 py-3">Qty / Strips</th>
                <th className="px-4 py-3">Batch</th>
                <th className="px-4 py-3">Expiry</th>
                <th className="px-4 py-3">Purchase</th>
                <th className="px-4 py-3">Selling</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id} className="border-b border-gray-50 hover:bg-gray-50/60">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900">{item.name} {item.strength}</div>
                    <div className="text-[11px] text-gray-400">{item.form}{item.manufacturer ? ` · ${item.manufacturer}` : ''}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-gray-900">{item.totalQuantity}</span> units
                    <div className="text-[11px] text-gray-400">{item.totalStrips} strips{item.looseUnits ? ` + ${item.looseUnits}` : ''}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{item.batchNo || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{fmtDate(item.nearestExpiry)}</td>
                  <td className="px-4 py-3 text-gray-600">{formatINR(item.purchasePrice)}</td>
                  <td className="px-4 py-3 text-gray-900 font-medium">{formatINR(item.sellingPrice)}</td>
                  <td className="px-4 py-3">{flagBadge(item.flags)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setSellItem(item)} disabled={item.flags.outOfStock}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-40">Sell</button>
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"><FiEdit2 className="text-sm" /></button>
                      <button onClick={() => handleDelete(item._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><FiTrash2 className="text-sm" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{editing ? 'Edit Medicine' : 'Add Medicine'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100"><FiX className="text-gray-500" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Medicine Name *"><input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
                <Field label="Generic Name"><input className="input-field" value={form.genericName} onChange={(e) => setForm({ ...form, genericName: e.target.value })} /></Field>
                <Field label="Strength"><input className="input-field" placeholder="500mg" value={form.strength} onChange={(e) => setForm({ ...form, strength: e.target.value })} /></Field>
                <Field label="Form">
                  <select className="input-field" value={form.form} onChange={(e) => setForm({ ...form, form: e.target.value })}>
                    {['tablet', 'capsule', 'syrup', 'injection', 'ointment', 'drops', 'inhaler', 'other'].map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </Field>
                <Field label="Category"><input className="input-field" placeholder="Antibiotic" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
                <Field label="Manufacturer"><input className="input-field" value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} /></Field>
                <Field label="Units per Strip"><input type="number" min="1" className="input-field" value={form.unitsPerStrip} onChange={(e) => setForm({ ...form, unitsPerStrip: e.target.value })} /></Field>
                <Field label="Reorder Level (min units)"><input type="number" min="0" className="input-field" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })} /></Field>
                <Field label="Rack Location"><input className="input-field" value={form.rackLocation} onChange={(e) => setForm({ ...form, rackLocation: e.target.value })} /></Field>
                <Field label="Barcode / QR"><input className="input-field" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} /></Field>
              </div>

              {!editing && (
                <>
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Opening Batch (optional)</p>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Batch Number"><input className="input-field" value={form.batchNo} onChange={(e) => setForm({ ...form, batchNo: e.target.value })} /></Field>
                      <Field label="Expiry Date"><input type="date" className="input-field" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} /></Field>
                      <Field label="Quantity (units)"><input type="number" min="0" className="input-field" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></Field>
                      <Field label="Supplier"><input className="input-field" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} /></Field>
                      <Field label="Purchase Price (₹/unit)"><input type="number" min="0" step="0.01" className="input-field" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} /></Field>
                      <Field label="Selling Price (₹/unit)"><input type="number" min="0" step="0.01" className="input-field" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} /></Field>
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editing ? 'Update' : 'Add Medicine'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sell modal */}
      {sellItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Dispense / Sell</h2>
              <button onClick={() => setSellItem(null)} className="p-2 rounded-lg hover:bg-gray-100"><FiX className="text-gray-500" /></button>
            </div>
            <form onSubmit={handleSell} className="p-6 space-y-4">
              <div className="p-3 rounded-xl bg-gray-50">
                <p className="font-semibold text-gray-900">{sellItem.name} {sellItem.strength}</p>
                <p className="text-xs text-gray-500">In stock: {sellItem.totalQuantity} units · FEFO auto-deduct from earliest expiry</p>
              </div>
              <Field label="Quantity (units) *"><input type="number" min="1" max={sellItem.totalQuantity} className="input-field" value={sellQty} onChange={(e) => setSellQty(e.target.value)} required /></Field>
              <Field label="Patient (optional)"><input className="input-field" value={sellPatient} onChange={(e) => setSellPatient(e.target.value)} /></Field>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setSellItem(null)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Confirm Sale</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
      {children}
    </div>
  );
}
