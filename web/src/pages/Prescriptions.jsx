import React, { useState } from 'react';
import { FiPlus, FiFileText, FiPrinter, FiX, FiTrash2, FiDownload, FiSave, FiBookOpen } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useApi } from '../hooks/useApi';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import AIPrescriptionHelper from '../components/AIPrescriptionHelper';
import VoiceNotes from '../components/VoiceNotes';
import PrintPrescription from '../components/PrintPrescription';

const emptyMed = { name: '', dosage: '', frequency: '', duration: '', timing: 'after-food' };

export default function Prescriptions() {
  const { data, loading, error, refetch } = useApi('/prescriptions?limit=50');
  const { data: patientsData } = useApi('/patients?limit=100');
  const prescriptions = data?.prescriptions || [];
  const patients = patientsData?.patients || [];

  const [showAddModal, setShowAddModal] = useState(false);
  const [printRx, setPrintRx] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    patientId: '', diagnosis: '', advice: '', followUpDate: '',
    vitals: { bp: '', weight: '', temperature: '' },
    medicines: [{ ...emptyMed }]
  });

  const addMedicine = () =>
    setForm((f) => ({ ...f, medicines: [...f.medicines, { ...emptyMed }] }));
  const removeMedicine = (idx) =>
    setForm((f) => ({ ...f, medicines: f.medicines.filter((_, i) => i !== idx) }));
  const updateMedicine = (idx, key, value) =>
    setForm((f) => {
      const next = [...f.medicines];
      next[idx] = { ...next[idx], [key]: value };
      return { ...f, medicines: next };
    });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.patientId) return toast.error('Please select a patient');
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        medicines: form.medicines.filter((m) => m.name?.trim()),
        followUpDate: form.followUpDate || undefined,
        vitals: {
          bp: form.vitals.bp || undefined,
          weight: form.vitals.weight ? Number(form.vitals.weight) : undefined,
          temperature: form.vitals.temperature ? Number(form.vitals.temperature) : undefined
        }
      };
      await api.post('/prescriptions', payload);
      toast.success('Prescription created');
      setShowAddModal(false);
      setForm({
        patientId: '', diagnosis: '', advice: '', followUpDate: '',
        vitals: { bp: '', weight: '', temperature: '' },
        medicines: [{ ...emptyMed }]
      });
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create');
    } finally {
      setSubmitting(false);
    }
  };

  const sendWhatsapp = async (rx) => {
    if (!rx.patientId?.phone) return toast.error('Patient has no phone number');
    const url = `${window.location.origin}/prescriptions/${rx._id}`;
    try {
      await api.post('/whatsapp/prescription', {
        phone: rx.patientId.phone,
        prescriptionUrl: url,
        patientName: rx.patientId.name
      });
      toast.success('Prescription sent via WhatsApp');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send');
    }
  };

  const saveAsTemplate = async () => {
    const templateName = prompt('Enter template name (e.g. "Fever Basic", "Diabetes Follow-up"):');
    if (!templateName?.trim()) return;
    try {
      await api.post('/prescriptions', {
        ...form,
        patientId: form.patientId || undefined,
        isTemplate: true,
        templateName: templateName.trim(),
        medicines: form.medicines.filter(m => m.name?.trim())
      });
      toast.success(`Template "${templateName}" saved!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save template');
    }
  };

  const loadTemplate = (tpl) => {
    setForm(f => ({
      ...f,
      diagnosis: tpl.diagnosis || f.diagnosis,
      advice: tpl.advice || f.advice,
      medicines: tpl.medicines?.length ? tpl.medicines.map(m => ({
        name: m.name || '', dosage: m.dosage || '', frequency: m.frequency || '',
        duration: m.duration || '', timing: m.timing || 'after-food'
      })) : f.medicines
    }));
    setShowTemplates(false);
    toast.success('Template loaded');
  };

  const { data: templateData } = useApi('/prescriptions?isTemplate=true&limit=20');

  return (
    <div className="page-enter space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center glow-cyan">
              <FiFileText className="text-white text-lg" />
            </div>
            Prescriptions
          </h1>
          <p className="text-gray-500 mt-1 ml-[52px]">Create and manage digital prescriptions</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2">
          <FiPlus /> New Prescription
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 text-red-700 px-4 py-3 text-sm">{error}</div>
      )}

      {loading ? (
        <Loader label="Loading prescriptions..." />
      ) : prescriptions.length === 0 ? (
        <EmptyState
          icon={FiFileText}
          title="No prescriptions yet"
          message="Create a digital prescription to get started."
          action={
            <button onClick={() => setShowAddModal(true)} className="btn-primary text-sm">
              Create Prescription
            </button>
          }
        />
      ) : (
        <div className="space-y-4">
          {prescriptions.map((rx) => (
            <div key={rx._id} className="card hover:shadow-lg transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <FiFileText className="text-indigo-600 text-xl" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{rx.patientId?.name}</h3>
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">
                        {rx.prescriptionNo}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {rx.patientId?.patientId}
                      {rx.patientId?.age ? ` | Age: ${rx.patientId.age}` : ''} |{' '}
                      {new Date(rx.createdAt).toLocaleDateString('en-IN')}
                    </p>
                    {rx.diagnosis && (
                      <p className="text-sm font-medium text-blue-600 mt-1">Diagnosis: {rx.diagnosis}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => sendWhatsapp(rx)}
                    className="p-2 bg-green-50 rounded-lg text-green-600 hover:bg-green-100"
                    title="Send via WhatsApp"
                    aria-label="Send via WhatsApp"
                  >
                    <FaWhatsapp />
                  </button>
                  <button
                    onClick={() => setPrintRx(rx)}
                    className="p-2 bg-blue-50 rounded-lg text-blue-600 hover:bg-blue-100"
                    title="Print"
                    aria-label="Print"
                  >
                    <FiPrinter />
                  </button>
                </div>
              </div>
              {rx.medicines?.length > 0 && (
                <div className="mt-4 pl-16">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Medicines:</p>
                  <div className="space-y-1">
                    {rx.medicines.map((med, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded flex items-center justify-center text-xs font-bold">
                          {i + 1}
                        </span>
                        <span className="font-medium text-gray-900">
                          {med.name} {med.dosage}
                        </span>
                        {med.frequency && (
                          <>
                            <span className="text-gray-500">|</span>
                            <span className="text-gray-600">{med.frequency}</span>
                          </>
                        )}
                        {med.duration && (
                          <>
                            <span className="text-gray-500">|</span>
                            <span className="text-gray-600">{med.duration}</span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 animate-fade-in my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Create Prescription</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="text-xs bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-100 flex items-center gap-1 font-medium"
                >
                  <FiBookOpen className="text-sm" /> Templates
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  aria-label="Close"
                >
                  <FiX className="text-xl" />
                </button>
              </div>
            </div>
            {showTemplates && (
              <div className="mb-4 p-3 bg-purple-50 rounded-xl border border-purple-100">
                <p className="text-xs font-semibold text-purple-700 mb-2">Load a saved template:</p>
                {(templateData?.prescriptions || []).length === 0 ? (
                  <p className="text-xs text-gray-500">No templates saved yet. Create a prescription and save it as a template.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(templateData?.prescriptions || []).map(tpl => (
                      <button
                        key={tpl._id}
                        type="button"
                        onClick={() => loadTemplate(tpl)}
                        className="text-xs bg-white text-purple-700 px-3 py-1.5 rounded-lg border border-purple-200 hover:bg-purple-100 font-medium"
                      >
                        {tpl.templateName || tpl.diagnosis || 'Unnamed'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient *</label>
                  <select
                    className="input-field" required
                    value={form.patientId}
                    onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                  >
                    <option value="">Select patient...</option>
                    {patients.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.patientId})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
                  <input
                    type="text" className="input-field" placeholder="e.g., Viral Fever"
                    value={form.diagnosis}
                    onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">BP</label>
                  <input
                    className="input-field" placeholder="120/80"
                    value={form.vitals.bp}
                    onChange={(e) => setForm({ ...form, vitals: { ...form.vitals, bp: e.target.value } })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                  <input
                    className="input-field" placeholder="70"
                    value={form.vitals.weight}
                    onChange={(e) => setForm({ ...form, vitals: { ...form.vitals, weight: e.target.value } })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
                  <input
                    className="input-field" placeholder="98.6"
                    value={form.vitals.temperature}
                    onChange={(e) =>
                      setForm({ ...form, vitals: { ...form.vitals, temperature: e.target.value } })
                    }
                  />
                </div>
              </div>

              {/* AI Prescription Assistant */}
              <AIPrescriptionHelper
                patientAge={patients.find((p) => p._id === form.patientId)?.age}
                patientAllergies={patients.find((p) => p._id === form.patientId)?.allergies}
                onAddMedicines={(meds) => {
                  setForm((f) => ({
                    ...f,
                    medicines: [
                      ...f.medicines.filter((m) => m.name?.trim()),
                      ...meds
                    ]
                  }));
                  toast.success(`Added ${meds.length} medicine${meds.length > 1 ? 's' : ''} from AI`);
                }}
              />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700">Medicines</label>
                  <button
                    type="button" onClick={addMedicine}
                    className="text-xs text-blue-600 font-medium hover:text-blue-700"
                  >
                    + Add Medicine
                  </button>
                </div>
                {form.medicines.map((med, idx) => (
                  <div key={idx} className="flex gap-2 mb-2 items-center">
                    <input
                      className="input-field flex-1 py-2" placeholder="Medicine name"
                      value={med.name}
                      onChange={(e) => updateMedicine(idx, 'name', e.target.value)}
                    />
                    <input
                      className="input-field w-24 py-2" placeholder="1-0-1"
                      value={med.frequency}
                      onChange={(e) => updateMedicine(idx, 'frequency', e.target.value)}
                    />
                    <input
                      className="input-field w-24 py-2" placeholder="5 days"
                      value={med.duration}
                      onChange={(e) => updateMedicine(idx, 'duration', e.target.value)}
                    />
                    <select
                      className="input-field w-32 py-2"
                      value={med.timing}
                      onChange={(e) => updateMedicine(idx, 'timing', e.target.value)}
                    >
                      <option value="after-food">After food</option>
                      <option value="before-food">Before food</option>
                      <option value="empty-stomach">Empty stomach</option>
                      <option value="bedtime">Bedtime</option>
                    </select>
                    {form.medicines.length > 1 && (
                      <button
                        type="button" onClick={() => removeMedicine(idx)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        aria-label="Remove medicine"
                      >
                        <FiTrash2 />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Advice</label>
                <textarea
                  className="input-field" rows={2} placeholder="Rest, drink fluids..."
                  value={form.advice}
                  onChange={(e) => setForm({ ...form, advice: e.target.value })}
                />
              </div>

              {/* Voice-to-Text for clinical notes */}
              <VoiceNotes
                onInsertText={(text) => {
                  setForm((f) => ({ ...f, advice: f.advice ? f.advice + '\n\n' + text : text }));
                  toast.success('Notes inserted into advice field');
                }}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
                <input
                  type="date" className="input-field"
                  value={form.followUpDate}
                  onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveAsTemplate}
                  className="flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl border border-purple-200 text-purple-700 font-semibold text-sm hover:bg-purple-50 transition-colors"
                >
                  <FiSave /> Save Template
                </button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? 'Saving...' : 'Create Prescription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {printRx && <PrintPrescription prescription={printRx} onClose={() => setPrintRx(null)} />}
    </div>
  );
}
