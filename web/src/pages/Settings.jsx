import React, { useEffect, useState } from 'react';
import {
  FiUser, FiSave, FiClock, FiLock, FiShield, FiBell,
  FiGlobe, FiCheckCircle, FiAlertCircle, FiChevronRight, FiZap, FiTrendingUp
} from 'react-icons/fi';
import { FaWhatsapp, FaStethoscope, FaHospital } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useApi } from '../hooks/useApi';
import { setSession, getUser } from '../utils/auth';
import Loader from '../components/Loader';
import ThreeDCard from '../components/ThreeDCard';
import FloatingOrb from '../components/FloatingOrb';

// Inline Subscription Manager component
function SubscriptionManager({ currentPlan, planExpiry }) {
  const { data: subData, loading: subLoading } = useApi('/subscription/current');
  const [upgrading, setUpgrading] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState('monthly');

  const plans = [
    { id: 'basic', name: 'Basic', price: { monthly: 499, quarterly: 1299, half: 2499, yearly: 4499 }, color: 'blue', gradient: 'from-blue-500 to-indigo-600', features: ['500 patients/mo', '500 appointments/mo', 'Digital Prescriptions', 'Billing & Invoicing', 'Patient Portal', 'Reports & Analytics'] },
    { id: 'pro', name: 'Pro', price: { monthly: 1499, quarterly: 3999, half: 7499, yearly: 13499 }, color: 'violet', gradient: 'from-violet-500 to-purple-600', popular: true, features: ['Unlimited everything', 'AI Clinical Assistant (GPT-4)', 'WhatsApp Reminders', 'Video Consultation', 'Voice-to-SOAP Notes', 'Multi-staff (5 users)'] },
    { id: 'enterprise', name: 'Enterprise', price: { monthly: 4999, quarterly: 13499, half: 24999, yearly: 44999 }, color: 'emerald', gradient: 'from-emerald-500 to-teal-600', features: ['Everything in Pro', 'Unlimited staff', 'Multi-branch support', 'White-label branding', 'API access', 'Dedicated support'] }
  ];

  const cycles = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: '3 Months', save: '13%' },
    { value: 'yearly', label: 'Annual', save: '25%' }
  ];

  const handleUpgrade = async (planId) => {
    setUpgrading(true);
    try {
      const { data } = await api.post('/subscription/upgrade', { plan: planId, cycle: selectedCycle });
      if (data.demo || data.success) {
        toast.success(data.message || `Upgraded to ${planId.toUpperCase()}!`);
        // Refresh page to reflect new plan
        window.location.reload();
      } else if (data.orderId) {
        // Razorpay checkout for subscription
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          const rzp = new window.Razorpay({
            key: data.keyId,
            amount: data.amount,
            currency: data.currency,
            name: 'DocClinic Pro',
            description: `${planId.toUpperCase()} Plan - ${selectedCycle}`,
            order_id: data.orderId,
            theme: { color: '#4f46e5' },
            handler: async (response) => {
              try {
                await api.post('/subscription/activate', {
                  ...response,
                  plan: planId,
                  cycle: selectedCycle
                });
                toast.success(`Upgraded to ${planId.toUpperCase()}!`);
                window.location.reload();
              } catch (err) {
                toast.error('Activation failed. Contact support.');
              }
            }
          });
          rzp.open();
        };
        document.body.appendChild(script);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upgrade failed');
    } finally {
      setUpgrading(false);
    }
  };

  const hierarchy = ['free', 'basic', 'pro', 'enterprise'];
  const currentLevel = hierarchy.indexOf(currentPlan || 'free');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Current Plan Usage */}
      {subData && (
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <FiTrendingUp className="text-blue-600" /> Current Usage
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(subData.usage || {}).map(([key, val]) => (
              <div key={key} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-xs text-gray-500 capitalize">{key}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {val.used}{val.limit !== -1 ? `/${val.limit}` : ''}
                </p>
                {val.limit !== -1 && (
                  <div className="mt-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${val.used / val.limit > 0.8 ? 'bg-red-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min(100, (val.used / val.limit) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          {subData.daysRemaining !== null && (
            <p className="text-sm text-gray-500 mt-3">
              {subData.isExpired
                ? '⚠️ Your plan has expired. Please renew.'
                : `${subData.daysRemaining} days remaining in your billing period`}
            </p>
          )}
        </div>
      )}

      {/* Billing Cycle Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-1">
          {cycles.map(c => (
            <button
              key={c.value}
              onClick={() => setSelectedCycle(c.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedCycle === c.value
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {c.label}
              {c.save && <span className="ml-1 text-emerald-600 text-xs font-bold">-{c.save}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map(plan => {
          const planLevel = hierarchy.indexOf(plan.id);
          const isCurrent = plan.id === currentPlan;
          const isDowngrade = planLevel < currentLevel;

          return (
            <div key={plan.id} className={`relative rounded-2xl border-2 p-6 transition-all ${
              plan.popular ? 'border-violet-400 shadow-lg' : isCurrent ? 'border-blue-400 bg-blue-50/30 dark:bg-blue-900/10' : 'border-gray-200 dark:border-gray-700'
            }`}>
              {plan.popular && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-violet-600 to-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-full">RECOMMENDED</span>
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full">CURRENT PLAN</span>
                </div>
              )}
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center shadow-lg mb-3`}>
                <FiZap className="text-white" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h4>
              <div className="mt-2 mb-4">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">₹{plan.price[selectedCycle].toLocaleString('en-IN')}</span>
                <span className="text-gray-500 text-sm">/{selectedCycle === 'monthly' ? 'mo' : selectedCycle === 'quarterly' ? '3mo' : 'yr'}</span>
              </div>
              <ul className="space-y-2 mb-5">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <FiCheckCircle className="text-emerald-500 flex-shrink-0 text-xs" /> {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <button disabled className="w-full py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 font-medium text-sm cursor-not-allowed">
                  Current Plan
                </button>
              ) : isDowngrade ? (
                <button disabled className="w-full py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-400 font-medium text-sm cursor-not-allowed">
                  Downgrade
                </button>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={upgrading}
                  className={`w-full py-2.5 rounded-xl font-semibold text-sm text-white transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:shadow-lg hover:shadow-violet-500/25'
                      : 'bg-gray-900 dark:bg-gray-700 hover:bg-gray-800'
                  }`}
                >
                  {upgrading ? 'Processing...' : 'Upgrade Now'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Settings() {
  const { data: profile, loading, error } = useApi('/auth/profile');
  const [saving, setSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  const [form, setForm] = useState(null);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });

  // Initialize form from profile OR from localStorage user as fallback
  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        specialty: profile.specialty || 'general',
        qualification: profile.qualification || '',
        registrationNo: profile.registrationNo || '',
        clinicName: profile.clinicName || '',
        clinicAddress: profile.clinicAddress || '',
        clinicCity: profile.clinicCity || '',
        consultationFee: profile.consultationFee ?? 500,
        workingHours: {
          start: profile.workingHours?.start || '09:00',
          end: profile.workingHours?.end || '18:00'
        }
      });
    } else if (error && !form) {
      // Fallback: use local user data so page doesn't stay stuck
      const localUser = getUser();
      setForm({
        name: localUser.name || '',
        email: localUser.email || '',
        phone: localUser.phone || '',
        specialty: localUser.specialty || 'general',
        qualification: localUser.qualification || '',
        registrationNo: localUser.registrationNo || '',
        clinicName: localUser.clinicName || '',
        clinicAddress: localUser.clinicAddress || '',
        clinicCity: localUser.clinicCity || '',
        consultationFee: localUser.consultationFee ?? 500,
        workingHours: {
          start: localUser.workingHours?.start || '09:00',
          end: localUser.workingHours?.end || '18:00'
        }
      });
    }
  }, [profile, error]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/auth/profile', form);
      const localUser = getUser();
      setSession(localStorage.getItem('token'), {
        ...localUser,
        name: data.name || form.name,
        email: data.email || form.email,
        phone: data.phone || form.phone,
        specialty: data.specialty || form.specialty,
        clinicName: data.clinicName || form.clinicName,
        clinicCity: data.clinicCity || form.clinicCity,
        consultationFee: data.consultationFee || form.consultationFee,
        qualification: data.qualification || form.qualification,
        plan: data.plan || localUser.plan
      });
      toast.success('Settings saved successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pw.newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    if (pw.newPassword !== pw.confirm) return toast.error('Passwords do not match');
    setPwSaving(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword
      });
      toast.success('Password updated successfully!');
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

  if (loading && !form) return <Loader label="Loading settings..." />;

  // If still no form after loading completes (edge case), show fallback
  if (!form) {
    const localUser = getUser();
    return (
      <div className="animate-fade-in space-y-6 max-w-5xl mx-auto">
        <div className="card text-center py-10">
          <FiAlertCircle className="mx-auto text-3xl text-amber-500 mb-3" />
          <h3 className="font-bold text-gray-900">Could not load profile from server</h3>
          <p className="text-sm text-gray-500 mt-1">Using local data. Some fields may be empty.</p>
          <button
            onClick={() => setForm({
              name: localUser.name || '', email: localUser.email || '', phone: localUser.phone || '',
              specialty: localUser.specialty || 'general', qualification: '', registrationNo: '',
              clinicName: localUser.clinicName || '', clinicAddress: '', clinicCity: '',
              consultationFee: 500, workingHours: { start: '09:00', end: '18:00' }
            })}
            className="btn-primary mt-4"
          >
            Continue with local data
          </button>
        </div>
      </div>
    );
  }

  const sections = [
    { id: 'profile', label: 'Doctor Profile', icon: FiUser, color: 'blue' },
    { id: 'clinic', label: 'Clinic Details', icon: FaHospital, color: 'emerald' },
    { id: 'hours', label: 'Working Hours', icon: FiClock, color: 'purple' },
    { id: 'subscription', label: 'Subscription', icon: FiZap, color: 'violet' },
    { id: 'integrations', label: 'Integrations', icon: FiGlobe, color: 'orange' },
    { id: 'security', label: 'Security', icon: FiShield, color: 'red' }
  ];

  return (
    <div className="animate-fade-in space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-800 via-gray-900 to-black p-8 text-white">
        <FloatingOrb size={200} color="blue" top="-50px" right="-30px" opacity={0.15} />
        <FloatingOrb size={150} color="purple" bottom="-20px" left="10%" opacity={0.1} delay={1} />
        <div className="relative z-10">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-gray-400 mt-1">Manage your profile, clinic, and app preferences</p>
        </div>
      </div>

      {/* Plan Banner */}
      <ThreeDCard intensity={6}>
        <div className="p-5 bg-gradient-to-r from-blue-50 via-indigo-50 to-violet-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-violet-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                <FiShield className="text-white text-xl" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">
                  {(profile?.plan || 'free').toUpperCase()} Plan
                </h3>
                <p className="text-sm text-gray-500">
                  {profile?.planExpiry
                    ? `Valid until ${new Date(profile.planExpiry).toLocaleDateString('en-IN')}`
                    : '30-day free trial'}
                </p>
              </div>
            </div>
            {(profile?.plan || 'free') !== 'enterprise' && (
              <button onClick={() => setActiveSection('subscription')} className="btn-primary !py-2 text-sm flex items-center gap-1">
                <FiZap /> Upgrade Plan
              </button>
            )}
          </div>
        </div>
      </ThreeDCard>

      {/* Section Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {sections.map(sec => (
          <button
            key={sec.id}
            onClick={() => setActiveSection(sec.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeSection === sec.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
            }`}
          >
            <sec.icon className="text-base" /> {sec.label}
          </button>
        ))}
      </div>

      {/* Sections */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Doctor Profile */}
        {activeSection === 'profile' && (
          <div className="card animate-fade-in">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
              <FiUser className="text-blue-600" /> Doctor Profile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
                <input
                  type="text" className="input-field"
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Dr. John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email (read-only)</label>
                <input type="email" className="input-field bg-gray-50 dark:bg-gray-800 cursor-not-allowed" value={form.email} disabled />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone</label>
                <input
                  type="tel" className="input-field"
                  value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Specialty</label>
                <select
                  className="input-field"
                  value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                >
                  <option value="general">General Physician</option>
                  <option value="dental">Dentist</option>
                  <option value="eye">Ophthalmologist</option>
                  <option value="ortho">Orthopedic</option>
                  <option value="pediatric">Pediatrician</option>
                  <option value="dermatology">Dermatologist</option>
                  <option value="ent">ENT</option>
                  <option value="cardiology">Cardiology</option>
                  <option value="gynecology">Gynecology</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Qualification</label>
                <input
                  type="text" className="input-field"
                  value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                  placeholder="MBBS, MD"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Registration No.</label>
                <input
                  type="text" className="input-field"
                  value={form.registrationNo}
                  onChange={(e) => setForm({ ...form, registrationNo: e.target.value })}
                  placeholder="MCI-12345"
                />
              </div>
            </div>
          </div>
        )}

        {/* Clinic Details */}
        {activeSection === 'clinic' && (
          <div className="card animate-fade-in">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
              <FaStethoscope className="text-emerald-600" /> Clinic Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Clinic Name</label>
                <input
                  type="text" className="input-field"
                  value={form.clinicName} onChange={(e) => setForm({ ...form, clinicName: e.target.value })}
                  placeholder="My Health Clinic"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Consultation Fee (₹)</label>
                <input
                  type="number" min={0} className="input-field"
                  value={form.consultationFee}
                  onChange={(e) => setForm({ ...form, consultationFee: Number(e.target.value || 0) })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Clinic Address</label>
                <input
                  type="text" className="input-field"
                  value={form.clinicAddress}
                  onChange={(e) => setForm({ ...form, clinicAddress: e.target.value })}
                  placeholder="123 Medical Street, Building A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">City</label>
                <input
                  type="text" className="input-field"
                  value={form.clinicCity}
                  onChange={(e) => setForm({ ...form, clinicCity: e.target.value })}
                  placeholder="Mumbai"
                />
              </div>
            </div>
          </div>
        )}

        {/* Working Hours */}
        {activeSection === 'hours' && (
          <div className="card animate-fade-in">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
              <FiClock className="text-purple-600" /> Working Hours
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Opening Time</label>
                <input
                  type="time" className="input-field"
                  value={form.workingHours.start}
                  onChange={(e) =>
                    setForm({ ...form, workingHours: { ...form.workingHours, start: e.target.value } })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Closing Time</label>
                <input
                  type="time" className="input-field"
                  value={form.workingHours.end}
                  onChange={(e) =>
                    setForm({ ...form, workingHours: { ...form.workingHours, end: e.target.value } })
                  }
                />
              </div>
            </div>
            <div className="mt-5 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                <strong>Tip:</strong> Working hours are used by the AI scheduling optimizer to suggest optimal appointment slots.
              </p>
            </div>
          </div>
        )}

        {/* Integrations */}
        {activeSection === 'integrations' && (
          <div className="card animate-fade-in">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
              <FiGlobe className="text-orange-600" /> Integrations
            </h3>

            <div className="space-y-4">
              {/* WhatsApp */}
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
                    <FaWhatsapp className="text-white text-lg" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">WhatsApp Business</p>
                    <p className="text-xs text-gray-500">Send appointment reminders & prescriptions</p>
                  </div>
                </div>
                <span className="badge badge-green flex items-center gap-1">
                  <FiCheckCircle className="text-xs" /> Active
                </span>
              </div>

              {/* AI */}
              <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <FiBell className="text-white text-lg" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">AI Clinical Assistant</p>
                    <p className="text-xs text-gray-500">GPT-4o / Gemini powered diagnosis & prescriptions</p>
                  </div>
                </div>
                <span className="badge badge-green flex items-center gap-1">
                  <FiCheckCircle className="text-xs" /> Active
                </span>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Configuration:</strong> Set environment variables in your backend:<br />
                  <code className="text-xs bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded mt-1 inline-block">TWILIO_ACCOUNT_SID</code>,{' '}
                  <code className="text-xs bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">TWILIO_AUTH_TOKEN</code>,{' '}
                  <code className="text-xs bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">OPENAI_API_KEY</code> or{' '}
                  <code className="text-xs bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">GEMINI_API_KEY</code>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Save Button (visible in profile/clinic/hours) */}
        {['profile', 'clinic', 'hours'].includes(activeSection) && (
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            <FiSave /> {saving ? 'Saving...' : 'Save Settings'}
          </button>
        )}
      </form>

      {/* Subscription Section */}
      {activeSection === 'subscription' && (
        <SubscriptionManager currentPlan={profile?.plan || 'free'} planExpiry={profile?.planExpiry} />
      )}

      {/* Security Section */}
      {activeSection === 'security' && (
        <form onSubmit={changePassword} className="card animate-fade-in">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
            <FiLock className="text-red-600" /> Change Password
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Current Password</label>
              <input
                type="password" className="input-field" required
                value={pw.currentPassword}
                onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">New Password</label>
              <input
                type="password" className="input-field" required minLength={6}
                value={pw.newPassword}
                onChange={(e) => setPw({ ...pw, newPassword: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm New</label>
              <input
                type="password" className="input-field" required minLength={6}
                value={pw.confirm}
                onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                placeholder="••••••••"
              />
            </div>
          </div>
          <button type="submit" disabled={pwSaving} className="btn-primary mt-5 flex items-center gap-2">
            <FiShield /> {pwSaving ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      )}
    </div>
  );
}
