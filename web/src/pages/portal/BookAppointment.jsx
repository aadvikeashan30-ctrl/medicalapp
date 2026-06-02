import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiCalendar, FiClock, FiUser, FiCheckCircle, FiMapPin, FiDollarSign, FiArrowLeft, FiAlertTriangle, FiVideo, FiHome } from 'react-icons/fi';
import { FaHeartbeat, FaStethoscope } from 'react-icons/fa';
import RazorpayPayment from '../../components/RazorpayPayment';
import axios from 'axios';
const api = axios.create({ baseURL: '/api' });

export default function BookAppointment() {
  const { doctorId } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [slots, setSlots] = useState([]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(null);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0,10), timeSlot: '', patientName: '', patientPhone: '', patientEmail: '', patientAge: '', patientGender: '', type: 'consultation', symptoms: '', consultationMode: 'in-person' });

  useEffect(() => { if (!doctorId) { setLoading(false); return; } api.get(`/portal/doctor/${doctorId}`).then(({data})=>setDoctor(data)).catch(()=>setError('Doctor not found')).finally(()=>setLoading(false)); }, [doctorId]);
  useEffect(() => { if (!doctorId||!form.date) return; api.get(`/portal/doctor/${doctorId}/slots?date=${form.date}`).then(({data})=>setSlots(data.slots||[])).catch(()=>setSlots([])); }, [doctorId, form.date]);

  const handleBook = async () => {
    if (!form.patientName||!form.patientPhone||!form.timeSlot) { setError('Fill all required fields'); return; }
    setBooking(true); setError(null);
    try {
      const {data}=await api.post('/portal/book',{doctorId,...form, consultationMode: form.consultationMode});
      setBooked(data);
      // Go to payment step instead of confirmation directly
      setStep(3);
    } catch(err){ setError(err.response?.data?.message||'Booking failed'); } finally { setBooking(false); }
  };

  const handlePaymentSuccess = (paymentData) => {
    setBooked(prev => ({ ...prev, paymentData }));
    setStep(4);
  };

  const handleSkipPayment = () => {
    setStep(4);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><FiClock className="text-3xl text-blue-500 animate-pulse"/></div>;
  if (!doctorId) return <div className="min-h-screen flex items-center justify-center p-6"><div className="text-center"><FaStethoscope className="mx-auto text-4xl text-blue-500 mb-4"/><h2 className="text-xl font-bold mb-2">Book an Appointment</h2><p className="text-gray-500 mb-4">Use the booking link from your doctor.</p><Link to="/symptom-checker" className="btn-primary">Check Symptoms</Link></div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3"><div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg"><FaHeartbeat className="text-white"/></div><span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">DocClinic Pro</span></Link>
          <Link to="/symptom-checker" className="btn-secondary text-sm !py-2">Symptom Checker</Link>
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Step 4: Confirmation */}
        {step===4 && booked && (
          <div className="text-center py-12 animate-fade-in">
            <div className="w-20 h-20 mx-auto mb-6 bg-emerald-100 rounded-full flex items-center justify-center"><FiCheckCircle className="text-emerald-600 text-4xl"/></div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Appointment Booked!</h2>
            <p className="text-gray-500 mb-6">Your appointment is confirmed.{booked.paymentData ? ' Payment received.' : ' Pay at clinic.'}</p>
            <div className="card max-w-sm mx-auto text-left space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Token</span><span className="font-bold text-blue-600">#{booked.appointment?.tokenNumber}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-medium">{new Date(booked.appointment?.date).toLocaleDateString('en-IN')}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Time</span><span className="font-medium">{booked.appointment?.timeSlot}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Mode</span><span className="font-medium capitalize">{form.consultationMode === 'video' ? '📹 Video Call' : '🏥 In-Person'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Patient ID</span><span className="font-mono text-xs">{booked.patient?.patientId}</span></div>
              {booked.paymentData && <div className="flex justify-between"><span className="text-gray-500">Payment</span><span className="text-emerald-600 font-medium">✓ Paid Online</span></div>}
            </div>
            {form.consultationMode === 'video' && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl max-w-sm mx-auto">
                <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2 justify-center">
                  <FiVideo /> Video link will be sent to your phone before appointment
                </p>
              </div>
            )}
            <p className="text-xs text-gray-400 mt-6">{form.consultationMode === 'in-person' ? 'Arrive 10 min early.' : 'Join link sent via WhatsApp.'} Doctor: Dr. {doctor?.name}</p>
            <Link to={`/track/${booked.appointment?.id}`} className="inline-block mt-4 btn-primary text-sm">Track Appointment</Link>
          </div>
        )}

        {/* Step 3: Payment */}
        {step===3 && booked && (
          <div className="animate-fade-in max-w-md mx-auto">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Complete Payment</h3>
              <p className="text-sm text-gray-500 mt-1">Secure online payment for your consultation</p>
            </div>
            <RazorpayPayment
              amount={doctor?.consultationFee || 500}
              doctorId={doctorId}
              doctorName={doctor?.name}
              appointmentId={booked.appointment?.id}
              patientName={form.patientName}
              patientPhone={form.patientPhone}
              patientEmail={form.patientEmail}
              onSuccess={handlePaymentSuccess}
              onSkip={handleSkipPayment}
            />
          </div>
        )}
        {step===1 && (
          <div className="animate-fade-in">
            {doctor && <div className="card mb-6 flex flex-col sm:flex-row sm:items-center gap-4"><div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"><FaStethoscope className="text-white text-xl"/></div><div className="flex-1"><h2 className="text-xl font-bold text-gray-900 dark:text-white">Dr. {doctor.name}</h2><p className="text-sm text-gray-500 capitalize">{doctor.specialty} • {doctor.qualification}</p><div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500"><span className="flex items-center gap-1"><FiMapPin/>{doctor.clinicName}, {doctor.clinicCity}</span><span className="flex items-center gap-1"><FiDollarSign/>₹{doctor.consultationFee}</span></div></div></div>}
            <div className="card space-y-5">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><FiCalendar className="text-blue-600"/> Select Date & Time</h3>
              <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Date</label><input type="date" value={form.date} min={new Date().toISOString().slice(0,10)} onChange={(e)=>setForm({...form,date:e.target.value,timeSlot:''})} className="input-field"/></div>
              <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Available Slots</label>
                {slots.length===0?<p className="text-sm text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">No slots. Try another date.</p>:(
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">{slots.map(s=><button key={s} type="button" onClick={()=>setForm({...form,timeSlot:s})} className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition-all ${form.timeSlot===s?'bg-blue-600 text-white border-blue-600 shadow-lg scale-105':'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-300'}`}>{s}</button>)}</div>
                )}
              </div>
              <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Visit Type</label><select value={form.type} onChange={(e)=>setForm({...form,type:e.target.value})} className="input-field"><option value="consultation">Consultation</option><option value="follow-up">Follow-up</option><option value="emergency">Emergency</option><option value="checkup">Health Checkup</option></select></div>
              <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Consultation Mode</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={()=>setForm({...form,consultationMode:'in-person'})} className={`p-3 rounded-xl border-2 text-center transition-all ${form.consultationMode==='in-person'?'border-blue-500 bg-blue-50 dark:bg-blue-900/20':'border-gray-200 dark:border-gray-700 hover:border-blue-200'}`}>
                    <FiHome className={`mx-auto text-xl mb-1 ${form.consultationMode==='in-person'?'text-blue-600':'text-gray-400'}`}/>
                    <span className={`text-sm font-medium ${form.consultationMode==='in-person'?'text-blue-700 dark:text-blue-300':'text-gray-600 dark:text-gray-400'}`}>In-Person</span>
                  </button>
                  <button type="button" onClick={()=>setForm({...form,consultationMode:'video'})} className={`p-3 rounded-xl border-2 text-center transition-all ${form.consultationMode==='video'?'border-violet-500 bg-violet-50 dark:bg-violet-900/20':'border-gray-200 dark:border-gray-700 hover:border-violet-200'}`}>
                    <FiVideo className={`mx-auto text-xl mb-1 ${form.consultationMode==='video'?'text-violet-600':'text-gray-400'}`}/>
                    <span className={`text-sm font-medium ${form.consultationMode==='video'?'text-violet-700 dark:text-violet-300':'text-gray-600 dark:text-gray-400'}`}>Video Call</span>
                  </button>
                </div>
              </div>
              <button onClick={()=>setStep(2)} disabled={!form.timeSlot} className="btn-primary w-full py-3">Continue →</button>
            </div>
          </div>
        )}
        {step===2 && (
          <div className="animate-fade-in">
            <button onClick={()=>setStep(1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 mb-4"><FiArrowLeft/> Back</button>
            <div className="card space-y-5">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><FiUser className="text-blue-600"/> Your Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Name *</label><input type="text" value={form.patientName} onChange={(e)=>setForm({...form,patientName:e.target.value})} className="input-field" placeholder="Full name" required/></div>
                <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Phone *</label><input type="tel" value={form.patientPhone} onChange={(e)=>setForm({...form,patientPhone:e.target.value})} className="input-field" placeholder="+91 98765 43210" required/></div>
                <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Email</label><input type="email" value={form.patientEmail} onChange={(e)=>setForm({...form,patientEmail:e.target.value})} className="input-field" placeholder="email@example.com"/></div>
                <div className="grid grid-cols-2 gap-3"><div><label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Age</label><input type="number" min={1} max={120} value={form.patientAge} onChange={(e)=>setForm({...form,patientAge:e.target.value})} className="input-field"/></div><div><label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Gender</label><select value={form.patientGender} onChange={(e)=>setForm({...form,patientGender:e.target.value})} className="input-field"><option value="">--</option><option value="male">Male</option><option value="female">Female</option></select></div></div>
              </div>
              <div><label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Symptoms</label><textarea value={form.symptoms} onChange={(e)=>setForm({...form,symptoms:e.target.value})} className="input-field" rows={3} placeholder="Brief description..."/></div>
              {error && <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl"><FiAlertTriangle/>{error}</div>}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 text-sm"><p className="text-xs font-semibold text-blue-700 uppercase mb-2">Summary</p><div className="grid grid-cols-2 gap-1 text-blue-800"><span>Doctor:</span><span className="font-medium">Dr. {doctor?.name}</span><span>Date:</span><span className="font-medium">{new Date(form.date).toLocaleDateString('en-IN')}</span><span>Time:</span><span className="font-medium">{form.timeSlot}</span><span>Fee:</span><span className="font-medium">₹{doctor?.consultationFee||500}</span></div></div>
              <button onClick={handleBook} disabled={booking} className="btn-primary w-full py-3.5 flex items-center justify-center gap-2">{booking?<><FiClock className="animate-spin"/>Booking...</>:<><FiCheckCircle/>Confirm Booking</>}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
