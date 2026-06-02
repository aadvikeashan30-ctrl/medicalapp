import React, { useState, useRef, useEffect } from 'react';
import { FiMic, FiMicOff, FiFileText, FiLoader, FiCopy, FiCheck } from 'react-icons/fi';
import { FaRobot } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function VoiceNotes({ onInsertText }) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState(null);
  const [copied, setCopied] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    recognition.onresult = (event) => {
      let final = '';
      let interim = '';
      for (let i = 0; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) {
          final += r[0].transcript + '. ';
        } else {
          interim += r[0].transcript;
        }
      }
      if (final) setTranscript((prev) => prev + final);
      setInterimText(interim);
    };

    recognition.onerror = (e) => {
      if (e.error !== 'no-speech') toast.error(`Voice error: ${e.error}`);
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error('Voice recognition not supported in this browser');
      return;
    }
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      setTranscript('');
      setInterimText('');
      setSummary(null);
      recognitionRef.current.start();
      setListening(true);
    }
  };

  const summarizeNotes = async () => {
    if (!transcript.trim()) return;
    setSummarizing(true);
    try {
      const { data } = await api.post('/ai/summarize-notes', { text: transcript, type: 'voice' });
      setSummary(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Summarization failed');
    } finally {
      setSummarizing(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  };

  const insertSoap = () => {
    if (!summary?.soap || !onInsertText) return;
    const s = summary.soap;
    const text = `S: ${s.subjective}\nO: ${s.objective}\nA: ${s.assessment}\nP: ${s.plan}`;
    onInsertText(text);
    toast.success('SOAP notes inserted');
  };

  const hasSupport = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  if (!hasSupport) {
    return (
      <div className="text-xs text-gray-400 italic p-3 bg-gray-50 rounded-xl">
        Voice recognition is not supported in this browser. Try Chrome or Edge.
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
          <div className="w-6 h-6 bg-emerald-600 rounded-lg flex items-center justify-center">
            <FiMic className="text-white text-xs" />
          </div>
          Voice-to-Text Notes
        </div>
        {transcript && (
          <button
            onClick={() => { setTranscript(''); setSummary(null); }}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        )}
      </div>

      {/* Record button */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleListening}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
            listening
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse'
              : 'bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50'
          }`}
        >
          {listening ? <><FiMicOff /> Stop Recording</> : <><FiMic /> Start Recording</>}
        </button>
        {listening && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Listening...
          </div>
        )}
      </div>

      {/* Live transcript */}
      {(transcript || interimText) && (
        <div className="bg-white rounded-xl p-3 border border-emerald-100 min-h-[60px] relative">
          <p className="text-sm text-gray-800 whitespace-pre-wrap">
            {transcript}
            {interimText && <span className="text-gray-400 italic">{interimText}</span>}
          </p>
          {transcript && !listening && (
            <div className="flex gap-2 mt-3 pt-2 border-t border-gray-100">
              <button
                onClick={summarizeNotes}
                disabled={summarizing}
                className="text-xs bg-violet-100 text-violet-700 px-3 py-1.5 rounded-lg hover:bg-violet-200 font-medium flex items-center gap-1"
              >
                {summarizing ? <FiLoader className="animate-spin" /> : <FaRobot />}
                {summarizing ? 'Summarizing...' : 'AI Summarize → SOAP'}
              </button>
              <button
                onClick={() => copyToClipboard(transcript)}
                className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 font-medium flex items-center gap-1"
              >
                {copied ? <FiCheck /> : <FiCopy />} Copy
              </button>
            </div>
          )}
        </div>
      )}

      {/* AI Summary */}
      {summary && (
        <div className="bg-white rounded-xl p-3 border border-violet-100 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-violet-700">
              <FiFileText /> SOAP Notes (AI Generated)
            </div>
            <button
              onClick={insertSoap}
              className="text-xs bg-violet-600 text-white px-3 py-1 rounded-lg hover:bg-violet-700 font-medium"
            >
              Insert into form
            </button>
          </div>

          {summary.soap && (
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-semibold text-blue-700">S: </span>
                <span className="text-gray-700">{summary.soap.subjective}</span>
              </div>
              <div>
                <span className="font-semibold text-emerald-700">O: </span>
                <span className="text-gray-700">{summary.soap.objective}</span>
              </div>
              <div>
                <span className="font-semibold text-orange-700">A: </span>
                <span className="text-gray-700">{summary.soap.assessment}</span>
              </div>
              <div>
                <span className="font-semibold text-purple-700">P: </span>
                <span className="text-gray-700">{summary.soap.plan}</span>
              </div>
            </div>
          )}

          {summary.icd10Suggestions?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100">
              <span className="text-xs text-gray-500">ICD-10:</span>
              {summary.icd10Suggestions.map((s, i) => (
                <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono">
                  {s.code}
                </span>
              ))}
            </div>
          )}

          <p className="text-[11px] text-gray-400 italic">
            ⚠️ AI summary ({summary.provider || 'demo'}) — review before saving.
          </p>
        </div>
      )}
    </div>
  );
}
