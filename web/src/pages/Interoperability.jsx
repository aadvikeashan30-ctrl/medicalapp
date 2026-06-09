import React, { useState } from 'react';
import {
  FiShare2, FiDownload, FiUpload, FiCode, FiCheckCircle, FiDatabase, FiServer
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useApi } from '../hooks/useApi';
import PatientSearchSelect from '../components/PatientSearchSelect';

export default function Interoperability() {
  const { data: patients } = useApi('/patients?limit=200');
  const { data: meta } = useApi('/fhir/metadata');

  const [patientId, setPatientId] = useState('');
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);

  const exportBundle = async () => {
    if (!patientId) return toast.error('Select a patient');
    setLoading(true);
    setBundle(null);
    try {
      const res = await api.get(`/fhir/Patient/${patientId}/everything`);
      setBundle(res.data);
      toast.success('FHIR bundle generated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!bundle) return;
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/fhir+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fhir-bundle-${patientId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const runImport = async () => {
    let parsed;
    try { parsed = JSON.parse(importText); } catch (e) { return toast.error('Invalid JSON'); }
    setImporting(true);
    try {
      const res = await api.post('/fhir/Patient', parsed);
      toast.success(`Imported as ${res.data.patientId || 'patient'}`);
      setImportText('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };


  const resources = meta?.rest?.[0]?.resource || [];

  return (
    <div className="page-enter space-y-6">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
            <FiShare2 className="text-white text-lg" />
          </div>
          FHIR Interoperability
        </h1>
        <p className="text-sm text-gray-500 mt-1">Exchange records with external EHRs using HL7 FHIR R4 — export bundles or import patients</p>
      </div>

      {/* Capability banner */}
      <div className="card flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center"><FiServer className="text-sky-600" /></div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">FHIR {meta?.fhirVersion || 'R4'} server</p>
            <p className="text-xs text-gray-500">{meta?.externalServer ? `Linked: ${meta.externalServer}` : 'No external FHIR server linked (set FHIR_BASE_URL to connect Epic/Cerner)'}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {resources.map((r) => <span key={r.type} className="badge badge-info">{r.type}</span>)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Export */}
        <div className="card space-y-4">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><FiDownload className="text-sky-600" /> Export Patient Record</h3>
          <PatientSearchSelect patients={(patients?.patients || patients || [])} value={patientId} onChange={setPatientId} placeholder="Select a patient to export..." />
          <button onClick={exportBundle} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2"><FiCode /> {loading ? 'Generating...' : 'Generate FHIR Bundle'}</button>
          {bundle && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 flex items-center gap-1.5"><FiCheckCircle className="text-emerald-500" /> {bundle.total} resources</span>
                <button onClick={download} className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1"><FiDownload /> Download .json</button>
              </div>
              <pre className="text-[11px] bg-gray-900 text-gray-100 rounded-xl p-3 overflow-auto max-h-72 custom-scroll">{JSON.stringify(bundle, null, 2)}</pre>
            </>
          )}
        </div>

        {/* Import */}
        <div className="card space-y-4">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><FiUpload className="text-emerald-600" /> Import FHIR Patient</h3>
          <p className="text-sm text-gray-500">Paste a FHIR <code className="text-xs bg-gray-100 px-1 rounded">Patient</code> resource to create a local record.</p>
          <textarea value={importText} onChange={(e) => setImportText(e.target.value)} rows={12} className="input-field font-mono text-xs" placeholder='{\n  "resourceType": "Patient",\n  "name": [{ "text": "Jane Doe" }],\n  "gender": "female",\n  "telecom": [{ "system": "phone", "value": "9876500099" }]\n}' />
          <button onClick={runImport} disabled={importing} className="btn-primary w-full flex items-center justify-center gap-2"><FiDatabase /> {importing ? 'Importing...' : 'Import Patient'}</button>
        </div>
      </div>
    </div>
  );
}
