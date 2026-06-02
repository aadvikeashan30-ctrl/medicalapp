import React, { useState } from 'react';
import { FiSearch, FiFileText, FiAlertTriangle, FiCheckCircle, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function AILabAnalyzer() {
  const [patientId, setPatientId] = useState('');
  const [reportType, setReportType] = useState('cbc');
  const [reportData, setReportData] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const REPORT_TYPES = [
    { value: 'cbc', label: 'Complete Blood Count (CBC)' },
    { value: 'lipid', label: 'Lipid Profile' },
    { value: 'liver', label: 'Liver Function Test (LFT)' },
    { value: 'kidney', label: 'Kidney Function Test (KFT)' },
    { value: 'thyroid', label: 'Thyroid Panel' },
    { value: 'diabetes', label: 'Diabetes Panel (HbA1c, FBS)' },
    { value: 'urine', label: 'Urine Analysis' },
    { value: 'vitamin', label: 'Vitamin Panel' },
    { value: 'general', label: 'General / Other' }
  ];

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!patientId || !reportData.trim()) {
      toast.error('Please fill in patient ID and report data');
      return;
    }
    setLoading(true);
    setAnalysis(null);

    try {
      let parsedData;
      try {
        parsedData = JSON.parse(reportData);
      } catch {
        parsedData = reportData;
      }

      const { data } = await api.post('/chatbot/analyze-lab-report', {
        patientId,
        reportType,
        reportData: parsedData
      });
      setAnalysis(data.analysis);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Analysis failed');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FiSearch className="text-teal-600" /> AI Lab Report Analyzer
        </h1>
        <p className="text-gray-500 text-sm mt-1">AI-powered interpretation of laboratory results</p>
      </div>

      {/* Input Form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <form onSubmit={handleAnalyze} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Patient ID</label>
              <input type="text" value={patientId} onChange={e => setPatientId(e.target.value)} required className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Report Type</label>
              <select value={reportType} onChange={e => setReportType(e.target.value)} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                {REPORT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Lab Report Data <span className="text-xs text-gray-400">(Paste report values as text or JSON)</span>
            </label>
            <textarea
              value={reportData}
              onChange={e => setReportData(e.target.value)}
              rows={6}
              required
              placeholder={`Example:\nHemoglobin: 12.5 g/dL\nWBC: 8500 /uL\nPlatelets: 250000 /uL\nRBC: 4.5 million/uL\n\nOr paste as JSON: {"hemoglobin": 12.5, "wbc": 8500, ...}`}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-sm"
            />
          </div>
          <button type="submit" disabled={loading} className="bg-teal-600 text-white px-6 py-2.5 rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2">
            {loading ? <span className="animate-spin">⏳</span> : <FiSearch />}
            {loading ? 'Analyzing...' : 'Analyze Report'}
          </button>
        </form>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Summary</h2>
            <p className="text-gray-700 dark:text-gray-300">{analysis.summary}</p>
            {analysis.urgency && (
              <div className={`mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                analysis.urgency === 'immediate' ? 'bg-red-100 text-red-700' :
                analysis.urgency === 'urgent' ? 'bg-orange-100 text-orange-700' :
                analysis.urgency === 'follow-up' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                {analysis.urgency === 'routine' ? <FiCheckCircle /> : <FiAlertTriangle />}
                {analysis.urgency}
              </div>
            )}
          </div>

          {/* Findings */}
          {analysis.findings && analysis.findings.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Detailed Findings</h2>
              <div className="space-y-3">
                {analysis.findings.map((f, i) => (
                  <div key={i} className={`p-3 rounded-lg border ${
                    f.status === 'critical' ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' :
                    f.status === 'high' || f.status === 'low' ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800' :
                    'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">{f.parameter}</span>
                        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                          {f.value} {f.normalRange && `(Normal: ${f.normalRange})`}
                        </span>
                      </div>
                      <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded ${
                        f.status === 'high' ? 'bg-red-100 text-red-700' :
                        f.status === 'low' ? 'bg-blue-100 text-blue-700' :
                        f.status === 'critical' ? 'bg-red-200 text-red-800' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {f.status === 'high' && <FiArrowUp />}
                        {f.status === 'low' && <FiArrowDown />}
                        {f.status}
                      </span>
                    </div>
                    {f.significance && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{f.significance}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Recommendations</h2>
              <ul className="space-y-2">
                {analysis.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="text-teal-500 mt-0.5">•</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Disclaimer */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <p className="text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <FiAlertTriangle className="mt-0.5 flex-shrink-0" />
              This AI analysis is for informational purposes only. Always consult with your healthcare provider for proper interpretation and medical decisions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
