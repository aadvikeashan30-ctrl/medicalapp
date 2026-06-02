import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCheck, FiX, FiStar, FiZap, FiShield, FiArrowRight, FiPhone } from 'react-icons/fi';
import { FiActivity } from 'react-icons/fi';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: { monthly: 499, quarterly: 1299, yearly: 4499 },
    desc: 'Solo practitioners starting digital',
    gradient: 'from-indigo-500 to-purple-600',
    features: [
      'Unlimited Patients', 'Appointment Scheduling', 'Digital Prescriptions',
      'Billing & GST Invoices', 'Patient Portal Link', 'SMS Reminders (50/mo)',
    ],
    excluded: ['WhatsApp Integration', 'AI Assistant', 'Reports', 'Multi-staff']
  },
  {
    id: 'pro',
    name: 'Professional',
    price: { monthly: 1499, quarterly: 3999, yearly: 13499 },
    desc: 'Growing clinics maximizing efficiency',
    popular: true,
    gradient: 'from-cyan-500 to-blue-600',
    features: [
      'Everything in Starter', 'Unlimited WhatsApp Reminders', 'AI Clinical Assistant',
      'AI Diagnosis Suggestions', 'Expense Tracking + P&L', 'Advanced Reports',
      'Lab Test Management', 'Medicine Library', 'Follow-up Tracker', 'Custom Print Templates',
    ],
    excluded: []
  },
  {
    id: 'hospital',
    name: 'Hospital',
    price: { monthly: 4999, quarterly: 13499, yearly: 44999 },
    desc: 'Multi-doctor hospitals & chains',
    gradient: 'from-emerald-500 to-teal-600',
    features: [
      'Everything in Professional', 'Unlimited Staff Accounts', 'Multi-branch Dashboard',
      'White-label Branding', 'Teleconsultation (Video)', 'Insurance/TPA Module',
      'API Access', 'Custom Integrations', 'Dedicated Account Manager', '99.9% Uptime SLA',
    ],
    excluded: []
  }
];

const billingOptions = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly', save: '13%' },
  { value: 'yearly', label: 'Annual', save: '25%' }
];

export default function Pricing() {
  const [billing, setBilling] = useState('monthly');

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="header-glass sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/home" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
              <FiActivity className="text-white text-sm" />
            </div>
            <span className="text-lg font-bold text-white">DocClinic Pro</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/home" className="text-sm text-gray-400 hover:text-white font-medium transition-colors hidden sm:block">Home</Link>
            <Link to="/login" className="btn-primary text-sm !py-2 !px-4">Sign In</Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-16 relative">
        {/* Background orbs */}
        <div className="orb orb-indigo w-80 h-80 -top-40 left-1/4 animate-orb" />
        <div className="orb orb-purple w-60 h-60 top-1/3 -right-20 animate-orb" style={{ animationDelay: '-5s' }} />
        <div className="orb orb-cyan w-48 h-48 bottom-0 left-10 animate-orb" style={{ animationDelay: '-9s' }} />

        {/* Hero */}
        <div className="text-center mb-14 relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-5 badge-primary">
            <FiZap className="text-xs" /> 30-Day Free Trial · No Card Required
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Pricing that <span className="gradient-text">scales</span> with you
          </h1>
          <p className="text-lg text-gray-400 max-w-xl mx-auto">
            Start free, upgrade when ready. Plans designed for Indian clinics & hospitals.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12 relative z-10">
          <div className="inline-flex rounded-xl p-1 gap-0.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {billingOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setBilling(opt.value)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                  billing === opt.value
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {opt.label}
                {opt.save && <span className="ml-1.5 text-emerald-400 text-[11px] font-bold">{opt.save}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6 mb-20 relative z-10">
          {plans.map((plan, idx) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-7 transition-all duration-500 hover:-translate-y-2 animate-fade-up ${
                plan.popular
                  ? 'border-indigo-500/40 shadow-lg shadow-indigo-500/10'
                  : 'border-white/5 hover:border-indigo-500/20'
              }`}
              style={{
                background: plan.popular ? 'rgba(99, 102, 241, 0.04)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${plan.popular ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255,255,255,0.06)'}`,
                backdropFilter: 'blur(12px)',
                animationDelay: `${idx * 100}ms`
              }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full text-white" style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', boxShadow: '0 0 20px rgba(99,102,241,0.3)' }}>
                    <FiStar className="text-amber-300 text-[10px]" /> MOST POPULAR
                  </span>
                </div>
              )}

              {/* Plan header */}
              <div className="mb-5">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-3`}>
                  <FiZap className="text-white text-sm" />
                </div>
                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{plan.desc}</p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">₹{plan.price[billing].toLocaleString('en-IN')}</span>
                  <span className="text-sm text-gray-500">/{billing === 'monthly' ? 'mo' : billing === 'quarterly' ? 'qtr' : 'yr'}</span>
                </div>
                {billing !== 'monthly' && (
                  <p className="text-xs text-emerald-400 font-medium mt-1">
                    Save ₹{((plan.price.monthly * (billing === 'quarterly' ? 3 : 12)) - plan.price[billing]).toLocaleString('en-IN')}
                  </p>
                )}
              </div>

              {/* CTA */}
              <Link
                to="/register"
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all mb-6 ${
                  plan.popular ? 'btn-primary' : 'btn-secondary'
                }`}
              >
                Start Free Trial <FiArrowRight className="text-xs" />
              </Link>

              {/* Features */}
              <ul className="space-y-2.5">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <FiCheck className="text-emerald-400 mt-0.5 flex-shrink-0 text-xs" />
                    <span className="text-gray-300">{f}</span>
                  </li>
                ))}
                {plan.excluded.map((f, i) => (
                  <li key={`ex-${i}`} className="flex items-start gap-2.5 text-sm">
                    <FiX className="text-gray-700 mt-0.5 flex-shrink-0 text-xs" />
                    <span className="text-gray-600">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Trust */}
        <div className="text-center relative z-10">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-1.5"><FiShield className="text-emerald-400" /> Bank-grade encryption</span>
            <span className="flex items-center gap-1.5"><FiCheck className="text-emerald-400" /> GST compliant</span>
            <span className="flex items-center gap-1.5"><FiCheck className="text-emerald-400" /> Cancel anytime</span>
            <span className="flex items-center gap-1.5"><FiPhone className="text-emerald-400" /> Indian support</span>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            Need a custom plan? <a href="mailto:sales@docclinic.com" className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">Contact Sales</a>
          </p>
        </div>
      </div>
    </div>
  );
}
