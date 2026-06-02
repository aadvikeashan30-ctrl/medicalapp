const express = require('express');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const ai = require('../services/aiService');

const router = express.Router();

router.post('/chat', auth, asyncHandler(async (req, res) => {
  const { messages, context } = req.body;
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ message: 'messages array required' });
  const systemMsg = {
    role: 'system',
    content: `You are DocClinic AI, an intelligent clinical assistant for Dr. ${req.user.name} (${req.user.specialty || 'general'}). Help with diagnoses, prescriptions, scheduling, documentation. Be concise and evidence-based. ${context || ''}`
  };
  const response = await ai.chat([systemMsg, ...messages]);
  res.json({ response, provider: ai.getProvider(), timestamp: new Date().toISOString() });
}));

router.post('/diagnose', auth, asyncHandler(async (req, res) => {
  const { symptoms, age, gender, history } = req.body;
  if (!symptoms) return res.status(400).json({ message: 'symptoms required' });
  const result = await ai.suggestDiagnosis({ symptoms, age, gender, history });
  res.json({ ...result, provider: ai.getProvider() });
}));

router.post('/prescribe', auth, asyncHandler(async (req, res) => {
  const { diagnosis, age, weight, allergies, currentMeds } = req.body;
  if (!diagnosis) return res.status(400).json({ message: 'diagnosis required' });
  const result = await ai.suggestPrescription({ diagnosis, age, weight, allergies, currentMeds });
  res.json({ ...result, provider: ai.getProvider() });
}));

router.post('/risk-score', auth, asyncHandler(async (req, res) => {
  const { patient, visits, conditions } = req.body;
  const result = await ai.assessPatientRisk({ patient, visits, conditions });
  res.json({ ...result, provider: ai.getProvider() });
}));

router.post('/optimize-schedule', auth, asyncHandler(async (req, res) => {
  const { appointments, workingHours, historicalData } = req.body;
  const result = await ai.optimizeSchedule({ appointments, workingHours, historicalData });
  res.json({ ...result, provider: ai.getProvider() });
}));

router.post('/summarize-notes', auth, asyncHandler(async (req, res) => {
  const { text, type } = req.body;
  if (!text) return res.status(400).json({ message: 'text required' });
  const result = await ai.summarizeNotes({ text, type });
  res.json({ ...result, provider: ai.getProvider() });
}));

router.get('/status', auth, asyncHandler(async (req, res) => {
  res.json({
    provider: ai.getProvider(),
    available: true,
    features: ['chat', 'diagnosis', 'prescription', 'risk-scoring', 'schedule-optimization', 'notes-summarization']
  });
}));

module.exports = router;
