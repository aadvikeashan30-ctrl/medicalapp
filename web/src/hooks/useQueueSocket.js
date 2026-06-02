import { useEffect, useState, useRef, useCallback } from 'react';

/**
 * useQueueSocket hook — Real-time queue position updates via Socket.IO
 * 
 * Usage:
 *   const { queueData, isConnected } = useQueueSocket({ appointmentId, doctorId });
 * 
 * Returns live queue state that auto-updates when the doctor processes patients.
 */
export function useQueueSocket({ appointmentId, doctorId }) {
  const [queueData, setQueueData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!appointmentId && !doctorId) return;

    let socket;
    
    const connect = async () => {
      try {
        // Dynamic import to avoid bundling socket.io-client when not needed
        const { io } = await import('socket.io-client');
        
        const socketUrl = window.location.origin;
        socket = io(socketUrl, {
          path: '/socket.io',
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 2000
        });

        socketRef.current = socket;

        socket.on('connect', () => {
          setIsConnected(true);
          // Join the appropriate room
          if (appointmentId) {
            socket.emit('join:queue', { appointmentId, doctorId });
          }
        });

        socket.on('disconnect', () => {
          setIsConnected(false);
        });

        // Queue update for this specific appointment
        socket.on('queue:update', (data) => {
          setQueueData(data);
          setLastEvent({ type: 'update', timestamp: data.timestamp });
        });

        // Token called — patient should proceed
        socket.on('queue:called', (data) => {
          setQueueData(prev => ({ ...prev, ...data, called: true }));
          setLastEvent({ type: 'called', timestamp: data.timestamp, message: data.message });
          
          // Browser notification if permission granted
          if (Notification.permission === 'granted') {
            new Notification('Your Turn!', {
              body: data.message,
              icon: '/favicon.ico',
              tag: 'queue-called'
            });
          }
        });

        // Appointment completed
        socket.on('queue:completed', (data) => {
          setQueueData(prev => ({ ...prev, completed: true, message: data.message }));
          setLastEvent({ type: 'completed', timestamp: data.timestamp });
        });

        // Queue summary (generic for all watchers)
        socket.on('queue:summary', (data) => {
          setQueueData(prev => prev ? { ...prev, summary: data } : { summary: data });
        });

      } catch (err) {
        console.warn('Socket.IO connection failed, falling back to polling:', err.message);
      }
    };

    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave:queue', { appointmentId, doctorId });
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [appointmentId, doctorId]);

  // Request notification permission
  const requestNotifications = useCallback(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return { queueData, isConnected, lastEvent, requestNotifications };
}

/**
 * useDoctorSocket hook — For doctor dashboard real-time updates
 */
export function useDoctorSocket(doctorId) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!doctorId) return;

    const connect = async () => {
      try {
        const { io } = await import('socket.io-client');
        const socket = io(window.location.origin, {
          path: '/socket.io',
          transports: ['websocket', 'polling'],
          reconnection: true
        });

        socketRef.current = socket;

        socket.on('connect', () => {
          setIsConnected(true);
          socket.emit('join:doctor', { doctorId });
        });

        socket.on('disconnect', () => setIsConnected(false));

        // Trigger refresh when queue changes (e.g., new booking from portal)
        socket.on('queue:refresh', () => {
          setRefreshTrigger(t => t + 1);
        });
      } catch (err) {
        console.warn('Doctor socket failed:', err.message);
      }
    };

    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [doctorId]);

  return { refreshTrigger, isConnected };
}
