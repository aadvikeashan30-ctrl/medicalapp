import React, { useState, useRef } from 'react';
import {
  FiPlus, FiSearch, FiEdit2, FiTrash2, FiX, FiActivity,
  FiFilter, FiCheckCircle, FiClock, FiChevronDown, FiUpload, FiFileText,
  FiPaperclip, FiExternalLink
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useApi } from '../hooks/useApi';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import PatientSearchSelect from '../components/PatientSearchSelect';
import AnimatedCounter from '../components/AnimatedCounter';
import { Hero3D, useTilt } from '../components/Premium3D';


const STATUS_OPTIONS = ['ordered', 'sample-collected', 'reported', 'cancelled'];
const CATEGORY_OPTIONS = ['Hematology', 'Biochemistry', 'Microbiology', 'Imaging', 'Pathology', 'Cardiology', 'Other'];

const statusConfig = {
  ordered: { label: 'Ordered', class: 'badge-blue', icon: FiClock, dot: '#3b82f6', soft: 'rgba(59,130,246,0.14)', shadow: 'rgba(59,130,246,0.4)' },
  'sample-collected': { label: 'Sample Collected', class: 'badge-amber', icon: FiActivity, dot: '#f59e0b', soft: 'rgba(245,158,11,0.14)', shadow: 'rgba(245,158,11,0.4)' },
  reported: { label: 'Reported', class: 'badge-green', icon: FiCheckCircle, dot: '#10b981', soft: 'rgba(16,185,129,0.14)', shadow: 'rgba(16,185,129,0.4)' },
  cancelled: { label: 'Cancelled', class: 'badge-red', icon: FiX, dot: '#ef4444', soft: 'rgba(239,68,68,0.14)', shadow: 'rgba(239,68,68,0.4)' }
};

/* Shared 3D helpers */
function KpiTile({ icon: Icon, accent, label, value, delay }) {
  const tilt = useTilt(10);
  return (
    <div {...tilt} className={`stat-3d tilt-3d ${accent} animate-pop`} style={{ animationDelay: delay }}>
      <div className="flex items-start justify-between mb-3 depth-2"><div className="stat-3d-icon"><Icon size={22} /></div></div>
      <p className="text-[26px] font-extrabold text-gray-900 tabular-nums leading-none depth-1"><AnimatedCounter end={Number(value || 0)} /></p>
      <p className="text-sm text-gray-500 mt-1.5 depth-1">{label}</p>
    </div>
  );
}
function TiltCard({ className = '', style, children }) {
  const tilt = useTilt(6);
  return <div {...tilt} className={`tilt-3d ${className}`} style={style}>{children}</div>;
}

export default function LabTests() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    patientId: '', name: '', category: '', instructions: ''
  });
  const [resultForm, setResultForm] = useState({ status: '', resultSummary: '' });
  const reportInputRef = useRef(null);
  const [uploadingReport, setUploadingReport] = useState(false);


  const queryParams = new URLSearchParams();
  if (filterStatus) queryParams.set('status', filterStatus);
  queryParams.set('limit', '50');

  const { data, loading, refetch } = useApi(`/labtests?${queryParams.toString()}`);
  const { data: patients } = useApi('/patients?limit=200');
  const tests = data?.tests || [];
  const total = data?.total || 0;

  const filteredTests = tests.filter(t =>
    !search || t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.patientId?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setForm({ patientId: '', name: '', category: '', instructions: '' });
    setShowModal(true);
  };

  const openResult = (test) => {
    setSelectedTest(test);
    setResultForm({ status: test.status, resultSummary: test.resultSummary || '' });
    setShowResultModal(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.patientId || !form.name) return toast.error('Patient and test name required');
    setSaving(true);
    try {
      await api.post('/labtests', form);
      toast.success('Lab test ordered');
      setShowModal(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };


  const handleUpdateResult = async (e) => {
    e.preventDefault();
    if (!selectedTest) return;
    setSaving(true);
    try {
      await api.put(`/labtests/${selectedTest._id}`, resultForm);
      toast.success('Lab test updated');
      setShowResultModal(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this lab test?')) return;
    try {
      await api.delete(`/labtests/${id}`);
      toast.success('Lab test deleted');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleReportUpload = async (testId, file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      return toast.error('File too large. Max 10MB');
    }
    setUploadingReport(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data: uploadData } = await api.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Attach report URL to the lab test
      await api.put(`/labtests/${testId}`, { reportUrl: uploadData.url || uploadData.path });
      toast.success('Report uploaded & attached');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingReport(false);
    }
  };

  const stats = {
    total,
    ordered: tests.filter(t => t.status === 'ordered').length,
    sampleCollected: tests.filter(t => t.status === 'sample-collected').length,
    reported: tests.filter(t => t.status === 'reported').length
  };

  return (
    <div className="page-enter space-y-6">
      {/* Hero */}
      <Hero3D
        icon={FiActivity}
        badge="Lab & Diagnostics · Live"
        title="Lab Tests"
        subtitle="Order, track and report patient investigations"
        gradient="radial-gradient(1200px 420px at 100% -20%, rgba(244,63,94,0.5), transparent 60%), linear-gradient(125deg,#9f1239 0%,#be185d 50%,#7c3aed 100%)"
      >
        <button onClick={openAdd} className="inline-flex items-center gap-2 bg-white text-rose-700 px-4 py-2 rounded-[14px] text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
          <FiPlus /> Order Test
        </button>
      </Hero3D>

      {/* Stats */}
      <div className="scene-3d grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile icon={FiActivity}    accent="accent-cyan"   label="Total Tests"      value={stats.total} delay="0ms" />
        <KpiTile icon={FiClock}       accent="accent-orange" label="Pending"          value={stats.ordered} delay="70ms" />
        <KpiTile icon={FiFileText}    accent="accent-purple" label="Sample Collected" value={stats.sampleCollected} delay="140ms" />
        <KpiTile icon={FiCheckCircle} accent="accent-green"  label="Reported"         value={stats.reported} delay="210ms" />
      </div>


      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by test or patient name..."
            className="input-field !pl-10"
          />
        </div>
        <div className="relative">
          <FiFilter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-field !pl-10 !pr-10 appearance-none min-w-[160px]"
          >
            <option value="">All Status</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{statusConfig[s]?.label || s}</option>
            ))}
          </select>
          <FiChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Test List */}
      {loading ? (
        <Loader label="Loading lab tests..." />
      ) : filteredTests.length === 0 ? (
        <EmptyState
          icon={FiActivity}
          title="No lab tests found"
          message="Order lab tests for your patients to track investigations"
          action={<button onClick={openAdd} className="btn-primary text-sm">Order First Test</button>}
        />
      ) : (
        <div className="scene-3d space-y-3">
          {filteredTests.map((test, idx) => {
            const sc = statusConfig[test.status] || statusConfig.ordered;
            const StatusIcon = sc.icon;
            return (
              <TiltCard
                key={test._id}
                className="module-3d flex flex-col sm:flex-row sm:items-center justify-between gap-4 group p-4 animate-pop"
                style={{ '--m-soft': sc.soft, '--m-shadow': sc.shadow, animationDelay: `${Math.min(idx * 35, 320)}ms`, borderLeft: `4px solid ${sc.dot}` }}
              >
                <div className="flex items-center gap-4 depth-1">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md flex-shrink-0"
                       style={{ background: 'linear-gradient(135deg,#be185d,#7c3aed)', boxShadow: '0 8px 16px -5px rgba(190,24,93,0.5)' }}>
                    <FiFileText className="text-lg" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{test.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-sm text-gray-500">
                        {test.patientId?.name || 'Unknown Patient'}
                      </span>
                      {test.patientId?.patientId && (
                        <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                          {test.patientId.patientId}
                        </span>
                      )}
                      {test.category && (
                        <span className="text-xs text-gray-400">· {test.category}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(test.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 depth-1">
                  <span className={`badge ${sc.class} flex items-center gap-1`}>
                    <StatusIcon className="text-xs" /> {sc.label}
                  </span>
                  {test.reportUrl && (
                    <a
                      href={test.reportUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                      title="View Report"
                    >
                      <FiExternalLink className="text-sm" />
                    </a>
                  )}
                  <label className="p-2 rounded-lg hover:bg-purple-50 text-purple-600 transition-colors cursor-pointer" title="Upload Report">
                    <FiPaperclip className="text-sm" />
                    <input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => handleReportUpload(test._id, e.target.files?.[0])}
                    />
                  </label>
                  <button onClick={() => openResult(test)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="Update">
                    <FiEdit2 className="text-sm" />
                  </button>
                  <button onClick={() => handleDelete(test._id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-all" title="Delete">
                    <FiTrash2 className="text-sm" />
                  </button>
                </div>
              </TiltCard>
            );
          })}
        </div>
      )}


      {/* Order Test Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Order Lab Test</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <FiX className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
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
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Test Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="e.g. Complete Blood Count" required />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field">
                  <option value="">Select category...</option>
                  {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Instructions</label>
                <textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} className="input-field" rows={2} placeholder="Special instructions for lab..." />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Ordering...' : 'Order Test'}</button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Update Result Modal */}
      {showResultModal && selectedTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Update: {selectedTest.name}</h2>
              <button onClick={() => setShowResultModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <FiX className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleUpdateResult} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Status</label>
                <select value={resultForm.status} onChange={(e) => setResultForm({ ...resultForm, status: e.target.value })} className="input-field">
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{statusConfig[s]?.label || s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Result Summary</label>
                <textarea value={resultForm.resultSummary} onChange={(e) => setResultForm({ ...resultForm, resultSummary: e.target.value })} className="input-field" rows={4} placeholder="Enter result summary / observations..." />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowResultModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Update Test'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
