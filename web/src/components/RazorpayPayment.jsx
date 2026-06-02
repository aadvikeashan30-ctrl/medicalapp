import React, { useState, useEffect } from 'react';
import { FiCreditCard, FiCheckCircle, FiAlertTriangle, FiShield } from 'react-icons/fi';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

/**
 * RazorpayPayment component — handles online payment during booking
 * Props:
 *  - amount: number (INR)
 *  - doctorId: string
 *  - doctorName: string
 *  - appointmentId: string (optional, set after booking)
 *  - patientName: string
 *  - patientPhone: string
 *  - patientEmail: string
 *  - onSuccess: (paymentData) => void
 *  - onSkip: () => void  (pay at clinic)
 */
export default function RazorpayPayment({
  amount, doctorId, doctorName, appointmentId,
  patientName, patientPhone, patientEmail,
  onSuccess, onSkip
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null); // null | 'success' | 'failed'
  const [paymentEnabled, setPaymentEnabled] = useState(null);

  useEffect(() => {
    api.get('/payments/status')
      .then(({ data }) => setPaymentEnabled(data.enabled))
      .catch(() => setPaymentEnabled(false));
  }, []);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (document.getElementById('razorpay-script')) return resolve(true);
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      // Create order
      const { data: order } = await api.post('/payments/create-order', {
        doctorId,
        amount,
        appointmentId,
        patientName,
        patientPhone
      });

      // Demo mode — skip Razorpay UI
      if (order.demo) {
        const verifyRes = await api.post('/payments/verify', {
          razorpay_order_id: order.orderId,
          razorpay_payment_id: `demo_pay_${Date.now()}`,
          razorpay_signature: 'demo_signature',
          appointmentId
        });
        setPaymentStatus('success');
        onSuccess?.({
          paymentId: `demo_pay_${Date.now()}`,
          orderId: order.orderId,
          verified: true,
          demo: true
        });
        return;
      }

      // Load Razorpay script
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setError('Failed to load payment gateway. Please try again.');
        return;
      }

      // Open Razorpay checkout
      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: `Dr. ${doctorName}`,
        description: 'Consultation Fee',
        order_id: order.orderId,
        prefill: {
          name: patientName,
          contact: patientPhone,
          email: patientEmail || ''
        },
        theme: { color: '#4f46e5' },
        handler: async (response) => {
          // Verify payment
          try {
            const { data: verifyData } = await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              appointmentId
            });
            setPaymentStatus('success');
            onSuccess?.({
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              verified: verifyData.verified
            });
          } catch (err) {
            setError('Payment verification failed. Contact the clinic.');
            setPaymentStatus('failed');
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        setError(response.error?.description || 'Payment failed');
        setPaymentStatus('failed');
      });
      rzp.open();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  if (paymentStatus === 'success') {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 text-center animate-fade-in">
        <div className="w-14 h-14 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-3">
          <FiCheckCircle className="text-emerald-600 text-2xl" />
        </div>
        <h3 className="font-bold text-emerald-800 dark:text-emerald-300 text-lg">Payment Successful!</h3>
        <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">₹{amount} paid securely online</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Payment amount summary */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Consultation Fee</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">₹{amount?.toLocaleString('en-IN')}</p>
          </div>
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <FiCreditCard className="text-white text-xl" />
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl">
          <FiAlertTriangle /> {error}
        </div>
      )}

      {/* Payment buttons */}
      <div className="space-y-3">
        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3.5 rounded-xl font-semibold text-center flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-50"
        >
          {loading ? (
            <><FiCreditCard className="animate-pulse" /> Processing...</>
          ) : (
            <><FiCreditCard /> Pay ₹{amount} Online</>
          )}
        </button>

        <button
          onClick={onSkip}
          className="w-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-medium text-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-all text-sm"
        >
          Pay at Clinic (Cash/UPI)
        </button>
      </div>

      {/* Trust badges */}
      <div className="flex items-center justify-center gap-4 pt-2">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <FiShield className="text-emerald-500" /> 256-bit SSL
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <FiShield className="text-emerald-500" /> Razorpay Secure
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <FiShield className="text-emerald-500" /> Refund Guaranteed
        </div>
      </div>
    </div>
  );
}
