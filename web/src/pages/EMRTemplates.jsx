import React, { useState, useEffect } from 'react';
import { FiFileText, FiPlus, FiEdit, FiTrash2, FiCopy } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';

const SPECIALTIES = ['general', 'dental', 'eye', 'ortho', 'pediatric', 'dermatology', 'ent', 'cardiology', 'gynecology', 'other'];

export default function EMRTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterSpecialty, setFilterSpecialty] = useState('');
  const [form, setForm] = useState({
    name: '', specialty: 'general', category: '',
    sections: [{ title: '', type: 'text', options: [], required: false }],
    commonDiagnoses: '', commonMedicines: []
  });

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/doctor/emr-templates', { params: { specialty: filterSpecialty || undefined } });
      setTemplates(data || []);
    } catch (err) {
      toast.error('Failed to load templates');
    }
    setLoading(false);
  };

  useEffect(() => { fetchTemplates(); }, [filterSpecialty]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        commonDiagnoses: form.commonDiagnoses.split(',').map(d => d.trim()).filter(Boolean)
      };
      await api.post('/doctor/emr-templates', payload);
      toast.success('Template created');
      setShowForm(false);
      fetchTemplates();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create template');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      await api.delete(`/doctor/emr-templates/${id}`);
      toast.success('Template deleted');
      fetchTemplates();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const addSection = () => {
    setForm({ ...form, sections: [...form.sections, { title: '', type: 'text', options: [], required: false }] });
  };

  const updateSection = (idx, field, value) => {
    const sections = [...form.sections];
    sections[idx] = { ...sections[idx], [field]: value };
    setForm({ ...form, sections });
  };

  const removeSection = (idx) => {
    setForm({ ...form, sections: form.sections.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiFileText className="text-emerald-600" /> EMR Templates
          </h1>
          <p className="text-gray-500 text-sm mt-1">Specialty-based electronic medical record templates</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700">
          <FiPlus /> New Template
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterSpecialty('')} className={`px-3 py-1.5 rounded-full text-xs font-medium ${!filterSpecialty ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>All</button>
        {SPECIALTIES.map(s => (
          <button key={s} onClick={() => setFilterSpecialty(s)} className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize ${filterSpecialty === s ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>{s}</button>
        ))}
      </div>

      {/* Template Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-gray-500">Loading...</div>
        ) : templates.length === 0 ? (
          <div className="col-span-3 text-center py-12 bg-white dark:bg-gray-800 rounded-xl border">
            <FiFileText className="mx-auto text-4xl text-gray-300 mb-3" />
            <p className="text-gray-500">No templates found</p>
          </div>
        ) : (
          templates.map(tmpl => (
            <div key={tmpl._id} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{tmpl.name}</h3>
                  <div className="flex gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-xs rounded-full capitalize">{tmpl.specialty}</span>
                    {tmpl.category && <span className="px-2 py-0.5 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 text-xs rounded-full">{tmpl.category}</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleDelete(tmpl._id)} className="text-red-400 hover:text-red-600 p-1"><FiTrash2 size={14} /></button>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500">
                {tmpl.sections?.length || 0} sections | Used {tmpl.usageCount || 0} times
              </div>
              {tmpl.commonDiagnoses?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {tmpl.commonDiagnoses.slice(0, 3).map((d, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-300 text-[10px] rounded">{d}</span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Create EMR Template</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Template Name</label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Specialty</label>
                  <select value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <input type="text" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Chief Complaint" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
              </div>

              {/* Sections */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sections</label>
                {form.sections.map((sec, idx) => (
                  <div key={idx} className="flex gap-2 items-center mb-2">
                    <input type="text" value={sec.title} onChange={e => updateSection(idx, 'title', e.target.value)} placeholder="Section title" className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" />
                    <select value={sec.type} onChange={e => updateSection(idx, 'type', e.target.value)} className="px-2 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm">
                      {['text', 'checklist', 'dropdown', 'vitals', 'table'].map(t => <option key={t}>{t}</option>)}
                    </select>
                    <button type="button" onClick={() => removeSection(idx)} className="text-red-500 p-1"><FiTrash2 size={14} /></button>
                  </div>
                ))}
                <button type="button" onClick={addSection} className="text-sm text-emerald-600 hover:text-emerald-700">+ Add Section</button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Common Diagnoses (comma-separated)</label>
                <input type="text" value={form.commonDiagnoses} onChange={e => setForm({ ...form, commonDiagnoses: e.target.value })} placeholder="Viral fever, URTI, Gastritis" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700">Create Template</button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
