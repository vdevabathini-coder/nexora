import React, { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  Stethoscope,
  FlaskConical,
  DoorOpen,
  BedDouble,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Activity,
  Sparkles,
  UserPlus,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';
import { DashboardMetrics, Department, Visit, Bed, BottleneckAlert } from '../../types';
import { api } from '../../services/api';

interface OperationsDashboardProps {
  onNavigate: (view: string, filter?: string) => void;
  onSelectPatient: (patientId: string) => void;
  onOpenRegister: () => void;
  onOpenDemo?: () => void;
}

const FLOW_STAGES_CONFIG = [
  { key: 'REGISTERED', label: 'Registration', color: 'slate' },
  { key: 'WAITING', label: 'Waiting', color: 'amber' },
  { key: 'CONSULTATION', label: 'Consultation', color: 'blue' },
  { key: 'DIAGNOSTICS', label: 'Diagnostics', color: 'purple' },
  { key: 'TREATMENT', label: 'Treatment', color: 'indigo' },
  { key: 'ADMISSION_REQUESTED', label: 'Admission Req.', color: 'orange' },
  { key: 'WAITING_FOR_BED', label: 'Bed Wait', color: 'rose' },
  { key: 'ADMITTED', label: 'Bed Inpatient', color: 'emerald' },
  { key: 'DISCHARGE_READY', label: 'Discharge Ready', color: 'green' },
];

export function OperationsDashboard({
  onNavigate,
  onSelectPatient,
  onOpenRegister,
  onOpenDemo,
}: OperationsDashboardProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [bottlenecks, setBottlenecks] = useState<BottleneckAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    try {
      const [m, d, v, b, bn] = await Promise.all([
        api.getDashboardMetrics(),
        api.getDepartments(),
        api.getVisits(),
        api.getBeds(),
        api.getBottlenecks(),
      ]);
      setMetrics(m);
      setDepartments(d);
      setVisits(v);
      setBeds(b);
      setBottlenecks(bn);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    const unsub = api.subscribe(loadAll);
    return unsub;
  }, []);

  if (loading || !metrics) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-24 bg-slate-200 animate-pulse rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Calculate flow count for each stage
  const activeVisits = visits.filter(
    (v) => v.currentStage !== 'DISCHARGED' && v.currentStage !== 'CANCELLED'
  );

  const stageCounts = FLOW_STAGES_CONFIG.map((stage) => {
    let count = 0;
    if (stage.key === 'ADMITTED') {
      count = activeVisits.filter((v) => v.currentStage === 'ADMITTED').length;
    } else if (stage.key === 'DISCHARGE_READY') {
      count = activeVisits.filter(
        (v) => v.currentStage === 'DISCHARGE_READY' || v.currentStage === 'DISCHARGE_PREPARATION'
      ).length;
    } else {
      count = activeVisits.filter((v) => v.currentStage === stage.key).length;
    }
    return { ...stage, count };
  });

  // Bed breakdown calculations
  const bedStats = {
    total: beds.length,
    available: beds.filter((b) => b.status === 'AVAILABLE').length,
    occupied: beds.filter((b) => b.status === 'OCCUPIED').length,
    preparing: beds.filter((b) => b.status === 'PREPARING').length,
    cleaning: beds.filter((b) => b.status === 'CLEANING').length,
    blocked: beds.filter((b) => b.status === 'BLOCKED').length,
  };

  const occupancyRate = Math.round((bedStats.occupied / (bedStats.total || 1)) * 100);

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Hero Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
              Hospital Operations Command Center
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-[11px] font-bold shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Backend & Database Live
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Real-time synchronization across departments, queues, beds, and diagnostic turnaround.
            Every patient tracked in one unified journey.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={onOpenRegister}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-98 text-white text-xs font-bold shadow-sm transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register Patient</span>
          </button>
        </div>
      </div>

      {/* Top Clickable 8 Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
        {/* Metric 1: Total Active Patients */}
        <div
          onClick={() => onNavigate('patients', 'ALL')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="text-[10px] font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform">→</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-display">
            {metrics.totalActivePatients}
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-1 leading-tight">
            Active Patients
          </div>
        </div>

        {/* Metric 2: Waiting Patients */}
        <div
          onClick={() => onNavigate('patients', 'WAITING')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-amber-400 hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="text-[10px] font-bold text-amber-600 group-hover:translate-x-0.5 transition-transform">→</span>
          </div>
          <div className="text-2xl font-extrabold text-amber-900 font-display">
            {metrics.waitingPatients}
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-1 leading-tight">
            Waiting in Queue
          </div>
        </div>

        {/* Metric 3: In Consultation */}
        <div
          onClick={() => onNavigate('patients', 'CONSULTATION')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <Stethoscope className="w-4 h-4 text-blue-600" />
            <span className="text-[10px] font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform">→</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-display">
            {metrics.inConsultation}
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-1 leading-tight">
            In Consultation
          </div>
        </div>

        {/* Metric 4: Diagnostics Pending */}
        <div
          onClick={() => onNavigate('diagnostics')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-purple-400 hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <FlaskConical className="w-4 h-4 text-purple-600" />
            <span className="text-[10px] font-bold text-purple-600 group-hover:translate-x-0.5 transition-transform">→</span>
          </div>
          <div className="text-2xl font-extrabold text-purple-900 font-display">
            {metrics.diagnosticsPending}
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-1 leading-tight">
            Diagnostics Pend.
          </div>
        </div>

        {/* Metric 5: Admissions Pending */}
        <div
          onClick={() => onNavigate('admission', 'ADMISSIONS')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-orange-400 hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <DoorOpen className="w-4 h-4 text-orange-600" />
            <span className="text-[10px] font-bold text-orange-600 group-hover:translate-x-0.5 transition-transform">→</span>
          </div>
          <div className="text-2xl font-extrabold text-orange-900 font-display">
            {metrics.admissionsPending}
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-1 leading-tight">
            Admissions Pend.
          </div>
        </div>

        {/* Metric 6: Available Beds */}
        <div
          onClick={() => onNavigate('beds', 'AVAILABLE')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-400 hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <BedDouble className="w-4 h-4 text-emerald-600" />
            <span className="text-[10px] font-bold text-emerald-600 group-hover:translate-x-0.5 transition-transform">→</span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 font-display">
            {metrics.availableBeds}
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-1 leading-tight">
            Available Beds
          </div>
        </div>

        {/* Metric 7: Occupied Beds */}
        <div
          onClick={() => onNavigate('beds', 'OCCUPIED')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-rose-400 hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <BedDouble className="w-4 h-4 text-rose-600" />
            <span className="text-[10px] font-bold text-rose-600 group-hover:translate-x-0.5 transition-transform">→</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-display">
            {metrics.occupiedBeds}
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-1 leading-tight">
            Occupied Beds
          </div>
        </div>

        {/* Metric 8: Discharge Ready */}
        <div
          onClick={() => onNavigate('admission', 'DISCHARGE')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-green-400 hover:shadow-md cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-[10px] font-bold text-green-600 group-hover:translate-x-0.5 transition-transform">→</span>
          </div>
          <div className="text-2xl font-extrabold text-green-800 font-display">
            {metrics.dischargeReady}
          </div>
          <div className="text-[11px] font-medium text-slate-500 mt-1 leading-tight">
            Discharge Ready
          </div>
        </div>
      </div>

      {/* Live Flow Visualization (Horizontal Sequential Track) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span>Live Patient Flow Sequence</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Current active patient distribution across clinical and operational journey checkpoints
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full w-fit">
            Avg Facility Wait: {metrics.avgWaitTimeMinutes}m
          </span>
        </div>

        {/* Horizontal Flow Pipeline */}
        <div className="overflow-x-auto pb-2">
          <div className="flex items-center gap-2 min-w-[760px]">
            {stageCounts.map((stage, idx) => (
              <React.Fragment key={stage.key}>
                <div
                  onClick={() => onNavigate('patients', stage.key)}
                  className="flex-1 min-w-[88px] p-3 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-300 cursor-pointer transition-all group text-center"
                >
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                    Step 0{idx + 1}
                  </div>
                  <div className="text-xl font-bold text-slate-900 group-hover:text-blue-700 font-display">
                    {stage.count}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-700 truncate mt-0.5">
                    {stage.label}
                  </div>
                </div>

                {idx < stageCounts.length - 1 && (
                  <div className="text-slate-300 font-bold text-xs shrink-0 select-none">
                    →
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Bottleneck Warning Banner (If Any Detected) */}
      {bottlenecks.length > 0 && (
        <div className="bg-amber-50 rounded-2xl p-4 sm:p-5 border border-amber-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-200/60 px-2 py-0.5 rounded">
                  Operational Bottleneck Detected
                </span>
                <span className="text-xs text-amber-700 font-semibold">
                  {bottlenecks[0].departmentName}
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed max-w-3xl">
                {bottlenecks[0].queueLength} patients currently queued (threshold: {bottlenecks[0].thresholdQueue}). Average wait time has extended to {bottlenecks[0].avgWaitMinutes} min. Downstream delays occurring in emergency consultation.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('bottlenecks')}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <span>Review Bottleneck Chain & Recovery</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Middle Section: Department Overview & Bed Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Overview (2 cols on lg) */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Department Queue & Load Overview
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitoring active cases, waiting count, and throughput SLA
              </p>
            </div>
            <button
              onClick={() => onNavigate('departments')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
            >
              <span>Command Center</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {departments.map((dept) => {
              const isDelayed = dept.operationalStatus === 'DELAYED';
              const isAttention = dept.operationalStatus === 'ATTENTION';

              return (
                <div
                  key={dept.id}
                  onClick={() => onNavigate('departments', dept.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-sm ${
                    isDelayed
                      ? 'bg-rose-50/50 border-rose-200 hover:border-rose-400'
                      : isAttention
                      ? 'bg-amber-50/40 border-amber-200 hover:border-amber-400'
                      : 'bg-slate-50/60 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900 font-display truncate">
                      {dept.name}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        isDelayed
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : isAttention
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      {dept.operationalStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center my-3 py-2 bg-white/80 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-medium">Waiting</span>
                      <p className="text-sm font-bold text-amber-700 font-display">
                        {dept.waitingCount}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-medium">Active</span>
                      <p className="text-sm font-bold text-blue-700 font-display">
                        {dept.activeCount}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-medium">Avg Wait</span>
                      <p
                        className={`text-sm font-bold font-display ${
                          dept.avgWaitMinutes > dept.maxThresholdWaitMinutes
                            ? 'text-rose-700'
                            : 'text-slate-700'
                        }`}
                      >
                        {dept.avgWaitMinutes}m
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Lead: {dept.leadPhysician.split(' ')[1]}</span>
                    <span className="text-blue-600 font-semibold group-hover:underline">View Queue →</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bed Capacity & Allocation Widget */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Bed Capacity & Status
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Across 5 wards (Total {bedStats.total} beds)
                </p>
              </div>
              <button
                onClick={() => onNavigate('beds')}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
              >
                <span>Grid</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Visual occupancy bar */}
            <div className="mb-5">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-700">Overall Occupancy</span>
                <span className="font-bold text-slate-900 font-display">{occupancyRate}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${(bedStats.occupied / bedStats.total) * 100}%` }}
                  className="bg-rose-500"
                  title={`Occupied: ${bedStats.occupied}`}
                />
                <div
                  style={{ width: `${(bedStats.preparing / bedStats.total) * 100}%` }}
                  className="bg-blue-500"
                  title={`Preparing: ${bedStats.preparing}`}
                />
                <div
                  style={{ width: `${(bedStats.cleaning / bedStats.total) * 100}%` }}
                  className="bg-amber-500"
                  title={`Cleaning: ${bedStats.cleaning}`}
                />
                <div
                  style={{ width: `${(bedStats.available / bedStats.total) * 100}%` }}
                  className="bg-emerald-500"
                  title={`Available: ${bedStats.available}`}
                />
                <div
                  style={{ width: `${(bedStats.blocked / bedStats.total) * 100}%` }}
                  className="bg-slate-400"
                  title={`Blocked: ${bedStats.blocked}`}
                />
              </div>
            </div>

            {/* Bed status pills breakdown */}
            <div className="space-y-2.5">
              <div
                onClick={() => onNavigate('beds', 'AVAILABLE')}
                className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200 flex items-center justify-between cursor-pointer hover:bg-emerald-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-semibold text-emerald-900">Available For Immediate Placement</span>
                </div>
                <span className="text-xs font-bold text-emerald-800 font-display">
                  {bedStats.available} beds
                </span>
              </div>

              <div
                onClick={() => onNavigate('beds', 'OCCUPIED')}
                className="p-2.5 rounded-lg bg-rose-50/60 border border-rose-200 flex items-center justify-between cursor-pointer hover:bg-rose-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-xs font-semibold text-rose-900">Currently Occupied</span>
                </div>
                <span className="text-xs font-bold text-rose-800 font-display">
                  {bedStats.occupied} beds
                </span>
              </div>

              <div
                onClick={() => onNavigate('beds', 'PREPARING')}
                className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-200 flex items-center justify-between cursor-pointer hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-xs font-semibold text-blue-900">Preparing / Reserved</span>
                </div>
                <span className="text-xs font-bold text-blue-800 font-display">
                  {bedStats.preparing} beds
                </span>
              </div>

              <div
                onClick={() => onNavigate('beds', 'CLEANING')}
                className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200 flex items-center justify-between cursor-pointer hover:bg-amber-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-xs font-semibold text-amber-900">Terminal Cleaning</span>
                </div>
                <span className="text-xs font-bold text-amber-800 font-display">
                  {bedStats.cleaning} beds
                </span>
              </div>

              <div
                onClick={() => onNavigate('beds', 'BLOCKED')}
                className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                  <span className="text-xs font-semibold text-slate-800">Blocked / Maintenance</span>
                </div>
                <span className="text-xs font-bold text-slate-800 font-display">
                  {bedStats.blocked} beds
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Critical ICU Beds Free: 1</span>
            <button
              onClick={() => onNavigate('beds')}
              className="font-semibold text-blue-600 hover:text-blue-800"
            >
              Manage Bed Grid →
            </button>
          </div>
        </div>
      </div>

      {/* Immediate Attention Queue */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Priority Operational Attention Queue</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Patients requiring immediate operational coordination or delayed beyond target SLA
            </p>
          </div>
          <button
            onClick={() => onNavigate('patients')}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
          >
            View All Patients ({activeVisits.length}) →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-y border-slate-100">
              <tr>
                <th className="py-2.5 px-3">Patient</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3">Current Stage</th>
                <th className="py-2.5 px-3">Wait Duration</th>
                <th className="py-2.5 px-3">Next Operational Action</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeVisits.slice(0, 5).map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{v.patientName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{v.patientId} • Age {v.patientAge}</div>
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-800">
                    {v.departmentName}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                      {v.currentStage}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`font-mono font-bold ${v.waitDurationMinutes > 30 ? 'text-rose-600' : 'text-slate-700'}`}>
                      {v.waitDurationMinutes} min
                    </span>
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-700 max-w-xs truncate">
                    {v.nextOperationalAction}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => {
                        onSelectPatient(v.patientId);
                        onNavigate('passport');
                      }}
                      className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-[11px] transition-colors"
                    >
                      Flow Passport
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
