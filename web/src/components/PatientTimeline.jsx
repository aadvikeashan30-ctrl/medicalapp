import React from 'react';
import {
  FiCalendar, FiFileText, FiDollarSign, FiActivity,
  FiAlertCircle, FiCheckCircle, FiClock
} from 'react-icons/fi';

const typeConfig = {
  appointment: { icon: FiCalendar, color: 'blue', label: 'Appointment' },
  prescription: { icon: FiFileText, color: 'purple', label: 'Prescription' },
  billing: { icon: FiDollarSign, color: 'emerald', label: 'Payment' },
  labtest: { icon: FiActivity, color: 'orange', label: 'Lab Test' },
  alert: { icon: FiAlertCircle, color: 'red', label: 'Alert' },
  checkup: { icon: FiCheckCircle, color: 'teal', label: 'Check-up' }
};

const colorMap = {
  blue: 'bg-blue-100 text-blue-600 border-blue-200',
  purple: 'bg-purple-100 text-purple-600 border-purple-200',
  emerald: 'bg-emerald-100 text-emerald-600 border-emerald-200',
  orange: 'bg-orange-100 text-orange-600 border-orange-200',
  red: 'bg-red-100 text-red-600 border-red-200',
  teal: 'bg-teal-100 text-teal-600 border-teal-200'
};

const lineColors = {
  blue: 'bg-blue-200',
  purple: 'bg-purple-200',
  emerald: 'bg-emerald-200',
  orange: 'bg-orange-200',
  red: 'bg-red-200',
  teal: 'bg-teal-200'
};

export default function PatientTimeline({ events = [] }) {
  if (!events.length) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        <FiClock className="mx-auto text-3xl mb-2" />
        No timeline events yet
      </div>
    );
  }

  return (
    <div className="relative pl-8">
      {/* Timeline line */}
      <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-blue-200 via-purple-200 to-emerald-200 rounded-full" />

      <div className="space-y-6">
        {events.map((event, idx) => {
          const config = typeConfig[event.type] || typeConfig.appointment;
          const Icon = config.icon;
          const colors = colorMap[config.color];

          return (
            <div key={idx} className="relative animate-slide-in" style={{ animationDelay: `${idx * 100}ms` }}>
              {/* Timeline dot */}
              <div className={`absolute -left-8 top-1 w-8 h-8 rounded-full flex items-center justify-center border-2 ${colors} shadow-sm`}>
                <Icon className="text-sm" />
              </div>

              {/* Content card */}
              <div className="ml-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors}`}>
                    {config.label}
                  </span>
                  <span className="text-xs text-gray-400">{event.date}</span>
                </div>
                <h4 className="font-semibold text-gray-900 text-sm mt-2">{event.title}</h4>
                {event.description && (
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{event.description}</p>
                )}
                {event.doctor && (
                  <p className="text-xs text-blue-600 mt-2 font-medium">Dr. {event.doctor}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
