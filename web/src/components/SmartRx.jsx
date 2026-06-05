import React, { useState, useEffect, useRef } from 'react';
import { FiZap, FiPlus, FiX, FiSearch, FiClock, FiCheckCircle } from 'react-icons/fi';
import { FaRobot } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../utils/api';

// ──────────────────────────────────────────────
// Popular medicines database (local for instant suggestions)
// ──────────────────────────────────────────────
const MEDICINE_DB = [
  { name: 'Tab. Paracetamol 500mg', category: 'Antipyretic', defaultFreq: '1-0-1', defaultDur: '3 days' },
  { name: 'Tab. Paracetamol 650mg', category: 'Antipyretic', defaultFreq: '1-0-1', defaultDur: '3 days' },
  { name: 'Tab. Azithromycin 500mg', category: 'Antibiotic', defaultFreq: 'OD', defaultDur: '3 days' },
  { name: 'Tab. Amoxicillin 500mg', category: 'Antibiotic', defaultFreq: '1-1-1', defaultDur: '5 days' },
  { name: 'Tab. Cetirizine 10mg', category: 'Antihistamine', defaultFreq: '0-0-1', defaultDur: '5 days' },
  { name: 'Tab. Levocetirizine 5mg', category: 'Antihistamine', defaultFreq: '0-0-1', defaultDur: '5 days' },
  { name: 'Tab. Pantoprazole 40mg', category: 'Antacid', defaultFreq: '1-0-0', defaultDur: '14 days' },
  { name: 'Tab. Omeprazole 20mg', category: 'Antacid', defaultFreq: '1-0-0', defaultDur: '14 days' },
  { name: 'Tab. Ranitidine 150mg', category: 'Antacid', defaultFreq: '1-0-1', defaultDur: '7 days' },
  { name: 'Tab. Dolo 650mg', category: 'Antipyretic', defaultFreq: '1-0-1', defaultDur: '3 days' },
  { name: 'Tab. Combiflam', category: 'Analgesic', defaultFreq: '1-0-1', defaultDur: '3 days' },
  { name: 'Tab. Metformin 500mg', category: 'Antidiabetic', defaultFreq: '1-0-1', defaultDur: '30 days' },
  { name: 'Tab. Amlodipine 5mg', category: 'Antihypertensive', defaultFreq: 'OD', defaultDur: '30 days' },
  { name: 'Tab. Atorvastatin 10mg', category: 'Lipid-lowering', defaultFreq: '0-0-1', defaultDur: '30 days' },
  { name: 'Tab. Aspirin 75mg', category: 'Blood thinner', defaultFreq: 'OD', defaultDur: '30 days' },
  { name: 'Tab. Telmisartan 40mg', category: 'Antihypertensive', defaultFreq: 'OD', defaultDur: '30 days' },
  { name: 'Syp. Ascoril-LS', category: 'Cough syrup', defaultFreq: '1-1-1', defaultDur: '5 days' },
  { name: 'Syp. Benadryl', category: 'Cough syrup', defaultFreq: '1-0-1', defaultDur: '5 days' },
  { name: 'Tab. Montelukast 10mg', category: 'Antiasthmatic', defaultFreq: '0-0-1', defaultDur: '14 days' },
  { name: 'Tab. Doxycycline 100mg', category: 'Antibiotic', defaultFreq: '1-0-1', defaultDur: '7 days' },
  { name: 'Tab. Cefixime 200mg', category: 'Antibiotic', defaultFreq: '1-0-1', defaultDur: '5 days' },
  { name: 'Tab. Ondansetron 4mg', category: 'Antiemetic', defaultFreq: 'SOS', defaultDur: '3 days' },
  { name: 'Tab. Domperidone 10mg', category: 'Antiemetic', defaultFreq: '1-1-1', defaultDur: '3 days' },
  { name: 'Cap. ORS sachets', category: 'Rehydration', defaultFreq: 'TDS', defaultDur: '3 days' },
  { name: 'Tab. B-Complex', category: 'Supplement', defaultFreq: 'OD', defaultDur: '30 days' },
  { name: 'Tab. Iron + Folic Acid', category: 'Supplement', defaultFreq: 'OD', defaultDur: '30 days' },
  { name: 'Tab. Calcium + Vit D3', category: 'Supplement', defaultFreq: 'OD', defaultDur: '30 days' },
  { name: 'Tab. Vitamin C 500mg', category: 'Supplement', defaultFreq: 'OD', defaultDur: '14 days' },
  { name: 'Tab. Zinc 50mg', category: 'Supplement', defaultFreq: 'OD', defaultDur: '14 days' },
  { name: 'Tab. Allegra 120mg', category: 'Antihistamine', defaultFreq: 'OD', defaultDur: '5 days' },
  { name: 'Tab. Deriphyllin 150mg', category: 'Bronchodilator', defaultFreq: '1-0-1', defaultDur: '5 days' },
  { name: 'Inh. Levosalbutamol + Ipratropium', category: 'Nebulisation', defaultFreq: 'TDS', defaultDur: '3 days' },
  { name: 'Tab. Losartan 50mg', category: 'Antihypertensive', defaultFreq: 'OD', defaultDur: '30 days' },
  { name: 'Tab. Glimepiride 1mg', category: 'Antidiabetic', defaultFreq: 'OD', defaultDur: '30 days' },
  { name: 'Inj. Insulin Glargine', category: 'Insulin', defaultFreq: 'OD', defaultDur: '30 days' },
  { name: 'Tab. Gabapentin 300mg', category: 'Neuropathic pain', defaultFreq: '0-0-1', defaultDur: '14 days' },
];

// ──────────────────────────────────────────────
// SmartRx Component - Quick 30-second Rx builder
// ──────────────────────────────────────────────
export default function SmartRx({ onMedicineAdd, onMedicinesSet, diagnosis, patientAge }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [recentMeds, setRecentMeds] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);

  // Load recently used medicines
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('docClinic_recentMeds') || '[]');
      setRecentMeds(stored.slice(0, 10));
    } catch { setRecentMeds([]); }
  }, []);

  // Search medicines locally
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions(recentMeds.length > 0 ? recentMeds.slice(0, 5) : MEDICINE_DB.slice(0, 8));
      return;
    }
    const q = query.toLowerCase();
    const filtered = MEDICINE_DB.filter(m =>
      m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q)
    ).slice(0, 10);
    setSuggestions(filtered);
  }, [query, recentMeds]);

  // Click outside to close
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectMedicine = (med) => {
    const newMed = {
      name: med.name,
      dosage: '',
      frequency: med.defaultFreq || '1-0-1',
      duration: med.defaultDur || '5 days',
      timing: 'after-food'
    };
    if (onMedicineAdd) {
      onMedicineAdd(newMed);
    }
    // Save to recent
    const updated = [med, ...recentMeds.filter(m => m.name !== med.name)].slice(0, 15);
    setRecentMeds(updated);
    localStorage.setItem('docClinic_recentMeds', JSON.stringify(updated));

    setQuery('');
    setShowSuggestions(false);
    toast.success(`Added: ${med.name}`, { duration: 1500, style: { fontSize: '12px' } });
    inputRef.current?.focus();
  };

  const getAIQuickRx = async () => {
    if (!diagnosis?.trim()) {
      toast.error('Enter a diagnosis first to get AI suggestions');
      return;
    }
    try {
      const { data } = await api.post('/ai/prescribe', {
        diagnosis: diagnosis.trim(),
        age: patientAge,
        allergies: []
      });
      if (data?.medicines?.length && onMedicinesSet) {
        const meds = data.medicines.map(m => ({
          name: m.name + (m.dosage ? ` ${m.dosage}` : ''),
          dosage: m.dosage || '',
          frequency: m.frequency || '1-0-1',
          duration: m.duration || '5 days',
          timing: m.timing || 'after-food'
        }));
        onMedicinesSet(meds);
        toast.success(`AI added ${meds.length} medicines in one shot!`);
      }
    } catch {
      toast.error('AI suggestion failed');
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <FiZap className="text-white text-xs" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-800">Smart Rx Builder</p>
            <p className="text-[10px] text-blue-600">Type to search 30+ medicines instantly</p>
          </div>
        </div>
        <button
          onClick={getAIQuickRx}
          className="flex items-center gap-1 px-3 py-1.5 bg-violet-100 text-violet-700 rounded-lg text-xs font-medium hover:bg-violet-200 transition-all border border-violet-200"
        >
          <FaRobot /> AI Auto-Rx
        </button>
      </div>

      {/* Search input */}
      <div ref={wrapperRef} className="relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Type medicine name (e.g., Paracetamol, Azithromycin)..."
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-300 placeholder:text-gray-400"
        />

        {/* Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-20 top-full mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-lg max-h-60 overflow-y-auto">
            {!query.trim() && recentMeds.length > 0 && (
              <p className="px-3 py-1.5 text-[10px] text-gray-400 uppercase font-semibold bg-gray-50">
                <FiClock className="inline mr-1" /> Recently used
              </p>
            )}
            {suggestions.map((med, i) => (
              <button
                key={`${med.name}-${i}`}
                onClick={() => selectMedicine(med)}
                className="w-full text-left px-3 py-2.5 hover:bg-blue-50 transition-colors flex items-center justify-between border-b border-gray-50 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{med.name}</p>
                  <p className="text-[11px] text-gray-500">
                    {med.category} · {med.defaultFreq} · {med.defaultDur}
                  </p>
                </div>
                <FiPlus className="text-gray-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Commonly prescribed quick buttons (grouped) */}
      <div>
        <p className="text-[10px] text-blue-600 font-semibold uppercase mb-1.5">Popular</p>
        <div className="flex flex-wrap gap-1.5">
          {[
            { name: 'Tab. Paracetamol 650mg', short: 'PCM 650', defaultFreq: '1-0-1', defaultDur: '3 days', category: 'Antipyretic' },
            { name: 'Tab. Azithromycin 500mg', short: 'Azithro', defaultFreq: 'OD', defaultDur: '3 days', category: 'Antibiotic' },
            { name: 'Tab. Pantoprazole 40mg', short: 'Panto', defaultFreq: '1-0-0', defaultDur: '14 days', category: 'Antacid' },
            { name: 'Tab. Cetirizine 10mg', short: 'Cetriz', defaultFreq: '0-0-1', defaultDur: '5 days', category: 'Antihistamine' },
            { name: 'Tab. Ondansetron 4mg', short: 'Emeset', defaultFreq: 'SOS', defaultDur: '3 days', category: 'Antiemetic' },
            { name: 'Syp. Ascoril-LS', short: 'Ascoril', defaultFreq: '1-1-1', defaultDur: '5 days', category: 'Cough syrup' },
            { name: 'Tab. B-Complex', short: 'B-Comp', defaultFreq: 'OD', defaultDur: '30 days', category: 'Supplement' },
          ].map(med => (
            <button
              key={med.short}
              onClick={() => selectMedicine(med)}
              className="px-2.5 py-1 bg-white text-xs font-medium text-gray-700 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all"
            >
              + {med.short}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
