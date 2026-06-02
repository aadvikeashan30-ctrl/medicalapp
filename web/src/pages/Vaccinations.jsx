import React, { useState, useEffect } from 'react';
import { FiShield, FiPlus, FiAlertTriangle, FiCalendar, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function Vaccinations() {
  const [vaccinations, setVaccinations] = useState([]);
  const [overdue, setOverdue] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('all'); // all | overdue | upcoming
  const [patientId, setPatientId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    patientId: '', vaccineName: '', vaccineType: 'other', doseNumber: 1,
    totalDoses: 1, administeredDate: '', nextDueDate: '', batchNumber: '', site: '', notes: ''
  });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [overdueRes, upcomingRes] = await Promise.all([
        api.get('/vaccinations/overdue'),
        api.get('/vaccinations/upcoming')
      ]);
      setOverdue(overdueRes.data || []);
      setUpcoming(upcomingRes.data || []);
    } catch (err) { /* ignore */ }
    setLoading(false);
  };

  const fetchForPatient = async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/vaccinations/patient/${patientId}`);
      setVaccinations(data || []);
    } catch (err) {
      toast.error('Failed to load vaccinations');
    }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { fetchForPatient(); }, [patientId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/vaccinations', form);
      toast.success('Vaccination recorded');
      setShowForm(false);
      fetchForPatient();
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create');
    }
  };

  const displayList = tab === 'overdue' ? overdue : tab === 'upcoming' ? upcoming : vaccinations;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiShield className="text-purple-600" /> Vaccination Tracker
          </h1>
          <p className="text-gray-500 text-sm mt-1">Immunization records, schedules & reminders</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700">
          <FiPlus /> Record Vaccination
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg"><FiAlertTriangle className="text-red-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{overdue.length}</p>
              <p className="text-xs text-gray-500">Overdue</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg"><FiCalendar className="text-blue-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{upcoming.length}</p>
              <p className="text-xs text-gray-500">Upcoming (30 days)</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg"><FiCheck className="text-green-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{vaccinations.length}</p>
              <p className="text-xs text-gray-500">Patient Records</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Patient Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-wrap gap-4 items-center">
        <div className="flex gap-2">
          {['all', 'overdue', 'upcoming'].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${tab === t ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400'}`}>{t}</button>
          ))}
        </div>
        {tab === 'all' && (
          <input type="text" placeholder="Patient ID..." value={patientId} onChange={e => setPatientId(e.target.value)} className="flex-1 min-w-[200px] px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
        )}
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : displayList.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border">
            <FiShield className="mx-auto text-4xl text-gray-300 mb-3" />
            <p className="text-gray-500">{tab === 'all' && !patientId ? 'Enter Patient ID to view records' : 'No records found'}</p>
          </div>
        ) : (
          displayList.map(v => (
            <div key={v._id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💉</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{v.vaccineName}</h3>
                    <p className="text-sm text-gray-500">Dose {v.doseNumber}/{v.totalDoses} | {v.vaccineType}</p>
                    {v.patientId?.name && <p className="text-xs text-gray-400 mt-1">Patient: {v.patientId.name}</p>}
                    {v.batchNumber && <p className="text-xs text-gray-400">Batch: {v.batchNumber}</p>}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    v.status === 'completed' ? 'bg-green-100 text-green-700' :
                    v.status === 'overdue' ? 'bg-red-100 text-red-700' :
                    v.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>{v.status}</span>
                  <p className="text-xs text-gray-400 mt-1">{new Date(v.administeredDate).toLocaleDateString('en-IN')}</p>
                  {v.nextDueDate && <p className="text-xs text-orange-500">Next: {new Date(v.nextDueDate).toLocaleDateString('en-IN')}</p>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Record Vaccination</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Patient ID</label>
                  <input type="text" value={form.patientId} onChange={e => setForm({ ...form, patientId: e.target.value })} required className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vaccine Name</label>
                  <input type="text" value={form.vaccineName} onChange={e => setForm({ ...form, vaccineName: e.target.value })} required className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vaccine Type</label>
                  <select value={form.vaccineType} onChange={e => setForm({ ...form, vaccineType: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    {['childhood', 'adult', 'travel', 'seasonal', 'covid', 'other'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dose #</label>
                  <input type="number" value={form.doseNumber} onChange={e => setForm({ ...form, doseNumber: e.target.value })} min={1} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Doses</label>
                  <input type="number" value={form.totalDoses} onChange={e => setForm({ ...form, totalDoses: e.target.value })} min={1} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Administered Date</label>
                  <input type="date" value={form.administeredDate} onChange={e => setForm({ ...form, administeredDate: e.target.value })} required className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Next Due Date</label>
                  <input type="date" value={form.nextDueDate} onChange={e => setForm({ ...form, nextDueDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Batch Number</label>
                  <input type="text" value={form.batchNumber} onChange={e => setForm({ ...form, batchNumber: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Site</label>
                  <input type="text" value={form.site} onChange={e => setForm({ ...form, site: e.target.value })} placeholder="Left arm" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700">Save</button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
