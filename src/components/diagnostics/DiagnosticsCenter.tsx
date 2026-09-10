import React, { useState, useEffect, useMemo } from 'react';
import {
  FlaskConical,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Check,
  X,
  Scan,
  Activity,
  FileCheck,
} from 'lucide-react';
import { DiagnosticRecord, DiagnosticStatus, DiagnosticModality, Patient, Visit } from '../../types';
import { api } from '../../services/api';

interface DiagnosticsCenterProps {
  onSelectPatient: (patientId: string) => void;
}

const MODALITY_OPTIONS: { id: DiagnosticModality; name: string; dept: string }[] = [
  { id: 'CT_SCAN', name: 'Computed Tomography (CT Scan)', dept: 'DEP-RADIOLOGY' },
  { id: 'XRAY', name: 'Digital Radiography (X-Ray)', dept: 'DEP-RADIOLOGY' },
  { id: 'MRI', name: 'Magnetic Resonance Imaging (MRI)', dept: 'DEP-RADIOLOGY' },
  { id: 'ULTRASOUND', name: 'Diagnostic Ultrasound', dept: 'DEP-RADIOLOGY' },
  { id: 'BLOOD_TEST', name: 'Complete Blood Count (CBC)', dept: 'DEP-LAB' },
  { id: 'CARDIAC_ENZYMES', name: 'Troponin & Cardiac Biomarkers', dept: 'DEP-LAB' },
  { id: 'URINALYSIS', name: 'Comprehensive Urinalysis', dept: 'DEP-LAB' },
  { id: 'PATHOLOGY', name: 'Biopsy Pathology Analysis', dept: 'DEP-LAB' },
];

export function DiagnosticsCenter({ onSelectPatient }: DiagnosticsCenterProps) {
  const [records, setRecords] = useState<DiagnosticRecord[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [modalityFilter, setModalityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // New Order Modal
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [selectedVisitId, setSelectedVisitId] = useState('');
  const [selectedModality, setSelectedModality] = useState<DiagnosticModality>('CT_SCAN');
  const [priority, setPriority] = useState<'ROUTINE' | 'STAT' | 'URGENT'>('URGENT');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    const [r, p, v] = await Promise.all([
      api.getDiagnostics(),
      api.getPatients(),
      api.getVisits(),
    ]);
    setRecords(r);
    setPatients(p);
    setVisits(v);
  };

  useEffect(() => {
    loadData();
    const unsub = api.subscribe(loadData);
    return unsub;
  }, []);

  const activeVisits = visits.filter(
    (v) => v.currentStage !== 'DISCHARGED' && v.currentStage !== 'CANCELLED'
  );

  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const matchesStatus = statusFilter === 'ALL' || rec.status === statusFilter;
      const matchesModality = modalityFilter === 'ALL' || rec.modality === modalityFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        rec.patientName.toLowerCase().includes(q) ||
        rec.id.toLowerCase().includes(q) ||
        rec.testName.toLowerCase().includes(q) ||
        rec.patientId.toLowerCase().includes(q);

      return matchesStatus && matchesModality && matchesSearch;
    });
  }, [records, statusFilter, modalityFilter, searchQuery]);

  const stats = {
    total: records.length,
    requested: records.filter((r) => r.status === 'REQUESTED').length,
    inProgress: records.filter((r) => r.status === 'IN_PROGRESS' || r.status === 'SAMPLE_COLLECTED').length,
    completed: records.filter((r) => r.status === 'COMPLETED').length,
    avgTurnaround: Math.round(
      records
        .filter((r) => r.turnaroundTimeMinutes)
        .reduce((acc, r) => acc + (r.turnaroundTimeMinutes || 0), 0) /
        (records.filter((r) => r.turnaroundTimeMinutes).length || 1)
    ),
  };

  const handleUpdateStatus = async (
    recordId: string,
    status: DiagnosticStatus,
    resultsNotes?: string
  ) => {
    await api.updateDiagnosticStatus(recordId, status, resultsNotes);
  };

  const handleAcceptOrder = async (rec: DiagnosticRecord) => {
    if (rec.status === 'REQUESTED') {
      await api.acceptDiagnostic(rec.id, 'IN_PROGRESS', 'Order accepted by diagnostic technician.');
    } else if (rec.status === 'IN_PROGRESS') {
      const notes = window.prompt(
        `Accept clinical findings for ${rec.testName} (${rec.patientName}):`,
        'Findings verified and clinically cleared. Diagnostic report filed to patient chart.'
      );
      if (notes !== null) {
        await api.acceptDiagnostic(rec.id, 'COMPLETED', notes);
      }
    }
  };

  const handleRejectOrder = async (rec: DiagnosticRecord) => {
    const reason = window.prompt(
      `Reject or cancel diagnostic order ${rec.id} for ${rec.patientName}? Enter reason:`,
      'Order cancelled: Duplicate request or clinical indication superseded.'
    );
    if (reason !== null) {
      await api.rejectDiagnostic(rec.id, reason);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const visit = visits.find((v) => v.id === selectedVisitId);
    if (!visit) return;

    const mod = MODALITY_OPTIONS.find((m) => m.id === selectedModality);

    setSubmitting(true);
    try {
      await api.createDiagnosticOrder({
        patientId: visit.patientId,
        visitId: visit.id,
        patientName: visit.patientName,
        modality: selectedModality,
        testName: mod ? mod.name : selectedModality,
        departmentId: mod?.dept || 'DEP-RADIOLOGY',
        notes: notes.trim() || undefined,
        priority,
      });

      setIsNewOrderOpen(false);
      setNotes('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-display">
            Diagnostics & Laboratory Turnaround Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time SLA tracking for imaging, pathology, and laboratory test orders
          </p>
        </div>

        <button
          onClick={() => {
            if (activeVisits.length > 0) setSelectedVisitId(activeVisits[0].id);
            setIsNewOrderOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition-all active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>New Diagnostic Order</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Awaiting Collection</span>
          <div className="text-2xl font-bold text-amber-700 font-display mt-0.5">
            {stats.requested}
          </div>
          <span className="text-[10px] text-slate-500">Queued in facility</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-blue-700 uppercase">Processing in Lab/Imaging</span>
          <div className="text-2xl font-bold text-blue-800 font-display mt-0.5">
            {stats.inProgress}
          </div>
          <span className="text-[10px] text-slate-500">Actively on scanner or bench</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-700 uppercase">Completed Today</span>
          <div className="text-2xl font-bold text-emerald-800 font-display mt-0.5">
            {stats.completed}
          </div>
          <span className="text-[10px] text-slate-500">Results verified & filed</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-700 uppercase">Average Turnaround</span>
          <div className="text-2xl font-bold text-slate-900 font-display mt-0.5">
            {stats.avgTurnaround} min
          </div>
          <span className="text-[10px] text-slate-500">Target SLA &lt; 45m</span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by patient, order ID, test name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">All Diagnostic Statuses</option>
            <option value="REQUESTED">Requested</option>
            <option value="SAMPLE_COLLECTED">Sample Collected</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <select
            value={modalityFilter}
            onChange={(e) => setModalityFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">All Modalities</option>
            <option value="CT_SCAN">Computed Tomography (CT)</option>
            <option value="XRAY">X-Ray Radiography</option>
            <option value="MRI">MRI</option>
            <option value="ULTRASOUND">Ultrasound</option>
            <option value="BLOOD_TEST">Blood Test (CBC)</option>
            <option value="CARDIAC_ENZYMES">Cardiac Enzymes</option>
            <option value="URINALYSIS">Urinalysis</option>
            <option value="PATHOLOGY">Pathology</option>
          </select>
        </div>
      </div>

      {/* Diagnostics Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Active Diagnostic Worklist ({filteredRecords.length} orders)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Test Modality</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Requested At</th>
                <th className="py-3 px-4">Turnaround Duration</th>
                <th className="py-3 px-4">Results Summary</th>
                <th className="py-3 px-4 text-right">Workflow Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    No matching diagnostic orders found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => {
                  const isCompleted = rec.status === 'COMPLETED';
                  const isDelayed = (rec.turnaroundTimeMinutes || 0) > 40;

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {rec.id}
                      </td>

                      <td className="py-3.5 px-4">
                        <div
                          onClick={() => onSelectPatient(rec.patientId)}
                          className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer"
                        >
                          {rec.patientName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {rec.patientId}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{rec.testName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{rec.modality}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isCompleted
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : rec.status === 'IN_PROGRESS'
                              ? 'bg-blue-50 text-blue-800 border border-blue-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        {new Date(rec.requestedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <span
                          className={`font-bold ${
                            isDelayed ? 'text-rose-600' : 'text-slate-700'
                          }`}
                        >
                          {rec.turnaroundTimeMinutes ? `${rec.turnaroundTimeMinutes} min` : 'Pending'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate">
                        {rec.resultsNotes || (
                          <span className="text-slate-400 italic">No results logged yet</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {rec.status === 'REQUESTED' && (
                            <>
                              {/* GREEN ACCEPT BUTTON */}
                              <button
                                onClick={() => handleAcceptOrder(rec)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-[11px] shadow-xs transition-all flex items-center gap-1"
                                title="Accept diagnostic order & begin processing"
                              >
                                <Check className="w-3 h-3" />
                                <span>Accept Order</span>
                              </button>

                              {/* RED REJECT BUTTON */}
                              <button
                                onClick={() => handleRejectOrder(rec)}
                                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-[11px] shadow-xs transition-all flex items-center gap-1"
                                title="Reject or cancel diagnostic order"
                              >
                                <X className="w-3 h-3" />
                                <span>Reject</span>
                              </button>
                            </>
                          )}

                          {rec.status === 'IN_PROGRESS' && (
                            <>
                              {/* GREEN COMPLETE BUTTON */}
                              <button
                                onClick={() => handleAcceptOrder(rec)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-[11px] shadow-xs transition-all flex items-center gap-1"
                                title="Accept clinical findings & complete test"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Accept Results</span>
                              </button>

                              {/* RED CANCEL BUTTON */}
                              <button
                                onClick={() => handleRejectOrder(rec)}
                                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-[11px] shadow-xs transition-all flex items-center gap-1"
                                title="Cancel ongoing test"
                              >
                                <X className="w-3 h-3" />
                                <span>Cancel</span>
                              </button>
                            </>
                          )}

                          {isCompleted && (
                            <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 justify-end">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Verified (Accepted)</span>
                            </span>
                          )}

                          {rec.status === 'CANCELLED' && (
                            <span className="text-[11px] text-rose-700 font-bold flex items-center gap-1 justify-end">
                              <X className="w-3.5 h-3.5" />
                              <span>Cancelled (Rejected)</span>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Diagnostic Order Modal */}
      {isNewOrderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display">
                  Order Diagnostic Investigation
                </h3>
                <p className="text-xs text-slate-500">
                  Request imaging or pathology turnaround
                </p>
              </div>
              <button
                onClick={() => setIsNewOrderOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Active Patient
                </label>
                <select
                  value={selectedVisitId}
                  onChange={(e) => setSelectedVisitId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-hidden"
                >
                  {activeVisits.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.patientName} ({v.patientId}) — {v.departmentName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Diagnostic Test / Modality
                </label>
                <select
                  value={selectedModality}
                  onChange={(e) => setSelectedModality(e.target.value as DiagnosticModality)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-hidden"
                >
                  {MODALITY_OPTIONS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Urgency / Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-hidden"
                >
                  <option value="STAT">STAT (Immediate Critical Care)</option>
                  <option value="URGENT">Urgent (Within 30m)</option>
                  <option value="ROUTINE">Routine Queue</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Clinical Indication Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Acute abdominal pain, rule out appendicitis"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 resize-none focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                {/* RED CANCEL BUTTON */}
                <button
                  type="button"
                  onClick={() => setIsNewOrderOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-xl shadow-xs transition-colors flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>

                {/* GREEN ACCEPT / DISPATCH BUTTON */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Transmitting...' : 'Accept & Dispatch Order'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
