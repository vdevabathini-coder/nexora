import React, { useState, useEffect, useMemo } from 'react';
import {
  Route,
  CheckCircle2,
  Clock,
  ArrowRight,
  User,
  Shield,
  Activity,
  AlertTriangle,
  FileText,
  Calendar,
  Building2,
  Printer,
  ChevronDown,
  Sparkles,
  Check,
  X,
} from 'lucide-react';
import { Patient, Visit, PatientFlowEvent, DiagnosticRecord } from '../../types';
import { api } from '../../services/api';
import { StatusBadge, PriorityBadge } from '../common/Badges';

interface PatientFlowPassportProps {
  selectedPatientId?: string;
  onAdvanceStage: (visit: Visit) => void;
  onSelectPatient: (patientId: string) => void;
}

export function PatientFlowPassport({
  selectedPatientId,
  onAdvanceStage,
  onSelectPatient,
}: PatientFlowPassportProps) {
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [currentId, setCurrentId] = useState<string>(selectedPatientId || 'PAT-1001');
  const [profile, setProfile] = useState<{
    patient: Patient;
    visit?: Visit;
    events: PatientFlowEvent[];
    diagnostics: DiagnosticRecord[];
  } | null>(null);

  useEffect(() => {
    if (selectedPatientId && selectedPatientId !== currentId) {
      setCurrentId(selectedPatientId);
      loadData(selectedPatientId);
    }
  }, [selectedPatientId]);

  const loadData = async (overrideId?: string) => {
    const list = await api.getPatients();
    setAllPatients(list);

    const targetId = overrideId || currentId || (list[0] ? list[0].id : 'PAT-1001');
    const data = await api.getPatientProfile(targetId);
    if (data) {
      setProfile(data);
    }
  };

  useEffect(() => {
    loadData(currentId);
    const unsub = api.subscribe(() => {
      loadData(currentId);
    });
    return unsub;
  }, [currentId]);

  // Operational calculations
  const metrics = useMemo(() => {
    if (!profile) return { totalJourney: 0, totalWaiting: 0, totalActive: 0, longestDelay: 'None' };

    const events = profile.events || [];
    let waitingMins = 0;
    let activeMins = 0;
    let maxDelayMins = 0;
    let maxDelayStage = 'None';

    (events || []).forEach((e) => {
      const dur = e.durationMinutes || 0;
      const stageKey = e.stage || (e as any).toStage || 'WAITING';
      if (stageKey === 'WAITING' || stageKey === 'WAITING_FOR_BED') {
        waitingMins += dur;
      } else {
        activeMins += dur;
      }

      if (dur > maxDelayMins) {
        maxDelayMins = dur;
        const formattedStage = String(stageKey).replace(/_/g, ' ');
        maxDelayStage = `${formattedStage} (${dur}m)`;
      }
    });

    const totalMins = waitingMins + activeMins;

    return {
      totalJourney: totalMins,
      totalWaiting: waitingMins,
      totalActive: activeMins,
      longestDelay: maxDelayMins > 0 ? maxDelayStage : 'None detected',
    };
  }, [profile]);

  if (!profile) {
    return (
      <div className="p-8 text-center text-slate-500">
        Loading Patient Flow Passport...
      </div>
    );
  }

  const { patient, visit, events, diagnostics } = profile;

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Selector & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm shadow-blue-200">
            <Route className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 font-display">
                Patient Flow Passport
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                PASSPORT #{patient.id}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Authoritative end-to-end operational journey record and milestone ledger
            </p>
          </div>
        </div>

        {/* Patient Switcher Dropdown */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <select
              value={currentId}
              onChange={(e) => {
                setCurrentId(e.target.value);
                onSelectPatient(e.target.value);
              }}
              className="px-3.5 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden text-slate-800 pr-8"
            >
              {allPatients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} ({p.id})
                </option>
              ))}
            </select>
          </div>

          {visit && visit.currentStage !== 'DISCHARGED' && (
            <button
              onClick={() => onAdvanceStage(visit)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
              title="Accept & Advance Journey Stage"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Accept & Advance Stage</span>
            </button>
          )}

          <button
            onClick={() => {
              try {
                window.print();
              } catch (e) {
                console.error('Print unavailable in this context', e);
              }
            }}
            title="Print Passport Ledger"
            className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Patient Demographic & Current Visit Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
          {/* Patient Details */}
          <div className="md:col-span-1 border-b md:border-b-0 md:border-r border-slate-800 pb-4 md:pb-0 md:pr-6">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
              Patient Identity
            </div>
            <div className="text-xl font-bold font-display text-white">{patient.fullName}</div>
            <div className="text-xs text-slate-400 mt-1">
              {patient.gender} • {patient.age} years old
            </div>
            <div className="text-xs text-slate-400 mt-0.5 font-mono">{patient.phone}</div>
            <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
              <span className="text-slate-500">Emergency:</span> {patient.emergencyContact.name} ({patient.emergencyContact.relationship})
            </div>
          </div>

          {/* Current Visit & Department */}
          <div className="md:col-span-2 border-b md:border-b-0 md:border-r border-slate-800 pb-4 md:pb-0 md:pr-6">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
              Active Visit Coordination
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-slate-200">{visit?.departmentName}</span>
              {visit && <PriorityBadge priority={visit.priority} />}
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Current Stage:</span>
                <div className="mt-1">
                  {visit ? <StatusBadge status={visit.currentStage} /> : 'No active stage'}
                </div>
              </div>
              <div>
                <span className="text-slate-500 block">Assigned Resource:</span>
                <span className="font-semibold text-slate-200 mt-1 block">
                  {visit?.assignedBedNumber ? `Bed ${visit.assignedBedNumber}` : visit?.assignedResource || 'Unassigned'}
                </span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800">
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Next Operational Action</span>
              </span>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                {visit?.nextOperationalAction}
              </p>
            </div>
          </div>

          {/* Visit Times & Passport Code */}
          <div className="md:col-span-1 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                Arrival Timestamp
              </div>
              <div className="text-sm font-semibold text-white">
                {visit ? new Date(visit.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
              </div>
              <div className="text-[11px] text-slate-400">
                {new Date(patient.registrationDate).toLocaleDateString()}
              </div>
            </div>

            <div className="mt-4 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Status State</span>
              <span className="text-xs font-bold text-emerald-400">
                {visit?.currentStage === 'DISCHARGED' ? 'JOURNEY FINALIZED' : 'ACTIVE IN TRANSIT'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Total Journey Time
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-display">
            {metrics.totalJourney}m
          </div>
          <div className="text-[10px] text-slate-500 mt-1">From initial check-in</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Total Waiting Time
          </div>
          <div className="text-2xl font-extrabold text-amber-700 font-display">
            {metrics.totalWaiting}m
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Idle queue duration</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Active Processing Time
          </div>
          <div className="text-2xl font-extrabold text-blue-700 font-display">
            {metrics.totalActive}m
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Clinical/procedure care</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Longest Delay Stage
          </div>
          <div className="text-base font-bold text-rose-700 truncate font-display mt-1">
            {metrics.longestDelay}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Bottleneck pinpoint</div>
        </div>
      </div>

      {/* Visual Journey Operational Timeline */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-display uppercase tracking-wider">
              Chronological Flow Timeline
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Complete historical stage transitions with exact timestamps and durations
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {events.length} Event{events.length === 1 ? '' : 's'} Recorded
          </span>
        </div>

        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2 sm:before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
          {events.map((event, idx) => {
            const isCompleted = event.status === 'COMPLETED';
            const isInProgress = event.status === 'IN_PROGRESS';

            return (
              <div key={event.id} className="relative group">
                {/* Node Icon */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full flex items-center justify-center border-2 bg-white transition-transform group-hover:scale-110 ${
                    isCompleted
                      ? 'border-emerald-500 text-emerald-600'
                      : isInProgress
                      ? 'border-blue-500 text-blue-600 ring-4 ring-blue-100'
                      : 'border-slate-300 text-slate-400'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                  )}
                </div>

                {/* Event Card */}
                <div
                  className={`p-4 rounded-xl border transition-all ${
                    isInProgress
                      ? 'bg-blue-50/50 border-blue-200 shadow-xs'
                      : 'bg-slate-50/70 border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 font-display">
                        {String(event.stage || (event as any).toStage || 'FLOW_STEP').replace(/_/g, ' ')}
                      </span>
                      <StatusBadge status={(event.stage || (event as any).toStage || 'REGISTERED') as any} />
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono text-slate-500">
                      <span>
                        {event.startedAt
                          ? new Date(event.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'Recorded'}
                        {event.completedAt &&
                          ` – ${new Date(event.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                      </span>
                      {event.durationMinutes !== undefined && event.durationMinutes !== null && (
                        <span className="px-2 py-0.5 rounded bg-slate-200/80 font-bold text-slate-700">
                          {event.durationMinutes} min
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                    <span>
                      <strong className="text-slate-700">Department:</strong> {event.departmentName}
                    </span>
                    {event.resourceId && (
                      <span>
                        <strong className="text-slate-700">Resource:</strong> {event.resourceId}
                      </span>
                    )}
                    <span>
                      <strong className="text-slate-700">Logged By:</strong> {event.performedBy}
                    </span>
                  </div>

                  {event.notes && (
                    <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-200/60 leading-relaxed italic">
                      “{event.notes}”
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Associated Diagnostics History */}
      {diagnostics.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 font-display uppercase tracking-wider mb-4">
            Diagnostic Orders for this Patient
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-y border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Modality / Test</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Requested</th>
                  <th className="py-2.5 px-3">Completed</th>
                  <th className="py-2.5 px-3">Turnaround Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {diagnostics.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{d.id}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{d.testName}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        {d.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px]">
                      {new Date(d.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px]">
                      {d.completedAt
                        ? new Date(d.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'In Progress'}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                      {d.turnaroundTimeMinutes ? `${d.turnaroundTimeMinutes} min` : 'Pending'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
