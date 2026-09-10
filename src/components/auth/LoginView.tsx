import React, { useState } from 'react';
import {
  Activity,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Mail,
  Building2,
  BedDouble,
  UserCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { User } from '../../types';
import { DEMO_USERS } from '../../services/storage';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
}

const FLOW_STAGES = [
  { name: 'Registration', time: '09:05', status: 'COMPLETED' },
  { name: 'Waiting', time: '09:12', status: 'COMPLETED' },
  { name: 'Consultation', time: '09:32', status: 'COMPLETED' },
  { name: 'Diagnostics', time: '09:50', status: 'ACTIVE' },
  { name: 'Treatment', time: '10:30', status: 'PENDING' },
  { name: 'Admission', time: '11:10', status: 'PENDING' },
  { name: 'Bed Placement', time: '11:25', status: 'PENDING' },
  { name: 'Discharge Ready', time: '14:00', status: 'PENDING' },
];

export function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [email, setEmail] = useState('admin@nexora.health');
  const [password, setPassword] = useState('••••••••••••');
  const [activeStageIndex, setActiveStageIndex] = useState(3);

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const matched = DEMO_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (matched) {
      onLoginSuccess(matched);
    } else {
      // Default to Admin
      onLoginSuccess(DEMO_USERS[0]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col lg:flex-row text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Left Column: Branding & Flow Journey Animation */}
      <div className="flex-1 p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden bg-linear-to-b from-slate-900 via-slate-950 to-blue-950/60 border-b lg:border-b-0 lg:border-r border-slate-800">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
              <Activity className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-2xl tracking-tight text-white font-display">NEXORA</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  HEALTH
                </span>
              </div>
              <p className="text-xs text-slate-400 tracking-wider uppercase font-medium">
                Hospital Flow Intelligence Platform
              </p>
            </div>
          </div>

          <div className="mt-12 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs font-medium mb-4">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Phase 1 MVP • Live Command Center</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-display leading-tight">
              One Patient. One Flow. <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-teal-300">
                Zero Blind Spots.
              </span>
            </h1>
            <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
              Eliminate delays across hospital departments. NEXORA connects patient registration,
              triage wait times, diagnostic queues, bed availability, and discharge coordination
              into an authoritative real-time operational map.
            </p>
          </div>
        </div>

        {/* Animated Patient Flow Journey */}
        <div className="my-10 relative z-10 max-w-2xl bg-slate-900/80 backdrop-blur-md rounded-2xl p-6 border border-slate-800 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Live Journey Passport • Patient P-1003 (Sophia Ramirez)
              </h3>
            </div>
            <span className="text-xs text-blue-400 font-mono">Stage 4 of 8 • Active</span>
          </div>

          {/* Interactive Pipeline Track */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {FLOW_STAGES.map((stage, idx) => {
              const isPast = idx < activeStageIndex;
              const isCurrent = idx === activeStageIndex;

              return (
                <div
                  key={stage.name}
                  onClick={() => setActiveStageIndex(idx)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    isCurrent
                      ? 'bg-blue-600/30 border-blue-400 shadow-lg shadow-blue-500/10'
                      : isPast
                      ? 'bg-slate-800/40 border-slate-700 hover:border-slate-600 text-slate-300'
                      : 'bg-slate-900/40 border-slate-800/80 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-medium opacity-80">{stage.time}</span>
                    {isPast ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : isCurrent ? (
                      <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-700" />
                    )}
                  </div>
                  <p className={`text-xs font-semibold ${isCurrent ? 'text-white font-bold' : ''}`}>
                    {stage.name}
                  </p>
                  <span className="text-[9px] uppercase tracking-wider block mt-1 font-mono">
                    {isCurrent ? 'In Progress' : isPast ? 'Completed' : 'Queued'}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Operational Action: Diagnostic CT Scan turnaround active</span>
            </span>
            <span className="font-mono text-[11px] text-slate-500">Wait: 48 min (Delayed)</span>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-xs text-slate-500 flex items-center justify-between relative z-10 pt-4 border-t border-slate-800">
          <span>Enterprise Healthcare Flow Intelligence</span>
          <span>HIPAA-Ready Architecture • Role-Governed Access</span>
        </div>
      </div>

      {/* Right Column: Authentication Card & Demo Role Fast Logins */}
      <div className="w-full lg:w-[480px] p-8 lg:p-12 flex flex-col justify-center bg-slate-950">
        <div className="max-w-md mx-auto w-full">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white font-display">Staff Command Center Sign In</h2>
            <p className="text-xs text-slate-400 mt-1">
              Select a demo role for instant evaluation or sign in with credentials
            </p>
          </div>

          {/* Quick 1-Click Demo Login Panel */}
          <div className="mb-6 p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>1-Click Staff Roles</span>
              </span>
              <span className="text-[10px] text-slate-500">No password needed</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {DEMO_USERS.map((user) => (
                <button
                  key={user.id}
                  onClick={() => onLoginSuccess(user)}
                  className="w-full p-2.5 rounded-lg bg-slate-800/80 hover:bg-blue-600/30 border border-slate-700/80 hover:border-blue-500 text-left flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-700 group-hover:bg-blue-600 text-white font-bold flex items-center justify-center text-xs font-mono transition-colors">
                      {user.avatar}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-200 group-hover:text-white">
                        {user.name}
                      </p>
                      <p className="text-[10px] text-slate-400 group-hover:text-blue-200 font-medium">
                        {user.roleTitle}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-700/60 text-slate-300 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                    Sign In
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Standard Form */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-slate-950 px-2 text-slate-500 tracking-wider">
                Or Staff Credentials
              </span>
            </div>
          </div>

          <form onSubmit={handleCustomLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Staff Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  Password
                </label>
                <span className="text-[10px] text-blue-400 cursor-pointer hover:underline">
                  Reset credentials
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 active:scale-98 text-white text-xs font-bold rounded-lg shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all"
            >
              <span>Access Flow Command Center</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="mt-6 text-center text-[11px] text-slate-500">
            For evaluation purposes, all data is loaded with realistic clinical workflows.
          </p>
        </div>
      </div>
    </div>
  );
}
