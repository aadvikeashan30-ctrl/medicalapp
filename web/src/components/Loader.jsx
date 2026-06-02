import React from 'react';

export default function Loader({ label = 'Loading...', skeleton = false, rows = 3 }) {
  if (skeleton) {
    return (
      <div className="space-y-4 animate-fade-up">
        {/* Skeleton stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-2xl p-5 bg-white border border-gray-100">
              <div className="w-11 h-11 rounded-xl animate-shimmer mb-4" />
              <div className="h-8 w-20 animate-shimmer rounded-lg mb-2" />
              <div className="h-4 w-28 animate-shimmer rounded-md" />
            </div>
          ))}
        </div>
        {/* Skeleton list rows */}
        <div className="rounded-2xl bg-white border border-gray-100 p-6 space-y-3">
          {[...Array(rows)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-xl">
              <div className="w-10 h-10 rounded-lg animate-shimmer flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 animate-shimmer rounded-md" />
                <div className="h-3 w-1/2 animate-shimmer rounded-md" />
              </div>
              <div className="h-6 w-16 animate-shimmer rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-up">
      {/* Animated spinner with gradient ring */}
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-[3px] border-gray-100" />
        <div className="absolute inset-0 w-12 h-12 rounded-full border-[3px] border-transparent border-t-indigo-500 border-r-purple-500 animate-spin" />
      </div>
      <p className="mt-4 text-sm text-gray-500 font-medium">{label}</p>
    </div>
  );
}
