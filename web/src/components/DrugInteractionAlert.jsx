import React, { useState, useEffect } from 'react';
import { FiAlertTriangle, FiShield, FiCheckCircle, FiLoader } from 'react-icons/fi';
import api from '../utils/api';

// ──────────────────────────────────────────────
// Drug-Drug Interaction Alert Component
// Healthplix-style real-time DDI checking
// Shows inline alerts when prescribing multiple drugs
// ──────────────────────────────────────────────
export default function DrugInteractionAlert({ medicines = [], patientAllergies = '' }) {
  const [interactions, setInteractions] = useState([]);
  const [allergyAlerts, setAllergyAlerts] = useState([]);
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const namedMeds = medicines.filter(m => m.name?.trim()).map(m => m.name.trim());
    if (namedMeds.length < 2) {
      setInteractions([]);
      setChecked(false);
      return;
    }

    const timer = setTimeout(async () => {
      setChecking(true);
      try {
        const { data } = await api.post('/doctor/drug-interactions/check', { medicines: namedMeds });
        setInteractions(data?.interactions || []);
      } catch {
        setInteractions([]);
      }
      setChecking(false);
      setChecked(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [medicines]);

  // Check allergy conflicts
  useEffect(() => {
    if (!patientAllergies || !medicines.length) { setAllergyAlerts([]); return; }
    const allergies = patientAllergies.toLowerCase().split(',').map(a => a.trim()).filter(Boolean);
    if (!allergies.length) { setAllergyAlerts([]); return; }

    const alerts = [];
    medicines.forEach(med => {
      if (!med.name?.trim()) return;
      const medLower = med.name.toLowerCase();
      allergies.forEach(allergy => {
        if (medLower.includes(allergy) || allergy.includes(medLower.split(' ')[0])) {
          alerts.push({
            medicine: med.name,
            allergy,
            severity: 'critical',
            message: `${med.name} may conflict with known allergy: "${allergy}"`
          });
        }
      });
    });
    setAllergyAlerts(alerts);
  }, [medicines, patientAllergies]);

  const majorInteractions = interactions.filter(i => i.severity === 'major' || i.severity === 'contraindicated');
  const moderateInteractions = interactions.filter(i => i.severity === 'moderate');
  const minorInteractions = interactions.filter(i => i.severity === 'minor');

  const hasAny = interactions.length > 0 || allergyAlerts.length > 0;

  if (!checking && !hasAny && !checked) return null;

  return (
    <div className="space-y-2">
      {/* Checking indicator */}
      {checking && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl">
          <FiLoader className="text-blue-500 animate-spin text-sm" />
          <span className="text-xs text-blue-700">Checking drug interactions...</span>
        </div>
      )}

      {/* All clear */}
      {!checking && checked && !hasAny && (
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
          <FiCheckCircle className="text-emerald-500 text-sm" />
          <span className="text-xs text-emerald-700 font-medium">No drug interactions or allergy conflicts detected</span>
        </div>
      )}

      {/* Allergy alerts (highest priority) */}
      {allergyAlerts.length > 0 && (
        <div className="p-3 bg-red-50 border-2 border-red-200 rounded-xl animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
              <FiAlertTriangle className="text-white text-xs" />
            </div>
            <span className="text-sm font-bold text-red-700">ALLERGY ALERT</span>
          </div>
          <div className="space-y-1.5">
            {allergyAlerts.map((alert, i) => (
              <div key={i} className="pl-8">
                <p className="text-sm text-red-700 font-medium">{alert.message}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-red-500 mt-2 pl-8 italic">
            Review patient allergies before prescribing these medicines.
          </p>
        </div>
      )}

      {/* Major/Contraindicated interactions */}
      {majorInteractions.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
              <FiAlertTriangle className="text-white text-[10px]" />
            </div>
            <span className="text-xs font-bold text-red-700 uppercase">
              Major Interaction{majorInteractions.length > 1 ? 's' : ''} ({majorInteractions.length})
            </span>
          </div>
          <div className="space-y-2 pl-7">
            {majorInteractions.map((inter, i) => (
              <div key={i} className="text-sm">
                <p className="font-medium text-red-800">
                  <span className="bg-red-100 px-1.5 py-0.5 rounded text-xs">{inter.drug1}</span>
                  {' + '}
                  <span className="bg-red-100 px-1.5 py-0.5 rounded text-xs">{inter.drug2}</span>
                </p>
                <p className="text-red-600 text-xs mt-0.5">{inter.description}</p>
                {inter.management && (
                  <p className="text-xs text-gray-600 mt-0.5">💡 {inter.management}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Moderate interactions */}
      {moderateInteractions.length > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <FiAlertTriangle className="text-amber-600 text-sm flex-shrink-0" />
            <span className="text-xs font-bold text-amber-700 uppercase">
              Moderate ({moderateInteractions.length})
            </span>
          </div>
          <div className="space-y-1.5 pl-6">
            {moderateInteractions.map((inter, i) => (
              <div key={i} className="text-xs">
                <span className="font-medium text-amber-800">{inter.drug1} + {inter.drug2}:</span>{' '}
                <span className="text-gray-700">{inter.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Minor interactions (collapsed) */}
      {minorInteractions.length > 0 && (
        <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-xl">
          <details>
            <summary className="flex items-center gap-2 cursor-pointer text-xs font-medium text-blue-700">
              <FiShield className="text-blue-500 text-sm" />
              {minorInteractions.length} minor interaction{minorInteractions.length > 1 ? 's' : ''} (usually safe)
            </summary>
            <div className="mt-2 pl-6 space-y-1">
              {minorInteractions.map((inter, i) => (
                <p key={i} className="text-xs text-gray-600">
                  {inter.drug1} + {inter.drug2}: {inter.description}
                </p>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
