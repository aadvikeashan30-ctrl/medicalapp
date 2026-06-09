import React, { useState, useRef } from 'react';
import {
  FiCamera, FiPlus, FiX, FiTrash2, FiUser, FiActivity,
  FiTrendingUp, FiTrendingDown, FiMinus, FiCheckCircle, FiUpload, FiImage
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useApi } from '../hooks/useApi';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import ThreeDCard from '../components/ThreeDCard';
import PatientSearchSelect from '../components/PatientSearchSelect';

const FILE_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');
const fileUrl = (u) => (u && u.startsWith('http') ? u : `${FILE_BASE}${u || ''}`);

const ASSESS = {
  improving: { label: 'Improving', icon: FiTrendingUp, class: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  stable: { label: 'Stable', icon: FiMinus, class: 'text-blue-600 bg-blue-50 border-blue-200' },
  worsening: { label: 'Worsening', icon: FiTrendingDown, class: 'text-red-600 bg-red-50 border-red-200' },
  healed: { label: 'Healed', icon: FiCheckCircle, class: 'text-teal-600 bg-teal-50 border-teal-200' }
};

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

async function uploadPhoto(file) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await api.post('/uploads', fd, { headers: { 'Content-Type': undefined } });
  return res.data?.url;
}


export default function WoundTracker() {
  const [showCreate, setShowCreate] = useState(false);
  const [showEntry, setShowEntry] = useState(null); // tracker object
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [form, setForm] = useState({ patientId: '', bodyArea: '', condition: '' });
  const [entry, setEntry] = useState({ note: '', assessment: 'stable', file: null, preview: '' });
  const fileRef = useRef(null);

  const { data, loading, refetch } = useApi('/progress');
  const { data: statsData, refetch: refetchStats } = useApi('/progress/stats/summary');
  const { data: patients } = useApi('/patients?limit=200');
  const trackers = data?.trackers || [];
  const stats = statsData || { active: 0, healed: 0, total: 0 };

  const reload = () => { refetch(); refetchStats(); };

  const openCreate = () => { setForm({ patientId: '', bodyArea: '', condition: '' }); setShowCreate(true); };
  const openEntry = (tracker) => { setEntry({ note: '', assessment: 'stable', file: null, preview: '' }); setShowEntry(tracker); };

  const pickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setEntry((prev) => ({ ...prev, file: f, preview: URL.createObjectURL(f) }));
  };

  const createTracker = async (e) => {
    e.preventDefault();
    if (!form.patientId) return toast.error('Select a patient');
    if (!form.bodyArea.trim()) return toast.error('Enter the body area');
    setSaving(true);
    try {
      await api.post('/progress', form);
      toast.success('Tracker created');
      setShowCreate(false);
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const addEntry = async (e) => {
    e.preventDefault();
    if (!entry.file && !entry.preview) return toast.error('Add a photo');
    setSaving(true);
    try {
      let url = entry.preview;
      try { if (entry.file) { const up = await uploadPhoto(entry.file); if (up) url = up; } } catch (e) { /* fall back to preview */ }
      await api.post(`/progress/${showEntry._id}/entries`, { photoUrl: url, note: entry.note, assessment: entry.assessment });
      toast.success('Photo added to timeline');
      setShowEntry(null);
      reload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add entry');
    } finally {
      setSaving(false);
    }
  };

  const deleteTracker = async (id) => {
    if (!confirm('Delete this tracker and all its photos?')) return;
    try { await api.delete(`/progress/${id}`); toast.success('Deleted'); reload(); }
    catch (err) { toast.error('Failed'); }
  };


  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
              <FiCamera className="text-white text-lg" />
            </div>
            Wound & Skin Tracker
          </h1>
          <p className="text-sm text-gray-500 mt-1">Track healing visually with a dated photo timeline for wounds and skin conditions</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2"><FiPlus /> New Tracker</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active', value: stats.active, icon: FiActivity, from: 'from-pink-500', to: 'to-rose-600', bg: 'from-pink-50 to-rose-50', border: 'border-pink-100' },
          { label: 'Healed', value: stats.healed, icon: FiCheckCircle, from: 'from-emerald-500', to: 'to-teal-600', bg: 'from-emerald-50 to-teal-50', border: 'border-emerald-100' },
          { label: 'Total', value: stats.total, icon: FiImage, from: 'from-violet-500', to: 'to-purple-600', bg: 'from-violet-50 to-purple-50', border: 'border-violet-100' }
        ].map((s) => (
          <ThreeDCard key={s.label} intensity={8}>
            <div className={`p-5 bg-gradient-to-br ${s.bg} rounded-2xl border ${s.border}`}>
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 bg-gradient-to-br ${s.from} ${s.to} rounded-xl flex items-center justify-center shadow-lg`}>
                  <s.icon className="text-white text-lg" />
                </div>
                <div><p className="text-2xl font-bold text-gray-900">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></div>
              </div>
            </div>
          </ThreeDCard>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <Loader label="Loading trackers..." />
      ) : trackers.length === 0 ? (
        <EmptyState icon={FiCamera} title="No trackers yet" message="Create a visual tracker for a wound or skin condition, then add dated photos to watch it heal over time."
          action={<button onClick={openCreate} className="btn-primary text-sm">Create First Tracker</button>} />
      ) : (
        <div className="space-y-4">
          {trackers.map((t) => {
            const open = expanded === t._id;
            const latest = t.entries?.[t.entries.length - 1];
            const la = ASSESS[latest?.assessment] || ASSESS.stable;
            return (
              <div key={t._id} className="card animate-slide-in">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0 cursor-pointer" onClick={() => setExpanded(open ? null : t._id)}>
                    {latest ? (
                      <img src={fileUrl(latest.photoUrl)} alt="" onError={(e) => { e.target.style.display = 'none'; }} className="w-14 h-14 rounded-xl object-cover border border-gray-200 flex-shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0"><FiImage className="text-gray-400" /></div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">{t.bodyArea}{t.condition ? ` · ${t.condition}` : ''}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1.5"><FiUser className="text-xs" /> {t.patientName || t.patientId?.name} · {t.entries?.length || 0} photos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {latest && <span className={`badge border ${la.class}`}>{la.label}</span>}
                    <button onClick={() => openEntry(t)} className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1"><FiCamera /> Add</button>
                  </div>
                </div>

                {open && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 animate-fade-in">
                    {t.entries?.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">No photos yet. Click "Add" to capture the first one.</p>
                    ) : (
                      <div className="flex gap-4 overflow-x-auto pb-2 custom-scroll">
                        {t.entries.map((en) => {
                          const a = ASSESS[en.assessment] || ASSESS.stable;
                          return (
                            <div key={en._id} className="flex-shrink-0 w-40">
                              <img src={fileUrl(en.photoUrl)} alt="" onError={(e) => { e.target.src = 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22160%22 height=%22120%22><rect width=%22100%25%22 height=%22100%25%22 fill=%22%23f1f5f9%22/><text x=%2250%25%22 y=%2250%25%22 fill=%22%2394a3b8%22 font-size=%2212%22 text-anchor=%22middle%22 dy=%22.3em%22>No image</text></svg>'; }} className="w-40 h-32 rounded-xl object-cover border border-gray-200" />
                              <p className="text-xs font-medium text-gray-700 mt-1.5">{fmtDate(en.date)}</p>
                              <span className={`inline-block mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded border ${a.class}`}>{a.label}</span>
                              {en.note && <p className="text-xs text-gray-500 mt-1">{en.note}</p>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className="flex justify-end pt-3">
                      <button onClick={() => deleteTracker(t._id)} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"><FiTrash2 /> Delete tracker</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Tracker Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">New Tracker</h2>
              <button onClick={() => setShowCreate(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><FiX className="text-gray-500" /></button>
            </div>
            <form onSubmit={createTracker} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Patient *</label>
                <PatientSearchSelect patients={(patients?.patients || patients || [])} value={form.patientId} onChange={(id) => setForm({ ...form, patientId: id })} placeholder="Search patient..." required />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Body Area *</label>
                <input value={form.bodyArea} onChange={(e) => setForm({ ...form, bodyArea: e.target.value })} className="input-field" placeholder="e.g. Left forearm" required />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Condition</label>
                <input value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} className="input-field" placeholder="e.g. Post-op suture site, Eczema" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Creating...' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Entry Modal */}
      {showEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Add Photo · {showEntry.bodyArea}</h2>
              <button onClick={() => setShowEntry(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><FiX className="text-gray-500" /></button>
            </div>
            <form onSubmit={addEntry} className="p-6 space-y-4">
              <div>
                <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={pickFile} className="hidden" />
                {entry.preview ? (
                  <div className="relative">
                    <img src={entry.preview} alt="" className="w-full h-48 object-cover rounded-xl border border-gray-200" />
                    <button type="button" onClick={() => fileRef.current?.click()} className="absolute bottom-2 right-2 btn-secondary !py-1.5 !px-3 text-xs">Change</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileRef.current?.click()} className="w-full h-48 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-pink-400 hover:text-pink-500 transition-colors">
                    <FiUpload className="text-2xl mb-2" /> <span className="text-sm">Tap to capture / upload photo</span>
                  </button>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Assessment</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(ASSESS).map(([k, v]) => (
                    <button key={k} type="button" onClick={() => setEntry({ ...entry, assessment: k })} className={`flex flex-col items-center gap-1 py-2 rounded-xl border text-xs font-medium transition-all ${entry.assessment === k ? v.class : 'border-gray-200 text-gray-500'}`}>
                      <v.icon /> {v.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Note</label>
                <textarea value={entry.note} onChange={(e) => setEntry({ ...entry, note: e.target.value })} rows={2} className="input-field" placeholder="Clinical observation..." />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowEntry(null)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Add to Timeline'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
