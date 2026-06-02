import React, { useState, useEffect, useRef } from 'react';
import { FiEdit3, FiSave, FiTrash2, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function ESignature() {
  const [signature, setSignature] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signatureType, setSignatureType] = useState('drawn');
  const [typedText, setTypedText] = useState('');
  const [fontFamily, setFontFamily] = useState('cursive');
  const [autoApply, setAutoApply] = useState(true);
  const [applyTo, setApplyTo] = useState(['prescriptions']);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    fetchSignature();
  }, []);

  const fetchSignature = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/doctor/e-signature');
      if (data && !data.exists === false) {
        setSignature(data);
        setSignatureType(data.signatureType || 'drawn');
        setAutoApply(data.autoApply !== false);
        setApplyTo(data.applyTo || ['prescriptions']);
      }
    } catch (err) { /* no signature yet */ }
    setLoading(false);
  };

  // Canvas drawing
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleSave = async () => {
    let signatureData = '';

    if (signatureType === 'drawn') {
      const canvas = canvasRef.current;
      if (canvas) signatureData = canvas.toDataURL('image/png');
    } else if (signatureType === 'typed') {
      signatureData = typedText;
    }

    if (!signatureData) {
      toast.error('Please create a signature first');
      return;
    }

    try {
      const { data } = await api.post('/doctor/e-signature', {
        signatureType,
        signatureData,
        fontFamily: signatureType === 'typed' ? fontFamily : undefined,
        autoApply,
        applyTo
      });
      setSignature(data);
      toast.success('Signature saved');
    } catch (err) {
      toast.error('Failed to save signature');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete your e-signature?')) return;
    try {
      await api.delete('/doctor/e-signature');
      setSignature(null);
      clearCanvas();
      toast.success('Signature deleted');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const APPLY_OPTIONS = ['prescriptions', 'lab-orders', 'referrals', 'certificates', 'invoices'];
  const FONTS = [
    { value: 'cursive', label: 'Cursive' },
    { value: "'Dancing Script', cursive", label: 'Dancing Script' },
    { value: "'Great Vibes', cursive", label: 'Great Vibes' },
    { value: "'Satisfy', cursive", label: 'Satisfy' }
  ];

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FiEdit3 className="text-indigo-600" /> E-Signature
        </h1>
        <p className="text-gray-500 text-sm mt-1">Digital signature for prescriptions and documents</p>
      </div>

      {/* Current Signature Preview */}
      {signature && signature.signatureData && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Current Signature</h3>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 flex items-center justify-center min-h-[100px]">
            {signature.signatureType === 'drawn' ? (
              <img src={signature.signatureData} alt="E-Signature" className="max-h-24" />
            ) : (
              <p style={{ fontFamily: signature.fontFamily || 'cursive', fontSize: '2rem' }} className="text-gray-900 dark:text-white">{signature.signatureData}</p>
            )}
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><FiCheck className="text-green-500" /> {signature.autoApply ? 'Auto-applied' : 'Manual'}</span>
            <span>Applies to: {(signature.applyTo || []).join(', ')}</span>
          </div>
        </div>
      )}

      {/* Create/Edit Signature */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{signature ? 'Update' : 'Create'} Signature</h3>

        {/* Type Selection */}
        <div className="flex gap-3 mb-6">
          <button onClick={() => setSignatureType('drawn')} className={`px-4 py-2 rounded-lg text-sm font-medium ${signatureType === 'drawn' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
            Draw
          </button>
          <button onClick={() => setSignatureType('typed')} className={`px-4 py-2 rounded-lg text-sm font-medium ${signatureType === 'typed' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
            Type
          </button>
        </div>

        {/* Drawing Canvas */}
        {signatureType === 'drawn' && (
          <div className="mb-4">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <canvas
                ref={canvasRef}
                width={500}
                height={150}
                className="w-full bg-white cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
            </div>
            <button onClick={clearCanvas} className="text-sm text-red-500 mt-2 hover:text-red-700">Clear</button>
          </div>
        )}

        {/* Typed Signature */}
        {signatureType === 'typed' && (
          <div className="mb-4 space-y-3">
            <input type="text" value={typedText} onChange={e => setTypedText(e.target.value)} placeholder="Dr. John Smith" className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            <select value={fontFamily} onChange={e => setFontFamily(e.target.value)} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
            {typedText && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
                <p style={{ fontFamily, fontSize: '2rem' }} className="text-gray-900 dark:text-white">{typedText}</p>
              </div>
            )}
          </div>
        )}

        {/* Settings */}
        <div className="border-t dark:border-gray-700 pt-4 mt-4 space-y-3">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={autoApply} onChange={e => setAutoApply(e.target.checked)} className="rounded" />
            Auto-apply signature to documents
          </label>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Apply to</label>
            <div className="flex flex-wrap gap-2">
              {APPLY_OPTIONS.map(opt => (
                <label key={opt} className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                  <input
                    type="checkbox"
                    checked={applyTo.includes(opt)}
                    onChange={e => {
                      if (e.target.checked) setApplyTo([...applyTo, opt]);
                      else setApplyTo(applyTo.filter(a => a !== opt));
                    }}
                    className="rounded"
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button onClick={handleSave} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2">
            <FiSave /> Save Signature
          </button>
          {signature && (
            <button onClick={handleDelete} className="bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200 flex items-center gap-2">
              <FiTrash2 /> Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
