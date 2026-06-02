const express = require('express');
const Medicine = require('../models/Medicine');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Search/list medicines for the logged-in doctor
router.get(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    const { search, limit = 20 } = req.query;
    const query = { doctorId: req.user._id };
    if (search) {
      const safe = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: safe, $options: 'i' } },
        { genericName: { $regex: safe, $options: 'i' } }
      ];
    }
    const medicines = await Medicine.find(query)
      .sort({ usageCount: -1, name: 1 })
      .limit(parseInt(limit, 10));
    res.json(medicines);
  })
);

// Add medicine to library
router.post(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    if (!req.body.name) return res.status(400).json({ message: 'name is required' });
    const medicine = await Medicine.create({ ...req.body, doctorId: req.user._id });
    res.status(201).json(medicine);
  })
);

// Update
router.put(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const med = await Medicine.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!med) return res.status(404).json({ message: 'Medicine not found' });
    res.json(med);
  })
);

// Delete
router.delete(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const result = await Medicine.findOneAndDelete({ _id: req.params.id, doctorId: req.user._id });
    if (!result) return res.status(404).json({ message: 'Medicine not found' });
    res.json({ message: 'Medicine deleted' });
  })
);

module.exports = router;
