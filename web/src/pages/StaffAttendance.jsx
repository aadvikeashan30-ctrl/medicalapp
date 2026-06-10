import React, { useState } from 'react';
import {
  FiUserCheck, FiLogIn, FiLogOut, FiPlus, FiX, FiClock, FiCheckCircle, FiUmbrella, FiUsers
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useApi } from '../hooks/useApi';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import ThreeDCard from '../components/ThreeDCard';

const statusCfg = {
  'on-duty': { label: 'On Duty', class: 'badge-info' },
  present: { label: 'Present', class: 'badge-success' },
  'half-day': { label: 'Half Day', class: 'badge-warning' },
  leave: { label: 'Leave', class: 'badge-gray' },
  absent: { label: 'Absent', class: 'badge-danger' }
};
const fmtTime = (d) => (d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—');

export default function StaffAttendance() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ staffName: '', role: 'staff' });
  const [saving, setSaving] = useState(false);

  const { data, loading, refetch } = useApi('/attendance');
  const { data: statsData, refetch: refetchStats } = useApi('/attendance/stats/summary');
  const records = data?.records || [];
  const stats = statsData || { present: 0, onDuty: 0, leave: 0, total: 0 };
  const reload = () => { refetch(); refetchStats(); };

  const checkIn = async (e) => {
    e.preventDefault();
    if (!form.staffName.trim()) return toast.error('Staff name is required');
    setSaving(true);
    try { await api.post('/attendance/check-in', form); toast.success('Checked in'); setShowModal(false); setForm({ staffName: '', role: 'staff' }); reload(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const checkOut = async (r) => {
    try { await api.post(`/attendance/${r._id}/check-out`, {}); toast.success('Checked out'); reload(); }
    catch (e) { toast.error('Failed'); }
  };

  const markLeave = async (r) => {
    try { await api.post('/attendance/mark', { staffName: r.staffName, role: r.role, status: 'leave' }); toast.success('Marked leave'); reload(); }
    catch (e) { toast.error('Failed'); }
  };


  return (
    <div className="page-enter space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center"><FiUserCheck className="text-white text-lg" /></div>
            Staff Attendance
          </h1>
          <p className="text-sm text-gray-500 mt-1">Track daily check-in/out, hours and leave</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><FiLogIn /> Check In Staff</button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'On Duty', value: stats.onDuty, icon: FiClock, grad: 'from-blue-500 to-indigo-600', bg: 'from-blue-50 to-indigo-50', border: 'border-blue-100' },
          { label: 'Present Today', value: stats.present, icon: FiCheckCircle, grad: 'from-emerald-500 to-teal-600', bg: 'from-emerald-50 to-teal-50', border: 'border-emerald-100' },
          { label: 'On Leave', value: stats.leave, icon: FiUmbrella, grad: 'from-amber-500 to-orange-600', bg: 'from-amber-50 to-orange-50', border: 'border-amber-100' }
        ].map((s) => (
          <ThreeDCard key={s.label} intensity={8}>
            <div className={`p-5 bg-gradient-to-br ${s.bg} rounded-2xl border ${s.border}`}>
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 bg-gradient-to-br ${s.grad} rounded-xl flex items-center justify-center shadow-lg`}><s.icon className="text-white text-lg" /></div>
                <div><p className="text-2xl font-bold text-gray-900">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></div>
              </div>
            </div>
          </ThreeDCard>
        ))}
      </div>

      {loading ? (
        <Loader label="Loading attendance..." />
      ) : records.length === 0 ? (
        <EmptyState icon={FiUsers} title="No attendance yet" message="Check in your staff to start tracking hours, presence and leave for today."
          action={<button onClick={() => setShowModal(true)} className="btn-primary text-sm">Check In First Staff</button>} />
      ) : (
        <div className="card !p-0 overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Staff</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">In</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Out</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Hrs</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Action</th>
            </tr></thead>
            <tbody>
              {records.map((r) => {
                const sc = statusCfg[r.status] || statusCfg['on-duty'];
                return (
                  <tr key={r._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="py-3 px-4"><p className="font-medium text-gray-900 dark:text-white text-sm">{r.staffName}</p><p className="text-xs text-gray-400 capitalize">{r.role}</p></td>
                    <td className="py-3 px-4 text-sm text-gray-600 hidden sm:table-cell">{fmtTime(r.checkIn)}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 hidden sm:table-cell">{fmtTime(r.checkOut)}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-gray-900">{r.hours || 0}</td>
                    <td className="py-3 px-4"><span className={`badge ${sc.class}`}>{sc.label}</span></td>
                    <td className="py-3 px-4 text-right">
                      {r.checkIn && !r.checkOut ? (
                        <button onClick={() => checkOut(r)} className="btn-secondary !py-1 !px-2.5 text-xs flex items-center gap-1 ml-auto"><FiLogOut /> Out</button>
                      ) : !r.checkIn && r.status !== 'leave' ? (
                        <button onClick={() => markLeave(r)} className="text-xs text-amber-600 hover:text-amber-700">Mark leave</button>
                      ) : <span className="text-xs text-gray-300">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Check In Staff</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><FiX className="text-gray-500" /></button>
            </div>
            <form onSubmit={checkIn} className="p-6 space-y-4">
              <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Staff Name *</label><input value={form.staffName} onChange={(e) => setForm({ ...form, staffName: e.target.value })} className="input-field" required /></div>
              <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input-field">
                  <option value="receptionist">Receptionist</option><option value="nurse">Nurse</option><option value="staff">Staff</option><option value="lab">Lab Tech</option><option value="pharmacist">Pharmacist</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Check In'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
