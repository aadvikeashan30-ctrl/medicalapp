import React, { useState, useEffect } from 'react';
import { FiMapPin, FiPlus, FiUsers, FiEdit, FiTrash2, FiActivity } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function BranchManagement() {
  const [branches, setBranches] = useState([]);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('branches');
  const [showForm, setShowForm] = useState(false);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [branchForm, setBranchForm] = useState({ name: '', code: '', address: '', city: '', state: '', phone: '' });
  const [teamForm, setTeamForm] = useState({ name: '', email: '', phone: '', role: 'staff', specialty: 'general' });

  useEffect(() => { fetchData(); }, [tab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === 'branches') {
        const { data } = await api.get('/enterprise/branches');
        setBranches(data || []);
      } else {
        const { data } = await api.get('/enterprise/team');
        setTeam(data || []);
      }
    } catch (err) { /* ignore */ }
    setLoading(false);
  };

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    try {
      await api.post('/enterprise/branches', branchForm);
      toast.success('Branch created');
      setShowForm(false);
      setBranchForm({ name: '', code: '', address: '', city: '', state: '', phone: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create');
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      await api.post('/enterprise/team', teamForm);
      toast.success('Team member added');
      setShowTeamForm(false);
      setTeamForm({ name: '', email: '', phone: '', role: 'staff', specialty: 'general' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add');
    }
  };

  const handleDeleteBranch = async (id) => {
    if (!window.confirm('Delete this branch?')) return;
    try {
      await api.delete(`/enterprise/branches/${id}`);
      toast.success('Branch deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleDeactivateMember = async (id) => {
    if (!window.confirm('Deactivate this team member?')) return;
    try {
      await api.patch(`/enterprise/team/${id}/deactivate`);
      toast.success('Member deactivated');
      fetchData();
    } catch (err) {
      toast.error('Failed to deactivate');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiMapPin className="text-blue-600" /> Multi-Branch & Team Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage branches, doctors, staff and roles</p>
        </div>
        <div className="flex gap-2">
          {tab === 'branches' ? (
            <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"><FiPlus /> Add Branch</button>
          ) : (
            <button onClick={() => setShowTeamForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"><FiPlus /> Add Member</button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab('branches')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${tab === 'branches' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400'}`}><FiMapPin size={14} /> Branches</button>
        <button onClick={() => setTab('team')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${tab === 'team' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400'}`}><FiUsers size={14} /> Team</button>
      </div>

      {/* Branches */}
      {tab === 'branches' && (
        <div className="grid gap-4 md:grid-cols-2">
          {loading ? <div className="col-span-2 text-center py-12 text-gray-500">Loading...</div> : branches.length === 0 ? (
            <div className="col-span-2 text-center py-12 bg-white dark:bg-gray-800 rounded-xl border"><FiMapPin className="mx-auto text-4xl text-gray-300 mb-3" /><p className="text-gray-500">No branches yet</p></div>
          ) : branches.map(b => (
            <div key={b._id} className={`bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border ${b.isMainBranch ? 'border-blue-400 ring-1 ring-blue-200' : 'border-gray-100 dark:border-gray-700'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{b.name}</h3>
                    {b.isMainBranch && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Main</span>}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{b.address}, {b.city}</p>
                  <p className="text-xs text-gray-400 mt-1">Code: {b.code} | {b.phone}</p>
                  <div className="flex gap-2 mt-2 text-xs text-gray-500">
                    <span>{b.doctors?.length || 0} doctors</span>
                    <span>{b.staff?.length || 0} staff</span>
                    <span>{b.consultationRooms} rooms</span>
                  </div>
                </div>
                <button onClick={() => handleDeleteBranch(b._id)} className="text-red-400 hover:text-red-600"><FiTrash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Team */}
      {tab === 'team' && (
        <div className="space-y-3">
          {loading ? <div className="text-center py-12 text-gray-500">Loading...</div> : team.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border"><p className="text-gray-500">No team members assigned to branches</p></div>
          ) : team.map(m => (
            <div key={m._id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{m.name}</p>
                <p className="text-sm text-gray-500">{m.email} | {m.phone}</p>
                <div className="flex gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs rounded-full capitalize">{m.role}</span>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 text-xs rounded-full capitalize">{m.specialty}</span>
                </div>
              </div>
              <button onClick={() => handleDeactivateMember(m._id)} className="text-red-400 hover:text-red-600 text-sm">Deactivate</button>
            </div>
          ))}
        </div>
      )}

      {/* Create Branch Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Add Branch</h2>
            <form onSubmit={handleCreateBranch} className="space-y-4">
              <input type="text" value={branchForm.name} onChange={e => setBranchForm({ ...branchForm, name: e.target.value })} required placeholder="Branch name" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              <input type="text" value={branchForm.code} onChange={e => setBranchForm({ ...branchForm, code: e.target.value })} required placeholder="Branch code (e.g., BR-001)" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              <input type="text" value={branchForm.address} onChange={e => setBranchForm({ ...branchForm, address: e.target.value })} required placeholder="Address" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              <div className="grid grid-cols-2 gap-3">
                <input type="text" value={branchForm.city} onChange={e => setBranchForm({ ...branchForm, city: e.target.value })} required placeholder="City" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                <input type="text" value={branchForm.phone} onChange={e => setBranchForm({ ...branchForm, phone: e.target.value })} placeholder="Phone" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Create</button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Team Member Modal */}
      {showTeamForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Add Team Member</h2>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <input type="text" value={teamForm.name} onChange={e => setTeamForm({ ...teamForm, name: e.target.value })} required placeholder="Full name" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              <input type="email" value={teamForm.email} onChange={e => setTeamForm({ ...teamForm, email: e.target.value })} required placeholder="Email" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              <input type="tel" value={teamForm.phone} onChange={e => setTeamForm({ ...teamForm, phone: e.target.value })} required placeholder="Phone" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              <div className="grid grid-cols-2 gap-3">
                <select value={teamForm.role} onChange={e => setTeamForm({ ...teamForm, role: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <option value="doctor">Doctor</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
                <select value={teamForm.specialty} onChange={e => setTeamForm({ ...teamForm, specialty: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  {['general', 'dental', 'eye', 'ortho', 'pediatric', 'dermatology', 'ent', 'cardiology', 'gynecology', 'other'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Add Member</button>
                <button type="button" onClick={() => setShowTeamForm(false)} className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
