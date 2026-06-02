import React, { useState, useEffect } from 'react';
import { FiActivity, FiAlertTriangle, FiCheckCircle, FiShield } from 'react-icons/fi';
import api from '../utils/api';

const riskColors = {
  low: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', bar: 'bg-emerald-500' },
  moderate: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', bar: 'bg-amber-500' },
  high: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', bar: 'bg-orange-500' },
  critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', bar: 'bg-red-500' }
};

export default function AIPatientRisk({ patient }) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Auto-trigger assessment on mount
  useEffect(() => {
    if (!patient) return;
    assessRisk();
  }, [patient]);

  const assessRisk = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/ai/risk-score', {
        patient: {
          name: patient?.name,
          age: patient?.age,
          gender: patient?.gender,
          bloodGroup: patient?.bloodGroup,
          allergies: patient?.allergies
        },
        visits: patient?.totalVisits || 0,
        conditions: patient?.medicalHistory || []
      });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Risk assessment failed');
    } finally {
      setLoading(false);
    }
  };

  if (!patient) return null;

  const colors = riskColors[result?.riskLevel] || riskColors.moderate;
  const scorePercent = result ? (result.riskScore / 10) * 100 : 0;

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center gap-3 p-4 bg-violet-50 rounded-xl border border-violet-100 animate-pulse">
        <div className="w-8 h-8 rounded-lg bg-violet-200 animate-spin flex items-center justify-center">
          <FiShield className="text-violet-600 text-sm" />
        </div>
        <div>
          <p className="text-sm font-medium text-violet-700">Analyzing patient risk...</p>
          <p className="text-xs text-violet-500">AI is evaluating health factors</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-100">
        <FiAlertTriangle /> {error}
        <button onClick={assessRisk} className="ml-auto text-xs font-semibold text-red-700 hover:underline">Retry</button>
      </div>
    );
  }

  // Result
  if (!result) return null;

  return (
    <div className={`${colors.bg} ${colors.border} border rounded-xl p-4 space-y-3 animate-fade-in`}>
      {/* Score header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl ${colors.bg} border-2 ${colors.border} flex items-center justify-center`}>
            <span className={`text-lg font-bold ${colors.text}`}>{result.riskScore}</span>
          </div>
          <div>
            <p className={`font-bold ${colors.text} capitalize text-sm`}>{result.riskLevel} Risk</p>
            <p className="text-xs text-gray-500">Score: {result.riskScore}/10</p>
          </div>
        </div>
        <button onClick={assessRisk} className="text-xs text-violet-600 hover:text-violet-700 font-semibold bg-violet-50 px-2 py-1 rounded-md hover:bg-violet-100 transition-colors">
          Reassess
        </button>
      </div>

      {/* Score bar */}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${colors.bar} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${scorePercent}%` }}
        />
      </div>

      {/* Risk factors */}
      {result.factors?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
            <FiAlertTriangle className="text-amber-500 text-xs" /> Risk Factors
          </p>
          <div className="flex flex-wrap gap-1.5">
            {result.factors.map((f, i) => (
              <span key={i} className="text-xs bg-white px-2 py-1 rounded-md border border-gray-200 text-gray-700">
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {result.recommendations?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
            <FiCheckCircle className="text-emerald-500 text-xs" /> Recommendations
          </p>
          <div className="space-y-1">
            {result.recommendations.map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-gray-700">
                <span className="w-1 h-1 bg-violet-400 rounded-full mt-1.5 flex-shrink-0" />
                {r}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No-show + Follow-up */}
      <div className="flex items-center gap-3 text-xs">
        {result.predictedNoShowProbability > 0 && (
          <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-gray-200 text-gray-600">
            <FiActivity className="text-blue-500" /> No-show: {result.predictedNoShowProbability}%
          </span>
        )}
        {result.suggestedFollowUp && (
          <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-gray-200 text-gray-600">
            Follow-up: {result.suggestedFollowUp}
          </span>
        )}
      </div>

      <p className="text-[10px] text-gray-400 italic">
        AI assessment ({result.provider || 'demo'}) — clinical decision support only
      </p>
    </div>
  );
}
