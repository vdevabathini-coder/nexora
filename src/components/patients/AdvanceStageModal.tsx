import React, { useState } from 'react';
import { X, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Visit, PatientStatus } from '../../types';
import { api } from '../../services/api';
import { StatusBadge } from '../common/Badges';

interface AdvanceStageModalProps {
  visit: Visit | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const STAGES_ORDER: { key: PatientStatus; label: string; description: string }[] = [
  { key: 'REGISTERED', label: 'Registration', description: 'Patient verified at check-in' },
  { key: 'WAITING', label: 'Waiting in Queue', description: 'Awaiting physician or triage assessment' },
  { key: 'CONSULTATION', label: 'Physician Consultation', description: 'Active clinical assessment in progress' },
  { key: 'DIAGNOSTICS', label: 'Diagnostics & Imaging', description: 'Undergoing X-Ray, CT, Lab tests' },
  { key: 'TREATMENT', label: 'Active Treatment', description: 'Therapeutic procedure or medication delivery' },
  { key: 'ADMISSION_REQUESTED', label: 'Admission Requested', description: 'Physician requested inpatient admission' },
  { key: 'WAITING_FOR_BED', label: 'Waiting For Bed', description: 'Awaiting bed sanitization or placement' },
  { key: 'ADMITTED', label: 'Admitted Inpatient', description: 'Inpatient ward care active' },
  { key: 'DISCHARGE_PREPARATION', label: 'Discharge Preparation', description: 'Reconciling discharge checklists & pharmacy' },
  { key: 'DISCHARGE_READY', label: 'Discharge Ready', description: 'All clinical criteria met, awaiting departure' },
  { key: 'DISCHARGED', label: 'Discharged & Finalized', description: 'Patient departed; bed flagged for cleaning' },
];

export function AdvanceStageModal({
  visit,
  isOpen,
  onClose,
  onSuccess,
}: AdvanceStageModalProps) {
  if (!isOpen || !visit) return null;

  const currentIdx = STAGES_ORDER.findIndex((s) => s.key === visit.currentStage);
  const nextDefault = currentIdx < STAGES_ORDER.length - 1 ? STAGES_ORDER[currentIdx + 1].key : visit.currentStage;

  const [selectedStage, setSelectedStage] = useState<PatientStatus>(nextDefault);
  const [assignedResource, setAssignedResource] = useState(visit.assignedResource || '');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.advancePatientStage(visit.id, selectedStage, {
        assignedResource: assignedResource.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onSuccess();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-display">
              Advance Operational Workflow Stage
            </h2>
            <p className="text-xs text-slate-500">
              Update journey checkpoint for {visit.patientName} ({visit.patientId})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Current vs Next Banner */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Current Stage</span>
              <div className="mt-1">
                <StatusBadge status={visit.currentStage} />
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Next Stage</span>
              <div className="mt-1">
                <StatusBadge status={selectedStage} />
              </div>
            </div>
          </div>

          {/* Select Stage */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Target Operational Stage *
            </label>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value as PatientStatus)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden text-slate-800 font-medium"
            >
              {STAGES_ORDER.map((stage) => (
                <option key={stage.key} value={stage.key}>
                  {stage.label} — {stage.description}
                </option>
              ))}
            </select>
          </div>

          {/* Resource Assignment */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assigned Resource / Staff / Room
            </label>
            <input
              type="text"
              placeholder="e.g. Dr. Rostova, CT Suite 2, Ward 204"
              value={assignedResource}
              onChange={(e) => setAssignedResource(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden text-slate-800"
            />
          </div>

          {/* Operational Handover Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Operational Handover Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Consultation complete. Transferred to radiology queue for abdominal CT."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden text-slate-800 resize-none"
            />
          </div>

          {/* Footer Actions: Red Cancel, Green Accept/Advance */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            {/* RED CANCEL BUTTON */}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-xl shadow-xs transition-colors flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>

            {/* GREEN ACCEPT / ADVANCE BUTTON */}
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{submitting ? 'Updating...' : 'Accept & Advance Stage'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
