const express = require('express');
const { body, validationResult } = require('express-validator');
const ChatMessage = require('../models/ChatMessage');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Get chat history for a session
router.get(
  '/session/:sessionId',
  auth,
  asyncHandler(async (req, res) => {
    const messages = await ChatMessage.find({ sessionId: req.params.sessionId })
      .sort({ createdAt: 1 })
      .limit(100);
    res.json(messages);
  })
);

// Get all chat sessions for a patient
router.get(
  '/patient/:patientId/sessions',
  auth,
  asyncHandler(async (req, res) => {
    const sessions = await ChatMessage.aggregate([
      { $match: { patientId: require('mongoose').Types.ObjectId(req.params.patientId) } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$sessionId',
          lastMessage: { $first: '$content' },
          lastAt: { $first: '$createdAt' },
          messageCount: { $sum: 1 },
          context: { $first: '$context.type' }
        }
      },
      { $sort: { lastAt: -1 } },
      { $limit: 20 }
    ]);
    res.json(sessions);
  })
);

// Send message to AI health assistant
router.post(
  '/message',
  auth,
  [
    body('content').trim().notEmpty().withMessage('Message content is required'),
    body('sessionId').notEmpty().withMessage('Session ID is required')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array().map((e) => e.msg).join(', ') });
    }

    const { content, sessionId, patientId, context } = req.body;

    // Save user message
    const userMessage = await ChatMessage.create({
      patientId,
      doctorId: req.user._id,
      sessionId,
      role: 'user',
      content,
      context: context ? { type: context } : { type: 'general' }
    });

    // Generate AI response (using AI service)
    let aiResponse;
    try {
      const aiService = require('../services/aiService');
      // Get recent context
      const recentMessages = await ChatMessage.find({ sessionId })
        .sort({ createdAt: -1 })
        .limit(10);

      const conversationHistory = recentMessages.reverse().map((m) => ({
        role: m.role,
        content: m.content
      }));

      aiResponse = await aiService.healthAssistantChat(content, conversationHistory, context);
    } catch (err) {
      aiResponse = {
        content: 'I apologize, but I am unable to process your request right now. Please consult with your doctor for any medical concerns.',
        disclaimer: 'This AI assistant provides general health information only. It is not a substitute for professional medical advice.'
      };
    }

    // Save AI response
    const assistantMessage = await ChatMessage.create({
      patientId,
      doctorId: req.user._id,
      sessionId,
      role: 'assistant',
      content: aiResponse.content,
      disclaimer: aiResponse.disclaimer || 'This is AI-generated information. Please consult your doctor for professional advice.',
      context: context ? { type: context } : { type: 'general' }
    });

    res.json({
      userMessage,
      assistantMessage
    });
  })
);

// AI Lab Report Analyzer
router.post(
  '/analyze-lab-report',
  auth,
  [body('patientId').notEmpty().withMessage('Patient ID is required')],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array().map((e) => e.msg).join(', ') });
    }

    const { patientId, reportData, reportType } = req.body;

    let analysis;
    try {
      const aiService = require('../services/aiService');
      analysis = await aiService.analyzeLabReport(reportData, reportType);
    } catch (err) {
      analysis = {
        summary: 'Unable to analyze the report at this time.',
        findings: [],
        recommendations: ['Please consult your doctor for interpretation of these results.'],
        normalValues: [],
        abnormalValues: []
      };
    }

    res.json({
      patientId,
      reportType,
      analysis,
      disclaimer: 'This AI analysis is for informational purposes only and does not constitute medical advice. Always consult with your healthcare provider.'
    });
  })
);

module.exports = router;
