const express = require('express');
const Equipment = require('../models/Equipment');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const DAY = 24 * 60 * 60 * 1000;

// ── List / search equipment ──────────────────────────────────────
router.get(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    const { search, status, limit = 200 } = req.query;
    const query = { doctorId: req.user._id, isActive: true };
    if (status) query.status = status;
    if (search) {
      const safe = escapeRegex(search);
      query.$or = [
        { name: { $regex: safe, $options: 'i' } },
        { serialNo: { $regex: safe, $options: 'i' } },
        { manufacturer: { $regex: safe, $options: 'i' } },
        { location: { $regex: safe, $options: 'i' } }
      ];
    }
    const items = await Equipment.find(query).sort({ name: 1 }).limit(parseInt(limit, 10));
    res.json({ equipment: items, total: items.length });
  })
);

// ── Stats summary ────────────────────────────────────────────────
router.get(
  '/stats/summary',
  auth,
  asyncHandler(async (req, res) => {
    const items = await Equipment.find({ doctorId: req.user._id, isActive: true });
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * DAY);
    const stats = {
      total: items.length,
      operational: items.filter((e) => e.status === 'operational').length,
      maintenance: items.filter((e) => e.status === 'maintenance').length,
      outOfService: items.filter((e) => e.status === 'out-of-service').length,
      serviceDue: items.filter((e) => e.nextServiceDate && new Date(e.nextServiceDate) <= in30).length,
      amcExpiring: items.filter((e) => e.amc?.endDate && new Date(e.amc.endDate) <= in30 && new Date(e.amc.endDate) >= now).length,
      assetValue: Math.round(items.reduce((s, e) => s + (e.purchasePrice || 0), 0))
    };
    res.json(stats);
  })
);

// ── Alerts: service due, AMC expiring/expired, out-of-service ────
router.get(
  '/alerts',
  auth,
  asyncHandler(async (req, res) => {
    const items = await Equipment.find({ doctorId: req.user._id, isActive: true });
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * DAY);
    res.json({
      serviceDue: items.filter((e) => e.nextServiceDate && new Date(e.nextServiceDate) <= in30),
      amcExpiring: items.filter((e) => e.amc?.endDate && new Date(e.amc.endDate) <= in30 && new Date(e.amc.endDate) >= now),
      amcExpired: items.filter((e) => e.amc?.endDate && new Date(e.amc.endDate) < now),
      outOfService: items.filter((e) => e.status === 'out-of-service' || e.status === 'maintenance')
    });
  })
);

// ── Get one ──────────────────────────────────────────────────────
router.get(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const item = await Equipment.findOne({ _id: req.params.id, doctorId: req.user._id });
    if (!item) return res.status(404).json({ message: 'Equipment not found' });
    res.json(item);
  })
);

// ── Create ───────────────────────────────────────────────────────
router.post(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    const body = { ...req.body };
    if (!body.name) return res.status(400).json({ message: 'name is required' });

    // Auto-compute first nextServiceDate if not supplied
    if (!body.nextServiceDate) {
      const interval = Number(body.serviceIntervalDays) || 180;
      const base = body.lastServiceDate ? new Date(body.lastServiceDate) : new Date();
      body.nextServiceDate = new Date(base.getTime() + interval * DAY);
    }
    if (body.amc) body.amc.active = !!body.amc.endDate && new Date(body.amc.endDate) >= new Date();

    const item = await Equipment.create({ ...body, doctorId: req.user._id });
    res.status(201).json(item);
  })
);

// ── Add maintenance log (updates service schedule) ──────────────
router.post(
  '/:id/maintenance',
  auth,
  asyncHandler(async (req, res) => {
    const { date, type, description, cost, technician } = req.body;
    const item = await Equipment.findOne({ _id: req.params.id, doctorId: req.user._id });
    if (!item) return res.status(404).json({ message: 'Equipment not found' });

    const serviceDate = date ? new Date(date) : new Date();
    const interval = item.serviceIntervalDays || 180;
    const nextDue = new Date(serviceDate.getTime() + interval * DAY);

    item.maintenanceLogs.push({ date: serviceDate, type, description, cost: Number(cost) || 0, technician, nextDue });
    item.lastServiceDate = serviceDate;
    item.nextServiceDate = nextDue;
    if (item.status === 'maintenance') item.status = 'operational';
    await item.save();
    res.status(201).json(item);
  })
);

// ── Update ───────────────────────────────────────────────────────
router.put(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const updates = {};
    const allowed = ['name', 'category', 'serialNo', 'model', 'manufacturer', 'location', 'status', 'purchaseDate', 'purchasePrice', 'serviceIntervalDays', 'lastServiceDate', 'nextServiceDate', 'amc', 'notes', 'isActive'];
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    if (updates.amc) updates.amc.active = !!updates.amc.endDate && new Date(updates.amc.endDate) >= new Date();
    const item = await Equipment.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.user._id },
      updates,
      { new: true, runValidators: true }
    );
    if (!item) return res.status(404).json({ message: 'Equipment not found' });
    res.json(item);
  })
);

// ── Delete (soft) ────────────────────────────────────────────────
router.delete(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const item = await Equipment.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.user._id },
      { isActive: false },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: 'Equipment not found' });
    res.json({ message: 'Equipment removed' });
  })
);

module.exports = router;
