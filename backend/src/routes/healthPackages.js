const express = require('express');
const { body, validationResult } = require('express-validator');
const { HealthPackage, PackageBooking } = require('../models/HealthPackage');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// ========== HEALTH PACKAGES ==========

// List all packages
router.get(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    const { category, isActive = 'true' } = req.query;
    const query = { doctorId: req.user._id };
    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const packages = await HealthPackage.find(query).sort({ isFeatured: -1, packagePrice: 1 });
    res.json(packages);
  })
);

// Get single package
router.get(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const pkg = await HealthPackage.findOne({ _id: req.params.id, doctorId: req.user._id });
    if (!pkg) return res.status(404).json({ message: 'Package not found' });
    res.json(pkg);
  })
);

// Create package
router.post(
  '/',
  auth,
  [
    body('name').trim().notEmpty().withMessage('Package name is required'),
    body('totalValue').isNumeric().withMessage('Total value is required'),
    body('packagePrice').isNumeric().withMessage('Package price is required')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array().map((e) => e.msg).join(', ') });
    }

    const data = { ...req.body, doctorId: req.user._id };
    if (data.totalValue && data.packagePrice) {
      data.discountPercentage = Math.round(((data.totalValue - data.packagePrice) / data.totalValue) * 100);
    }

    const pkg = await HealthPackage.create(data);
    res.status(201).json(pkg);
  })
);

// Update package
router.put(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const updates = { ...req.body };
    delete updates.doctorId;

    if (updates.totalValue && updates.packagePrice) {
      updates.discountPercentage = Math.round(((updates.totalValue - updates.packagePrice) / updates.totalValue) * 100);
    }

    const pkg = await HealthPackage.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.user._id },
      updates,
      { new: true, runValidators: true }
    );
    if (!pkg) return res.status(404).json({ message: 'Package not found' });
    res.json(pkg);
  })
);

// Delete package (soft)
router.delete(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const pkg = await HealthPackage.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.user._id },
      { isActive: false },
      { new: true }
    );
    if (!pkg) return res.status(404).json({ message: 'Package not found' });
    res.json({ message: 'Package deleted' });
  })
);

// ========== PACKAGE BOOKINGS ==========

// List bookings
router.get(
  '/bookings/list',
  auth,
  asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { doctorId: req.user._id };
    if (status) query.status = status;

    const [bookings, total] = await Promise.all([
      PackageBooking.find(query)
        .populate('patientId', 'name phone')
        .populate('packageId', 'name packagePrice')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit, 10)),
      PackageBooking.countDocuments(query)
    ]);

    res.json({ bookings, total, pages: Math.ceil(total / limit) });
  })
);

// Create booking
router.post(
  '/bookings',
  auth,
  [
    body('patientId').notEmpty().withMessage('Patient ID is required'),
    body('packageId').notEmpty().withMessage('Package ID is required')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array().map((e) => e.msg).join(', ') });
    }

    const pkg = await HealthPackage.findById(req.body.packageId);
    if (!pkg) return res.status(404).json({ message: 'Package not found' });

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + (pkg.validityDays || 365));

    const booking = await PackageBooking.create({
      ...req.body,
      doctorId: req.user._id,
      amountPaid: pkg.packagePrice,
      validUntil
    });

    // Increment bookings count
    pkg.bookingsCount += 1;
    await pkg.save();

    res.status(201).json(booking);
  })
);

// Update booking progress
router.patch(
  '/bookings/:id/complete-service',
  auth,
  asyncHandler(async (req, res) => {
    const { serviceName, result, notes } = req.body;

    const booking = await PackageBooking.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.user._id },
      {
        $push: {
          servicesCompleted: { serviceName, completedAt: new Date(), result, notes }
        }
      },
      { new: true }
    ).populate('packageId');

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Check if all services completed
    if (booking.packageId && booking.servicesCompleted.length >= booking.packageId.services.length) {
      booking.status = 'completed';
      await booking.save();
    }

    res.json(booking);
  })
);

module.exports = router;
