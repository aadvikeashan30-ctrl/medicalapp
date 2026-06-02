import React, { useState, useEffect } from 'react';
import { FiAward, FiPlus, FiUsers, FiTrendingUp, FiAlertCircle, FiTrash2, FiEdit } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function Memberships() {
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('plans');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    planName: '', description: '', duration: 12, price: 0,
    freeConsultations: 0, discountPercentage: 0, freeLabTests: 0,
    priorityBooking: false, telemedicineIncluded: false, isPopular: false
  });

  useEffect(() => { fetchData(); }, [tab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === 'plans') {
        const { data } = await api.get('/membership/plans');
        setPlans(data || []);
      } else if (tab === 'subscribers') {
        const { data } = await api.get('/membership/subscriptions');
        setSubscriptions(data.subscriptions || []);
      }
      const { data: st } = await api.get('/membership/stats');
      setStats(st);
    } catch (err) { /* ignore */ }
    setLoading(false);
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    try {
      await api.post('/membership/plans', form);
      toast.success('Plan created');
      setShowForm(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create');
    }
  };

  const handleDeletePlan = async (id) => {
    if (!window.confirm('Delete this plan?')) return;
    try {
      await api.delete(`/membership/plans/${id}`);
      toast.success('Plan deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiAward className="text-amber-600" /> Membership Plans
          </h1>
          <p className="text-gray-500 text-sm mt-1">Create and manage patient membership programs</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-amber-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-amber-700">
          <FiPlus /> New Plan
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg"><FiUsers className="text-amber-600" /></div>
              <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeMembers || 0}</p><p className="text-xs text-gray-500">Active Members</p></div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg"><FiTrendingUp className="text-green-600" /></div>
              <div><p className="text-2xl font-bold text-gray-900 dark:text-white">₹{(stats.totalRevenue || 0).toLocaleString()}</p><p className="text-xs text-gray-500">Total Revenue</p></div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg"><FiAlertCircle className="text-red-600" /></div>
              <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.expiringSoon || 0}</p><p className="text-xs text-gray-500">Expiring Soon</p></div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {['plans', 'subscribers'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${tab === t ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400'}`}>{t}</button>
        ))}
      </div>

      {/* Plans */}
      {tab === 'plans' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? <div className="col-span-3 text-center py-12 text-gray-500">Loading...</div> : plans.length === 0 ? (
            <div className="col-span-3 text-center py-12 bg-white dark:bg-gray-800 rounded-xl border"><FiAward className="mx-auto text-4xl text-gray-300 mb-3" /><p className="text-gray-500">No membership plans yet</p></div>
          ) : plans.map(plan => (
            <div key={plan._id} className={`bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border ${plan.isPopular ? 'border-amber-400 ring-2 ring-amber-200' : 'border-gray-100 dark:border-gray-700'} relative`}>
              {plan.isPopular && <span className="absolute -top-2 right-4 bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">Popular</span>}
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">{plan.planName}</h3>
              <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
              <p className="text-3xl font-bold text-amber-600 mt-3">₹{plan.price}<span className="text-sm font-normal text-gray-400">/{plan.duration} months</span></p>
              <ul className="mt-4 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                {plan.freeConsultations > 0 && <li className="flex items-center gap-2"><FiCheck className="text-green-500" />{plan.freeConsultations} free consultations</li>}
                {plan.discountPercentage > 0 && <li className="flex items-center gap-2"><FiCheck className="text-green-500" />{plan.discountPercentage}% discount</li>}
                {plan.freeLabTests > 0 && <li className="flex items-center gap-2"><FiCheck className="text-green-500" />{plan.freeLabTests} free lab tests</li>}
                {plan.priorityBooking && <li className="flex items-center gap-2"><FiCheck className="text-green-500" />Priority booking</li>}
                {plan.telemedicineIncluded && <li className="flex items-center gap-2"><FiCheck className="text-green-500" />Telemedicine included</li>}
              </ul>
              <button onClick={() => handleDeletePlan(plan._id)} className="mt-4 text-red-400 hover:text-red-600 text-sm flex items-center gap-1"><FiTrash2 size={12} /> Delete</button>
            </div>
          ))}
        </div>
      )}

      {/* Subscribers */}
      {tab === 'subscribers' && (
        <div className="space-y-3">
          {loading ? <div className="text-center py-12 text-gray-500">Loading...</div> : subscriptions.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border"><p className="text-gray-500">No subscribers yet</p></div>
          ) : subscriptions.map(sub => (
            <div key={sub._id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{sub.patientId?.name || 'Patient'}</p>
                <p className="text-sm text-gray-500">{sub.planId?.planName} | {sub.membershipNo}</p>
              </div>
              <div className="text-right">
                <span className={`text-xs px-2 py-0.5 rounded-full ${sub.status === 'active' ? 'bg-green-100 text-green-700' : sub.status === 'expired' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{sub.status}</span>
                <p className="text-xs text-gray-400 mt-1">Expires: {new Date(sub.endDate).toLocaleDateString('en-IN')}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Create Membership Plan</h2>
            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plan Name</label>
                  <input type="text" value={form.planName} onChange={e => setForm({ ...form, planName: e.target.value })} required className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duration (months)</label>
                  <input type="number" value={form.duration} onChange={e => setForm({ ...form, duration: +e.target.value })} min={1} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price (₹)</label>
                  <input type="number" value={form.price} onChange={e => setForm({ ...form, price: +e.target.value })} min={0} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Free Consultations</label>
                  <input type="number" value={form.freeConsultations} onChange={e => setForm({ ...form, freeConsultations: +e.target.value })} min={0} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Discount %</label>
                  <input type="number" value={form.discountPercentage} onChange={e => setForm({ ...form, discountPercentage: +e.target.value })} min={0} max={100} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div className="col-span-2 flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.priorityBooking} onChange={e => setForm({ ...form, priorityBooking: e.target.checked })} className="rounded" /> Priority Booking</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.telemedicineIncluded} onChange={e => setForm({ ...form, telemedicineIncluded: e.target.checked })} className="rounded" /> Telemedicine</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isPopular} onChange={e => setForm({ ...form, isPopular: e.target.checked })} className="rounded" /> Mark as Popular</label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700">Create Plan</button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function FiCheck(props) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;
}
