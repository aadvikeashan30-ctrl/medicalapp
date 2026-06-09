/**
 * VoIP failover adapter.
 *
 * When a video call drops, the app falls back to an encrypted cellular/VoIP
 * call so the visit can finish uninterrupted. Live telephony (Twilio, Exotel,
 * Plivo, etc.) is configured via env; without credentials we return a
 * deterministic stub so the failover flow is fully exercisable.
 */
const logger = require('../utils/logger');

function isConfigured() {
  return !!(process.env.VOIP_PROVIDER && process.env.VOIP_API_KEY);
}

/**
 * Initiate a bridged voice call between the doctor and patient numbers.
 * @returns {Promise<Object>} call descriptor
 */
async function initiateCall({ doctorPhone, patientPhone, reason }) {
  const provider = process.env.VOIP_PROVIDER || 'stub';
  const callId = `call_${Date.now().toString(36)}`;

  if (!isConfigured()) {
    logger.info(`[VoIP stub] would bridge ${doctorPhone || 'doctor'} <-> ${patientPhone || 'patient'} (${reason || 'failover'})`);
    return {
      callId,
      provider: 'stub',
      status: 'dialing',
      configured: false,
      message: 'Simulated VoIP failover (no telephony provider configured).'
    };
  }

  // Real integration point — implement provider-specific dial here.
  logger.info(`[VoIP ${provider}] initiating bridged call ${callId}`);
  return { callId, provider, status: 'dialing', configured: true };
}

module.exports = { initiateCall, isConfigured };
