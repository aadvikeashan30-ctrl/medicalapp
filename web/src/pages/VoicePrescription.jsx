import React, { useState } from 'react';
import { FiMic, FiMicOff, FiEdit, FiSave, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function VoicePrescription() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [patientId, setPatientId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const toggleRecording = () => {
    if (!isRecording) {
      // Start recording using Web Speech API
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-IN';

        recognition.onresult = (event) => {
          let transcript = '';
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setTranscription(transcript);
        };

        recognition.onerror = (event) => {
          toast.error('Speech recognition error: ' + event.error);
          setIsRecording(false);
        };

        recognition.onend = () => setIsRecording(false);
        recognition.start();
        setIsRecording(true);
        window._recognition = recognition;
      } else {
        toast.error('Speech recognition not supported in this browser');
      }
    } else {
      // Stop recording
      if (window._recognition) {
        window._recognition.stop();
        window._recognition = null;
      }
      setIsRecording(false);
    }
  };

  const handleProcess = async () => {
    if (!transcription.trim()) {
      toast.error('Please provide a voice transcription');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.post('/doctor/voice-prescription', {
        transcription: transcription.trim(),
        patientId: patientId || undefined
      });
      setResult(data);
      toast.success('Prescription generated from voice');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FiMic className="text-red-600" /> Voice-to-Prescription AI
        </h1>
        <p className="text-gray-500 text-sm mt-1">Dictate prescriptions and let AI structure them automatically</p>
      </div>

      {/* Recording Area */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={toggleRecording}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${
              isRecording
                ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-200'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-red-50 hover:text-red-500'
            }`}
          >
            {isRecording ? <FiMicOff size={32} /> : <FiMic size={32} />}
          </button>
          <p className="text-sm text-gray-500">
            {isRecording ? 'Recording... Click to stop' : 'Click to start dictating'}
          </p>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Patient ID (optional)</label>
          <input type="text" value={patientId} onChange={e => setPatientId(e.target.value)} placeholder="Enter patient ID for allergy checks..." className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white mb-4" />

          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Transcription / Dictation</label>
          <textarea
            value={transcription}
            onChange={e => setTranscription(e.target.value)}
            rows={5}
            placeholder="Dictate or type: 'Patient has fever and cough since 3 days. Prescribe Paracetamol 500mg twice daily after food for 3 days. Tab Cetirizine 10mg at bedtime for 5 days. Advise steam inhalation and rest. Follow up after 5 days if not better.'"
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-sm"
          />
        </div>

        <button onClick={handleProcess} disabled={loading || !transcription.trim()} className="mt-4 bg-red-600 text-white px-6 py-2.5 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2">
          {loading ? <span className="animate-spin">⏳</span> : <FiEdit />}
          {loading ? 'Processing...' : 'Generate Prescription'}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="space-y-4">
          {/* Diagnosis & Symptoms */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Structured Prescription</h2>

            {result.diagnosis && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Diagnosis</h3>
                <p className="text-gray-900 dark:text-white font-medium">{result.diagnosis}</p>
              </div>
            )}

            {result.symptoms && result.symptoms.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Symptoms</h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  {result.symptoms.map((s, i) => (
                    <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs rounded-full">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Vitals */}
            {result.vitals && Object.values(result.vitals).some(v => v) && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Vitals</h3>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-1">
                  {result.vitals.bp && <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded text-center"><span className="text-xs text-gray-500">BP</span><p className="text-sm font-medium">{result.vitals.bp}</p></div>}
                  {result.vitals.pulse && <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded text-center"><span className="text-xs text-gray-500">Pulse</span><p className="text-sm font-medium">{result.vitals.pulse}</p></div>}
                  {result.vitals.temperature && <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded text-center"><span className="text-xs text-gray-500">Temp</span><p className="text-sm font-medium">{result.vitals.temperature}</p></div>}
                  {result.vitals.weight && <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded text-center"><span className="text-xs text-gray-500">Weight</span><p className="text-sm font-medium">{result.vitals.weight}</p></div>}
                  {result.vitals.spo2 && <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded text-center"><span className="text-xs text-gray-500">SpO2</span><p className="text-sm font-medium">{result.vitals.spo2}</p></div>}
                </div>
              </div>
            )}
          </div>

          {/* Medicines */}
          {result.medicines && result.medicines.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white mb-3">Medicines</h3>
              <div className="space-y-3">
                {result.medicines.map((med, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
                    <span className="text-green-600 font-bold text-sm mt-0.5">{i + 1}.</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{med.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {med.dosage} | {med.frequency} | {med.duration}
                        {med.timing && ` | ${med.timing}`}
                      </p>
                      {med.notes && <p className="text-xs text-gray-500 mt-1">{med.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tests & Advice */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.tests && result.tests.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Lab Tests</h3>
                <ul className="space-y-1">
                  {result.tests.map((t, i) => (
                    <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <span className="text-teal-500">•</span> {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.advice && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Advice</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">{result.advice}</p>
                {result.followUpDays && (
                  <p className="text-sm text-orange-600 mt-2 font-medium">Follow-up: {result.followUpDays} days</p>
                )}
              </div>
            )}
          </div>

          {/* Disclaimer */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <p className="text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <FiAlertTriangle className="mt-0.5 flex-shrink-0" />
              {result.disclaimer || 'AI-generated prescription. Please review all medications, dosages, and instructions before finalizing.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
