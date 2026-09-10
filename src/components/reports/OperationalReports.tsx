import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  FileSpreadsheet,
  TrendingUp,
  Clock,
  BedDouble,
  Activity,
} from 'lucide-react';
import { Department, Visit, Bed, DiagnosticRecord } from '../../types';
import { api } from '../../services/api';

export function OperationalReports() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [diagnostics, setDiagnostics] = useState<DiagnosticRecord[]>([]);

  const loadData = async () => {
    const [d, v, b, diag] = await Promise.all([
      api.getDepartments(),
      api.getVisits(),
      api.getBeds(),
      api.getDiagnostics(),
    ]);
    setDepartments(d);
    setVisits(v);
    setBeds(b);
    setDiagnostics(diag);
  };

  useEffect(() => {
    loadData();
    const unsub = api.subscribe(loadData);
    return unsub;
  }, []);

  // 1. Dept Wait Times Chart Data
  const deptWaitData = (departments || []).map((d) => ({
    name: (d.name || 'Dept')
      .replace(' Center', '')
      .replace(' Internal Medicine', '')
      .replace('Diagnostic ', ''),
    avgWait: d.avgWaitMinutes || 0,
    slaTarget: d.maxThresholdWaitMinutes || 60,
  }));

  // 2. Stage distribution data
  const stageDistribution = [
    { name: 'Waiting', count: visits.filter((v) => v.currentStage === 'WAITING').length },
    { name: 'Consult', count: visits.filter((v) => v.currentStage === 'CONSULTATION').length },
    { name: 'Diagnostics', count: visits.filter((v) => v.currentStage === 'DIAGNOSTICS').length },
    { name: 'Treatment', count: visits.filter((v) => v.currentStage === 'TREATMENT').length },
    { name: 'Bed Placement', count: visits.filter((v) => v.currentStage === 'WAITING_FOR_BED').length },
    { name: 'Inpatient', count: visits.filter((v) => v.currentStage === 'ADMITTED').length },
    { name: 'Discharge Ready', count: visits.filter((v) => v.currentStage === 'DISCHARGE_READY').length },
  ];

  // 3. Modality Turnaround Data
  const modalityData = [
    { name: 'CT Scan', avgMinutes: 48, benchmark: 35 },
    { name: 'X-Ray', avgMinutes: 22, benchmark: 20 },
    { name: 'MRI', avgMinutes: 65, benchmark: 50 },
    { name: 'Blood CBC', avgMinutes: 28, benchmark: 30 },
    { name: 'Cardiac Troponin', avgMinutes: 24, benchmark: 25 },
    { name: 'Urinalysis', avgMinutes: 18, benchmark: 20 },
  ];

  // 4. Hourly Flow Trend Data
  const hourlyVolumeData = [
    { hour: '06:00', admissions: 3, discharges: 1 },
    { hour: '08:00', admissions: 8, discharges: 2 },
    { hour: '10:00', admissions: 14, discharges: 6 },
    { hour: '12:00', admissions: 18, discharges: 11 },
    { hour: '14:00', admissions: 15, discharges: 14 },
    { hour: '16:00', admissions: 12, discharges: 9 },
    { hour: '18:00', admissions: 10, discharges: 4 },
  ];

  // 5. Bed Occupancy by Ward
  const wardOccupancyData = [
    { name: 'Emerg. Obs', occupied: 5, total: 6 },
    { name: 'Gen. Ward A', occupied: 9, total: 10 },
    { name: 'Gen. Ward B', occupied: 8, total: 10 },
    { name: 'ICU', occupied: 5, total: 6 },
    { name: 'Post-Surg', occupied: 5, total: 8 },
  ];

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Department,Waiting,Active,Completed,AvgWaitMinutes,Threshold\n' +
      departments
        .map(
          (d) =>
            `"${d.name}",${d.waitingCount},${d.activeCount},${d.completedCount},${d.avgWaitMinutes},${d.maxThresholdWaitMinutes}`
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nexora_operational_flow_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 font-display">
            Hospital Operational Flow Analytics & SLA Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Throughput velocity, department wait thresholds, and bed occupancy benchmarks
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all active:scale-98"
          >
            <Download className="w-4 h-4" />
            <span>Export Operational CSV</span>
          </button>
        </div>
      </div>

      {/* Grid of Analytical Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Dept Wait Times vs Thresholds */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-display">
                Average Wait Times vs Target SLA
              </h2>
              <p className="text-xs text-slate-500">Wait times in minutes by clinical department</p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptWaitData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit="m" />
                <Tooltip
                  formatter={(val: any) => [`${val} min`, '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="avgWait" name="Current Wait (min)" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="slaTarget" name="SLA Target (min)" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Hourly Patient Flow Volume */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-display">
                Facility Inflow & Outflow Volume Trend
              </h2>
              <p className="text-xs text-slate-500">Admissions vs discharges throughout the operational day</p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyVolumeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="admissions" name="Intake / Arrivals" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="discharges" name="Departures / Discharges" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Diagnostic Turnaround vs Benchmark */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-display">
                Diagnostic Turnaround Time (TAT) by Modality
              </h2>
              <p className="text-xs text-slate-500">Order-to-verification latency in minutes</p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={modalityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} unit="m" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#64748b' }} width={100} />
                <Tooltip
                  formatter={(val: any) => [`${val} min`, '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="avgMinutes" name="Actual TAT" fill="#9333ea" radius={[0, 4, 4, 0]} />
                <Bar dataKey="benchmark" name="Benchmark" fill="#cbd5e1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Ward Bed Occupancy Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-display">
                Ward Bed Utilization Rates
              </h2>
              <p className="text-xs text-slate-500">Occupied vs available capacity per hospital ward</p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wardOccupancyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="occupied" name="Occupied Beds" fill="#e11d48" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total" name="Total Capacity" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
