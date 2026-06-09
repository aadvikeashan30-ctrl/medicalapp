import React from 'react';
import { getUser } from '../utils/auth';

export default function PrintPrescription({ prescription, onClose }) {
  const loggedInUser = getUser();
  
  if (!prescription) return null;

  // Crucial: Use prescription doctor context if populated, otherwise fallback to loggedInUser
  const doctor = (typeof prescription.doctorId === 'object' && prescription.doctorId) ? prescription.doctorId : loggedInUser;
  
  const docName = doctor.name || 'Doctor';
  const docSpecialty = doctor.specialty || 'General Medicine';
  const docQualification = doctor.qualification || 'MBBS, MD';
  const docRegNo = doctor.registrationNo || doctor.registrationNumber || 'REG-DEMO-001';
  const clinicName = doctor.clinicName || loggedInUser.clinicName || 'MedCore Clinic';
  const clinicAddress = doctor.clinicAddress || loggedInUser.clinicAddress || '123 Health Street';
  const clinicPhone = doctor.phone || loggedInUser.phone || '9000000000';

  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-auto print:static">
      <div className="print:hidden flex items-center justify-between p-4 border-b bg-gray-50">
        <h2 className="font-bold text-gray-900">Prescription Preview</h2>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="btn-primary text-sm flex items-center gap-1">
            Print / PDF
          </button>
          {onClose && <button onClick={onClose} className="btn-secondary text-sm">Close</button>}
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-8 print:p-0">
        {/* Clinic Header */}
        <div className="border-b-2 border-teal-600 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold text-teal-700">Dr. {docName}</h1>
              <p className="text-xs text-gray-600 font-semibold">{docQualification}</p>
              <p className="text-xs text-gray-500 capitalize">{docSpecialty} Specialist</p>
              <p className="text-[10px] text-gray-400 mt-1 font-mono">Reg No: {docRegNo}</p>
            </div>
            <div className="text-right text-xs text-gray-600">
              <p className="font-bold text-gray-900 text-sm uppercase">{clinicName}</p>
              <p className="max-w-[200px] text-right mt-0.5">{clinicAddress}</p>
              <p className="mt-0.5 font-mono">Ph: {clinicPhone}</p>
            </div>
          </div>
        </div>

        {/* Patient Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-xl text-xs border border-gray-100">
          <div>
            <span className="text-gray-400 font-medium block">PATIENT NAME</span>
            <span className="font-bold text-gray-900 text-sm">{prescription.patientId?.name || 'Patient'}</span>
          </div>
          <div>
            <span className="text-gray-400 font-medium block">AGE / GENDER</span>
            <span className="font-semibold text-gray-800">
              {prescription.patientId?.age || '—'} Yrs / {prescription.patientId?.gender || '—'}
            </span>
          </div>
          <div>
            <span className="text-gray-400 font-medium block">DATE</span>
            <span className="font-semibold text-gray-800">
              {new Date(prescription.createdAt || prescription.date || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <div>
            <span className="text-gray-400 font-medium block">UHID (PATIENT ID)</span>
            <span className="font-mono font-semibold text-indigo-700">
              {prescription.patientId?.patientId || 'UHID-NEW'}
            </span>
          </div>
          {prescription.diagnosis && (
            <div className="col-span-2 md:col-span-4 border-t pt-2 mt-1">
              <span className="text-gray-400 font-medium block">PROVISIONAL DIAGNOSIS</span>
              <span className="font-bold text-teal-800 text-sm">{prescription.diagnosis}</span>
            </div>
          )}
        </div>

        {/* Vitals Summary Strip */}
        {prescription.vitals && Object.values(prescription.vitals).some(val => val) && (
          <div className="mb-6 p-3.5 bg-cyan-50/30 rounded-xl text-[11px] border border-cyan-100/60 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {prescription.vitals.bp && (
              <div>
                <span className="text-gray-400 font-medium block">Blood Pressure</span>
                <span className="font-semibold text-gray-800">{prescription.vitals.bp} mmHg</span>
              </div>
            )}
            {prescription.vitals.pulse && (
              <div>
                <span className="text-gray-400 font-medium block">Pulse Rate</span>
                <span className="font-semibold text-gray-800">{prescription.vitals.pulse} bpm</span>
              </div>
            )}
            {prescription.vitals.temperature && (
              <div>
                <span className="text-gray-400 font-medium block">Temperature</span>
                <span className="font-semibold text-gray-800">{prescription.vitals.temperature} °F</span>
              </div>
            )}
            {prescription.vitals.weight && (
              <div>
                <span className="text-gray-400 font-medium block">Weight</span>
                <span className="font-semibold text-gray-800">{prescription.vitals.weight} kg</span>
              </div>
            )}
            {prescription.vitals.height && (
              <div>
                <span className="text-gray-400 font-medium block">Height</span>
                <span className="font-semibold text-gray-800">{prescription.vitals.height} cm</span>
              </div>
            )}
            {prescription.vitals.spo2 && (
              <div>
                <span className="text-gray-400 font-medium block">SpO₂</span>
                <span className="font-semibold text-gray-800">{prescription.vitals.spo2} %</span>
              </div>
            )}
            {prescription.vitals.rbs && (
              <div>
                <span className="text-gray-400 font-medium block">Blood Sugar</span>
                <span className="font-semibold text-gray-800">{prescription.vitals.rbs} mg/dL</span>
              </div>
            )}
          </div>
        )}

        {/* Rx Symbol */}
        <div className="mb-4">
          <span className="text-4xl font-extrabold text-teal-600 italic">℞</span>
        </div>

        {/* Medicines Table */}
        <table className="w-full mb-6">
          <thead>
            <tr className="border-b-2 border-gray-300 text-left">
              <th className="py-2 text-xs font-bold text-gray-400 uppercase w-10">#</th>
              <th className="py-2 text-xs font-bold text-gray-400 uppercase">Medicine Description</th>
              <th className="py-2 text-xs font-bold text-gray-400 uppercase w-32">Dosage / Freq</th>
              <th className="py-2 text-xs font-bold text-gray-400 uppercase w-28">Duration</th>
              <th className="py-2 text-xs font-bold text-gray-400 uppercase w-36">Timing / Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(prescription.medicines || []).map((med, idx) => (
              <tr key={idx} className="align-middle">
                <td className="py-3 text-sm text-gray-500 font-medium">{idx + 1}</td>
                <td className="py-3 text-sm font-bold text-gray-900">
                  {med.name} {med.strength ? `(${med.strength})` : ''}
                </td>
                <td className="py-3 text-sm font-semibold text-gray-700 font-mono">{med.frequency || med.dosage || '—'}</td>
                <td className="py-3 text-sm text-gray-700">{med.duration || '—'}</td>
                <td className="py-3 text-xs text-gray-600 italic">
                  {med.timing?.replace('-', ' ') || med.instructions || '—'}
                  {med.notes && <span className="block text-[10px] text-gray-400 font-normal mt-0.5">Note: {med.notes}</span>}
                </td>
              </tr>
            ))}
            {(prescription.medicines || []).length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-sm text-gray-400 italic">No medications prescribed.</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Advice and Notes */}
        {prescription.advice && (
          <div className="mb-6 p-4 bg-teal-50/20 rounded-xl border border-teal-100/50">
            <p className="text-xs font-bold text-teal-800 uppercase tracking-wider mb-1">Advice & Instructions</p>
            <p className="text-sm text-gray-700 whitespace-pre-line">{prescription.advice}</p>
          </div>
        )}

        {/* Follow-up Date */}
        {prescription.followUpDate && (
          <div className="mb-6 p-3 bg-indigo-50/20 rounded-xl border border-indigo-100/40 text-xs">
            <span className="text-gray-500 uppercase font-semibold mr-2">Follow-up Visit Date:</span>
            <span className="font-bold text-indigo-700">
              {new Date(prescription.followUpDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        )}

        {/* Doctor Signature Pad */}
        <div className="mt-16 flex justify-between items-end">
          <div className="text-[10px] text-gray-400">
            * Generated electronically via MedCore HMS.<br />
            * Valid for 30 days from date of issue.
          </div>
          <div className="text-center">
            <div className="w-48 border-t border-gray-400 pt-2">
              <p className="font-bold text-gray-900 text-xs">Dr. {docName}</p>
              <p className="text-[10px] text-gray-500 font-semibold">{docQualification}</p>
              <p className="text-[9px] text-gray-400 font-mono">Reg: {docRegNo}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
