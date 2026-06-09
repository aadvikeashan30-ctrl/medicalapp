import React, { useState } from 'react';
import {
  FiSunrise, FiSunset, FiCpu, FiVideo, FiPhone, FiUser, FiClock, FiZap, FiArrowRight
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';

const modeIcon = (m) => (m === 'video' ? FiVideo : m === 'phone' ? FiPhone : FiUser);

function Block({ data, tone }) {
  const Icon = tone === 'am' ? FiSunrise : FiSunset;
  const grad = tone === 'am' ? 'from-amber-400 to-orange-500' : 'from-indigo-500 to-violet-600';
  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center`}><Icon className="text-white" /></div>
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">{data.label}</h3>
          <p className="text-xs text-gray-500">{data.count} appointment{data.count !== 1 ? 's' : ''}</p>
        </div>
      </div>
      {data.items.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">Nothing scheduled in this block.</p>
      ) : (
        <div className="space-y-2">
          {data.items.map((it, i) => {
            const M = modeIcon(it.mode);
            return (
              <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-200 w-14">{it.suggestedSlot}</span>
                <M className="text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{it.patient || 'Patient'}</p>
                  <p className="text-xs text-gray-400 capitalize">{it.type} · {it.mode} · {it.duration}m</p>
                </div>
                {it.currentSlot && it.currentSlot !== it.suggestedSlot && (
                  <span className="text-[11px] text-gray-400 flex items-center gap-1">{it.currentSlot} <FiArrowRight className="text-[10px]" /> {it.suggestedSlot}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


export default function SmartScheduler() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);

  const generate = async () => {
    setLoading(true);
    setPlan(null);
    try {
      const res = await api.post('/doctor/slot-plan', { date });
      setPlan(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-enter space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-indigo-600 flex items-center justify-center">
              <FiZap className="text-white text-lg" />
            </div>
            Smart Day Planner
          </h1>
          <p className="text-sm text-gray-500 mt-1">Cluster short virtual follow-ups in the morning, complex in-person visits in the afternoon — to protect your energy</p>
        </div>
        <div className="flex gap-2">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field !py-2 text-sm" />
          <button onClick={generate} disabled={loading} className="btn-primary flex items-center gap-2 whitespace-nowrap"><FiCpu /> {loading ? 'Planning...' : 'Generate Plan'}</button>
        </div>
      </div>

      {!plan ? (
        <div className="card flex flex-col items-center justify-center text-center py-16 text-gray-400">
          <FiClock className="text-4xl mb-3 text-amber-300" />
          <p className="text-sm">Pick a date and generate an energy-optimized day plan from your booked appointments.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Block data={plan.morningBlock} tone="am" />
            <Block data={plan.afternoonBlock} tone="pm" />
          </div>
          {(plan.rationale || []).length > 0 && (
            <div className="card">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Why this layout</h3>
              <ul className="space-y-1.5">
                {plan.rationale.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300"><FiZap className="text-amber-500 mt-0.5 flex-shrink-0" /> {r}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
