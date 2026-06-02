import React, { useState, useEffect } from 'react';
import { FiShield, FiFilter, FiDownload, FiDatabase } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ action: '', resource: '', severity: '' });
  const [backups, setBackups] = useState([]);
  const [tab, setTab] = useState('logs');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 30, ...filters };
      Object.keys(params).forEach(k => { if (!params[k]) delete params[k]; });
      const { data } = await api.get('/enterprise/audit-logs', { params });
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (err) {
      toast.error('Failed to load audit logs');
    }
    setLoading(false);
  };

  const fetchBackups = async () => {
    try {
      const { data } = await api.get('/enterprise/backups');
      setBackups(data || []);
    } catch (err) { /* ignore */ }
  };

  useEffect(() => { if (tab === 'logs') fetchLogs(); else fetchBackups(); }, [page, filters, tab]);

  const handleCreateBackup = async () => {
    try {
      await api.post('/enterprise/backups', { backupType: 'full' });
      toast.success('Backup created');
      fetchBackups();
    } catch (err) {
      toast.error('Backup failed');
    }
  };

  const ACTIONS = ['create', 'read', 'update', 'delete', 'login', 'logout', 'failed-login', 'export', 'prescription-create', 'patient-create', 'billing-create', 'settings-update', 'backup-create'];
  const RESOURCES = ['Patient', 'Prescription', 'Appointment', 'Billing', 'User', 'Settings'];
  const SEVERITIES = ['info', 'warning', 'critical'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FiShield className="text-slate-600" /> Audit Logs & Backup
          </h1>
          <p className="text-gray-500 text-sm mt-1">Activity tracking, compliance, and data protection</p>
        </div>
        {tab === 'backups' && (
          <button onClick={handleCreateBackup} className="bg-slate-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-700">
            <FiDatabase size={14} /> Create Backup
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab('logs')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${tab === 'logs' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400'}`}><FiShield size={14} /> Audit Logs</button>
        <button onClick={() => setTab('backups')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${tab === 'backups' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400'}`}><FiDatabase size={14} /> Backups</button>
      </div>

      {/* Audit Logs */}
      {tab === 'logs' && (
        <>
          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-wrap gap-3 items-center">
            <FiFilter className="text-gray-400" />
            <select value={filters.action} onChange={e => setFilters({ ...filters, action: e.target.value })} className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm">
              <option value="">All Actions</option>
              {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <select value={filters.resource} onChange={e => setFilters({ ...filters, resource: e.target.value })} className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm">
              <option value="">All Resources</option>
              {RESOURCES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select value={filters.severity} onChange={e => setFilters({ ...filters, severity: e.target.value })} className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm">
              <option value="">All Severities</option>
              {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span className="text-xs text-gray-400 ml-auto">{total} records</span>
          </div>

          {/* Logs Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            {loading ? <div className="text-center py-12 text-gray-500">Loading...</div> : logs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No audit logs found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">Time</th>
                      <th className="text-left px-4 py-3 font-medium">Action</th>
                      <th className="text-left px-4 py-3 font-medium">Resource</th>
                      <th className="text-left px-4 py-3 font-medium">Description</th>
                      <th className="text-left px-4 py-3 font-medium">Severity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-700">
                    {logs.map(log => (
                      <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(log.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs rounded">{log.action}</span></td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{log.resource}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-xs truncate">{log.description || '-'}</td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${log.severity === 'critical' ? 'bg-red-100 text-red-700' : log.severity === 'warning' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>{log.severity}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {/* Pagination */}
            {total > 30 && (
              <div className="flex justify-center gap-2 p-4 border-t dark:border-gray-700">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-sm rounded bg-gray-100 dark:bg-gray-700 disabled:opacity-50">Prev</button>
                <span className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400">Page {page}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={page * 30 >= total} className="px-3 py-1 text-sm rounded bg-gray-100 dark:bg-gray-700 disabled:opacity-50">Next</button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Backups */}
      {tab === 'backups' && (
        <div className="space-y-3">
          {backups.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border"><FiDatabase className="mx-auto text-4xl text-gray-300 mb-3" /><p className="text-gray-500">No backups yet</p></div>
          ) : backups.map(b => (
            <div key={b._id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{b.fileName}</p>
                <p className="text-sm text-gray-500">{b.backupType} | {b.recordCount} records</p>
                <p className="text-xs text-gray-400">{new Date(b.createdAt).toLocaleString('en-IN')}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${b.status === 'completed' ? 'bg-green-100 text-green-700' : b.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{b.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
