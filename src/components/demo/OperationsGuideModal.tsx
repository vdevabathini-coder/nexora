import React, { useState } from 'react';
import {
  Sparkles,
  X,
  RotateCcw,
  Zap,
  CheckCircle2,
  ArrowRight,
  Route,
  BedDouble,
  AlertTriangle,
  DoorOpen,
} from 'lucide-react';
import { api } from '../../services/api';

interface OperationsGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string, filter?: string) => void;
  onSelectPatient: (patientId: string) => void;
}

export function OperationsGuideModal({
  isOpen,
  onClose,
  onNavigate,
  onSelectPatient,
}: OperationsGuideModalProps) {
  const [resetting, setResetting] = useState(false);
  const [surging, setSurging] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleReset = async () => {
    setResetting(true);
    try {
      await api.resetDemoData();
      setFeedback('Demo data reset to clean initial hospital state.');
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setResetting(false);
    }
  };

  const handleSurge = async () => {
    setSurging(true);
    try {
      await api.simulateSurgeScenario();
      setFeedback('Simulated Multi-Casualty Inflow! 4 critical patients added to Emergency & Radiology queues.');
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setSurging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-linear-to-r from-blue-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-amber-300 font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-display">
                  NEXORA Health • Operations Walkthrough Guide
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/30 border border-blue-400/30 text-blue-200">
                  Interactive Showcase
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Quick-test scenarios to evaluate end-to-end patient flow intelligence
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Feedback banner */}
          {feedback && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{feedback}</span>
            </div>
          )}

          {/* 1-Click Simulation Controls */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              1-Click Simulation Controls
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleSurge}
                disabled={surging}
                className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100/70 text-left transition-all group flex items-start justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 text-rose-900 font-bold text-xs font-display">
                    <Zap className="w-4 h-4 text-rose-600" />
                    <span>Simulate Patient Surge Scenario</span>
                  </div>
                  <p className="text-[11px] text-rose-700 mt-1 leading-snug">
                    Instantly generates 4 acute intake arrivals, pushing department wait times and triggering bottleneck alarms.
                  </p>
                </div>
              </button>

              <button
                onClick={handleReset}
                disabled={resetting}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-all group flex items-start justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-xs font-display">
                    <RotateCcw className="w-4 h-4 text-slate-600" />
                    <span>Reset to Baseline Demo State</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    Restores the clean pre-configured hospital state with 10 active patients, 40 beds, and realistic milestones.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* 5-Step Evaluator Tour */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Recommended Evaluator Workflow (5 Key Milestones)
            </h3>

            <div className="space-y-2.5">
              {/* Step 1 */}
              <div
                onClick={() => {
                  onNavigate('dashboard');
                  onClose();
                }}
                className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 cursor-pointer flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center font-mono">
                    1
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                      Operations Command Center
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Observe live sequence tracker, 8 clickable top metrics, and department queues.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
              </div>

              {/* Step 2 */}
              <div
                onClick={() => {
                  onSelectPatient('PAT-1003');
                  onNavigate('passport');
                  onClose();
                }}
                className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 cursor-pointer flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center font-mono">
                    2
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                      Inspect Patient Flow Passport (Sophia Ramirez)
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      View timeline of milestones, total journey time (108m), diagnostic orders, and advance stage.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
              </div>

              {/* Step 3 */}
              <div
                onClick={() => {
                  onNavigate('bottlenecks');
                  onClose();
                }}
                className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 cursor-pointer flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-800 font-bold text-xs flex items-center justify-center font-mono">
                    3
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                      Review Bottleneck Chain & 1-Click Recovery
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Inspect Radiology bottleneck cascade and click "Fast-track urgent scans" or "Open secondary CT scanner".
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
              </div>

              {/* Step 4 */}
              <div
                onClick={() => {
                  onNavigate('beds', 'AVAILABLE');
                  onClose();
                }}
                className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 cursor-pointer flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center font-mono">
                    4
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                      Bed Command Center Placement
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Select an available bed and assign to a patient awaiting inpatient placement.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
              </div>

              {/* Step 5 */}
              <div
                onClick={() => {
                  onNavigate('admission', 'DISCHARGE');
                  onClose();
                }}
                className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 cursor-pointer flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 font-bold text-xs flex items-center justify-center font-mono">
                    5
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                      Discharge Readiness & Bed Turnover
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Check off 4 clinical milestones (Robert Kim), finalize departure, and watch bed enter cleaning.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
