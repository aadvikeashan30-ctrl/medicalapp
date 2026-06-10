import React, { useState, useEffect } from 'react';
import {
  FiGlobe, FiSave, FiExternalLink, FiEye, FiPlus, FiX, FiCheckCircle,
  FiStar, FiPhone, FiMapPin, FiCalendar, FiCopy
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useApi } from '../hooks/useApi';
import Loader from '../components/Loader';

const THEMES = {
  teal: 'from-teal-500 to-emerald-600', blue: 'from-blue-500 to-indigo-600',
  violet: 'from-violet-500 to-purple-600', emerald: 'from-emerald-500 to-green-600', rose: 'from-rose-500 to-pink-600'
};

export default function WebsiteGenerator() {
  const { data, loading, refetch } = useApi('/website');
  const [site, setSite] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newService, setNewService] = useState('');

  useEffect(() => { if (data) setSite(data); }, [data]);

  if (loading || !site) return <Loader label="Loading website builder..." />;

  const set = (k, v) => setSite((s) => ({ ...s, [k]: v }));
  const setContact = (k, v) => setSite((s) => ({ ...s, contact: { ...(s.contact || {}), [k]: v } }));

  const save = async () => {
    setSaving(true);
    try { const res = await api.put('/website', site); setSite(res.data); toast.success('Saved'); }
    catch (e) { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const togglePublish = async () => {
    try {
      const res = await api.post('/website/publish', { published: !site.published });
      setSite((s) => ({ ...s, published: res.data.published }));
      toast.success(res.data.published ? 'Website published!' : 'Unpublished');
    } catch (e) { toast.error('Failed'); }
  };

  const addService = () => { if (!newService.trim()) return; set('services', [...(site.services || []), newService.trim()]); setNewService(''); };
  const removeService = (i) => set('services', site.services.filter((_, idx) => idx !== i));

  const publicUrl = `${window.location.origin}/site/${site.slug}`;
  const copyLink = () => { navigator.clipboard.writeText(publicUrl); toast.success('Link copied'); };


  return (
    <div className="page-enter space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="animate-fade-up">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-600 flex items-center justify-center"><FiGlobe className="text-white text-lg" /></div>
            Website Generator
          </h1>
          <p className="text-sm text-gray-500 mt-1">Build & publish your clinic's public website in minutes</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={save} disabled={saving} className="btn-secondary flex items-center gap-2"><FiSave /> {saving ? 'Saving...' : 'Save'}</button>
          <button onClick={togglePublish} className={`font-semibold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 ${site.published ? 'bg-gray-200 text-gray-700' : 'bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white'}`}>
            {site.published ? <><FiEye /> Published</> : <><FiCheckCircle /> Publish</>}
          </button>
        </div>
      </div>

      {site.published && (
        <div className="card !py-3 flex flex-wrap items-center justify-between gap-2 bg-emerald-50/60 border-emerald-100">
          <span className="text-sm text-emerald-700 flex items-center gap-2"><FiCheckCircle /> Live at <span className="font-mono">{publicUrl}</span></span>
          <div className="flex gap-2">
            <button onClick={copyLink} className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1"><FiCopy /> Copy</button>
            <a href={`/site/${site.slug}`} target="_blank" rel="noreferrer" className="btn-primary !py-1.5 !px-3 text-xs flex items-center gap-1"><FiExternalLink /> Visit</a>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor */}
        <div className="space-y-4">
          <div className="card space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-white">Content</h3>
            <div><label className="text-sm font-medium text-gray-700 mb-1 block">Headline</label><input value={site.headline || ''} onChange={(e) => set('headline', e.target.value)} className="input-field" /></div>
            <div><label className="text-sm font-medium text-gray-700 mb-1 block">About</label><textarea value={site.about || ''} onChange={(e) => set('about', e.target.value)} rows={3} className="input-field" /></div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Theme</label>
              <div className="flex gap-2">
                {Object.entries(THEMES).map(([k, g]) => (
                  <button key={k} onClick={() => set('theme', k)} className={`w-9 h-9 rounded-full bg-gradient-to-br ${g} ${site.theme === k ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`} title={k} />
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Services</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(site.services || []).map((s, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm">{s}<button onClick={() => removeService(i)}><FiX className="text-xs" /></button></span>
                ))}
              </div>
              <div className="flex gap-2"><input value={newService} onChange={(e) => setNewService(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addService())} className="input-field" placeholder="Add a service" /><button onClick={addService} className="btn-secondary !px-3"><FiPlus /></button></div>
            </div>
          </div>
          <div className="card space-y-4">
            <h3 className="font-bold text-gray-900 dark:text-white">Contact & Booking</h3>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium text-gray-700 mb-1 block">Phone</label><input value={site.contact?.phone || ''} onChange={(e) => setContact('phone', e.target.value)} className="input-field" /></div>
              <div><label className="text-sm font-medium text-gray-700 mb-1 block">Email</label><input value={site.contact?.email || ''} onChange={(e) => setContact('email', e.target.value)} className="input-field" /></div>
            </div>
            <div><label className="text-sm font-medium text-gray-700 mb-1 block">Address</label><input value={site.contact?.address || ''} onChange={(e) => setContact('address', e.target.value)} className="input-field" /></div>
            <div><label className="text-sm font-medium text-gray-700 mb-1 block">Google Review URL</label><input value={site.googleReviewUrl || ''} onChange={(e) => set('googleReviewUrl', e.target.value)} className="input-field" placeholder="https://g.page/r/..." /></div>
            <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={!!site.bookingEnabled} onChange={(e) => set('bookingEnabled', e.target.checked)} className="w-4 h-4 rounded accent-fuchsia-500" /> Enable online booking button</label>
          </div>
        </div>

        {/* Live preview */}
        <div className="lg:sticky lg:top-4 h-fit">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5"><FiEye /> Live Preview</p>
          <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-lg bg-white">
            <div className={`bg-gradient-to-br ${THEMES[site.theme] || THEMES.teal} p-6 text-white`}>
              <h2 className="text-xl font-bold">{site.headline || 'Your Clinic'}</h2>
              <p className="text-white/85 text-sm mt-1">{site.about}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {(site.highlights || []).map((h, i) => <span key={i} className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full">{h}</span>)}
              </div>
              {site.bookingEnabled && <button className="mt-4 bg-white/95 text-gray-800 font-semibold text-sm px-4 py-2 rounded-lg flex items-center gap-1.5"><FiCalendar /> Book Appointment</button>}
            </div>
            <div className="p-5 space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 text-sm mb-2">Services</h3>
                <div className="flex flex-wrap gap-2">{(site.services || []).map((s, i) => <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">{s}</span>)}</div>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                {site.contact?.phone && <p className="flex items-center gap-2"><FiPhone className="text-gray-400" /> {site.contact.phone}</p>}
                {site.contact?.address && <p className="flex items-center gap-2"><FiMapPin className="text-gray-400" /> {site.contact.address}</p>}
                {site.googleReviewUrl && <p className="flex items-center gap-2 text-amber-500"><FiStar /> Leave us a review</p>}
              </div>
              <p className="text-[10px] text-gray-300 text-center pt-2">{site.views || 0} views · Powered by DocClinic Pro</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
