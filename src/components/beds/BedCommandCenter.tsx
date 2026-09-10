import React, { useState, useEffect, useMemo } from 'react';
import {
  BedDouble,
  CheckCircle2,
  AlertTriangle,
  User,
  Search,
  Filter,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Clock,
  ChevronDown,
  X,
  Check,
} from 'lucide-react';
import { Bed, BedStatus, Visit, User as UserType } from '../../types';
import { api } from '../../services/api';
import { BedBadge } from '../common/Badges';

interface BedCommandCenterProps {
  currentUser: UserType;
  onSelectPatient: (patientId: string) => void;
  initialFilter?: string;
}

const WARDS = [
  { id: 'ALL', label: 'All Hospital Wards' },
  { id: 'EMERGENCY_OBS', label: 'Emergency Observation' },
  { id: 'GENERAL_WARD_A', label: 'General Ward A (Level 2)' },
  { id: 'GENERAL_WARD_B', label: 'General Ward B (Level 3)' },
  { id: 'ICU', label: 'Intensive Care Unit (Level 4)' },
  { id: 'POST_SURGICAL', label: 'Post-Surgical Recovery (PACU)' },
];

export function BedCommandCenter({
  currentUser,
  onSelectPatient,
  initialFilter,
}: BedCommandCenterProps) {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [selectedWard, setSelectedWard] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>(initialFilter || 'ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Bed Assignment Modal State
  const [assigningBed, setAssigningBed] = useState<Bed | null>(null);
  const [selectedVisitId, setSelectedVisitId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    const [b, v] = await Promise.all([api.getBeds(), api.getVisits()]);
    setBeds(b);
    setVisits(v);
  };

  useEffect(() => {
    loadData();
    const unsub = api.subscribe(loadData);
    return unsub;
  }, []);

  useEffect(() => {
    if (initialFilter) {
      setSelectedStatus(initialFilter);
    }
  }, [initialFilter]);

  // Patients waiting for bed
  const waitingForBed = useMemo(() => {
    return visits.filter(
      (v) =>
        (v.currentStage === 'WAITING_FOR_BED' || v.currentStage === 'ADMISSION_REQUESTED') &&
        !v.assignedBedId
    );
  }, [visits]);

  // Filtered beds
  const filteredBeds = useMemo(() => {
    return beds.filter((b) => {
      const matchesWard = selectedWard === 'ALL' || b.ward === selectedWard;
      const matchesStatus = selectedStatus === 'ALL' || b.status === selectedStatus;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        b.bedNumber.toLowerCase().includes(q) ||
        b.wardName.toLowerCase().includes(q) ||
        b.roomNumber.toLowerCase().includes(q) ||
        (b.currentPatientName && b.currentPatientName.toLowerCase().includes(q));

      return matchesWard && matchesStatus && matchesSearch;
    });
  }, [beds, selectedWard, selectedStatus, searchQuery]);

  // Counts
  const stats = {
    total: beds.length,
    available: beds.filter((b) => b.status === 'AVAILABLE').length,
    occupied: beds.filter((b) => b.status === 'OCCUPIED').length,
    preparing: beds.filter((b) => b.status === 'PREPARING').length,
    cleaning: beds.filter((b) => b.status === 'CLEANING').length,
    blocked: beds.filter((b) => b.status === 'BLOCKED').length,
  };

  const handleStatusChange = async (bedId: string, status: BedStatus) => {
    await api.updateBedStatus(bedId, status);
  };

  const handleReleaseBed = async (bedId: string) => {
    await api.releaseBed(bedId);
  };

  const handleAssignBedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningBed || !selectedVisitId) return;

    const targetVisit = visits.find((v) => v.id === selectedVisitId);
    if (!targetVisit) return;

    setSubmitting(true);
    try {
      await api.assignBed(assigningBed.id, targetVisit.patientId, targetVisit.id);
      setAssigningBed(null);
      setSelectedVisitId('');
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
            Hospital Bed Capacity & Placement Command Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Supervise 40 inpatient telemetry, observation, and critical care placements
          </p>
        </div>

        {waitingForBed.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>{waitingForBed.length} Patient{waitingForBed.length === 1 ? '' : 's'} Waiting for Bed</span>
          </div>
        )}
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => setSelectedStatus('ALL')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            selectedStatus === 'ALL' ? 'bg-blue-50 border-blue-400 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Beds</span>
          <div className="text-2xl font-bold text-slate-900 font-display mt-0.5">{stats.total}</div>
        </div>

        <div
          onClick={() => setSelectedStatus('AVAILABLE')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            selectedStatus === 'AVAILABLE' ? 'bg-emerald-50 border-emerald-400 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-emerald-700">Available</span>
          <div className="text-2xl font-bold text-emerald-800 font-display mt-0.5">{stats.available}</div>
        </div>

        <div
          onClick={() => setSelectedStatus('OCCUPIED')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            selectedStatus === 'OCCUPIED' ? 'bg-rose-50 border-rose-400 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-rose-700">Occupied</span>
          <div className="text-2xl font-bold text-rose-800 font-display mt-0.5">{stats.occupied}</div>
        </div>

        <div
          onClick={() => setSelectedStatus('PREPARING')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            selectedStatus === 'PREPARING' ? 'bg-blue-50 border-blue-400 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-blue-700">Preparing</span>
          <div className="text-2xl font-bold text-blue-800 font-display mt-0.5">{stats.preparing}</div>
        </div>

        <div
          onClick={() => setSelectedStatus('CLEANING')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            selectedStatus === 'CLEANING' ? 'bg-amber-50 border-amber-400 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-amber-700">Terminal Clean</span>
          <div className="text-2xl font-bold text-amber-800 font-display mt-0.5">{stats.cleaning}</div>
        </div>

        <div
          onClick={() => setSelectedStatus('BLOCKED')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            selectedStatus === 'BLOCKED' ? 'bg-slate-100 border-slate-400 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-slate-500">Blocked</span>
          <div className="text-2xl font-bold text-slate-700 font-display mt-0.5">{stats.blocked}</div>
        </div>
      </div>

      {/* Ward Navigation Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {WARDS.map((w) => (
            <button
              key={w.id}
              onClick={() => setSelectedWard(w.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedWard === w.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by bed ID, room, or patient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden"
            />
          </div>

          <div className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-900">{filteredBeds.length}</span> beds
          </div>
        </div>
      </div>

      {/* Visual Bed Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredBeds.map((bed) => {
          const isOccupied = bed.status === 'OCCUPIED';
          const isAvailable = bed.status === 'AVAILABLE';
          const isCleaning = bed.status === 'CLEANING';
          const isPreparing = bed.status === 'PREPARING';
          const isBlocked = bed.status === 'BLOCKED';

          return (
            <div
              key={bed.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                isOccupied
                  ? 'bg-white border-rose-200 shadow-xs'
                  : isAvailable
                  ? 'bg-emerald-50/30 border-emerald-200/80 shadow-xs'
                  : isPreparing
                  ? 'bg-blue-50/30 border-blue-200'
                  : isCleaning
                  ? 'bg-amber-50/30 border-amber-200'
                  : 'bg-slate-50 border-slate-200 opacity-75'
              }`}
            >
              <div>
                {/* Top Bed Info */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-slate-900 font-display">
                      {bed.bedNumber}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {bed.roomNumber}
                    </span>
                  </div>
                  <BedBadge status={bed.status} />
                </div>

                <div className="text-[11px] text-slate-500 font-medium">
                  {bed.wardName}
                </div>

                {/* Patient or Bed Status Note */}
                {isOccupied ? (
                  <div className="mt-3 p-2.5 rounded-xl bg-rose-50/60 border border-rose-100">
                    <div className="flex items-center gap-1.5 text-rose-900 font-bold text-xs">
                      <User className="w-3.5 h-3.5" />
                      <span
                        onClick={() => bed.currentPatientId && onSelectPatient(bed.currentPatientId)}
                        className="hover:underline cursor-pointer"
                      >
                        {bed.currentPatientName}
                      </span>
                    </div>
                    <div className="text-[10px] text-rose-700 font-mono mt-0.5">
                      {bed.currentPatientId} • Admitted {new Date(bed.admittedAt || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-100/70 border border-slate-200/60 text-[11px] text-slate-600">
                    {bed.notes ? (
                      <span className="italic">{bed.notes}</span>
                    ) : isAvailable ? (
                      <span className="text-emerald-700 font-medium">Clean & ready for intake</span>
                    ) : isCleaning ? (
                      <span className="text-amber-800 font-medium">Sanitation team dispatched</span>
                    ) : isPreparing ? (
                      <span className="text-blue-800 font-medium">Linens & equipment pre-check</span>
                    ) : (
                      <span>Maintenance hold</span>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons: Green = Accept/Assign, Red = Release/Reject/Cancel */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {isAvailable && (
                  <>
                    <button
                      onClick={() => {
                        setAssigningBed(bed);
                        if (waitingForBed.length > 0) setSelectedVisitId(waitingForBed[0].id);
                      }}
                      className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1"
                      title="Assign patient and accept into bed"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Assign (Accept)</span>
                    </button>
                    <button
                      onClick={() => handleStatusChange(bed.id, 'BLOCKED')}
                      className="py-1.5 px-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1"
                      title="Block / take bed offline"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Block</span>
                    </button>
                  </>
                )}

                {isOccupied && (
                  <button
                    onClick={() => handleReleaseBed(bed.id)}
                    className="w-full py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5"
                    title="Release patient and free bed (Red Action)"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Release Bed</span>
                  </button>
                )}

                {isCleaning && (
                  <>
                    <button
                      onClick={() => handleStatusChange(bed.id, 'AVAILABLE')}
                      className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1"
                      title="Accept cleanliness certification and mark available"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Mark Cleaned</span>
                    </button>
                    <button
                      onClick={() => handleStatusChange(bed.id, 'BLOCKED')}
                      className="py-1.5 px-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1"
                      title="Reject cleaning / re-sanitize"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </>
                )}

                {isPreparing && (
                  <button
                    onClick={() => handleStatusChange(bed.id, 'AVAILABLE')}
                    className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1"
                    title="Accept readiness and mark available"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Set Available</span>
                  </button>
                )}

                {isBlocked && (
                  <button
                    onClick={() => handleStatusChange(bed.id, 'AVAILABLE')}
                    className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1"
                    title="Accept bed back into active rotation"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Clear & Make Available</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bed Assignment Modal */}
      {assigningBed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-display">
                  Assign Bed {assigningBed.bedNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  {assigningBed.wardName} • Room {assigningBed.roomNumber}
                </p>
              </div>
              <button
                onClick={() => setAssigningBed(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAssignBedSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Patient Awaiting Bed Placement
                </label>
                {waitingForBed.length === 0 ? (
                  <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 text-center">
                    No patients currently marked WAITING_FOR_BED.
                  </div>
                ) : (
                  <select
                    value={selectedVisitId}
                    onChange={(e) => setSelectedVisitId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-hidden"
                  >
                    {waitingForBed.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.patientName} ({v.patientId}) — {v.departmentName} ({v.waitDurationMinutes}m wait)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                {/* RED CANCEL BUTTON */}
                <button
                  type="button"
                  onClick={() => setAssigningBed(null)}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-xl shadow-xs transition-colors flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>

                {/* GREEN ACCEPT & ASSIGN BUTTON */}
                <button
                  type="submit"
                  disabled={submitting || !selectedVisitId}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Assigning...' : 'Accept & Assign Bed'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
