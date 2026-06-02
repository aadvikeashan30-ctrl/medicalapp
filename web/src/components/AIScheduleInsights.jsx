import React, { useState } from 'react';
import { FiClock, FiTrendingUp, FiAlertCircle, FiLoader, FiCalendar } from 'react-icons/fi';
import { FaRobot } from 'react-icons/fa';
import api from '../utils/api';

export default function AIScheduleInsights() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const analyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/ai/optimize-schedule', {});
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  if (!result) {
    return (
      <button
        onClick={analyze}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl text-blue-700 font-medium text-sm hover:from-blue-100 hover:to-indigo-100 transition-all disabled:opacity-50"
      >
        {loading ? (
          <><FiLoader className="animate-spin" /> Analyzing schedule...</>
        ) : (
          <><FaRobot /> <FiTrendingUp /> AI Schedule Optimization</>
        )}
      </button>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4 space-y-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-blue-800">
          <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
            <FaRobot className="text-white text-xs" />
          </div>
          Smart Schedule Insights
        </div>
        <button onClick={analyze} disabled={loading} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</div>
      )}

      {/* Predicted load */}
      {result.insights && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-3 border border-blue-100">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <FiCalendar className="text-sm" />
              <span className="text-xs font-semibold">Predicted Load</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{result.insights.predictedLoad}</p>
            <p className="text-xs text-gray-500">patients today</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-blue-100">
            <div className="flex items-center gap-2 text-orange-600 mb-1">
              <FiAlertCircle className="text-sm" />
              <span className="text-xs font-semibold">No-show Risk</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{result.insights.noShowRisk?.length || 0}</p>
            <p className="text-xs text-gray-500">patients flagged</p>
          </div>
        </div>
      )}

      {/* Peak hours */}
      {result.insights?.peakHours?.length > 0 && (
        <div className="bg-white rounded-xl p-3 border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <FiClock className="text-purple-500" />
            <span className="text-xs font-semibold text-gray-600">Peak Hours</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.insights.peakHours.map((h, i) => (
              <span key={i} className="text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg font-medium">
                {h}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Optimizations */}
      {result.optimizations?.length > 0 && (
        <div className="bg-white rounded-xl p-3 border border-blue-100">
          <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
            <FiTrendingUp className="text-emerald-500" /> Suggestions
          </p>
          <div className="space-y-1.5">
            {result.optimizations.map((o, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 flex-shrink-0" />
                {o}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emergency buffer slots */}
      {result.suggestedSlots?.emergencyBuffer?.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 rounded-xl px-3 py-2 border border-blue-100">
          <FiAlertCircle />
          Keep emergency buffers at: <strong>{result.suggestedSlots.emergencyBuffer.join(', ')}</strong>
        </div>
      )}

      <p className="text-[11px] text-gray-400 italic">
        ⚠️ AI insights ({result.provider || 'demo'}) — based on appointment patterns.
      </p>
    </div>
  );
}
