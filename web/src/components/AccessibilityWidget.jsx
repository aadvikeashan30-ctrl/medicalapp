import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiX, FiType, FiEye, FiMic, FiMicOff, FiRotateCcw, FiZap
} from 'react-icons/fi';
import { MdAccessibility } from 'react-icons/md';
import toast from 'react-hot-toast';
import { useAccessibility } from '../context/AccessibilityContext';

// Spoken phrase -> route map for voice navigation
const VOICE_ROUTES = [
  { keys: ['dashboard', 'home'], path: '/' },
  { keys: ['patient'], path: '/patients' },
  { keys: ['appointment', 'schedule'], path: '/appointments' },
  { keys: ['prescription'], path: '/prescriptions' },
  { keys: ['billing', 'invoice', 'payment'], path: '/billing' },
  { keys: ['lab', 'report'], path: '/lab-tests' },
  { keys: ['pharmacy', 'medicine'], path: '/medicines' },
  { keys: ['care pathway', 'care plan', 'checklist'], path: '/care-pathways' },
  { keys: ['wound', 'skin', 'tracker'], path: '/wound-tracker' },
  { keys: ['waitlist', 'wait list'], path: '/waitlist' },
  { keys: ['scribe'], path: '/ai-scribe' },
  { keys: ['guard', 'interaction'], path: '/rx-guard' },
  { keys: ['analytics', 'practice'], path: '/practice-analytics' },
  { keys: ['certificate'], path: '/certificates' },
  { keys: ['setting'], path: '/settings' }
];


export default function AccessibilityWidget() {
  const { prefs, update, reset } = useAccessibility();
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const navigate = useNavigate();
  const recognitionRef = useRef(null);

  const handleVoiceCommand = (text) => {
    const t = text.toLowerCase();
    if (t.includes('large text') || t.includes('bigger text')) { update({ textScale: 'large' }); toast.success('Large text on'); return; }
    if (t.includes('high contrast')) { update({ highContrast: true }); toast.success('High contrast on'); return; }
    if (t.includes('normal text') || t.includes('reset')) { reset(); toast.success('Settings reset'); return; }
    const match = VOICE_ROUTES.find((r) => r.keys.some((k) => t.includes(k)));
    if (match) { navigate(match.path); toast.success(`Opening ${match.path === '/' ? 'dashboard' : match.path.replace('/', '')}`); }
    else toast('Heard: "' + text + '" — try "go to patients"', { icon: '🎤' });
  };

  const toggleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast.error('Voice navigation is not supported in this browser'); return; }
    if (listening) { recognitionRef.current?.stop(); setListening(false); return; }
    const rec = new SR();
    rec.lang = 'en-IN';
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => handleVoiceCommand(e.results[0][0].transcript);
    rec.onerror = () => { setListening(false); };
    rec.onend = () => setListening(false);
    rec.start();
    recognitionRef.current = rec;
    setListening(true);
  };

  const scaleOptions = [
    { value: 'normal', label: 'A', size: 'text-sm' },
    { value: 'large', label: 'A', size: 'text-base' },
    { value: 'xlarge', label: 'A', size: 'text-lg' }
  ];

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 left-5 z-[60] w-12 h-12 rounded-full bg-gradient-to-br from-teal-600 to-cyan-700 text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
        title="Accessibility options"
        aria-label="Accessibility options"
      >
        <MdAccessibility className="text-xl" />
      </button>

      {open && (
        <div className="fixed bottom-20 left-5 z-[60] w-72 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-5 animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><MdAccessibility className="text-teal-600" /> Accessibility</h3>
            <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><FiX className="text-gray-500" /></button>
          </div>

          {/* Text size */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5"><FiType /> Text Size</p>
            <div className="grid grid-cols-3 gap-2">
              {scaleOptions.map((o) => (
                <button key={o.value} onClick={() => update({ textScale: o.value })}
                  className={`py-2 rounded-xl border font-bold ${o.size} ${prefs.textScale === o.value ? 'border-teal-400 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-500'}`}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2 mb-4">
            <button onClick={() => update({ highContrast: !prefs.highContrast })} className={`w-full flex items-center justify-between p-3 rounded-xl border ${prefs.highContrast ? 'border-teal-400 bg-teal-50' : 'border-gray-200'}`}>
              <span className="flex items-center gap-2 text-sm font-medium text-gray-700"><FiEye /> High Contrast</span>
              <span className={`w-9 h-5 rounded-full relative transition-colors ${prefs.highContrast ? 'bg-teal-500' : 'bg-gray-300'}`}><span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${prefs.highContrast ? 'left-[18px]' : 'left-0.5'}`} /></span>
            </button>
            <button onClick={() => update({ reduceMotion: !prefs.reduceMotion })} className={`w-full flex items-center justify-between p-3 rounded-xl border ${prefs.reduceMotion ? 'border-teal-400 bg-teal-50' : 'border-gray-200'}`}>
              <span className="flex items-center gap-2 text-sm font-medium text-gray-700"><FiZap /> Reduce Motion</span>
              <span className={`w-9 h-5 rounded-full relative transition-colors ${prefs.reduceMotion ? 'bg-teal-500' : 'bg-gray-300'}`}><span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${prefs.reduceMotion ? 'left-[18px]' : 'left-0.5'}`} /></span>
            </button>
          </div>

          {/* Voice navigation */}
          <button onClick={toggleVoice} className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold mb-2 ${listening ? 'bg-red-500 text-white animate-pulse' : 'bg-teal-600 text-white hover:bg-teal-700'}`}>
            {listening ? <><FiMicOff /> Listening… speak now</> : <><FiMic /> Voice Navigation</>}
          </button>
          <p className="text-[11px] text-gray-400 text-center mb-3">Try: “go to patients”, “open billing”, “large text”</p>

          <button onClick={reset} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium text-gray-500 hover:bg-gray-50"><FiRotateCcw /> Reset to defaults</button>
        </div>
      )}
    </>
  );
}
