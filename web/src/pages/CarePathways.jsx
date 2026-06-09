import React, { useState } from 'react';
import {
  FiList, FiPlus, FiX, FiTrash2, FiCheck, FiClock,
  FiActivity, FiHeart, FiCoffee, FiCalendar, FiUser, FiChevronDown, FiChevronUp
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useApi } from '../hooks/useApi';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import ThreeDCard from '../components/ThreeDCard';
import PatientSearchSelect from '../components/PatientSearchSelect';

const CATEGORIES = {
  medication: { label: 'Medication', icon: FiActivity, color: 'text-blue-600 bg-blue-50' },
  exercise: { label: 'Exercise', icon: FiHeart, color: 'text-rose-600 bg-rose-50' },
  measurement: { label: 'Measurement', icon: FiClock, color: 'text-violet-600 bg-violet-50' },
  diet: { label: 'Diet', icon: FiCoffee, color: 'text-amber-600 bg-amber-50' },
  appointment: { label: 'Appointment', icon: FiCalendar, color: 'text-emerald-600 bg-emerald-50' },
  other: { label: 'Other', icon: FiList, color: 'text-gray-600 bg-gray-50' }
};

const todayStr = () => new Date().toISOString().slice(0, 10);

const emptyTask = { label: '', category: 'medication', time: '', frequency: 'daily', instructions: '' };


export default function CarePathways() {
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [form, setForm] = useState({ patientId: '', title: '', diagnosis: '' });
  const [tasks, setTasks] = useState([{ ...emptyTask }]);

  const { data, loading, refetch } = useApi('/care-pathways');
  const { data: statsData, refetch: refetchStats } = useApi('/care-pathways/stats/summary');
  const { data: patients } = useApi('/patients?limit=200');
  const pathways = data?.pathways || [];
  const stats = statsData || { active: 0, completed: 0, total: 0 };

  const reload = () => { refetch(); refetchStats(); };

  const isDone = (p, taskId) => p.completions?.some((c) => String(c.taskId) === String(taskId) && c.date === todayStr());
  const progress = (p) => {
    if (!p.tasks?.length) return 0;
    const done = p.tasks.filter((t) => isDone(p, t._id)).length;
    return Math.round((done / p.tasks.length) * 100);
  };

  const addTaskRow = () => setTasks([...tasks, { ...emptyTask }]);
  const removeTaskRow = (i) => setTasks(tasks.filter((_, idx) => idx !== i));
  const updateTask = (i, key, val) => setTasks(tasks.map((t, idx) => (idx === i ? { ...t, [key]: val } : t)));

  const openAdd = () => {
    setForm({ patientId: '', title: '', diagnosis: '' });
    setTasks([{ ...emptyTask }]);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patientId) return toast.error('Select a patient');
    if (!form.title.trim()) return toast.error('Add a plan title');
    const validTasks = tasks.filter((t) => t.label.trim());
    if (validTasks.length === 0) return toast.error('Add at least one task');
    setSaving(true);
    try {
      await api.post('/care-pathways', { ...form, tasks: validTasks });
      toast.success('Care plan created');
      setShowModal(false);
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create plan');
    } finally {
      setSaving(false);
    }
  };

  const toggleTask = async (pathway, taskId) => {
    try {
      await api.post(`/care-pathways/${pathway._id}/toggle`, { taskId, date: todayStr() });
      refetch();
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const deletePathway = async (id) => {
    if (!confirm('Delete this care plan?')) return;
    try {
      await api.delete(`/care-pathways/${id}`);
      toast.success('Deleted');
      reload();
    } catch (err) {
      toast.error('Failed');
    }
  };


  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <FiList className="text-white text-lg" />
            </div>
            Care Pathways
          </h1>
          <p className="text-sm text-gray-500 mt-1">Turn post-visit instructions into a daily checklist patients can follow and tick off</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2"><FiPlus /> New Care Plan</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active Plans', value: stats.active, icon: FiActivity, from: 'from-emerald-500', to: 'to-teal-600', bg: 'from-emerald-50 to-teal-50', border: 'border-emerald-100' },
          { label: 'Completed', value: stats.completed, icon: FiCheck, from: 'from-blue-500', to: 'to-indigo-600', bg: 'from-blue-50 to-indigo-50', border: 'border-blue-100' },
          { label: 'Total', value: stats.total, icon: FiList, from: 'from-violet-500', to: 'to-purple-600', bg: 'from-violet-50 to-purple-50', border: 'border-violet-100' }
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

      {/* List */}
      {loading ? (
        <Loader label="Loading care plans..." />
      ) : pathways.length === 0 ? (
        <EmptyState icon={FiList} title="No care plans yet" message="Create a daily checklist of medications, exercises, and measurements for your patients to follow at home."
          action={<button onClick={openAdd} className="btn-primary text-sm">Create First Plan</button>} />
      ) : (
        <div className="space-y-4">
          {pathways.map((p) => {
            const pct = progress(p);
            const open = expanded === p._id;
            return (
              <div key={p._id} className="card animate-slide-in">
                <div className="flex items-center justify-between gap-4 cursor-pointer" onClick={() => setExpanded(open ? null : p._id)}>
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="16" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                        <circle cx="18" cy="18" r="16" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray={`${pct} 100`} strokeLinecap="round" />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">{pct}%</span>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">{p.title}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1.5"><FiUser className="text-xs" /> {p.patientName || p.patientId?.name} · {p.tasks?.length || 0} tasks today</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${p.status === 'active' ? 'badge-success' : 'badge-gray'}`}>{p.status}</span>
                    {open ? <FiChevronUp className="text-gray-400" /> : <FiChevronDown className="text-gray-400" />}
                  </div>
                </div>

                {open && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-2 animate-fade-in">
                    {p.diagnosis && <p className="text-xs text-gray-400 mb-2">Diagnosis: {p.diagnosis}</p>}
                    {p.tasks?.map((t) => {
                      const cat = CATEGORIES[t.category] || CATEGORIES.other;
                      const CatIcon = cat.icon;
                      const done = isDone(p, t._id);
                      return (
                        <div key={t._id} className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${done ? 'bg-emerald-50/50 border-emerald-100' : 'bg-gray-50/50 border-gray-100'}`}>
                          <button onClick={() => toggleTask(p, t._id)} className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-all ${done ? 'bg-emerald-500 text-white' : 'bg-white border-2 border-gray-300 hover:border-emerald-400'}`}>
                            {done && <FiCheck className="text-sm" />}
                          </button>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cat.color}`}><CatIcon className="text-sm" /></div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${done ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200'}`}>{t.label}</p>
                            <p className="text-xs text-gray-400">{[cat.label, t.time, t.instructions].filter(Boolean).join(' · ')}</p>
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex justify-end pt-2">
                      <button onClick={() => deletePathway(p._id)} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"><FiTrash2 /> Delete plan</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl animate-scale-in max-h-[90vh] overflow-y-auto custom-scroll">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">New Care Plan</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><FiX className="text-gray-500" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Patient *</label>
                <PatientSearchSelect patients={(patients?.patients || patients || [])} value={form.patientId} onChange={(id) => setForm({ ...form, patientId: id })} placeholder="Search patient..." required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Plan Title *</label>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="e.g. Post-op Recovery Plan" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Diagnosis</label>
                  <input value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} className="input-field" placeholder="Optional" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Daily Tasks</label>
                  <button type="button" onClick={addTaskRow} className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"><FiPlus /> Add Task</button>
                </div>
                <div className="space-y-2">
                  {tasks.map((t, i) => (
                    <div key={i} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl space-y-2">
                      <div className="flex gap-2">
                        <input value={t.label} onChange={(e) => updateTask(i, 'label', e.target.value)} className="input-field !py-1.5 text-sm flex-1" placeholder="Task, e.g. Take Metformin 500mg" />
                        {tasks.length > 1 && <button type="button" onClick={() => removeTaskRow(i)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400"><FiX /></button>}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <select value={t.category} onChange={(e) => updateTask(i, 'category', e.target.value)} className="input-field !py-1.5 text-sm">
                          {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                        <input value={t.time} onChange={(e) => updateTask(i, 'time', e.target.value)} className="input-field !py-1.5 text-sm" placeholder="Time (8 AM)" />
                        <select value={t.frequency} onChange={(e) => updateTask(i, 'frequency', e.target.value)} className="input-field !py-1.5 text-sm">
                          <option value="daily">Daily</option>
                          <option value="once">Once</option>
                          <option value="weekly">Weekly</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Creating...' : 'Create Plan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
