import React, { useEffect, useRef, useState } from 'react';
import { FiDownload, FiCopy, FiCheckCircle, FiShare2, FiPrinter } from 'react-icons/fi';
import { FaQrcode, FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { getUser } from '../utils/auth';

/**
 * QRBookingCode component — Generates QR code for doctor's booking link.
 * Uses a lightweight QR generation approach via a public QR API (no npm dep needed).
 * Props:
 *   - doctorId: string (override, otherwise uses logged-in user)
 *   - size: number (default 200)
 *   - showActions: boolean (default true)
 */
export default function QRBookingCode({ doctorId, size = 200, showActions = true }) {
  const user = getUser();
  const id = doctorId || user?.id || user?._id;
  const canvasRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState(null);

  const bookingUrl = `${window.location.origin}/book/${id}`;
  const profileUrl = `${window.location.origin}/doctor/${id}`;

  // Generate QR using canvas-based approach (no external dependency)
  useEffect(() => {
    if (!id) return;
    generateQR();
  }, [id, size]);

  const generateQR = async () => {
    // Use Google Charts QR API as a reliable fallback
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(bookingUrl)}&color=4f46e5&bgcolor=ffffff&margin=10`;
    
    // Load into an image then draw to canvas for download capability
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const padding = 40;
      const totalWidth = size + padding * 2;
      const totalHeight = size + padding * 2 + 60; // extra space for text
      
      canvas.width = totalWidth;
      canvas.height = totalHeight;
      const ctx = canvas.getContext('2d');
      
      // White background with rounded feel
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, totalWidth, totalHeight);
      
      // Draw QR
      ctx.drawImage(img, padding, padding, size, size);
      
      // Doctor name text
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 14px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Dr. ${user?.name || 'Doctor'}`, totalWidth / 2, size + padding + 25);
      
      // "Scan to Book" text
      ctx.fillStyle = '#6b7280';
      ctx.font = '11px Inter, system-ui, sans-serif';
      ctx.fillText('Scan to Book Appointment', totalWidth / 2, size + padding + 45);
      
      setQrDataUrl(canvas.toDataURL('image/png'));
    };
    img.src = qrImageUrl;
  };

  const copyLink = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    toast.success('Booking link copied!');
    setTimeout(() => setCopied(false), 3000);
  };

  const downloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `booking-qr-dr-${user?.name || 'doctor'}.png`;
    link.href = qrDataUrl;
    link.click();
    toast.success('QR code downloaded!');
  };

  const printQR = () => {
    if (!qrDataUrl) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head><title>Booking QR - Dr. ${user?.name || 'Doctor'}</title></head>
        <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui;margin:0;">
          <div style="text-align:center;padding:40px;border:2px solid #e5e7eb;border-radius:24px;max-width:350px;">
            <h2 style="color:#1f2937;margin:0 0 5px;">Dr. ${user?.name || 'Doctor'}</h2>
            <p style="color:#6b7280;margin:0 0 20px;font-size:14px;">${user?.specialty || 'General Physician'} • ${user?.clinicName || ''}</p>
            <img src="${qrDataUrl}" style="width:250px;height:auto;margin:0 auto;display:block;" />
            <p style="color:#4f46e5;font-weight:600;margin:20px 0 5px;font-size:16px;">Scan to Book Appointment</p>
            <p style="color:#9ca3af;font-size:11px;word-break:break-all;">${bookingUrl}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  const shareWhatsApp = () => {
    const text = `Book an appointment with Dr. ${user?.name || 'Doctor'} online:\n${bookingUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (!id) return null;

  return (
    <div className="space-y-4">
      {/* QR Display */}
      <div className="flex flex-col items-center">
        <div className="relative bg-white rounded-2xl p-4 shadow-lg border border-gray-100 dark:border-gray-700 inline-block">
          <canvas ref={canvasRef} className="hidden" />
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="Booking QR Code" className="w-48 h-48 md:w-56 md:h-56" />
          ) : (
            <div className="w-48 h-48 md:w-56 md:h-56 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
              <FaQrcode className="text-4xl text-gray-300 animate-pulse" />
            </div>
          )}
          {/* Corner accent */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-indigo-500 rounded-tl-lg" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-indigo-500 rounded-tr-lg" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-indigo-500 rounded-bl-lg" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-indigo-500 rounded-br-lg" />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 text-center">
          Patients scan this to book appointments online
        </p>
      </div>

      {/* Booking Link */}
      <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
        <input
          type="text"
          readOnly
          value={bookingUrl}
          className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-300 outline-none truncate"
        />
        <button
          onClick={copyLink}
          className={`p-2 rounded-lg transition-all ${copied ? 'bg-emerald-100 text-emerald-600' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100'}`}
          title="Copy link"
        >
          {copied ? <FiCheckCircle /> : <FiCopy />}
        </button>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button onClick={downloadQR} className="flex flex-col items-center gap-1.5 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all">
            <FiDownload className="text-blue-600" />
            <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Download</span>
          </button>
          <button onClick={printQR} className="flex flex-col items-center gap-1.5 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all">
            <FiPrinter className="text-purple-600" />
            <span className="text-xs font-medium text-purple-700 dark:text-purple-400">Print</span>
          </button>
          <button onClick={shareWhatsApp} className="flex flex-col items-center gap-1.5 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 transition-all">
            <FaWhatsapp className="text-green-600" />
            <span className="text-xs font-medium text-green-700 dark:text-green-400">WhatsApp</span>
          </button>
          <button onClick={copyLink} className="flex flex-col items-center gap-1.5 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700">
            <FiShare2 className="text-gray-600 dark:text-gray-400" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-400">Share</span>
          </button>
        </div>
      )}
    </div>
  );
}
