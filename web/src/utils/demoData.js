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
  '/certificates': {
    certificates: [
      { _id: 'cert-1', certificateNo: 'CERT-00001', type: 'sick-leave', patientId: { name: 'Ramesh Kumar', patientId: 'PAT-0001' }, diagnosis: 'Acute viral fever', restFromDate: '2025-05-20', restToDate: '2025-05-22', restDays: 3, remarks: 'Advised bed rest.', status: 'active', issuedDate: '2025-05-20', createdAt: '2025-05-20' },
      { _id: 'cert-2', certificateNo: 'CERT-00002', type: 'fitness', patientId: { name: 'Amit Patel', patientId: 'PAT-0003' }, diagnosis: 'Routine examination', fitToResumeDate: '2025-05-26', remarks: 'Found medically fit for duty.', status: 'active', issuedDate: '2025-05-25', createdAt: '2025-05-25' }
    ],
    total: 2, pages: 1, page: 1
  },
  '/certificates/stats/summary': { total: 2, active: 2, sickLeave: 1, fitness: 1 },
  '/dashboard/practice': {
    periodDays: 90,
    totals: { appointments: 142, prescriptions: 118 },
    appointmentMetrics: { completed: 112, noShow: 11, cancelled: 8, completionRate: 79, noShowRate: 8, cancellationRate: 6 },
    appointmentTypes: [
      { type: 'consultation', count: 78 }, { type: 'follow-up', count: 41 },
      { type: 'checkup', count: 15 }, { type: 'procedure', count: 8 }
    ],
    peakHours: [
      { slot: '10:00 AM', count: 22 }, { slot: '10:30 AM', count: 19 }, { slot: '11:00 AM', count: 17 },
      { slot: '09:30 AM', count: 14 }, { slot: '12:00 PM', count: 11 }, { slot: '05:00 PM', count: 9 }
    ],
    topDiagnoses: [
      { diagnosis: 'hypertension', count: 24 }, { diagnosis: 'type 2 diabetes', count: 19 },
      { diagnosis: 'viral fever', count: 16 }, { diagnosis: 'upper respiratory infection', count: 12 },
      { diagnosis: 'gastritis', count: 9 }
    ],
    topMedicines: [
      { medicine: 'paracetamol', count: 41 }, { medicine: 'amlodipine', count: 27 },
      { medicine: 'metformin', count: 22 }, { medicine: 'atorvastatin', count: 18 }, { medicine: 'pantoprazole', count: 14 }
    ]
  },
  '/availability': {
    blocks: [
      { _id: 'av-1', type: 'full-day', startDate: new Date(Date.now() + 3 * 86400000).toISOString(), endDate: new Date(Date.now() + 4 * 86400000).toISOString(), reason: 'conference', note: 'Annual Cardiology Summit' },
      { _id: 'av-2', type: 'slot', startDate: new Date(Date.now() + 86400000).toISOString(), endDate: new Date(Date.now() + 86400000).toISOString(), startTime: '13:00', endTime: '14:00', reason: 'break', note: 'Lunch break' }
    ],
    total: 2
  },
  '/doctor/optimize-schedule': {
    appointmentCount: 5,
    insights: { predictedLoad: 20, peakHours: ['10:00-12:00'], suggestedBreaks: ['13:00-14:00'], noShowRisk: ['Token #4'] },
    optimizations: ['Move follow-ups to the afternoon (3-5 PM)', 'Keep 2 emergency buffer slots at 10:30 & 2:30', 'Group similar procedures together'],
    suggestedSlots: { emergencyBuffer: ['10:30 AM', '02:30 PM'], followUps: ['03:00 PM', '04:00 PM'], newPatients: ['09:00 AM', '09:30 AM'] }
  },
  '/doctor/patient-risk': {
    riskScore: 6, riskLevel: 'moderate',
    factors: ['Age above 45', 'Known allergy noted', 'Occasional missed follow-ups'],
    recommendations: ['Schedule periodic reviews', 'Monitor vitals each visit', 'Send SMS reminders'],
    predictedNoShowProbability: 15, suggestedFollowUp: '2 weeks',
    disclaimer: 'AI risk assessment is for reference only.'
  },
  '/waitlist': {
    entries: [
      { _id: 'wl-1', patientName: 'Kavita Nair', patientPhone: '9876500011', service: 'MRI', priority: 'high', status: 'waiting', note: 'Knee MRI — flexible timing', createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
      { _id: 'wl-2', patientName: 'Rahul Verma', patientPhone: '9876500022', service: 'consultation', priority: 'normal', status: 'waiting', note: 'Prefers mornings', createdAt: new Date(Date.now() - 86400000).toISOString() },
      { _id: 'wl-3', patientName: 'Meena Iyer', patientPhone: '9876500033', service: 'CT scan', priority: 'high', status: 'notified', notifyCount: 1, createdAt: new Date(Date.now() - 3 * 86400000).toISOString() }
    ],
    total: 3
  },
  '/waitlist/stats/summary': { waiting: 2, notified: 1, booked: 0, high: 2 },
  '/care-pathways': {
    pathways: [
      {
        _id: 'cp-1', patientId: { name: 'Sunita Reddy', patientId: 'PAT-0004' }, patientName: 'Sunita Reddy', patientPhone: '9876543213',
        title: 'Diabetes Management Plan', diagnosis: 'Type 2 Diabetes', status: 'active', startDate: new Date(Date.now() - 5 * 86400000).toISOString(),
        tasks: [
          { _id: 'tk-1', label: 'Take Metformin 500mg', category: 'medication', time: '08:00 AM', frequency: 'daily', instructions: 'After breakfast' },
          { _id: 'tk-2', label: 'Take Metformin 500mg', category: 'medication', time: '08:00 PM', frequency: 'daily', instructions: 'After dinner' },
          { _id: 'tk-3', label: 'Log fasting blood sugar', category: 'measurement', time: 'Morning', frequency: 'daily' },
          { _id: 'tk-4', label: '30 min brisk walk', category: 'exercise', time: 'Evening', frequency: 'daily' }
        ],
        completions: [{ taskId: 'tk-1', date: new Date().toISOString().slice(0, 10) }, { taskId: 'tk-3', date: new Date().toISOString().slice(0, 10) }]
      }
    ],
    total: 1
  },
  '/care-pathways/stats/summary': { active: 2, completed: 0, total: 2 },
  '/progress': {
    trackers: [
      {
        _id: 'pt-1', patientId: { name: 'Ramesh Kumar', patientId: 'PAT-0001' }, patientName: 'Ramesh Kumar',
        bodyArea: 'Left forearm', condition: 'Post-op suture site', status: 'active',
        entries: [
          { _id: 'en-1', date: new Date(Date.now() - 10 * 86400000).toISOString(), photoUrl: '/uploads/demo-wound-1.jpg', note: 'Sutures intact, mild redness', assessment: 'stable' },
          { _id: 'en-2', date: new Date(Date.now() - 4 * 86400000).toISOString(), photoUrl: '/uploads/demo-wound-2.jpg', note: 'Redness reduced, healing well', assessment: 'improving' }
        ],
        createdAt: new Date(Date.now() - 10 * 86400000).toISOString()
      }
    ],
    total: 1
  },
  '/progress/stats/summary': { active: 1, healed: 0, total: 1 },
  '/doctor/scribe': {
    soap: {
      subjective: 'Patient reports cough and mild fever for 3 days, no breathing difficulty.',
      objective: 'Temp 100.8F, throat mildly congested, chest clear, SpO2 98%.',
      assessment: 'Acute viral upper respiratory infection.',
      plan: 'Symptomatic treatment, hydration, review in 5 days if not improving.'
    },
    icd10Suggestions: [{ code: 'J06.9', description: 'Acute upper respiratory infection, unspecified' }],
    keyFindings: ['No red flags', 'Vitals stable'],
    followUpSuggested: '5 days',
    draftPrescription: {
      diagnosis: 'Acute viral URI', symptoms: ['cough', 'fever'],
      medicines: [
        { name: 'Paracetamol', dosage: '500mg', frequency: '1-0-1', duration: '3 days', timing: 'after-food', notes: 'For fever' },
        { name: 'Cetirizine', dosage: '10mg', frequency: '0-0-1', duration: '5 days', timing: 'bedtime', notes: 'For congestion' }
      ],
      tests: [], advice: 'Rest, warm fluids, steam inhalation.', vitals: { temperature: 100.8, spo2: 98 }
    },
    disclaimer: 'AI-generated draft. Review and edit before signing off.'
  },
  '/doctor/rx-guard': {
    medicines: ['Paracetamol', 'Amoxicillin'],
    patientContext: { ageYears: 6, weightKg: 20, allergies: [], isPediatric: true },
    interactions: [{ drug1: 'Paracetamol', drug2: 'Amoxicillin', severity: 'minor', description: 'No significant interaction expected.' }],
    allergyAlerts: [],
    dosing: [
      { found: true, drug: 'paracetamol', weightKg: 20, perDoseMg: 300, dosesPerDay: 4, frequency: '4 times/day', route: 'oral', note: 'Antipyretic/analgesic.' },
      { found: true, drug: 'amoxicillin', weightKg: 20, perDoseMg: 400, dosesPerDay: 2, frequency: '2 times/day', route: 'oral', note: 'Divided q12h.' }
    ],
    hasCriticalAlerts: false,
    disclaimer: 'Automated safety check for reference only.'
  },
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
  
  if (cleanPath === '/auth/profile') {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {}
    }
  }

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
  if (cleanPath.includes('dashboard/practice')) return DEMO_RESPONSES['/dashboard/practice'];
  if (cleanPath.includes('dashboard/analytic')) return DEMO_RESPONSES['/dashboard/analytics'];
  if (cleanPath.includes('availability')) return DEMO_RESPONSES['/availability'];
  if (cleanPath.includes('doctor/optimize-schedule')) return DEMO_RESPONSES['/doctor/optimize-schedule'];
  if (cleanPath.includes('doctor/patient-risk')) return DEMO_RESPONSES['/doctor/patient-risk'];
  if (cleanPath.includes('doctor/scribe')) return DEMO_RESPONSES['/doctor/scribe'];
  if (cleanPath.includes('doctor/rx-guard')) return DEMO_RESPONSES['/doctor/rx-guard'];
  if (cleanPath.includes('waitlist')) {
    if (cleanPath.includes('stats')) return DEMO_RESPONSES['/waitlist/stats/summary'];
    return DEMO_RESPONSES['/waitlist'];
  }
  if (cleanPath.includes('care-pathway')) {
    if (cleanPath.includes('stats')) return DEMO_RESPONSES['/care-pathways/stats/summary'];
    return DEMO_RESPONSES['/care-pathways'];
  }
  if (cleanPath.includes('progress')) {
    if (cleanPath.includes('stats')) return DEMO_RESPONSES['/progress/stats/summary'];
    return DEMO_RESPONSES['/progress'];
  }
  if (cleanPath.includes('revenue')) return DEMO_RESPONSES['/billing/revenue/summary'];
  if (cleanPath.includes('billing')) return DEMO_RESPONSES['/billing'];
  if (cleanPath.includes('appointment')) return DEMO_RESPONSES['/appointments'];
  if (cleanPath.includes('prescription')) return DEMO_RESPONSES['/prescriptions'];
  if (cleanPath.includes('medicine')) return DEMO_RESPONSES['/medicines'];
  if (cleanPath.includes('expense')) return DEMO_RESPONSES['/expenses'];
  if (cleanPath.includes('labtest') || cleanPath.includes('lab-test')) return DEMO_RESPONSES['/labtests'];
  if (cleanPath.includes('certificate')) {
    if (cleanPath.includes('stats')) return DEMO_RESPONSES['/certificates/stats/summary'];
    return DEMO_RESPONSES['/certificates'];
  }
  if (cleanPath.includes('patient')) return DEMO_RESPONSES['/patients'];

  // Default — return empty but valid response (no error message)
  return {};
}
