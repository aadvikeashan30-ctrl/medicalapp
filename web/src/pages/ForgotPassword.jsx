import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiArrowLeft } from 'react-icons/fi';
import { FaStethoscope } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('If that email exists, a reset link was sent.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
            <FaStethoscope className="text-white" />
          </div>
          <span className="text-xl font-bold">DocClinic Pro</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Reset your password</h2>
        <p className="text-gray-500 mb-6">Enter your email and we'll send a reset link.</p>

        {sent ? (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl p-4 text-sm">
            If an account exists for <b>{email}</b>, a reset link has been sent. Check your inbox.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  className="input-field pl-11"
                  placeholder="doctor@clinic.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3.5">
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        )}

        <Link to="/login" className="mt-6 inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700">
          <FiArrowLeft /> Back to login
        </Link>
      </div>
    </div>
  );
}
