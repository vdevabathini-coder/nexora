import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Filter, Clock, User, FileText, ArrowRight } from 'lucide-react';
import { AuditLog } from '../../types';
import { api } from '../../services/api';

export function AuditTrail() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadLogs = async () => {
    const list = await api.getAuditLogs();
    setLogs(list);
  };

  useEffect(() => {
    loadLogs();
    const unsub = api.subscribe(loadLogs);
    return unsub;
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesAction = filterAction === 'ALL' || log.action === filterAction;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      log.details.toLowerCase().includes(q) ||
      log.userName.toLowerCase().includes(q) ||
      (log.patientId && log.patientId.toLowerCase().includes(q)) ||
      log.action.toLowerCase().includes(q);

    return matchesAction && matchesSearch;
  });

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 font-display">
              Operational Audit Trail & Governance Ledger
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Immutable chronological record of workflow transitions, bed assignments, and recovery actions
            </p>
          </div>
        </div>

        <span className="text-xs font-mono text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
          {filteredLogs.length} Total Audit Records
        </span>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden"
          />
        </div>

        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden"
        >
          <option value="ALL">All Operational Actions</option>
          <option value="PATIENT_REGISTERED">PATIENT_REGISTERED</option>
          <option value="STAGE_ADVANCED">STAGE_ADVANCED</option>
          <option value="BED_ASSIGNED">BED_ASSIGNED</option>
          <option value="BED_RELEASED">BED_RELEASED</option>
          <option value="BED_STATUS_UPDATED">BED_STATUS_UPDATED</option>
          <option value="DIAGNOSTIC_ORDERED">DIAGNOSTIC_ORDERED</option>
          <option value="DIAGNOSTIC_UPDATED">DIAGNOSTIC_UPDATED</option>
          <option value="PATIENT_DISCHARGED">PATIENT_DISCHARGED</option>
          <option value="RECOVERY_ACTION_APPLIED">RECOVERY_ACTION_APPLIED</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4">Authorized User</th>
                <th className="py-3 px-4">Patient / Subject</th>
                <th className="py-3 px-4">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    No matching audit entries found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-800">{log.userName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.userRole}</div>
                    </td>

                    <td className="py-3 px-4 font-mono font-semibold text-slate-700 whitespace-nowrap">
                      {log.patientId || '-'}
                    </td>

                    <td className="py-3 px-4 text-slate-700 leading-relaxed">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
