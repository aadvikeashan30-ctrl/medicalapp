import React, { useState, useEffect } from 'react';
import { FiSend, FiPlus, FiStar, FiBarChart2, FiMessageSquare, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('campaigns');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', type: 'promotional', channel: 'whatsapp', message: '',
    audience: { type: 'all' }
  });

  useEffect(() => { fetchData(); }, [tab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (tab === 'campaigns') {
        const { data } = await api.get('/campaigns');
        setCampaigns(data.campaigns || []);
      } else {
        const { data } = await api.get('/campaigns/reviews/stats');
        setReviewStats(data);
      }
    } catch (err) { /* ignore */ }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/campaigns', form);
      toast.success('Campaign created');
      setShowForm(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create');
    }
  };

  const handleSend = async (id) => {
    try {
      await api.post(`/campaigns/${id}/send`);
      toast.success('Campaign sent');
      fetchData();
    } catch (err) {
      toast.error('Failed to send');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiSend className="text-cyan-600" /> Marketing & Reviews
          </h1>
          <p className="text-gray-500 text-sm mt-1">WhatsApp campaigns & Google review automation</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-cyan-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-cyan-700">
          <FiPlus /> New Campaign
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab('campaigns')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${tab === 'campaigns' ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400'}`}><FiMessageSquare size={14} /> Campaigns</button>
        <button onClick={() => setTab('reviews')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${tab === 'reviews' ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400'}`}><FiStar size={14} /> Google Reviews</button>
      </div>

      {/* Campaigns List */}
      {tab === 'campaigns' && (
        <div className="space-y-3">
          {loading ? <div className="text-center py-12 text-gray-500">Loading...</div> : campaigns.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border"><FiSend className="mx-auto text-4xl text-gray-300 mb-3" /><p className="text-gray-500">No campaigns yet</p></div>
          ) : campaigns.map(c => (
            <div key={c._id} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{c.name}</h3>
                  <div className="flex gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-cyan-50 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300 text-xs rounded-full">{c.type}</span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 text-xs rounded-full">{c.channel}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">{c.message}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    c.status === 'sent' ? 'bg-green-100 text-green-700' :
                    c.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                    c.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                    c.status === 'sending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>{c.status}</span>
                  {c.totalRecipients > 0 && <p className="text-xs text-gray-400 mt-1">{c.totalRecipients} recipients</p>}
                </div>
              </div>
              {c.status === 'draft' && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => handleSend(c._id)} className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-lg hover:bg-green-200">Send Now</button>
                </div>
              )}
              {c.status === 'sent' && (
                <div className="mt-3 flex gap-4 text-xs text-gray-500">
                  <span>Delivered: {c.delivered || 0}</span>
                  <span>Read: {c.read || 0}</span>
                  <span>Replied: {c.replied || 0}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Review Stats */}
      {tab === 'reviews' && (
        <div className="space-y-4">
          {reviewStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{reviewStats.totalRequests}</p>
                <p className="text-xs text-gray-500">Total Requests</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border text-center">
                <p className="text-2xl font-bold text-green-600">{reviewStats.reviewedRequests}</p>
                <p className="text-xs text-gray-500">Reviews Received</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border text-center">
                <p className="text-2xl font-bold text-amber-600">{reviewStats.responseRate}%</p>
                <p className="text-xs text-gray-500">Response Rate</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border text-center">
                <p className="text-2xl font-bold text-yellow-500">{reviewStats.averageRating}</p>
                <p className="text-xs text-gray-500">Avg Rating</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Campaign Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-lg w-full">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Create Campaign</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Campaign Name</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    {['promotional', 'reminder', 'follow-up', 'health-tip', 'birthday', 'festival', 'custom'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Channel</label>
                  <select value={form.channel} onChange={e => setForm({ ...form, channel: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    {['whatsapp', 'sms', 'email', 'push'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
                <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={4} required placeholder="Hello {{patient_name}}, ..." className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-cyan-600 text-white py-2 rounded-lg hover:bg-cyan-700">Create</button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
