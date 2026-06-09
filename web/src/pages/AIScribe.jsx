import React, { useState, useRef } from 'react';
import {
  FiMic, FiMicOff, FiCpu, FiCopy, FiCheck, FiFileText,
  FiClipboard, FiActivity, FiEdit3, FiZap, FiAlertCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useApi } from '../hooks/useApi';
import PatientSearchSelect from '../components/PatientSearchSelect';

export default function AIScribe() {
  const [patientId, setPatientId] = useState('');
  const [transcript, setTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const recognitionRef = useRef(null);

  const { data: patients } = useApi('/patients?limit=200');

  const toggleListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      toast.error('Voice capture is not supported in this browser. You can type or paste the transcript.');
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';
    recognition.onresult = (event) => {
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalText += event.results[i][0].transcript + ' ';
      }
      if (finalText) setTranscript((prev) => (prev + ' ' + finalText).trim());
    };
    recognition.onerror = () => { setListening(false); toast.error('Voice capture stopped'); };
    recognition.onend = () => setListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
  };

  const generate = async () => {
    if (!transcript.trim()) return toast.error('Add a consultation transcript first');
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post('/doctor/scribe', { transcript, patientId: patientId || undefined });
      setResult(res.data);
      toast.success('Note drafted — review & sign off');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate note');
    } finally {
      setLoading(false);
    }
  };

  const copyNote = () => {
    if (!result?.soap) return;
    const s = result.soap;
    const text = `SUBJECTIVE:\n${s.subjective}\n\nOBJECTIVE:\n${s.objective}\n\nASSESSMENT:\n${s.assessment}\n\nPLAN:\n${s.plan}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('SOAP note copied');
  };

  const sendToPrescription = () => {
    if (!result?.draftPrescription) return;
    sessionStorage.setItem('scribeDraft', JSON.stringify({ patientId, ...result.draftPrescription }));
    toast.success('Draft saved — open Prescriptions to finalize');
  };

  const soapFields = result?.soap
    ? [
        { key: 'subjective', label: 'Subjective', color: 'border-blue-200 bg-blue-50/50' },
        { key: 'objective', label: 'Objective', color: 'border-emerald-200 bg-emerald-50/50' },
        { key: 'assessment', label: 'Assessment', color: 'border-violet-200 bg-violet-50/50' },
        { key: 'plan', label: 'Plan', color: 'border-amber-200 bg-amber-50/50' }
      ]
    : [];

  return (
    <div className="page-enter space-y-6">
      {/* Header */}
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
            <FiMic className="text-white text-lg" />
          </div>
          Ambient AI Scribe
        </h1>
        <p className="text-sm text-gray-500 mt-1">Capture the consultation, and let AI draft the structured note + prescription. You review and sign off.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Capture panel */}
        <div className="card space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Patient (optional)</label>
            <PatientSearchSelect
              patients={(patients?.patients || patients || [])}
              value={patientId}
              onChange={setPatientId}
              placeholder="Link to a patient..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Consultation Transcript</label>
              <button
                onClick={toggleListening}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  listening ? 'bg-red-500 text-white animate-pulse' : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                }`}
              >
                {listening ? <><FiMicOff /> Stop</> : <><FiMic /> Dictate</>}
              </button>
            </div>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={12}
              className="input-field font-mono text-sm leading-relaxed"
              placeholder="Speak using Dictate, or type/paste the consultation here. e.g. 'Patient is a 6 year old with cough and fever for 3 days...'"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-400">{transcript.trim().split(/\s+/).filter(Boolean).length} words</span>
              {transcript && <button onClick={() => setTranscript('')} className="text-xs text-gray-400 hover:text-red-500">Clear</button>}
            </div>
          </div>

          <button onClick={generate} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            <FiCpu /> {loading ? 'Drafting note...' : 'Generate Structured Note'}
          </button>
        </div>

        {/* Result panel */}
        <div className="space-y-4">
          {!result ? (
            <div className="card h-full flex flex-col items-center justify-center text-center py-16 text-gray-400">
              <FiZap className="text-4xl mb-3 text-teal-300" />
              <p className="text-sm">Your AI-drafted SOAP note and prescription will appear here.</p>
            </div>
          ) : (
            <>
              {/* SOAP */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <FiFileText className="text-teal-600" /> SOAP Note
                  </h3>
                  <button onClick={copyNote} className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-full">
                    {copied ? <><FiCheck /> Copied</> : <><FiCopy /> Copy</>}
                  </button>
                </div>
                <div className="space-y-3">
                  {soapFields.map((f) => (
                    <div key={f.key} className={`p-3 rounded-xl border ${f.color}`}>
                      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">{f.label}</p>
                      <p className="text-sm text-gray-800 dark:text-gray-200">{result.soap[f.key]}</p>
                    </div>
                  ))}
                </div>
                {(result.icd10Suggestions || []).length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {result.icd10Suggestions.map((c, i) => (
                      <span key={i} className="badge badge-info" title={c.description}>{c.code} · {c.description}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Draft prescription */}
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <FiClipboard className="text-violet-600" /> Draft Prescription
                  </h3>
                  <button onClick={sendToPrescription} className="flex items-center gap-1.5 text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-full">
                    <FiEdit3 /> Use Draft
                  </button>
                </div>
                {result.draftPrescription?.diagnosis && (
                  <p className="text-sm mb-2"><span className="text-gray-500">Diagnosis:</span> <span className="font-medium">{result.draftPrescription.diagnosis}</span></p>
                )}
                {(result.draftPrescription?.medicines || []).length > 0 ? (
                  <div className="space-y-2">
                    {result.draftPrescription.medicines.map((m, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <FiActivity className="text-violet-500 flex-shrink-0" />
                        <div className="text-sm">
                          <span className="font-semibold text-gray-900 dark:text-white">{m.name}</span>
                          {m.dosage && <span className="text-gray-500"> · {m.dosage}</span>}
                          {m.frequency && <span className="text-gray-500"> · {m.frequency}</span>}
                          {m.duration && <span className="text-gray-500"> · {m.duration}</span>}
                          {m.timing && <span className="text-gray-400 text-xs"> ({m.timing})</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No medicines extracted from the transcript.</p>
                )}
                {result.draftPrescription?.advice && (
                  <p className="text-sm mt-3 text-gray-600 dark:text-gray-300"><span className="text-gray-400">Advice:</span> {result.draftPrescription.advice}</p>
                )}
              </div>

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
