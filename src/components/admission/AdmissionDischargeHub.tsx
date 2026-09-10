import React, { useState, useEffect } from 'react';
import {
  DoorOpen,
  CheckCircle2,
  Clock,
  BedDouble,
  ArrowRight,
  FileCheck,
  AlertTriangle,
  UserCheck,
  Building2,
  ShieldCheck,
  Check,
  X,
  ThumbsUp,
  Ban,
  Sparkles,
} from 'lucide-react';
import { Visit, Bed } from '../../types';
import { api } from '../../services/api';
import { StatusBadge, PriorityBadge } from '../common/Badges';

interface AdmissionDischargeHubProps {
  initialTab?: 'ADMISSIONS' | 'DISCHARGE';
  onSelectPatient: (patientId: string) => void;
  onNavigateToBeds: () => void;
}

export function AdmissionDischargeHub({
  initialTab = 'ADMISSIONS',
  onSelectPatient,
  onNavigateToBeds,
}: AdmissionDischargeHubProps) {
  const [activeTab, setActiveTab] = useState<'ADMISSIONS' | 'DISCHARGE'>(initialTab);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [acceptingVisit, setAcceptingVisit] = useState<Visit | null>(null);
  const [selectedBedId, setSelectedBedId] = useState<string>('');
  const [checklist, setChecklist] = useState<{ [visitId: string]: { [item: string]: boolean } }>({
    'VIS-1006': {
      physicianSummary: true,
      nursingSignoff: true,
      medReconciliation: true,
      transportArranged: false,
    },
  });

  const loadData = async () => {
    const [v, b] = await Promise.all([api.getVisits(), api.getBeds()]);
    setVisits(v);
    setBeds(b);
  };

  useEffect(() => {
    loadData();
    const unsub = api.subscribe(loadData);
    return unsub;
  }, []);

  const admissionQueue = visits.filter(
    (v) =>
      v.currentStage === 'ADMISSION_REQUESTED' ||
      v.currentStage === 'WAITING_FOR_BED'
  );

  const dischargeQueue = visits.filter(
    (v) =>
      v.currentStage === 'DISCHARGE_PREPARATION' ||
      v.currentStage === 'DISCHARGE_READY' ||
      (v.currentStage === 'ADMITTED' && v.assignedBedNumber)
  );

  const availableBeds = beds.filter((b) => b.status === 'AVAILABLE');
  const availableBedsCount = availableBeds.length;

  const toggleChecklist = (visitId: string, item: string) => {
    setChecklist((prev) => ({
      ...prev,
      [visitId]: {
        ...(prev[visitId] || {}),
        [item]: !prev[visitId]?.[item],
      },
    }));
  };

  // GREEN ACTION: Accept Admission
  const handleOpenAcceptModal = (visit: Visit) => {
    setAcceptingVisit(visit);
    if (availableBeds.length > 0) {
      setSelectedBedId(availableBeds[0].id);
    }
  };

  const handleConfirmAcceptAdmission = async () => {
    if (!acceptingVisit) return;
    const targetBed = beds.find((b) => b.id === selectedBedId) || availableBeds[0];
    await api.acceptAdmission(
      acceptingVisit.id,
      targetBed?.id,
      `Admission Accepted: Assigned to ${targetBed?.bedNumber || 'Inpatient Bed'}`
    );
    setActionFeedback(`ACCEPTED admission for ${acceptingVisit.patientName}. Bed assigned & patient in ADMITTED stage.`);
    setAcceptingVisit(null);
    setTimeout(() => setActionFeedback(null), 4500);
  };

  // RED ACTION: Reject / Cancel Admission
  const handleRejectAdmission = async (visit: Visit) => {
    const reason = window.prompt(
      `Reject/Cancel admission for ${visit.patientName}? Enter clinical diversion justification:`,
      'Patient clinically stabilized; redirected to outpatient follow-up care.'
    );
    if (reason !== null) {
      await api.rejectAdmission(visit.id, reason);
      setActionFeedback(`REJECTED / CANCELLED admission for ${visit.patientName}. Roster updated.`);
      setTimeout(() => setActionFeedback(null), 4500);
    }
  };

  // GREEN ACTION: Accept & Authorize Discharge
  const handleAuthorizeDischarge = async (visit: Visit) => {
    await api.finalizeDischarge(visit.id, visit.assignedBedId);
    setActionFeedback(`ACCEPTED & AUTHORIZED discharge for ${visit.patientName}. Inpatient bed released for cleaning.`);
    setTimeout(() => setActionFeedback(null), 4500);
  };

  // RED ACTION: Reject / Hold Discharge
  const handleRejectDischarge = async (visit: Visit) => {
    const reason = window.prompt(
      `Enter reason for REJECTING / HOLDING discharge for ${visit.patientName}:`,
      'Clinical observation hold: Vital signs monitoring ongoing prior to departure.'
    );
    if (reason !== null) {
      await api.holdDischarge(visit.id, reason);
      setActionFeedback(`REJECTED / HELD discharge for ${visit.patientName}. Patient maintained in active inpatient bed.`);
      setTimeout(() => setActionFeedback(null), 4500);
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-display">
            Admission & Discharge Flow Hub
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Coordinate inpatient ward placements, bed readiness, and discharge reconciliation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Green = Accept</span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ml-1.5" />
            <span>Red = Reject/Cancel</span>
          </div>

          <span className="text-xs text-slate-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl font-mono font-bold">
            {availableBedsCount} Bed{availableBedsCount === 1 ? '' : 's'} Ready
          </span>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="text-emerald-700 hover:text-emerald-900">
            ✕
          </button>
        </div>
      )}

      {/* Mode Navigation Tabs */}
      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('ADMISSIONS')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'ADMISSIONS'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <DoorOpen className="w-4 h-4 text-orange-600" />
          <span>Inpatient Admission Queue ({admissionQueue.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('DISCHARGE')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'DISCHARGE'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Discharge Readiness & Departure ({dischargeQueue.length})</span>
        </button>
      </div>

      {/* Tab Content 1: Admissions Queue */}
      {activeTab === 'ADMISSIONS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-display uppercase tracking-wider">
                Inpatient Admission & Bed Waiting Roster
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review pending admissions: Accept with ward bed assignment or Reject to outpatient care
              </p>
            </div>

            <button
              onClick={onNavigateToBeds}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
            >
              <span>Bed Command Center</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Referring Dept</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Wait For Bed</th>
                  <th className="py-3 px-4">Operational Requirement</th>
                  <th className="py-3 px-4 text-right">Workflow Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {admissionQueue.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      No patients currently waiting for inpatient admission.
                    </td>
                  </tr>
                ) : (
                  admissionQueue.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <PriorityBadge priority={v.priority} />
                      </td>

                      <td className="py-3 px-4">
                        <div
                          onClick={() => onSelectPatient(v.patientId)}
                          className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer"
                        >
                          {v.patientName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {v.patientId} • Age {v.patientAge}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {v.departmentName}
                      </td>

                      <td className="py-3 px-4">
                        <StatusBadge status={v.currentStage} />
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-amber-700">
                        {v.waitDurationMinutes} min
                      </td>

                      <td className="py-3 px-4 text-slate-700 max-w-xs truncate">
                        {v.nextOperationalAction}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* GREEN BUTTON: Accept Admission */}
                          <button
                            onClick={() => handleOpenAcceptModal(v)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
                            title="Accept patient admission and assign ward bed"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept</span>
                          </button>

                          {/* RED BUTTON: Reject / Cancel Admission */}
                          <button
                            onClick={() => handleRejectAdmission(v)}
                            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
                            title="Reject or cancel admission request"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Content 2: Discharge Coordination */}
      {activeTab === 'DISCHARGE' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
            <h3 className="text-sm font-bold text-slate-900 font-display uppercase tracking-wider mb-1">
              Active Inpatient Discharge Worklist
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Reconcile clinical milestones: Accept and authorize departure or Reject/Hold if further care needed
            </p>

            <div className="space-y-4">
              {dischargeQueue.map((v) => {
                const checks = checklist[v.id] || {
                  physicianSummary: true,
                  nursingSignoff: true,
                  medReconciliation: false,
                  transportArranged: false,
                };
                const allReady =
                  checks.physicianSummary &&
                  checks.nursingSignoff &&
                  checks.medReconciliation &&
                  checks.transportArranged;

                return (
                  <div
                    key={v.id}
                    className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          onClick={() => onSelectPatient(v.patientId)}
                          className="font-bold text-sm text-slate-900 hover:text-blue-600 cursor-pointer"
                        >
                          {v.patientName}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">({v.patientId})</span>
                        <StatusBadge status={v.currentStage} />
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Assigned: <strong>Bed {v.assignedBedNumber || 'Inpatient'}</strong> • {v.departmentName}
                      </div>
                    </div>

                    {/* Interactive 4-point Discharge Checklist */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 text-[11px] cursor-pointer hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={checks.physicianSummary}
                          onChange={() => toggleChecklist(v.id, 'physicianSummary')}
                          className="rounded text-blue-600 focus:ring-0"
                        />
                        <span className="font-medium text-slate-700">MD Summary</span>
                      </label>

                      <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 text-[11px] cursor-pointer hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={checks.nursingSignoff}
                          onChange={() => toggleChecklist(v.id, 'nursingSignoff')}
                          className="rounded text-blue-600 focus:ring-0"
                        />
                        <span className="font-medium text-slate-700">Nursing Signoff</span>
                      </label>

                      <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 text-[11px] cursor-pointer hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={checks.medReconciliation}
                          onChange={() => toggleChecklist(v.id, 'medReconciliation')}
                          className="rounded text-blue-600 focus:ring-0"
                        />
                        <span className="font-medium text-slate-700">Med Recon</span>
                      </label>

                      <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 text-[11px] cursor-pointer hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={checks.transportArranged}
                          onChange={() => toggleChecklist(v.id, 'transportArranged')}
                          className="rounded text-blue-600 focus:ring-0"
                        />
                        <span className="font-medium text-slate-700">Transport Ready</span>
                      </label>
                    </div>

                    {/* Working Color Actions: Green for Accept / Authorize, Red for Reject / Hold */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* GREEN BUTTON: Accept & Authorize Discharge */}
                      <button
                        onClick={() => handleAuthorizeDischarge(v)}
                        className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95"
                        title="Accept & Authorize Patient Discharge (Frees Bed)"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Accept Discharge</span>
                      </button>

                      {/* RED BUTTON: Reject / Hold Discharge */}
                      <button
                        onClick={() => handleRejectDischarge(v)}
                        className="px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white active:scale-95"
                        title="Reject or Hold Discharge for Clinical Monitoring"
                      >
                        <Ban className="w-4 h-4" />
                        <span>Reject / Hold</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Quick Bed Assignment & Acceptance Modal */}
      {acceptingVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display">
                  Accept Inpatient Admission
                </h3>
                <p className="text-xs text-slate-500">
                  Select available bed for {acceptingVisit.patientName}
                </p>
              </div>
              <button
                onClick={() => setAcceptingVisit(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Available Inpatient Beds ({availableBeds.length} available)
              </label>

              {availableBeds.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                  No beds are currently marked AVAILABLE. The patient will be marked in <strong>WAITING_FOR_BED</strong> stage.
                </div>
              ) : (
                <select
                  value={selectedBedId}
                  onChange={(e) => setSelectedBedId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                >
                  {availableBeds.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bedNumber} — {b.wardName} (Room {b.roomNumber})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              {/* RED CANCEL BUTTON */}
              <button
                type="button"
                onClick={() => setAcceptingVisit(null)}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>

              {/* GREEN ACCEPT BUTTON */}
              <button
                type="button"
                onClick={handleConfirmAcceptAdmission}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirm & Accept Admission</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
