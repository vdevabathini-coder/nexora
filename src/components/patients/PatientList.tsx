import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  UserPlus,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Route,
  Activity,
  SlidersHorizontal,
  Clock,
  UserCheck,
  ChevronDown,
  Check,
  X,
} from 'lucide-react';
import { Patient, Visit, PatientStatus, OperationalPriority } from '../../types';
import { api } from '../../services/api';
import { StatusBadge, PriorityBadge } from '../common/Badges';

interface PatientListProps {
  onSelectPatient: (patientId: string) => void;
  onOpenRegister: () => void;
  onOpenAdvanceModal: (visit: Visit) => void;
  initialFilter?: string;
}

export function PatientList({
  onSelectPatient,
  onOpenRegister,
  onOpenAdvanceModal,
  initialFilter,
}: PatientListProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedStage, setSelectedStage] = useState<string>(initialFilter || 'ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'wait' | 'time' | 'name'>('wait');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (initialFilter) {
      setSelectedStage(initialFilter);
    }
  }, [initialFilter]);

  const loadData = async () => {
    const [p, v] = await Promise.all([api.getPatients(), api.getVisits()]);
    setPatients(p);
    setVisits(v);
  };

  useEffect(() => {
    loadData();
    const unsub = api.subscribe(loadData);
    return unsub;
  }, []);

  // Combine patient + active visit
  const enrichedList = useMemo(() => {
    return patients.map((p) => {
      const activeVisit = visits.find((v) => v.id === p.activeVisitId || v.patientId === p.id);
      return {
        patient: p,
        visit: activeVisit,
      };
    });
  }, [patients, visits]);

  // Filter and sort
  const filteredList = useMemo(() => {
    return enrichedList
      .filter((item) => {
        const { patient, visit } = item;
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          patient.fullName.toLowerCase().includes(q) ||
          patient.id.toLowerCase().includes(q) ||
          (visit && visit.id.toLowerCase().includes(q)) ||
          patient.phone.includes(q);

        const matchesDept =
          selectedDept === 'ALL' || (visit && visit.departmentId === selectedDept);

        const matchesStage =
          selectedStage === 'ALL' ||
          (selectedStage === 'ACTIVE' && visit && visit.currentStage !== 'DISCHARGED') ||
          (visit && visit.currentStage === selectedStage);

        const matchesPriority =
          selectedPriority === 'ALL' || (visit && visit.priority === selectedPriority);

        return matchesSearch && matchesDept && matchesStage && matchesPriority;
      })
      .sort((a, b) => {
        if (sortBy === 'wait') {
          const waitA = a.visit?.waitDurationMinutes || 0;
          const waitB = b.visit?.waitDurationMinutes || 0;
          return sortOrder === 'desc' ? waitB - waitA : waitA - waitB;
        }
        if (sortBy === 'name') {
          return sortOrder === 'desc'
            ? b.patient.fullName.localeCompare(a.patient.fullName)
            : a.patient.fullName.localeCompare(b.patient.fullName);
        }
        // Arrival time
        const timeA = new Date(a.visit?.arrivalTime || a.patient.registrationDate).getTime();
        const timeB = new Date(b.visit?.arrivalTime || b.patient.registrationDate).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [enrichedList, searchQuery, selectedDept, selectedStage, selectedPriority, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredList.length / pageSize) || 1;
  const paginatedList = filteredList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-display">
            Patient Flow Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time directory of active hospital journeys, current stages, and next operational actions
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenRegister}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register New Patient</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, Patient ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-800"
            />
          </div>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => {
              setSelectedDept(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden text-slate-700"
          >
            <option value="ALL">All Departments</option>
            <option value="DEP-EMERGENCY">Emergency & Trauma</option>
            <option value="DEP-GENERAL">General Internal Medicine</option>
            <option value="DEP-CARDIOLOGY">Cardiology Center</option>
            <option value="DEP-RADIOLOGY">Diagnostic Radiology</option>
            <option value="DEP-LAB">Pathology & Lab</option>
            <option value="DEP-SURGERY">Surgical Operations</option>
          </select>

          {/* Stage Filter */}
          <select
            value={selectedStage}
            onChange={(e) => {
              setSelectedStage(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden text-slate-700"
          >
            <option value="ALL">All Stages</option>
            <option value="ACTIVE">Active (Non-discharged)</option>
            <option value="REGISTERED">Registered</option>
            <option value="WAITING">Waiting</option>
            <option value="CONSULTATION">Consultation</option>
            <option value="DIAGNOSTICS">Diagnostics</option>
            <option value="TREATMENT">Treatment</option>
            <option value="ADMISSION_REQUESTED">Admission Requested</option>
            <option value="WAITING_FOR_BED">Waiting for Bed</option>
            <option value="ADMITTED">Admitted</option>
            <option value="DISCHARGE_READY">Discharge Ready</option>
            <option value="DISCHARGED">Discharged</option>
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => {
              setSelectedPriority(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden text-slate-700"
          >
            <option value="ALL">All Operational Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="URGENT">Urgent</option>
            <option value="STANDARD">Standard</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div>
            Showing <span className="font-semibold text-slate-800">{filteredList.length}</span> patients
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Sort By:</span>
            <button
              onClick={() => {
                setSortBy('wait');
                setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
              }}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                sortBy === 'wait' ? 'bg-blue-100 text-blue-800 font-bold' : 'hover:bg-slate-100'
              }`}
            >
              Wait Duration {sortBy === 'wait' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
            <button
              onClick={() => {
                setSortBy('name');
                setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
              }}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                sortBy === 'name' ? 'bg-blue-100 text-blue-800 font-bold' : 'hover:bg-slate-100'
              }`}
            >
              Name {sortBy === 'name' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
          </div>
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Patient Info</th>
                <th className="py-3 px-4">Visit ID</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Current Stage</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Wait Duration</th>
                <th className="py-3 px-4">Assigned Resource</th>
                <th className="py-3 px-4">Next Operational Action</th>
                <th className="py-3 px-4 text-right">Flow Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No matching patients found.
                  </td>
                </tr>
              ) : (
                paginatedList.map(({ patient, visit }) => (
                  <tr key={patient.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div
                        onClick={() => onSelectPatient(patient.id)}
                        className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer"
                      >
                        {patient.fullName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {patient.id} • {patient.gender.charAt(0)}, {patient.age}y
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {visit ? visit.id : 'N/A'}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {visit ? visit.departmentName : 'Unassigned'}
                    </td>

                    <td className="py-3.5 px-4">
                      {visit ? <StatusBadge status={visit.currentStage} /> : <span className="text-slate-400">No active visit</span>}
                    </td>

                    <td className="py-3.5 px-4">
                      {visit ? <PriorityBadge priority={visit.priority} /> : '-'}
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      {visit ? (
                        <span
                          className={`font-bold ${
                            visit.waitDurationMinutes > 30
                              ? 'text-rose-600'
                              : visit.waitDurationMinutes > 15
                              ? 'text-amber-600'
                              : 'text-slate-700'
                          }`}
                        >
                          {visit.waitDurationMinutes} min
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 max-w-[140px] truncate">
                      {visit?.assignedBedNumber ? `Bed ${visit.assignedBedNumber}` : visit?.assignedResource || 'Queue pool'}
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-700 max-w-xs truncate">
                      {visit?.nextOperationalAction || 'Pending review'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectPatient(patient.id)}
                          title="View Patient Flow Passport"
                          className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-[11px] flex items-center gap-1 transition-colors"
                        >
                          <Route className="w-3.5 h-3.5" />
                          <span>Passport</span>
                        </button>

                        {visit && visit.currentStage !== 'DISCHARGED' && (
                          <button
                            onClick={() => onOpenAdvanceModal(visit)}
                            title="Accept & Advance Operational Stage"
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-[11px] shadow-xs transition-all flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Advance</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div>
            Page <span className="font-semibold text-slate-800">{currentPage}</span> of{' '}
            <span className="font-semibold text-slate-800">{totalPages}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
