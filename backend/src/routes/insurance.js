const express = require('express');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * In-app insurance pre-verification & copay estimation.
 *
 * Real deployments integrate a payer/clearinghouse API here. In its absence we
 * provide a deterministic verification so the check-in & split-billing flow is
 * fully functional and demoable.
 */
const PROVIDERS = {
  'star health': { coverage: 80, copay: 20, network: true },
  'hdfc ergo': { coverage: 75, copay: 25, network: true },
  'icici lombard': { coverage: 70, copay: 30, network: true },
  'new india': { coverage: 85, copay: 15, network: true },
  'care health': { coverage: 80, copay: 20, network: true },
  'max bupa': { coverage: 75, copay: 25, network: true },
  'niva bupa': { coverage: 75, copay: 25, network: true },
  default: { coverage: 70, copay: 30, network: false }
};

function lookupProvider(name) {
  const key = String(name || '').trim().toLowerCase();
  return { key, ...(PROVIDERS[key] || PROVIDERS.default), known: !!PROVIDERS[key] };
}

// Verify a policy and return coverage terms
router.post(
  '/verify',
  auth,
  asyncHandler(async (req, res) => {
    const { provider, policyNo } = req.body;
    if (!provider || !policyNo) {
      return res.status(400).json({ message: 'provider and policyNo are required' });
    }

    const p = lookupProvider(provider);
    // Deterministic "validity" from the policy number so the same input is stable
    const digits = String(policyNo).replace(/\D/g, '');
    const valid = digits.length >= 6;

    res.json({
      provider,
      policyNo,
      verified: valid,
      status: valid ? 'verified' : 'rejected',
      inNetwork: p.network,
      coveragePercent: valid ? p.coverage : 0,
      copayPercent: valid ? p.copay : 100,
      knownProvider: p.known,
      message: valid
        ? `Policy verified — ${p.coverage}% covered${p.network ? ' (in-network)' : ' (out-of-network)'}.`
        : 'Policy number appears invalid. Please re-check the card.',
      verifiedAt: new Date().toISOString()
    });
  })
);

// Estimate the split for a given bill amount
router.post(
  '/estimate',
  auth,
  asyncHandler(async (req, res) => {
    const { provider, amount, coveragePercent } = req.body;
    const total = Number(amount || 0);
    if (total <= 0) return res.status(400).json({ message: 'A positive amount is required' });

    const pct = coveragePercent != null ? Number(coveragePercent) : lookupProvider(provider).coverage;
    const insuranceCovered = Math.round((total * pct) / 100);
    const patientPayable = Math.max(0, total - insuranceCovered);

    res.json({
      totalAmount: total,
      coveragePercent: pct,
      insuranceCovered,
      patientCopay: patientPayable,
      patientPayable,
      breakdown: [
        { label: 'Insurance covers', percent: pct, amount: insuranceCovered },
        { label: 'Patient copay', percent: 100 - pct, amount: patientPayable }
      ]
    });
  })
);

// Supported providers (for dropdowns)
router.get(
  '/providers',
  auth,
  asyncHandler(async (req, res) => {
    res.json({
      providers: Object.keys(PROVIDERS)
        .filter((k) => k !== 'default')
        .map((k) => ({ key: k, name: k.replace(/\b\w/g, (c) => c.toUpperCase()), ...PROVIDERS[k] }))
    });
  })
);

module.exports = router;
