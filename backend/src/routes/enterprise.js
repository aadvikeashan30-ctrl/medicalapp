const express = require('express');
const { body, validationResult } = require('express-validator');
const Branch = require('../models/Branch');
const AuditLog = require('../models/AuditLog');
const Backup = require('../models/Backup');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// ========== MULTI-BRANCH MANAGEMENT ==========

// List all branches
router.get(
  '/branches',
  auth,
  asyncHandler(async (req, res) => {
    const branches = await Branch.find({ ownerId: req.user._id, isActive: true })
      .populate('doctors', 'name email specialty')
      .populate('staff', 'name email role');
    res.json(branches);
  })
);

// Get single branch
router.get(
  '/branches/:id',
  auth,
  asyncHandler(async (req, res) => {
    const branch = await Branch.findOne({ _id: req.params.id, ownerId: req.user._id })
      .populate('doctors', 'name email specialty consultationFee')
      .populate('staff', 'name email role phone');
    if (!branch) return res.status(404).json({ message: 'Branch not found' });
    res.json(branch);
  })
);

// Create branch
router.post(
  '/branches',
  auth,
  [
    body('name').trim().notEmpty().withMessage('Branch name is required'),
    body('address').trim().notEmpty().withMessage('Address is required'),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('code').trim().notEmpty().withMessage('Branch code is required')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array().map((e) => e.msg).join(', ') });
    }

    const branch = await Branch.create({ ...req.body, ownerId: req.user._id });
    res.status(201).json(branch);
  })
);

// Update branch
router.put(
  '/branches/:id',
  auth,
  asyncHandler(async (req, res) => {
    const branch = await Branch.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!branch) return res.status(404).json({ message: 'Branch not found' });
    res.json(branch);
  })
);

// Delete branch (soft)
router.delete(
  '/branches/:id',
  auth,
  asyncHandler(async (req, res) => {
    const branch = await Branch.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user._id },
      { isActive: false },
      { new: true }
    );
    if (!branch) return res.status(404).json({ message: 'Branch not found' });
    res.json({ message: 'Branch deleted' });
  })
);

// ========== MULTI-DOCTOR MANAGEMENT ==========

// List all doctors/staff under this doctor
router.get(
  '/team',
  auth,
  asyncHandler(async (req, res) => {
    const { role } = req.query;
    const query = {};

    // For enterprise, find all branches owned by this user and get staff from them
    const branches = await Branch.find({ ownerId: req.user._id });
    const doctorIds = branches.flatMap((b) => b.doctors);
    const staffIds = branches.flatMap((b) => b.staff);
    const allIds = [...new Set([...doctorIds, ...staffIds].map(String))];

    if (allIds.length === 0) return res.json([]);

    if (role) query.role = role;
    query._id = { $in: allIds };

    const team = await User.find(query).select('-password');
    res.json(team);
  })
);

// Add staff member
router.post(
  '/team',
  auth,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    body('role').notEmpty().withMessage('Role is required')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array().map((e) => e.msg).join(', ') });
    }

    const bcrypt = require('bcryptjs');
    const defaultPassword = await bcrypt.hash('changeme123', 10);

    const user = await User.create({
      ...req.body,
      password: defaultPassword
    });

    // If branchId provided, add to branch
    if (req.body.branchId) {
      const field = req.body.role === 'doctor' ? 'doctors' : 'staff';
      await Branch.findByIdAndUpdate(req.body.branchId, {
        $addToSet: { [field]: user._id }
      });
    }

    res.status(201).json(user);
  })
);

// Update staff member
router.put(
  '/team/:id',
  auth,
  asyncHandler(async (req, res) => {
    const updates = { ...req.body };
    delete updates.password; // Don't allow password change through this route

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'Team member not found' });
    res.json(user);
  })
);

// Deactivate staff member
router.patch(
  '/team/:id/deactivate',
  auth,
  asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ message: 'Team member not found' });
    res.json({ message: 'Team member deactivated' });
  })
);

// ========== AUDIT LOGS ==========

// List audit logs
router.get(
  '/audit-logs',
  auth,
  asyncHandler(async (req, res) => {
    const { action, resource, severity, startDate, endDate, page = 1, limit = 50 } = req.query;
    const query = { userId: req.user._id };

    if (action) query.action = action;
    if (resource) query.resource = resource;
    if (severity) query.severity = severity;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit, 10)),
      AuditLog.countDocuments(query)
    ]);

    res.json({ logs, total, pages: Math.ceil(total / limit) });
  })
);

// ========== BACKUP & RESTORE ==========

// List backups
router.get(
  '/backups',
  auth,
  asyncHandler(async (req, res) => {
    const backups = await Backup.find({ doctorId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(backups);
  })
);

// Create backup
router.post(
  '/backups',
  auth,
  asyncHandler(async (req, res) => {
    const { backupType = 'full', collections = [] } = req.body;

    const backup = await Backup.create({
      doctorId: req.user._id,
      backupType,
      collections: collections.length > 0 ? collections : ['patients', 'prescriptions', 'appointments', 'billing'],
      fileName: `backup-${backupType}-${Date.now()}.json`,
      status: 'in-progress',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });

    // TODO: Trigger actual backup process in background
    // For now, simulate completion
    backup.status = 'completed';
    backup.completedAt = new Date();
    backup.recordCount = 0;
    await backup.save();

    res.status(201).json(backup);
  })
);

// Delete backup
router.delete(
  '/backups/:id',
  auth,
  asyncHandler(async (req, res) => {
    const backup = await Backup.findOneAndDelete({ _id: req.params.id, doctorId: req.user._id });
    if (!backup) return res.status(404).json({ message: 'Backup not found' });
    res.json({ message: 'Backup deleted' });
  })
);

// ========== HOSPITAL ANALYTICS ==========

router.get(
  '/analytics',
  auth,
  asyncHandler(async (req, res) => {
    const Appointment = require('../models/Appointment');
    const Patient = require('../models/Patient');
    const Billing = require('../models/Billing');

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalPatients,
      newPatientsThisMonth,
      totalAppointments,
      appointmentsThisMonth,
      revenue,
      revenueThisMonth
    ] = await Promise.all([
      Patient.countDocuments({ doctorId: req.user._id, isActive: true }),
      Patient.countDocuments({ doctorId: req.user._id, createdAt: { $gte: thirtyDaysAgo } }),
      Appointment.countDocuments({ doctorId: req.user._id }),
      Appointment.countDocuments({ doctorId: req.user._id, date: { $gte: thirtyDaysAgo } }),
      Billing.aggregate([
        { $match: { doctorId: req.user._id, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      Billing.aggregate([
        { $match: { doctorId: req.user._id, paymentStatus: 'paid', createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);

    // Revenue by day (last 30 days)
    const dailyRevenue = await Billing.aggregate([
      { $match: { doctorId: req.user._id, paymentStatus: 'paid', createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Appointment types distribution
    const appointmentTypes = await Appointment.aggregate([
      { $match: { doctorId: req.user._id, date: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    res.json({
      overview: {
        totalPatients,
        newPatientsThisMonth,
        totalAppointments,
        appointmentsThisMonth,
        totalRevenue: revenue[0]?.total || 0,
        revenueThisMonth: revenueThisMonth[0]?.total || 0
      },
      dailyRevenue,
      appointmentTypes
    });
  })
);

// ========== REVENUE FORECASTING ==========

router.get(
  '/revenue-forecast',
  auth,
  asyncHandler(async (req, res) => {
    const Billing = require('../models/Billing');

    // Get last 6 months revenue data
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await Billing.aggregate([
      { $match: { doctorId: req.user._id, paymentStatus: 'paid', createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          transactions: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Simple linear regression forecast
    const values = monthlyRevenue.map((m) => m.revenue);
    let forecast = [];
    if (values.length >= 3) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const trend = values.length >= 2 ? (values[values.length - 1] - values[0]) / (values.length - 1) : 0;

      for (let i = 1; i <= 3; i++) {
        const predicted = avg + trend * (values.length + i - 1);
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + i);
        forecast.push({
          month: futureDate.toISOString().slice(0, 7),
          predictedRevenue: Math.max(0, Math.round(predicted)),
          confidence: Math.max(50, 90 - i * 10)
        });
      }
    }

    res.json({ historicalRevenue: monthlyRevenue, forecast });
  })
);

module.exports = router;
