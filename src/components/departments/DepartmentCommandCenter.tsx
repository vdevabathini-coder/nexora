import React, { useState, useEffect } from 'react';
import {
  Building2,
  Clock,
  Users,
  Activity,
  AlertTriangle,
  ArrowRight,
  Stethoscope,
  Flame,
  HeartPulse,
  Scan,
  FlaskConical,
  Scissors,
  CheckCircle2,
  Check,
  X,
} from 'lucide-react';
import { Department, Visit } from '../../types';
import { api } from '../../services/api';
import { StatusBadge, PriorityBadge } from '../common/Badges';

interface DepartmentCommandCenterProps {
  initialDeptId?: string;
  onAdvanceStage: (visit: Visit) => void;
  onSelectPatient: (patientId: string) => void;
}

export function DepartmentCommandCenter({
  initialDeptId,
  onAdvanceStage,
  onSelectPatient,
}: DepartmentCommandCenterProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>(initialDeptId || 'DEP-EMERGENCY');
  const [visits, setVisits] = useState<Visit[]>([]);

  useEffect(() => {
    if (initialDeptId) {
      setSelectedDeptId(initialDeptId);
    }
  }, [initialDeptId]);

  const loadData = async () => {
    const [d, v] = await Promise.all([api.getDepartments(), api.getVisits()]);
    setDepartments(d);
    setVisits(v);
  };

  useEffect(() => {
    loadData();
    const unsub = api.subscribe(loadData);
    return unsub;
  }, []);

  const currentDept = departments.find((d) => d.id === selectedDeptId) || departments[0];

  // Active queue in this department
  const deptQueue = visits.filter(
    (v) =>
      v.departmentId === selectedDeptId &&
      v.currentStage !== 'DISCHARGED' &&
      v.currentStage !== 'CANCELLED'
  );

  const getDeptIcon = (id: string) => {
    switch (id) {
      case 'DEP-EMERGENCY':
        return Flame;
      case 'DEP-CARDIOLOGY':
        return HeartPulse;
      case 'DEP-RADIOLOGY':
        return Scan;
      case 'DEP-LAB':
        return FlaskConical;
      case 'DEP-SURGERY':
        return Scissors;
      default:
        return Stethoscope;
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-display">
            Department Operations Command Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time queue tracking, clinical capacity, and operational escalation management
          </p>
        </div>

        {/* Operational Status Tag */}
        {currentDept && (
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border ${
                currentDept.operationalStatus === 'DELAYED'
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : currentDept.operationalStatus === 'ATTENTION'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              ● {currentDept.operationalStatus} Operating Status
            </span>
          </div>
        )}
      </div>

      {/* Horizontal Department Switcher Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {departments.map((dept) => {
          const Icon = getDeptIcon(dept.id);
          const isSelected = dept.id === selectedDeptId;

          return (
            <button
              key={dept.id}
              onClick={() => setSelectedDeptId(dept.id)}
              className={`p-3 rounded-xl border text-left transition-all group ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon
                  className={`w-4 h-4 ${
                    isSelected ? 'text-white' : 'text-blue-600'
                  }`}
                />
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {dept.code}
                </span>
              </div>
              <div className="text-xs font-bold truncate leading-tight font-display">
                {dept.name}
              </div>
              <div
                className={`text-[11px] mt-1 font-medium ${
                  isSelected ? 'text-blue-100' : 'text-slate-500'
                }`}
              >
                Queue: {dept.waitingCount} • {dept.avgWaitMinutes}m
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Department Overview Banner */}
      {currentDept && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 font-display">
                  {currentDept.name}
                </h2>
                <span className="text-xs text-slate-500 font-mono">({currentDept.code})</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Location: {currentDept.location} • Lead: {currentDept.leadPhysician}
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Capacity</span>
                <span className="font-bold text-slate-800 font-display">
                  {currentDept.totalCapacity} patients max
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Target SLA</span>
                <span className="font-bold text-slate-800 font-display">
                  &lt; {currentDept.maxThresholdWaitMinutes} min
                </span>
              </div>
            </div>
          </div>

          {/* KPI Metrics row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
              <span className="text-[10px] font-bold text-amber-900 uppercase">Waiting in Queue</span>
              <div className="text-2xl font-bold text-amber-900 font-display mt-0.5">
                {currentDept.waitingCount}
              </div>
              <span className="text-[10px] text-amber-700">Awaiting intake/call</span>
            </div>

            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200">
              <span className="text-[10px] font-bold text-blue-900 uppercase">Active In Care</span>
              <div className="text-2xl font-bold text-blue-900 font-display mt-0.5">
                {currentDept.activeCount}
              </div>
              <span className="text-[10px] text-blue-700">Undergoing procedure</span>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
              <span className="text-[10px] font-bold text-emerald-900 uppercase">Completed Today</span>
              <div className="text-2xl font-bold text-emerald-900 font-display mt-0.5">
                {currentDept.completedCount}
              </div>
              <span className="text-[10px] text-emerald-700">Discharged / Transferred</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-700 uppercase">Average Wait Time</span>
              <div
                className={`text-2xl font-bold font-display mt-0.5 ${
                  currentDept.avgWaitMinutes > currentDept.maxThresholdWaitMinutes
                    ? 'text-rose-600'
                    : 'text-slate-800'
                }`}
              >
                {currentDept.avgWaitMinutes} min
              </div>
              <span className="text-[10px] text-slate-500">
                SLA: {currentDept.maxThresholdWaitMinutes}m threshold
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Live Department Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-display">
              Live Department Roster & Queue ({deptQueue.length} active)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Patients currently assigned to {currentDept?.name}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Patient Name & ID</th>
                <th className="py-3 px-4">Arrival</th>
                <th className="py-3 px-4">Wait Time</th>
                <th className="py-3 px-4">Current Stage</th>
                <th className="py-3 px-4">Next Operational Action</th>
                <th className="py-3 px-4">Assigned Staff</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deptQueue.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    No patients currently in this department queue.
                  </td>
                </tr>
              ) : (
                deptQueue.map((v) => (
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

                    <td className="py-3 px-4 font-mono text-[11px]">
                      {new Date(v.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="py-3 px-4 font-mono">
                      <span
                        className={`font-bold ${
                          v.waitDurationMinutes > currentDept.maxThresholdWaitMinutes
                            ? 'text-rose-600'
                            : 'text-slate-700'
                        }`}
                      >
                        {v.waitDurationMinutes} min
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={v.currentStage} />
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-700 max-w-xs truncate">
                      {v.nextOperationalAction}
                    </td>

                    <td className="py-3 px-4 text-slate-600 truncate max-w-[130px]">
                      {v.assignedResource || 'Queue pool'}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectPatient(v.patientId)}
                          className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-[11px] transition-colors"
                        >
                          Passport
                        </button>
                        <button
                          onClick={() => onAdvanceStage(v)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-[11px] shadow-xs transition-all flex items-center gap-1"
                          title="Accept & Advance Stage"
                        >
                          <Check className="w-3 h-3" />
                          <span>Advance</span>
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
    </div>
  );
}
