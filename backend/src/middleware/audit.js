/**
 * Audit Logging Middleware — Tracks sensitive operations for compliance.
 * Logs: who did what, when, to which resource.
 * 
 * In production, pipe these to a dedicated audit collection or external service.
 */
const logger = require('../utils/logger');

/**
 * Audit log entry creator
 */
function auditLog(action, resourceType) {
  return (req, res, next) => {
    // Store original json method to intercept response
    const originalJson = res.json.bind(res);

    res.json = (body) => {
      // Only log successful mutations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const entry = {
          timestamp: new Date().toISOString(),
          action,
          resourceType,
          userId: req.user?._id || req.user?.id || 'anonymous',
          userName: req.user?.name || 'unknown',
          userRole: req.user?.role || 'unknown',
          method: req.method,
          path: req.originalUrl,
          ip: req.ip || req.connection?.remoteAddress,
          userAgent: req.get('User-Agent')?.substring(0, 100),
          resourceId: req.params?.id || body?._id || body?.id || null,
          statusCode: res.statusCode
        };

        logger.info(`[AUDIT] ${action} ${resourceType} by ${entry.userName} (${entry.userId})`, {
          audit: true,
          ...entry
        });
      }

      return originalJson(body);
    };

    next();
  };
}

/**
 * Pre-built audit actions for common operations
 */
const audit = {
  create: (resource) => auditLog('CREATE', resource),
  update: (resource) => auditLog('UPDATE', resource),
  delete: (resource) => auditLog('DELETE', resource),
  login: () => auditLog('LOGIN', 'session'),
  export: (resource) => auditLog('EXPORT', resource),
  access: (resource) => auditLog('ACCESS', resource)
};

module.exports = { auditLog, audit };
