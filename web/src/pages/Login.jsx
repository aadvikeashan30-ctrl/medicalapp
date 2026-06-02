import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiShield, FiActivity, FiZap, FiUsers, FiCalendar, FiBarChart2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { setSession } from '../utils/auth';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      setSession(data.token, data.user);
      toast.success(`Welcome back, Dr. ${data.user.name}!`);
      navigate('/');
    } catch (error) {
      const isNetworkOrServerError = !error.response || error.response.status >= 500;
      const isDemoCredentials = form.email === 'demo@docclinic.com' && form.password === 'demo1234';

      if (isNetworkOrServerError && isDemoCredentials) {
        const demoUser = {
          _id: 'demo-doctor-001', id: 'demo-doctor-001',
          name: 'Demo Doctor', email: 'demo@docclinic.com',
          phone: '9000000000', role: 'doctor', specialty: 'general',
          qualification: 'MBBS, MD', clinicName: 'DocClinic Demo Centre',
          clinicCity: 'Mumbai', consultationFee: 500, plan: 'pro', isActive: true
        };
        setSession('demo-token-' + Date.now(), demoUser);
        toast.success(`Welcome back, Dr. ${demoUser.name}! (Demo Mode)`);
        navigate('/');
      } else {
        toast.error(error.response?.data?.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ═══════ LEFT PANEL - Dark gradient branding ═══════ */}
      <div className="hidden lg:flex lg:w-[48%] relative bg-gray-950 items-center justify-center p-14 overflow-hidden">
        {/* Background orbs */}
        <div className="orb orb-indigo w-80 h-80 -top-32 -left-20 animate-orb" />
        <div className="orb orb-purple w-64 h-64 bottom-10 -right-10 animate-orb" style={{ animationDelay: '-5s' }} />
        <div className="orb orb-cyan w-48 h-48 top-1/2 right-1/4 animate-orb" style={{ animationDelay: '-9s' }} />

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '48px 48px'
        }} />

        {/* Content */}
        <div className="relative z-10 max-w-md animate-fade-up">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-14">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center glow-indigo" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
              <FiActivity className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">DocClinic Pro</h1>
              <p className="text-[11px] text-indigo-300 font-medium tracking-[0.2em] uppercase">Healthcare Platform</p>
            </div>
          </div>

          {/* Headline */}
          <h2 className="text-4xl font-bold text-white leading-tight mb-5">
            Modern Clinic<br />Management for<br />
            <span style={{ background: 'linear-gradient(135deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Indian Doctors
            </span>
          </h2>
          <p className="text-gray-400 text-base leading-relaxed mb-12">
            AI-powered platform to manage patients, billing, prescriptions, and grow your practice — all in one place.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2.5 mb-12">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300">
              <FiShield className="text-emerald-400 text-xs" /> Secure
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300">
              <FiZap className="text-amber-400 text-xs" /> AI Assistant
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300">
              <FiActivity className="text-cyan-400 text-xs" /> GST Ready
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/5">
            <div className="animate-fade-up stagger-1">
              <FiUsers className="text-indigo-400 mb-2" />
              <p className="text-xl font-bold text-white">10K+</p>
              <p className="text-xs text-gray-500">Active Doctors</p>
            </div>
            <div className="animate-fade-up stagger-2">
              <FiCalendar className="text-cyan-400 mb-2" />
              <p className="text-xl font-bold text-white">50L+</p>
              <p className="text-xs text-gray-500">Appointments</p>
            </div>
            <div className="animate-fade-up stagger-3">
              <FiBarChart2 className="text-emerald-400 mb-2" />
              <p className="text-xl font-bold text-white">₹200Cr</p>
              <p className="text-xs text-gray-500">Processed</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ RIGHT PANEL - Clean white form ═══════ */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-white relative">
        {/* Subtle background */}
        <div className="absolute inset-0 bg-mesh-light opacity-60" />

        <div className="relative z-10 w-full max-w-md animate-fade-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
              <FiActivity className="text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">DocClinic Pro</span>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
          <p className="text-gray-500 mb-8">Sign in to your clinic dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative group">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-field pl-11"
                  placeholder="doctor@clinic.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative group">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-field pl-11 pr-11"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500/20" />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
                Forgot password?
              </Link>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full !py-3.5 text-sm">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In <FiArrowRight />
                </span>
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-8 p-4 rounded-xl bg-indigo-50 border border-indigo-100">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Demo Access</p>
            </div>
            <p className="text-sm text-indigo-600 font-mono">demo@docclinic.com / demo1234</p>
          </div>

          <p className="text-center mt-8 text-sm text-gray-500">
            New to DocClinic?{' '}
            <Link to="/register" className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">
              Start Free Trial
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
