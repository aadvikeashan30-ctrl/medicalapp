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
  '/fulfillment': {
    records: [
      { _id: 'ff-1', patientName: 'Ramesh Kumar', source: 'prescription', type: 'pharmacy', items: [{ name: 'Amlodipine', quantity: 1, estimatedValue: 80 }, { name: 'Atorvastatin', quantity: 1, estimatedValue: 80 }], estimatedValue: 160, destination: 'internal', status: 'fulfilled', createdAt: '2025-05-20' },
      { _id: 'ff-2', patientName: 'Sunita Reddy', source: 'lab', type: 'lab', items: [{ name: 'HbA1c', quantity: 1, estimatedValue: 400 }], estimatedValue: 400, destination: 'internal', status: 'routed', createdAt: '2025-05-28' },
      { _id: 'ff-3', patientName: 'Priya Sharma', source: 'imaging', type: 'imaging', items: [{ name: 'Chest X-Ray', quantity: 1, estimatedValue: 400 }], estimatedValue: 400, destination: 'external', status: 'routed', createdAt: '2025-05-26' }
    ],
    total: 3
  },
  '/fulfillment/stats/summary': { retainedRevenue: 560, retainedCount: 2, leakedRevenue: 400, leakedCount: 1, captureRate: 58, byType: { pharmacy: 1, lab: 1, imaging: 1 }, pending: 2 },
  '/insurance/providers': { providers: [
    { key: 'star health', name: 'Star Health', coverage: 80, copay: 20, network: true },
    { key: 'hdfc ergo', name: 'HDFC Ergo', coverage: 75, copay: 25, network: true },
    { key: 'new india', name: 'New India', coverage: 85, copay: 15, network: true },
    { key: 'care health', name: 'Care Health', coverage: 80, copay: 20, network: true }
  ] },
  '/rpm': {
    records: [
      { _id: 'rpm-1', patientName: 'Ramesh Kumar', patientId: { name: 'Ramesh Kumar', patientId: 'PAT-0001' }, deviceType: 'bp-cuff', condition: 'Hypertension', status: 'active', setupBilled: true, enrolledDate: new Date(Date.now() - 40 * 86400000).toISOString(), logs: [], billing: { month: new Date().toISOString().slice(0, 7), minutes: 27, daysTransmitted: 18, codes: [{ code: '99454', label: 'Device supply + daily readings (16+ days)', rate: 4800, units: 1 }, { code: '99457', label: 'First 20 min monitoring / month', rate: 4000, units: 1 }], estimatedReimbursement: 8800 } },
      { _id: 'rpm-2', patientName: 'Sunita Reddy', patientId: { name: 'Sunita Reddy', patientId: 'PAT-0004' }, deviceType: 'cgm', condition: 'Type 2 Diabetes', status: 'active', setupBilled: false, enrolledDate: new Date(Date.now() - 5 * 86400000).toISOString(), logs: [], billing: { month: new Date().toISOString().slice(0, 7), minutes: 8, daysTransmitted: 6, codes: [{ code: '99453', label: 'Initial device setup & education', rate: 1500, units: 1 }], estimatedReimbursement: 1500 } }
    ],
    total: 2
  },
  '/rpm/stats/summary': { enrolled: 2, active: 2, totalMinutes: 35, estimatedReimbursement: 10300, readyToBill: 2 },
  '/subscription/seats': { plan: 'pro', seatsUsed: 3, seatLimit: 5, seatsAvailable: 2, pricePerSeat: 249, monthlyCommitment: 747, trial: { active: false, daysRemaining: 320, lengthDays: 60 } },
  '/async-consults': {
    consults: [
      { _id: 'ac-1', patientName: 'Amit Patel', patientPhone: '9876543212', category: 'dermatology', description: 'Itchy red rash on forearm for 4 days, spreading slowly.', photos: [], priority: 'normal', status: 'pending', createdAt: new Date(Date.now() - 2 * 3600000).toISOString() },
      { _id: 'ac-2', patientName: 'Ramesh Kumar', patientPhone: '9876543210', category: 'wound-check', description: 'Post-op wound looks slightly red around edges. Normal?', photos: [], priority: 'high', status: 'in-review', createdAt: new Date(Date.now() - 6 * 3600000).toISOString() },
      { _id: 'ac-3', patientName: 'Priya Sharma', patientPhone: '9876543211', category: 'medication-query', description: 'Can I take my BP medicine with the new antibiotic?', photos: [], priority: 'normal', status: 'responded', response: { text: 'Yes, safe together. Space 2 hours apart.', respondedAt: new Date(Date.now() - 86400000).toISOString() }, createdAt: new Date(Date.now() - 90000000).toISOString() }
    ],
    total: 3
  },
  '/async-consults/stats/summary': { pending: 1, inReview: 1, responded: 1, high: 1, openTotal: 2 },
  '/wearables': {
    devices: [
      { _id: 'wd-1', patientName: 'Sunita Reddy', patientId: { name: 'Sunita Reddy', patientId: 'PAT-0004' }, deviceType: 'cgm', metric: 'glucose', unit: 'mg/dL', thresholds: { min: 70, max: 180 }, status: 'connected', alertActive: true, lastSyncedAt: new Date(Date.now() - 1800000).toISOString(), readings: [{ _id: 'r1', value: 165, takenAt: new Date(Date.now() - 5 * 3600000).toISOString(), flagged: false }, { _id: 'r2', value: 192, takenAt: new Date(Date.now() - 3600000).toISOString(), flagged: true }] },
      { _id: 'wd-2', patientName: 'Ramesh Kumar', patientId: { name: 'Ramesh Kumar', patientId: 'PAT-0001' }, deviceType: 'bp-cuff', metric: 'blood-pressure', unit: 'mmHg', thresholds: { min: 90, max: 140, minSecondary: 60, maxSecondary: 90 }, status: 'connected', alertActive: false, lastSyncedAt: new Date(Date.now() - 7200000).toISOString(), readings: [{ _id: 'r3', value: 128, secondaryValue: 82, takenAt: new Date(Date.now() - 7200000).toISOString(), flagged: false }] }
    ],
    total: 2
  },
  '/wearables/stats/summary': { connected: 2, alerts: 1, total: 2 },
  '/fhir/metadata': { resourceType: 'CapabilityStatement', status: 'active', fhirVersion: '4.0.1', format: ['json'], publisher: 'DocClinic Pro', externalServer: null, rest: [{ mode: 'server', resource: [{ type: 'Patient' }, { type: 'Appointment' }, { type: 'MedicationRequest' }] }] },
  '/sos': { alerts: [
    { _id: 'sos-1', patientName: 'Ramesh Kumar', patientPhone: '9876543210', type: 'cardiac', location: 'Home - 12 MG Road', status: 'active', note: 'Severe chest pain', createdAt: new Date(Date.now() - 8 * 60000).toISOString() },
    { _id: 'sos-2', patientName: 'Sunita Reddy', patientPhone: '9876543213', type: 'fall', location: 'Bathroom', status: 'dispatched', note: 'Elderly fall, conscious', createdAt: new Date(Date.now() - 40 * 60000).toISOString() }
  ], total: 2 },
  '/sos/stats/summary': { active: 2, resolved: 0, total: 2 },
  '/attendance': { records: [
    { _id: 'att-1', staffName: 'Receptionist Mary', role: 'receptionist', date: new Date().toISOString().slice(0, 10), checkIn: new Date(new Date().setHours(9, 5)).toISOString(), status: 'on-duty', hours: 0 },
    { _id: 'att-2', staffName: 'Nurse Nancy', role: 'nurse', date: new Date().toISOString().slice(0, 10), checkIn: new Date(new Date().setHours(8, 50)).toISOString(), checkOut: new Date(new Date().setHours(13, 0)).toISOString(), status: 'present', hours: 4.2 },
    { _id: 'att-3', staffName: 'Lab Tech Raj', role: 'staff', date: new Date().toISOString().slice(0, 10), status: 'leave', hours: 0 }
  ], total: 3 },
  '/attendance/stats/summary': { date: new Date().toISOString().slice(0, 10), present: 2, onDuty: 1, leave: 1, total: 3 },
  '/payroll': { slips: [
    { _id: 'pay-1', staffName: 'Receptionist Mary', role: 'receptionist', month: new Date().toISOString().slice(0, 7), baseSalary: 22000, allowances: 2000, deductions: 1000, daysPresent: 24, netPay: 23000, status: 'paid' },
    { _id: 'pay-2', staffName: 'Nurse Nancy', role: 'nurse', month: new Date().toISOString().slice(0, 7), baseSalary: 28000, allowances: 3000, deductions: 1500, daysPresent: 25, netPay: 29500, status: 'approved' },
    { _id: 'pay-3', staffName: 'Lab Tech Raj', role: 'staff', month: new Date().toISOString().slice(0, 7), baseSalary: 24000, allowances: 1500, deductions: 800, daysPresent: 22, netPay: 24700, status: 'draft' }
  ], total: 3 },
  '/payroll/stats/summary': { month: new Date().toISOString().slice(0, 7), totalPayout: 77200, paid: 1, pending: 2, count: 3 },
  '/reactivation/lapsed': { patients: [
    { _id: 'pat-5', name: 'Vikram Singh', phone: '9876543214', patientId: 'PAT-0005', lastVisit: new Date(Date.now() - 200 * 86400000).toISOString(), totalVisits: 2, totalBilled: 1000, daysSinceVisit: 200, lastOutreach: null },
    { _id: 'pat-2', name: 'Priya Sharma', phone: '9876543211', patientId: 'PAT-0002', lastVisit: new Date(Date.now() - 150 * 86400000).toISOString(), totalVisits: 5, totalBilled: 2500, daysSinceVisit: 150, lastOutreach: { status: 'contacted', at: new Date(Date.now() - 5 * 86400000).toISOString() } }
  ], total: 2, thresholdDays: 120 },
  '/reactivation/stats/summary': { lapsed: 2, contacted: 1, rebooked: 0, potentialRevenue: 1000 },
  '/doctor/slot-plan': {
    total: 5,
    morningBlock: { label: 'Short / virtual follow-ups (AM)', count: 2, items: [{ patient: 'Priya Sharma', type: 'follow-up', mode: 'video', duration: 15, suggestedSlot: '09:00' }, { patient: 'Ramesh Kumar', type: 'follow-up', mode: 'phone', duration: 10, suggestedSlot: '09:15' }] },
    afternoonBlock: { label: 'Complex / in-person evaluations (PM)', count: 2, items: [{ patient: 'Amit Patel', type: 'consultation', mode: 'in-person', duration: 30, suggestedSlot: '14:00' }, { patient: 'Sunita Reddy', type: 'consultation', mode: 'in-person', duration: 30, suggestedSlot: '14:30' }] },
    rationale: ['Batch quick virtual follow-ups early.', 'Reserve afternoons for in-person evaluations.', 'Group similar modes to cut context-switching.']
  },
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
  if (cleanPath.includes('fulfillment')) {
    if (cleanPath.includes('stats')) return DEMO_RESPONSES['/fulfillment/stats/summary'];
    return DEMO_RESPONSES['/fulfillment'];
  }
  if (cleanPath.includes('insurance/provider')) return DEMO_RESPONSES['/insurance/providers'];
  if (cleanPath.includes('subscription/seats')) return DEMO_RESPONSES['/subscription/seats'];
  if (cleanPath.includes('rpm')) {
    if (cleanPath.includes('stats')) return DEMO_RESPONSES['/rpm/stats/summary'];
    return DEMO_RESPONSES['/rpm'];
  }
  if (cleanPath.includes('async-consult')) {
    if (cleanPath.includes('stats')) return DEMO_RESPONSES['/async-consults/stats/summary'];
    return DEMO_RESPONSES['/async-consults'];
  }
  if (cleanPath.includes('wearable')) {
    if (cleanPath.includes('stats')) return DEMO_RESPONSES['/wearables/stats/summary'];
    return DEMO_RESPONSES['/wearables'];
  }
  if (cleanPath.includes('slot-plan')) return DEMO_RESPONSES['/doctor/slot-plan'];
  if (cleanPath.includes('fhir')) return DEMO_RESPONSES['/fhir/metadata'];
  if (cleanPath.includes('sos')) {
    if (cleanPath.includes('stats')) return DEMO_RESPONSES['/sos/stats/summary'];
    return DEMO_RESPONSES['/sos'];
  }
  if (cleanPath.includes('attendance')) {
    if (cleanPath.includes('stats')) return DEMO_RESPONSES['/attendance/stats/summary'];
    return DEMO_RESPONSES['/attendance'];
  }
  if (cleanPath.includes('payroll')) {
    if (cleanPath.includes('stats')) return DEMO_RESPONSES['/payroll/stats/summary'];
    return DEMO_RESPONSES['/payroll'];
  }
  if (cleanPath.includes('reactivation')) {
    if (cleanPath.includes('stats')) return DEMO_RESPONSES['/reactivation/stats/summary'];
    return DEMO_RESPONSES['/reactivation/lapsed'];
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
