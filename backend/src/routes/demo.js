/**
 * Demo Mode Routes
 *
 * These routes kick in ONLY when MongoDB is not connected.
 * They provide in-memory dummy data so the frontend can be explored
 * without needing any database.
 *
 * Credentials: demo@docclinic.com / demo1234
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const router = express.Router();

// Demo data store (in memory - resets on server restart)
const DEMO_USER = {
  _id: 'demo-doctor-001',
  id: 'demo-doctor-001',
  name: 'Demo Doctor',
  email: 'demo@docclinic.com',
  phone: '9000000000',
  role: 'doctor',
  specialty: 'general',
  qualification: 'MBBS, MD',
  registrationNo: 'REG-DEMO-001',
  clinicName: 'DocClinic Demo Centre',
  clinicAddress: '123 Health Street',
  clinicCity: 'Mumbai',
  consultationFee: 500,
  plan: 'pro',
  planExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  workingHours: { start: '09:00', end: '18:00' },
  isActive: true
};

const today = new Date();
today.setHours(0, 0, 0, 0);

const DEMO_PATIENTS = [
  { _id: 'pat-1', patientId: 'PAT-0001', name: 'Ramesh Kumar', phone: '9876543210', age: 45, gender: 'male', bloodGroup: 'B+', city: 'Mumbai', allergies: ['Penicillin'], totalVisits: 12, totalBilled: 6500, isActive: true, createdAt: new Date('2024-10-15') },
  { _id: 'pat-2', patientId: 'PAT-0002', name: 'Priya Sharma', phone: '9876543211', age: 32, gender: 'female', bloodGroup: 'O+', city: 'Mumbai', allergies: [], totalVisits: 5, totalBilled: 2500, isActive: true, createdAt: new Date('2024-11-20') },
  { _id: 'pat-3', patientId: 'PAT-0003', name: 'Amit Patel', phone: '9876543212', age: 28, gender: 'male', bloodGroup: 'A+', city: 'Pune', allergies: [], totalVisits: 3, totalBilled: 1500, isActive: true, createdAt: new Date('2025-01-05') },
  { _id: 'pat-4', patientId: 'PAT-0004', name: 'Sunita Reddy', phone: '9876543213', age: 55, gender: 'female', bloodGroup: 'AB+', city: 'Mumbai', allergies: ['Aspirin'], totalVisits: 8, totalBilled: 4200, isActive: true, createdAt: new Date('2025-02-10') },
  { _id: 'pat-5', patientId: 'PAT-0005', name: 'Vikram Singh', phone: '9876543214', age: 38, gender: 'male', bloodGroup: 'B-', city: 'Delhi', allergies: [], totalVisits: 2, totalBilled: 1000, isActive: true, createdAt: new Date('2025-04-01') }
];

const DEMO_APPOINTMENTS = [
  { _id: 'apt-1', patientId: DEMO_PATIENTS[0], date: today.toISOString(), timeSlot: '09:00 AM', type: 'consultation', status: 'completed', tokenNumber: 1, symptoms: 'BP check' },
  { _id: 'apt-2', patientId: DEMO_PATIENTS[1], date: today.toISOString(), timeSlot: '09:30 AM', type: 'follow-up', status: 'completed', tokenNumber: 2, symptoms: 'Fever follow-up' },
  { _id: 'apt-3', patientId: DEMO_PATIENTS[2], date: today.toISOString(), timeSlot: '10:00 AM', type: 'consultation', status: 'in-progress', tokenNumber: 3, symptoms: 'Headache' },
  { _id: 'apt-4', patientId: DEMO_PATIENTS[3], date: today.toISOString(), timeSlot: '10:30 AM', type: 'consultation', status: 'scheduled', tokenNumber: 4, symptoms: 'Diabetes review' },
  { _id: 'apt-5', patientId: DEMO_PATIENTS[4], date: today.toISOString(), timeSlot: '11:00 AM', type: 'checkup', status: 'scheduled', tokenNumber: 5, symptoms: 'Annual checkup' }
];

const DEMO_PRESCRIPTIONS = [
  {
    _id: 'rx-1', prescriptionNo: 'RX-00001', patientId: DEMO_PATIENTS[0],
    diagnosis: 'Hypertension follow-up',
    medicines: [
      { name: 'Amlodipine', dosage: '5mg', frequency: '1-0-0', duration: '30 days', timing: 'after-food' },
      { name: 'Atorvastatin', dosage: '10mg', frequency: '0-0-1', duration: '30 days', timing: 'bedtime' }
    ],
    advice: 'Low-salt diet. Daily walk 30 min.',
    vitals: { bp: '140/90', pulse: 78, weight: 80 },
    createdAt: new Date('2025-05-20')
  },
  {
    _id: 'rx-2', prescriptionNo: 'RX-00002', patientId: DEMO_PATIENTS[1],
    diagnosis: 'Viral fever',
    medicines: [
      { name: 'Paracetamol', dosage: '500mg', frequency: '1-1-1', duration: '3 days', timing: 'after-food' }
    ],
    advice: 'Rest, plenty of fluids.',
    vitals: { temperature: 101.2, weight: 58 },
    createdAt: new Date('2025-05-25')
  },
  {
    _id: 'rx-3', prescriptionNo: 'RX-00003', patientId: DEMO_PATIENTS[3],
    diagnosis: 'Type 2 Diabetes review',
    medicines: [
      { name: 'Metformin', dosage: '500mg', frequency: '1-0-1', duration: '30 days', timing: 'after-food' }
    ],
    advice: 'Continue diet plan. Fasting glucose in 1 month.',
    vitals: { bp: '130/85', weight: 72 },
    createdAt: new Date('2025-05-27')
  }
];

const DEMO_BILLS = [
  { _id: 'bill-1', invoiceNo: 'INV-00001', patientId: DEMO_PATIENTS[0], items: [{ description: 'Consultation', amount: 500, quantity: 1 }], subtotal: 500, totalAmount: 500, paidAmount: 500, paymentMethod: 'cash', paymentStatus: 'paid', createdAt: new Date('2025-05-20') },
  { _id: 'bill-2', invoiceNo: 'INV-00002', patientId: DEMO_PATIENTS[1], items: [{ description: 'Consultation', amount: 500, quantity: 1 }, { description: 'CBC Test', amount: 350, quantity: 1 }], subtotal: 850, totalAmount: 850, paidAmount: 850, paymentMethod: 'upi', paymentStatus: 'paid', createdAt: new Date('2025-05-25') },
  { _id: 'bill-3', invoiceNo: 'INV-00003', patientId: DEMO_PATIENTS[2], items: [{ description: 'Consultation', amount: 500, quantity: 1 }], subtotal: 500, totalAmount: 500, paidAmount: 0, paymentMethod: 'cash', paymentStatus: 'pending', createdAt: new Date('2025-05-27') },
  { _id: 'bill-4', invoiceNo: 'INV-00004', patientId: DEMO_PATIENTS[3], items: [{ description: 'Follow-up', amount: 300, quantity: 1 }, { description: 'HbA1c Test', amount: 600, quantity: 1 }], subtotal: 900, totalAmount: 900, paidAmount: 500, paymentMethod: 'card', paymentStatus: 'partial', createdAt: new Date('2025-05-28') }
];

// Middleware: only respond if DB is not connected (demo mode)
// Also checks actual mongoose connection state to handle race conditions
function demoOnly(req, res, next) {
  // If DB is truly connected and ready, skip demo routes
  if (req.app.locals.dbConnected && mongoose.connection.readyState === 1) {
    // But if user has a demo token, still serve demo data
    try {
      const header = req.header('Authorization') || '';
      const token = header.replace(/^Bearer\s+/i, '').trim();
      if (token) {
        const secret = process.env.JWT_SECRET || 'demo-fallback-secret-key-32chars!!';
        const decoded = jwt.verify(token, secret);
        if (decoded.userId === 'demo-doctor-001') {
          return next(); // Serve demo data for demo user even if DB is connected
        }
      }
    } catch (e) { /* ignore token errors, fall through */ }
    return next('route');
  }
  // DB not connected — serve demo data
  next();
}

// ==================== AUTH ====================
// Demo login ALWAYS works — no demoOnly check needed for login
router.post('/auth/login', (req, res, next) => {
  const { email, password } = req.body;
  if (email === 'demo@docclinic.com' && password === 'demo1234') {
    const token = jwt.sign({ userId: DEMO_USER._id }, process.env.JWT_SECRET || 'demo-fallback-secret-key-32chars!!', { expiresIn: '30d' });
    return res.json({ token, user: DEMO_USER });
  }
  // Not demo credentials — pass to real auth route
  next('route');
});

router.post('/auth/register', demoOnly, (req, res) => {
  const token = jwt.sign({ userId: DEMO_USER._id }, process.env.JWT_SECRET || 'demo-fallback-secret-key-32chars!!', { expiresIn: '30d' });
  return res.status(201).json({ token, user: { ...DEMO_USER, name: req.body.name || DEMO_USER.name } });
});

router.get('/auth/profile', demoOnly, (req, res) => {
  res.json(DEMO_USER);
});

router.put('/auth/profile', demoOnly, (req, res) => {
  res.json({ ...DEMO_USER, ...req.body });
});

router.post('/auth/change-password', demoOnly, (req, res) => {
  res.json({ message: 'Password updated (demo mode - not persisted)' });
});

router.post('/auth/forgot-password', demoOnly, (req, res) => {
  res.json({ message: 'If that email exists, a reset link has been sent.' });
});

// ==================== DASHBOARD ====================
router.get('/dashboard/stats', demoOnly, (req, res) => {
  res.json({
    totalPatients: DEMO_PATIENTS.length,
    todayAppointments: DEMO_APPOINTMENTS.length,
    monthRevenue: 2750,
    todayCompleted: 2,
    pendingPayments: 2,
    newPatientsThisMonth: 1
  });
});

router.get('/dashboard/recent', demoOnly, (req, res) => {
  res.json({
    recentPatients: DEMO_PATIENTS.slice(0, 5),
    recentAppointments: DEMO_APPOINTMENTS
  });
});

router.get('/dashboard/analytics', demoOnly, (req, res) => {
  res.json({
    monthlyRevenue: [
      { _id: '2025-01', revenue: 12500, count: 25 },
      { _id: '2025-02', revenue: 15200, count: 30 },
      { _id: '2025-03', revenue: 18700, count: 37 },
      { _id: '2025-04', revenue: 14300, count: 28 },
      { _id: '2025-05', revenue: 22100, count: 44 }
    ],
    monthlyPatients: [
      { _id: '2025-01', count: 8 },
      { _id: '2025-02', count: 5 },
      { _id: '2025-03', count: 12 },
      { _id: '2025-04', count: 6 },
      { _id: '2025-05', count: 3 }
    ]
  });
});

// ==================== PATIENTS ====================
router.get('/patients', demoOnly, (req, res) => {
  let list = [...DEMO_PATIENTS];
  if (req.query.search) {
    const s = req.query.search.toLowerCase();
    list = list.filter((p) =>
      p.name.toLowerCase().includes(s) || p.phone.includes(s) || p.patientId.toLowerCase().includes(s)
    );
  }
  res.json({ patients: list, total: list.length, pages: 1, page: 1 });
});

router.get('/patients/:id', demoOnly, (req, res) => {
  const p = DEMO_PATIENTS.find((x) => x._id === req.params.id);
  if (!p) return res.status(404).json({ message: 'Patient not found' });
  res.json(p);
});

router.post('/patients', demoOnly, (req, res) => {
  const newP = {
    _id: `pat-${Date.now()}`,
    patientId: `PAT-${String(DEMO_PATIENTS.length + 1).padStart(4, '0')}`,
    ...req.body,
    totalVisits: 0,
    totalBilled: 0,
    isActive: true,
    createdAt: new Date()
  };
  DEMO_PATIENTS.push(newP);
  res.status(201).json(newP);
});

router.put('/patients/:id', demoOnly, (req, res) => {
  const idx = DEMO_PATIENTS.findIndex((x) => x._id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Patient not found' });
  Object.assign(DEMO_PATIENTS[idx], req.body);
  res.json(DEMO_PATIENTS[idx]);
});

router.delete('/patients/:id', demoOnly, (req, res) => {
  const idx = DEMO_PATIENTS.findIndex((x) => x._id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Patient not found' });
  DEMO_PATIENTS[idx].isActive = false;
  res.json({ message: 'Patient deleted' });
});

// ==================== APPOINTMENTS ====================
router.get('/appointments', demoOnly, (req, res) => {
  res.json({ appointments: DEMO_APPOINTMENTS, total: DEMO_APPOINTMENTS.length, pages: 1, page: 1 });
});

router.get('/appointments/queue/today', demoOnly, (req, res) => {
  const queue = DEMO_APPOINTMENTS.filter((a) => ['scheduled', 'confirmed', 'in-progress'].includes(a.status));
  res.json(queue);
});

router.post('/appointments', demoOnly, (req, res) => {
  const patient = DEMO_PATIENTS.find((p) => p._id === req.body.patientId);
  const apt = {
    _id: `apt-${Date.now()}`,
    patientId: patient || DEMO_PATIENTS[0],
    date: req.body.date,
    timeSlot: req.body.timeSlot,
    type: req.body.type || 'consultation',
    status: 'scheduled',
    tokenNumber: DEMO_APPOINTMENTS.length + 1,
    symptoms: req.body.symptoms || ''
  };
  DEMO_APPOINTMENTS.push(apt);
  res.status(201).json(apt);
});

router.put('/appointments/:id', demoOnly, (req, res) => {
  const apt = DEMO_APPOINTMENTS.find((a) => a._id === req.params.id);
  if (!apt) return res.status(404).json({ message: 'Appointment not found' });
  Object.assign(apt, req.body);
  res.json(apt);
});

router.delete('/appointments/:id', demoOnly, (req, res) => {
  const idx = DEMO_APPOINTMENTS.findIndex((a) => a._id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Appointment not found' });
  DEMO_APPOINTMENTS.splice(idx, 1);
  res.json({ message: 'Appointment cancelled' });
});

// ==================== PRESCRIPTIONS ====================
router.get('/prescriptions', demoOnly, (req, res) => {
  res.json({ prescriptions: DEMO_PRESCRIPTIONS, total: DEMO_PRESCRIPTIONS.length, pages: 1, page: 1 });
});

router.get('/prescriptions/templates', demoOnly, (req, res) => {
  res.json([]);
});

router.post('/prescriptions', demoOnly, (req, res) => {
  const patient = DEMO_PATIENTS.find((p) => p._id === req.body.patientId);
  const rx = {
    _id: `rx-${Date.now()}`,
    prescriptionNo: `RX-${String(DEMO_PRESCRIPTIONS.length + 1).padStart(5, '0')}`,
    patientId: patient || DEMO_PATIENTS[0],
    ...req.body,
    createdAt: new Date()
  };
  DEMO_PRESCRIPTIONS.push(rx);
  res.status(201).json(rx);
});

router.get('/prescriptions/:id', demoOnly, (req, res) => {
  const rx = DEMO_PRESCRIPTIONS.find((x) => x._id === req.params.id);
  if (!rx) return res.status(404).json({ message: 'Prescription not found' });
  res.json(rx);
});

router.delete('/prescriptions/:id', demoOnly, (req, res) => {
  const idx = DEMO_PRESCRIPTIONS.findIndex((x) => x._id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Prescription not found' });
  DEMO_PRESCRIPTIONS.splice(idx, 1);
  res.json({ message: 'Prescription deleted' });
});

// ==================== BILLING ====================
router.get('/billing', demoOnly, (req, res) => {
  res.json({ bills: DEMO_BILLS, total: DEMO_BILLS.length, pages: 1, page: 1 });
});

router.get('/billing/revenue/summary', demoOnly, (req, res) => {
  res.json({ today: 1350, week: 2750, month: 2750, total: 15700 });
});

router.post('/billing', demoOnly, (req, res) => {
  const patient = DEMO_PATIENTS.find((p) => p._id === req.body.patientId);
  const subtotal = (req.body.items || []).reduce((s, i) => s + (Number(i.amount) || 0) * (Number(i.quantity) || 1), 0);
  const bill = {
    _id: `bill-${Date.now()}`,
    invoiceNo: `INV-${String(DEMO_BILLS.length + 1).padStart(5, '0')}`,
    patientId: patient || DEMO_PATIENTS[0],
    items: req.body.items || [],
    subtotal,
    totalAmount: subtotal - Number(req.body.discount || 0) + Number(req.body.tax || 0),
    paidAmount: Number(req.body.paidAmount || 0),
    paymentMethod: req.body.paymentMethod || 'cash',
    paymentStatus: Number(req.body.paidAmount || 0) >= subtotal ? 'paid' : Number(req.body.paidAmount || 0) > 0 ? 'partial' : 'pending',
    createdAt: new Date()
  };
  DEMO_BILLS.push(bill);
  res.status(201).json(bill);
});

router.put('/billing/:id', demoOnly, (req, res) => {
  const bill = DEMO_BILLS.find((b) => b._id === req.params.id);
  if (!bill) return res.status(404).json({ message: 'Bill not found' });
  Object.assign(bill, req.body);
  if (typeof req.body.paidAmount === 'number') {
    if (bill.paidAmount >= bill.totalAmount) bill.paymentStatus = 'paid';
    else if (bill.paidAmount > 0) bill.paymentStatus = 'partial';
    else bill.paymentStatus = 'pending';
  }
  res.json(bill);
});

// ==================== MEDICINES ====================
router.get('/medicines', demoOnly, (req, res) => {
  res.json([
    { _id: 'med-1', name: 'Paracetamol', strength: '500mg', form: 'tablet', defaultFrequency: '1-0-1', defaultDuration: '3 days', defaultTiming: 'after-food' },
    { _id: 'med-2', name: 'Amoxicillin', strength: '500mg', form: 'capsule', defaultFrequency: '1-1-1', defaultDuration: '5 days', defaultTiming: 'after-food' },
    { _id: 'med-3', name: 'Metformin', strength: '500mg', form: 'tablet', defaultFrequency: '1-0-1', defaultDuration: '30 days', defaultTiming: 'after-food' },
    { _id: 'med-4', name: 'Atorvastatin', strength: '10mg', form: 'tablet', defaultFrequency: '0-0-1', defaultDuration: '30 days', defaultTiming: 'bedtime' },
    { _id: 'med-5', name: 'Omeprazole', strength: '20mg', form: 'capsule', defaultFrequency: '1-0-0', defaultDuration: '14 days', defaultTiming: 'before-food' }
  ]);
});

// ==================== AI ====================
router.post('/ai/chat', demoOnly, (req, res) => {
  const ai = require('../services/aiService');
  const messages = req.body.messages || [{ role: 'user', content: 'hello' }];
  const response = ai.chat(messages).then ? undefined : '';
  // Use sync demo response
  const lastMsg = (messages[messages.length - 1]?.content || '').toLowerCase();
  let reply = "I can help with diagnoses, prescriptions, drug interactions, risk scores, and scheduling. What do you need?";
  if (lastMsg.includes('hello') || lastMsg.includes('hi')) reply = "Hello Doctor! I'm your AI clinical assistant. Ask me about diagnoses, prescriptions, drug interactions, patient risks, or scheduling optimization.";
  if (lastMsg.includes('diagnos') || lastMsg.includes('fever') || lastMsg.includes('cough') || lastMsg.includes('pain')) reply = "Based on the symptoms:\n\n1. **Viral URI** (most likely) — supportive care\n2. **Allergic Rhinitis** — antihistamines\n3. **Bacterial Sinusitis** (if >10 days) — antibiotics\n\n⚠️ *AI suggestion — verify clinically.*";
  if (lastMsg.includes('prescri') || lastMsg.includes('treatment') || lastMsg.includes('medicine')) reply = "**Suggested:**\n• Paracetamol 500mg 1-0-1 × 3d\n• Cetirizine 10mg 0-0-1 × 5d\n• Steam inhalation TID\n\n⚠️ *Check allergies before prescribing.*";
  if (lastMsg.includes('risk') || lastMsg.includes('score')) reply = "**Risk Score: 6/10 (Moderate)**\n\nFactors: Age >45, irregular visits, elevated BMI.\nAction: Quarterly reviews, lipid panel, lifestyle changes.";
  if (lastMsg.includes('schedul') || lastMsg.includes('optimi')) reply = "**Schedule Insights:**\n• Peak: 10-12 PM\n• 2 no-show risks\n• Keep emergency buffer at 10:30 & 2:30\n• Best day for procedures: Wednesday";
  res.json({ response: reply, provider: 'demo', timestamp: new Date().toISOString() });
});

router.post('/ai/diagnose', demoOnly, (req, res) => {
  res.json({
    diagnoses: [
      { condition: 'Viral Upper Respiratory Infection', probability: 'high', icd10: 'J06.9', reasoning: 'Acute onset, self-limiting', investigations: ['CBC', 'CRP if persistent'], redFlags: ['Breathing difficulty', 'High fever >5 days'] },
      { condition: 'Allergic Rhinitis', probability: 'medium', icd10: 'J30.4', reasoning: 'Seasonal pattern', investigations: ['IgE levels'], redFlags: [] },
      { condition: 'Acute Sinusitis', probability: 'low', icd10: 'J01.9', reasoning: 'If symptoms >10 days', investigations: ['CT sinuses if recurrent'], redFlags: ['Orbital swelling', 'Severe headache'] }
    ],
    urgency: 'routine',
    provider: 'demo'
  });
});

router.post('/ai/prescribe', demoOnly, (req, res) => {
  res.json({
    medicines: [
      { name: 'Paracetamol', dosage: '500mg', frequency: '1-0-1', duration: '3 days', timing: 'after-food', notes: 'For fever/pain' },
      { name: 'Cetirizine', dosage: '10mg', frequency: '0-0-1', duration: '5 days', timing: 'bedtime', notes: 'For congestion' },
      { name: 'Amoxicillin', dosage: '500mg', frequency: '1-1-1', duration: '5 days', timing: 'after-food', notes: 'Only if bacterial suspected' }
    ],
    warnings: ['Check for penicillin allergy before Amoxicillin'],
    interactions: [],
    advice: 'Rest, hydration, steam inhalation. Return if no improvement in 5 days.',
    provider: 'demo'
  });
});

router.post('/ai/risk-score', demoOnly, (req, res) => {
  res.json({
    riskScore: 6,
    riskLevel: 'moderate',
    factors: ['Age > 45', 'Hypertension', 'Irregular follow-ups', 'BMI > 25'],
    recommendations: ['Quarterly BP monitoring', 'Lipid panel', 'Lifestyle modification counseling'],
    predictedNoShowProbability: 15,
    suggestedFollowUp: '2 weeks',
    provider: 'demo'
  });
});

router.post('/ai/optimize-schedule', demoOnly, (req, res) => {
  res.json({
    insights: { predictedLoad: 20, peakHours: ['10:00-12:00'], suggestedBreaks: ['13:00-14:00'], noShowRisk: ['Token #4', 'Token #7'] },
    optimizations: ['Move follow-ups to afternoon', 'Keep 2 emergency buffers', 'Wednesday best for procedures'],
    suggestedSlots: { emergencyBuffer: ['10:30', '14:30'], followUps: ['15:00-17:00'], newPatients: ['09:00-10:00'] },
    provider: 'demo'
  });
});

router.post('/ai/summarize-notes', demoOnly, (req, res) => {
  res.json({
    soap: { subjective: 'Patient reports ' + (req.body.text || 'symptoms'), objective: 'Vitals WNL, no acute distress', assessment: 'Stable, improving', plan: 'Continue meds, f/u 1 week' },
    icd10Suggestions: [{ code: 'J06.9', description: 'Acute upper respiratory infection' }, { code: 'R50.9', description: 'Fever, unspecified' }],
    keyFindings: ['No red flags', 'Responding to treatment'],
    followUpSuggested: '7 days',
    provider: 'demo'
  });
});

router.get('/ai/status', demoOnly, (req, res) => {
  res.json({ provider: 'demo', available: true, features: ['chat', 'diagnosis', 'prescription', 'risk-scoring', 'schedule-optimization', 'notes-summarization'] });
});

// ==================== LAB TESTS ====================
router.get('/labtests', demoOnly, (req, res) => {
  res.json({ tests: [
    { _id: 'lt-1', name: 'Complete Blood Count', category: 'Hematology', patientId: DEMO_PATIENTS[0], status: 'reported', resultSummary: 'All values within normal range', createdAt: new Date('2025-05-20') },
    { _id: 'lt-2', name: 'Lipid Profile', category: 'Biochemistry', patientId: DEMO_PATIENTS[3], status: 'ordered', resultSummary: '', createdAt: new Date('2025-05-28') },
    { _id: 'lt-3', name: 'HbA1c', category: 'Biochemistry', patientId: DEMO_PATIENTS[3], status: 'sample-collected', resultSummary: '', createdAt: new Date('2025-05-29') }
  ], total: 3 });
});

router.post('/labtests', demoOnly, (req, res) => {
  res.status(201).json({ _id: `lt-${Date.now()}`, ...req.body, status: 'ordered', createdAt: new Date() });
});

router.put('/labtests/:id', demoOnly, (req, res) => {
  res.json({ _id: req.params.id, ...req.body, updatedAt: new Date() });
});

router.delete('/labtests/:id', demoOnly, (req, res) => {
  res.json({ message: 'Lab test deleted' });
});

// ==================== EXPENSES ====================
router.get('/expenses', demoOnly, (req, res) => {
  res.json({ expenses: [
    { _id: 'exp-1', category: 'rent', description: 'Monthly clinic rent', amount: 25000, date: new Date('2025-05-01'), vendor: 'Landlord', paymentMethod: 'online', isRecurring: true, recurringFrequency: 'monthly' },
    { _id: 'exp-2', category: 'salary', description: 'Receptionist salary', amount: 18000, date: new Date('2025-05-01'), vendor: 'Staff', paymentMethod: 'online', isRecurring: true, recurringFrequency: 'monthly' },
    { _id: 'exp-3', category: 'supplies', description: 'Gloves and masks', amount: 2500, date: new Date('2025-05-15'), vendor: 'MedSupply Co', paymentMethod: 'upi', isRecurring: false },
    { _id: 'exp-4', category: 'utilities', description: 'Electricity bill', amount: 4500, date: new Date('2025-05-10'), vendor: 'MSEB', paymentMethod: 'online', isRecurring: true, recurringFrequency: 'monthly' }
  ], total: 4 });
});

router.get('/expenses/summary', demoOnly, (req, res) => {
  res.json({
    thisMonth: 50000,
    thisMonthCount: 4,
    thisYear: 280000,
    byCategory: [
      { _id: 'rent', total: 150000, count: 6 },
      { _id: 'salary', total: 108000, count: 6 },
      { _id: 'supplies', total: 12000, count: 5 },
      { _id: 'utilities', total: 10000, count: 3 }
    ],
    monthlyTrend: [
      { _id: '2025-01', total: 45000, count: 4 },
      { _id: '2025-02', total: 48000, count: 5 },
      { _id: '2025-03', total: 43000, count: 3 },
      { _id: '2025-04', total: 50000, count: 4 },
      { _id: '2025-05', total: 50000, count: 4 }
    ]
  });
});

router.post('/expenses', demoOnly, (req, res) => {
  res.status(201).json({ _id: `exp-${Date.now()}`, ...req.body, createdAt: new Date() });
});

router.put('/expenses/:id', demoOnly, (req, res) => {
  res.json({ _id: req.params.id, ...req.body });
});

router.delete('/expenses/:id', demoOnly, (req, res) => {
  res.json({ message: 'Expense deleted' });
});

// ==================== WHATSAPP ====================
router.post('/whatsapp/send', demoOnly, (req, res) => {
  res.json({ message: 'Message sent (demo mode)', sent: true });
});

router.post('/whatsapp/remind', demoOnly, (req, res) => {
  res.json({ message: 'Reminder sent (demo mode)', sent: true });
});

router.post('/whatsapp/prescription', demoOnly, (req, res) => {
  res.json({ message: 'Prescription shared (demo mode)', sent: true });
});

router.post('/whatsapp/run-reminders', demoOnly, (req, res) => {
  res.json({ processed: 5, sent: 3, failed: 0 });
});

// ==================== UPLOADS ====================
router.post('/uploads', demoOnly, (req, res) => {
  res.json({ url: '/uploads/demo-file.pdf', filename: 'demo-file.pdf', size: 12345, mimetype: 'application/pdf' });
});

// ==================== PATIENT PORTAL (PUBLIC) ====================
router.get('/portal/doctor/:id', demoOnly, (req, res) => {
  res.json({ _id: 'demo-doctor-001', name: 'Demo Doctor', specialty: 'general', qualification: 'MBBS, MD', clinicName: 'DocClinic Demo Centre', clinicAddress: '123 Health Street', clinicCity: 'Mumbai', consultationFee: 500, workingHours: { start: '09:00', end: '18:00' } });
});

router.get('/portal/doctors', demoOnly, (req, res) => {
  res.json([
    { _id: 'demo-doctor-001', name: 'Demo Doctor', specialty: 'general', qualification: 'MBBS, MD', clinicName: 'DocClinic Demo Centre', clinicCity: 'Mumbai', consultationFee: 500 }
  ]);
});

router.get('/portal/doctor/:id/slots', demoOnly, (req, res) => {
  res.json({ slots: ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM'], bookedCount: 5, fee: 500 });
});

router.post('/portal/book', demoOnly, (req, res) => {
  res.status(201).json({
    message: 'Appointment booked successfully!',
    appointment: { id: `apt-${Date.now()}`, tokenNumber: Math.floor(Math.random() * 10) + 1, date: req.body.date, timeSlot: req.body.timeSlot, status: 'scheduled' },
    patient: { id: `pat-${Date.now()}`, patientId: `PAT-${String(DEMO_PATIENTS.length + 1).padStart(4, '0')}`, name: req.body.patientName }
  });
});

router.post('/portal/symptom-check', demoOnly, (req, res) => {
  const symptoms = (req.body.symptoms || '').toLowerCase();
  let urgency = 'routine';
  if (symptoms.includes('chest pain') || symptoms.includes('breathing') || symptoms.includes('unconscious')) urgency = 'emergency';
  else if (symptoms.includes('high fever') || symptoms.includes('severe') || symptoms.includes('blood')) urgency = 'urgent';

  res.json({
    urgency,
    urgencyExplanation: urgency === 'emergency' ? 'Symptoms suggest a potentially life-threatening condition.' : urgency === 'urgent' ? 'Symptoms need attention within 24 hours.' : 'Symptoms can be addressed at your convenience.',
    possibleConditions: ['Viral Upper Respiratory Infection', 'Common Cold', 'Mild Allergic Reaction'],
    immediateAdvice: urgency === 'emergency' ? 'Call 108 immediately or visit nearest ER.' : 'Rest, stay hydrated, and monitor symptoms.',
    shouldVisitDoctor: true,
    suggestedSpecialty: 'general',
    redFlags: urgency !== 'routine' ? ['If symptoms worsen', 'Difficulty breathing', 'Persistent high fever'] : [],
    homeRemedies: ['Rest adequately', 'Drink warm fluids', 'Take paracetamol if fever > 100°F'],
    disclaimer: 'This is AI triage only. Always consult a qualified doctor.',
    provider: 'demo'
  });
});

router.get('/portal/my-appointments', demoOnly, (req, res) => {
  res.json({ appointments: [] });
});

router.get('/portal/my-records', demoOnly, (req, res) => {
  const phone = req.query.phone;
  const patient = DEMO_PATIENTS.find(p => p.phone === phone);
  if (!patient) return res.status(404).json({ message: 'No records found for this phone number.' });
  res.json({
    patient: { name: patient.name, patientId: patient.patientId, age: patient.age, gender: patient.gender, phone: patient.phone },
    appointments: DEMO_APPOINTMENTS.filter(a => a.patientId?._id === patient._id || a.patientId === patient._id),
    prescriptions: DEMO_PRESCRIPTIONS.filter(rx => rx.patientId?._id === patient._id || rx.patientId === patient._id),
    labTests: [{ _id: 'lt-demo', name: 'Complete Blood Count', category: 'Hematology', status: 'reported', resultSummary: 'Normal values', createdAt: new Date() }],
    bills: DEMO_BILLS.filter(b => b.patientId?._id === patient._id || b.patientId === patient._id)
  });
});

router.post('/portal/review', demoOnly, (req, res) => {
  res.json({ message: 'Review submitted successfully. Thank you!' });
});

router.get('/portal/health-tips', demoOnly, (req, res) => {
  res.json({
    tips: [
      { title: 'Stay Hydrated', content: 'Drink 8-10 glasses of water daily. Start your morning with a glass of warm water to kick-start digestion.', category: 'nutrition' },
      { title: 'Walk 30 Minutes', content: 'A daily 30-minute brisk walk reduces heart disease risk by 30% and boosts mood naturally.', category: 'exercise' },
      { title: 'Fix Your Sleep', content: 'Go to bed and wake up at the same time daily. 7-8 hours of sleep improves immunity and mental clarity.', category: 'sleep' },
      { title: 'Deep Breathing', content: 'Practice 5 minutes of box breathing daily: inhale 4 counts, hold 4, exhale 4. Reduces stress hormones immediately.', category: 'mental' },
      { title: 'Eat More Fiber', content: 'Add one extra serving of vegetables to each meal. Fiber improves digestion and helps maintain healthy blood sugar.', category: 'nutrition' }
    ],
    dailyFact: 'Your heart beats approximately 100,000 times per day, pumping about 2,000 gallons of blood through 60,000 miles of blood vessels.',
    reminder: 'Have you taken your medications today? Set a daily alarm to never miss a dose.',
    provider: 'demo'
  });
});

router.get('/portal/medication-reminders', demoOnly, (req, res) => {
  const phone = req.query.phone;
  const patient = DEMO_PATIENTS.find(p => p.phone === phone);
  if (!patient) return res.status(404).json({ message: 'No records found' });
  res.json({
    patient: { name: patient.name, patientId: patient.patientId },
    medications: [
      { name: 'Amlodipine', dosage: '5mg', frequency: '1-0-0', duration: '30 days', timing: 'after-food', diagnosis: 'Hypertension', prescribedDate: new Date('2025-05-20'), prescriptionNo: 'RX-00001' },
      { name: 'Atorvastatin', dosage: '10mg', frequency: '0-0-1', duration: '30 days', timing: 'bedtime', diagnosis: 'Hypertension', prescribedDate: new Date('2025-05-20'), prescriptionNo: 'RX-00001' },
      { name: 'Metformin', dosage: '500mg', frequency: '1-0-1', duration: '30 days', timing: 'after-food', diagnosis: 'Diabetes', prescribedDate: new Date('2025-05-27'), prescriptionNo: 'RX-00003' }
    ],
    totalActive: 3
  });
});

router.get('/portal/track/:id', demoOnly, (req, res) => {
  const apt = DEMO_APPOINTMENTS[3];
  res.json({
    appointment: { id: apt._id, tokenNumber: apt.tokenNumber, date: apt.date, timeSlot: apt.timeSlot, status: apt.status, type: apt.type },
    doctor: { _id: 'demo-doctor-001', name: 'Demo Doctor', specialty: 'general', clinicName: 'DocClinic Demo Centre', workingHours: { start: '09:00', end: '18:00' } },
    patient: { name: apt.patientId?.name || 'Patient', phone: '9876543213' },
    queue: { totalToday: 5, completed: 2, currentToken: 3, myToken: apt.tokenNumber, myPosition: 4, patientsAhead: 1, estimatedWaitMinutes: 15 }
  });
});

module.exports = router;
