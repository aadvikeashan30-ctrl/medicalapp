import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  FiSearch, FiPlus, FiPhone, FiUser, FiX, FiEdit2, FiTrash2, FiUsers,
  FiDownload, FiExternalLink
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useApi } from '../hooks/useApi';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import AIPatientRisk from '../components/AIPatientRisk';
import QuickWhatsApp from '../components/QuickWhatsApp';

const emptyPatient = {
  name: '', phone: '', email: '', age: '', gender: 'male',
  bloodGroup: '', address: '', city: '', allergies: ''
};

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center glow-indigo">
              <FiUsers className="text-white text-lg" />
            </div>
            Patients
          </h1>
          <p className="text-gray-500 mt-1 ml-[52px]">
            {data ? (
              <span className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{data.total}</span> total patients registered
              </span>
            ) : 'Loading...'}
          </p>
        </div>
        <div className="flex gap-2 animate-fade-up stagger-2">
          {patients.length > 0 && (
            <button onClick={() => exportPatientsCSV(patients)} className="btn-secondary flex items-center gap-2 text-sm !py-2">
              <FiDownload /> Export
            </button>
          )}
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <FiPlus /> Add Patient
          </button>
        </div>
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
      ) : patients.length === 0 ? (
        <EmptyState
          icon={FiUsers}
          title={debounced ? 'No matching patients' : 'No patients yet'}
          message={
            debounced
              ? 'Try a different search term.'
              : 'Click "Add New Patient" to register your first patient.'
          }
          action={<button onClick={openAdd} className="btn-primary text-sm">Add Patient</button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {patients.map((p, idx) => (
            <div key={p._id} className="card card-3d border-gradient-animated animate-fade-up" style={{ animationDelay: `${Math.min(idx * 50, 300)}ms` }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg avatar-3d ${
                      p.gender === 'male'
                        ? 'bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 border border-blue-200'
                        : p.gender === 'female'
                        ? 'bg-gradient-to-br from-pink-100 to-rose-100 text-pink-700 border border-pink-200'
                        : 'bg-gradient-to-br from-purple-100 to-violet-100 text-purple-700 border border-purple-200'
                    }`}
                  >
                    {p.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <Link to={`/patients/${p._id}`} className="font-semibold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer">
                      {p.name}
                    </Link>
                    <p className="text-xs text-gray-500">{p.patientId}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(p)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600"
                    aria-label="Edit patient"
                  >
                    <FiEdit2 className="text-sm" />
                  </button>
                  <button
                    onClick={() => handleDelete(p._id)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-600"
                    aria-label="Delete patient"
                  >
                    <FiTrash2 className="text-sm" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <FiUser className="text-gray-400" />
                  <span>{p.age ? `${p.age}y, ` : ''}{p.gender === 'male' ? 'M' : p.gender === 'female' ? 'F' : 'O'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  {p.bloodGroup && (
                    <span className="text-xs font-medium bg-red-50 text-red-600 px-2 py-0.5 rounded">
                      {p.bloodGroup}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <FiPhone className="text-gray-400" />
                  <span>{p.phone}</span>
                </div>
                <div className="text-gray-600 text-xs">{p.totalVisits || 0} visits</div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-sm font-semibold text-emerald-600">
                  ₹{Number(p.totalBilled || 0).toLocaleString('en-IN')}
                </span>
                <div className="flex gap-1.5">
                  <Link
                    to={`/patients/${p._id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 shadow-sm transition-all hover:shadow-md active:scale-95"
                  >
                    <FiExternalLink className="text-xs" /> View
                  </Link>
                  <button
                    onClick={() => setRiskPatient(riskPatient?._id === p._id ? null : p)}
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg shadow-sm transition-all hover:shadow-md active:scale-95 ${
                      riskPatient?._id === p._id
                        ? 'bg-violet-600 text-white'
                        : 'bg-violet-500 text-white hover:bg-violet-600'
                    }`}
                  >
                    <FiUser className="text-xs" /> AI Risk
                  </button>
                  <button
                    onClick={() => setWhatsappPatient(p)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 shadow-sm transition-all hover:shadow-md active:scale-95"
                  >
                    <FaWhatsapp className="text-xs" /> Message
                  </button>
                </div>
              </div>

              {riskPatient?._id === p._id && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <AIPatientRisk patient={p} />
                </div>
              )}
            </div>
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
