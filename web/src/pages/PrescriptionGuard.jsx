import React, { useState } from 'react';
import {
  FiShield, FiPlus, FiX, FiCpu, FiAlertTriangle, FiCheckCircle,
  FiActivity, FiDroplet, FiAlertCircle, FiZap
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useApi } from '../hooks/useApi';
import PatientSearchSelect from '../components/PatientSearchSelect';

const severityStyle = {
  contraindicated: 'border-red-300 bg-red-50 text-red-800',
  major: 'border-red-200 bg-red-50 text-red-700',
  high: 'border-red-200 bg-red-50 text-red-700',
  moderate: 'border-amber-200 bg-amber-50 text-amber-700',
  minor: 'border-blue-200 bg-blue-50 text-blue-700',
  low: 'border-blue-200 bg-blue-50 text-blue-700'
};

export default function PrescriptionGuard() {
  const [patientId, setPatientId] = useState('');
  const [medInput, setMedInput] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [weightKg, setWeightKg] = useState('');
  const [ageYears, setAgeYears] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const { data: patients } = useApi('/patients?limit=200');

  const addMed = () => {
    const v = medInput.trim();
    if (!v) return;
    if (medicines.some((m) => m.toLowerCase() === v.toLowerCase())) { setMedInput(''); return; }
    setMedicines([...medicines, v]);
    setMedInput('');
  };

  const onKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addMed(); }
  };

  const runGuard = async () => {
    if (medicines.length === 0) return toast.error('Add at least one medicine');
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post('/doctor/rx-guard', {
        patientId: patientId || undefined,
        medicines,
        weightKg: weightKg ? Number(weightKg) : undefined,
        ageYears: ageYears ? Number(ageYears) : undefined
      });
      setResult(res.data);
      if (res.data.hasCriticalAlerts) toast.error('Critical safety alerts found — review carefully');
      else toast.success('Safety check complete');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to run check');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center">
            <FiShield className="text-white text-lg" />
          </div>
          Drug Interaction & Dosage Guard
        </h1>
        <p className="text-sm text-gray-500 mt-1">Cross-check interactions, patient allergies, and weight-based pediatric dosing before prescribing.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Input */}
        <div className="card lg:col-span-2 space-y-4 h-fit">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Patient (for allergy check)</label>
            <PatientSearchSelect
              patients={(patients?.patients || patients || [])}
              value={patientId}
              onChange={setPatientId}
              placeholder="Optional — pulls allergies & age..."
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Medicines</label>
            <div className="flex gap-2">
              <input
                value={medInput}
                onChange={(e) => setMedInput(e.target.value)}
                onKeyDown={onKey}
                className="input-field"
                placeholder="Type a medicine and press Enter"
              />
              <button onClick={addMed} className="btn-secondary !px-3"><FiPlus /></button>
            </div>
            {medicines.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {medicines.map((m) => (
                  <span key={m} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-sm font-medium border border-rose-100">
                    {m}
                    <button onClick={() => setMedicines(medicines.filter((x) => x !== m))} className="hover:text-rose-900"><FiX className="text-xs" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Weight (kg)</label>
              <input type="number" min="0" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} className="input-field" placeholder="e.g. 18" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Age (years)</label>
              <input type="number" min="0" value={ageYears} onChange={(e) => setAgeYears(e.target.value)} className="input-field" placeholder="e.g. 6" />
            </div>
          </div>
          <p className="text-xs text-gray-400">Weight-based dosing activates for children (≤12y) or weight ≤40kg.</p>

          <button onClick={runGuard} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            <FiCpu /> {loading ? 'Checking...' : 'Run Safety Check'}
          </button>
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-4">
          {!result ? (
            <div className="card h-full flex flex-col items-center justify-center text-center py-16 text-gray-400">
              <FiZap className="text-4xl mb-3 text-rose-300" />
              <p className="text-sm">Add medicines and run the check to see interactions, allergy alerts, and dosing.</p>
            </div>
          ) : (
            <>
              {/* Banner */}
              <div className={`card flex items-center gap-3 ${result.hasCriticalAlerts ? 'border-2 border-red-200' : 'border-2 border-emerald-200'}`}>
                {result.hasCriticalAlerts ? <FiAlertTriangle className="text-2xl text-red-500" /> : <FiCheckCircle className="text-2xl text-emerald-500" />}
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">{result.hasCriticalAlerts ? 'Critical alerts found' : 'No critical alerts'}</p>
                  <p className="text-xs text-gray-500">{result.medicines.join(', ')}{result.patientContext?.isPediatric ? ' · pediatric dosing applied' : ''}</p>
                </div>
              </div>

              {/* Allergy alerts */}
              {(result.allergyAlerts || []).length > 0 && (
                <div className="card">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><FiDroplet className="text-red-600" /> Allergy Alerts</h3>
                  <div className="space-y-2">
                    {result.allergyAlerts.map((a, i) => (
                      <div key={i} className={`p-3 rounded-xl border ${severityStyle[a.severity] || severityStyle.moderate}`}>
                        <p className="text-sm font-semibold">{a.medicine} ⚠ {a.allergy}</p>
                        <p className="text-xs mt-0.5">{a.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Interactions */}
              <div className="card">
                <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><FiActivity className="text-amber-600" /> Drug Interactions</h3>
                {(result.interactions || []).length === 0 ? (
                  <p className="text-sm text-emerald-600 flex items-center gap-1.5"><FiCheckCircle /> No significant interactions detected.</p>
                ) : (
                  <div className="space-y-2">
                    {result.interactions.map((it, i) => (
                      <div key={i} className={`p-3 rounded-xl border ${severityStyle[(it.severity || '').toLowerCase()] || severityStyle.moderate}`}>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold">{it.drug1} + {it.drug2}</p>
                          <span className="text-[11px] font-bold uppercase">{it.severity || 'note'}</span>
                        </div>
                        <p className="text-xs mt-1">{it.description || it.clinicalEffect}</p>
                        {it.management && <p className="text-xs mt-1 italic">Management: {it.management}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pediatric dosing */}
              {(result.dosing || []).length > 0 && (
                <div className="card">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <FiActivity className="text-blue-600" /> Weight-Based Dosing
                    {result.patientContext?.weightKg && <span className="text-xs font-normal text-gray-400">({result.patientContext.weightKg} kg)</span>}
                  </h3>
                  <div className="space-y-2">
                    {result.dosing.map((d, i) => (
                      <div key={i} className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50">
                        {d.found && d.perDoseMg ? (
                          <>
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold capitalize text-gray-900 dark:text-white">{d.drug}</p>
                              {d.cappedAtMax && <span className="badge badge-warning">capped at max</span>}
                            </div>
                            <p className="text-sm text-blue-700 font-medium mt-0.5">{d.perDoseMg} mg/dose · {d.frequency}{d.perDayMg ? ` · ~${d.perDayMg} mg/day` : ''}</p>
                            {d.note && <p className="text-xs text-gray-500 mt-0.5">{d.note}</p>}
                          </>
                        ) : (
                          <p className="text-sm text-gray-500"><span className="font-semibold capitalize">{d.drug}:</span> {d.message}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <FiAlertCircle className="text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700">{result.disclaimer}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
