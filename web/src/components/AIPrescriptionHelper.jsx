import React, { useState } from 'react';
import { FiZap, FiAlertTriangle, FiCheck, FiLoader, FiPlus } from 'react-icons/fi';
import { FaRobot } from 'react-icons/fa';
import api from '../utils/api';

export default function AIPrescriptionHelper({ patientAge, patientAllergies, onAddMedicines }) {
  const [diagnosis, setDiagnosis] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const getSuggestions = async () => {
    if (!diagnosis.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data } = await api.post('/ai/prescribe', {
        diagnosis: diagnosis.trim(),
        age: patientAge,
        allergies: patientAllergies || []
      });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'AI suggestion failed');
    } finally {
      setLoading(false);
    }
  };

  const applyAll = () => {
    if (!result?.medicines?.length || !onAddMedicines) return;
    onAddMedicines(result.medicines.map((m) => ({
      name: m.name + (m.dosage ? ` ${m.dosage}` : ''),
      dosage: m.dosage || '',
      frequency: m.frequency || '',
      duration: m.duration || '',
      timing: m.timing || 'after-food',
      notes: m.notes || ''
    })));
  };

  const applySingle = (med) => {
    if (!onAddMedicines) return;
    onAddMedicines([{
      name: med.name + (med.dosage ? ` ${med.dosage}` : ''),
      dosage: med.dosage || '',
      frequency: med.frequency || '',
      duration: med.duration || '',
      timing: med.timing || 'after-food',
      notes: med.notes || ''
    }]);
  };

  return (
    <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100 rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-violet-800">
        <div className="w-6 h-6 bg-violet-600 rounded-lg flex items-center justify-center">
          <FaRobot className="text-white text-xs" />
        </div>
        AI Prescription Assistant
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && getSuggestions()}
          placeholder="Enter diagnosis (e.g., Viral Fever, Hypertension)..."
          className="flex-1 px-3 py-2 text-sm bg-white border border-violet-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-300 placeholder:text-gray-400"
        />
        <button
          onClick={getSuggestions}
          disabled={loading || !diagnosis.trim()}
          className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium rounded-xl disabled:opacity-40 hover:shadow-lg transition-all flex items-center gap-1.5"
        >
          {loading ? <FiLoader className="animate-spin" /> : <FiZap />}
          {loading ? 'Thinking...' : 'Suggest'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">
          <FiAlertTriangle /> {error}
        </div>
      )}

      {result && (
        <div className="space-y-3 animate-fade-in">
          {/* Medicines */}
          {result.medicines?.length > 0 && (
            <div className="bg-white rounded-xl p-3 border border-violet-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-600 uppercase">Suggested Medicines</span>
                <button
                  onClick={applyAll}
                  className="text-xs bg-violet-100 text-violet-700 px-2.5 py-1 rounded-lg hover:bg-violet-200 font-medium flex items-center gap-1"
                >
                  <FiPlus className="text-[10px]" /> Add All
                </button>
              </div>
              <div className="space-y-2">
                {result.medicines.map((med, i) => (
                  <div key={i} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-lg hover:bg-violet-50 transition-colors">
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">{med.name}</span>
                      {med.dosage && <span className="text-gray-500 ml-1">{med.dosage}</span>}
                      <div className="text-xs text-gray-500 mt-0.5">
                        {[med.frequency, med.duration, med.timing].filter(Boolean).join(' • ')}
                      </div>
                    </div>
                    <button
                      onClick={() => applySingle(med)}
                      className="p-1.5 text-violet-600 hover:bg-violet-100 rounded-lg"
                      aria-label="Add this medicine"
                    >
                      <FiPlus className="text-sm" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {result.warnings?.length > 0 && (
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
              <div className="text-xs font-semibold text-amber-700 uppercase mb-1.5 flex items-center gap-1">
                <FiAlertTriangle /> Warnings
              </div>
              {result.warnings.map((w, i) => (
                <p key={i} className="text-sm text-amber-800">• {w}</p>
              ))}
            </div>
          )}

          {/* Advice */}
          {result.advice && (
            <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
              <div className="text-xs font-semibold text-emerald-700 uppercase mb-1 flex items-center gap-1">
                <FiCheck /> Advice
              </div>
              <p className="text-sm text-emerald-800">{result.advice}</p>
            </div>
          )}

          <p className="text-[11px] text-gray-400 italic">
            ⚠️ AI suggestion ({result.provider || 'demo'}) — verify before prescribing.
          </p>
        </div>
      )}
    </div>
  );
}
