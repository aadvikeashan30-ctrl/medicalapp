/**
 * AI Service — integrates with OpenAI/Gemini when API key is set,
 * otherwise falls back to intelligent rule-based demo responses.
 *
 * Env vars (optional - demo mode when missing):
 *   AI_PROVIDER=openai|gemini       (default: openai)
 *   OPENAI_API_KEY=sk-...
 *   OPENAI_MODEL=gpt-4o             (default)
 *   GEMINI_API_KEY=...
 *   GEMINI_MODEL=gemini-1.5-pro     (default)
 */

const logger = require('../utils/logger');

function getProvider() {
  const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase();
  if (provider === 'gemini' && process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.OPENAI_API_KEY) return 'openai';
  return 'demo';
}

async function callOpenAI(messages, options = {}) {
  const model = process.env.OPENAI_MODEL || 'gpt-4o';
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 1024,
      ...(options.json ? { response_format: { type: 'json_object' } } : {})
    })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.choices[0].message.content;
}

async function callGemini(messages, options = {}) {
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-pro';
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
  const systemInstruction = messages.find((m) => m.role === 'system')?.content;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {}),
      generationConfig: { temperature: options.temperature ?? 0.3, maxOutputTokens: options.maxTokens ?? 1024 }
    })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function chat(messages, options = {}) {
  const provider = getProvider();
  if (provider === 'demo') return demoChatResponse(messages, options);
  try {
    if (provider === 'openai') return await callOpenAI(messages, options);
    if (provider === 'gemini') return await callGemini(messages, options);
  } catch (err) {
    logger.error(`AI (${provider}) failed: ${err.message}. Falling back to demo.`);
    return demoChatResponse(messages, options);
  }
}

function demoChatResponse(messages) {
  const lastMsg = (messages[messages.length - 1]?.content || '').toLowerCase();

  if (lastMsg.includes('hello') || lastMsg.includes('hi') || lastMsg.includes('help')) {
    return "Hello Doctor! I'm your AI clinical assistant. I can help with:\n\n• **Diagnosis suggestions** based on symptoms\n• **Drug interactions** and dosage recommendations\n• **Treatment protocols** for common conditions\n• **Patient risk assessment**\n• **Clinical note summarization**\n• **Scheduling optimization**\n\nHow can I help you today?";
  }
  if (lastMsg.includes('diagnos') || lastMsg.includes('symptom') || lastMsg.includes('fever') || lastMsg.includes('pain') || lastMsg.includes('cough')) {
    return `Based on the symptoms described, here are possible differential diagnoses:\n\n1. **Viral Upper Respiratory Infection** (most likely)\n   - Supportive care, antipyretics, rest\n   - Follow up if no improvement in 5-7 days\n\n2. **Allergic Rhinitis**\n   - Antihistamines, nasal corticosteroids\n   - Identify and avoid triggers\n\n3. **Early Bacterial Sinusitis** (if >10 days)\n   - Consider antibiotics if symptoms persist\n   - Imaging if recurrent\n\n⚠️ *AI suggestion — use clinical judgment for final diagnosis.*`;
  }
  if (lastMsg.includes('prescri') || lastMsg.includes('medicine') || lastMsg.includes('treatment') || lastMsg.includes('drug')) {
    return `**Suggested Treatment:**\n\n**First-line:**\n• Tab. Paracetamol 500mg — 1-0-1 × 3 days (after food)\n• Tab. Cetirizine 10mg — 0-0-1 × 5 days (bedtime)\n\n**If bacterial suspected:**\n• Cap. Amoxicillin 500mg — 1-1-1 × 5 days (after food)\n\n**Supportive:**\n• Steam inhalation TID\n• Adequate hydration (2-3L/day)\n• Rest × 2-3 days\n\n⚠️ *AI suggestion — verify allergies and interactions before prescribing.*`;
  }
  if (lastMsg.includes('interact') || lastMsg.includes('combination')) {
    return `**Drug Interaction Check:**\n\n✅ No major interactions detected.\n\n⚡ **Notes:**\n• Take Omeprazole 30 min before meals\n• Separate antacids from other meds by 2 hours\n• Monitor BP if combining ACE inhibitors with NSAIDs\n\n⚠️ *Cross-reference with complete medication list.*`;
  }
  if (lastMsg.includes('risk') || lastMsg.includes('predict') || lastMsg.includes('score')) {
    return `**Patient Risk Assessment:**\n\n📊 **Risk Score: Moderate (6/10)**\n\n**Factors:**\n• Age > 45 with cardiovascular history\n• Irregular follow-up pattern\n• BMI slightly elevated\n\n**Recommendations:**\n• Schedule quarterly reviews\n• Lipid panel in 2 weeks\n• Lifestyle modifications\n\n📈 *15% higher no-show probability — send SMS reminder.*`;
  }
  if (lastMsg.includes('schedul') || lastMsg.includes('slot') || lastMsg.includes('optimi')) {
    return `**Smart Scheduling Insights:**\n\n📊 **Predictions:**\n• Expected load: 18-22 patients\n• Peak: 10:00 AM - 12:00 PM\n• 2 potential no-shows flagged\n\n💡 **Suggestions:**\n• Move follow-ups to 3-5 PM\n• Keep 2 emergency slots (10:30, 2:30)\n• Wednesday — best for procedures`;
  }
  if (lastMsg.includes('note') || lastMsg.includes('summar')) {
    return `**Clinical Note Summary (SOAP):**\n\n**S:** Patient presents with described symptoms\n**O:** Vitals WNL, no acute distress\n**A:** Condition stable/improving\n**P:** Continue meds, f/u 1 week, return if worse\n\n**ICD-10:** J06.9 (URI), R50.9 (Fever)\n\n*📝 Review and edit as needed.*`;
  }

  return `I can help you with:\n\n• **"Diagnose: fever, cough, body ache"** — Differential diagnosis\n• **"Prescribe for viral fever"** — Treatment suggestions\n• **"Check interaction: Aspirin + Warfarin"** — Drug interactions\n• **"Risk score for patient"** — Risk assessment\n• **"Optimize schedule"** — Scheduling insights\n• **"Summarize notes"** — Structure clinical notes\n\nWhat would you like help with?`;
}

async function suggestDiagnosis({ symptoms, age, gender, history }) {
  const systemMsg = { role: 'system', content: 'You are a clinical decision support AI. Provide 3-5 differential diagnoses with ICD-10 codes, reasoning, suggested investigations, and red flags. Respond in JSON: { "diagnoses": [{ "condition": "", "probability": "high|medium|low", "icd10": "", "reasoning": "", "investigations": [], "redFlags": [] }], "urgency": "routine|urgent|emergency" }' };
  const userMsg = { role: 'user', content: `Patient: ${age || '?'}y ${gender || '?'}. Symptoms: ${symptoms}. History: ${history || 'none'}.` };
  const result = await chat([systemMsg, userMsg], { json: true, temperature: 0.2 });
  try { return JSON.parse(result); } catch { return { raw: result }; }
}

async function suggestPrescription({ diagnosis, age, weight, allergies, currentMeds }) {
  const systemMsg = { role: 'system', content: 'You are a clinical pharmacology AI. Suggest medications with dosage, frequency, duration, timing. Check contraindications. JSON: { "medicines": [{ "name": "", "dosage": "", "frequency": "", "duration": "", "timing": "after-food|before-food|empty-stomach|bedtime", "notes": "" }], "warnings": [], "interactions": [], "advice": "" }' };
  const userMsg = { role: 'user', content: `Diagnosis: ${diagnosis}. Age: ${age || 'adult'}. Weight: ${weight || '?'}kg. Allergies: ${(allergies || []).join(', ') || 'none'}. Current meds: ${(currentMeds || []).join(', ') || 'none'}.` };
  const result = await chat([systemMsg, userMsg], { json: true, temperature: 0.2 });
  try { return JSON.parse(result); } catch { return { raw: result }; }
}

async function assessPatientRisk({ patient, visits, conditions }) {
  const systemMsg = { role: 'system', content: 'You are a predictive health AI. Assess patient risk. JSON: { "riskScore": 0, "riskLevel": "low|moderate|high|critical", "factors": [], "recommendations": [], "predictedNoShowProbability": 0, "suggestedFollowUp": "" }' };
  const userMsg = { role: 'user', content: `Patient: ${JSON.stringify(patient)}. Visits: ${visits || 0}. Conditions: ${(conditions || []).join(', ') || 'none'}.` };
  const result = await chat([systemMsg, userMsg], { json: true, temperature: 0.2 });
  try { return JSON.parse(result); } catch { return { raw: result }; }
}

async function optimizeSchedule({ appointments, workingHours, historicalData }) {
  const systemMsg = { role: 'system', content: 'You are a clinic scheduling AI. JSON: { "insights": { "predictedLoad": 0, "peakHours": [], "suggestedBreaks": [], "noShowRisk": [] }, "optimizations": [], "suggestedSlots": { "emergencyBuffer": [], "followUps": [], "newPatients": [] } }' };
  const userMsg = { role: 'user', content: `Hours: ${JSON.stringify(workingHours || { start: '09:00', end: '18:00' })}. Appointments: ${JSON.stringify(appointments || [])}. Historical: ${historicalData || '15-20/day'}.` };
  const result = await chat([systemMsg, userMsg], { json: true, temperature: 0.3 });
  try { return JSON.parse(result); } catch { return { raw: result }; }
}

async function summarizeNotes({ text, type }) {
  const systemMsg = { role: 'system', content: 'You are a medical documentation AI. Convert notes to SOAP format with ICD-10. JSON: { "soap": { "subjective": "", "objective": "", "assessment": "", "plan": "" }, "icd10Suggestions": [{ "code": "", "description": "" }], "keyFindings": [], "followUpSuggested": "" }' };
  const userMsg = { role: 'user', content: `${type === 'voice' ? 'Voice transcript' : 'Notes'}: "${text}"` };
  const result = await chat([systemMsg, userMsg], { json: true, temperature: 0.2 });
  try { return JSON.parse(result); } catch { return { raw: result }; }
}

// ========== NEW AI FEATURES ==========

/**
 * Health Assistant Chatbot - conversational AI for patients
 */
async function healthAssistantChat(message, conversationHistory = [], contextType = 'general') {
  const systemPrompts = {
    general: 'You are a friendly AI health assistant for patients. Provide general health information, wellness tips, and help patients understand their health better. Always add a disclaimer that your advice does not replace professional medical consultation. Be empathetic and clear.',
    'symptom-check': 'You are an AI symptom checker. Ask clarifying questions about symptoms, suggest possible conditions (without diagnosing), and recommend when to see a doctor. Always err on the side of caution.',
    'medication-query': 'You are a medication information AI. Help patients understand their prescribed medications, side effects, interactions, and proper usage. Always advise consulting their doctor before making any changes.',
    'lab-interpretation': 'You are a lab report explanation AI. Help patients understand their lab results in simple terms. Explain which values are normal and which need attention, without making diagnoses.',
    'diet-advice': 'You are a nutrition and wellness AI. Provide general dietary advice based on health conditions. Recommend consulting a nutritionist for personalized plans.',
    'follow-up': 'You are a follow-up care AI. Help patients understand their post-visit care instructions, when to schedule follow-ups, and what symptoms to watch for.'
  };

  const systemMsg = { role: 'system', content: systemPrompts[contextType] || systemPrompts.general };
  const messages = [systemMsg, ...conversationHistory, { role: 'user', content: message }];

  const response = await chat(messages, { temperature: 0.5, maxTokens: 800 });
  return {
    content: response,
    disclaimer: 'This AI assistant provides general health information only. It is not a substitute for professional medical advice, diagnosis, or treatment.'
  };
}

/**
 * AI Lab Report Analyzer
 */
async function analyzeLabReport(reportData, reportType = 'general') {
  const systemMsg = {
    role: 'system',
    content: `You are a lab report analysis AI for healthcare professionals. Analyze the lab report and provide:
1. Summary of findings
2. Abnormal values with clinical significance
3. Normal values confirmation
4. Recommendations for follow-up tests
5. Possible conditions to investigate

Respond in JSON format:
{
  "summary": "",
  "findings": [{ "parameter": "", "value": "", "normalRange": "", "status": "normal|high|low|critical", "significance": "" }],
  "abnormalValues": [{ "parameter": "", "value": "", "interpretation": "" }],
  "normalValues": [{ "parameter": "", "value": "" }],
  "recommendations": [],
  "possibleConditions": [],
  "urgency": "routine|follow-up|urgent|immediate"
}`
  };

  const userMsg = { role: 'user', content: `Report type: ${reportType}. Data: ${JSON.stringify(reportData)}` };
  const result = await chat([systemMsg, userMsg], { json: true, temperature: 0.2 });
  try { return JSON.parse(result); } catch { return { summary: result, findings: [], recommendations: ['Please consult your doctor.'] }; }
}

/**
 * Drug Interaction Checker (AI-enhanced)
 */
async function checkDrugInteractions(drugNames) {
  const systemMsg = {
    role: 'system',
    content: `You are a clinical pharmacology AI. Check for drug interactions between the given medications. For each interaction found, provide severity, description, and management advice.

Respond in JSON format:
{
  "interactions": [{ "drug1": "", "drug2": "", "severity": "minor|moderate|major|contraindicated", "description": "", "mechanism": "", "clinicalEffect": "", "management": "" }],
  "safeConfirmation": ""
}`
  };

  const userMsg = { role: 'user', content: `Check interactions between: ${drugNames.join(', ')}` };
  const result = await chat([systemMsg, userMsg], { json: true, temperature: 0.1 });
  try {
    const parsed = JSON.parse(result);
    return parsed.interactions || [];
  } catch {
    return [];
  }
}

/**
 * Allergy Interaction Checker (AI-enhanced)
 */
async function checkAllergyInteractions(allergies, medicines) {
  const systemMsg = {
    role: 'system',
    content: `You are a clinical pharmacology AI specialized in allergy detection. Given a patient's known allergies and prescribed medications, identify any potential allergic reactions or cross-reactivity.

Respond in JSON format:
{
  "alerts": [{ "medicine": "", "allergy": "", "severity": "low|moderate|high|critical", "mechanism": "", "message": "", "alternatives": [] }]
}`
  };

  const medNames = medicines.map((m) => (typeof m === 'string' ? m : m.name));
  const userMsg = { role: 'user', content: `Patient allergies: ${allergies.join(', ')}. Prescribed medicines: ${medNames.join(', ')}` };
  const result = await chat([systemMsg, userMsg], { json: true, temperature: 0.1 });
  try {
    const parsed = JSON.parse(result);
    return parsed.alerts || [];
  } catch {
    return [];
  }
}

/**
 * Clinical Decision Support
 */
async function clinicalDecisionSupport({ symptoms, diagnosis, patientAge, patientGender, medicalHistory }) {
  const systemMsg = {
    role: 'system',
    content: `You are a clinical decision support AI. Based on patient symptoms and clinical data, provide evidence-based suggestions for diagnosis, investigations, and treatment.

Respond in JSON format:
{
  "suggestedDiagnoses": [{ "condition": "", "probability": "high|medium|low", "icd10": "", "reasoning": "" }],
  "recommendedTests": [{ "test": "", "urgency": "routine|urgent", "reason": "" }],
  "treatmentOptions": [{ "option": "", "firstLine": true, "details": "" }],
  "redFlags": [],
  "followUpAdvice": "",
  "disclaimer": "AI suggestions are for reference only. Clinical judgment should always take precedence."
}`
  };

  const userMsg = {
    role: 'user',
    content: `Patient: ${patientAge || '?'}y ${patientGender || '?'}. Symptoms: ${symptoms || 'Not specified'}. Working diagnosis: ${diagnosis || 'Undetermined'}. Medical history: ${medicalHistory || 'None reported'}.`
  };

  const result = await chat([systemMsg, userMsg], { json: true, temperature: 0.2 });
  try { return JSON.parse(result); } catch {
    return {
      suggestedDiagnoses: [],
      recommendedTests: [],
      treatmentOptions: [],
      followUpAdvice: 'Please use clinical judgment for treatment decisions.',
      disclaimer: 'AI suggestions are for reference only.'
    };
  }
}

/**
 * Smart Follow-Up Suggestions
 */
async function suggestFollowUp({ diagnosis, medicines, patientAge, consultationType }) {
  const systemMsg = {
    role: 'system',
    content: `You are a clinical follow-up scheduling AI. Based on the diagnosis and treatment, suggest optimal follow-up timing and monitoring requirements.

Respond in JSON format:
{
  "suggestedDays": 7,
  "reason": "",
  "priority": "routine|important|urgent",
  "monitoringPoints": [],
  "warningSignsToWatch": [],
  "testsBeforeFollowUp": []
}`
  };

  const userMsg = {
    role: 'user',
    content: `Diagnosis: ${diagnosis || 'General'}. Medicines: ${JSON.stringify(medicines || [])}. Patient age: ${patientAge || 'adult'}. Type: ${consultationType || 'consultation'}.`
  };

  const result = await chat([systemMsg, userMsg], { json: true, temperature: 0.3 });
  try { return JSON.parse(result); } catch {
    return { suggestedDays: 7, reason: 'Standard follow-up', priority: 'routine' };
  }
}

/**
 * Voice-to-Prescription AI
 */
async function voiceToPrescription(transcription) {
  const systemMsg = {
    role: 'system',
    content: `You are a medical transcription AI that converts doctor's voice dictation into structured prescription data. Extract diagnosis, symptoms, medications (with dosage, frequency, duration, timing), lab tests, advice, and follow-up date.

Respond in JSON format:
{
  "diagnosis": "",
  "symptoms": [],
  "medicines": [{ "name": "", "dosage": "", "frequency": "", "duration": "", "timing": "after-food|before-food|empty-stomach|bedtime", "notes": "" }],
  "tests": [],
  "advice": "",
  "followUpDays": null,
  "vitals": { "bp": "", "pulse": null, "temperature": null, "weight": null, "spo2": null }
}`
  };

  const userMsg = { role: 'user', content: `Voice transcription: "${transcription}"` };
  const result = await chat([systemMsg, userMsg], { json: true, temperature: 0.1 });
  try { return JSON.parse(result); } catch { return { raw: result, diagnosis: '', medicines: [], tests: [] }; }
}

module.exports = {
  chat,
  getProvider,
  suggestDiagnosis,
  suggestPrescription,
  assessPatientRisk,
  optimizeSchedule,
  summarizeNotes,
  // New AI features
  healthAssistantChat,
  analyzeLabReport,
  checkDrugInteractions,
  checkAllergyInteractions,
  clinicalDecisionSupport,
  suggestFollowUp,
  voiceToPrescription
};
