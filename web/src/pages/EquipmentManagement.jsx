import React, { useState } from 'react';
import {
  FiPlus, FiSearch, FiEdit2, FiTrash2, FiX, FiTool, FiAlertTriangle,
  FiCheckCircle, FiCalendar, FiShield, FiActivity, FiClipboard
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useApi } from '../hooks/useApi';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';

const formatINR = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const toInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

const STATUS = {
  operational: { label: 'Operational', cls: 'bg-emerald-100 text-emerald-700' },
  maintenance: { label: 'In Maintenance', cls: 'bg-amber-100 text-amber-700' },
  'out-of-service': { label: 'Out of Service', cls: 'bg-red-100 text-red-700' },
  retired: { label: 'Retired', cls: 'bg-gray-200 text-gray-700' }
};

const emptyForm = {
  name: '', category: '', serialNo: '', model: '', manufacturer: '', location: '',
  status: 'operational', purchaseDate: '', purchasePrice: '', serviceIntervalDays: 180,
  lastServiceDate: '', notes: '',
  amcProvider: '', amcContractNo: '', amcStartDate: '', amcEndDate: '', amcCost: ''
};

export default function EquipmentManagement() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [logItem, setLogItem] = useState(null);
  const [logForm, setLogForm] = useState({ type: 'preventive', description: '', cost: '', technician: '', date: toInput(new Date()) });

  const qs = new URLSearchParams();
  if (search) qs.set('search', search);
  if (statusFilter) qs.set('status', statusFilter);

  const { data, loading, refetch } = useApi(`/equipment?${qs.toString()}`, { deps: [search, statusFilter] });
  const { data: stats, refetch: refetchStats } = useApi('/equipment/stats/summary');
  const { data: alerts, refetch: refetchAlerts } = useApi('/equipment/alerts');

  const equipment = data?.equipment || [];
  const refreshAll = () => { refetch(); refetchStats(); refetchAlerts(); };

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (eq) => {
    setEditing(eq);
    setForm({
      name: eq.name || '', category: eq.category || '', serialNo: eq.serialNo || '', model: eq.model || '',
      manufacturer: eq.manufacturer || '', location: eq.location || '', status: eq.status || 'operational',
      purchaseDate: toInput(eq.purchaseDate), purchasePrice: eq.purchasePrice || '',
      serviceIntervalDays: eq.serviceIntervalDays || 180, lastServiceDate: toInput(eq.lastServiceDate),
      notes: eq.notes || '',
      amcProvider: eq.amc?.provider || '', amcContractNo: eq.amc?.contractNo || '',
      amcStartDate: toInput(eq.amc?.startDate), amcEndDate: toInput(eq.amc?.endDate), amcCost: eq.amc?.cost || ''
    });
    setShowModal(true);
  };

  const buildPayload = () => ({
    name: form.name, category: form.category, serialNo: form.serialNo, model: form.model,
    manufacturer: form.manufacturer, location: form.location, status: form.status,
    purchaseDate: form.purchaseDate || undefined, purchasePrice: Number(form.purchasePrice) || 0,
    serviceIntervalDays: Number(form.serviceIntervalDays) || 180,
    lastServiceDate: form.lastServiceDate || undefined, notes: form.notes,
    amc: {
      provider: form.amcProvider, contractNo: form.amcContractNo,
      startDate: form.amcStartDate || undefined, endDate: form.amcEndDate || undefined,
      cost: Number(form.amcCost) || 0
    }
  });

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Equipment name is required');
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/equipment/${editing._id}`, buildPayload());
        toast.success('Equipment updated');
      } else {
        await api.post('/equipment', buildPayload());
        toast.success('Equipment registered');
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
    if (!confirm('Remove this equipment?')) return;
    try {
      await api.delete(`/equipment/${id}`);
      toast.success('Equipment removed');
      refreshAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleLog = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/equipment/${logItem._id}/maintenance`, { ...logForm, cost: Number(logForm.cost) || 0 });
      toast.success('Maintenance logged · next service scheduled');
      setLogItem(null);
      setLogForm({ type: 'preventive', description: '', cost: '', technician: '', date: toInput(new Date()) });
      refreshAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const alertCount = (alerts?.serviceDue?.length || 0) + (alerts?.amcExpiring?.length || 0) + (alerts?.amcExpired?.length || 0);

  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-gray-800 flex items-center justify-center">
              <FiTool className="text-white text-lg" />
            </div>
            Equipment Management
          </h1>
          <p className="text-sm text-gray-500 mt-1 ml-[52px]">Asset registry, maintenance, service scheduling & AMC tracking</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2"><FiPlus /> Add Equipment</button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Assets', value: stats?.total ?? 0, icon: FiClipboard, cls: 'from-blue-500 to-indigo-600' },
          { label: 'Operational', value: stats?.operational ?? 0, icon: FiCheckCircle, cls: 'from-emerald-500 to-teal-600' },
          { label: 'In Maintenance', value: stats?.maintenance ?? 0, icon: FiActivity, cls: 'from-amber-500 to-yellow-600' },
          { label: 'Service Due', value: stats?.serviceDue ?? 0, icon: FiCalendar, cls: 'from-orange-500 to-amber-600' },
          { label: 'AMC Expiring', value: stats?.amcExpiring ?? 0, icon: FiShield, cls: 'from-red-500 to-rose-600' },
          { label: 'Asset Value', value: formatINR(stats?.assetValue), icon: FiTool, cls: 'from-purple-500 to-pink-600' }
        ].map((s) => (
          <div key={s.label} className="card !p-4">
            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${s.cls} flex items-center justify-center mb-2`}>
              <s.icon className="text-white text-sm" />
            </div>
            <p className="text-xl font-bold text-gray-900">{s.value}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Alerts banner */}
      {alertCount > 0 && (
        <div className="card border-l-4 border-amber-400 bg-amber-50/50">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><FiAlertTriangle className="text-amber-500" /> Attention Required</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <AlertList title="Service Due (30d)" items={alerts.serviceDue} render={(e) => `${e.name} · ${fmtDate(e.nextServiceDate)}`} />
            <AlertList title="AMC Expiring (30d)" items={alerts.amcExpiring} render={(e) => `${e.name} · ${fmtDate(e.amc?.endDate)}`} />
            <AlertList title="AMC Expired" items={alerts.amcExpired} render={(e) => `${e.name} · ${fmtDate(e.amc?.endDate)}`} />
          </div>
        </div>
      )}

      {/* Search & filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, serial, maker or location..." className="input-field !pl-10" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field sm:w-52">
          <option value="">All Statuses</option>
          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Equipment list */}
      {loading ? (
        <Loader label="Loading equipment..." />
      ) : equipment.length === 0 ? (
        <EmptyState icon={FiTool} title="No equipment yet" message="Register clinic equipment to track maintenance, service & AMC."
          action={<button onClick={openAdd} className="btn-primary text-sm">Add First Equipment</button>} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {equipment.map((eq) => {
            const st = STATUS[eq.status] || STATUS.operational;
            return (
              <div key={eq._id} className="card group">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-900">{eq.name}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${st.cls}`}>{st.label}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {[eq.category, eq.manufacturer, eq.model].filter(Boolean).join(' · ') || 'No details'}
                      {eq.serialNo ? ` · SN ${eq.serialNo}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(eq)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"><FiEdit2 className="text-sm" /></button>
                    <button onClick={() => handleDelete(eq._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><FiTrash2 className="text-sm" /></button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 text-xs">
                  <Info label="Location" value={eq.location || '—'} />
                  <Info label="Asset Value" value={formatINR(eq.purchasePrice)} />
                  <Info label="Last Service" value={fmtDate(eq.lastServiceDate)} />
                  <Info label="Next Service" value={fmtDate(eq.nextServiceDate)} />
                  <Info label="AMC Provider" value={eq.amc?.provider || '—'} />
                  <Info label="AMC Expires" value={fmtDate(eq.amc?.endDate)} />
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <span className="text-[11px] text-gray-400">{(eq.maintenanceLogs || []).length} maintenance log(s)</span>
                  <button onClick={() => setLogItem(eq)} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-1">
                    <FiTool className="text-xs" /> Log Maintenance
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">{editing ? 'Edit Equipment' : 'Register Equipment'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100"><FiX className="text-gray-500" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Name *"><input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
                <Field label="Category"><input className="input-field" placeholder="Diagnostic / Surgical" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
                <Field label="Serial No"><input className="input-field" value={form.serialNo} onChange={(e) => setForm({ ...form, serialNo: e.target.value })} /></Field>
                <Field label="Model"><input className="input-field" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></Field>
                <Field label="Manufacturer"><input className="input-field" value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} /></Field>
                <Field label="Location"><input className="input-field" placeholder="Room / Branch" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field>
                <Field label="Status">
                  <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </Field>
                <Field label="Purchase Date"><input type="date" className="input-field" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} /></Field>
                <Field label="Purchase Price (₹)"><input type="number" min="0" className="input-field" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} /></Field>
                <Field label="Service Interval (days)"><input type="number" min="1" className="input-field" value={form.serviceIntervalDays} onChange={(e) => setForm({ ...form, serviceIntervalDays: e.target.value })} /></Field>
                <Field label="Last Service Date"><input type="date" className="input-field" value={form.lastServiceDate} onChange={(e) => setForm({ ...form, lastServiceDate: e.target.value })} /></Field>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">AMC (Annual Maintenance Contract)</p>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="AMC Provider"><input className="input-field" value={form.amcProvider} onChange={(e) => setForm({ ...form, amcProvider: e.target.value })} /></Field>
                  <Field label="Contract No"><input className="input-field" value={form.amcContractNo} onChange={(e) => setForm({ ...form, amcContractNo: e.target.value })} /></Field>
                  <Field label="Start Date"><input type="date" className="input-field" value={form.amcStartDate} onChange={(e) => setForm({ ...form, amcStartDate: e.target.value })} /></Field>
                  <Field label="End Date"><input type="date" className="input-field" value={form.amcEndDate} onChange={(e) => setForm({ ...form, amcEndDate: e.target.value })} /></Field>
                  <Field label="AMC Cost (₹)"><input type="number" min="0" className="input-field" value={form.amcCost} onChange={(e) => setForm({ ...form, amcCost: e.target.value })} /></Field>
                </div>
              </div>

              <Field label="Notes"><textarea rows={2} className="input-field" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editing ? 'Update' : 'Register'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Maintenance log modal */}
      {logItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Log Maintenance</h2>
              <button onClick={() => setLogItem(null)} className="p-2 rounded-lg hover:bg-gray-100"><FiX className="text-gray-500" /></button>
            </div>
            <form onSubmit={handleLog} className="p-6 space-y-4">
              <div className="p-3 rounded-xl bg-gray-50">
                <p className="font-semibold text-gray-900">{logItem.name}</p>
                <p className="text-xs text-gray-500">Next service auto-scheduled {logItem.serviceIntervalDays || 180} days from the service date.</p>
              </div>
              <Field label="Type">
                <select className="input-field" value={logForm.type} onChange={(e) => setLogForm({ ...logForm, type: e.target.value })}>
                  {['preventive', 'repair', 'calibration', 'inspection'].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Service Date"><input type="date" className="input-field" value={logForm.date} onChange={(e) => setLogForm({ ...logForm, date: e.target.value })} /></Field>
              <Field label="Description"><input className="input-field" value={logForm.description} onChange={(e) => setLogForm({ ...logForm, description: e.target.value })} /></Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Technician"><input className="input-field" value={logForm.technician} onChange={(e) => setLogForm({ ...logForm, technician: e.target.value })} /></Field>
                <Field label="Cost (₹)"><input type="number" min="0" className="input-field" value={logForm.cost} onChange={(e) => setLogForm({ ...logForm, cost: e.target.value })} /></Field>
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setLogItem(null)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Log</button>
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

function Info({ label, value }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-gray-400">{label}</p>
      <p className="text-gray-800 font-medium">{value}</p>
    </div>
  );
}

function AlertList({ title, items, render }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{title} ({items?.length || 0})</p>
      {(items || []).length === 0 ? (
        <p className="text-xs text-gray-400">None</p>
      ) : (
        <ul className="space-y-1">
          {items.slice(0, 4).map((e) => <li key={e._id} className="text-xs text-gray-700">{render(e)}</li>)}
        </ul>
      )}
    </div>
  );
}
