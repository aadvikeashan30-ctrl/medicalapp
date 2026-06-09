import React, { useState } from 'react';
import {
  FiPlus, FiSearch, FiTrash2, FiX, FiAward, FiFilter,
  FiCheckCircle, FiChevronDown, FiDownload, FiEye, FiEdit2,
  FiFileText, FiHeart, FiCalendar, FiUserCheck
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useApi } from '../hooks/useApi';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import ThreeDCard from '../components/ThreeDCard';
import PatientSearchSelect from '../components/PatientSearchSelect';

const TYPE_OPTIONS = [
  { value: 'sick-leave', label: 'Sick / Medical Leave' },
  { value: 'fitness', label: 'Fitness Certificate' },
  { value: 'fitness-to-work', label: 'Fitness to Resume Work' },
  { value: 'medical', label: 'Medical Certificate' },
  { value: 'travel', label: 'Fitness to Travel' },
  { value: 'custom', label: 'Custom Certificate' }
];

const typeConfig = {
  'sick-leave': { label: 'Sick Leave', class: 'badge-warning', icon: FiHeart },
  fitness: { label: 'Fitness', class: 'badge-success', icon: FiUserCheck },
  'fitness-to-work': { label: 'Fit to Work', class: 'badge-success', icon: FiUserCheck },
  medical: { label: 'Medical', class: 'badge-info', icon: FiFileText },
  travel: { label: 'Travel', class: 'badge-primary', icon: FiCheckCircle },
  custom: { label: 'Custom', class: 'badge-gray', icon: FiFileText }
};

const emptyForm = {
  patientId: '', type: 'sick-leave', diagnosis: '',
  restFromDate: '', restToDate: '', fitToResumeDate: '',
  remarks: '', issuedTo: ''
};

export default function MedicalCertificates() {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const queryParams = new URLSearchParams();
  if (filterType) queryParams.set('type', filterType);
  queryParams.set('limit', '50');

  const { data, loading, refetch } = useApi(`/certificates?${queryParams.toString()}`);
  const { data: statsData } = useApi('/certificates/stats/summary');
  const { data: patients } = useApi('/patients?limit=200');
  const certificates = data?.certificates || [];

  const stats = statsData || { total: 0, active: 0, sickLeave: 0, fitness: 0 };

  const filtered = certificates.filter(c =>
    !search ||
    c.certificateNo?.toLowerCase().includes(search.toLowerCase()) ||
    c.patientId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.diagnosis?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (cert) => {
    setEditing(cert);
    setForm({
      patientId: cert.patientId?._id || cert.patientId || '',
      type: cert.type || 'sick-leave',
      diagnosis: cert.diagnosis || '',
      restFromDate: cert.restFromDate ? cert.restFromDate.slice(0, 10) : '',
      restToDate: cert.restToDate ? cert.restToDate.slice(0, 10) : '',
      fitToResumeDate: cert.fitToResumeDate ? cert.fitToResumeDate.slice(0, 10) : '',
      remarks: cert.remarks || '',
      issuedTo: cert.issuedTo || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patientId) return toast.error('Please select a patient');
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/certificates/${editing._id}`, form);
        toast.success('Certificate updated');
      } else {
        await api.post('/certificates', form);
        toast.success('Certificate issued');
      }
      setShowModal(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save certificate');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this certificate?')) return;
    try {
      await api.delete(`/certificates/${id}`);
      toast.success('Certificate deleted');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const openPdf = async (cert, inline) => {
    const toastId = toast.loading(inline ? 'Opening PDF...' : 'Preparing download...');
    try {
      const res = await api.get(`/certificates/${cert._id}/pdf${inline ? '?view=1' : ''}`, {
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      if (inline) {
        window.open(url, '_blank');
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificate-${cert.certificateNo || 'CERT'}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
      toast.dismiss(toastId);
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err.response?.data?.message || 'Failed to generate PDF');
    }
  };

  const isLeaveType = form.type === 'sick-leave' || form.type === 'medical';
  const isFitnessType = form.type === 'fitness' || form.type === 'fitness-to-work';

  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center glow-purple">
              <FiAward className="text-white text-lg" />
            </div>
            Medical Certificates
          </h1>
          <p className="text-sm text-gray-500 mt-1">Issue sick-leave, fitness & medical certificates with one-click PDF</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <FiPlus /> Issue Certificate
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Issued', value: stats.total, icon: FiAward, from: 'from-violet-500', to: 'to-purple-600', bg: 'from-violet-50 to-purple-50', border: 'border-violet-100' },
          { label: 'Active', value: stats.active, icon: FiCheckCircle, from: 'from-emerald-500', to: 'to-teal-600', bg: 'from-emerald-50 to-teal-50', border: 'border-emerald-100' },
          { label: 'Sick Leave', value: stats.sickLeave, icon: FiHeart, from: 'from-orange-500', to: 'to-amber-600', bg: 'from-orange-50 to-amber-50', border: 'border-orange-100' },
          { label: 'Fitness', value: stats.fitness, icon: FiUserCheck, from: 'from-blue-500', to: 'to-indigo-600', bg: 'from-blue-50 to-indigo-50', border: 'border-blue-100' }
        ].map((s) => (
          <ThreeDCard key={s.label} intensity={8}>
            <div className={`p-5 bg-gradient-to-br ${s.bg} rounded-2xl border ${s.border}`}>
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 bg-gradient-to-br ${s.from} ${s.to} rounded-xl flex items-center justify-center shadow-lg`}>
                  <s.icon className="text-white text-lg" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </div>
            </div>
          </ThreeDCard>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by certificate no, patient or diagnosis..."
            className="input-field !pl-10"
          />
        </div>
        <div className="relative">
          <FiFilter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input-field !pl-10 !pr-10 appearance-none min-w-[180px]"
          >
            <option value="">All Types</option>
            {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <FiChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <Loader label="Loading certificates..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FiAward}
          title="No certificates yet"
          message="Issue sick-leave, fitness, or medical certificates for your patients in seconds"
          action={<button onClick={openAdd} className="btn-primary text-sm">Issue First Certificate</button>}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((cert, idx) => {
            const tc = typeConfig[cert.type] || typeConfig.custom;
            const TypeIcon = tc.icon;
            return (
              <div
                key={cert._id}
                className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4 group animate-slide-in"
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
                    <TypeIcon className="text-violet-600 text-lg" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{cert.patientId?.name || 'Unknown Patient'}</h3>
                      <span className="text-xs font-mono font-bold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded border border-violet-100">
                        {cert.certificateNo}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap text-sm text-gray-500">
                      {cert.diagnosis && <span>{cert.diagnosis}</span>}
                      {cert.restDays > 0 && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <FiCalendar className="text-[10px]" /> {cert.restDays} day{cert.restDays > 1 ? 's' : ''} rest
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(cert.issuedDate || cert.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${tc.class} flex items-center gap-1`}>
                    <TypeIcon className="text-xs" /> {tc.label}
                  </span>
                  <button onClick={() => openPdf(cert, true)} className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors" title="View PDF">
                    <FiEye className="text-sm" />
                  </button>
                  <button onClick={() => openPdf(cert, false)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="Download PDF">
                    <FiDownload className="text-sm" />
                  </button>
                  <button onClick={() => openEdit(cert)} className="p-2 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors" title="Edit">
                    <FiEdit2 className="text-sm" />
                  </button>
                  <button onClick={() => handleDelete(cert._id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-all" title="Delete">
                    <FiTrash2 className="text-sm" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Issue / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg animate-scale-in max-h-[90vh] overflow-y-auto custom-scroll">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editing ? `Edit ${editing.certificateNo}` : 'Issue Medical Certificate'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <FiX className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Patient *</label>
                <PatientSearchSelect
                  patients={(patients?.patients || patients || [])}
                  value={form.patientId}
                  onChange={(id) => setForm({ ...form, patientId: id })}
                  required
                  placeholder="Search by name or Patient ID..."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Certificate Type *</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input-field">
                  {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Diagnosis / Condition</label>
                <input type="text" value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} className="input-field" placeholder="e.g. Acute viral fever" />
              </div>

              {isLeaveType && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Rest From</label>
                    <input type="date" value={form.restFromDate} onChange={(e) => setForm({ ...form, restFromDate: e.target.value })} className="input-field" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Rest To</label>
                    <input type="date" value={form.restToDate} onChange={(e) => setForm({ ...form, restToDate: e.target.value })} className="input-field" />
                  </div>
                </div>
              )}

              {(isLeaveType || isFitnessType) && (
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Fit to Resume Date</label>
                  <input type="date" value={form.fitToResumeDate} onChange={(e) => setForm({ ...form, fitToResumeDate: e.target.value })} className="input-field" />
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Issued To</label>
                <input type="text" value={form.issuedTo} onChange={(e) => setForm({ ...form, issuedTo: e.target.value })} className="input-field" placeholder="e.g. Employer, School, Authority" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Remarks {form.type === 'custom' && '(certificate body)'}
                </label>
                <textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} className="input-field" rows={3} placeholder="Additional notes / advice..." />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Saving...' : editing ? 'Update' : 'Issue Certificate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
