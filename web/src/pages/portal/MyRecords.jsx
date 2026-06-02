import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPhone, FiCalendar, FiFileText, FiActivity, FiDollarSign, FiStar, FiCheckCircle, FiShield, FiHeart } from 'react-icons/fi';
import { FaHeartbeat, FaPills } from 'react-icons/fa';
import axios from 'axios';
const api = axios.create({ baseURL: '/api' });

export default function MyRecords() {
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [records, setRecords] = useState(null);
  const [activeTab, setActiveTab] = useState('appointments');
  const [showReview, setShowReview] = useState(false);
  const [review, setReview] = useState({ rating: 5, text: '' });
  const [reviewDone, setReviewDone] = useState(false);

  const handleLookup = async (e) => {
    e.preventDefault();
    if (phone.length < 10) { setError('Enter 10-digit phone'); return; }
    setLoading(true); setError('');
    try { const { data } = await api.get(`/portal/my-records?phone=${phone}`); setRecords(data); setStep('records'); }
    catch (err) { setError(err.response?.data?.message || 'No records found'); }
    finally { setLoading(false); }
  };

  const submitReview = async () => {
    try { await api.post('/portal/review', { phone, ...review }); setReviewDone(true); } catch {}
  };

  const tabs = [
    { id: 'appointments', label: 'Appointments', icon: FiCalendar },
    { id: 'prescriptions', label: 'Prescriptions', icon: FiFileText },
    { id: 'labtests', label: 'Lab Tests', icon: FiActivity },
    { id: 'bills', label: 'Bills', icon: FiDollarSign }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3"><div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg"><FaHeartbeat className="text-white"/></div><span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">DocClinic Pro</span></Link>
          <div className="flex gap-2"><Link to="/symptom-checker" className="btn-secondary text-sm !py-2">AI Check</Link><Link to="/book" className="btn-primary text-sm !py-2">Book</Link></div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {step === 'phone' && (
          <div className="max-w-md mx-auto text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl"><FiShield className="text-white text-2xl"/></div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">My Health Records</h1>
            <p className="text-gray-500 mb-8">View appointments, prescriptions, lab reports & bills</p>
            <form onSubmit={handleLookup} className="card text-left space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Phone Number</label>
                <div className="relative"><FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g,'').slice(0,10))} className="input-field !pl-11" placeholder="9876543210" maxLength={10} required/></div>
                <p className="text-xs text-gray-400 mt-1">Same number registered with your doctor</p>
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
              <button type="submit" disabled={loading||phone.length<10} className="btn-primary w-full py-3">{loading ? 'Looking up...' : 'View My Records'}</button>
            </form>
          </div>
        )}

        {step === 'records' && records && (
          <div className="animate-fade-in space-y-6">
            <div className="card flex items-center gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg">{records.patient?.name?.charAt(0)?.toUpperCase()||'?'}</div>
              <div className="flex-1"><h2 className="font-bold text-gray-900 text-lg">{records.patient?.name}</h2><p className="text-sm text-gray-500">ID: {records.patient?.patientId} • {records.patient?.age}y {records.patient?.gender}</p></div>
              <button onClick={()=>setShowReview(true)} className="flex items-center gap-1.5 px-3 py-2 bg-yellow-50 text-yellow-700 rounded-xl text-xs font-medium hover:bg-yellow-100"><FiStar/> Rate</button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {tabs.map(t=><button key={t.id} onClick={()=>setActiveTab(t.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${activeTab===t.id?'bg-blue-600 text-white shadow-lg':'bg-white text-gray-600 border border-gray-200'}`}><t.icon/>{t.label}</button>)}
            </div>

            {activeTab==='appointments' && <div className="space-y-3">{(records.appointments||[]).length===0?<div className="card text-center py-10 text-gray-400">No appointments</div>:(records.appointments||[]).map((a,i)=><div key={i} className="card !p-4 flex items-center justify-between"><div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${a.status==='completed'?'bg-emerald-100 text-emerald-700':'bg-blue-100 text-blue-700'}`}>#{a.tokenNumber||i+1}</div><div><p className="font-semibold text-gray-900 text-sm">{a.type||'Consultation'}</p><p className="text-xs text-gray-500">{new Date(a.date).toLocaleDateString('en-IN')} • {a.timeSlot}</p></div></div><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${a.status==='completed'?'bg-emerald-100 text-emerald-700':'bg-blue-100 text-blue-700'}`}>{a.status}</span></div>)}</div>}

            {activeTab==='prescriptions' && <div className="space-y-3">{(records.prescriptions||[]).length===0?<div className="card text-center py-10 text-gray-400">No prescriptions</div>:(records.prescriptions||[]).map((rx,i)=><div key={i} className="card"><div className="flex items-center justify-between mb-2"><span className="font-semibold text-gray-900 text-sm flex items-center gap-2"><FiFileText className="text-indigo-600"/>{rx.diagnosis||'Prescription'}</span><span className="text-xs text-gray-400">{new Date(rx.createdAt).toLocaleDateString('en-IN')}</span></div>{rx.medicines?.map((m,j)=><div key={j} className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 mb-1"><FaPills className="text-blue-500 text-xs"/><span className="font-medium">{m.name} {m.dosage}</span><span className="text-xs text-gray-400">• {m.frequency} • {m.duration}</span></div>)}{rx.advice&&<p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2 mt-2"><FiHeart className="inline mr-1 text-[10px]"/>{rx.advice}</p>}</div>)}</div>}

            {activeTab==='labtests' && <div className="space-y-3">{(records.labTests||[]).length===0?<div className="card text-center py-10 text-gray-400">No lab tests</div>:(records.labTests||[]).map((lt,i)=><div key={i} className="card !p-4 flex items-center justify-between"><div><p className="font-semibold text-gray-900 text-sm">{lt.name}</p><p className="text-xs text-gray-500">{lt.category} • {new Date(lt.createdAt).toLocaleDateString('en-IN')}</p>{lt.resultSummary&&<p className="text-xs text-emerald-600 mt-1">{lt.resultSummary}</p>}</div><span className={`text-xs px-2.5 py-1 rounded-full font-medium ${lt.status==='reported'?'bg-emerald-100 text-emerald-700':'bg-blue-100 text-blue-700'}`}>{lt.status}</span></div>)}</div>}

            {activeTab==='bills' && <div className="space-y-3">{(records.bills||[]).length===0?<div className="card text-center py-10 text-gray-400">No bills</div>:(records.bills||[]).map((b,i)=><div key={i} className="card !p-4 flex items-center justify-between"><div><p className="font-semibold text-gray-900 text-sm">{b.invoiceNo}</p><p className="text-xs text-gray-500">{new Date(b.createdAt).toLocaleDateString('en-IN')}</p></div><div className="text-right"><p className="font-bold text-gray-900">₹{(b.totalAmount||0).toLocaleString('en-IN')}</p><span className={`text-xs ${b.paymentStatus==='paid'?'text-emerald-600':'text-red-600'}`}>{b.paymentStatus}</span></div></div>)}</div>}

            <div className="flex flex-wrap gap-3 pt-4"><Link to="/book" className="btn-primary text-sm flex items-center gap-2"><FiCalendar/>Book Again</Link><Link to="/symptom-checker" className="btn-secondary text-sm flex items-center gap-2"><FiActivity/>AI Check</Link><button onClick={()=>{setStep('phone');setRecords(null);}} className="btn-secondary text-sm">Logout</button></div>
          </div>
        )}

        {showReview && !reviewDone && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-scale-in"><h3 className="font-bold text-gray-900 text-lg mb-4">Rate Your Experience</h3><div className="flex gap-2 mb-4">{[1,2,3,4,5].map(n=><button key={n} onClick={()=>setReview({...review,rating:n})} className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${n<=review.rating?'bg-yellow-100 text-yellow-500 scale-110':'bg-gray-100 text-gray-300'}`}><FiStar/></button>)}</div><textarea value={review.text} onChange={e=>setReview({...review,text:e.target.value})} className="input-field" rows={3} placeholder="Your experience..."/><div className="flex gap-3 mt-4"><button onClick={()=>setShowReview(false)} className="btn-secondary flex-1">Cancel</button><button onClick={submitReview} className="btn-primary flex-1">Submit</button></div></div></div>}
        {showReview && reviewDone && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-scale-in"><FiCheckCircle className="mx-auto text-4xl text-emerald-500 mb-3"/><h3 className="font-bold mb-2">Thank You!</h3><p className="text-sm text-gray-500 mb-4">Your review helps others find good doctors.</p><button onClick={()=>setShowReview(false)} className="btn-primary">Close</button></div></div>}
      </div>
    </div>
  );
}
