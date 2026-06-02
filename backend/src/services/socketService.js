/**
 * Socket.IO Service — Real-time queue updates for patients tracking appointments
 * 
 * Events emitted to patients:
 *   - queue:update — full queue state (position, estimated wait, current token)
 *   - queue:called — patient's token is being called
 *   - queue:completed — patient's appointment completed
 * 
 * Events from doctor dashboard:
 *   - appointment:status-change — triggers queue recalculation
 */
const logger = require('../utils/logger');

let io = null;

/**
 * Initialize Socket.IO with the HTTP server
 */
function initSocket(server) {
  const { Server } = require('socket.io');
  
  io = new Server(server, {
    cors: {
      origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173')
        .split(',')
        .map(s => s.trim()),
      methods: ['GET', 'POST'],
      credentials: true
    },
    path: '/socket.io',
    transports: ['websocket', 'polling']
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Patient joins their appointment room for live updates
    socket.on('join:queue', ({ appointmentId, doctorId }) => {
      if (appointmentId) {
        socket.join(`appointment:${appointmentId}`);
        logger.info(`Socket ${socket.id} joined appointment:${appointmentId}`);
      }
      if (doctorId) {
        socket.join(`doctor-queue:${doctorId}`);
        logger.info(`Socket ${socket.id} joined doctor-queue:${doctorId}`);
      }
    });

    // Doctor joins their own queue management room
    socket.on('join:doctor', ({ doctorId }) => {
      if (doctorId) {
        socket.join(`doctor:${doctorId}`);
        logger.info(`Socket ${socket.id} joined doctor:${doctorId}`);
      }
    });

    // Patient leaves room
    socket.on('leave:queue', ({ appointmentId, doctorId }) => {
      if (appointmentId) socket.leave(`appointment:${appointmentId}`);
      if (doctorId) socket.leave(`doctor-queue:${doctorId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  logger.info('Socket.IO initialized');
  return io;
}

/**
 * Get Socket.IO instance
 */
function getIO() {
  return io;
}

/**
 * Emit queue update to all patients tracking a specific doctor's queue
 * Called whenever an appointment status changes
 */
async function emitQueueUpdate(doctorId) {
  if (!io) return;

  try {
    const Appointment = require('../models/Appointment');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const queue = await Appointment.find({
      doctorId,
      date: { $gte: today, $lt: tomorrow },
      status: { $nin: ['cancelled', 'no-show'] }
    })
      .populate('patientId', 'name')
      .sort({ tokenNumber: 1 });

    const completed = queue.filter(a => a.status === 'completed').length;
    const inProgress = queue.find(a => a.status === 'in-progress');
    const totalToday = queue.length;

    // Emit to each patient's room with their personalized position
    for (const apt of queue) {
      const myPosition = queue.indexOf(apt) + 1;
      const patientsAhead = Math.max(0, myPosition - completed - (inProgress ? 1 : 0) - 1);
      const estimatedWait = patientsAhead * 15;

      const payload = {
        appointmentId: apt._id.toString(),
        tokenNumber: apt.tokenNumber,
        status: apt.status,
        queue: {
          totalToday,
          completed,
          currentToken: inProgress?.tokenNumber || null,
          currentPatient: inProgress?.patientId?.name || null,
          myToken: apt.tokenNumber,
          myPosition,
          patientsAhead,
          estimatedWaitMinutes: estimatedWait
        },
        timestamp: new Date().toISOString()
      };

      // Emit to specific appointment room
      io.to(`appointment:${apt._id.toString()}`).emit('queue:update', payload);
    }

    // Emit summary to doctor's queue room (for all patients watching)
    io.to(`doctor-queue:${doctorId}`).emit('queue:summary', {
      totalToday,
      completed,
      inProgress: inProgress ? {
        tokenNumber: inProgress.tokenNumber,
        patientName: inProgress.patientId?.name
      } : null,
      remaining: totalToday - completed - (inProgress ? 1 : 0),
      timestamp: new Date().toISOString()
    });

    // Emit to doctor's dashboard
    io.to(`doctor:${doctorId}`).emit('queue:refresh', {
      totalToday,
      completed,
      currentToken: inProgress?.tokenNumber || null,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    logger.error(`Queue emit error: ${err.message}`);
  }
}

/**
 * Notify a specific patient that their token is being called
 */
function emitTokenCalled(appointmentId, tokenNumber) {
  if (!io) return;
  io.to(`appointment:${appointmentId}`).emit('queue:called', {
    appointmentId,
    tokenNumber,
    message: `Token #${tokenNumber} - Your turn! Please proceed to the doctor.`,
    timestamp: new Date().toISOString()
  });
}

/**
 * Notify that appointment is completed
 */
function emitAppointmentCompleted(appointmentId) {
  if (!io) return;
  io.to(`appointment:${appointmentId}`).emit('queue:completed', {
    appointmentId,
    message: 'Your consultation is complete. Thank you!',
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  initSocket,
  getIO,
  emitQueueUpdate,
  emitTokenCalled,
  emitAppointmentCompleted
};
