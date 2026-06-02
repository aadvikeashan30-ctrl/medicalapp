import React, { useState } from 'react';
import {
  FiGlobe, FiCopy, FiExternalLink, FiShare2, FiCheckCircle,
  FiLink, FiSmartphone, FiActivity, FiCalendar, FiUsers,
  FiSettings, FiEye, FiMessageSquare
} from 'react-icons/fi';
import { FaWhatsapp, FaQrcode, FaRobot } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { getUser } from '../utils/auth';
import { useApi } from '../hooks/useApi';
import ThreeDCard from '../components/ThreeDCard';
import FloatingOrb from '../components/FloatingOrb';
import AnimatedCounter from '../components/AnimatedCounter';

export default function PatientPortal() {
  const user = getUser();
  const [copied, setCopied] = useState('');

  // Use the user's ID for the booking link
  const doctorId = user.id || user._id || 'demo-doctor-001';
  const baseUrl = window.location.origin;
  const bookingLink = `${baseUrl}/book/${doctorId}`;
  const symptomLink = `${baseUrl}/symptom-checker`;

  const { data: stats } = useApi('/dashboard/stats');

  const copyLink = (link, label) => {
    navigator.clipboard.writeText(link);
    setCopied(label);
    toast.success(`${label} link copied!`);
    setTimeout(() => setCopied(''), 2000);
  };

  const shareWhatsApp = (link, text) => {
    const msg = encodeURIComponent(`${text}\n${link}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const portalFeatures = [
    {
      icon: FiCalendar,
      title: 'Online Appointment Booking',
      desc: 'Patients book appointments 24/7 from their phone. You get notified instantly.',
      color: 'from-blue-500 to-indigo-600',
      status: 'active'
    },
    {
      icon: FaRobot,
      title: 'AI Symptom Checker',
      desc: 'AI assesses patient urgency (Emergency/Urgent/Routine) and directs them to book.',
      color: 'from-violet-500 to-purple-600',
      status: 'active'
    },
    {
      icon: FiSmartphone,
      title: 'Mobile Friendly',
      desc: 'Works perfectly on mobile. Patients just click your link from WhatsApp/SMS.',
      color: 'from-emerald-500 to-teal-600',
      status: 'active'
    },
    {
      icon: FiMessageSquare,
      title: 'WhatsApp Integration',
      desc: 'Share booking link on WhatsApp status, groups, or directly to patients.',
      color: 'from-green-500 to-emerald-600',
      status: 'active'
    }
  ];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-8 text-white shadow-2xl">
        <FloatingOrb size={200} color="purple" top="-50px" right="-30px" opacity={0.2} />
        <FloatingOrb size={150} color="blue" bottom="-20px" left="10%" opacity={0.15} delay={1} />
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <FiGlobe /> Patient Portal
              </h1>
              <p className="text-indigo-200 mt-2 max-w-lg">
                Let patients find you, check symptoms with AI, and book appointments online — 24/7.
                Share your booking link and watch your practice grow.
              </p>
            </div>
            <div className="flex gap-3">
              <a
                href={bookingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30 text-white font-medium hover:bg-white/30 transition-all"
              >
                <FiEye /> Preview Portal
              </a>
              <a
                href={symptomLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30 text-white font-medium hover:bg-white/30 transition-all"
              >
                <FaRobot /> Symptom Checker
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Link Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Your Booking Link */}
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <FiLink className="text-blue-600" /> Your Booking Link
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Share this link with patients. They can book appointments directly from their phone.
          </p>

          {/* Link display */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-1">Appointment Booking</p>
                <p className="text-sm font-mono text-blue-600 truncate">{bookingLink}</p>
              </div>
              <button
                onClick={() => copyLink(bookingLink, 'Booking')}
                className={`p-2.5 rounded-xl transition-all ${copied === 'Booking' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}
              >
                {copied === 'Booking' ? <FiCheckCircle /> : <FiCopy />}
              </button>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-1">AI Symptom Checker</p>
                <p className="text-sm font-mono text-violet-600 truncate">{symptomLink}</p>
              </div>
              <button
                onClick={() => copyLink(symptomLink, 'Symptom')}
                className={`p-2.5 rounded-xl transition-all ${copied === 'Symptom' ? 'bg-emerald-100 text-emerald-600' : 'bg-violet-100 text-violet-600 hover:bg-violet-200'}`}
              >
                {copied === 'Symptom' ? <FiCheckCircle /> : <FiCopy />}
              </button>
            </div>
          </div>

          {/* Share buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => shareWhatsApp(bookingLink, `Book your appointment with Dr. ${user.name} online:`)}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors text-sm font-medium"
            >
              <FaWhatsapp /> Share on WhatsApp
            </button>
            <button
              onClick={() => copyLink(bookingLink, 'Booking')}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors text-sm font-medium"
            >
              <FiShare2 /> Copy Link
            </button>
            <a
              href={bookingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              <FiExternalLink /> Open Preview
            </a>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <ThreeDCard intensity={8}>
            <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FiUsers className="text-white text-xl" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900"><AnimatedCounter end={stats?.totalPatients || 0} /></p>
                  <p className="text-sm text-gray-500">Total Patients</p>
                </div>
              </div>
            </div>
          </ThreeDCard>

          <ThreeDCard intensity={8}>
            <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FiCalendar className="text-white text-xl" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900"><AnimatedCounter end={stats?.todayAppointments || 0} /></p>
                  <p className="text-sm text-gray-500">Today's Appointments</p>
                </div>
              </div>
            </div>
          </ThreeDCard>

          <ThreeDCard intensity={8}>
            <div className="p-5 bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border border-violet-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FiActivity className="text-white text-xl" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900"><AnimatedCounter end={stats?.newPatientsThisMonth || 0} /></p>
                  <p className="text-sm text-gray-500">New This Month (via Portal)</p>
                </div>
              </div>
            </div>
          </ThreeDCard>
        </div>
      </div>

      {/* How It Works */}
      <div className="card">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">How Patient Portal Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { step: '1', title: 'Share Link', desc: 'Share your booking link on WhatsApp, website, or Google listing', icon: FiShare2, color: 'blue' },
            { step: '2', title: 'Patient Visits', desc: 'Patient opens link, checks symptoms with AI or books directly', icon: FiSmartphone, color: 'violet' },
            { step: '3', title: 'Books Slot', desc: 'Patient selects date, time, enters details — gets token number', icon: FiCalendar, color: 'emerald' },
            { step: '4', title: 'You Get Notified', desc: 'Appointment appears in your queue. Patient arrives on time.', icon: FiCheckCircle, color: 'amber' }
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className={`w-12 h-12 mx-auto mb-3 bg-${item.color}-100 dark:bg-${item.color}-900/30 rounded-full flex items-center justify-center`}>
                <item.icon className={`text-${item.color}-600 text-xl`} />
              </div>
              <div className={`w-7 h-7 mx-auto -mt-5 mb-2 bg-${item.color}-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md`}>
                {item.step}
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{item.title}</h4>
              <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {portalFeatures.map((feat, idx) => (
          <ThreeDCard key={idx} intensity={8}>
            <div className="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-start gap-4">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${feat.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                <feat.icon className="text-white text-lg" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900 dark:text-white">{feat.title}</h4>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">
                    {feat.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{feat.desc}</p>
              </div>
            </div>
          </ThreeDCard>
        ))}
      </div>

      {/* Tips */}
      <div className="card bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-100 dark:border-amber-800">
        <h3 className="font-bold text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-2">
          💡 Pro Tips to Get More Patients
        </h3>
        <ul className="space-y-2 text-sm text-amber-700 dark:text-amber-400">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0" />
            Add your booking link to WhatsApp Business profile & auto-reply
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0" />
            Share the AI Symptom Checker on social media — patients love free health tools
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0" />
            Print a QR code of your booking link and display at your clinic reception
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0" />
            Add link to your Google My Business listing for direct online bookings
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0" />
            After each visit, WhatsApp patients the symptom checker link for follow-ups
          </li>
        </ul>
      </div>
    </div>
  );
}
