import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  FiStar, FiMapPin, FiClock, FiDollarSign, FiAward,
  FiCalendar, FiVideo, FiCheckCircle, FiSend, FiUser
} from 'react-icons/fi';
import { FaHeartbeat, FaUserMd, FaStethoscope } from 'react-icons/fa';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <FiStar key={i} className={`text-sm ${i <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
      ))}
    </div>
  );
}

function StarInput({ value, onChange }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          className="p-1"
        >
          <FiStar className={`text-xl transition-all ${i <= value ? 'text-yellow-400 fill-yellow-400 scale-110' : 'text-gray-300 hover:text-yellow-300'}`} />
        </button>
      ))}
    </div>
  );
}

export default function DoctorPublicProfile() {
  const { doctorId } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [ratingStats, setRatingStats] = useState({ avgRating: 0, totalReviews: 0, distribution: {} });
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ patientName: '', patientPhone: '', rating: 5, title: '', comment: '', tags: [] });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!doctorId) return;
    Promise.all([
      api.get(`/portal/doctor/${doctorId}`),
      api.get(`/portal/doctor/${doctorId}/reviews?limit=20`)
    ]).then(([docRes, revRes]) => {
      setDoctor(docRes.data);
      setReviews(revRes.data.reviews || []);
      setRatingStats({ avgRating: revRes.data.avgRating, totalReviews: revRes.data.totalReviews, distribution: revRes.data.distribution || {} });
    }).catch(() => {}).finally(() => setLoading(false));
  }, [doctorId]);

  const submitReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.patientName || !reviewForm.rating) return;
    setSubmitting(true);
    try {
      await api.post('/portal/review', { doctorId, ...reviewForm });
      setShowReviewForm(false);
      // Refresh reviews
      const { data } = await api.get(`/portal/doctor/${doctorId}/reviews?limit=20`);
      setReviews(data.reviews || []);
      setRatingStats({ avgRating: data.avgRating, totalReviews: data.totalReviews, distribution: data.distribution || {} });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const tags = ['punctual', 'thorough', 'friendly', 'good-listener', 'explains-well', 'affordable', 'clean-clinic', 'short-wait'];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <FaStethoscope className="text-3xl text-blue-500 animate-pulse" />
    </div>
  );

  if (!doctor) return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-2">Doctor not found</h2>
        <Link to="/find-doctor" className="btn-primary">Find a Doctor</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
              <FaHeartbeat className="text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">DocClinic Pro</span>
          </Link>
          <Link to="/find-doctor" className="btn-secondary text-sm !py-2">← All Doctors</Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Doctor Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-xl flex-shrink-0">
              <FaUserMd className="text-white text-4xl" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Dr. {doctor.name}</h1>
              <p className="text-gray-500 capitalize mt-1">{doctor.specialty} • {doctor.qualification || 'MBBS'}</p>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1"><FiMapPin className="text-blue-500" /> {doctor.clinicName}, {doctor.clinicCity}</span>
                <span className="flex items-center gap-1"><FiDollarSign className="text-emerald-500" /> ₹{doctor.consultationFee}</span>
                <span className="flex items-center gap-1"><FiClock className="text-purple-500" /> {doctor.workingHours?.start} - {doctor.workingHours?.end}</span>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <StarRating rating={ratingStats.avgRating} />
                <span className="text-lg font-bold text-gray-900 dark:text-white">{ratingStats.avgRating || 'New'}</span>
                <span className="text-sm text-gray-400">({ratingStats.totalReviews} reviews)</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 md:items-end">
              <Link to={`/book/${doctorId}`} className="btn-primary flex items-center gap-2 justify-center">
                <FiCalendar /> Book Appointment
              </Link>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rating Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Patient Ratings</h3>
            <div className="text-center mb-4">
              <p className="text-5xl font-bold text-gray-900 dark:text-white">{ratingStats.avgRating || '-'}</p>
              <StarRating rating={ratingStats.avgRating} />
              <p className="text-sm text-gray-500 mt-1">{ratingStats.totalReviews} reviews</p>
            </div>
            {/* Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map(star => {
                const count = ratingStats.distribution?.[star] || 0;
                const pct = ratingStats.totalReviews ? (count / ratingStats.totalReviews) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-sm">
                    <span className="w-3 text-gray-500">{star}</span>
                    <FiStar className="text-xs text-yellow-400 fill-yellow-400" />
                    <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-6 text-gray-400 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => setShowReviewForm(true)}
              className="w-full mt-5 btn-primary text-sm py-2.5 flex items-center justify-center gap-2"
            >
              <FiStar /> Write a Review
            </button>
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Patient Reviews</h3>
            {reviews.length === 0 ? (
              <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                <FiUser className="mx-auto text-3xl text-gray-300 mb-3" />
                <p className="text-gray-500">No reviews yet. Be the first!</p>
              </div>
            ) : (
              reviews.map(rev => (
                <div key={rev._id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 dark:text-white">{rev.patientName}</p>
                        {rev.isVerified && (
                          <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full font-medium">
                            <FiCheckCircle /> Verified
                          </span>
                        )}
                      </div>
                      <StarRating rating={rev.rating} />
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(rev.createdAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  {rev.title && <p className="font-medium text-gray-800 dark:text-gray-200 mb-1">{rev.title}</p>}
                  {rev.comment && <p className="text-sm text-gray-600 dark:text-gray-400">{rev.comment}</p>}
                  {rev.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {rev.tags.map(tag => (
                        <span key={tag} className="text-[10px] bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full capitalize">
                          {tag.replace('-', ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                  {rev.doctorReply && (
                    <div className="mt-3 ml-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-l-2 border-blue-500">
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-0.5">Doctor's Reply</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{rev.doctorReply}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Review Form Modal */}
        {showReviewForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 animate-fade-in">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Write a Review for Dr. {doctor.name}</h3>
              <form onSubmit={submitReview} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Your Name *</label>
                  <input type="text" required className="input-field" value={reviewForm.patientName} onChange={e => setReviewForm({ ...reviewForm, patientName: e.target.value })} placeholder="Full name" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Phone (for verification)</label>
                  <input type="tel" className="input-field" value={reviewForm.patientPhone} onChange={e => setReviewForm({ ...reviewForm, patientPhone: e.target.value })} placeholder="+91..." />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Rating *</label>
                  <StarInput value={reviewForm.rating} onChange={r => setReviewForm({ ...reviewForm, rating: r })} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Title</label>
                  <input type="text" className="input-field" value={reviewForm.title} onChange={e => setReviewForm({ ...reviewForm, title: e.target.value })} placeholder="Brief summary" maxLength={100} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Your Experience</label>
                  <textarea className="input-field" rows={3} value={reviewForm.comment} onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })} placeholder="Tell others about your experience..." maxLength={500} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Tags (optional)</label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const current = reviewForm.tags || [];
                          setReviewForm({ ...reviewForm, tags: current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag] });
                        }}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all capitalize ${
                          (reviewForm.tags || []).includes(tag)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-blue-300'
                        }`}
                      >
                        {tag.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowReviewForm(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={submitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    <FiSend /> {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
