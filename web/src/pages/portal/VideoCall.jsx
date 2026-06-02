import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { FiVideo, FiClock, FiUser, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import { FaHeartbeat, FaStethoscope } from 'react-icons/fa';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export default function VideoCall() {
  const { appointmentId } = useParams();
  const [searchParams] = useSearchParams();
  const phone = searchParams.get('phone') || '';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (!appointmentId) return;
    const fetchRoom = async () => {
      try {
        const { data: room } = await api.get(`/telemedicine/join/${appointmentId}?phone=${phone}`);
        setData(room);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load video consultation');
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();
    // Poll every 10s if waiting
    const interval = setInterval(fetchRoom, 10000);
    return () => clearInterval(interval);
  }, [appointmentId, phone]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <FiClock className="mx-auto text-4xl text-blue-400 animate-pulse mb-4" />
          <p className="text-gray-300">Loading video consultation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 p-6">
        <div className="text-center max-w-sm">
          <FiAlertTriangle className="mx-auto text-4xl text-red-400 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Unable to Join</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link to="/" className="btn-primary">Go Home</Link>
        </div>
      </div>
    );
  }

  // Waiting for doctor to start
  if (data?.status === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-500/20 to-violet-500/20 rounded-full flex items-center justify-center border-2 border-blue-500/30">
            <FiVideo className="text-blue-400 text-4xl animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Waiting for Doctor</h2>
          <p className="text-gray-400 mb-6">{data.message}</p>

          <div className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700 text-left space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Doctor</span>
              <span className="text-white font-medium">Dr. {data.appointment?.doctor}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date</span>
              <span className="text-white font-medium">
                {new Date(data.appointment?.date).toLocaleDateString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Time</span>
              <span className="text-white font-medium">{data.appointment?.timeSlot}</span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            Auto-refreshing... The call will appear when the doctor starts it.
          </div>
        </div>
      </div>
    );
  }

  // Ready to join
  if (data?.status === 'ready' && !joined) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full flex items-center justify-center border-2 border-emerald-500/50">
            <FiCheckCircle className="text-emerald-400 text-4xl" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Doctor is Ready!</h2>
          <p className="text-gray-400 mb-2">Dr. {data.appointment?.doctor} has started the consultation</p>
          <p className="text-xs text-gray-500 mb-6">Token #{data.appointment?.tokenNumber}</p>

          <button
            onClick={() => setJoined(true)}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:shadow-xl hover:shadow-emerald-500/25 transition-all"
          >
            <FiVideo className="text-xl" /> Join Video Call
          </button>

          <div className="mt-4 p-3 bg-gray-800/50 rounded-xl text-xs text-gray-400">
            Make sure your camera and microphone are enabled.
          </div>
        </div>
      </div>
    );
  }

  // Joined — show Jitsi iframe
  if (joined && data?.joinUrl) {
    return (
      <div className="fixed inset-0 bg-black">
        {/* Minimal header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/60 to-transparent px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaHeartbeat className="text-blue-400" />
            <span className="text-white text-sm font-medium">
              Consultation with Dr. {data.appointment?.doctor}
            </span>
          </div>
          <span className="text-xs text-gray-400">
            Token #{data.appointment?.tokenNumber}
          </span>
        </div>

        {/* Jitsi iframe */}
        <iframe
          src={data.joinUrl}
          className="w-full h-full border-0"
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          title="Video Consultation"
        />
      </div>
    );
  }

  return null;
}
