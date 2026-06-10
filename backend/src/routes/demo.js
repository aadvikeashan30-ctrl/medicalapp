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

const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'demo_users.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let DEMO_USERS = {};

const DEFAULT_DEMO_USER = {
  _id: 'demo-doctor-001',
  id: 'demo-doctor-001',
  name: 'Demo Doctor',
  email: 'demo@docclinic.com',
  password: 'demo1234',
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

const DEFAULT_RECEPTIONIST_USER = {
  _id: 'demo-receptionist-001',
  id: 'demo-receptionist-001',
  name: 'Receptionist Mary',
  email: 'receptionist@docclinic.com',
  password: 'receptionist1234',
  phone: '9111111111',
  role: 'receptionist',
  specialty: 'general',
  clinicName: 'DocClinic Demo Centre',
  clinicAddress: '123 Health Street',
  clinicCity: 'Mumbai',
  plan: 'pro',
  workingHours: { start: '09:00', end: '18:00' },
  isActive: true
};

const DEFAULT_NURSE_USER = {
  _id: 'demo-nurse-001',
  id: 'demo-nurse-001',
  name: 'Nurse Nancy',
  email: 'nurse@docclinic.com',
  password: 'nurse1234',
  phone: '9222222222',
  role: 'nurse',
  specialty: 'general',
  clinicName: 'DocClinic Demo Centre',
  clinicAddress: '123 Health Street',
  clinicCity: 'Mumbai',
  plan: 'pro',
  workingHours: { start: '09:00', end: '18:00' },
  isActive: true
};

if (fs.existsSync(USERS_FILE)) {
  try {
    DEMO_USERS = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    let changed = false;
    if (!DEMO_USERS['demo-doctor-001']) { DEMO_USERS['demo-doctor-001'] = DEFAULT_DEMO_USER; changed = true; }
    if (!DEMO_USERS['demo-receptionist-001']) { DEMO_USERS['demo-receptionist-001'] = DEFAULT_RECEPTIONIST_USER; changed = true; }
    if (!DEMO_USERS['demo-nurse-001']) { DEMO_USERS['demo-nurse-001'] = DEFAULT_NURSE_USER; changed = true; }
    if (changed) {
      saveDemoUsers();
    }
  } catch (e) {
    DEMO_USERS = {
      'demo-doctor-001': DEFAULT_DEMO_USER,
      'demo-receptionist-001': DEFAULT_RECEPTIONIST_USER,
      'demo-nurse-001': DEFAULT_NURSE_USER
    };
    saveDemoUsers();
  }
} else {
  DEMO_USERS = {
    'demo-doctor-001': DEFAULT_DEMO_USER,
    'demo-receptionist-001': DEFAULT_RECEPTIONIST_USER,
    'demo-nurse-001': DEFAULT_NURSE_USER
  };
  saveDemoUsers();
}

function saveDemoUsers() {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(DEMO_USERS, null, 2), 'utf8');
  } catch (e) {
    // Ignore write errors
  }
}

const DEMO_USER = DEMO_USERS['demo-doctor-001'];

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

// Helper to decode token and retrieve specific demo doctor
function getDemoUser(req) {
  try {
    const header = req.header('Authorization') || '';
    const token = header.replace(/^Bearer\s+/i, '').trim();
    if (token) {
      const secret = process.env.JWT_SECRET || 'demo-fallback-secret-key-32chars!!';
      const decoded = jwt.verify(token, secret);
      if (decoded.userId && DEMO_USERS[decoded.userId]) {
        return DEMO_USERS[decoded.userId];
      }
    }
  } catch (e) { /* ignore */ }
  return null;
}

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
        if (decoded.userId === 'demo-doctor-001' || decoded.userId?.startsWith('doc-')) {
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
  const matchedUser = Object.values(DEMO_USERS).find(
    (u) => u.email === email && u.password === password
  );

  if (matchedUser) {
    const token = jwt.sign({ userId: matchedUser._id }, process.env.JWT_SECRET || 'demo-fallback-secret-key-32chars!!', { expiresIn: '30d' });
    return res.json({ token, user: matchedUser });
  }
  // Not demo credentials — pass to real auth route
  next('route');
});

router.post('/auth/register', demoOnly, (req, res) => {
  const { name, email, password, phone, specialty, clinicName, clinicCity, qualification } = req.body;
  const existingUser = Object.values(DEMO_USERS).find((u) => u.email === email);
  if (existingUser) {
    return res.status(409).json({ message: 'Email already registered' });
  }

  const newUserId = `doc-${Date.now()}`;
  const newUser = {
    _id: newUserId,
    id: newUserId,
    name: name || 'Doctor Name',
    email,
    password,
    phone: phone || '',
    role: 'doctor',
    specialty: specialty || 'general',
    qualification: qualification || 'MBBS, MD',
    registrationNo: req.body.registrationNo || `REG-${Date.now()}`,
    clinicName: clinicName || '',
    clinicAddress: req.body.clinicAddress || '',
    clinicCity: clinicCity || '',
    consultationFee: req.body.consultationFee || 500,
    plan: 'free',
    workingHours: { start: '09:00', end: '18:00' },
    isActive: true
  };

  DEMO_USERS[newUserId] = newUser;
  saveDemoUsers();

  const token = jwt.sign({ userId: newUserId }, process.env.JWT_SECRET || 'demo-fallback-secret-key-32chars!!', { expiresIn: '30d' });
  return res.status(201).json({ token, user: newUser });
});

router.get('/auth/profile', demoOnly, (req, res) => {
  const user = getDemoUser(req);
  if (!user) return res.status(401).json({ message: 'Session expired, please log in again.' });
  res.json(user);
});

router.put('/auth/profile', demoOnly, (req, res) => {
  const user = getDemoUser(req);
  if (!user) return res.status(401).json({ message: 'Session expired, please log in again.' });
  Object.assign(user, req.body);
  saveDemoUsers();
  res.json(user);
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

// ==================== DOCTOR PRACTICE ANALYTICS ====================
router.get('/dashboard/practice', demoOnly, (req, res) => {
  res.json({
    periodDays: 90,
    totals: { appointments: 142, prescriptions: 118 },
    appointmentMetrics: {
      completed: 112, noShow: 11, cancelled: 8,
      completionRate: 79, noShowRate: 8, cancellationRate: 6
    },
    appointmentTypes: [
      { type: 'consultation', count: 78 },
      { type: 'follow-up', count: 41 },
      { type: 'checkup', count: 15 },
      { type: 'procedure', count: 8 }
    ],
    peakHours: [
      { slot: '10:00 AM', count: 22 },
      { slot: '10:30 AM', count: 19 },
      { slot: '11:00 AM', count: 17 },
      { slot: '09:30 AM', count: 14 },
      { slot: '12:00 PM', count: 11 },
      { slot: '05:00 PM', count: 9 }
    ],
    topDiagnoses: [
      { diagnosis: 'hypertension', count: 24 },
      { diagnosis: 'type 2 diabetes', count: 19 },
      { diagnosis: 'viral fever', count: 16 },
      { diagnosis: 'upper respiratory infection', count: 12 },
      { diagnosis: 'gastritis', count: 9 }
    ],
    topMedicines: [
      { medicine: 'paracetamol', count: 41 },
      { medicine: 'amlodipine', count: 27 },
      { medicine: 'metformin', count: 22 },
      { medicine: 'atorvastatin', count: 18 },
      { medicine: 'pantoprazole', count: 14 }
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
  const queue = DEMO_APPOINTMENTS.filter((a) => ['scheduled', 'confirmed', 'in-progress', 'REGISTERED', 'PAYMENT_PENDING', 'PAYMENT_COMPLETED', 'VITALS_PENDING', 'VITALS_COMPLETED', 'WAITING_FOR_DOCTOR', 'IN_CONSULTATION', 'CONSULTATION_COMPLETED', 'CHECKOUT_COMPLETED'].includes(a.status));
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
    status: req.body.status || 'scheduled',
    tokenNumber: DEMO_APPOINTMENTS.length + 1,
    symptoms: req.body.symptoms || '',
    doctorId: req.body.doctorId || 'demo-doctor-001',
    registrationFee: req.body.registrationFee || 0,
    consultationFee: req.body.consultationFee || 0,
    vitals: req.body.vitals || {},
    chiefComplaint: req.body.chiefComplaint || '',
    diagnosis: req.body.diagnosis || '',
    prescriptionDetails: req.body.prescriptionDetails || '',
    labOrders: req.body.labOrders || [],
    followUpDate: req.body.followUpDate
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

// ==================== MEDICAL CERTIFICATES ====================
const DEMO_CERTIFICATES = [
  {
    _id: 'cert-1', certificateNo: 'CERT-00001', type: 'sick-leave', patientId: DEMO_PATIENTS[0],
    diagnosis: 'Acute viral fever', restFromDate: new Date('2025-05-20'), restToDate: new Date('2025-05-22'),
    restDays: 3, remarks: 'Advised bed rest and adequate hydration.', issuedTo: 'Employer',
    status: 'active', issuedDate: new Date('2025-05-20'), createdAt: new Date('2025-05-20')
  },
  {
    _id: 'cert-2', certificateNo: 'CERT-00002', type: 'fitness', patientId: DEMO_PATIENTS[2],
    diagnosis: 'Routine medical examination', fitToResumeDate: new Date('2025-05-26'),
    remarks: 'Found medically fit for duty.', issuedTo: 'HR Department',
    status: 'active', issuedDate: new Date('2025-05-25'), createdAt: new Date('2025-05-25')
  }
];

router.get('/certificates', demoOnly, (req, res) => {
  let list = [...DEMO_CERTIFICATES];
  if (req.query.patientId) list = list.filter((c) => (c.patientId?._id || c.patientId) === req.query.patientId);
  if (req.query.type) list = list.filter((c) => c.type === req.query.type);
  if (req.query.status) list = list.filter((c) => c.status === req.query.status);
  res.json({ certificates: list, total: list.length, pages: 1, page: 1 });
});

router.get('/certificates/stats/summary', demoOnly, (req, res) => {
  res.json({
    total: DEMO_CERTIFICATES.length,
    active: DEMO_CERTIFICATES.filter((c) => c.status === 'active').length,
    sickLeave: DEMO_CERTIFICATES.filter((c) => c.type === 'sick-leave').length,
    fitness: DEMO_CERTIFICATES.filter((c) => ['fitness', 'fitness-to-work'].includes(c.type)).length
  });
});

router.get('/certificates/:id', demoOnly, (req, res) => {
  const c = DEMO_CERTIFICATES.find((x) => x._id === req.params.id);
  if (!c) return res.status(404).json({ message: 'Certificate not found' });
  res.json(c);
});

router.post('/certificates', demoOnly, (req, res) => {
  const patient = DEMO_PATIENTS.find((p) => p._id === req.body.patientId);
  let restDays = req.body.restDays;
  if (!restDays && req.body.restFromDate && req.body.restToDate) {
    const ms = new Date(req.body.restToDate) - new Date(req.body.restFromDate);
    if (ms >= 0) restDays = Math.floor(ms / (1000 * 60 * 60 * 24)) + 1;
  }
  const cert = {
    _id: `cert-${Date.now()}`,
    certificateNo: `CERT-${String(DEMO_CERTIFICATES.length + 1).padStart(5, '0')}`,
    patientId: patient || DEMO_PATIENTS[0],
    type: req.body.type || 'sick-leave',
    diagnosis: req.body.diagnosis || '',
    restFromDate: req.body.restFromDate,
    restToDate: req.body.restToDate,
    restDays,
    fitToResumeDate: req.body.fitToResumeDate,
    remarks: req.body.remarks || '',
    issuedTo: req.body.issuedTo || '',
    status: 'active',
    issuedDate: req.body.issuedDate || new Date(),
    createdAt: new Date()
  };
  DEMO_CERTIFICATES.unshift(cert);
  res.status(201).json(cert);
});

router.put('/certificates/:id', demoOnly, (req, res) => {
  const cert = DEMO_CERTIFICATES.find((x) => x._id === req.params.id);
  if (!cert) return res.status(404).json({ message: 'Certificate not found' });
  const updates = { ...req.body };
  delete updates.certificateNo;
  Object.assign(cert, updates);
  res.json(cert);
});

router.delete('/certificates/:id', demoOnly, (req, res) => {
  const idx = DEMO_CERTIFICATES.findIndex((x) => x._id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Certificate not found' });
  DEMO_CERTIFICATES.splice(idx, 1);
  res.json({ message: 'Certificate deleted' });
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

// ==================== DOCTOR AVAILABILITY / LEAVE ====================
const DEMO_AVAILABILITY = [
  { _id: 'av-1', type: 'full-day', startDate: new Date(Date.now() + 3 * 86400000).toISOString(), endDate: new Date(Date.now() + 4 * 86400000).toISOString(), reason: 'conference', note: 'Annual Cardiology Summit' },
  { _id: 'av-2', type: 'slot', startDate: new Date(Date.now() + 86400000).toISOString(), endDate: new Date(Date.now() + 86400000).toISOString(), startTime: '13:00', endTime: '14:00', reason: 'break', note: 'Lunch break' }
];

router.get('/availability', demoOnly, (req, res) => {
  res.json({ blocks: DEMO_AVAILABILITY, total: DEMO_AVAILABILITY.length });
});

router.get('/availability/check', demoOnly, (req, res) => {
  res.json({ blocked: false, block: null });
});

router.post('/availability', demoOnly, (req, res) => {
  const type = req.body.type || 'full-day';
  const startDate = new Date(req.body.startDate);
  const endDate = type === 'slot' ? new Date(req.body.startDate) : new Date(req.body.endDate || req.body.startDate);
  const block = {
    _id: `av-${Date.now()}`,
    type,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    reason: req.body.reason || 'leave',
    note: req.body.note
  };
  DEMO_AVAILABILITY.unshift(block);
  res.status(201).json({ block, affectedAppointments: 0 });
});

router.put('/availability/:id', demoOnly, (req, res) => {
  const block = DEMO_AVAILABILITY.find((b) => b._id === req.params.id);
  if (!block) return res.status(404).json({ message: 'Block not found' });
  Object.assign(block, req.body);
  res.json(block);
});

router.delete('/availability/:id', demoOnly, (req, res) => {
  const idx = DEMO_AVAILABILITY.findIndex((b) => b._id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Block not found' });
  DEMO_AVAILABILITY.splice(idx, 1);
  res.json({ message: 'Availability block removed' });
});

// ==================== DOCTOR AI (risk / schedule / notes) ====================
router.post('/doctor/patient-risk', demoOnly, (req, res) => {
  const patient = DEMO_PATIENTS.find((p) => p._id === req.body.patientId) || DEMO_PATIENTS[0];
  res.json({
    patient: { _id: patient._id, name: patient.name, patientId: patient.patientId },
    historicalNoShows: 1,
    totalAppointments: patient.totalVisits || 4,
    riskScore: patient.age > 50 ? 7 : 5,
    riskLevel: patient.age > 50 ? 'high' : 'moderate',
    factors: [
      patient.age > 45 ? 'Age above 45' : 'Generally healthy age group',
      (patient.allergies || []).length ? `Known allergy: ${patient.allergies.join(', ')}` : 'No known allergies',
      'Occasional missed follow-ups'
    ],
    recommendations: ['Schedule periodic reviews', 'Monitor vitals at each visit', 'Send SMS reminders before appointments'],
    predictedNoShowProbability: 15,
    suggestedFollowUp: '2 weeks',
    disclaimer: 'AI risk assessment is for reference only. Clinical judgment should always take precedence.'
  });
});

router.post('/doctor/optimize-schedule', demoOnly, (req, res) => {
  res.json({
    date: req.body.date || new Date().toISOString(),
    appointmentCount: DEMO_APPOINTMENTS.length,
    insights: { predictedLoad: 20, peakHours: ['10:00-12:00'], suggestedBreaks: ['13:00-14:00'], noShowRisk: ['Token #4'] },
    optimizations: ['Move follow-ups to the afternoon (3-5 PM)', 'Keep 2 emergency buffer slots at 10:30 & 2:30', 'Group similar procedures together to reduce setup time'],
    suggestedSlots: { emergencyBuffer: ['10:30 AM', '02:30 PM'], followUps: ['03:00 PM', '04:00 PM'], newPatients: ['09:00 AM', '09:30 AM'] }
  });
});

router.post('/doctor/summarize-notes', demoOnly, (req, res) => {
  res.json({
    soap: {
      subjective: 'Patient reports ' + (req.body.text ? req.body.text.slice(0, 120) : 'presenting symptoms'),
      objective: 'Vitals within normal limits, no acute distress noted',
      assessment: 'Condition stable and improving',
      plan: 'Continue current medications, follow up in 1 week, return earlier if symptoms worsen'
    },
    icd10Suggestions: [
      { code: 'J06.9', description: 'Acute upper respiratory infection, unspecified' },
      { code: 'R50.9', description: 'Fever, unspecified' }
    ],
    keyFindings: ['No red flag symptoms', 'Responding to current treatment'],
    followUpSuggested: '7 days'
  });
});

// ==================== AMBIENT AI SCRIBE / TRIAGE / RX-GUARD ====================
router.post('/doctor/scribe', demoOnly, (req, res) => {
  const t = (req.body.transcript || '').slice(0, 140);
  res.json({
    patientId: req.body.patientId || null,
    soap: {
      subjective: t || 'Patient reports cough and mild fever for 3 days, no breathing difficulty.',
      objective: 'Temp 100.8F, throat mildly congested, chest clear, SpO2 98%.',
      assessment: 'Acute viral upper respiratory infection.',
      plan: 'Symptomatic treatment, hydration, review in 5 days if not improving.'
    },
    icd10Suggestions: [{ code: 'J06.9', description: 'Acute upper respiratory infection, unspecified' }],
    keyFindings: ['No red flags', 'Vitals stable'],
    followUpSuggested: '5 days',
    draftPrescription: {
      diagnosis: 'Acute viral URI',
      symptoms: ['cough', 'fever'],
      medicines: [
        { name: 'Paracetamol', dosage: '500mg', frequency: '1-0-1', duration: '3 days', timing: 'after-food', notes: 'For fever' },
        { name: 'Cetirizine', dosage: '10mg', frequency: '0-0-1', duration: '5 days', timing: 'bedtime', notes: 'For congestion' }
      ],
      tests: [],
      advice: 'Rest, warm fluids, steam inhalation.',
      vitals: { temperature: 100.8, spo2: 98 }
    },
    disclaimer: 'AI-generated draft from the consultation transcript. Review and edit before signing off.'
  });
});

router.get('/doctor/triage/:appointmentId', demoOnly, (req, res) => {
  const appt = DEMO_APPOINTMENTS.find((a) => a._id === req.params.appointmentId) || DEMO_APPOINTMENTS[3];
  const patient = appt.patientId || DEMO_PATIENTS[3];
  res.json({
    appointmentId: appt._id,
    patient: { _id: patient._id, name: patient.name, age: patient.age, gender: patient.gender },
    tokenNumber: appt.tokenNumber,
    timeSlot: appt.timeSlot,
    primaryConcern: appt.symptoms || 'Routine review',
    bullets: [
      `${patient.age}y ${patient.gender} presenting with ${appt.symptoms || 'follow-up review'}`,
      (patient.allergies || []).length ? `Known allergy: ${patient.allergies.join(', ')}` : 'No known drug allergies',
      'Confirm current medications and recent vitals'
    ],
    suggestedFocus: 'Clarify duration and severity of the chief complaint',
    redFlags: [],
    urgency: 'routine'
  });
});

router.post('/doctor/rx-guard', demoOnly, (req, res) => {
  const names = (req.body.medicines || []).map((m) => (typeof m === 'string' ? m : m.name)).filter(Boolean);
  const weight = Number(req.body.weightKg) || null;
  const age = req.body.ageYears != null ? Number(req.body.ageYears) : null;
  const isPediatric = (age != null && age <= 12) || (weight && weight <= 40);
  const table = { paracetamol: 15, ibuprofen: 10, amoxicillin: 40 };
  const dosing = (isPediatric && weight)
    ? names.map((n) => {
        const k = n.toLowerCase();
        const mgkg = table[k];
        if (!mgkg) return { found: false, drug: n, message: 'No reference dosing on file.' };
        return { found: true, drug: k, weightKg: weight, perDoseMg: Math.round(mgkg * weight * 10) / 10, dosesPerDay: 3, frequency: '3 times/day', route: 'oral', note: 'Weight-based estimate.' };
      })
    : [];
  res.json({
    medicines: names,
    patientContext: { ageYears: age, weightKg: weight, allergies: [], isPediatric: !!isPediatric },
    interactions: names.length >= 2 ? [{ drug1: names[0], drug2: names[1], severity: 'minor', description: 'No significant interaction expected. Monitor as usual.' }] : [],
    allergyAlerts: [],
    dosing,
    hasCriticalAlerts: false,
    disclaimer: 'Automated safety check for reference only. Clinical judgment is required before prescribing.'
  });
});

// ==================== WAITLIST ====================
const DEMO_WAITLIST = [
  { _id: 'wl-1', patientName: 'Kavita Nair', patientPhone: '9876500011', service: 'MRI', priority: 'high', status: 'waiting', preferredDate: new Date(Date.now() + 2 * 86400000).toISOString(), note: 'Knee MRI — flexible timing', createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { _id: 'wl-2', patientName: 'Rahul Verma', patientPhone: '9876500022', service: 'consultation', priority: 'normal', status: 'waiting', note: 'Prefers mornings', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { _id: 'wl-3', patientName: 'Meena Iyer', patientPhone: '9876500033', service: 'CT scan', priority: 'high', status: 'notified', notifiedAt: new Date().toISOString(), notifyCount: 1, createdAt: new Date(Date.now() - 3 * 86400000).toISOString() }
];

router.get('/waitlist', demoOnly, (req, res) => {
  let list = [...DEMO_WAITLIST];
  if (req.query.status) list = list.filter((w) => w.status === req.query.status);
  if (req.query.service) list = list.filter((w) => w.service === req.query.service);
  res.json({ entries: list, total: list.length });
});

router.get('/waitlist/stats/summary', demoOnly, (req, res) => {
  res.json({
    waiting: DEMO_WAITLIST.filter((w) => w.status === 'waiting').length,
    notified: DEMO_WAITLIST.filter((w) => w.status === 'notified').length,
    booked: DEMO_WAITLIST.filter((w) => w.status === 'booked').length,
    high: DEMO_WAITLIST.filter((w) => w.status === 'waiting' && w.priority === 'high').length
  });
});

router.post('/waitlist', demoOnly, (req, res) => {
  const entry = { _id: `wl-${Date.now()}`, status: 'waiting', notifyCount: 0, createdAt: new Date().toISOString(), ...req.body };
  DEMO_WAITLIST.unshift(entry);
  res.status(201).json(entry);
});

router.post('/waitlist/:id/notify', demoOnly, (req, res) => {
  const entry = DEMO_WAITLIST.find((w) => w._id === req.params.id);
  if (!entry) return res.status(404).json({ message: 'Waitlist entry not found' });
  entry.status = 'notified';
  entry.notifiedAt = new Date().toISOString();
  entry.notifyCount = (entry.notifyCount || 0) + 1;
  res.json({ message: 'Patient notified', delivery: { success: true, stubbed: true }, entry });
});

router.post('/waitlist/fill', demoOnly, (req, res) => {
  const waiting = DEMO_WAITLIST.filter((w) => w.status === 'waiting').slice(0, req.body.limit || 5);
  waiting.forEach((e) => { e.status = 'notified'; e.notifiedAt = new Date().toISOString(); e.notifyCount = (e.notifyCount || 0) + 1; });
  res.json({ notified: waiting.length, message: `Notified ${waiting.length} waitlisted patient(s)`, entries: waiting });
});

router.put('/waitlist/:id', demoOnly, (req, res) => {
  const entry = DEMO_WAITLIST.find((w) => w._id === req.params.id);
  if (!entry) return res.status(404).json({ message: 'Waitlist entry not found' });
  Object.assign(entry, req.body);
  res.json(entry);
});

router.delete('/waitlist/:id', demoOnly, (req, res) => {
  const idx = DEMO_WAITLIST.findIndex((w) => w._id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Waitlist entry not found' });
  DEMO_WAITLIST.splice(idx, 1);
  res.json({ message: 'Removed from waitlist' });
});

// ==================== CARE PATHWAYS ====================
const todayISO = () => new Date().toISOString().slice(0, 10);
const DEMO_PATHWAYS = [
  {
    _id: 'cp-1', patientId: DEMO_PATIENTS[3], patientName: 'Sunita Reddy', patientPhone: '9876543213',
    title: 'Diabetes Management Plan', diagnosis: 'Type 2 Diabetes', status: 'active',
    startDate: new Date(Date.now() - 5 * 86400000).toISOString(),
    tasks: [
      { _id: 'tk-1', label: 'Take Metformin 500mg', category: 'medication', time: '08:00 AM', frequency: 'daily', instructions: 'After breakfast' },
      { _id: 'tk-2', label: 'Take Metformin 500mg', category: 'medication', time: '08:00 PM', frequency: 'daily', instructions: 'After dinner' },
      { _id: 'tk-3', label: 'Log fasting blood sugar', category: 'measurement', time: 'Morning', frequency: 'daily' },
      { _id: 'tk-4', label: '30 min brisk walk', category: 'exercise', time: 'Evening', frequency: 'daily' }
    ],
    completions: [{ taskId: 'tk-1', date: todayISO() }, { taskId: 'tk-3', date: todayISO() }]
  },
  {
    _id: 'cp-2', patientId: DEMO_PATIENTS[0], patientName: 'Ramesh Kumar', patientPhone: '9876543210',
    title: 'Post-Hypertension Care', diagnosis: 'Hypertension', status: 'active',
    startDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    tasks: [
      { _id: 'tk-5', label: 'Take Amlodipine 5mg', category: 'medication', time: '09:00 AM', frequency: 'daily' },
      { _id: 'tk-6', label: 'Record BP reading', category: 'measurement', time: 'Morning', frequency: 'daily' },
      { _id: 'tk-7', label: 'Low-salt diet', category: 'diet', frequency: 'daily' }
    ],
    completions: []
  }
];

router.get('/care-pathways', demoOnly, (req, res) => {
  let list = [...DEMO_PATHWAYS];
  if (req.query.patientId) list = list.filter((p) => (p.patientId?._id || p.patientId) === req.query.patientId);
  if (req.query.status) list = list.filter((p) => p.status === req.query.status);
  res.json({ pathways: list, total: list.length });
});

router.get('/care-pathways/stats/summary', demoOnly, (req, res) => {
  res.json({
    active: DEMO_PATHWAYS.filter((p) => p.status === 'active').length,
    completed: DEMO_PATHWAYS.filter((p) => p.status === 'completed').length,
    total: DEMO_PATHWAYS.length
  });
});

router.get('/care-pathways/:id', demoOnly, (req, res) => {
  const p = DEMO_PATHWAYS.find((x) => x._id === req.params.id);
  if (!p) return res.status(404).json({ message: 'Care pathway not found' });
  res.json(p);
});

router.post('/care-pathways', demoOnly, (req, res) => {
  const patient = DEMO_PATIENTS.find((p) => p._id === req.body.patientId) || DEMO_PATIENTS[0];
  const pathway = {
    _id: `cp-${Date.now()}`, patientId: patient, patientName: patient.name, patientPhone: patient.phone,
    title: req.body.title, diagnosis: req.body.diagnosis || '', status: 'active',
    startDate: req.body.startDate || new Date().toISOString(),
    tasks: (req.body.tasks || []).map((t, i) => ({ _id: `tk-${Date.now()}-${i}`, ...t })),
    completions: []
  };
  DEMO_PATHWAYS.unshift(pathway);
  res.status(201).json(pathway);
});

router.put('/care-pathways/:id', demoOnly, (req, res) => {
  const p = DEMO_PATHWAYS.find((x) => x._id === req.params.id);
  if (!p) return res.status(404).json({ message: 'Care pathway not found' });
  Object.assign(p, req.body);
  res.json(p);
});

router.post('/care-pathways/:id/tasks', demoOnly, (req, res) => {
  const p = DEMO_PATHWAYS.find((x) => x._id === req.params.id);
  if (!p) return res.status(404).json({ message: 'Care pathway not found' });
  p.tasks.push({ _id: `tk-${Date.now()}`, ...req.body });
  res.json(p);
});

router.delete('/care-pathways/:id/tasks/:taskId', demoOnly, (req, res) => {
  const p = DEMO_PATHWAYS.find((x) => x._id === req.params.id);
  if (!p) return res.status(404).json({ message: 'Care pathway not found' });
  p.tasks = p.tasks.filter((t) => t._id !== req.params.taskId);
  p.completions = p.completions.filter((c) => c.taskId !== req.params.taskId);
  res.json(p);
});

router.post('/care-pathways/:id/toggle', demoOnly, (req, res) => {
  const p = DEMO_PATHWAYS.find((x) => x._id === req.params.id);
  if (!p) return res.status(404).json({ message: 'Care pathway not found' });
  const date = req.body.date || todayISO();
  const idx = p.completions.findIndex((c) => c.taskId === req.body.taskId && c.date === date);
  if (idx >= 0) p.completions.splice(idx, 1);
  else p.completions.push({ taskId: req.body.taskId, date });
  res.json(p);
});

router.delete('/care-pathways/:id', demoOnly, (req, res) => {
  const idx = DEMO_PATHWAYS.findIndex((x) => x._id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Care pathway not found' });
  DEMO_PATHWAYS.splice(idx, 1);
  res.json({ message: 'Care pathway deleted' });
});

// ==================== WOUND / SKIN PROGRESS TRACKER ====================
const DEMO_TRACKERS = [
  {
    _id: 'pt-1', patientId: DEMO_PATIENTS[0], patientName: 'Ramesh Kumar',
    bodyArea: 'Left forearm', condition: 'Post-op suture site', status: 'active',
    entries: [
      { _id: 'en-1', date: new Date(Date.now() - 10 * 86400000).toISOString(), photoUrl: '/uploads/demo-wound-1.jpg', note: 'Sutures intact, mild redness', assessment: 'stable' },
      { _id: 'en-2', date: new Date(Date.now() - 4 * 86400000).toISOString(), photoUrl: '/uploads/demo-wound-2.jpg', note: 'Redness reduced, healing well', assessment: 'improving' }
    ],
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString()
  }
];

router.get('/progress', demoOnly, (req, res) => {
  let list = [...DEMO_TRACKERS];
  if (req.query.patientId) list = list.filter((t) => (t.patientId?._id || t.patientId) === req.query.patientId);
  if (req.query.status) list = list.filter((t) => t.status === req.query.status);
  res.json({ trackers: list, total: list.length });
});

router.get('/progress/stats/summary', demoOnly, (req, res) => {
  res.json({
    active: DEMO_TRACKERS.filter((t) => t.status === 'active').length,
    healed: DEMO_TRACKERS.filter((t) => t.status === 'healed').length,
    total: DEMO_TRACKERS.length
  });
});

router.get('/progress/:id', demoOnly, (req, res) => {
  const t = DEMO_TRACKERS.find((x) => x._id === req.params.id);
  if (!t) return res.status(404).json({ message: 'Tracker not found' });
  res.json(t);
});

router.post('/progress', demoOnly, (req, res) => {
  const patient = DEMO_PATIENTS.find((p) => p._id === req.body.patientId) || DEMO_PATIENTS[0];
  const tracker = {
    _id: `pt-${Date.now()}`, patientId: patient, patientName: patient.name,
    bodyArea: req.body.bodyArea, condition: req.body.condition || '', status: 'active',
    entries: req.body.photoUrl ? [{ _id: `en-${Date.now()}`, date: new Date().toISOString(), photoUrl: req.body.photoUrl, note: req.body.note || '', assessment: req.body.assessment || 'stable' }] : [],
    createdAt: new Date().toISOString()
  };
  DEMO_TRACKERS.unshift(tracker);
  res.status(201).json(tracker);
});

router.post('/progress/:id/entries', demoOnly, (req, res) => {
  const t = DEMO_TRACKERS.find((x) => x._id === req.params.id);
  if (!t) return res.status(404).json({ message: 'Tracker not found' });
  t.entries.push({ _id: `en-${Date.now()}`, date: req.body.date || new Date().toISOString(), photoUrl: req.body.photoUrl, note: req.body.note || '', assessment: req.body.assessment || 'stable', measurementCm: req.body.measurementCm });
  if (req.body.assessment === 'healed') t.status = 'healed';
  res.status(201).json(t);
});

router.delete('/progress/:id/entries/:entryId', demoOnly, (req, res) => {
  const t = DEMO_TRACKERS.find((x) => x._id === req.params.id);
  if (!t) return res.status(404).json({ message: 'Tracker not found' });
  t.entries = t.entries.filter((e) => e._id !== req.params.entryId);
  res.json(t);
});

router.put('/progress/:id', demoOnly, (req, res) => {
  const t = DEMO_TRACKERS.find((x) => x._id === req.params.id);
  if (!t) return res.status(404).json({ message: 'Tracker not found' });
  Object.assign(t, req.body);
  res.json(t);
});

router.delete('/progress/:id', demoOnly, (req, res) => {
  const idx = DEMO_TRACKERS.findIndex((x) => x._id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Tracker not found' });
  DEMO_TRACKERS.splice(idx, 1);
  res.json({ message: 'Tracker deleted' });
});

// ==================== REVENUE ROUTING / FULFILLMENT ====================
const DEMO_FULFILLMENT = [
  { _id: 'ff-1', patientId: DEMO_PATIENTS[0], patientName: 'Ramesh Kumar', source: 'prescription', type: 'pharmacy', items: [{ name: 'Amlodipine', quantity: 1, estimatedValue: 80 }, { name: 'Atorvastatin', quantity: 1, estimatedValue: 80 }], estimatedValue: 160, destination: 'internal', status: 'fulfilled', createdAt: new Date('2025-05-20') },
  { _id: 'ff-2', patientId: DEMO_PATIENTS[3], patientName: 'Sunita Reddy', source: 'lab', type: 'lab', items: [{ name: 'HbA1c', quantity: 1, estimatedValue: 400 }], estimatedValue: 400, destination: 'internal', status: 'routed', createdAt: new Date('2025-05-28') },
  { _id: 'ff-3', patientId: DEMO_PATIENTS[1], patientName: 'Priya Sharma', source: 'imaging', type: 'imaging', items: [{ name: 'Chest X-Ray', quantity: 1, estimatedValue: 400 }], estimatedValue: 400, destination: 'external', status: 'routed', createdAt: new Date('2025-05-26') }
];

router.get('/fulfillment', demoOnly, (req, res) => {
  let list = [...DEMO_FULFILLMENT];
  if (req.query.type) list = list.filter((f) => f.type === req.query.type);
  if (req.query.status) list = list.filter((f) => f.status === req.query.status);
  if (req.query.destination) list = list.filter((f) => f.destination === req.query.destination);
  res.json({ records: list, total: list.length });
});

router.get('/fulfillment/stats/summary', demoOnly, (req, res) => {
  const internal = DEMO_FULFILLMENT.filter((f) => f.destination === 'internal');
  const external = DEMO_FULFILLMENT.filter((f) => f.destination === 'external');
  const iVal = internal.reduce((s, f) => s + f.estimatedValue, 0);
  const eVal = external.reduce((s, f) => s + f.estimatedValue, 0);
  res.json({
    retainedRevenue: iVal, retainedCount: internal.length,
    leakedRevenue: eVal, leakedCount: external.length,
    captureRate: iVal + eVal > 0 ? Math.round((iVal / (iVal + eVal)) * 100) : 100,
    byType: { pharmacy: DEMO_FULFILLMENT.filter((f) => f.type === 'pharmacy').length, lab: DEMO_FULFILLMENT.filter((f) => f.type === 'lab').length, imaging: DEMO_FULFILLMENT.filter((f) => f.type === 'imaging').length },
    pending: DEMO_FULFILLMENT.filter((f) => f.status === 'routed').length
  });
});

router.post('/fulfillment', demoOnly, (req, res) => {
  const rec = { _id: `ff-${Date.now()}`, destination: 'internal', status: 'routed', createdAt: new Date(), ...req.body };
  DEMO_FULFILLMENT.unshift(rec);
  res.status(201).json(rec);
});

router.put('/fulfillment/:id', demoOnly, (req, res) => {
  const rec = DEMO_FULFILLMENT.find((f) => f._id === req.params.id);
  if (!rec) return res.status(404).json({ message: 'Fulfillment record not found' });
  Object.assign(rec, req.body);
  res.json(rec);
});

router.delete('/fulfillment/:id', demoOnly, (req, res) => {
  const idx = DEMO_FULFILLMENT.findIndex((f) => f._id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Fulfillment record not found' });
  DEMO_FULFILLMENT.splice(idx, 1);
  res.json({ message: 'Fulfillment record deleted' });
});

// ==================== INSURANCE ====================
router.get('/insurance/providers', demoOnly, (req, res) => {
  res.json({ providers: [
    { key: 'star health', name: 'Star Health', coverage: 80, copay: 20, network: true },
    { key: 'hdfc ergo', name: 'HDFC Ergo', coverage: 75, copay: 25, network: true },
    { key: 'new india', name: 'New India', coverage: 85, copay: 15, network: true },
    { key: 'care health', name: 'Care Health', coverage: 80, copay: 20, network: true }
  ] });
});

router.post('/insurance/verify', demoOnly, (req, res) => {
  const table = { 'star health': 80, 'hdfc ergo': 75, 'new india': 85, 'care health': 80 };
  const cov = table[String(req.body.provider || '').toLowerCase()] || 70;
  const valid = String(req.body.policyNo || '').replace(/\D/g, '').length >= 6;
  res.json({
    provider: req.body.provider, policyNo: req.body.policyNo,
    verified: valid, status: valid ? 'verified' : 'rejected', inNetwork: true,
    coveragePercent: valid ? cov : 0, copayPercent: valid ? 100 - cov : 100, knownProvider: !!table[String(req.body.provider || '').toLowerCase()],
    message: valid ? `Policy verified — ${cov}% covered (in-network).` : 'Policy number appears invalid.',
    verifiedAt: new Date().toISOString()
  });
});

router.post('/insurance/estimate', demoOnly, (req, res) => {
  const total = Number(req.body.amount || 0);
  const pct = req.body.coveragePercent != null ? Number(req.body.coveragePercent) : 75;
  const insuranceCovered = Math.round((total * pct) / 100);
  const patientPayable = Math.max(0, total - insuranceCovered);
  res.json({ totalAmount: total, coveragePercent: pct, insuranceCovered, patientCopay: patientPayable, patientPayable, breakdown: [{ label: 'Insurance covers', percent: pct, amount: insuranceCovered }, { label: 'Patient copay', percent: 100 - pct, amount: patientPayable }] });
});

// ==================== RPM ====================
const monthKey = new Date().toISOString().slice(0, 7);
const DEMO_RPM = [
  {
    _id: 'rpm-1', patientId: DEMO_PATIENTS[0], patientName: 'Ramesh Kumar', deviceType: 'bp-cuff', condition: 'Hypertension', status: 'active', setupBilled: true,
    enrolledDate: new Date(Date.now() - 40 * 86400000).toISOString(),
    logs: [{ _id: 'l1', date: `${monthKey}-05`, minutes: 12, readings: 18 }, { _id: 'l2', date: `${monthKey}-12`, minutes: 15, readings: 16 }],
    billing: { month: monthKey, minutes: 27, daysTransmitted: 18, codes: [{ code: '99454', label: 'Device supply + daily readings (16+ days)', rate: 4800, units: 1 }, { code: '99457', label: 'First 20 min monitoring / month', rate: 4000, units: 1 }], estimatedReimbursement: 8800 }
  },
  {
    _id: 'rpm-2', patientId: DEMO_PATIENTS[3], patientName: 'Sunita Reddy', deviceType: 'cgm', condition: 'Type 2 Diabetes', status: 'active', setupBilled: false,
    enrolledDate: new Date(Date.now() - 5 * 86400000).toISOString(),
    logs: [{ _id: 'l3', date: `${monthKey}-10`, minutes: 8, readings: 6 }],
    billing: { month: monthKey, minutes: 8, daysTransmitted: 6, codes: [{ code: '99453', label: 'Initial device setup & education', rate: 1500, units: 1 }], estimatedReimbursement: 1500 }
  }
];

router.get('/rpm', demoOnly, (req, res) => {
  let list = [...DEMO_RPM];
  if (req.query.status) list = list.filter((r) => r.status === req.query.status);
  res.json({ records: list, total: list.length });
});

router.get('/rpm/stats/summary', demoOnly, (req, res) => {
  res.json({ enrolled: DEMO_RPM.length, active: DEMO_RPM.filter((r) => r.status === 'active').length, totalMinutes: 35, estimatedReimbursement: 10300, readyToBill: 2 });
});

router.get('/rpm/:id', demoOnly, (req, res) => {
  const r = DEMO_RPM.find((x) => x._id === req.params.id);
  if (!r) return res.status(404).json({ message: 'RPM record not found' });
  res.json(r);
});

router.post('/rpm', demoOnly, (req, res) => {
  const patient = DEMO_PATIENTS.find((p) => p._id === req.body.patientId) || DEMO_PATIENTS[0];
  const rec = { _id: `rpm-${Date.now()}`, patientId: patient, patientName: patient.name, deviceType: req.body.deviceType || 'bp-cuff', condition: req.body.condition || '', status: 'active', setupBilled: false, enrolledDate: new Date().toISOString(), logs: [], billing: { month: monthKey, minutes: 0, daysTransmitted: 0, codes: [{ code: '99453', label: 'Initial device setup & education', rate: 1500, units: 1 }], estimatedReimbursement: 1500 } };
  DEMO_RPM.unshift(rec);
  res.status(201).json(rec);
});

router.post('/rpm/:id/log', demoOnly, (req, res) => {
  const r = DEMO_RPM.find((x) => x._id === req.params.id);
  if (!r) return res.status(404).json({ message: 'RPM record not found' });
  r.logs.push({ _id: `l-${Date.now()}`, date: req.body.date || new Date().toISOString(), minutes: Number(req.body.minutes || 0), readings: Number(req.body.readings || 0), note: req.body.note });
  const mins = r.logs.reduce((s, l) => s + (l.minutes || 0), 0);
  const days = r.logs.reduce((s, l) => s + ((l.readings || 0) > 0 ? 1 : 0), 0);
  const codes = [];
  if (!r.setupBilled) codes.push({ code: '99453', label: 'Initial device setup & education', rate: 1500, units: 1 });
  if (days >= 16) codes.push({ code: '99454', label: 'Device supply + daily readings (16+ days)', rate: 4800, units: 1 });
  if (mins >= 20) codes.push({ code: '99457', label: 'First 20 min monitoring / month', rate: 4000, units: 1 });
  if (mins >= 40) codes.push({ code: '99458', label: 'Each additional 20 min / month', rate: 3200, units: Math.floor((mins - 20) / 20) });
  r.billing = { month: monthKey, minutes: mins, daysTransmitted: days, codes, estimatedReimbursement: codes.reduce((s, c) => s + c.rate * c.units, 0) };
  res.status(201).json(r);
});

router.post('/rpm/:id/bill-setup', demoOnly, (req, res) => {
  const r = DEMO_RPM.find((x) => x._id === req.params.id);
  if (!r) return res.status(404).json({ message: 'RPM record not found' });
  r.setupBilled = true;
  res.json(r);
});

router.put('/rpm/:id', demoOnly, (req, res) => {
  const r = DEMO_RPM.find((x) => x._id === req.params.id);
  if (!r) return res.status(404).json({ message: 'RPM record not found' });
  Object.assign(r, req.body);
  res.json(r);
});

router.delete('/rpm/:id', demoOnly, (req, res) => {
  const idx = DEMO_RPM.findIndex((x) => x._id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'RPM record not found' });
  DEMO_RPM.splice(idx, 1);
  res.json({ message: 'RPM enrollment removed' });
});

// Per-seat licensing summary
router.get('/subscription/seats', demoOnly, (req, res) => {
  res.json({ plan: 'pro', seatsUsed: 3, seatLimit: 5, seatsAvailable: 2, pricePerSeat: 249, monthlyCommitment: 747, trial: { active: false, daysRemaining: 320, lengthDays: 60 } });
});

// ==================== ASYNC CONSULTATIONS ====================
const DEMO_ASYNC = [
  { _id: 'ac-1', patientId: DEMO_PATIENTS[2], patientName: 'Amit Patel', patientPhone: '9876543212', category: 'dermatology', description: 'Itchy red rash on forearm for 4 days, spreading slowly. Photo attached.', photos: ['/uploads/demo-rash.jpg'], priority: 'normal', status: 'pending', createdAt: new Date(Date.now() - 2 * 3600000).toISOString() },
  { _id: 'ac-2', patientId: DEMO_PATIENTS[0], patientName: 'Ramesh Kumar', patientPhone: '9876543210', category: 'wound-check', description: 'Post-op wound looks slightly red around edges. Is this normal?', photos: ['/uploads/demo-wound-2.jpg'], priority: 'high', status: 'in-review', createdAt: new Date(Date.now() - 6 * 3600000).toISOString() },
  { _id: 'ac-3', patientId: DEMO_PATIENTS[1], patientName: 'Priya Sharma', patientPhone: '9876543211', category: 'medication-query', description: 'Can I take my BP medicine with the new antibiotic?', photos: [], priority: 'normal', status: 'responded', response: { text: 'Yes, safe to take together. Space them 2 hours apart.', respondedAt: new Date(Date.now() - 86400000).toISOString() }, createdAt: new Date(Date.now() - 90000000).toISOString() }
];

router.get('/async-consults', demoOnly, (req, res) => {
  let list = [...DEMO_ASYNC];
  if (req.query.status) list = list.filter((c) => c.status === req.query.status);
  if (req.query.category) list = list.filter((c) => c.category === req.query.category);
  res.json({ consults: list, total: list.length });
});

router.get('/async-consults/stats/summary', demoOnly, (req, res) => {
  res.json({
    pending: DEMO_ASYNC.filter((c) => c.status === 'pending').length,
    inReview: DEMO_ASYNC.filter((c) => c.status === 'in-review').length,
    responded: DEMO_ASYNC.filter((c) => c.status === 'responded').length,
    high: DEMO_ASYNC.filter((c) => ['pending', 'in-review'].includes(c.status) && c.priority === 'high').length,
    openTotal: DEMO_ASYNC.filter((c) => ['pending', 'in-review'].includes(c.status)).length
  });
});

router.get('/async-consults/:id', demoOnly, (req, res) => {
  const c = DEMO_ASYNC.find((x) => x._id === req.params.id);
  if (!c) return res.status(404).json({ message: 'Consultation not found' });
  res.json(c);
});

router.post('/async-consults', demoOnly, (req, res) => {
  const c = { _id: `ac-${Date.now()}`, status: 'pending', priority: 'normal', photos: [], createdAt: new Date().toISOString(), ...req.body };
  DEMO_ASYNC.unshift(c);
  res.status(201).json(c);
});

router.post('/async-consults/:id/claim', demoOnly, (req, res) => {
  const c = DEMO_ASYNC.find((x) => x._id === req.params.id);
  if (!c) return res.status(404).json({ message: 'Consultation not found' });
  c.status = 'in-review';
  res.json(c);
});

router.post('/async-consults/:id/respond', demoOnly, (req, res) => {
  const c = DEMO_ASYNC.find((x) => x._id === req.params.id);
  if (!c) return res.status(404).json({ message: 'Consultation not found' });
  c.response = { text: req.body.text, respondedAt: new Date().toISOString(), followUpAdvised: !!req.body.followUpAdvised };
  c.status = 'responded';
  res.json(c);
});

router.put('/async-consults/:id', demoOnly, (req, res) => {
  const c = DEMO_ASYNC.find((x) => x._id === req.params.id);
  if (!c) return res.status(404).json({ message: 'Consultation not found' });
  Object.assign(c, req.body);
  res.json(c);
});

router.delete('/async-consults/:id', demoOnly, (req, res) => {
  const idx = DEMO_ASYNC.findIndex((x) => x._id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Consultation not found' });
  DEMO_ASYNC.splice(idx, 1);
  res.json({ message: 'Consultation removed' });
});

// ==================== WEARABLES ====================
const DEMO_WEARABLES = [
  { _id: 'wd-1', patientId: DEMO_PATIENTS[3], patientName: 'Sunita Reddy', deviceType: 'cgm', metric: 'glucose', unit: 'mg/dL', thresholds: { min: 70, max: 180 }, status: 'connected', alertActive: true, alertSince: new Date(Date.now() - 2 * 3600000).toISOString(), lastSyncedAt: new Date(Date.now() - 1800000).toISOString(), readings: [ { _id: 'r1', value: 165, takenAt: new Date(Date.now() - 5 * 3600000).toISOString(), flagged: false }, { _id: 'r2', value: 192, takenAt: new Date(Date.now() - 3600000).toISOString(), flagged: true } ] },
  { _id: 'wd-2', patientId: DEMO_PATIENTS[0], patientName: 'Ramesh Kumar', deviceType: 'bp-cuff', metric: 'blood-pressure', unit: 'mmHg', thresholds: { min: 90, max: 140, minSecondary: 60, maxSecondary: 90 }, status: 'connected', alertActive: false, lastSyncedAt: new Date(Date.now() - 7200000).toISOString(), readings: [ { _id: 'r3', value: 128, secondaryValue: 82, takenAt: new Date(Date.now() - 7200000).toISOString(), flagged: false } ] }
];

router.get('/wearables', demoOnly, (req, res) => {
  let list = [...DEMO_WEARABLES];
  if (req.query.patientId) list = list.filter((d) => (d.patientId?._id || d.patientId) === req.query.patientId);
  if (req.query.alert === 'true') list = list.filter((d) => d.alertActive);
  res.json({ devices: list, total: list.length });
});

router.get('/wearables/stats/summary', demoOnly, (req, res) => {
  res.json({ connected: DEMO_WEARABLES.filter((d) => d.status === 'connected').length, alerts: DEMO_WEARABLES.filter((d) => d.alertActive).length, total: DEMO_WEARABLES.length });
});

router.get('/wearables/:id', demoOnly, (req, res) => {
  const d = DEMO_WEARABLES.find((x) => x._id === req.params.id);
  if (!d) return res.status(404).json({ message: 'Device not found' });
  res.json(d);
});

router.post('/wearables', demoOnly, (req, res) => {
  const patient = DEMO_PATIENTS.find((p) => p._id === req.body.patientId) || DEMO_PATIENTS[0];
  const d = { _id: `wd-${Date.now()}`, patientId: patient, patientName: patient.name, deviceType: req.body.deviceType || 'apple-watch', metric: req.body.metric, unit: req.body.unit || '', thresholds: req.body.thresholds || {}, status: 'connected', alertActive: false, lastSyncedAt: new Date().toISOString(), readings: [] };
  DEMO_WEARABLES.unshift(d);
  res.status(201).json(d);
});

router.post('/wearables/:id/sync', demoOnly, (req, res) => {
  const d = DEMO_WEARABLES.find((x) => x._id === req.params.id);
  if (!d) return res.status(404).json({ message: 'Device not found' });
  const mid = ((d.thresholds?.min ?? 60) + (d.thresholds?.max ?? 120)) / 2;
  for (let i = 0; i < 6; i++) {
    const v = Math.round((mid + (Math.random() - 0.4) * 40) * 10) / 10;
    d.readings.push({ _id: `r-${Date.now()}-${i}`, value: v, takenAt: new Date(Date.now() - (6 - i) * 3600000).toISOString(), flagged: d.thresholds?.max != null && v > d.thresholds.max });
  }
  d.lastSyncedAt = new Date().toISOString();
  d.alertActive = d.readings[d.readings.length - 1].flagged;
  res.json({ device: d, synced: 6 });
});

router.post('/wearables/:id/reading', demoOnly, (req, res) => {
  const d = DEMO_WEARABLES.find((x) => x._id === req.params.id);
  if (!d) return res.status(404).json({ message: 'Device not found' });
  const v = Number(req.body.value);
  const flagged = d.thresholds?.max != null && v > d.thresholds.max;
  d.readings.push({ _id: `r-${Date.now()}`, value: v, secondaryValue: req.body.secondaryValue, takenAt: new Date().toISOString(), flagged });
  d.alertActive = flagged;
  res.status(201).json({ device: d, flagged });
});

router.put('/wearables/:id', demoOnly, (req, res) => {
  const d = DEMO_WEARABLES.find((x) => x._id === req.params.id);
  if (!d) return res.status(404).json({ message: 'Device not found' });
  Object.assign(d, req.body);
  res.json(d);
});

router.delete('/wearables/:id', demoOnly, (req, res) => {
  const idx = DEMO_WEARABLES.findIndex((x) => x._id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'Device not found' });
  DEMO_WEARABLES.splice(idx, 1);
  res.json({ message: 'Device removed' });
});

// ==================== FHIR ====================
router.get('/fhir/metadata', demoOnly, (req, res) => {
  res.json({ resourceType: 'CapabilityStatement', status: 'active', fhirVersion: '4.0.1', format: ['json'], publisher: 'DocClinic Pro', externalServer: null,
    rest: [{ mode: 'server', resource: [{ type: 'Patient', interaction: [{ code: 'read' }, { code: 'create' }] }, { type: 'Appointment', interaction: [{ code: 'read' }] }, { type: 'MedicationRequest', interaction: [{ code: 'read' }] }] }] });
});

router.get('/fhir/Patient/:id', demoOnly, (req, res) => {
  const p = DEMO_PATIENTS.find((x) => x._id === req.params.id) || DEMO_PATIENTS[0];
  res.json({ resourceType: 'Patient', id: p._id, identifier: [{ system: 'urn:docclinic:patientId', value: p.patientId }], active: true, name: [{ use: 'official', text: p.name }], telecom: [{ system: 'phone', value: p.phone, use: 'mobile' }], gender: p.gender });
});

router.get('/fhir/Patient/:id/everything', demoOnly, (req, res) => {
  const p = DEMO_PATIENTS.find((x) => x._id === req.params.id) || DEMO_PATIENTS[0];
  const ref = `Patient/${p._id}`;
  res.json({ resourceType: 'Bundle', type: 'searchset', timestamp: new Date().toISOString(), total: 3, entry: [
    { resource: { resourceType: 'Patient', id: p._id, name: [{ text: p.name }], gender: p.gender, telecom: [{ system: 'phone', value: p.phone }] } },
    { resource: { resourceType: 'Appointment', status: 'fulfilled', start: new Date().toISOString(), participant: [{ actor: { reference: ref } }] } },
    { resource: { resourceType: 'MedicationRequest', status: 'active', intent: 'order', medicationCodeableConcept: { text: 'Amlodipine 5mg' }, subject: { reference: ref } } }
  ] });
});

router.post('/fhir/Patient', demoOnly, (req, res) => {
  const name = req.body?.name?.[0]?.text || 'Imported Patient';
  res.status(201).json({ message: 'Imported', localId: `pat-${Date.now()}`, patientId: `PAT-${String(DEMO_PATIENTS.length + 1).padStart(4, '0')}`, fhir: { resourceType: 'Patient', name: [{ text: name }] } });
});

// ==================== DOCTOR SLOT PLAN (#7) ====================
router.post('/doctor/slot-plan', demoOnly, (req, res) => {
  res.json({
    date: req.body.date || new Date().toISOString(), total: 5,
    morningBlock: { label: 'Short / virtual follow-ups (AM)', count: 3, items: [
      { patient: 'Priya Sharma', type: 'follow-up', mode: 'video', duration: 15, currentSlot: '09:30 AM', suggestedSlot: '09:00' },
      { patient: 'Ramesh Kumar', type: 'follow-up', mode: 'phone', duration: 10, currentSlot: '11:00 AM', suggestedSlot: '09:15' },
      { patient: 'Vikram Singh', type: 'checkup', mode: 'in-person', duration: 15, currentSlot: '11:00 AM', suggestedSlot: '09:30' }
    ] },
    afternoonBlock: { label: 'Complex / in-person evaluations (PM)', count: 2, items: [
      { patient: 'Amit Patel', type: 'consultation', mode: 'in-person', duration: 30, currentSlot: '10:00 AM', suggestedSlot: '14:00' },
      { patient: 'Sunita Reddy', type: 'consultation', mode: 'in-person', duration: 30, currentSlot: '10:30 AM', suggestedSlot: '14:30' }
    ] },
    rationale: ['Batch quick virtual follow-ups early to clear volume.', 'Reserve afternoons for demanding in-person evaluations.', 'Group similar consultation modes to cut context-switching.']
  });
});

// ==================== TELEMEDICINE FAILOVER (#6) ====================
router.post('/telemedicine/failover/:appointmentId', demoOnly, (req, res) => {
  res.json({ message: 'Failover call simulated (no telephony provider configured)', mode: 'phone', call: { callId: `call_${Date.now().toString(36)}`, provider: 'stub', status: 'dialing', configured: false }, voipConfigured: false });
});

router.get('/telemedicine/today', demoOnly, (req, res) => {
  const list = DEMO_APPOINTMENTS.slice(0, 2).map((a) => ({ ...a, consultationMode: 'video' }));
  res.json({ appointments: list, total: list.length, completed: 0, pending: list.length, inProgress: 0 });
});

// ==================== EMERGENCY SOS ====================
const DEMO_SOS = [
  { _id: 'sos-1', patientName: 'Ramesh Kumar', patientPhone: '9876543210', type: 'cardiac', location: 'Home - 12 MG Road', status: 'active', note: 'Severe chest pain, sweating', createdAt: new Date(Date.now() - 8 * 60000).toISOString() },
  { _id: 'sos-2', patientName: 'Sunita Reddy', patientPhone: '9876543213', type: 'fall', location: 'Bathroom', status: 'dispatched', note: 'Elderly fall, conscious', createdAt: new Date(Date.now() - 40 * 60000).toISOString() }
];
router.get('/sos', demoOnly, (req, res) => {
  let list = [...DEMO_SOS];
  if (req.query.status) list = list.filter((s) => s.status === req.query.status);
  res.json({ alerts: list, total: list.length });
});
router.get('/sos/stats/summary', demoOnly, (req, res) => {
  res.json({ active: DEMO_SOS.filter((s) => ['active', 'acknowledged', 'dispatched'].includes(s.status)).length, resolved: DEMO_SOS.filter((s) => s.status === 'resolved').length, total: DEMO_SOS.length });
});
router.post('/sos', demoOnly, (req, res) => {
  const a = { _id: `sos-${Date.now()}`, status: 'active', createdAt: new Date().toISOString(), ...req.body };
  DEMO_SOS.unshift(a);
  res.status(201).json(a);
});
router.put('/sos/:id/status', demoOnly, (req, res) => {
  const a = DEMO_SOS.find((x) => x._id === req.params.id);
  if (!a) return res.status(404).json({ message: 'Alert not found' });
  a.status = req.body.status;
  res.json(a);
});
router.delete('/sos/:id', demoOnly, (req, res) => {
  const i = DEMO_SOS.findIndex((x) => x._id === req.params.id);
  if (i === -1) return res.status(404).json({ message: 'Alert not found' });
  DEMO_SOS.splice(i, 1);
  res.json({ message: 'Alert removed' });
});

// ==================== STAFF ATTENDANCE ====================
const DEMO_ATT = [
  { _id: 'att-1', staffName: 'Receptionist Mary', role: 'receptionist', date: new Date().toISOString().slice(0, 10), checkIn: new Date(new Date().setHours(9, 5)).toISOString(), status: 'on-duty', hours: 0 },
  { _id: 'att-2', staffName: 'Nurse Nancy', role: 'nurse', date: new Date().toISOString().slice(0, 10), checkIn: new Date(new Date().setHours(8, 50)).toISOString(), checkOut: new Date(new Date().setHours(13, 0)).toISOString(), status: 'present', hours: 4.2 },
  { _id: 'att-3', staffName: 'Lab Tech Raj', role: 'staff', date: new Date().toISOString().slice(0, 10), status: 'leave', hours: 0 }
];
router.get('/attendance', demoOnly, (req, res) => {
  let list = [...DEMO_ATT];
  if (req.query.date) list = list.filter((r) => r.date === req.query.date);
  res.json({ records: list, total: list.length });
});
router.get('/attendance/stats/summary', demoOnly, (req, res) => {
  res.json({ date: new Date().toISOString().slice(0, 10), present: 2, onDuty: 1, leave: 1, total: DEMO_ATT.length });
});
router.post('/attendance/check-in', demoOnly, (req, res) => {
  const r = { _id: `att-${Date.now()}`, staffName: req.body.staffName, role: req.body.role || 'staff', date: new Date().toISOString().slice(0, 10), checkIn: new Date().toISOString(), status: 'on-duty', hours: 0 };
  DEMO_ATT.unshift(r);
  res.status(201).json(r);
});
router.post('/attendance/:id/check-out', demoOnly, (req, res) => {
  const r = DEMO_ATT.find((x) => x._id === req.params.id);
  if (!r) return res.status(404).json({ message: 'Record not found' });
  r.checkOut = new Date().toISOString();
  r.hours = 6.5; r.status = 'present';
  res.json(r);
});
router.post('/attendance/mark', demoOnly, (req, res) => {
  const r = { _id: `att-${Date.now()}`, staffName: req.body.staffName, role: req.body.role || 'staff', date: req.body.date || new Date().toISOString().slice(0, 10), status: req.body.status, hours: 0 };
  DEMO_ATT.unshift(r);
  res.json(r);
});
router.delete('/attendance/:id', demoOnly, (req, res) => {
  const i = DEMO_ATT.findIndex((x) => x._id === req.params.id);
  if (i === -1) return res.status(404).json({ message: 'Record not found' });
  DEMO_ATT.splice(i, 1);
  res.json({ message: 'Record removed' });
});

// ==================== PAYROLL ====================
const monthNow = new Date().toISOString().slice(0, 7);
const DEMO_PAY = [
  { _id: 'pay-1', staffName: 'Receptionist Mary', role: 'receptionist', month: monthNow, baseSalary: 22000, allowances: 2000, deductions: 1000, daysPresent: 24, netPay: 23000, status: 'paid' },
  { _id: 'pay-2', staffName: 'Nurse Nancy', role: 'nurse', month: monthNow, baseSalary: 28000, allowances: 3000, deductions: 1500, daysPresent: 25, netPay: 29500, status: 'approved' },
  { _id: 'pay-3', staffName: 'Lab Tech Raj', role: 'staff', month: monthNow, baseSalary: 24000, allowances: 1500, deductions: 800, daysPresent: 22, netPay: 24700, status: 'draft' }
];
router.get('/payroll', demoOnly, (req, res) => {
  let list = [...DEMO_PAY];
  if (req.query.status) list = list.filter((p) => p.status === req.query.status);
  res.json({ slips: list, total: list.length });
});
router.get('/payroll/stats/summary', demoOnly, (req, res) => {
  res.json({ month: monthNow, totalPayout: DEMO_PAY.reduce((s, p) => s + p.netPay, 0), paid: DEMO_PAY.filter((p) => p.status === 'paid').length, pending: DEMO_PAY.filter((p) => p.status !== 'paid').length, count: DEMO_PAY.length });
});
router.post('/payroll', demoOnly, (req, res) => {
  const net = (Number(req.body.baseSalary) || 0) + (Number(req.body.allowances) || 0) - (Number(req.body.deductions) || 0);
  const p = { _id: `pay-${Date.now()}`, status: 'draft', daysPresent: req.body.daysPresent || 0, ...req.body, netPay: net };
  DEMO_PAY.unshift(p);
  res.status(201).json(p);
});
router.put('/payroll/:id', demoOnly, (req, res) => {
  const p = DEMO_PAY.find((x) => x._id === req.params.id);
  if (!p) return res.status(404).json({ message: 'Slip not found' });
  Object.assign(p, req.body);
  p.netPay = (Number(p.baseSalary) || 0) + (Number(p.allowances) || 0) - (Number(p.deductions) || 0);
  res.json(p);
});
router.delete('/payroll/:id', demoOnly, (req, res) => {
  const i = DEMO_PAY.findIndex((x) => x._id === req.params.id);
  if (i === -1) return res.status(404).json({ message: 'Slip not found' });
  DEMO_PAY.splice(i, 1);
  res.json({ message: 'Slip removed' });
});

// ==================== PATIENT REACTIVATION ====================
router.get('/reactivation/lapsed', demoOnly, (req, res) => {
  res.json({ patients: [
    { _id: 'pat-5', name: 'Vikram Singh', phone: '9876543214', patientId: 'PAT-0005', lastVisit: new Date(Date.now() - 200 * 86400000).toISOString(), totalVisits: 2, totalBilled: 1000, daysSinceVisit: 200, lastOutreach: null },
    { _id: 'pat-2', name: 'Priya Sharma', phone: '9876543211', patientId: 'PAT-0002', lastVisit: new Date(Date.now() - 150 * 86400000).toISOString(), totalVisits: 5, totalBilled: 2500, daysSinceVisit: 150, lastOutreach: { status: 'contacted', at: new Date(Date.now() - 5 * 86400000).toISOString() } }
  ], total: 2, thresholdDays: 120 });
});
router.get('/reactivation/stats/summary', demoOnly, (req, res) => {
  res.json({ lapsed: 2, contacted: 1, rebooked: 0, potentialRevenue: 1000 });
});
router.post('/reactivation/reach-out', demoOnly, (req, res) => {
  res.status(201).json({ _id: `rl-${Date.now()}`, patientId: req.body.patientId, status: 'contacted', channel: req.body.channel || 'whatsapp', contactedAt: new Date().toISOString() });
});
router.post('/reactivation/reach-out/bulk', demoOnly, (req, res) => {
  res.json({ sent: (req.body.patientIds || []).length, message: `Reached out to ${(req.body.patientIds || []).length} patient(s)` });
});
router.put('/reactivation/log/:id', demoOnly, (req, res) => {
  res.json({ _id: req.params.id, status: req.body.status });
});

// ==================== GOOGLE REVIEWS ====================
const DEMO_REVIEWS = [
  { _id: 'rv-1', patientName: 'Ramesh Kumar', patientPhone: '9876543210', channel: 'whatsapp', status: 'reviewed', rating: 5, requestedAt: new Date(Date.now() - 3 * 86400000).toISOString(), reviewedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { _id: 'rv-2', patientName: 'Priya Sharma', patientPhone: '9876543211', channel: 'whatsapp', status: 'opened', requestedAt: new Date(Date.now() - 86400000).toISOString() },
  { _id: 'rv-3', patientName: 'Amit Patel', patientPhone: '9876543212', channel: 'sms', status: 'requested', requestedAt: new Date(Date.now() - 3600000).toISOString() }
];
router.get('/reviews', demoOnly, (req, res) => {
  let list = [...DEMO_REVIEWS];
  if (req.query.status) list = list.filter((r) => r.status === req.query.status);
  res.json({ reviews: list, total: list.length });
});
router.get('/reviews/stats/summary', demoOnly, (req, res) => {
  res.json({ requested: DEMO_REVIEWS.length, opened: DEMO_REVIEWS.filter((r) => ['opened', 'reviewed'].includes(r.status)).length, reviewed: DEMO_REVIEWS.filter((r) => r.status === 'reviewed').length, conversion: 33 });
});
router.post('/reviews/request', demoOnly, (req, res) => {
  const r = { _id: `rv-${Date.now()}`, status: 'requested', channel: req.body.channel || 'whatsapp', requestedAt: new Date().toISOString(), ...req.body };
  DEMO_REVIEWS.unshift(r);
  res.status(201).json({ review: r, link: 'https://g.page/r/demo-clinic/review' });
});
router.post('/reviews/request/bulk', demoOnly, (req, res) => {
  res.json({ sent: (req.body.patients || []).length, message: `Requested reviews from ${(req.body.patients || []).length} patient(s)` });
});
router.put('/reviews/:id', demoOnly, (req, res) => {
  const r = DEMO_REVIEWS.find((x) => x._id === req.params.id);
  if (!r) return res.status(404).json({ message: 'Not found' });
  Object.assign(r, req.body);
  res.json(r);
});
router.delete('/reviews/:id', demoOnly, (req, res) => {
  const i = DEMO_REVIEWS.findIndex((x) => x._id === req.params.id);
  if (i === -1) return res.status(404).json({ message: 'Not found' });
  DEMO_REVIEWS.splice(i, 1);
  res.json({ message: 'Removed' });
});

// ==================== DOCTOR WEBSITE ====================
let DEMO_SITE = {
  _id: 'site-1', slug: 'docclinic-demo', published: true, theme: 'teal',
  headline: 'DocClinic Demo Centre', about: 'Dr. Demo Doctor — MBBS, MD, General Physician. Compassionate, evidence-based care for the whole family.',
  services: ['General Consultation', 'Health Check-ups', 'Teleconsultation', 'Vaccinations'],
  highlights: ['12+ years experience', 'Online booking available', '4.8\u2605 patient rating'],
  bookingEnabled: true, googleReviewUrl: 'https://g.page/r/demo-clinic/review',
  contact: { phone: '9000000000', email: 'demo@docclinic.com', address: '123 Health Street, Mumbai' }, views: 248
};
router.get('/website', demoOnly, (req, res) => res.json(DEMO_SITE));
router.put('/website', demoOnly, (req, res) => { DEMO_SITE = { ...DEMO_SITE, ...req.body }; res.json(DEMO_SITE); });
router.post('/website/publish', demoOnly, (req, res) => { DEMO_SITE.published = req.body.published !== false; res.json({ published: DEMO_SITE.published, slug: DEMO_SITE.slug, url: `/site/${DEMO_SITE.slug}` }); });
router.get('/website/public/:slug', demoOnly, (req, res) => {
  res.json({ site: DEMO_SITE, doctor: { name: 'Demo Doctor', specialty: 'general', qualification: 'MBBS, MD', clinicName: 'DocClinic Demo Centre', clinicCity: 'Mumbai', consultationFee: 500, workingHours: { start: '09:00', end: '18:00' } } });
});

// ==================== SMS ====================
const DEMO_SMS_LOG = [
  { to: '9876543210', body: 'Reminder: your appointment is tomorrow at 10:00 AM.', status: 'sent', at: new Date(Date.now() - 3600000).toISOString() },
  { to: '9876543211', body: 'Your lab reports are ready for collection.', status: 'sent', at: new Date(Date.now() - 7200000).toISOString() }
];
router.get('/sms/templates', demoOnly, (req, res) => res.json({ templates: [
  { key: 'reminder', label: 'Appointment Reminder', body: 'Hi {name}, reminder: your appointment is on {date} at {time}.' },
  { key: 'follow-up', label: 'Follow-up', body: 'Hi {name}, it\u2019s time for your follow-up visit. Call us to book.' },
  { key: 'reports-ready', label: 'Reports Ready', body: 'Hi {name}, your lab reports are ready.' },
  { key: 'review', label: 'Review Request', body: 'Hi {name}, thanks for visiting! Review us: {link}' }
] }));
router.get('/sms/status', demoOnly, (req, res) => res.json({ configured: false, provider: 'stub', sender: 'CLINIC' }));
router.get('/sms/log', demoOnly, (req, res) => res.json({ log: DEMO_SMS_LOG, configured: false }));
router.post('/sms/send', demoOnly, (req, res) => {
  DEMO_SMS_LOG.unshift({ to: req.body.to, body: req.body.body, status: 'sent', stubbed: true, at: new Date().toISOString() });
  res.json({ message: 'SMS sent (simulated — no SMS provider configured)', result: { success: true, stubbed: true } });
});
router.post('/sms/send-bulk', demoOnly, (req, res) => {
  const n = (req.body.recipients || []).length;
  (req.body.recipients || []).forEach((to) => DEMO_SMS_LOG.unshift({ to, body: req.body.body, status: 'sent', at: new Date().toISOString() }));
  res.json({ message: `Sent ${n}/${n} messages`, sent: n, total: n });
});

module.exports = router;
module.exports.DEMO_USERS = DEMO_USERS;
