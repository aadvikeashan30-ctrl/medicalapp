const express = require('express');
const Expense = require('../models/Expense');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// List expenses with filters
router.get(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    const { category, startDate, endDate, limit = 50, skip = 0 } = req.query;
    const query = { doctorId: req.user._id };

    if (category) query.category = category;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const [expenses, total] = await Promise.all([
      Expense.find(query)
        .sort({ date: -1 })
        .skip(parseInt(skip, 10))
        .limit(parseInt(limit, 10)),
      Expense.countDocuments(query)
    ]);

    res.json({ expenses, total });
  })
);

// Get expense summary (category totals, monthly totals)
router.get(
  '/summary',
  auth,
  asyncHandler(async (req, res) => {
    const doctorId = req.user._id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [thisMonth, thisYear, byCategory, monthlyTrend] = await Promise.all([
      Expense.aggregate([
        { $match: { doctorId, date: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]),
      Expense.aggregate([
        { $match: { doctorId, date: { $gte: startOfYear } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Expense.aggregate([
        { $match: { doctorId, date: { $gte: startOfYear } } },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } }
      ]),
      Expense.aggregate([
        { $match: { doctorId, date: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({
      thisMonth: thisMonth[0]?.total || 0,
      thisMonthCount: thisMonth[0]?.count || 0,
      thisYear: thisYear[0]?.total || 0,
      byCategory,
      monthlyTrend
    });
  })
);

// Create expense
router.post(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    const { category, description, amount, date, vendor, paymentMethod, isRecurring, recurringFrequency, receiptUrl, notes, tags } = req.body;

    if (!category || !description || !amount) {
      return res.status(400).json({ message: 'category, description, and amount are required' });
    }

    const expense = await Expense.create({
      doctorId: req.user._id,
      category,
      description,
      amount: Number(amount),
      date: date || new Date(),
      vendor,
      paymentMethod,
      isRecurring: !!isRecurring,
      recurringFrequency: isRecurring ? recurringFrequency : '',
      receiptUrl,
      notes,
      tags: tags || []
    });

    res.status(201).json(expense);
  })
);

// Update expense
router.put(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const updates = {};
    const allowed = ['category', 'description', 'amount', 'date', 'vendor', 'paymentMethod', 'isRecurring', 'recurringFrequency', 'receiptUrl', 'notes', 'tags'];
    allowed.forEach(key => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });
    if (updates.amount) updates.amount = Number(updates.amount);

    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json(expense);
  })
);

// Delete expense
router.delete(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const result = await Expense.findOneAndDelete({ _id: req.params.id, doctorId: req.user._id });
    if (!result) return res.status(404).json({ message: 'Expense not found' });
    res.json({ message: 'Expense deleted' });
  })
);

module.exports = router;
