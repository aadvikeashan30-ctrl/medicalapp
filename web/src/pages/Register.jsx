import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaStethoscope } from 'react-icons/fa';
import { FiUser, FiMail, FiLock, FiPhone, FiMapPin } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { setSession } from '../utils/auth';

const specialties = [
  { value: 'general', label: 'General Physician' },
  { value: 'dental', label: 'Dentist' },
  { value: 'eye', label: 'Ophthalmologist' },
  { value: 'ortho', label: 'Orthopedic' },
  { value: 'pediatric', label: 'Pediatrician' },
  { value: 'dermatology', label: 'Dermatologist' },
  { value: 'ent', label: 'ENT Specialist' },
  { value: 'cardiology', label: 'Cardiologist' },
  { value: 'gynecology', label: 'Gynecologist' },
  { value: 'other', label: 'Other' }
];

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    specialty: 'general',
    clinicName: '',
    clinicCity: '',
    qualification: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      setSession(data.token, data.user);
      toast.success('Welcome to DocClinic Pro! 30-day free trial activated.');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-20 right-10 w-72 h-72 bg-emerald-400/20 rounded-full" />
        <div className="absolute bottom-10 left-10 w-48 h-48 bg-teal-400/20 rounded-full" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <FaStethoscope className="text-white text-2xl" />
            </div>
            <span className="text-2xl font-bold text-white">DocClinic Pro</span>
          </div>
          <h2 className="text-3xl font-bold text-white leading-tight mb-4">Start Your<br />30-Day Free Trial</h2>
          <p className="text-emerald-100 text-lg">No credit card required. Cancel anytime.</p>
        </div>

        <div className="relative z-10 bg-white/10 backdrop-blur rounded-2xl p-6">
          <p className="text-white font-semibold mb-3">What you get free:</p>
          <ul className="space-y-2 text-emerald-100">
            <li className="flex items-center gap-2"><span className="text-emerald-300">&#10003;</span> Unlimited patients</li>
            <li className="flex items-center gap-2"><span className="text-emerald-300">&#10003;</span> Appointment management</li>
            <li className="flex items-center gap-2"><span className="text-emerald-300">&#10003;</span> Digital prescriptions</li>
            <li className="flex items-center gap-2"><span className="text-emerald-300">&#10003;</span> Billing & invoices</li>
            <li className="flex items-center gap-2"><span className="text-emerald-300">&#10003;</span> WhatsApp reminders</li>
          </ul>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-lg py-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h2>
          <p className="text-gray-500 mb-8">Join 1000+ doctors managing their clinic digitally</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-field pl-10 py-2.5"
                    placeholder="Dr. John"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="input-field pl-10 py-2.5"
                    placeholder="+91 98765 43210"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-field pl-10 py-2.5"
                  placeholder="doctor@gmail.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-field pl-10 py-2.5"
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
                <select
                  value={form.specialty}
                  onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                  className="input-field py-2.5"
                >
                  {specialties.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                <input
                  type="text"
                  value={form.qualification}
                  onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                  className="input-field py-2.5"
                  placeholder="MBBS, MD"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clinic Name</label>
                <input
                  type="text"
                  value={form.clinicName}
                  onChange={(e) => setForm({ ...form, clinicName: e.target.value })}
                  className="input-field py-2.5"
                  placeholder="Health Plus Clinic"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <div className="relative">
                  <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={form.clinicCity}
                    onChange={(e) => setForm({ ...form, clinicCity: e.target.value })}
                    className="input-field pl-10 py-2.5"
                    placeholder="Mumbai"
                  />
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-center mt-6">
              {loading ? 'Creating Account...' : 'Start Free Trial - No Card Needed'}
            </button>
          </form>

          <p className="text-center mt-6 text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-semibold hover:text-blue-700">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
