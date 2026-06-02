import React from 'react';

export default function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 animate-fade-up">
      {/* Animated icon with gradient ring */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 flex items-center justify-center animate-float">
          {Icon && <Icon className="text-3xl text-indigo-400" />}
        </div>
        {/* Decorative dots */}
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-indigo-100 rounded-full animate-pulse" />
        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-purple-100 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-1.5">{title}</h3>
      <p className="text-sm text-gray-500 text-center max-w-sm mb-6">{message}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
