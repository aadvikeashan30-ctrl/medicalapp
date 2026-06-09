import React, { useState } from 'react';
import {
  FiShield, FiCheckCircle, FiXCircle, FiCpu, FiCreditCard, FiUser
} from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useApi } from '../hooks/useApi';

const inr = (n) => `\u20b9${Number(n || 0).toLocaleString('en-IN')}`;

export default function InsuranceDesk() {
  const { data: providersData } = useApi('/insurance/providers');
  const providers = providersData?.providers || [];

  const [form, setForm] = useState({ provider: '', policyNo: '', amount: '' });
  const [verifying, setVerifying] = useState(false);
  const [verification, setVerification] = useState(null);
  const [split, setSplit] = useState(null);

  const verify = async () => {
    if (!form.provider || !form.policyNo) return toast.error('Provider and policy number are required');
    setVerifying(true);
    setVerification(null);
    setSplit(null);
    try {
      const res = await api.post('/insurance/verify', { provider: form.provider, policyNo: form.policyNo });
      setVerification(res.data);
      if (res.data.verified && form.amount) {
        const est = await api.post('/insurance/estimate', { provider: form.provider, amount: Number(form.amount), coveragePercent: res.data.coveragePercent });
        setSplit(est.data);
      }
      res.data.verified ? toast.success('Policy verified') : toast.error('Policy could not be verified');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const estimate = async () => {
    if (!form.amount) return toast.error('Enter a bill amount');
    try {
      const est = await api.post('/insurance/estimate', { provider: form.provider, amount: Number(form.amount), coveragePercent: verification?.coveragePercent });
      setSplit(est.data);
    } catch (err) { toast.error('Failed to estimate'); }
  };


  return (
    <div className="page-enter space-y-6">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <FiShield className="text-white text-lg" />
          </div>
          Insurance Desk
        </h1>
        <p className="text-sm text-gray-500 mt-1">Pre-verify coverage at check-in and instantly split the bill into insurance and patient copay</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verify form */}
        <div className="card space-y-4 h-fit">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><FiCreditCard className="text-cyan-600" /> Verify Coverage</h3>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Insurance Provider</label>
            <input list="providers" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} className="input-field" placeholder="e.g. Star Health" />
            <datalist id="providers">
              {providers.map((p) => <option key={p.key} value={p.name} />)}
            </datalist>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Policy Number</label>
            <input value={form.policyNo} onChange={(e) => setForm({ ...form, policyNo: e.target.value })} className="input-field" placeholder="e.g. SH-1234567" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Bill Amount (optional)</label>
            <input type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="input-field" placeholder="e.g. 5000" />
          </div>
          <div className="flex gap-2">
            <button onClick={verify} disabled={verifying} className="btn-primary flex-1 flex items-center justify-center gap-2"><FiCpu /> {verifying ? 'Verifying...' : 'Verify Policy'}</button>
            {verification?.verified && <button onClick={estimate} className="btn-secondary">Estimate Split</button>}
          </div>
        </div>

        {/* Result */}
        <div className="space-y-4">
          {verification && (
            <div className={`card border-2 ${verification.verified ? 'border-emerald-200' : 'border-red-200'}`}>
              <div className="flex items-center gap-3 mb-3">
                {verification.verified ? <FiCheckCircle className="text-2xl text-emerald-500" /> : <FiXCircle className="text-2xl text-red-500" />}
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">{verification.verified ? 'Verified' : 'Not Verified'}</p>
                  <p className="text-xs text-gray-500">{verification.message}</p>
                </div>
              </div>
              {verification.verified && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-3 bg-emerald-50 rounded-xl"><p className="text-xs text-gray-500">Coverage</p><p className="font-bold text-emerald-700">{verification.coveragePercent}%</p></div>
                  <div className="p-3 bg-blue-50 rounded-xl"><p className="text-xs text-gray-500">Network</p><p className="font-bold text-blue-700">{verification.inNetwork ? 'In-Network' : 'Out-of-Network'}</p></div>
                </div>
              )}
            </div>
          )}

          {split && (
            <div className="card">
              <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2"><FaRupeeSign className="text-emerald-600" /> Split Billing</h3>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">Total Bill</span>
                <span className="font-bold text-gray-900 dark:text-white">{inr(split.totalAmount)}</span>
              </div>
              <div className="flex w-full h-3 rounded-full overflow-hidden mb-3">
                <div className="bg-emerald-500" style={{ width: `${split.coveragePercent}%` }} />
                <div className="bg-amber-400" style={{ width: `${100 - split.coveragePercent}%` }} />
              </div>
              {split.breakdown.map((b) => (
                <div key={b.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-600 dark:text-gray-300">{b.label} <span className="text-gray-400">({b.percent}%)</span></span>
                  <span className="font-semibold text-gray-900 dark:text-white">{inr(b.amount)}</span>
                </div>
              ))}
              <div className="mt-3 p-3 bg-amber-50 rounded-xl flex items-center justify-between">
                <span className="text-sm font-medium text-amber-800 flex items-center gap-1.5"><FiUser /> Patient pays now</span>
                <span className="text-lg font-bold text-amber-700">{inr(split.patientPayable)}</span>
              </div>
            </div>
          )}

          {!verification && (
            <div className="card h-full flex flex-col items-center justify-center text-center py-16 text-gray-400">
              <FiShield className="text-4xl mb-3 text-cyan-300" />
              <p className="text-sm">Verify a patient's policy to estimate coverage and split the bill.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
