import React, { useState } from 'react';
import {
  FiUser, FiAward, FiMapPin, FiPhone, FiMail,
  FiClock, FiStar, FiCalendar, FiEdit2, FiCamera,
  FiActivity, FiTrendingUp, FiUsers, FiBookOpen
} from 'react-icons/fi';
import { FaStethoscope, FaGraduationCap, FaHospital, FaQrcode } from 'react-icons/fa';
import { getUser } from '../utils/auth';
import ThreeDCard from '../components/ThreeDCard';
import AnimatedCounter from '../components/AnimatedCounter';
import FloatingOrb from '../components/FloatingOrb';
import QRBookingCode from '../components/QRBookingCode';

export default function DoctorProfile() {
  const user = getUser();
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FiUser },
    { id: 'qr-booking', label: 'QR Booking', icon: FaQrcode },
    { id: 'achievements', label: 'Achievements', icon: FiAward },
    { id: 'schedule', label: 'Schedule', icon: FiClock },
    { id: 'reviews', label: 'Reviews', icon: FiStar }
  ];

  const achievements = [
    { icon: FiUsers, title: '500+ Patients', desc: 'Treated successfully', color: 'blue' },
    { icon: FiCalendar, title: '5 Years', desc: 'Clinical experience', color: 'purple' },
    { icon: FiStar, title: '4.9 Rating', desc: 'Patient satisfaction', color: 'yellow' },
    { icon: FiAward, title: 'Certified', desc: 'Board certified specialist', color: 'emerald' }
  ];

  const reviews = [
    { name: 'Priya S.', rating: 5, text: 'Excellent doctor! Very thorough in diagnosis.', date: '2 days ago' },
    { name: 'Rahul M.', rating: 5, text: 'Best experience. Staff is also very helpful.', date: '1 week ago' },
    { name: 'Sunita K.', rating: 4, text: 'Good treatment. Clinic can be a bit crowded.', date: '2 weeks ago' }
  ];

  const schedule = [
    { day: 'Monday', time: '09:00 AM - 06:00 PM', patients: 12 },
    { day: 'Tuesday', time: '09:00 AM - 06:00 PM', patients: 15 },
    { day: 'Wednesday', time: '09:00 AM - 02:00 PM', patients: 8 },
    { day: 'Thursday', time: '09:00 AM - 06:00 PM', patients: 14 },
    { day: 'Friday', time: '09:00 AM - 06:00 PM', patients: 11 },
    { day: 'Saturday', time: '10:00 AM - 02:00 PM', patients: 6 }
  ];

  return (
    <div className="animate-fade-in space-y-6 max-w-6xl mx-auto">
      {/* Profile Header with 3D elements */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-600 to-violet-700 p-8 shadow-2xl">
        <FloatingOrb size={250} color="purple" top="-50px" right="-30px" opacity={0.2} />
        <FloatingOrb size={180} color="cyan" bottom="-30px" left="20%" opacity={0.15} delay={1.5} />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="relative group">
            <div className="w-28 h-28 rounded-2xl bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center shadow-2xl transform-3d">
              <FaStethoscope className="text-white text-4xl" />
            </div>
            <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
              <FiCamera className="text-gray-600 text-sm" />
            </button>
          </div>

          {/* Info */}
          <div className="text-center md:text-left text-white flex-1">
            <h1 className="text-3xl font-bold">Dr. {user.name || 'Doctor Name'}</h1>
            <p className="text-blue-200 mt-1 flex items-center justify-center md:justify-start gap-2">
              <FaGraduationCap /> {user.qualification || 'MBBS, MD'} | {user.specialty || 'General Physician'}
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-3 text-blue-100 text-sm">
              <span className="flex items-center gap-1"><FiMapPin /> {user.clinicCity || 'Mumbai'}</span>
              <span className="flex items-center gap-1"><FiPhone /> {user.phone || '+91 98765 43210'}</span>
              <span className="flex items-center gap-1"><FiMail /> {user.email || 'doctor@clinic.com'}</span>
            </div>
          </div>

          {/* Quick stats */}
          <div className="flex gap-4">
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
              <p className="text-2xl font-bold text-white"><AnimatedCounter end={547} /></p>
              <p className="text-xs text-blue-200">Patients</p>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
              <p className="text-2xl font-bold text-white"><AnimatedCounter end={4.9} decimals={1} /></p>
              <p className="text-xs text-blue-200">Rating</p>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
              <p className="text-2xl font-bold text-white"><AnimatedCounter end={5} suffix="yr" /></p>
              <p className="text-xs text-blue-200">Experience</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <tab.icon className="text-base" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <FiBookOpen className="text-blue-600" /> About
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Dedicated healthcare professional with over 5 years of clinical experience.
                Specializing in {user.specialty || 'general medicine'} with a patient-first approach.
                Committed to providing comprehensive care using the latest medical practices and technology.
              </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'This Month', value: 86, icon: FiCalendar, color: 'blue' },
                { label: 'Avg/Day', value: 12, icon: FiActivity, color: 'emerald' },
                { label: 'Growth', value: 23, suffix: '%', icon: FiTrendingUp, color: 'purple' },
                { label: 'Revenue', value: 1.5, suffix: 'L', prefix: '₹', icon: FiTrendingUp, color: 'orange' }
              ].map((stat) => (
                <ThreeDCard key={stat.label} intensity={8}>
                  <div className="p-4 bg-white rounded-2xl border border-gray-100">
                    <stat.icon className={`text-${stat.color}-600 text-lg mb-2`} />
                    <p className="text-2xl font-bold text-gray-900">
                      <AnimatedCounter end={stat.value} prefix={stat.prefix || ''} suffix={stat.suffix || ''} decimals={stat.value < 10 ? 1 : 0} />
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                  </div>
                </ThreeDCard>
              ))}
            </div>

            {/* Specializations */}
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Specializations</h3>
              <div className="flex flex-wrap gap-2">
                {['General Consultation', 'Preventive Care', 'Chronic Disease', 'Pediatrics', 'Geriatric Care', 'Emergency Medicine', 'Health Checkups', 'Vaccination'].map(tag => (
                  <span key={tag} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <FaHospital className="text-emerald-600" /> Clinic Info
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-gray-600">
                  <FaHospital className="text-gray-400" />
                  <span>{user.clinicName || 'My Clinic'}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <FiMapPin className="text-gray-400" />
                  <span>{user.clinicAddress || '123 Medical Street'}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <FiClock className="text-gray-400" />
                  <span>Mon-Sat: 9AM - 6PM</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <FiPhone className="text-gray-400" />
                  <span>{user.phone || '+91 98765 43210'}</span>
                </div>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
              <h4 className="font-bold text-gray-900 mb-2">Consultation Fee</h4>
              <p className="text-3xl font-bold text-blue-600">₹{user.consultationFee || 500}</p>
              <p className="text-xs text-gray-500 mt-1">Per visit (follow-up: ₹{Math.round((user.consultationFee || 500) * 0.6)})</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'qr-booking' && (
        <div className="animate-fade-in max-w-lg mx-auto">
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <FaQrcode className="text-indigo-600" /> Patient Booking QR Code
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Print or share this QR code. Patients scan it to book appointments directly with you online.
            </p>
            <QRBookingCode />
          </div>
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              <strong>💡 Tips:</strong> Put this QR on your visiting card, clinic wall, prescription pad, or share via WhatsApp groups to get more patients booking online.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
          {achievements.map((item, idx) => (
            <ThreeDCard key={idx} intensity={8}>
              <div className="p-6 bg-white rounded-2xl border border-gray-100 flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl bg-${item.color}-100 flex items-center justify-center`}>
                  <item.icon className={`text-${item.color}-600 text-2xl`} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{item.title}</h4>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
              </div>
            </ThreeDCard>
          ))}
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="card animate-fade-in">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Weekly Schedule</h3>
          <div className="space-y-3">
            {schedule.map((day) => (
              <div key={day.day} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <FiCalendar className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{day.day}</p>
                    <p className="text-sm text-gray-500">{day.time}</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                  ~{day.patients} patients
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="space-y-4 animate-fade-in">
          {reviews.map((review, idx) => (
            <div key={idx} className="card">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                    {review.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{review.name}</p>
                    <p className="text-xs text-gray-400">{review.date}</p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <FiStar key={i} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2">{review.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
