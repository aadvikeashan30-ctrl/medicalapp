import React from 'react';
import { getUser } from '../utils/auth';

/**
 * Printable invoice template. Render in a modal/page and use window.print().
 */
export default function PrintInvoice({ invoice, onClose }) {
  const user = getUser();

  const handlePrint = () => {
    window.print();
  };

  if (!invoice) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-auto print:static">
      {/* Print controls (hidden on print) */}
      <div className="print:hidden flex items-center justify-between p-4 border-b bg-gray-50">
        <h2 className="font-bold text-gray-900">Invoice Preview</h2>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="btn-primary text-sm">Print / Download PDF</button>
          {onClose && <button onClick={onClose} className="btn-secondary text-sm">Close</button>}
        </div>
      </div>

      {/* Invoice Content */}
      <div className="max-w-3xl mx-auto p-8 print:p-0">
        {/* Header */}
        <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-blue-600">
          <div>
            <h1 className="text-2xl font-bold text-blue-600">{user.clinicName || 'Medical Clinic'}</h1>
            <p className="text-sm text-gray-600 mt-1">{user.clinicAddress || ''}</p>
            <p className="text-sm text-gray-600">{user.phone || ''}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-900">INVOICE</h2>
            <p className="text-sm text-gray-600 mt-1">#{invoice.invoiceNumber || invoice._id?.slice(-8)}</p>
            <p className="text-sm text-gray-600">
              Date: {new Date(invoice.createdAt).toLocaleDateString('en-IN')}
            </p>
          </div>
        </div>


        {/* Patient Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg print:bg-gray-100">
          <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Bill To</h3>
          <p className="font-semibold text-gray-900">{invoice.patientId?.name || 'Patient'}</p>
          {invoice.patientId?.phone && <p className="text-sm text-gray-600">{invoice.patientId.phone}</p>}
          {invoice.patientId?.address && <p className="text-sm text-gray-600">{invoice.patientId.address}</p>}
        </div>

        {/* Line Items */}
        <table className="w-full mb-6">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 text-sm font-semibold text-gray-600">#</th>
              <th className="text-left py-3 text-sm font-semibold text-gray-600">Description</th>
              <th className="text-right py-3 text-sm font-semibold text-gray-600">Qty</th>
              <th className="text-right py-3 text-sm font-semibold text-gray-600">Rate</th>
              <th className="text-right py-3 text-sm font-semibold text-gray-600">Amount</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.items || []).map((item, idx) => (
              <tr key={idx} className="border-b border-gray-100">
                <td className="py-3 text-sm text-gray-600">{idx + 1}</td>
                <td className="py-3 text-sm text-gray-900 font-medium">{item.description || item.name}</td>
                <td className="py-3 text-sm text-gray-600 text-right">{item.quantity || 1}</td>
                <td className="py-3 text-sm text-gray-600 text-right">₹{(item.rate || item.amount || 0).toLocaleString('en-IN')}</td>
                <td className="py-3 text-sm text-gray-900 font-medium text-right">
                  ₹{((item.quantity || 1) * (item.rate || item.amount || 0)).toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64 space-y-2">
            {invoice.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount</span>
                <span className="text-red-600">-₹{invoice.discount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t-2 border-gray-900 pt-2">
              <span>Total</span>
              <span>₹{(invoice.totalAmount || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Status</span>
              <span className={`font-semibold ${invoice.status === 'paid' ? 'text-emerald-600' : 'text-red-600'}`}>
                {invoice.status?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t pt-4 text-center text-xs text-gray-400">
          <p>Thank you for choosing {user.clinicName || 'our clinic'}. Get well soon!</p>
          <p className="mt-1">Dr. {user.name} | {user.qualification || 'MBBS'} | Reg: {user.registrationNumber || '—'}</p>
        </div>
      </div>
    </div>
  );
}
