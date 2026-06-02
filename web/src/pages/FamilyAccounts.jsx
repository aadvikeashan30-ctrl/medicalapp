import React, { useState, useEffect } from 'react';
import { FiUsers, FiPlus, FiSearch, FiUserPlus, FiTrash2, FiEdit, FiPhone } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function FamilyAccounts() {
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ familyName: '', primaryPhone: '', primaryEmail: '' });
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [addMemberForm, setAddMemberForm] = useState({ patientId: '', relationship: 'self' });

  const fetchFamilies = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/family', { params: { search: search || undefined } });
      setFamilies(data.families || []);
    } catch (err) {
      toast.error('Failed to load family accounts');
    }
    setLoading(false);
  };

  useEffect(() => { fetchFamilies(); }, [search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/family', form);
      toast.success('Family account created');
      setShowForm(false);
      setForm({ familyName: '', primaryPhone: '', primaryEmail: '' });
      fetchFamilies();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create');
    }
  };

  const handleAddMember = async (familyId) => {
    try {
      const { data } = await api.post(`/family/${familyId}/members`, addMemberForm);
      toast.success('Member added');
      setSelectedFamily(data);
      setAddMemberForm({ patientId: '', relationship: 'self' });
      fetchFamilies();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (familyId, patientId) => {
    try {
      await api.delete(`/family/${familyId}/members/${patientId}`);
      toast.success('Member removed');
      fetchFamilies();
      if (selectedFamily?._id === familyId) {
        const { data } = await api.get(`/family/${familyId}`);
        setSelectedFamily(data);
      }
    } catch (err) {
      toast.error('Failed to remove member');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this family account?')) return;
    try {
      await api.delete(`/family/${id}`);
      toast.success('Family account deleted');
      if (selectedFamily?._id === id) setSelectedFamily(null);
      fetchFamilies();
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
            <FiUsers className="text-green-600" /> Family Accounts
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage family groups and linked patients</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition">
          <FiPlus /> New Family
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <FiSearch className="absolute left-3 top-3 text-gray-400" />
        <input
          type="text" placeholder="Search by family name or phone..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        />
      </div>

      {/* Family List & Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : families.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
              <FiUsers className="mx-auto text-4xl text-gray-300 mb-3" />
              <p className="text-gray-500">No family accounts yet</p>
            </div>
          ) : (
            families.map(fam => (
              <div key={fam._id}
                onClick={() => setSelectedFamily(fam)}
                className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border cursor-pointer transition hover:shadow-md ${selectedFamily?._id === fam._id ? 'border-green-500 ring-1 ring-green-500' : 'border-gray-100 dark:border-gray-700'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{fam.familyName}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><FiPhone size={12} /> {fam.primaryPhone}</p>
                    <p className="text-xs text-gray-400 mt-1">{fam.members?.length || 0} members</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(fam._id); }} className="text-red-400 hover:text-red-600 p-1"><FiTrash2 size={16} /></button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-1">
          {selectedFamily ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 sticky top-4">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">{selectedFamily.familyName}</h3>
              <p className="text-sm text-gray-500">{selectedFamily.primaryPhone}</p>

              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Members</h4>
                <div className="space-y-2">
                  {selectedFamily.members?.map(m => (
                    <div key={m.patientId?._id || m.patientId} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{m.patientId?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500 capitalize">{m.relationship}</p>
                      </div>
                      <button onClick={() => handleRemoveMember(selectedFamily._id, m.patientId?._id || m.patientId)} className="text-red-400 hover:text-red-600"><FiTrash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Member */}
              <div className="mt-4 pt-4 border-t dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Add Member</h4>
                <input type="text" placeholder="Patient ID" value={addMemberForm.patientId} onChange={e => setAddMemberForm({ ...addMemberForm, patientId: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm mb-2" />
                <select value={addMemberForm.relationship} onChange={e => setAddMemberForm({ ...addMemberForm, relationship: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm mb-2">
                  {['self', 'spouse', 'child', 'parent', 'sibling', 'grandparent', 'other'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <button onClick={() => handleAddMember(selectedFamily._id)} className="w-full bg-green-600 text-white py-2 rounded-lg text-sm hover:bg-green-700 flex items-center justify-center gap-1">
                  <FiUserPlus size={14} /> Add Member
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 text-center border border-dashed border-gray-300 dark:border-gray-600">
              <FiUsers className="mx-auto text-3xl text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">Select a family to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Create Family Account</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Family Name</label>
                <input type="text" value={form.familyName} onChange={e => setForm({ ...form, familyName: e.target.value })} required className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="e.g., Sharma Family" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Primary Phone</label>
                <input type="tel" value={form.primaryPhone} onChange={e => setForm({ ...form, primaryPhone: e.target.value })} required className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email (optional)</label>
                <input type="email" value={form.primaryEmail} onChange={e => setForm({ ...form, primaryEmail: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">Create</button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
