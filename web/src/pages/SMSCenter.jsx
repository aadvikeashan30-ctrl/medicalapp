import React, { useState } from 'react';
import { FiMessageSquare, FiSend, FiCheckCircle, FiClock, FiZap, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useApi } from '../hooks/useApi';

export default function SMSCenter() {
  const { data: tpl } = useApi('/sms/templates');
  const { data: status } = useApi('/sms/status');
  const { data: logData, refetch } = useApi('/sms/log');
  const templates = tpl?.templates || [];
  const log = logData?.log || [];

  const [to, setTo] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const useTemplate = (t) => setBody(t.body);

  const send = async (e) => {
    e.preventDefault();
    if (!to.trim() || !body.trim()) return toast.error('Recipient and message are required');
    setSending(true);
    try {
      const res = await api.post('/sms/send', { to, body });
      toast.success(res.data?.message || 'Sent');
      setTo(''); setBody(''); refetch();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSending(false); }
  };


  return (
    <div className="page-enter space-y-6">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center"><FiMessageSquare className="text-white text-lg" /></div>
          SMS Center
        </h1>
        <p className="text-sm text-gray-500 mt-1">Send reminders, alerts and offers over SMS with ready-made templates</p>
      </div>

      {status && !status.configured && (
        <div className="card !py-3 flex items-start gap-2 bg-amber-50/60 border-amber-100">
          <FiAlertCircle className="text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700">No SMS provider configured — messages are simulated. Set <code className="bg-amber-100 px-1 rounded">SMS_PROVIDER</code> + <code className="bg-amber-100 px-1 rounded">SMS_API_KEY</code> to go live.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Composer */}
        <div className="card space-y-4">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><FiSend className="text-indigo-600" /> Compose</h3>
          <div className="flex flex-wrap gap-2">
            {templates.map((t) => (
              <button key={t.key} onClick={() => useTemplate(t)} className="text-xs px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100">{t.label}</button>
            ))}
          </div>
          <form onSubmit={send} className="space-y-3">
            <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">To</label><input value={to} onChange={(e) => setTo(e.target.value)} className="input-field" placeholder="Phone number" /></div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Message</label>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} className="input-field" placeholder="Type your SMS... use {name}, {date}, {time}, {link}" />
              <p className="text-xs text-gray-400 mt-1">{body.length} chars · {Math.max(1, Math.ceil(body.length / 160))} SMS</p>
            </div>
            <button type="submit" disabled={sending} className="btn-primary w-full flex items-center justify-center gap-2"><FiZap /> {sending ? 'Sending...' : 'Send SMS'}</button>
          </form>
        </div>

        {/* Log */}
        <div className="card">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4"><FiClock className="text-blue-600" /> Recent Messages</h3>
          {log.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No messages sent yet.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto custom-scroll">
              {log.map((m, i) => (
                <div key={i} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{m.to}</span>
                    <span className="text-[11px] text-emerald-600 flex items-center gap-1"><FiCheckCircle className="text-[10px]" /> {m.status}</span>
                  </div>
                  <p className="text-xs text-gray-500">{m.body}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{new Date(m.at).toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
