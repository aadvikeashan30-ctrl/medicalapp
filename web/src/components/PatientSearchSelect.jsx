import React, { useState, useRef, useEffect } from 'react';
import { FiSearch, FiUser, FiX, FiChevronDown } from 'react-icons/fi';

/**
 * PatientSearchSelect
 *
 * A combobox-style patient picker that lets staff search by name OR Patient ID.
 * Props:
 *   patients   - array of patient objects
 *   value      - selected patient _id
 *   onChange   - function(patientId: string) called on selection
 *   required   - boolean
 *   placeholder - string
 */
export default function PatientSearchSelect({
  patients = [],
  value = '',
  onChange,
  required = false,
  placeholder = 'Search by name or Patient ID...'
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const selectedPatient = patients.find((p) => p._id === value);

  // Build filtered list
  const filtered = query.trim()
    ? patients.filter((p) => {
        const q = query.toLowerCase();
        return (
          p.name?.toLowerCase().includes(q) ||
          p.patientId?.toLowerCase().includes(q) ||
          p.phone?.includes(q)
        );
      })
    : patients;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const select = (patient) => {
    onChange(patient._id);
    setOpen(false);
    setQuery('');
  };

  const clear = (e) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <div
        className={`input-field flex items-center gap-2 cursor-pointer min-h-[42px] ${
          open ? 'ring-2 ring-blue-400 border-blue-400' : ''
        }`}
        onClick={() => {
          setOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {selectedPatient ? (
          <div className="flex items-center gap-2 flex-1 overflow-hidden">
            <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <FiUser className="text-blue-600 text-xs" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-semibold text-gray-900 truncate block text-sm">
                {selectedPatient.name}
              </span>
              <span className="text-xs text-gray-500 block leading-tight">
                {selectedPatient.patientId
                  ? <span className="font-mono text-blue-600 font-semibold">{selectedPatient.patientId}</span>
                  : <span className="italic text-gray-400">ID pending</span>}
                {selectedPatient.phone && ` · ${selectedPatient.phone}`}
              </span>
            </div>
            <button
              type="button"
              onClick={clear}
              className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 flex-shrink-0"
              aria-label="Clear selection"
            >
              <FiX className="text-xs" />
            </button>
          </div>
        ) : (
          <span className="text-gray-400 text-sm flex-1">{placeholder}</span>
        )}
        <FiChevronDown className={`text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>

      {/* Hidden required input for form validation */}
      {required && (
        <input
          tabIndex={-1}
          style={{ opacity: 0, position: 'absolute', height: 0, width: 0 }}
          required
          value={value}
          onChange={() => {}}
        />
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute z-[200] mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden animate-fade-in">
          {/* Search input */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, ID, or phone..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
              />
            </div>
          </div>

          {/* Patient list */}
          <div className="max-h-64 overflow-y-auto" role="listbox">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-400">
                {query ? `No patients match "${query}"` : 'No patients registered'}
              </div>
            ) : (
              filtered.slice(0, 50).map((p) => (
                <div
                  key={p._id}
                  role="option"
                  aria-selected={p._id === value}
                  onClick={() => select(p)}
                  className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-blue-50 transition-colors ${
                    p._id === value ? 'bg-blue-50' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                      p.gender === 'male'
                        ? 'bg-blue-100 text-blue-700'
                        : p.gender === 'female'
                        ? 'bg-pink-100 text-pink-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {p.name?.charAt(0)?.toUpperCase()}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{p.name}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {p.patientId && (
                        <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          {p.patientId}
                        </span>
                      )}
                      {p.age && (
                        <span className="text-xs text-gray-500">{p.age}y</span>
                      )}
                      {p.phone && (
                        <span className="text-xs text-gray-500">{p.phone}</span>
                      )}
                    </div>
                  </div>
                  {/* Visits badge */}
                  {p.totalVisits > 0 && (
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {p.totalVisits}v
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
          {filtered.length > 50 && (
            <div className="px-3 py-2 text-xs text-center text-gray-400 border-t border-gray-100">
              Showing first 50 results — type to filter
            </div>
          )}
        </div>
      )}
    </div>
  );
}
