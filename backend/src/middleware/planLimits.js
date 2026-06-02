/**
 * Plan-based feature gating middleware.
 * Enforces limits per subscription tier: free, basic, pro, enterprise.
 *
 * Usage:
 *   router.post('/prescriptions', auth, requirePlan('basic'), handler);
 *   router.post('/ai/chat', auth, requirePlan('pro'), handler);
 *   router.post('/appointments', auth, checkLimit('appointments', 50), handler);
 */

const PLAN_LIMITS = {
  free: {
    patients: 20,
    appointments: 50, // per month
    prescriptions: 30,
    bills: 30,
    medicines: 10,
    labTests: 0,
    expenses: 0,
    whatsapp: 0,
    ai: false,
    reports: false,
    videoConsultation: false,
    multiStaff: false,
    maxStaff: 1,
    storage: 50 // MB
  },
  basic: {
    patients: 500,
    appointments: 500,
    prescriptions: 500,
    bills: 500,
    medicines: 100,
    labTests: 100,
    expenses: 100,
    whatsapp: 100, // messages per month
    ai: false,
    reports: true,
    videoConsultation: false,
    multiStaff: false,
    maxStaff: 1,
    storage: 500
  },
  pro: {
    patients: -1, // unlimited
    appointments: -1,
    prescriptions: -1,
    bills: -1,
    medicines: -1,
    labTests: -1,
    expenses: -1,
    whatsapp: -1,
    ai: true,
    reports: true,
    videoConsultation: true,
    multiStaff: true,
    maxStaff: 5,
    storage: 5000
  },
  enterprise: {
    patients: -1,
    appointments: -1,
    prescriptions: -1,
    bills: -1,
    medicines: -1,
    labTests: -1,
    expenses: -1,
    whatsapp: -1,
    ai: true,
    reports: true,
    videoConsultation: true,
    multiStaff: true,
    maxStaff: -1,
    storage: -1
  }
};

/**
 * Require minimum plan level to access a feature.
 * Plan hierarchy: free < basic < pro < enterprise
 */
function requirePlan(...allowedPlans) {
  const hierarchy = ['free', 'basic', 'pro', 'enterprise'];
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Authentication required' });

    const userPlan = req.user.plan || 'free';

    // Check if plan has expired
    if (req.user.planExpiry && new Date(req.user.planExpiry) < new Date()) {
      return res.status(403).json({
        message: 'Your plan has expired. Please renew to continue using this feature.',
        code: 'PLAN_EXPIRED',
        currentPlan: userPlan,
        expiredAt: req.user.planExpiry
      });
    }

    // Check if user's plan is at or above the minimum required
    const minRequired = Math.min(...allowedPlans.map(p => hierarchy.indexOf(p)));
    const userLevel = hierarchy.indexOf(userPlan);

    if (userLevel < minRequired) {
      const requiredPlan = hierarchy[minRequired];
      return res.status(403).json({
        message: `This feature requires the ${requiredPlan.toUpperCase()} plan or above. You are on the ${userPlan.toUpperCase()} plan.`,
        code: 'PLAN_INSUFFICIENT',
        currentPlan: userPlan,
        requiredPlan,
        upgradeUrl: '/pricing'
      });
    }

    next();
  };
}

/**
 * Check usage limit for a resource (count-based).
 * Counts documents created this month by this doctor.
 */
function checkLimit(resource, modelName) {
  return async (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Authentication required' });

    const userPlan = req.user.plan || 'free';
    const limits = PLAN_LIMITS[userPlan];
    const limit = limits[resource];

    // -1 means unlimited
    if (limit === -1) return next();

    // 0 means not available
    if (limit === 0) {
      return res.status(403).json({
        message: `${resource} is not available on your current plan. Please upgrade.`,
        code: 'FEATURE_UNAVAILABLE',
        currentPlan: userPlan,
        upgradeUrl: '/pricing'
      });
    }

    try {
      const Model = require(`../models/${modelName}`);
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const count = await Model.countDocuments({
        doctorId: req.user._id,
        createdAt: { $gte: startOfMonth }
      });

      if (count >= limit) {
        return res.status(403).json({
          message: `You've reached your monthly ${resource} limit (${limit}). Upgrade your plan for more.`,
          code: 'LIMIT_REACHED',
          currentPlan: userPlan,
          limit,
          used: count,
          upgradeUrl: '/pricing'
        });
      }

      // Attach usage info for client awareness
      req.planUsage = { resource, used: count, limit };
      next();
    } catch (err) {
      // Don't block on counting errors - allow through
      next();
    }
  };
}

/**
 * Check if a boolean feature is enabled for current plan.
 */
function requireFeature(featureName) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Authentication required' });

    const userPlan = req.user.plan || 'free';
    const limits = PLAN_LIMITS[userPlan];

    if (!limits[featureName]) {
      return res.status(403).json({
        message: `${featureName.replace(/([A-Z])/g, ' $1').trim()} requires a higher plan. Please upgrade.`,
        code: 'FEATURE_UNAVAILABLE',
        currentPlan: userPlan,
        feature: featureName,
        upgradeUrl: '/pricing'
      });
    }

    next();
  };
}

/**
 * Get plan limits for a given plan (utility for API responses).
 */
function getPlanLimits(plan) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

module.exports = { requirePlan, checkLimit, requireFeature, getPlanLimits, PLAN_LIMITS };
