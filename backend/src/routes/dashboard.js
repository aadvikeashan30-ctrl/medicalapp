const express = require('express');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Billing = require('../models/Billing');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

router.get(
  '/stats',
  auth,
  asyncHandler(async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      totalPatients,
      todayAppointments,
      monthRevenue,
      todayCompleted,
      pendingPayments,
      newPatientsThisMonth
    ] = await Promise.all([
      Patient.countDocuments({ doctorId: req.user._id, isActive: true }),
      Appointment.countDocuments({ doctorId: req.user._id, date: { $gte: today, $lt: tomorrow } }),
      Billing.aggregate([
        {
          $match: {
            doctorId: req.user._id,
            createdAt: { $gte: startOfMonth },
            paymentStatus: { $in: ['paid', 'partial'] }
          }
        },
        { $group: { _id: null, total: { $sum: '$paidAmount' } } }
      ]),
      Appointment.countDocuments({
        doctorId: req.user._id,
        date: { $gte: today, $lt: tomorrow },
        status: 'completed'
      }),
      Billing.countDocuments({ doctorId: req.user._id, paymentStatus: 'pending' }),
      Patient.countDocuments({ doctorId: req.user._id, createdAt: { $gte: startOfMonth } })
    ]);

    res.json({
      totalPatients,
      todayAppointments,
      monthRevenue: monthRevenue[0]?.total || 0,
      todayCompleted,
      pendingPayments,
      newPatientsThisMonth
    });
  })
);

router.get(
  '/recent',
  auth,
  asyncHandler(async (req, res) => {
    const [recentPatients, recentAppointments] = await Promise.all([
      Patient.find({ doctorId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name phone patientId createdAt'),
      Appointment.find({ doctorId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('patientId', 'name phone patientId')
    ]);
    res.json({ recentPatients, recentAppointments });
  })
);

router.get(
  '/analytics',
  auth,
  asyncHandler(async (req, res) => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [monthlyRevenue, monthlyPatients] = await Promise.all([
      Billing.aggregate([
        { $match: { doctorId: req.user._id, createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            revenue: { $sum: '$paidAmount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Patient.aggregate([
        { $match: { doctorId: req.user._id, createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({ monthlyRevenue, monthlyPatients });
  })
);

// ── Doctor Practice Insights ──────────────────────────────────────
// Top diagnoses, prescribing patterns, no-show rate, peak hours, type mix
router.get(
  '/practice',
  auth,
  asyncHandler(async (req, res) => {
    const Prescription = require('../models/Prescription');
    const doctorId = req.user._id;

    const days = parseInt(req.query.days, 10) || 90;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [
      apptAgg,
      typeAgg,
      hourAgg,
      diagAgg,
      medsAgg,
      totalRx
    ] = await Promise.all([
      // Appointment status counts (for completion / no-show rates)
      Appointment.aggregate([
        { $match: { doctorId, date: { $gte: since } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      // Appointment type distribution
      Appointment.aggregate([
        { $match: { doctorId, date: { $gte: since } } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      // Peak booking hours (parsed from timeSlot like "10:00 AM")
      Appointment.aggregate([
        { $match: { doctorId, date: { $gte: since }, timeSlot: { $exists: true, $ne: null } } },
        { $group: { _id: '$timeSlot', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 }
      ]),
      // Top diagnoses from prescriptions
      Prescription.aggregate([
        { $match: { doctorId, isTemplate: { $ne: true }, diagnosis: { $exists: true, $ne: '' }, createdAt: { $gte: since } } },
        { $group: { _id: { $toLower: '$diagnosis' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      // Top prescribed medicines
      Prescription.aggregate([
        { $match: { doctorId, isTemplate: { $ne: true }, createdAt: { $gte: since } } },
        { $unwind: '$medicines' },
        { $group: { _id: { $toLower: '$medicines.name' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      Prescription.countDocuments({ doctorId, isTemplate: { $ne: true }, createdAt: { $gte: since } })
    ]);

    const statusCounts = apptAgg.reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {});
    const totalAppts = apptAgg.reduce((sum, s) => sum + s.count, 0);
    const completed = statusCounts.completed || statusCounts.CONSULTATION_COMPLETED || 0;
    const noShow = statusCounts['no-show'] || 0;
    const cancelled = statusCounts.cancelled || 0;

    const pct = (n) => (totalAppts ? Math.round((n / totalAppts) * 100) : 0);

    res.json({
      periodDays: days,
      totals: { appointments: totalAppts, prescriptions: totalRx },
      appointmentMetrics: {
        completed,
        noShow,
        cancelled,
        completionRate: pct(completed),
        noShowRate: pct(noShow),
        cancellationRate: pct(cancelled)
      },
      appointmentTypes: typeAgg.map((t) => ({ type: t._id || 'unknown', count: t.count })),
      peakHours: hourAgg.map((h) => ({ slot: h._id, count: h.count })),
      topDiagnoses: diagAgg.map((d) => ({ diagnosis: d._id, count: d.count })),
      topMedicines: medsAgg.map((m) => ({ medicine: m._id, count: m.count }))
    });
  })
);

module.exports = router;
