import React, { useState } from 'react';
import { FiX, FiSend, FiCheck } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../utils/api';

const QUICK_TEMPLATES = [
  {
    id: 'appointment-confirm',
    label: 'Appointment Confirmation',
    template: (name, date, time) =>
      `Hello ${name}, your appointment is confirmed for ${date} at ${time}. Please arrive 10 minutes early. Thank you!`
  },
  {
    id: 'follow-up',
    label: 'Follow-up Reminder',
    template: (name, date) =>
      `Hello ${name}, this is a reminder for your follow-up visit on ${date}. Please book your slot or contact us. Get well soon!`
  },
  {
    id: 'report-ready',
    label: 'Report Ready',
    template: (name) =>
      `Hello ${name}, your lab test report is ready. You can collect it from the clinic or we can share it digitally. Thank you!`
  },
  {
    id: 'payment-reminder',
    label: 'Payment Reminder',
    template: (name, amount) =>
      `Hello ${name}, this is a gentle reminder about your pending payment of ₹${amount}. Please clear it at your earliest convenience. Thank you!`
  },
  {
    id: 'prescription-shared',
    label: 'Prescription Shared',
    template: (name) =>
      `Hello ${name}, your prescription has been shared digitally. Please follow the medication schedule as prescribed. Contact us if you have any questions.`
  },
  {
    id: 'clinic-closed',
    label: 'Clinic Holiday',
    template: (name, date) =>
      `Hello ${name}, please note that the clinic will be closed on ${date}. For emergencies, please contact us directly. Thank you for your understanding.`
  },
  {
    id: 'custom',
    label: 'Custom Message',
    template: () => ''
  }
];

export default function QuickWhatsApp({ patient, onClose }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const selectTemplate = (tpl) => {
    setSelectedTemplate(tpl);
    const msg = tpl.template(
      patient?.name || 'Patient',
      new Date().toLocaleDateString('en-IN'),
      '10:00 AM'
    );
    setMessage(msg);
  };

  const handleSend = async () => {
    if (!message.trim()) return toast.error('Message cannot be empty');
    if (!patient?.phone) return toast.error('Patient has no phone number');
    setSending(true);
    try {
      await api.post('/whatsapp/send', { phone: patient.phone, message: message.trim() });
      toast.success('Message sent via WhatsApp!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <FaWhatsapp className="text-white text-lg" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white">Quick WhatsApp</h2>
              <p className="text-xs text-gray-500">Send to {patient?.name || 'Patient'} ({patient?.phone})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/80 dark:hover:bg-gray-800 transition-colors">
            <FiX className="text-gray-500" />
          </button>
        </div>

        {/* Templates */}
        <div className="p-5 space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Quick Templates</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_TEMPLATES.map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => selectTemplate(tpl)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                    selectedTemplate?.id === tpl.id
                      ? 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-green-50 hover:border-green-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'
                  }`}
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 block">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="input-field"
              rows={4}
              placeholder="Type your message or select a template above..."
            />
            <p className="text-xs text-gray-400 mt-1">{message.length}/1000 characters</p>
          </div>

          {/* Send */}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={handleSend}
              disabled={sending || !message.trim()}
              className="btn-success flex-1 flex items-center justify-center gap-2"
            >
              {sending ? (
                <><FiCheck className="animate-spin" /> Sending...</>
              ) : (
                <><FiSend /> Send Message</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
