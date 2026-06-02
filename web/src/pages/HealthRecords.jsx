import React, { useState, useEffect } from 'react';
import { FiFileText, FiPlus, FiSearch, FiFilter, FiClock, FiHeart, FiActivity, FiTrash2, FiEdit } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';

const RECORD_TYPES = [
  { value: 'vitals', label: 'Vitals', icon: '💓' },
  { value: 'diagnosis', label: 'Diagnosis', icon: '🩺' },
  { value: 'procedure', label: 'Procedure', icon: '🔬' },
  { value: 'lab-result', label: 'Lab Result', icon: '🧪' },
  { value: 'imaging', label: 'Imaging', icon: '📷' },
  { value: 'vaccination', label: 'Vaccination', icon: '💉' },
  { value: 'allergy', label: 'Allergy', icon: '⚠️' },
  { value: 'medication', label: 'Medication', icon: '💊' },
  { value: 'note', label: 'Clinical Note', icon: '📝' },
  { value: 'discharge-summary', label: 'Discharge Summary', icon: '📋' }
];

export default function HealthRecords() {
  const [records, setRecords] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('records'); // records | timeline
  const [selectedPatient, setSelectedPatient] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ patientId: '', recordType: 'vitals', title: '', description: '', tags: '' });

  const fetchRecords = async () => {
    if (!selectedPatient) return;
    setLoading(true);
    try {
      const params = { recordType: filterType || undefined };
      const { data } = await api.get(`/health-records/patient/${selectedPatient}`, { params });
      setRecords(data.records || []);
    } catch (err) {
      toast.error('Failed to load health records');
    }
    setLoading(false);
  };

  const fetchTimeline = async () => {
    if (!selectedPatient) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/health-records/timeline/${selectedPatient}`);
      setTimeline(data.events || []);
    } catch (err) {
      toast.error('Failed to load timeline');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (view === 'records') fetchRecords();
    else fetchTimeline();
  }, [selectedPatient, filterType, view]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) };
      await api.post('/health-records', payload);
      toast.success('Record created');
      setShowForm(false);
      setForm({ patientId: '', recordType: 'vitals', title: '', description: '', tags: '' });
      fetchRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create record');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    try {
      await api.delete(`/health-records/${id}`);
      toast.success('Record deleted');
      fetchRecords();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiFileText className="text-blue-600" /> Personal Health Records
          </h1>
          <p className="text-gray-500 text-sm mt-1">Comprehensive patient health data & digital timeline</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition">
          <FiPlus /> Add Record
        </button>
      </div>

      {/* Patient Selection & Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Enter Patient ID..."
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setView('records')} className={`px-4 py-2 rounded-lg text-sm font-medium ${view === 'records' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400'}`}>
              <FiFileText className="inline mr-1" /> Records
            </button>
            <button onClick={() => setView('timeline')} className={`px-4 py-2 rounded-lg text-sm font-medium ${view === 'timeline' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400'}`}>
              <FiClock className="inline mr-1" /> Timeline
            </button>
          </div>
          {view === 'records' && (
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm">
              <option value="">All Types</option>
              {RECORD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Records View */}
      {view === 'records' && (
        <div className="grid gap-4">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : records.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
              <FiFileText className="mx-auto text-4xl text-gray-300 mb-3" />
              <p className="text-gray-500">{selectedPatient ? 'No health records found' : 'Enter a Patient ID to view records'}</p>
            </div>
          ) : (
            records.map(record => (
              <div key={record._id} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{RECORD_TYPES.find(t => t.value === record.recordType)?.icon || '📄'}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{record.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{record.description}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs rounded-full">{record.recordType}</span>
                        {record.tags?.map(tag => <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 text-xs rounded-full">{tag}</span>)}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleDelete(record._id)} className="text-red-500 hover:text-red-700 p-1"><FiTrash2 /></button>
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-400">{new Date(record.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Timeline View */}
      {view === 'timeline' && (
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-blue-200 dark:bg-blue-800"></div>
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading...</div>
            ) : timeline.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No timeline events</div>
            ) : (
              timeline.map(event => (
                <div key={event._id} className="relative pl-14">
                  <div className="absolute left-4 w-4 h-4 rounded-full bg-blue-500 border-2 border-white dark:border-gray-900 shadow"></div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          event.importance === 'critical' ? 'bg-red-100 text-red-700' :
                          event.importance === 'important' ? 'bg-orange-100 text-orange-700' :
                          event.importance === 'notable' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>{event.eventType}</span>
                        <h4 className="font-medium text-gray-900 dark:text-white mt-1">{event.title}</h4>
                        {event.description && <p className="text-sm text-gray-500 mt-1">{event.description}</p>}
                        {event.aiInsight && <p className="text-sm text-purple-600 dark:text-purple-400 mt-1 italic">AI: {event.aiInsight}</p>}
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(event.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Add Health Record</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Patient ID</label>
                <input type="text" value={form.patientId} onChange={e => setForm({ ...form, patientId: e.target.value })} required className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Record Type</label>
                <select value={form.recordType} onChange={e => setForm({ ...form, recordType: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  {RECORD_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (comma-separated)</label>
                <input type="text" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="diabetes, heart, follow-up" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Save Record</button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg hover:bg-gray-200">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
