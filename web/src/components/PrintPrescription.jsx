import React from 'react';
import { getUser } from '../utils/auth';

export default function PrintPrescription({ prescription, onClose }) {
  const user = getUser();
  const handlePrint = () => window.print();

  if (!prescription) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-auto print:static">
      <div className="print:hidden flex items-center justify-between p-4 border-b bg-gray-50">
        <h2 className="font-bold text-gray-900">Prescription Preview</h2>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="btn-primary text-sm">Print / PDF</button>
          {onClose && <button onClick={onClose} className="btn-secondary text-sm">Close</button>}
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-8 print:p-0">
        {/* Clinic Header */}
        <div className="border-b-2 border-blue-600 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold text-blue-700">Dr. {user.name || 'Doctor'}</h1>
              <p className="text-sm text-gray-600">{user.qualification || 'MBBS, MD'}</p>
              <p className="text-sm text-gray-600">{user.specialty || 'General Physician'}</p>
            </div>
            <div className="text-right text-sm text-gray-600">
              <p className="font-semibold text-gray-900">{user.clinicName || 'Clinic'}</p>
              <p>{user.clinicAddress || ''}</p>
              <p>Ph: {user.phone || ''}</p>
              <p>Reg: {user.registrationNumber || ''}</p>
            </div>
          </div>
        </div>


        {/* Patient Info */}
        <div className="grid grid-cols-2 gap-4 mb-6 p-3 bg-gray-50 rounded-lg text-sm">
          <div>
            <span className="text-gray-500">Patient:</span>{' '}
            <span className="font-semibold">{prescription.patientId?.name || 'Patient'}</span>
          </div>
          <div>
            <span className="text-gray-500">Age/Gender:</span>{' '}
            <span className="font-semibold">
              {prescription.patientId?.age || '—'} / {prescription.patientId?.gender || '—'}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Date:</span>{' '}
            <span className="font-semibold">{new Date(prescription.createdAt).toLocaleDateString('en-IN')}</span>
          </div>
          <div>
            <span className="text-gray-500">Diagnosis:</span>{' '}
            <span className="font-semibold">{prescription.diagnosis || '—'}</span>
          </div>
        </div>

        {/* Rx Symbol */}
        <div className="mb-4">
          <span className="text-3xl font-bold text-blue-600 italic">℞</span>
        </div>

        {/* Medicines Table */}
        <table className="w-full mb-6">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-2 text-sm font-semibold text-gray-600">#</th>
              <th className="text-left py-2 text-sm font-semibold text-gray-600">Medicine</th>
              <th className="text-left py-2 text-sm font-semibold text-gray-600">Dosage</th>
              <th className="text-left py-2 text-sm font-semibold text-gray-600">Duration</th>
              <th className="text-left py-2 text-sm font-semibold text-gray-600">Instructions</th>
            </tr>
          </thead>
          <tbody>
            {(prescription.medicines || []).map((med, idx) => (
              <tr key={idx} className="border-b border-gray-100">
                <td className="py-2.5 text-sm">{idx + 1}</td>
                <td className="py-2.5 text-sm font-medium text-gray-900">
                  {med.name} {med.strength ? `(${med.strength})` : ''}
                </td>
                <td className="py-2.5 text-sm text-gray-700">{med.frequency || med.dosage || '—'}</td>
                <td className="py-2.5 text-sm text-gray-700">{med.duration || '—'}</td>
                <td className="py-2.5 text-sm text-gray-600">{med.timing || med.instructions || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Notes */}
        {prescription.notes && (
          <div className="mb-6 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm font-semibold text-amber-800 mb-1">Notes:</p>
            <p className="text-sm text-amber-700">{prescription.notes}</p>
          </div>
        )}

        {/* Follow-up */}
        {prescription.followUp && (
          <div className="mb-6 text-sm">
            <span className="text-gray-600">Follow-up:</span>{' '}
            <span className="font-semibold text-blue-700">{prescription.followUp}</span>
          </div>
        )}

        {/* Signature */}
        <div className="mt-12 text-right">
          <div className="inline-block border-t-2 border-gray-400 pt-2 px-8">
            <p className="font-semibold text-gray-900">Dr. {user.name}</p>
            <p className="text-xs text-gray-500">{user.qualification || 'MBBS'}</p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 border-t pt-3 text-center text-[10px] text-gray-400">
          <p>This prescription is valid for 30 days. Consult your doctor before making changes to medication.</p>
        </div>
      </div>
    </div>
  );
}
