import React, { useState, useEffect, useCallback } from 'react';
import {
  FiPlus, FiSearch, FiEdit2, FiTrash2, FiX, FiPackage,
  FiFilter, FiDownload, FiClock, FiStar, FiChevronDown
} from 'react-icons/fi';
import { FaCapsules, FaPills, FaSyringe, FaPrescriptionBottle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useApi } from '../hooks/useApi';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import ThreeDCard from '../components/ThreeDCard';

const FORM_OPTIONS = ['tablet', 'capsule', 'syrup', 'injection', 'ointment', 'drops', 'inhaler', 'powder'];
const TIMING_OPTIONS = [
  { value: 'before-food', label: 'Before Food' },
  { value: 'after-food', label: 'After Food' },
  { value: 'empty-stomach', label: 'Empty Stomach' },
  { value: 'bedtime', label: 'Bedtime' }
];

const formIcons = {
  tablet: FaPills,
  capsule: FaCapsules,
  syrup: FaPrescriptionBottle,
  injection: FaSyringe,
  default: FiPackage
};

const formColors = {
  tablet: 'from-blue-500 to-indigo-600',
  capsule: 'from-purple-500 to-pink-600',
  syrup: 'from-amber-500 to-orange-600',
  injection: 'from-red-500 to-rose-600',
  ointment: 'from-emerald-500 to-teal-600',
  drops: 'from-cyan-500 to-blue-500',
  inhaler: 'from-indigo-500 to-violet-600',
  powder: 'from-gray-500 to-slate-600'
};

export default function Medicines() {
  const [search, setSearch] = useState('');
  const [filterForm, setFilterForm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', genericName: '', strength: '', form: 'tablet',
    defaultFrequency: '', defaultDuration: '', defaultTiming: 'after-food', notes: ''
  });

  const queryParams = new URLSearchParams();
  if (search) queryParams.set('search', search);
  queryParams.set('limit', '100');

  const { data: medicines, loading, refetch } = useApi(`/medicines?${queryParams.toString()}`);

  const filteredMedicines = (medicines || []).filter(m =>
    !filterForm || m.form === filterForm
  );

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', genericName: '', strength: '', form: 'tablet', defaultFrequency: '', defaultDuration: '', defaultTiming: 'after-food', notes: '' });
    setShowModal(true);
  };

  const openEdit = (med) => {
    setEditing(med);
    setForm({
      name: med.name || '',
      genericName: med.genericName || '',
      strength: med.strength || '',
      form: med.form || 'tablet',
      defaultFrequency: med.defaultFrequency || '',
      defaultDuration: med.defaultDuration || '',
      defaultTiming: med.defaultTiming || 'after-food',
      notes: med.notes || ''
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Medicine name is required');
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/medicines/${editing._id}`, form);
        toast.success('Medicine updated');
      } else {
        await api.post('/medicines', form);
        toast.success('Medicine added to library');
      }
      setShowModal(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this medicine from your library?')) return;
    try {
      await api.delete(`/medicines/${id}`);
      toast.success('Medicine deleted');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const stats = {
    total: (medicines || []).length,
    tablets: (medicines || []).filter(m => m.form === 'tablet').length,
    mostUsed: (medicines || []).sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))[0]?.name || '—'
  };

  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center glow-purple">
              <FiPackage className="text-white text-lg" />
            </div>
            Medicine Library
          </h1>
          <p className="text-sm text-gray-500 mt-1 ml-[52px]">Quick-pick medicine templates for prescriptions</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <FiPlus /> Add Medicine
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ThreeDCard intensity={8}>
          <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <FaCapsules className="text-white text-lg" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-500">Total Medicines</p>
              </div>
            </div>
          </div>
        </ThreeDCard>
        <ThreeDCard intensity={8}>
          <div className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <FaPills className="text-white text-lg" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.tablets}</p>
                <p className="text-xs text-gray-500">Tablets</p>
              </div>
            </div>
          </div>
        </ThreeDCard>
        <ThreeDCard intensity={8}>
          <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <FiStar className="text-white text-lg" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 truncate">{stats.mostUsed}</p>
                <p className="text-xs text-gray-500">Most Used</p>
              </div>
            </div>
          </div>
        </ThreeDCard>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or generic name..."
            className="input-field !pl-10"
          />
        </div>
        <div className="relative">
          <FiFilter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={filterForm}
            onChange={(e) => setFilterForm(e.target.value)}
            className="input-field !pl-10 !pr-10 appearance-none min-w-[160px]"
          >
            <option value="">All Forms</option>
            {FORM_OPTIONS.map(f => (
              <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
            ))}
          </select>
          <FiChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Medicine Grid */}
      {loading ? (
        <Loader label="Loading medicines..." />
      ) : filteredMedicines.length === 0 ? (
        <EmptyState
          icon={FaCapsules}
          title="No medicines found"
          message={search ? 'Try a different search term' : 'Add medicines to build your quick-pick library for prescriptions'}
          action={!search && <button onClick={openAdd} className="btn-primary text-sm">Add First Medicine</button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMedicines.map((med, idx) => {
            const Icon = formIcons[med.form] || formIcons.default;
            const gradient = formColors[med.form] || 'from-gray-500 to-slate-600';
            return (
              <div
                key={med._id}
                className="card group animate-slide-in hover:shadow-lg"
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
                      <Icon className="text-white text-lg" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-white truncate">{med.name}</h3>
                      {med.genericName && (
                        <p className="text-xs text-gray-500 truncate">{med.genericName}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(med)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors">
                      <FiEdit2 className="text-sm" />
                    </button>
                    <button onClick={() => handleDelete(med._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                      <FiTrash2 className="text-sm" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {med.strength && (
                    <span className="badge badge-blue">{med.strength}</span>
                  )}
                  <span className="badge badge-purple">{med.form}</span>
                  {med.defaultTiming && (
                    <span className="badge badge-amber">
                      {TIMING_OPTIONS.find(t => t.value === med.defaultTiming)?.label || med.defaultTiming}
                    </span>
                  )}
                </div>

                {(med.defaultFrequency || med.defaultDuration) && (
                  <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                    {med.defaultFrequency && (
                      <span className="flex items-center gap-1">
                        <FiClock className="text-gray-400" /> {med.defaultFrequency}
                      </span>
                    )}
                    {med.defaultDuration && (
                      <span>• {med.defaultDuration}</span>
                    )}
                  </div>
                )}

                {med.usageCount > 0 && (
                  <div className="mt-2 text-[11px] text-gray-400">
                    Used {med.usageCount} time{med.usageCount > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editing ? 'Edit Medicine' : 'Add Medicine'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <FiX className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Medicine Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-field"
                    placeholder="e.g. Paracetamol"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Generic Name</label>
                  <input
                    type="text"
                    value={form.genericName}
                    onChange={(e) => setForm({ ...form, genericName: e.target.value })}
                    className="input-field"
                    placeholder="e.g. Acetaminophen"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Strength</label>
                  <input
                    type="text"
                    value={form.strength}
                    onChange={(e) => setForm({ ...form, strength: e.target.value })}
                    className="input-field"
                    placeholder="e.g. 500mg"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Form</label>
                  <select
                    value={form.form}
                    onChange={(e) => setForm({ ...form, form: e.target.value })}
                    className="input-field"
                  >
                    {FORM_OPTIONS.map(f => (
                      <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Timing</label>
                  <select
                    value={form.defaultTiming}
                    onChange={(e) => setForm({ ...form, defaultTiming: e.target.value })}
                    className="input-field"
                  >
                    {TIMING_OPTIONS.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Default Frequency</label>
                  <input
                    type="text"
                    value={form.defaultFrequency}
                    onChange={(e) => setForm({ ...form, defaultFrequency: e.target.value })}
                    className="input-field"
                    placeholder="e.g. 1-0-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Default Duration</label>
                  <input
                    type="text"
                    value={form.defaultDuration}
                    onChange={(e) => setForm({ ...form, defaultDuration: e.target.value })}
                    className="input-field"
                    placeholder="e.g. 5 days"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="input-field"
                    rows={2}
                    placeholder="Any additional notes..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Saving...' : editing ? 'Update' : 'Add Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
