/**
 * Demo seed script.
 *
 *   npm run seed              # uses default demo doctor
 *   npm run seed -- --reset   # wipe demo doctor + all related data first
 *
 * Default credentials:
 *   email:    demo@docclinic.com
 *   password: demo1234
 *
 * Idempotent: re-running without --reset will keep existing demo data.
 */

require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const logger = require('../utils/logger');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const Billing = require('../models/Billing');
const Medicine = require('../models/Medicine');
const { Counter } = require('../models/Counter');

const DEMO_EMAIL = 'demo@docclinic.com';
const DEMO_PASSWORD = 'demo1234';

const wantsReset = process.argv.includes('--reset');

const SAMPLE_PATIENTS = [
  {
    name: 'Ramesh Kumar', phone: '9876543210', age: 45, gender: 'male',
    bloodGroup: 'B+', city: 'Mumbai', allergies: ['Penicillin'],
    medicalHistory: ['Hypertension']
  },
  {
    name: 'Priya Sharma', phone: '9876543211', age: 32, gender: 'female',
    bloodGroup: 'O+', city: 'Mumbai', allergies: []
  },
  {
    name: 'Amit Patel', phone: '9876543212', age: 28, gender: 'male',
    bloodGroup: 'A+', city: 'Pune'
  },
  {
    name: 'Sunita Reddy', phone: '9876543213', age: 55, gender: 'female',
    bloodGroup: 'AB+', city: 'Mumbai',
    medicalHistory: ['Diabetes Type 2']
  },
  {
    name: 'Vikram Singh', phone: '9876543214', age: 38, gender: 'male',
    bloodGroup: 'B-', city: 'Delhi'
  }
];

const SAMPLE_MEDICINES = [
  { name: 'Paracetamol', strength: '500mg', form: 'tablet', defaultFrequency: '1-0-1', defaultDuration: '3 days', defaultTiming: 'after-food' },
  { name: 'Amoxicillin', strength: '500mg', form: 'capsule', defaultFrequency: '1-1-1', defaultDuration: '5 days', defaultTiming: 'after-food' },
  { name: 'Metformin', strength: '500mg', form: 'tablet', defaultFrequency: '1-0-1', defaultDuration: '30 days', defaultTiming: 'after-food' },
  { name: 'Atorvastatin', strength: '10mg', form: 'tablet', defaultFrequency: '0-0-1', defaultDuration: '30 days', defaultTiming: 'bedtime' },
  { name: 'Omeprazole', strength: '20mg', form: 'capsule', defaultFrequency: '1-0-0', defaultDuration: '14 days', defaultTiming: 'before-food' }
];

async function ensureDemoDoctor() {
  let doctor = await User.findOne({ email: DEMO_EMAIL });
  if (doctor) {
    logger.info(`Demo doctor already exists: ${doctor.email} (${doctor._id})`);
    return { doctor, created: false };
  }
  doctor = await User.create({
    name: 'Demo Doctor',
    email: DEMO_EMAIL,
    password: await bcrypt.hash(DEMO_PASSWORD, 10),
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
    planExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
  });
  logger.info(`Created demo doctor: ${doctor.email}`);
  return { doctor, created: true };
}

async function resetForDoctor(doctorId) {
  logger.warn(`Resetting all demo data for doctor ${doctorId}...`);
  const filter = { doctorId };
  const [b, p, a, rx, m] = await Promise.all([
    Billing.deleteMany(filter),
    Patient.deleteMany(filter),
    Appointment.deleteMany(filter),
    Prescription.deleteMany(filter),
    Medicine.deleteMany(filter)
  ]);
  // Reset counters scoped to this doctor (patient, rx, invoice, daily tokens)
  const counterRes = await Counter.deleteMany({
    key: new RegExp(`:${doctorId}(:|$)`)
  });
  logger.info(
    `Deleted: bills=${b.deletedCount} patients=${p.deletedCount} ` +
    `appts=${a.deletedCount} rx=${rx.deletedCount} meds=${m.deletedCount} ` +
    `counters=${counterRes.deletedCount}`
  );
}

async function seedMedicines(doctorId) {
  if ((await Medicine.countDocuments({ doctorId })) > 0) return;
  await Medicine.insertMany(SAMPLE_MEDICINES.map((m) => ({ ...m, doctorId })));
  logger.info(`Seeded ${SAMPLE_MEDICINES.length} medicines into doctor's library.`);
}

async function seedPatients(doctorId) {
  const existing = await Patient.countDocuments({ doctorId });
  if (existing > 0) {
    logger.info(`Doctor already has ${existing} patients; skipping patient seed.`);
    return Patient.find({ doctorId }).sort({ createdAt: 1 }).limit(SAMPLE_PATIENTS.length);
  }
  // Save one-by-one so the pre-save hook generates patientId via Counter
  const created = [];
  for (const p of SAMPLE_PATIENTS) {
    const doc = await Patient.create({ ...p, doctorId });
    created.push(doc);
  }
  logger.info(`Seeded ${created.length} patients.`);
  return created;
}

async function seedAppointments(doctorId, patients) {
  if ((await Appointment.countDocuments({ doctorId })) > 0) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const slots = [
    { time: '09:00 AM', status: 'completed', type: 'consultation' },
    { time: '09:30 AM', status: 'completed', type: 'follow-up' },
    { time: '10:00 AM', status: 'in-progress', type: 'consultation' },
    { time: '10:30 AM', status: 'scheduled', type: 'consultation' },
    { time: '11:00 AM', status: 'scheduled', type: 'checkup' }
  ];

  // One on today, one on tomorrow per patient (cycling slots)
  const created = [];
  for (let i = 0; i < patients.length; i += 1) {
    const slot = slots[i % slots.length];
    const apt = await Appointment.create({
      doctorId,
      patientId: patients[i]._id,
      date: today,
      timeSlot: slot.time,
      type: slot.type,
      status: slot.status,
      symptoms: 'Demo appointment'
    });
    created.push(apt);
  }
  // One future appointment for the first patient
  if (patients[0]) {
    await Appointment.create({
      doctorId,
      patientId: patients[0]._id,
      date: tomorrow,
      timeSlot: '10:00 AM',
      type: 'follow-up',
      status: 'scheduled'
    });
  }
  logger.info(`Seeded ${created.length + 1} appointments.`);
  return created;
}

async function seedPrescriptions(doctorId, patients) {
  if ((await Prescription.countDocuments({ doctorId, isTemplate: false })) > 0) return;
  const samples = [
    {
      patient: patients[0],
      diagnosis: 'Hypertension follow-up',
      medicines: [
        { name: 'Amlodipine', dosage: '5mg', frequency: '1-0-0', duration: '30 days', timing: 'after-food' },
        { name: 'Atorvastatin', dosage: '10mg', frequency: '0-0-1', duration: '30 days', timing: 'bedtime' }
      ],
      advice: 'Low-salt diet, daily 30-min walk. Recheck BP in 2 weeks.',
      vitals: { bp: '140/90', pulse: 78, weight: 80 }
    },
    {
      patient: patients[1],
      diagnosis: 'Viral fever',
      medicines: [
        { name: 'Paracetamol', dosage: '500mg', frequency: '1-1-1', duration: '3 days', timing: 'after-food' }
      ],
      advice: 'Plenty of fluids, rest. Return if fever persists beyond 3 days.',
      vitals: { temperature: 101.2, weight: 58 }
    },
    {
      patient: patients[3],
      diagnosis: 'Type 2 Diabetes - routine review',
      medicines: [
        { name: 'Metformin', dosage: '500mg', frequency: '1-0-1', duration: '30 days', timing: 'after-food' }
      ],
      advice: 'Continue diet plan. Fasting glucose in 1 month.',
      vitals: { bp: '130/85', weight: 72 }
    }
  ];

  let count = 0;
  for (const s of samples) {
    if (!s.patient) continue;
    await Prescription.create({
      doctorId,
      patientId: s.patient._id,
      diagnosis: s.diagnosis,
      medicines: s.medicines,
      advice: s.advice,
      vitals: s.vitals
    });
    count += 1;
  }
  logger.info(`Seeded ${count} prescriptions.`);
}

async function seedBills(doctorId, patients) {
  if ((await Billing.countDocuments({ doctorId })) > 0) return;
  const samples = [
    {
      patient: patients[0],
      items: [{ description: 'Consultation', amount: 500, quantity: 1 }],
      paidAmount: 500, status: 'paid'
    },
    {
      patient: patients[1],
      items: [
        { description: 'Consultation', amount: 500, quantity: 1 },
        { description: 'CBC Test', amount: 350, quantity: 1 }
      ],
      paidAmount: 850, status: 'paid'
    },
    {
      patient: patients[2],
      items: [{ description: 'Consultation', amount: 500, quantity: 1 }],
      paidAmount: 0, status: 'pending'
    },
    {
      patient: patients[3],
      items: [
        { description: 'Follow-up Consultation', amount: 300, quantity: 1 },
        { description: 'HbA1c Test', amount: 600, quantity: 1 }
      ],
      paidAmount: 500, status: 'partial'
    }
  ];

  let count = 0;
  for (const s of samples) {
    if (!s.patient) continue;
    const subtotal = s.items.reduce((sum, i) => sum + i.amount * i.quantity, 0);
    await Billing.create({
      doctorId,
      patientId: s.patient._id,
      items: s.items,
      subtotal,
      totalAmount: subtotal,
      paidAmount: s.paidAmount,
      paymentMethod: 'cash',
      paymentStatus: s.status
    });
    count += 1;
  }
  logger.info(`Seeded ${count} bills.`);
}

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/doctor-clinic';
  logger.info(`Connecting to ${uri}...`);
  await mongoose.connect(uri);

  const { doctor, created } = await ensureDemoDoctor();

  if (wantsReset && !created) {
    await resetForDoctor(doctor._id);
  }

  const patients = await seedPatients(doctor._id);
  await seedMedicines(doctor._id);
  await seedAppointments(doctor._id, patients);
  await seedPrescriptions(doctor._id, patients);
  await seedBills(doctor._id, patients);

  logger.info('====================================================================');
  logger.info('Seed complete. You can now log in with:');
  logger.info(`  email:    ${DEMO_EMAIL}`);
  logger.info(`  password: ${DEMO_PASSWORD}`);
  logger.info('====================================================================');

  await mongoose.connection.close();
  process.exit(0);
}

run().catch(async (err) => {
  logger.error(`Seed failed: ${err.stack || err.message}`);
  try {
    await mongoose.connection.close();
  } catch (_) {
    /* ignore */
  }
  process.exit(1);
});
