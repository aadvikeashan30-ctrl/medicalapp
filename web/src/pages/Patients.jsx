import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  FiSearch, FiPlus, FiPhone, FiUser, FiX, FiEdit2, FiTrash2, FiUsers,
  FiDownload, FiExternalLink, FiHash, FiActivity, FiDollarSign, FiUserPlus,
  FiAlertCircle
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useApi } from '../hooks/useApi';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import AIPatientRisk from '../components/AIPatientRisk';
import QuickWhatsApp from '../components/QuickWhatsApp';
import AnimatedCounter from '../components/AnimatedCounter';
import { Hero3D, useTilt } from '../components/Premium3D';

const emptyPatient = {
  name: '', phone: '', email: '', age: '', gender: 'male',
  bloodGroup: '', address: '', city: '', allergies: ''
};

const GENDER_STYLE = {
  male:   { av: 'linear-gradient(135deg,#3b82f6,#4f46e5)', soft: 'rgba(59,130,246,0.16)', shadow: 'rgba(59,130,246,0.45)' },
  female: { av: 'linear-gradient(135deg,#ec4899,#f43f5e)', soft: 'rgba(236,72,153,0.16)', shadow: 'rgba(236,72,153,0.45)' },
  other:  { av: 'linear-gradient(135deg,#a855f7,#8b5cf6)', soft: 'rgba(168,85,247,0.16)', shadow: 'rgba(168,85,247,0.45)' },
};

/* ─── 3D tilt patient card ──────────────────────────────────────── */
function PatientCard({ p, idx, onEdit, onDelete, onRisk, riskOpen, onWhatsapp }) {
  const tilt = useTilt(7);
  const gs = GENDER_STYLE[p.gender] || GENDER_STYLE.other;
  const hasAllergy = (p.allergies || []).length > 0;
  return (
    <div
      {...tilt}
      className="module-3d tilt-3d p-5 animate-pop"
      style={{ '--m-soft': gs.soft, '--m-shadow': gs.shadow, animationDelay: `${Math.min(idx * 45, 360)}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 depth-1">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg text-white shadow-md"
               style={{ background: gs.av, boxShadow: `0 8px 18px -5px ${gs.shadow}` }}>
            {p.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <Link to={`/patients/${p._id}`} className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
              {p.name}
            </Link>
            <p className="text-xs text-gray-400 font-mono">{p.patientId}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => onEdit(p)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600" aria-label="Edit patient">
            <FiEdit2 className="text-sm" />
          </button>
          <button onClick={() => onDelete(p._id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-600" aria-label="Delete patient">
            <FiTrash2 className="text-sm" />
          </button>
        </div>
      </div>

      {/* Info chips */}
      <div className="flex flex-wrap gap-1.5 mb-4 depth-1">
        <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg flex items-center gap-1">
          <FiUser className="text-gray-400" size={11} /> {p.age ? `${p.age}y` : '—'} · {p.gender === 'male' ? 'M' : p.gender === 'female' ? 'F' : 'O'}
        </span>
        {p.bloodGroup && (
          <span className="text-xs font-bold bg-red-50 text-red-600 px-2.5 py-1 rounded-lg">{p.bloodGroup}</span>
        )}
        <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg flex items-center gap-1">
          <FiPhone className="text-gray-400" size={11} /> {p.phone}
        </span>
        {hasAllergy && (
          <span className="text-xs font-semibold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg flex items-center gap-1" title={(p.allergies || []).join(', ')}>
            <FiAlertCircle size={11} /> Allergy
          </span>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-2 mb-4 depth-1">
        <div className="rounded-xl bg-gray-50 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-gray-400">Visits</p>
          <p className="text-base font-bold text-gray-800 tabular-nums">{p.totalVisits || 0}</p>
        </div>
        <div className="rounded-xl px-3 py-2" style={{ background: 'linear-gradient(135deg,#ecfdf5,#f0fdfa)' }}>
          <p className="text-[10px] uppercase tracking-wide text-gray-400">Billed</p>
          <p className="text-base font-bold text-emerald-600 tabular-nums">₹{Number(p.totalBilled || 0).toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1.5 depth-1">
        <Link to={`/patients/${p._id}`}
          className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-blue-500 text-white hover:bg-blue-600 shadow-sm transition-all hover:shadow-md active:scale-95">
          <FiExternalLink className="text-xs" /> View
        </Link>
        <button onClick={() => onRisk(riskOpen ? null : p)}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl shadow-sm transition-all hover:shadow-md active:scale-95 ${riskOpen ? 'bg-violet-600 text-white' : 'bg-violet-500 text-white hover:bg-violet-600'}`}>
          <FiActivity className="text-xs" /> AI Risk
        </button>
        <button onClick={() => onWhatsapp(p)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl bg-green-500 text-white hover:bg-green-600 shadow-sm transition-all hover:shadow-md active:scale-95">
          <FaWhatsapp className="text-xs" /> Message
        </button>
      </div>

      {riskOpen && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <AIPatientRisk patient={p} />
        </div>
      )}
    </div>
  );
}

/* ─── 3D KPI tile ───────────────────────────────────────────────── */
function KpiTile({ icon: Icon, accent, label, value, money, delay }) {
  const tilt = useTilt(10);
  return (
    <div {...tilt} className={`stat-3d tilt-3d ${accent} animate-pop`} style={{ animationDelay: delay }}>
      <div className="flex items-start justify-between mb-3 depth-2">
        <div className="stat-3d-icon"><Icon size={22} /></div>
      </div>
      <p className="text-[26px] font-extrabold text-gray-900 tabular-nums leading-none depth-1">
        {money ? `₹${Number(value || 0).toLocaleString('en-IN')}` : <AnimatedCounter end={Number(value || 0)} />}
      </p>
      <p className="text-sm text-gray-500 mt-1.5 depth-1">{label}</p>
    </div>
  );
}

export default function Patients() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [debounced, setDebounced] = useState(search);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyPatient);
  const [submitting, setSubmitting] = useState(false);
  const [riskPatient, setRiskPatient] = useState(null);
  const [whatsappPatient, setWhatsappPatient] = useState(null);

  // Debounce search input -> URL & query
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setSearchParams(search ? { search } : {}, { replace: true });
    }, 300);
    return () => clearTimeout(t);
  }, [search, setSearchParams]);

  const url = useMemo(() => {
    const params = new URLSearchParams();
    if (debounced) params.set('search', debounced);
    params.set('limit', '50');
    return `/patients?${params.toString()}`;
  }, [debounced]);

  const { data, loading, error, refetch } = useApi(url);
  const patients = data?.patients || [];

  // Client-side filtering (works in demo mode + as a safety net when the
  // API doesn't honour the search query). Matches name, phone & patient ID.
  const visiblePatients = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) =>
      [p.name, p.phone, p.email, p.patientId, p.city]
        .filter(Boolean)
        .some((f) => String(f).toLowerCase().includes(q))
    );
  }, [patients, debounced]);

  // Live KPIs from the full loaded list
  const kpis = useMemo(() => {
    const now = new Date();
    const som = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      total: data?.total ?? patients.length,
      newThisMonth: patients.filter(p => p.createdAt && new Date(p.createdAt) >= som).length,
      visits: patients.reduce((s, p) => s + (p.totalVisits || 0), 0),
      billed: patients.reduce((s, p) => s + (p.totalBilled || 0), 0),
    };
  }, [data, patients]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyPatient);
    setShowAddModal(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name || '',
      phone: p.phone || '',
      email: p.email || '',
      age: p.age || '',
      gender: p.gender || 'male',
      bloodGroup: p.bloodGroup || '',
      address: p.address || '',
      city: p.city || '',
      allergies: (p.allergies || []).join(', ')
    });
    setShowAddModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        age: form.age ? Number(form.age) : undefined,
        allergies: form.allergies
          ? form.allergies.split(',').map((s) => s.trim()).filter(Boolean)
          : []
      };
      if (editing) {
        await api.put(`/patients/${editing._id}`, payload);
        toast.success('Patient updated');
      } else {
        await api.post('/patients', payload);
        toast.success('Patient added');
      }
      setShowAddModal(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this patient? They will be hidden from your list.')) return;
    try {
      await api.delete(`/patients/${id}`);
      toast.success('Patient deleted');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const sendWhatsapp = async (p) => {
    try {
      await api.post('/whatsapp/send', {
        phone: p.phone,
        message: `Hello ${p.name}, this is a message from your clinic.`
      });
      toast.success('WhatsApp message queued');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send');
    }
  };

  const exportPatientsCSV = (list) => {
    const headers = ['Patient ID', 'Name', 'Phone', 'Email', 'Age', 'Gender', 'Blood Group', 'City', 'Address', 'Allergies', 'Visits', 'Total Billed', 'Registered'];
    const rows = list.map(p => [
      p.patientId || '', p.name || '', p.phone || '', p.email || '',
      p.age || '', p.gender || '', p.bloodGroup || '', p.city || '',
      p.address || '', (p.allergies || []).join('; '), p.totalVisits || 0,
      p.totalBilled || 0, p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN') : ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patients-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Patient data exported to CSV');
  };

  return (
    <div className="page-enter space-y-6">
      {/* ── 3D Hero ── */}
      <Hero3D
        icon={FiUsers}
        badge="Patient Registry · Live"
        title="Patients"
        subtitle={data ? `${data.total} patients registered in your practice` : 'Loading patient registry…'}
        gradient="radial-gradient(1200px 420px at 100% -20%, rgba(59,130,246,0.5), transparent 60%), linear-gradient(125deg,#1e3a8a 0%,#4338ca 50%,#0e7490 100%)"
      >
        {patients.length > 0 && (
          <button onClick={() => exportPatientsCSV(patients)}
            className="inline-flex items-center gap-2 glass-chip text-white px-4 py-2 text-sm font-semibold hover:bg-white/20 transition-colors">
            <FiDownload /> Export
          </button>
        )}
        <button onClick={openAdd}
          className="inline-flex items-center gap-2 bg-white text-blue-700 px-4 py-2 rounded-[14px] text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
          <FiPlus /> Add Patient
        </button>
      </Hero3D>

      {/* ── KPI tiles ── */}
      <div className="scene-3d grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: FiUsers,     accent: 'accent-cyan',   label: 'Total Patients', value: kpis.total },
          { icon: FiUserPlus,  accent: 'accent-green',  label: 'New This Month', value: kpis.newThisMonth },
          { icon: FiActivity,  accent: 'accent-purple', label: 'Total Visits',   value: kpis.visits },
          { icon: FiDollarSign, accent: 'accent-orange', label: 'Total Billed',  value: kpis.billed, money: true },
        ].map((k, i) => (
          <KpiTile key={k.label} {...k} delay={`${i * 70}ms`} />
        ))}
      </div>

      {/* Search with animated focus */}
      <div className="relative max-w-lg animate-fade-up stagger-3">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, phone, or patient ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-11 !py-3"
          aria-label="Search patients"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <FiX className="text-sm" />
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 text-red-700 px-4 py-3 text-sm">{error}</div>
      )}

      {loading ? (
        <Loader label="Loading patients..." />
      ) : visiblePatients.length === 0 ? (
        <EmptyState
          icon={FiUsers}
          title={debounced ? 'No matching patients' : 'No patients yet'}
          message={
            debounced
              ? `No patients match "${debounced}". Try a different name, phone, or ID.`
              : 'Click "Add New Patient" to register your first patient.'
          }
          action={debounced
            ? <button onClick={() => setSearch('')} className="btn-secondary text-sm">Clear search</button>
            : <button onClick={openAdd} className="btn-primary text-sm">Add Patient</button>}
        />
      ) : (
        <div className="scene-3d grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visiblePatients.map((p, idx) => (
            <PatientCard
              key={p._id}
              p={p}
              idx={idx}
              onEdit={openEdit}
              onDelete={handleDelete}
              onRisk={setRiskPatient}
              riskOpen={riskPatient?._id === p._id}
              onWhatsapp={setWhatsappPatient}
            />
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editing ? 'Edit Patient' : 'Add New Patient'}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
                aria-label="Close"
              >
                <FiX className="text-xl" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Patient ID — show existing ID when editing, preview notice when adding */}
              {editing ? (
                <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <FiHash className="text-white text-sm" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Patient ID</p>
                    <p className="font-mono font-bold text-lg text-blue-800 leading-tight">{editing.patientId || 'Not assigned'}</p>
                  </div>
                  <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg font-medium">Permanent · Cannot change</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center flex-shrink-0">
                    <FiHash className="text-white text-sm" />
                  </div>
                  <div>
                    <p className="text-xs text-indigo-600 font-semibold">Patient ID</p>
                    <p className="text-sm text-indigo-700">Will be auto-assigned on save <span className="font-mono font-bold">(e.g. PAT-0001)</span></p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text" className="input-field" placeholder="Patient name" required
                    value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel" className="input-field" placeholder="9876543210" required
                    value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input
                    type="number" min={0} max={150} className="input-field" placeholder="25"
                    value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    className="input-field"
                    value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                  <input
                    type="text" className="input-field" placeholder="B+"
                    value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email" className="input-field" placeholder="patient@email.com"
                    value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text" className="input-field" placeholder="Mumbai"
                    value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text" className="input-field" placeholder="Full address"
                  value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Allergies (comma-separated)</label>
                <input
                  type="text" className="input-field" placeholder="Penicillin, Aspirin"
                  value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? 'Saving...' : editing ? 'Update Patient' : 'Add Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {whatsappPatient && (
        <QuickWhatsApp patient={whatsappPatient} onClose={() => setWhatsappPatient(null)} />
      )}
    </div>
  );
}
