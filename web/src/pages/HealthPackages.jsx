import React, { useState, useEffect } from 'react';
import { FiPackage, FiPlus, FiTrash2, FiStar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function HealthPackages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', category: 'preventive', totalValue: 0, packagePrice: 0,
    validityDays: 365, gender: 'all', isFeatured: false,
    services: [{ name: '', type: 'consultation', normalPrice: 0 }]
  });

  useEffect(() => { fetchPackages(); }, []);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/health-packages');
      setPackages(data || []);
    } catch (err) {
      toast.error('Failed to load packages');
    }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/health-packages', form);
      toast.success('Package created');
      setShowForm(false);
      fetchPackages();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this package?')) return;
    try {
      await api.delete(`/health-packages/${id}`);
      toast.success('Package deleted');
      fetchPackages();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const addService = () => {
    setForm({ ...form, services: [...form.services, { name: '', type: 'consultation', normalPrice: 0 }] });
  };

  const updateService = (idx, field, value) => {
    const services = [...form.services];
    services[idx] = { ...services[idx], [field]: value };
    setForm({ ...form, services });
  };

  const removeService = (idx) => {
    setForm({ ...form, services: form.services.filter((_, i) => i !== idx) });
  };

  const CATEGORIES = ['preventive', 'wellness', 'chronic-care', 'women-health', 'senior-care', 'child-care', 'corporate', 'custom'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiPackage className="text-teal-600" /> Health Packages
          </h1>
          <p className="text-gray-500 text-sm mt-1">Create and manage preventive health check packages</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-700"><FiPlus /> New Package</button>
      </div>

      {/* Package Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? <div className="col-span-3 text-center py-12 text-gray-500">Loading...</div> : packages.length === 0 ? (
          <div className="col-span-3 text-center py-12 bg-white dark:bg-gray-800 rounded-xl border"><FiPackage className="mx-auto text-4xl text-gray-300 mb-3" /><p className="text-gray-500">No health packages yet</p></div>
        ) : packages.map(pkg => (
          <div key={pkg._id} className={`bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border ${pkg.isFeatured ? 'border-teal-400 ring-1 ring-teal-200' : 'border-gray-100 dark:border-gray-700'} relative`}>
            {pkg.isFeatured && <span className="absolute -top-2 right-4 bg-teal-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1"><FiStar size={10} /> Featured</span>}
            <h3 className="font-bold text-gray-900 dark:text-white">{pkg.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{pkg.description}</p>
            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-2xl font-bold text-teal-600">₹{pkg.packagePrice?.toLocaleString()}</span>
              <span className="text-sm text-gray-400 line-through">₹{pkg.totalValue?.toLocaleString()}</span>
              {pkg.discountPercentage > 0 && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{pkg.discountPercentage}% off</span>}
            </div>
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-1">{pkg.services?.length || 0} services included:</p>
              <div className="flex flex-wrap gap-1">
                {(pkg.services || []).slice(0, 4).map((s, i) => (
                  <span key={i} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">{s.name}</span>
                ))}
                {(pkg.services?.length || 0) > 4 && <span className="text-xs text-gray-400">+{pkg.services.length - 4} more</span>}
              </div>
            </div>
            <div className="flex justify-between items-center mt-4 pt-3 border-t dark:border-gray-700">
              <span className="text-xs text-gray-400 capitalize">{pkg.category} | {pkg.validityDays} days</span>
              <button onClick={() => handleDelete(pkg._id)} className="text-red-400 hover:text-red-600"><FiTrash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Create Health Package</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Package Name</label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Validity (days)</label>
                  <input type="number" value={form.validityDays} onChange={e => setForm({ ...form, validityDays: +e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Value (₹)</label>
                  <input type="number" value={form.totalValue} onChange={e => setForm({ ...form, totalValue: +e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Package Price (₹)</label>
                  <input type="number" value={form.packagePrice} onChange={e => setForm({ ...form, packagePrice: +e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
              </div>

              {/* Services */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Included Services</label>
                {form.services.map((svc, idx) => (
                  <div key={idx} className="flex gap-2 items-center mb-2">
                    <input type="text" value={svc.name} onChange={e => updateService(idx, 'name', e.target.value)} placeholder="Service name" className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" />
                    <input type="number" value={svc.normalPrice} onChange={e => updateService(idx, 'normalPrice', +e.target.value)} placeholder="Price" className="w-24 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" />
                    <button type="button" onClick={() => removeService(idx)} className="text-red-500 p-1"><FiTrash2 size={14} /></button>
                  </div>
                ))}
                <button type="button" onClick={addService} className="text-sm text-teal-600 hover:text-teal-700">+ Add Service</button>
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isFeatured} onChange={e => setForm({ ...form, isFeatured: e.target.checked })} className="rounded" /> Mark as Featured
              </label>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-teal-600 text-white py-2 rounded-lg hover:bg-teal-700">Create Package</button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
