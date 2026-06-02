import React, { useState, useEffect, useRef } from 'react';
import { FiPhone, FiShield, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

/**
 * OTPVerification component — Phone-based OTP login for patient portal
 * Props:
 *   - onVerified: (data: { token, phone }) => void
 *   - title: string
 *   - subtitle: string
 */
export default function OTPVerification({ onVerified, title, subtitle }) {
  const [step, setStep] = useState('phone'); // phone | otp | verified
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [demoOtp, setDemoOtp] = useState(null);
  const inputRefs = useRef([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const sendOTP = async () => {
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      setError('Enter a valid 10-digit phone number');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/otp/send', { phone });
      setStep('otp');
      setCountdown(30);
      if (data.demoOtp) setDemoOtp(data.demoOtp);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    const otpStr = otp.join('');
    if (otpStr.length !== 6) {
      setError('Enter the complete 6-digit OTP');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/otp/verify', { phone, otp: otpStr });
      if (data.verified) {
        setStep('verified');
        // Store patient token
        localStorage.setItem('patientToken', data.token);
        localStorage.setItem('patientPhone', data.phone);
        setTimeout(() => onVerified?.({ token: data.token, phone: data.phone }), 800);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (idx, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[idx] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next
    if (value && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (newOtp.every(d => d) && newOtp.join('').length === 6) {
      setTimeout(() => verifyOTP(), 100);
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
      setTimeout(() => verifyOTP(), 200);
    }
  };

  if (step === 'verified') {
    return (
      <div className="text-center py-8 animate-fade-in">
        <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-4">
          <FiCheckCircle className="text-emerald-600 text-3xl" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Verified!</h3>
        <p className="text-sm text-gray-500 mt-1">Loading your records...</p>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
          <FiShield className="text-white text-2xl" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {title || 'Verify Your Phone'}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {subtitle || 'Enter your registered phone number to access your records securely'}
        </p>
      </div>

      {step === 'phone' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Phone Number
            </label>
            <div className="flex items-center gap-2">
              <span className="px-3 py-2.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-500 font-medium">+91</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="input-field flex-1"
                placeholder="98765 43210"
                maxLength={10}
                autoFocus
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-4 py-2.5 rounded-xl">
              <FiAlertTriangle /> {error}
            </div>
          )}

          <button
            onClick={sendOTP}
            disabled={loading || phone.length < 10}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2"
          >
            {loading ? (
              <><FiPhone className="animate-pulse" /> Sending...</>
            ) : (
              <><FiPhone /> Send OTP</>
            )}
          </button>
        </div>
      )}

      {step === 'otp' && (
        <div className="space-y-4">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Enter the 6-digit code sent to <span className="font-semibold text-gray-700 dark:text-gray-300">+91 {phone}</span>
          </p>

          {/* OTP Input boxes */}
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={el => inputRefs.current[idx] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-12 h-14 text-center text-xl font-bold border-2 rounded-xl transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700"
                autoFocus={idx === 0}
              />
            ))}
          </div>

          {/* Demo mode hint */}
          {demoOtp && (
            <div className="text-center text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 rounded-lg py-2 px-3">
              Demo mode — OTP is: <strong>{demoOtp}</strong>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-4 py-2.5 rounded-xl">
              <FiAlertTriangle /> {error}
            </div>
          )}

          <button
            onClick={verifyOTP}
            disabled={loading || otp.join('').length < 6}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2"
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>

          {/* Resend */}
          <div className="text-center">
            {countdown > 0 ? (
              <p className="text-xs text-gray-400">Resend in {countdown}s</p>
            ) : (
              <button
                onClick={sendOTP}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Resend OTP
              </button>
            )}
          </div>

          {/* Change number */}
          <button
            onClick={() => { setStep('phone'); setOtp(['', '', '', '', '', '']); setError(null); }}
            className="w-full text-center text-xs text-gray-500 hover:text-gray-700"
          >
            ← Change phone number
          </button>
        </div>
      )}
    </div>
  );
}
