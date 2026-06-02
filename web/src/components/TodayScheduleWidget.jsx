import React from 'react';
import { FiClock, FiUser, FiCheckCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';

const statusDot = {
  scheduled: 'bg-gray-400',
  confirmed: 'bg-blue-500',
  'in-progress': 'bg-amber-500 animate-pulse',
  completed: 'bg-emerald-500',
  cancelled: 'bg-red-400',
  'no-show': 'bg-gray-300'
};

export default function TodayScheduleWidget() {
  const { data: queue } = useApi('/appointments/queue/today');
  const appointments = queue || [];

  const upcoming = appointments.filter(a =>
    a.status === 'scheduled' || a.status === 'confirmed'
  ).slice(0, 5);

  const inProgress = appointments.find(a => a.status === 'in-progress');
  const completed = appointments.filter(a => a.status === 'completed').length;
  const total = appointments.length;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FiClock className="text-blue-600" /> Today's Schedule
        </h3>
        <Link to="/appointments" className="text-xs text-blue-600 font-medium hover:text-blue-800">
          View All
        </Link>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>{completed} of {total} completed</span>
          <span>{total > 0 ? Math.round((completed / total) * 100) : 0}%</span>
        </div>
        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-700"
            style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Current patient */}
      {inProgress && (
        <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 font-semibold mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            NOW IN PROGRESS
          </div>
          <p className="font-semibold text-gray-900 dark:text-white text-sm">
            {inProgress.patientId?.name || 'Patient'} — #{inProgress.tokenNumber}
          </p>
          <p className="text-xs text-gray-500">{inProgress.timeSlot} • {inProgress.type}</p>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length === 0 && !inProgress ? (
        <p className="text-sm text-gray-400 text-center py-4">No more appointments today</p>
      ) : (
        <div className="space-y-2">
          {upcoming.map(apt => (
            <div key={apt._id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusDot[apt.status] || 'bg-gray-300'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {apt.patientId?.name || 'Patient'}
                </p>
                <p className="text-xs text-gray-500">{apt.timeSlot} • {apt.type}</p>
              </div>
              <span className="text-xs font-bold text-gray-400">#{apt.tokenNumber}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
