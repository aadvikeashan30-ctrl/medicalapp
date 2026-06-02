import React from 'react';
import { Link } from 'react-router-dom';
import {
  FiSearch, FiCalendar, FiVideo, FiShield, FiStar,
  FiActivity, FiCheckCircle, FiArrowRight, FiHeart,
  FiSmartphone, FiClock, FiUsers, FiZap
} from 'react-icons/fi';
import { FaHeartbeat, FaStethoscope, FaWhatsapp, FaRobot, FaUserMd } from 'react-icons/fa';

const features = [
  { icon: FiSearch, title: 'Find Doctors', desc: 'Search by specialty, location, and ratings. Book in 30 seconds.', color: 'blue', link: '/find-doctor' },
  { icon: FiVideo, title: 'Video Consultation', desc: 'Consult from home. No travel, no waiting. Pay online.', color: 'violet', link: '/find-doctor' },
  { icon: FiActivity, title: 'AI Symptom Checker', desc: 'Check symptoms instantly. Get urgency assessment & next steps.', color: 'emerald', link: '/symptom-checker' },
  { icon: FiCalendar, title: 'Easy Booking', desc: 'Real-time slots, instant confirmation, zero phone calls.', color: 'orange', link: '/find-doctor' },
  { icon: FiSmartphone, title: 'Track Live Queue', desc: 'Know your token position in real-time. No more guessing.', color: 'pink', link: '/track' },
  { icon: FiShield, title: 'Secure Records', desc: 'Access prescriptions, lab reports & bills anytime with OTP.', color: 'indigo', link: '/my-records' }
];

const doctorFeatures = [
  { icon: FaRobot, title: 'AI Clinical Assistant', desc: 'GPT-4 powered diagnosis, prescriptions & risk scoring' },
  { icon: FaWhatsapp, title: 'WhatsApp + SMS', desc: 'Automated reminders, prescription sharing, bulk messaging' },
  { icon: FiVideo, title: 'Telemedicine', desc: 'One-click video consultations with Jitsi - no setup needed' },
  { icon: FiZap, title: 'Online Payments', desc: 'Razorpay integration - patients pay during booking' },
  { icon: FiUsers, title: 'Patient Portal', desc: 'Patients find you, book online, track queue, leave reviews' },
  { icon: FiStar, title: 'QR Booking Code', desc: 'Print QR for clinic wall, cards & prescriptions' }
];

const stats = [
  { value: '1,000+', label: 'Doctors Trust Us' },
  { value: '50,000+', label: 'Appointments Booked' },
  { value: '4.8★', label: 'Average Rating' },
  { value: '₹499', label: 'Starting Price' }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <FaHeartbeat className="text-white" />
            </div>
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">DocClinic Pro</span>
              <span className="hidden sm:block text-[10px] text-gray-400 -mt-0.5">Smart Healthcare Platform</span>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600 dark:text-gray-400">
            <Link to="/find-doctor" className="hover:text-blue-600 transition-colors">Find Doctor</Link>
            <Link to="/symptom-checker" className="hover:text-blue-600 transition-colors">Symptom Checker</Link>
            <Link to="/pricing" className="hover:text-blue-600 transition-colors">For Doctors</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/find-doctor" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors">
              <FiSearch className="text-base" /> Search
            </Link>
            <Link to="/login" className="bg-gradient-to-r from-blue-600 to-violet-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all">
              Doctor Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full px-4 py-1.5 text-xs font-semibold mb-6">
              <FiZap /> #1 Clinic Management Platform in India
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white leading-tight">
              Healthcare Made{' '}
              <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
                Simple
              </span>
            </h1>

            <p className="mt-6 text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Find trusted doctors, book instantly, consult via video, and manage your health — all in one platform. For patients & doctors.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/find-doctor"
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-violet-600 text-white px-8 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:shadow-2xl hover:shadow-blue-500/25 hover:-translate-y-0.5 transition-all"
              >
                <FiSearch /> Find a Doctor
              </Link>
              <Link
                to="/symptom-checker"
                className="w-full sm:w-auto bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-8 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700"
              >
                <FiActivity /> Check Symptoms Free
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 md:gap-10">
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* For Patients Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              For <span className="text-blue-600">Patients</span>
            </h2>
            <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
              Everything you need to manage your health, from finding the right doctor to tracking your treatment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <Link
                key={i}
                to={f.link}
                className="group bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-xl hover:-translate-y-1 transition-all"
              >
                <div className={`w-12 h-12 rounded-xl bg-${f.color}-100 dark:bg-${f.color}-900/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <f.icon className={`text-${f.color}-600 text-xl`} />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  Try now <FiArrowRight />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* For Doctors Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              For <span className="text-violet-600">Doctors</span>
            </h2>
            <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
              All-in-one clinic management. Grow your practice, save time, earn more.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctorFeatures.map((f, i) => (
              <div
                key={i}
                className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-800/50 rounded-2xl p-6 border border-gray-200 dark:border-gray-700"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/20">
                  <f.icon className="text-white text-xl" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-violet-500/25 transition-all"
            >
              <FaUserMd /> Start Free Trial — ₹0 for 30 days
            </Link>
            <p className="text-xs text-gray-400 mt-3">No credit card required. Cancel anytime.</p>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-14">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Search & Choose', desc: 'Find doctors by specialty, location, ratings. Compare fees & availability.', icon: FiSearch },
              { step: '2', title: 'Book & Pay', desc: 'Select a slot, fill details, pay online or at clinic. Get instant confirmation.', icon: FiCalendar },
              { step: '3', title: 'Consult & Heal', desc: 'Visit in-person or join video call. Get digital prescriptions & follow-ups.', icon: FiHeart }
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center border border-white/20">
                  <item.icon className="text-2xl" />
                </div>
                <div className="w-8 h-8 mx-auto -mt-2 mb-3 bg-white text-blue-700 rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-blue-100 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">Trusted by Doctors & Patients</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Dr. Priya Sharma', role: 'Cardiologist, Mumbai', text: 'DocClinic Pro transformed my practice. Online bookings increased 40% and I save 2 hours daily on paperwork.', rating: 5 },
              { name: 'Rahul Mehta', role: 'Patient', text: 'Booked a video consultation at 11 PM when my kid had fever. Dr. was available in 15 minutes. Lifesaver!', rating: 5 },
              { name: 'Dr. Anand Kumar', role: 'Dentist, Bangalore', text: 'The AI assistant is incredible. It helps me write prescriptions faster and catches drug interactions I might miss.', rating: 5 }
            ].map((t, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-0.5 mb-3">
                  {[...Array(t.rating)].map((_, j) => (
                    <FiStar key={j} className="text-yellow-400 fill-yellow-400 text-sm" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Ready to experience better healthcare?
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Join thousands of patients and doctors on DocClinic Pro.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/find-doctor" className="btn-primary px-8 py-3.5 text-base flex items-center gap-2">
              <FiSearch /> Find a Doctor Now
            </Link>
            <Link to="/register" className="btn-secondary px-8 py-3.5 text-base flex items-center gap-2">
              <FaUserMd /> Register as Doctor
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FaHeartbeat className="text-blue-400" />
                <span className="font-bold text-white">DocClinic Pro</span>
              </div>
              <p className="text-sm leading-relaxed">Smart, affordable clinic management for modern doctors.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3 text-sm">For Patients</h4>
              <div className="space-y-2 text-sm">
                <Link to="/find-doctor" className="block hover:text-blue-400 transition-colors">Find Doctor</Link>
                <Link to="/symptom-checker" className="block hover:text-blue-400 transition-colors">Symptom Checker</Link>
                <Link to="/my-records" className="block hover:text-blue-400 transition-colors">My Records</Link>
                <Link to="/track" className="block hover:text-blue-400 transition-colors">Track Appointment</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3 text-sm">For Doctors</h4>
              <div className="space-y-2 text-sm">
                <Link to="/register" className="block hover:text-blue-400 transition-colors">Register Free</Link>
                <Link to="/pricing" className="block hover:text-blue-400 transition-colors">Pricing</Link>
                <Link to="/login" className="block hover:text-blue-400 transition-colors">Doctor Login</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3 text-sm">Support</h4>
              <div className="space-y-2 text-sm">
                <p>help@docclinic.pro</p>
                <p>+91 800 123 4567</p>
                <p className="text-xs text-gray-500 mt-3">© 2026 DocClinic Pro. All rights reserved.</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
