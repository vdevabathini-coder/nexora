import React from 'react';
import { PatientStatus, BedStatus, OperationalPriority } from '../../types';

export function StatusBadge({ status }: { status: PatientStatus }) {
  const config: Record<PatientStatus, { label: string; bg: string; text: string; dot: string }> = {
    REGISTERED: { label: 'Registered', bg: 'bg-slate-100 border-slate-200', text: 'text-slate-700', dot: 'bg-slate-400' },
    WAITING: { label: 'Waiting', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-800', dot: 'bg-amber-500 animate-pulse' },
    CONSULTATION: { label: 'Consultation', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', dot: 'bg-blue-500' },
    DIAGNOSTICS: { label: 'Diagnostics', bg: 'bg-purple-50 border-purple-200', text: 'text-purple-800', dot: 'bg-purple-500 animate-pulse' },
    TREATMENT: { label: 'Treatment', bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-800', dot: 'bg-indigo-500' },
    ADMISSION_REQUESTED: { label: 'Admission Req.', bg: 'bg-orange-50 border-orange-200', text: 'text-orange-800', dot: 'bg-orange-500 animate-pulse' },
    WAITING_FOR_BED: { label: 'Waiting For Bed', bg: 'bg-rose-50 border-rose-200', text: 'text-rose-800', dot: 'bg-rose-500 animate-pulse' },
    ADMITTED: { label: 'Admitted', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800', dot: 'bg-emerald-500' },
    DISCHARGE_PREPARATION: { label: 'Discharge Prep', bg: 'bg-teal-50 border-teal-200', text: 'text-teal-800', dot: 'bg-teal-500' },
    DISCHARGE_READY: { label: 'Discharge Ready', bg: 'bg-green-50 border-green-300', text: 'text-green-800', dot: 'bg-green-500' },
    DISCHARGED: { label: 'Discharged', bg: 'bg-gray-100 border-gray-200', text: 'text-gray-600', dot: 'bg-gray-400' },
    CANCELLED: { label: 'Cancelled', bg: 'bg-red-50 border-red-200', text: 'text-red-700', dot: 'bg-red-400' },
  };

  const current = config[status] || config.REGISTERED;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${current.bg} ${current.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      {current.label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: OperationalPriority }) {
  const config: Record<OperationalPriority, { label: string; bg: string; text?: string }> = {
    CRITICAL: { label: 'Critical', bg: 'bg-red-100 border-red-300 text-red-800' },
    URGENT: { label: 'Urgent', bg: 'bg-amber-100 border-amber-300 text-amber-800' },
    STANDARD: { label: 'Standard', bg: 'bg-blue-50 border-blue-200 text-blue-700' },
    LOW: { label: 'Low', bg: 'bg-slate-100 border-slate-200 text-slate-600' },
  };

  const current = config[priority] || config.STANDARD;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border tracking-wide uppercase whitespace-nowrap ${current.bg}`}>
      {current.label}
    </span>
  );
}

export function BedBadge({ status }: { status: BedStatus }) {
  const config: Record<BedStatus, { label: string; bg: string; dot: string; text?: string }> = {
    AVAILABLE: { label: 'Available', bg: 'bg-emerald-50 border-emerald-200 text-emerald-800', dot: 'bg-emerald-500' },
    PREPARING: { label: 'Preparing', bg: 'bg-blue-50 border-blue-200 text-blue-800', dot: 'bg-blue-500' },
    OCCUPIED: { label: 'Occupied', bg: 'bg-rose-50 border-rose-200 text-rose-800', dot: 'bg-rose-500' },
    CLEANING: { label: 'Cleaning', bg: 'bg-amber-50 border-amber-200 text-amber-800', dot: 'bg-amber-500' },
    BLOCKED: { label: 'Blocked', bg: 'bg-slate-100 border-slate-300 text-slate-700', dot: 'bg-slate-500' },
  };

  const current = config[status] || config.AVAILABLE;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap ${current.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      {current.label}
    </span>
  );
}
