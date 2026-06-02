import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FiSearch, FiMapPin, FiStar, FiClock, FiDollarSign,
  FiFilter, FiVideo, FiUser, FiChevronDown, FiAward
} from 'react-icons/fi';
import { FaHeartbeat, FaStethoscope, FaUserMd } from 'react-icons/fa';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

const specialties = [
  { value: 'all', label: 'All Specialties', icon: '🏥' },
  { value: 'general', label: 'General Physician', icon: '👨‍⚕️' },
  { value: 'dental', label: 'Dentist', icon: '🦷' },
  { value: 'eye', label: 'Eye Specialist', icon: '👁️' },
  { value: 'ortho', label: 'Orthopedic', icon: '🦴' },
  { value: 'pediatric', label: 'Pediatrician', icon: '👶' },
  { value: 'dermatology', label: 'Dermatologist', icon: '🧴' },
  { value: 'ent', label: 'ENT', icon: '👂' },
  { value: 'cardiology', label: 'Cardiologist', icon: '❤️' },
  { value: 'gynecology', label: 'Gynecologist', icon: '🤰' }
];

function StarRating({ rating, size = 'sm' }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <FiStar
        key={i}
        className={`${size === 'sm' ? 'text-xs' : 'text-sm'} ${
          i <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
        }`}
      />
    );
  }
  return <div className="flex items-center gap-0.5">{stars}</div>;
}

export default function FindDoctor() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    specialty: searchParams.get('specialty') || 'all',
    city: searchParams.get('city') || '',
    sort: searchParams.get('sort') || 'rating'
  });
  const [showFilters, setShowFilters] = useState(false);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.specialty && filters.specialty !== 'all') params.set('specialty', filters.specialty);
      if (filters.city) params.set('city', filters.city);
      if (filters.sort) params.set('sort', filters.sort);

      const { data } = await api.get(`/portal/discover?${params.toString()}`);
      setDoctors(data.doctors || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to load doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [filters.specialty, filters.sort]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchDoctors();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
              <FaHeartbeat className="text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">DocClinic Pro</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/symptom-checker" className="text-sm text-gray-600 hover:text-blue-600 font-medium hidden sm:block">Symptom Checker</Link>
            <Link to="/login" className="btn-primary text-sm !py-2 !px-4">Doctor Login</Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Hero Search */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            Find the Right <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">Doctor</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
            Search by specialty, location, or name. Read patient reviews and book instantly.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="max-w-3xl mx-auto mb-8">
          <div className="flex gap-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-blue-500/5 border border-gray-200 dark:border-gray-700 p-2">
            <div className="flex-1 flex items-center gap-2 px-4">
              <FiSearch className="text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search doctor name, clinic, or specialty..."
                className="flex-1 py-2.5 bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>
            <div className="flex items-center gap-2 px-3 border-l border-gray-200 dark:border-gray-700">
              <FiMapPin className="text-gray-400 text-sm" />
              <input
                type="text"
                value={filters.city}
                onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                placeholder="City"
                className="w-24 sm:w-32 py-2.5 bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>
            <button type="submit" className="bg-gradient-to-r from-blue-600 to-violet-600 text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:shadow-lg transition-all">
              Search
            </button>
          </div>
        </form>

        {/* Specialty Pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {specialties.map(s => (
            <button
              key={s.value}
              onClick={() => setFilters({ ...filters, specialty: s.value })}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                filters.specialty === s.value
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-blue-300'
              }`}
            >
              <span>{s.icon}</span> {s.label}
            </button>
          ))}
        </div>

        {/* Sort & Filter Bar */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">{total} doctors found</p>
          <div className="flex items-center gap-2">
            <select
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
              className="text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300"
            >
              <option value="rating">Top Rated</option>
              <option value="fee-low">Fee: Low to High</option>
              <option value="fee-high">Fee: High to Low</option>
              <option value="experience">Most Experienced</option>
            </select>
          </div>
        </div>

        {/* Doctor Cards */}
        {loading ? (
          <div className="text-center py-16">
            <FaStethoscope className="mx-auto text-3xl text-blue-500 animate-pulse mb-3" />
            <p className="text-gray-500">Finding doctors...</p>
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-16">
            <FaUserMd className="mx-auto text-4xl text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">No doctors found</h3>
            <p className="text-gray-500">Try changing your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {doctors.map(doc => (
              <div key={doc._id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-xl hover:-translate-y-1 transition-all group">
                {/* Doctor header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <FaUserMd className="text-white text-xl" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate">Dr. {doc.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">{doc.specialty} • {doc.qualification || 'MBBS'}</p>
                    {doc.experience > 0 && (
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <FiAward className="text-blue-500" /> {doc.experience} years experience
                      </p>
                    )}
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-3">
                  <StarRating rating={doc.avgRating || 0} />
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{doc.avgRating || 'New'}</span>
                  <span className="text-xs text-gray-400">({doc.totalReviews || 0} reviews)</span>
                </div>

                {/* Details */}
                <div className="space-y-1.5 mb-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <FiMapPin className="text-xs text-blue-500" />
                    <span className="truncate">{doc.clinicName}{doc.clinicCity ? `, ${doc.clinicCity}` : ''}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <FiDollarSign className="text-xs text-emerald-500" />
                    <span>₹{doc.consultationFee || 500} consultation fee</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <FiClock className="text-xs text-purple-500" />
                    <span>{doc.workingHours?.start || '09:00'} - {doc.workingHours?.end || '18:00'}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    to={`/book/${doc._id}`}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 rounded-xl font-medium text-sm text-center hover:shadow-lg hover:shadow-blue-500/25 transition-all"
                  >
                    Book Now
                  </Link>
                  <Link
                    to={`/doctor/${doc._id}`}
                    className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                  >
                    Profile
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
