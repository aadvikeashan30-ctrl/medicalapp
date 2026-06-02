import React, { useState, useEffect } from 'react';
import { FiBell, FiPlus, FiCheck, FiX, FiClock, FiActivity, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function MedicineReminders() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    patientId: '', medicineName: '', dosage: '', frequency: 'twice-daily',
    timing: 'after-food', startDate: '', endDate: '', reminderTimes: '08:00,20:00'
  });

  const fetchReminders = async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/reminders/patient/${patientId}`);
      setReminders(data || []);
    } catch (err) {
      toast.error('Failed to load reminders');
    }
    setLoading(false);
  };

  useEffect(() => { fetchReminders(); }, [patientId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        reminderTimes: form.reminderTimes.split(',').map(t => t.trim())
      };
      await api.post('/reminders', payload);
      toast.success('Reminder created');
      setShowForm(false);
      fetchReminders();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create');
    }
  };

  const handleLogAdherence = async (id, status) => {
    try {
      await api.post(`/reminders/${id}/log`, { status });
      toast.success(status === 'taken' ? 'Marked as taken' : 'Marked as missed');
      fetchReminders();
    } catch (err) {
      toast.error('Failed to log');
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await api.patch(`/reminders/${id}/deactivate`);
      toast.success('Reminder deactivated');
      fetchReminders();
    } catch (err) {
      toast.error('Failed to deactivate');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiBell className="text-orange-600" /> Medicine Reminders
          </h1>
          <p className="text-gray-500 text-sm mt-1">Track medication adherence and send reminders</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-700">
          <FiPlus /> New Reminder
        </button>
      </div>

      {/* Patient Input */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <input type="text" placeholder="Enter Patient ID to view reminders..." value={patientId} onChange={e => setPatientId(e.target.value)} className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
      </div>

      {/* Reminders List */}
      <div className="grid gap-4 md:grid-cols-2">
        {loading ? (
          <div className="col-span-2 text-center py-12 text-gray-500">Loading...</div>
        ) : reminders.length === 0 ? (
          <div className="col-span-2 text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
            <FiBell className="mx-auto text-4xl text-gray-300 mb-3" />
            <p className="text-gray-500">{patientId ? 'No reminders found' : 'Enter Patient ID'}</p>
          </div>
        ) : (
          reminders.map(r => (
            <div key={r._id} className={`bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border ${r.isActive ? 'border-gray-100 dark:border-gray-700' : 'border-gray-200 opacity-60'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{r.medicineName}</h3>
                  <p className="text-sm text-gray-500">{r.dosage} - {r.frequency}</p>
                  <p className="text-xs text-gray-400 mt-1 capitalize">{r.timing} | {r.reminderTimes?.join(', ')}</p>
                </div>
                <div className="flex items-center gap-1">
                  {r.isActive && (
                    <>
                      <button onClick={() => handleLogAdherence(r._id, 'taken')} className="bg-green-100 text-green-600 p-2 rounded-lg hover:bg-green-200" title="Mark taken"><FiCheck size={16} /></button>
                      <button onClick={() => handleLogAdherence(r._id, 'missed')} className="bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200" title="Mark missed"><FiX size={16} /></button>
                    </>
                  )}
                  <button onClick={() => handleDeactivate(r._id)} className="bg-gray-100 text-gray-600 p-2 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400" title="Deactivate"><FiTrash2 size={16} /></button>
                </div>
              </div>
              {/* Adherence bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Adherence</span>
                  <span>{r.adherenceRate || 0}%</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${r.adherenceRate >= 80 ? 'bg-green-500' : r.adherenceRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${r.adherenceRate || 0}%` }}></div>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                {r.startDate && `Started: ${new Date(r.startDate).toLocaleDateString('en-IN')}`}
                {r.endDate && ` | Ends: ${new Date(r.endDate).toLocaleDateString('en-IN')}`}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Create Medicine Reminder</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Patient ID</label>
                  <input type="text" value={form.patientId} onChange={e => setForm({ ...form, patientId: e.target.value })} required className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Medicine Name</label>
                  <input type="text" value={form.medicineName} onChange={e => setForm({ ...form, medicineName: e.target.value })} required className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dosage</label>
                  <input type="text" value={form.dosage} onChange={e => setForm({ ...form, dosage: e.target.value })} required placeholder="e.g., 500mg" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Frequency</label>
                  <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option value="once-daily">Once Daily</option>
                    <option value="twice-daily">Twice Daily</option>
                    <option value="thrice-daily">Thrice Daily</option>
                    <option value="four-times">Four Times</option>
                    <option value="weekly">Weekly</option>
                    <option value="as-needed">As Needed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Timing</label>
                  <select value={form.timing} onChange={e => setForm({ ...form, timing: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <option value="before-food">Before Food</option>
                    <option value="after-food">After Food</option>
                    <option value="empty-stomach">Empty Stomach</option>
                    <option value="bedtime">Bedtime</option>
                    <option value="any">Any Time</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                  <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                  <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reminder Times (comma-separated)</label>
                  <input type="text" value={form.reminderTimes} onChange={e => setForm({ ...form, reminderTimes: e.target.value })} placeholder="08:00,14:00,20:00" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700">Create Reminder</button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
