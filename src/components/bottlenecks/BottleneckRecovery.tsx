import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Zap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users,
  Activity,
  Layers,
  Sparkles,
  TrendingDown,
  RotateCcw,
  Check,
  X,
} from 'lucide-react';
import { BottleneckAlert, Department } from '../../types';
import { api } from '../../services/api';

export function BottleneckRecovery() {
  const [bottlenecks, setBottlenecks] = useState<BottleneckAlert[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [dismissedActions, setDismissedActions] = useState<{ [key: string]: boolean }>({});

  const loadData = async () => {
    const [bn, d] = await Promise.all([api.getBottlenecks(), api.getDepartments()]);
    setBottlenecks(bn);
    setDepartments(d);
  };

  useEffect(() => {
    loadData();
    const unsub = api.subscribe(loadData);
    return unsub;
  }, []);

  const handleApplyRecovery = async (
    bottleneckId: string,
    action: string,
    departmentId: string
  ) => {
    setActiveActionId(bottleneckId + action);
    try {
      await api.applyRecoveryAction(bottleneckId, action, departmentId);
      setSuccessMessage(`ACCEPTED operational protocol: "${action}". Queue rebalanced & SLA recovering.`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } finally {
      setActiveActionId(null);
    }
  };

  const handleRejectProtocol = (bottleneckId: string, action: string) => {
    setDismissedActions((prev) => ({ ...prev, [bottleneckId + action]: true }));
    setSuccessMessage(`REJECTED protocol: "${action}". Diverted to operational shift supervisor.`);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <h1 className="text-xl font-bold text-slate-900 font-display">
              Operational Bottlenecks & Recovery Protocols
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time identification of flow choke-points, downstream cascade analysis, and 1-click recovery actions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200">
            {bottlenecks.length} Active Choke-Points
          </span>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800"
          >
            ✕
          </button>
        </div>
      )}

      {/* Primary Bottleneck Impact Cascades */}
      <div className="space-y-6">
        {bottlenecks.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 font-display">
              All Hospital Operational Flows Normal
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              No departments currently exceed latency or queue length thresholds. Flow SLA across all 6 departments is fully green.
            </p>
          </div>
        ) : (
          bottlenecks.map((bn) => (
            <div
              key={bn.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
            >
              {/* Alert Header Banner */}
              <div className="p-5 bg-linear-to-r from-rose-50 via-amber-50 to-white border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-rose-200">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900 font-display">
                        {bn.departmentName} Choke-Point
                      </h2>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
                        {bn.severity} Severity
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-2xl">
                      Queue of {bn.queueLength} patients exceeds operational capacity threshold of {bn.thresholdQueue}. Average wait time has risen to {bn.avgWaitMinutes} min (Target: &lt; 30 min).
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Delay Factor</span>
                    <span className="text-sm font-bold text-rose-700">+{bn.delayFactor}x SLA</span>
                  </div>
                </div>
              </div>

              {/* Cascade Chain Visualization */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-slate-500" />
                  <span>Downstream Cascade Impact Chain</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="w-full sm:flex-1 p-3.5 rounded-xl bg-rose-100/70 border border-rose-300 text-center">
                    <span className="text-[10px] font-bold text-rose-800 uppercase block">Root Bottleneck</span>
                    <div className="text-sm font-bold text-rose-950 font-display mt-0.5">
                      {bn.departmentName}
                    </div>
                    <div className="text-[11px] text-rose-700 mt-1">
                      {bn.queueLength} patients • {bn.avgWaitMinutes}m wait
                    </div>
                  </div>

                  <ArrowRight className="w-5 h-5 text-slate-400 shrink-0 hidden sm:block" />

                  {bn.impactedDownstream.map((deptName, idx) => (
                    <React.Fragment key={deptName}>
                      <div className="w-full sm:flex-1 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
                        <span className="text-[10px] font-bold text-amber-800 uppercase block">
                          Impact Stage {idx + 1}
                        </span>
                        <div className="text-sm font-bold text-amber-950 font-display mt-0.5">
                          {deptName}
                        </div>
                        <div className="text-[11px] text-amber-700 mt-1">
                          Inflow hold & delayed triage
                        </div>
                      </div>

                      {idx < bn.impactedDownstream.length - 1 && (
                        <ArrowRight className="w-5 h-5 text-slate-400 shrink-0 hidden sm:block" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* 1-Click Operational Recovery Protocols */}
              <div className="p-5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Recommended Flow Recovery Protocols</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {bn.suggestedActions.map((action) => {
                    const isDismissed = dismissedActions[bn.id + action];
                    if (isDismissed) {
                      return (
                        <div
                          key={action}
                          className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-400 text-xs flex flex-col justify-between"
                        >
                          <div className="line-through text-slate-500 font-medium">{action}</div>
                          <div className="mt-3 text-[11px] font-bold text-rose-600 flex items-center gap-1">
                            <X className="w-3.5 h-3.5" />
                            <span>Protocol Rejected</span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={action}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 text-left transition-all flex flex-col justify-between shadow-xs"
                      >
                        <div>
                          <div className="flex items-center justify-between text-slate-600 mb-1">
                            <div className="flex items-center gap-1 text-blue-600">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded text-blue-700">
                                Protocol
                              </span>
                            </div>
                          </div>
                          <div className="text-xs font-bold text-slate-900 font-display">
                            {action}
                          </div>
                        </div>

                        <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center gap-2">
                          {/* GREEN ACCEPT BUTTON */}
                          <button
                            disabled={activeActionId !== null}
                            onClick={() => handleApplyRecovery(bn.id, action, bn.departmentId)}
                            className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-[11px] shadow-xs transition-all flex items-center justify-center gap-1"
                            title="Accept & deploy protocol to frontline staff"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept</span>
                          </button>

                          {/* RED REJECT BUTTON */}
                          <button
                            disabled={activeActionId !== null}
                            onClick={() => handleRejectProtocol(bn.id, action)}
                            className="py-1.5 px-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-[11px] shadow-xs transition-all flex items-center justify-center gap-1"
                            title="Reject or dismiss protocol"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
