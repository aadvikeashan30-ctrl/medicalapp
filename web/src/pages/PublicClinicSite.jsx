import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiPhone, FiMapPin, FiCalendar, FiStar, FiMail, FiClock } from 'react-icons/fi';
import api from '../utils/api';

const THEMES = {
  teal: 'from-teal-500 to-emerald-600', blue: 'from-blue-500 to-indigo-600',
  violet: 'from-violet-500 to-purple-600', emerald: 'from-emerald-500 to-green-600', rose: 'from-rose-500 to-pink-600'
};

export default function PublicClinicSite() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    api.get(`/website/public/${slug}`).then((r) => setData(r.data)).catch(() => setErr(true));
  }, [slug]);

  if (err) return <div className="min-h-screen flex items-center justify-center text-gray-400">This website is not available.</div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading…</div>;

  const { site, doctor } = data;
  const theme = THEMES[site.theme] || THEMES.teal;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className={`bg-gradient-to-br ${theme} text-white`}>
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h1 className="text-3xl md:text-4xl font-bold">{site.headline || doctor?.clinicName}</h1>
          <p className="text-white/85 mt-3 max-w-xl mx-auto">{site.about}</p>
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {(site.highlights || []).map((h, i) => <span key={i} className="text-sm bg-white/20 px-3 py-1 rounded-full">{h}</span>)}
          </div>
          {site.bookingEnabled && (
            <Link to={`/book/${site.doctorId || ''}`} className="inline-flex items-center gap-2 mt-6 bg-white/95 text-gray-800 font-semibold px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition-transform">
              <FiCalendar /> Book Appointment
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        {doctor && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center -mt-16 relative">
            <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${theme} mx-auto flex items-center justify-center text-white text-2xl font-bold`}>
              {(doctor.name || 'D').split(' ').map((w) => w[0]).join('').slice(0, 2)}
            </div>
            <h2 className="text-xl font-bold text-gray-900 mt-3">Dr. {doctor.name}</h2>
            <p className="text-sm text-gray-500">{doctor.qualification} · {doctor.specialty}</p>
            {doctor.workingHours && <p className="text-sm text-gray-500 mt-1 flex items-center justify-center gap-1.5"><FiClock /> {doctor.workingHours.start}–{doctor.workingHours.end}</p>}
            {doctor.consultationFee != null && <p className="text-sm font-semibold text-gray-700 mt-1">Consultation ₹{doctor.consultationFee}</p>}
          </div>
        )}

        {(site.services || []).length > 0 && (
          <div>
            <h3 className="font-bold text-gray-900 mb-3">Our Services</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {site.services.map((s, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 text-sm font-medium text-gray-700 text-center shadow-sm">{s}</div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-2">
          <h3 className="font-bold text-gray-900 mb-2">Contact</h3>
          {site.contact?.phone && <a href={`tel:${site.contact.phone}`} className="flex items-center gap-2 text-gray-600 hover:text-gray-900"><FiPhone className="text-gray-400" /> {site.contact.phone}</a>}
          {site.contact?.email && <a href={`mailto:${site.contact.email}`} className="flex items-center gap-2 text-gray-600 hover:text-gray-900"><FiMail className="text-gray-400" /> {site.contact.email}</a>}
          {site.contact?.address && <p className="flex items-center gap-2 text-gray-600"><FiMapPin className="text-gray-400" /> {site.contact.address}</p>}
          {site.googleReviewUrl && <a href={site.googleReviewUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-amber-500 font-medium pt-1"><FiStar /> Leave us a Google review</a>}
        </div>

        <p className="text-center text-xs text-gray-300">Powered by DocClinic Pro</p>
      </div>
    </div>
  );
}
