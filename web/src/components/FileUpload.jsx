import React, { useState, useRef } from 'react';
import { FiUpload, FiFile, FiX, FiCheck, FiImage } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';

/**
 * Reusable file upload component.
 * Props:
 * - onUpload(url) - callback with uploaded file URL
 * - accept - file types (default: images + pdf)
 * - maxSize - max file size in MB (default: 5)
 * - label - display label
 */
export default function FileUpload({
  onUpload,
  accept = 'image/*,.pdf,.doc,.docx',
  maxSize = 5,
  label = 'Upload File'
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState('');
  const inputRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Size check
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File too large. Max ${maxSize}MB`);
      return;
    }

    setFileName(file.name);

    // Preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }


    // Upload
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('File uploaded');
      if (onUpload) onUpload(data.url || data.path);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
      setPreview(null);
      setFileName('');
    } finally {
      setUploading(false);
    }
  };

  const clear = () => {
    setPreview(null);
    setFileName('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="w-full">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">{label}</label>

      {!fileName ? (
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all group"
        >
          <FiUpload className="mx-auto text-2xl text-gray-400 group-hover:text-blue-500 mb-2 transition-colors" />
          <p className="text-sm text-gray-500 group-hover:text-blue-600">
            Click to upload or drag & drop
          </p>
          <p className="text-xs text-gray-400 mt-1">Max {maxSize}MB</p>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          {preview ? (
            <img src={preview} alt="preview" className="w-12 h-12 rounded-lg object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <FiFile className="text-blue-600 text-lg" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{fileName}</p>
            <p className="text-xs text-gray-500">
              {uploading ? 'Uploading...' : 'Uploaded ✓'}
            </p>
          </div>
          {!uploading && (
            <button onClick={clear} className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors">
              <FiX className="text-gray-400" />
            </button>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}
