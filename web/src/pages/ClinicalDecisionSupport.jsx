import React, { useState } from 'react';
import { FiCpu, FiAlertCircle, FiActivity, FiList, FiTrendingUp } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function ClinicalDecisionSupport() {
  const [form, setForm] = useState({
    symptoms: '', diagnosis: '', patientAge: '', patientGender: '', medicalHistory: ''
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [drugCheckMedicines, setDrugCheckMedicines] = useState('');
  const [drugInteractions, setDrugInteractions] = useState(null);
  const [allergyPatientId, setAllergyPatientId] = useState('');
  const [allergyMedicines, setAllergyMedicines] = useState('');
  const [allergyResult, setAllergyResult] = useState(null);
  const [followUpForm, setFollowUpForm] = useState({ diagnosis: '', medicines: '', patientAge: '', consultationType: 'consultation' });
  const [followUpResult, setFollowUpResult] = useState(null);
  const [activeTab, setActiveTab] = useState('clinical'); // clinical | drugs | allergies | followup

  const handleClinicalSupport = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.post('/doctor/clinical-support', form);
      setResult(data);
    } catch (err) {
      toast.error('Failed to get clinical suggestions');
    }
    setLoading(false);
  };

  const handleDrugCheck = async (e) => {
    e.preventDefault();
    if (!drugCheckMedicines.trim()) return;
    setLoading(true);
    setDrugInteractions(null);
    try {
      const medicines = drugCheckMedicines.split(',').map(m => m.trim()).filter(Boolean);
      const { data } = await api.post('/doctor/drug-interactions/check', { medicines });
      setDrugInteractions(data);
    } catch (err) {
      toast.error('Drug interaction check failed');
    }
    setLoading(false);
  };

  const handleAllergyCheck = async (e) => {
    e.preventDefault();
    if (!allergyPatientId || !allergyMedicines.trim()) return;
    setLoading(true);
    setAllergyResult(null);
    try {
      const medicines = allergyMedicines.split(',').map(m => m.trim()).filter(Boolean);
      const { data } = await api.post('/doctor/allergy-check', { patientId: allergyPatientId, medicines });
      setAllergyResult(data);
    } catch (err) {
      toast.error('Allergy check failed');
    }
    setLoading(false);
  };

  const handleFollowUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFollowUpResult(null);
    try {
      const payload = {
        ...followUpForm,
        medicines: followUpForm.medicines.split(',').map(m => m.trim()).filter(Boolean)
      };
      const { data } = await api.post('/doctor/follow-up-suggestions', payload);
      setFollowUpResult(data);
    } catch (err) {
      toast.error('Failed to get follow-up suggestions');
    }
    setLoading(false);
  };

  const TABS = [
    { id: 'clinical', label: 'Clinical Support', icon: <FiCpu /> },
    { id: 'drugs', label: 'Drug Interactions', icon: <FiAlertCircle /> },
    { id: 'allergies', label: 'Allergy Alerts', icon: <FiActivity /> },
    { id: 'followup', label: 'Follow-up', icon: <FiTrendingUp /> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FiCpu className="text-violet-600" /> Clinical Decision Support
        </h1>
        <p className="text-gray-500 text-sm mt-1">AI-powered diagnosis, drug interactions, allergy alerts & follow-up suggestions</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b dark:border-gray-700 pb-3">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab.id ? 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Clinical Decision Support */}
      {activeTab === 'clinical' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <form onSubmit={handleClinicalSupport} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Symptoms</label>
                <input type="text" value={form.symptoms} onChange={e => setForm({ ...form, symptoms: e.target.value })} placeholder="e.g., fever, cough, headache, body ache since 3 days" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Working Diagnosis (optional)</label>
                <input type="text" value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })} placeholder="e.g., Viral fever, URTI" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Patient Age</label>
                <input type="text" value={form.patientAge} onChange={e => setForm({ ...form, patientAge: e.target.value })} placeholder="35" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
                <select value={form.patientGender} onChange={e => setForm({ ...form, patientGender: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Medical History</label>
                <input type="text" value={form.medicalHistory} onChange={e => setForm({ ...form, medicalHistory: e.target.value })} placeholder="e.g., Diabetes, Hypertension" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="bg-violet-600 text-white px-6 py-2.5 rounded-lg hover:bg-violet-700 disabled:opacity-50">
              {loading ? 'Analyzing...' : 'Get Clinical Suggestions'}
            </button>
          </form>

          {result && (
            <div className="mt-6 space-y-4 border-t pt-6 dark:border-gray-700">
              {result.suggestedDiagnoses?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Suggested Diagnoses</h3>
                  <div className="space-y-2">
                    {result.suggestedDiagnoses.map((d, i) => (
                      <div key={i} className="p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-100 dark:border-violet-800">
                        <div className="flex justify-between items-start">
                          <span className="font-medium text-gray-900 dark:text-white">{d.condition}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${d.probability === 'high' ? 'bg-red-100 text-red-700' : d.probability === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{d.probability}</span>
                        </div>
                        {d.icd10 && <p className="text-xs text-gray-500 mt-1">ICD-10: {d.icd10}</p>}
                        {d.reasoning && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{d.reasoning}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {result.recommendedTests?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Recommended Tests</h3>
                  <div className="flex flex-wrap gap-2">{result.recommendedTests.map((t, i) => <span key={i} className="px-3 py-1 bg-teal-50 text-teal-700 dark:bg-teal-900 dark:text-teal-300 rounded-full text-sm">{t.test || t}</span>)}</div>
                </div>
              )}
              {result.treatmentOptions?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Treatment Options</h3>
                  <ul className="space-y-1">{result.treatmentOptions.map((t, i) => <li key={i} className="text-sm text-gray-700 dark:text-gray-300">• {t.option || t.details || t}</li>)}</ul>
                </div>
              )}
              {result.redFlags?.length > 0 && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <h3 className="font-semibold text-red-700 dark:text-red-400 mb-1">Red Flags</h3>
                  <ul>{result.redFlags.map((f, i) => <li key={i} className="text-sm text-red-600 dark:text-red-400">⚠️ {f}</li>)}</ul>
                </div>
              )}
              {result.disclaimer && <p className="text-xs text-gray-500 italic">{result.disclaimer}</p>}
            </div>
          )}
        </div>
      )}

      {/* Drug Interactions */}
      {activeTab === 'drugs' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <form onSubmit={handleDrugCheck} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Medicines (comma-separated)</label>
              <input type="text" value={drugCheckMedicines} onChange={e => setDrugCheckMedicines(e.target.value)} placeholder="e.g., Aspirin, Warfarin, Ibuprofen" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <button type="submit" disabled={loading} className="bg-orange-600 text-white px-6 py-2.5 rounded-lg hover:bg-orange-700 disabled:opacity-50">
              {loading ? 'Checking...' : 'Check Interactions'}
            </button>
          </form>

          {drugInteractions && (
            <div className="mt-6 border-t pt-4 dark:border-gray-700">
              {drugInteractions.interactions?.length > 0 ? (
                <div className="space-y-3">
                  {drugInteractions.interactions.map((inter, i) => (
                    <div key={i} className={`p-3 rounded-lg border ${inter.severity === 'contraindicated' || inter.severity === 'major' ? 'bg-red-50 border-red-200 dark:bg-red-900/20' : inter.severity === 'moderate' ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20' : 'bg-blue-50 border-blue-200 dark:bg-blue-900/20'}`}>
                      <div className="flex justify-between items-start">
                        <span className="font-medium">{inter.drug1} + {inter.drug2}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full uppercase font-bold ${inter.severity === 'major' || inter.severity === 'contraindicated' ? 'bg-red-200 text-red-800' : inter.severity === 'moderate' ? 'bg-yellow-200 text-yellow-800' : 'bg-blue-200 text-blue-800'}`}>{inter.severity}</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{inter.description}</p>
                      {inter.management && <p className="text-sm text-gray-600 mt-1"><strong>Management:</strong> {inter.management}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6"><FiActivity className="mx-auto text-3xl text-green-500 mb-2" /><p className="text-green-600 font-medium">No significant interactions found</p></div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Allergy Alerts */}
      {activeTab === 'allergies' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <form onSubmit={handleAllergyCheck} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Patient ID</label>
              <input type="text" value={allergyPatientId} onChange={e => setAllergyPatientId(e.target.value)} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Medicines to prescribe (comma-separated)</label>
              <input type="text" value={allergyMedicines} onChange={e => setAllergyMedicines(e.target.value)} placeholder="e.g., Penicillin, Amoxicillin" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <button type="submit" disabled={loading} className="bg-red-600 text-white px-6 py-2.5 rounded-lg hover:bg-red-700 disabled:opacity-50">
              {loading ? 'Checking...' : 'Check Allergies'}
            </button>
          </form>

          {allergyResult && (
            <div className="mt-6 border-t pt-4 dark:border-gray-700">
              {allergyResult.alerts?.length > 0 ? (
                <div className="space-y-3">
                  {allergyResult.alerts.map((alert, i) => (
                    <div key={i} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <p className="font-medium text-red-700 dark:text-red-400">⚠️ {alert.message}</p>
                      {alert.severity && <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full uppercase mt-1 inline-block">{alert.severity}</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6"><FiActivity className="mx-auto text-3xl text-green-500 mb-2" /><p className="text-green-600 font-medium">No allergy conflicts detected</p>
                  {allergyResult.patientAllergies?.length > 0 && <p className="text-sm text-gray-500 mt-1">Known allergies: {allergyResult.patientAllergies.join(', ')}</p>}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Follow-up Suggestions */}
      {activeTab === 'followup' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <form onSubmit={handleFollowUp} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Diagnosis</label>
                <input type="text" value={followUpForm.diagnosis} onChange={e => setFollowUpForm({ ...followUpForm, diagnosis: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Medicines (comma-separated)</label>
                <input type="text" value={followUpForm.medicines} onChange={e => setFollowUpForm({ ...followUpForm, medicines: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Patient Age</label>
                <input type="text" value={followUpForm.patientAge} onChange={e => setFollowUpForm({ ...followUpForm, patientAge: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Consultation Type</label>
                <select value={followUpForm.consultationType} onChange={e => setFollowUpForm({ ...followUpForm, consultationType: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <option value="consultation">Consultation</option>
                  <option value="follow-up">Follow-up</option>
                  <option value="procedure">Procedure</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>
            </div>
            <button type="submit" disabled={loading} className="bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 disabled:opacity-50">
              {loading ? 'Analyzing...' : 'Get Suggestion'}
            </button>
          </form>

          {followUpResult && (
            <div className="mt-6 border-t pt-4 dark:border-gray-700">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">{followUpResult.suggestedDays} days</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{followUpResult.reason}</p>
                <span className={`text-xs mt-2 inline-block px-2 py-0.5 rounded-full ${followUpResult.priority === 'urgent' ? 'bg-red-100 text-red-700' : followUpResult.priority === 'important' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>{followUpResult.priority} priority</span>
                {followUpResult.monitoringPoints?.length > 0 && (
                  <div className="mt-3"><p className="text-xs font-medium text-gray-600">Monitor:</p><ul className="text-xs text-gray-600">{followUpResult.monitoringPoints.map((p, i) => <li key={i}>• {p}</li>)}</ul></div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
