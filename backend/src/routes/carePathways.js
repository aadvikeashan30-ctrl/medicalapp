const express = require('express');
const { body, validationResult } = require('express-validator');
const CarePathway = require('../models/CarePathway');
const Patient = require('../models/Patient');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// List pathways (optional patientId / status filter)
router.get(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    const { patientId, status } = req.query;
    const query = { doctorId: req.user._id };
    if (patientId) query.patientId = patientId;
    if (status) query.status = status;

    const pathways = await CarePathway.find(query)
      .populate('patientId', 'name phone patientId')
      .sort({ createdAt: -1 });
    res.json({ pathways, total: pathways.length });
  })
);

// Summary stats
router.get(
  '/stats/summary',
  auth,
  asyncHandler(async (req, res) => {
    const doctorId = req.user._id;
    const [active, completed, total] = await Promise.all([
      CarePathway.countDocuments({ doctorId, status: 'active' }),
      CarePathway.countDocuments({ doctorId, status: 'completed' }),
      CarePathway.countDocuments({ doctorId })
    ]);
    res.json({ active, completed, total });
  })
);

// Single pathway
router.get(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const pathway = await CarePathway.findOne({ _id: req.params.id, doctorId: req.user._id })
      .populate('patientId', 'name phone patientId age gender');
    if (!pathway) return res.status(404).json({ message: 'Care pathway not found' });
    res.json(pathway);
  })
);

// Create pathway
router.post(
  '/',
  auth,
  [
    body('patientId').notEmpty().withMessage('patientId is required'),
    body('title').trim().notEmpty().withMessage('title is required')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array().map((e) => e.msg).join(', ') });
    }

    // Denormalize patient name/phone for quick display
    const patient = await Patient.findOne({ _id: req.body.patientId, doctorId: req.user._id });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const pathway = await CarePathway.create({
      ...req.body,
      doctorId: req.user._id,
      patientName: patient.name,
      patientPhone: patient.phone
    });
    const populated = await pathway.populate('patientId', 'name phone patientId');
    res.status(201).json(populated);
  })
);

// Update pathway (title, status, diagnosis, endDate, full task list)
router.put(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const updates = { ...req.body };
    delete updates.doctorId;
    delete updates.completions;

    const pathway = await CarePathway.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.user._id },
      updates,
      { new: true, runValidators: true }
    ).populate('patientId', 'name phone patientId');
    if (!pathway) return res.status(404).json({ message: 'Care pathway not found' });
    res.json(pathway);
  })
);

// Add a task
router.post(
  '/:id/tasks',
  auth,
  [body('label').trim().notEmpty().withMessage('Task label is required')],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array().map((e) => e.msg).join(', ') });
    }
    const pathway = await CarePathway.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.user._id },
      { $push: { tasks: req.body } },
      { new: true }
    ).populate('patientId', 'name phone patientId');
    if (!pathway) return res.status(404).json({ message: 'Care pathway not found' });
    res.json(pathway);
  })
);

// Remove a task (and its completions)
router.delete(
  '/:id/tasks/:taskId',
  auth,
  asyncHandler(async (req, res) => {
    const pathway = await CarePathway.findOne({ _id: req.params.id, doctorId: req.user._id });
    if (!pathway) return res.status(404).json({ message: 'Care pathway not found' });
    pathway.tasks.pull(req.params.taskId);
    pathway.completions = pathway.completions.filter((c) => String(c.taskId) !== req.params.taskId);
    await pathway.save();
    await pathway.populate('patientId', 'name phone patientId');
    res.json(pathway);
  })
);

// Toggle a task's completion for a given date (defaults to today)
router.post(
  '/:id/toggle',
  auth,
  asyncHandler(async (req, res) => {
    const { taskId } = req.body;
    if (!taskId) return res.status(400).json({ message: 'taskId is required' });
    const date = req.body.date || new Date().toISOString().slice(0, 10);

    const pathway = await CarePathway.findOne({ _id: req.params.id, doctorId: req.user._id });
    if (!pathway) return res.status(404).json({ message: 'Care pathway not found' });

    const exists = pathway.completions.find((c) => String(c.taskId) === String(taskId) && c.date === date);
    if (exists) {
      pathway.completions = pathway.completions.filter((c) => !(String(c.taskId) === String(taskId) && c.date === date));
    } else {
      pathway.completions.push({ taskId, date });
    }
    await pathway.save();
    await pathway.populate('patientId', 'name phone patientId');
    res.json(pathway);
  })
);

// Delete pathway
router.delete(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const result = await CarePathway.findOneAndDelete({ _id: req.params.id, doctorId: req.user._id });
    if (!result) return res.status(404).json({ message: 'Care pathway not found' });
    res.json({ message: 'Care pathway deleted' });
  })
);

module.exports = router;
