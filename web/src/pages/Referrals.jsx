import React, { useState, useEffect } from 'react';
import { FiGift, FiPlus, FiSettings, FiUsers, FiTrendingUp, FiPercent } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function Referrals() {
  const [referrals, setReferrals] = useState([]);
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ referrerId: '', referredName: '', referredPhone: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [refRes, statsRes, settingsRes] = await Promise.all([
        api.get('/referrals'),
        api.get('/referrals/stats'),
        api.get('/referrals/settings')
      ]);
      setReferrals(refRes.data.referrals || []);
      setStats(statsRes.data);
      setSettings(settingsRes.data);
    } catch (err) { /* ignore */ }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/referrals', form);
      toast.success('Referral created');
      setShowForm(false);
      setForm({ referrerId: '', referredName: '', referredPhone: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create');
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    try {
      await api.put('/referrals/settings', settings);
      toast.success('Settings updated');
      setShowSettings(false);
    } catch (err) {
      toast.error('Failed to update settings');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiGift className="text-pink-600" /> Referral Program
          </h1>
          <p className="text-gray-500 text-sm mt-1">Patient referral tracking and reward management</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowSettings(true)} className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200">
            <FiSettings size={14} /> Settings
          </button>
          <button onClick={() => setShowForm(true)} className="bg-pink-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-pink-700">
            <FiPlus /> New Referral
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalReferrals}</p>
            <p className="text-xs text-gray-500">Total Referrals</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border text-center">
            <p className="text-2xl font-bold text-green-600">{stats.successfulReferrals}</p>
            <p className="text-xs text-gray-500">Successful</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border text-center">
            <p className="text-2xl font-bold text-pink-600">{stats.conversionRate}%</p>
            <p className="text-xs text-gray-500">Conversion Rate</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border text-center">
            <p className="text-2xl font-bold text-amber-600">₹{stats.totalRewardsGiven || 0}</p>
            <p className="text-xs text-gray-500">Rewards Given</p>
          </div>
        </div>
      )}

      {/* Referrals List */}
      <div className="space-y-3">
        {loading ? <div className="text-center py-12 text-gray-500">Loading...</div> : referrals.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border"><FiGift className="mx-auto text-4xl text-gray-300 mb-3" /><p className="text-gray-500">No referrals yet</p></div>
        ) : referrals.map(ref => (
          <div key={ref._id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{ref.referredName}</p>
                <p className="text-sm text-gray-500">{ref.referredPhone}</p>
                <p className="text-xs text-gray-400 mt-1">Referred by: {ref.referrerId?.name || ref.referrerId}</p>
                <p className="text-xs text-gray-400">Code: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{ref.referralCode}</code></p>
              </div>
              <div className="text-right">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  ref.status === 'rewarded' ? 'bg-green-100 text-green-700' :
                  ref.status === 'visited' ? 'bg-blue-100 text-blue-700' :
                  ref.status === 'registered' ? 'bg-yellow-100 text-yellow-700' :
                  ref.status === 'expired' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>{ref.status}</span>
                <p className="text-xs text-gray-400 mt-1">{new Date(ref.createdAt).toLocaleDateString('en-IN')}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Create Referral</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Referrer Patient ID</label>
                <input type="text" value={form.referrerId} onChange={e => setForm({ ...form, referrerId: e.target.value })} required className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Referred Person Name</label>
                <input type="text" value={form.referredName} onChange={e => setForm({ ...form, referredName: e.target.value })} required className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                <input type="tel" value={form.referredPhone} onChange={e => setForm({ ...form, referredPhone: e.target.value })} required className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-pink-600 text-white py-2 rounded-lg hover:bg-pink-700">Create</button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && settings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Referral Settings</h2>
            <form onSubmit={handleUpdateSettings} className="space-y-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={settings.isActive} onChange={e => setSettings({ ...settings, isActive: e.target.checked })} className="rounded" /> Program Active
              </label>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Referrer Reward Value (%)</label>
                <input type="number" value={settings.referrerReward?.value || 10} onChange={e => setSettings({ ...settings, referrerReward: { ...settings.referrerReward, value: +e.target.value } })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Referred Reward Value (%)</label>
                <input type="number" value={settings.referredReward?.value || 10} onChange={e => setSettings({ ...settings, referredReward: { ...settings.referredReward, value: +e.target.value } })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiry Days</label>
                <input type="number" value={settings.expiryDays || 30} onChange={e => setSettings({ ...settings, expiryDays: +e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-pink-600 text-white py-2 rounded-lg hover:bg-pink-700">Save Settings</button>
                <button type="button" onClick={() => setShowSettings(false)} className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
