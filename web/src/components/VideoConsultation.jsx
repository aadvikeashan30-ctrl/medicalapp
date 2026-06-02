import React, { useState, useEffect, useRef } from 'react';
import {
  FiVideo, FiVideoOff, FiMic, FiMicOff, FiPhone,
  FiMaximize2, FiMinimize2, FiCopy, FiCheckCircle,
  FiClock, FiUser, FiAlertCircle
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../utils/api';

/**
 * VideoConsultation component — Jitsi Meet integration for doctors
 * Props:
 *  - appointmentId: string
 *  - patientName: string
 *  - onEnd: () => void
 *  - onClose: () => void
 */
export default function VideoConsultation({ appointmentId, patientName, onEnd, onClose }) {
  const [status, setStatus] = useState('idle'); // idle | starting | active | ended
  const [roomData, setRoomData] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [duration, setDuration] = useState(0);
  const [notes, setNotes] = useState('');
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef(null);
  const timerRef = useRef(null);

  // Duration timer
  useEffect(() => {
    if (status === 'active') {
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const startCall = async () => {
    setStatus('starting');
    try {
      const { data } = await api.post(`/telemedicine/start/${appointmentId}`);
      setRoomData(data);
      setStatus('active');
      toast.success('Video call started! Patient has been notified.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start video call');
      setStatus('idle');
    }
  };

  const endCall = async () => {
    try {
      await api.post(`/telemedicine/end/${appointmentId}`, {
        notes: notes || undefined,
        duration: Math.ceil(duration / 60) // in minutes
      });
      setStatus('ended');
      toast.success('Consultation ended');
      onEnd?.();
    } catch (err) {
      toast.error('Failed to end call properly');
    }
  };

  const copyPatientLink = () => {
    if (roomData?.patientUrl) {
      navigator.clipboard.writeText(roomData.patientUrl);
      setCopied(true);
      toast.success('Patient link copied!');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Idle state — show start button
  if (status === 'idle') {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-md w-full p-8 text-center animate-fade-in shadow-2xl">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-violet-600 rounded-full flex items-center justify-center shadow-xl shadow-blue-500/30">
            <FiVideo className="text-white text-3xl" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Video Consultation
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-1">
            Patient: <span className="font-semibold text-gray-700 dark:text-gray-300">{patientName}</span>
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-8">
            Starting the call will notify the patient via WhatsApp with a join link.
          </p>

          <div className="space-y-3">
            <button
              onClick={startCall}
              className="w-full bg-gradient-to-r from-blue-600 to-violet-600 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:shadow-xl hover:shadow-blue-500/25 transition-all"
            >
              <FiVideo className="text-xl" /> Start Video Call
            </button>
            <button
              onClick={onClose}
              className="w-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 py-3 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
            >
              Cancel
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-left">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">Requirements:</p>
            <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-0.5">
              <li>• Stable internet connection</li>
              <li>• Camera and microphone access</li>
              <li>• Jitsi Meet opens in an embedded frame</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Starting state
  if (status === 'starting') {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 text-center animate-fade-in">
          <FiClock className="mx-auto text-4xl text-blue-500 animate-pulse mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Starting consultation...</h3>
          <p className="text-sm text-gray-500 mt-1">Generating video room</p>
        </div>
      </div>
    );
  }

  // Ended state
  if (status === 'ended') {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-md w-full p-8 text-center animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
            <FiCheckCircle className="text-emerald-600 text-3xl" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Consultation Complete</h2>
          <p className="text-gray-500 mb-1">Duration: {formatDuration(duration)}</p>
          <p className="text-sm text-gray-400">Patient: {patientName}</p>
          <button onClick={onClose} className="mt-6 btn-primary w-full py-3">Done</button>
        </div>
      </div>
    );
  }

  // Active state — show Jitsi iframe + controls
  return (
    <div className={`fixed z-50 transition-all duration-300 ${
      isFullscreen ? 'inset-0' : 'bottom-4 right-4 w-[720px] h-[520px] rounded-2xl overflow-hidden shadow-2xl'
    }`}>
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-white text-sm font-medium">
            {formatDuration(duration)} • {patientName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyPatientLink}
            className="p-2 bg-white/20 backdrop-blur rounded-lg text-white hover:bg-white/30 transition-all"
            title="Copy patient link"
          >
            {copied ? <FiCheckCircle className="text-emerald-400" /> : <FiCopy />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-white/20 backdrop-blur rounded-lg text-white hover:bg-white/30 transition-all"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
          </button>
        </div>
      </div>

      {/* Jitsi iframe */}
      <iframe
        ref={iframeRef}
        src={roomData?.doctorUrl}
        className="w-full h-full border-0 bg-gray-900"
        allow="camera; microphone; fullscreen; display-capture; autoplay"
        title="Video Consultation"
      />

      {/* Bottom controls */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent px-4 py-4">
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={endCall}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all hover:scale-105"
          >
            <FiPhone className="rotate-[135deg]" /> End Call
          </button>
        </div>
      </div>
    </div>
  );
}
