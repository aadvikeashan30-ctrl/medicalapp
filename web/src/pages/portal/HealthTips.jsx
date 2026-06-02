import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiHeart, FiSun, FiMoon, FiDroplet, FiActivity,
  FiRefreshCw, FiShare2, FiBookOpen, FiCoffee, FiZap
} from 'react-icons/fi';
import { FaHeartbeat, FaAppleAlt, FaBrain, FaPills, FaRunning, FaLeaf } from 'react-icons/fa';
import axios from 'axios';
const api = axios.create({ baseURL: '/api' });

const categoryConfig = {
  nutrition: { icon: FaAppleAlt, color: 'from-green-500 to-emerald-600', bg: 'bg-green-50', text: 'text-green-700' },
  exercise: { icon: FaRunning, color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50', text: 'text-blue-700' },
  sleep: { icon: FiMoon, color: 'from-indigo-500 to-violet-600', bg: 'bg-indigo-50', text: 'text-indigo-700' },
  mental: { icon: FaBrain, color: 'from-purple-500 to-pink-600', bg: 'bg-purple-50', text: 'text-purple-700' },
  medication: { icon: FaPills, color: 'from-red-500 to-rose-600', bg: 'bg-red-50', text: 'text-red-700' },
  lifestyle: { icon: FaLeaf, color: 'from-teal-500 to-cyan-600', bg: 'bg-teal-50', text: 'text-teal-700' },
  prevention: { icon: FiHeart, color: 'from-rose-500 to-pink-600', bg: 'bg-rose-50', text: 'text-rose-700' }
};

const CONDITIONS = [
  { value: '', label: 'General Wellness' },
  { value: 'diabetes', label: 'Diabetes' },
  { value: 'hypertension', label: 'High Blood Pressure' },
  { value: 'heart', label: 'Heart Health' },
  { value: 'thyroid', label: 'Thyroid' },
  { value: 'asthma', label: 'Asthma / Respiratory' },
  { value: 'arthritis', label: 'Joint Pain / Arthritis' },
  { value: 'pregnancy', label: 'Pregnancy Care' },
  { value: 'weight', label: 'Weight Management' },
  { value: 'skin', label: 'Skin Health' },
  { value: 'digestion', label: 'Digestion' },
  { value: 'immunity', label: 'Immunity Boost' }
];

export default function HealthTips() {
  const [condition, setCondition] = useState('');
  const [loading, setLoading] = useState(true);
  const [tips, setTips] = useState(null);
  const [error, setError] = useState(null);

  const fetchTips = async (cond) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (cond) params.set('condition', cond);
      const { data } = await api.get(`/portal/health-tips?${params.toString()}`);
      setTips(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTips(condition); }, []);

  const handleConditionChange = (val) => {
    setCondition(val);
    fetchTips(val);
  };

  const shareTip = (tip) => {
    const text = encodeURIComponent(`💡 Health Tip: ${tip.title}\n\n${tip.content}\n\n— via DocClinic Pro`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 to-white dark:from-gray-900 dark:to-gray-800">
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
              <FaHeartbeat className="text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">DocClinic Pro</span>
          </Link>
          <div className="flex gap-2">
            <Link to="/my-records" className="btn-secondary text-sm !py-2">My Records</Link>
            <Link to="/book" className="btn-primary text-sm !py-2">Book</Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl">
            <FiHeart className="text-white text-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Daily Health Tips</h1>
          <p className="text-gray-500 max-w-md mx-auto">Personalized AI-powered health advice to keep you healthy every day</p>
        </div>

        {/* Condition filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {CONDITIONS.map(c => (
            <button
              key={c.value}
              onClick={() => handleConditionChange(c.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                condition === c.value
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 scale-105'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-emerald-300 hover:bg-emerald-50'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="text-center py-16">
            <FiRefreshCw className="mx-auto text-3xl text-emerald-500 animate-spin mb-3" />
            <p className="text-gray-500">Generating personalized tips...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-10">
            <p className="text-red-600 mb-3">{error}</p>
            <button onClick={() => fetchTips(condition)} className="btn-primary text-sm">Retry</button>
          </div>
        )}

        {tips && !loading && (
          <div className="space-y-6 animate-fade-in">
            {/* Daily Fact */}
            {tips.dailyFact && (
              <div className="card bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-100 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <FiZap className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase mb-1">Did You Know?</p>
                    <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">{tips.dailyFact}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Tips Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(tips.tips || []).map((tip, idx) => {
                const cat = categoryConfig[tip.category] || categoryConfig.lifestyle;
                const Icon = cat.icon;
                return (
                  <div
                    key={idx}
                    className="card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
                    style={{ animationDelay: `${idx * 80}ms` }}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                        <Icon className="text-white text-lg" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold text-gray-900 dark:text-white text-sm">{tip.title}</h3>
                          <button
                            onClick={() => shareTip(tip)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 opacity-0 group-hover:opacity-100 transition-all"
                            title="Share on WhatsApp"
                          >
                            <FiShare2 className="text-sm" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{tip.content}</p>
                        <span className={`inline-block mt-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${cat.bg} ${cat.text}`}>
                          {tip.category}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reminder */}
            {tips.reminder && (
              <div className="card bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-100 dark:border-blue-800">
                <div className="flex items-center gap-3">
                  <FiActivity className="text-blue-600 text-xl flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase mb-0.5">Today's Reminder</p>
                    <p className="text-sm text-blue-800 dark:text-blue-300">{tips.reminder}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Refresh + CTA */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <button onClick={() => fetchTips(condition)} className="btn-secondary flex items-center justify-center gap-2">
                <FiRefreshCw /> Get New Tips
              </button>
              <Link to="/symptom-checker" className="btn-primary flex items-center justify-center gap-2">
                <FiActivity /> Check Symptoms
              </Link>
            </div>

            <p className="text-center text-xs text-gray-400 mt-4">
              AI-generated • {tips.provider || 'DocClinic AI'} • Not medical advice
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
