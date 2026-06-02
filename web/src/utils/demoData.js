/**
 * Demo mode data — used when backend is unreachable.
 * This allows the frontend to function fully in demo mode
 * without any backend server running.
 */

export const DEMO_USER = {
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

export const DEMO_TOKEN = 'demo-offline-token';

export const DEMO_RESPONSES = {
  '/auth/login': { token: DEMO_TOKEN, user: DEMO_USER },
  '/auth/profile': DEMO_USER,
  '/dashboard/stats': {
    totalPatients: 5,
    todayAppointments: 5,
    monthRevenue: 2750,
    todayCompleted: 2,
    pendingPayments: 2,
    newPatientsThisMonth: 1
  },
  '/dashboard/recent': {
    recentPatients: [
      { _id: 'pat-1', name: 'Ramesh Kumar', phone: '9876543210', patientId: 'PAT-0001', createdAt: '2024-10-15' },
      { _id: 'pat-2', name: 'Priya Sharma', phone: '9876543211', patientId: 'PAT-0002', createdAt: '2024-11-20' }
    ],
    recentAppointments: []
  },
  '/dashboard/analytics': {
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
  },
  '/patients': {
    patients: [
      { _id: 'pat-1', patientId: 'PAT-0001', name: 'Ramesh Kumar', phone: '9876543210', age: 45, gender: 'male', bloodGroup: 'B+', city: 'Mumbai', totalVisits: 12, totalBilled: 6500, isActive: true },
      { _id: 'pat-2', patientId: 'PAT-0002', name: 'Priya Sharma', phone: '9876543211', age: 32, gender: 'female', bloodGroup: 'O+', city: 'Mumbai', totalVisits: 5, totalBilled: 2500, isActive: true },
      { _id: 'pat-3', patientId: 'PAT-0003', name: 'Amit Patel', phone: '9876543212', age: 28, gender: 'male', bloodGroup: 'A+', city: 'Pune', totalVisits: 3, totalBilled: 1500, isActive: true },
      { _id: 'pat-4', patientId: 'PAT-0004', name: 'Sunita Reddy', phone: '9876543213', age: 55, gender: 'female', bloodGroup: 'AB+', city: 'Mumbai', totalVisits: 8, totalBilled: 4200, isActive: true },
      { _id: 'pat-5', patientId: 'PAT-0005', name: 'Vikram Singh', phone: '9876543214', age: 38, gender: 'male', bloodGroup: 'B-', city: 'Delhi', totalVisits: 2, totalBilled: 1000, isActive: true }
    ],
    total: 5, pages: 1, page: 1
  },
  '/appointments': {
    appointments: [
      { _id: 'apt-1', patientId: { _id: 'pat-1', name: 'Ramesh Kumar', phone: '9876543210' }, date: new Date().toISOString(), timeSlot: '09:00 AM', type: 'consultation', status: 'completed', tokenNumber: 1, symptoms: 'BP check' },
      { _id: 'apt-2', patientId: { _id: 'pat-2', name: 'Priya Sharma', phone: '9876543211' }, date: new Date().toISOString(), timeSlot: '09:30 AM', type: 'follow-up', status: 'completed', tokenNumber: 2, symptoms: 'Fever follow-up' },
      { _id: 'apt-3', patientId: { _id: 'pat-3', name: 'Amit Patel', phone: '9876543212' }, date: new Date().toISOString(), timeSlot: '10:00 AM', type: 'consultation', status: 'in-progress', tokenNumber: 3, symptoms: 'Headache' },
      { _id: 'apt-4', patientId: { _id: 'pat-4', name: 'Sunita Reddy', phone: '9876543213' }, date: new Date().toISOString(), timeSlot: '10:30 AM', type: 'consultation', status: 'scheduled', tokenNumber: 4, symptoms: 'Diabetes review' },
      { _id: 'apt-5', patientId: { _id: 'pat-5', name: 'Vikram Singh', phone: '9876543214' }, date: new Date().toISOString(), timeSlot: '11:00 AM', type: 'checkup', status: 'scheduled', tokenNumber: 5, symptoms: 'Annual checkup' }
    ],
    total: 5, pages: 1, page: 1
  },
  '/appointments/queue/today': [
    { _id: 'apt-3', patientId: { _id: 'pat-3', name: 'Amit Patel', phone: '9876543212', patientId: 'PAT-0003', age: 28, gender: 'male' }, date: new Date().toISOString(), timeSlot: '10:00 AM', type: 'consultation', status: 'in-progress', tokenNumber: 3, symptoms: 'Headache' },
    { _id: 'apt-4', patientId: { _id: 'pat-4', name: 'Sunita Reddy', phone: '9876543213', patientId: 'PAT-0004', age: 55, gender: 'female' }, date: new Date().toISOString(), timeSlot: '10:30 AM', type: 'consultation', status: 'scheduled', tokenNumber: 4, symptoms: 'Diabetes review' },
    { _id: 'apt-5', patientId: { _id: 'pat-5', name: 'Vikram Singh', phone: '9876543214', patientId: 'PAT-0005', age: 38, gender: 'male' }, date: new Date().toISOString(), timeSlot: '11:00 AM', type: 'checkup', status: 'scheduled', tokenNumber: 5, symptoms: 'Annual checkup' }
  ],
  '/billing': {
    bills: [
      { _id: 'bill-1', invoiceNo: 'INV-00001', patientId: { name: 'Ramesh Kumar' }, items: [{ description: 'Consultation', amount: 500, quantity: 1 }], totalAmount: 500, paidAmount: 500, paymentMethod: 'cash', paymentStatus: 'paid', createdAt: '2025-05-20' },
      { _id: 'bill-2', invoiceNo: 'INV-00002', patientId: { name: 'Priya Sharma' }, items: [{ description: 'Consultation', amount: 500, quantity: 1 }], totalAmount: 850, paidAmount: 850, paymentMethod: 'upi', paymentStatus: 'paid', createdAt: '2025-05-25' }
    ],
    total: 2, pages: 1, page: 1
  },
  '/billing/revenue/summary': { today: 1350, week: 2750, month: 2750, total: 15700 },
  '/expenses': {
    expenses: [
      { _id: 'exp-1', category: 'rent', description: 'Monthly clinic rent', amount: 25000, date: '2025-05-01', vendor: 'Landlord', paymentMethod: 'online' },
      { _id: 'exp-2', category: 'salary', description: 'Receptionist salary', amount: 18000, date: '2025-05-01', vendor: 'Staff', paymentMethod: 'online' }
    ],
    total: 2
  },
  '/expenses/summary': {
    thisMonth: 50000, thisMonthCount: 4, thisYear: 280000,
    byCategory: [{ _id: 'rent', total: 150000, count: 6 }, { _id: 'salary', total: 108000, count: 6 }],
    monthlyTrend: [{ _id: '2025-03', total: 43000, count: 3 }, { _id: '2025-04', total: 50000, count: 4 }, { _id: '2025-05', total: 50000, count: 4 }]
  },
  '/prescriptions': {
    prescriptions: [
      { _id: 'rx-1', prescriptionNo: 'RX-00001', patientId: { name: 'Ramesh Kumar' }, diagnosis: 'Hypertension', medicines: [{ name: 'Amlodipine', dosage: '5mg', frequency: '1-0-0', duration: '30 days' }], createdAt: '2025-05-20' }
    ],
    total: 1, pages: 1, page: 1
  },
  '/prescriptions/templates': [],
  '/medicines': [
    { _id: 'med-1', name: 'Paracetamol', strength: '500mg', form: 'tablet', defaultFrequency: '1-0-1' },
    { _id: 'med-2', name: 'Amoxicillin', strength: '500mg', form: 'capsule', defaultFrequency: '1-1-1' },
    { _id: 'med-3', name: 'Metformin', strength: '500mg', form: 'tablet', defaultFrequency: '1-0-1' }
  ],
  '/labtests': { tests: [], total: 0 },
  '/whatsapp/run-reminders': { processed: 5, sent: 3, failed: 0 },
  '/whatsapp/send': { message: 'Message sent (demo mode)', sent: true },
  '/whatsapp/prescription': { message: 'Prescription shared (demo mode)', sent: true },
  '/ai/status': { provider: 'demo', available: true, features: ['chat', 'diagnosis', 'risk-scoring'] },
  '/ai/chat': { response: 'Hello Doctor! I am your AI assistant. How can I help?', provider: 'demo' },
  '/ai/risk-score': {
    riskScore: 6,
    riskLevel: 'moderate',
    factors: ['Age > 45', 'Irregular follow-ups', 'Hypertension history', 'BMI elevated'],
    recommendations: ['Quarterly BP monitoring', 'Lipid panel every 6 months', 'Lifestyle counseling', 'Reduce salt intake'],
    predictedNoShowProbability: 15,
    suggestedFollowUp: '2 weeks',
    provider: 'demo'
  },
  '/ai/diagnose': {
    diagnoses: [
      { condition: 'Viral Upper Respiratory Infection', probability: 'high', icd10: 'J06.9' },
      { condition: 'Allergic Rhinitis', probability: 'medium', icd10: 'J30.4' }
    ],
    urgency: 'routine', provider: 'demo'
  },
  '/ai/prescribe': {
    medicines: [
      { name: 'Paracetamol', dosage: '500mg', frequency: '1-0-1', duration: '3 days', timing: 'after-food' },
      { name: 'Cetirizine', dosage: '10mg', frequency: '0-0-1', duration: '5 days', timing: 'bedtime' }
    ],
    warnings: [], advice: 'Rest, hydration, steam inhalation.', provider: 'demo'
  },
  '/notifications': []
};

/**
 * Check if we're in demo/offline mode
 */
export function isDemoMode() {
  const token = localStorage.getItem('token');
  return token === DEMO_TOKEN || token?.startsWith('demo-token-');
}

/**
 * Find matching demo response for a URL path
 */
export function getDemoResponse(url) {
  // Strip query params for matching
  const path = url.split('?')[0].replace(/^\/api/, '').replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  
  // Try exact match first
  if (DEMO_RESPONSES[cleanPath]) return DEMO_RESPONSES[cleanPath];
  
  // Try without leading slash
  const noSlash = cleanPath.replace(/^\//, '');
  for (const [key, value] of Object.entries(DEMO_RESPONSES)) {
    const cleanKey = key.replace(/^\//, '');
    if (noSlash === cleanKey) return value;
    if (noSlash.startsWith(cleanKey) || cleanKey.startsWith(noSlash)) return value;
  }

  // Single patient view (e.g., /patients/pat-1)
  if (cleanPath.match(/\/patients\/pat-\d+/) || cleanPath.match(/\/patients\/[a-f0-9]/)) {
    const patients = DEMO_RESPONSES['/patients']?.patients || [];
    const id = cleanPath.split('/').pop();
    const found = patients.find(p => p._id === id);
    if (found) return found;
    return patients[0] || {};
  }

  // Match common patterns (more specific first)
  if (cleanPath.includes('risk-score') || cleanPath.includes('ai/risk')) return DEMO_RESPONSES['/ai/risk-score'];
  if (cleanPath.includes('ai/diagnose')) return DEMO_RESPONSES['/ai/diagnose'];
  if (cleanPath.includes('ai/prescribe')) return DEMO_RESPONSES['/ai/prescribe'];
  if (cleanPath.includes('ai/chat')) return DEMO_RESPONSES['/ai/chat'];
  if (cleanPath.includes('ai/')) return DEMO_RESPONSES['/ai/status'];
  if (cleanPath.includes('whatsapp/send')) return DEMO_RESPONSES['/whatsapp/send'];
  if (cleanPath.includes('whatsapp/prescription')) return DEMO_RESPONSES['/whatsapp/prescription'];
  if (cleanPath.includes('whatsapp')) return DEMO_RESPONSES['/whatsapp/run-reminders'];
  if (cleanPath.includes('dashboard/stat')) return DEMO_RESPONSES['/dashboard/stats'];
  if (cleanPath.includes('dashboard/analytic')) return DEMO_RESPONSES['/dashboard/analytics'];
  if (cleanPath.includes('revenue')) return DEMO_RESPONSES['/billing/revenue/summary'];
  if (cleanPath.includes('billing')) return DEMO_RESPONSES['/billing'];
  if (cleanPath.includes('appointment')) return DEMO_RESPONSES['/appointments'];
  if (cleanPath.includes('prescription')) return DEMO_RESPONSES['/prescriptions'];
  if (cleanPath.includes('medicine')) return DEMO_RESPONSES['/medicines'];
  if (cleanPath.includes('expense')) return DEMO_RESPONSES['/expenses'];
  if (cleanPath.includes('labtest') || cleanPath.includes('lab-test')) return DEMO_RESPONSES['/labtests'];
  if (cleanPath.includes('patient')) return DEMO_RESPONSES['/patients'];

  // Default — return empty but valid response (no error message)
  return {};
}
