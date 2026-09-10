import React from 'react';
import {
  LayoutDashboard,
  Users,
  Route,
  Building2,
  BedDouble,
  FlaskConical,
  DoorOpen,
  AlertTriangle,
  BarChart3,
  ShieldCheck,
  HeartHandshake,
  LogOut,
} from 'lucide-react';
import { User } from '../../types';

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  currentUser: User;
  onLogout: () => void;
  bottlenecksCount: number;
}

export function Sidebar({
  activeView,
  onNavigate,
  currentUser,
  onLogout,
  bottlenecksCount,
}: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Operations Command', icon: LayoutDashboard, badge: null },
    { id: 'patients', label: 'Patient Management', icon: Users, badge: null },
    { id: 'passport', label: 'Patient Flow Passport', icon: Route, highlight: true },
    { id: 'departments', label: 'Department Queues', icon: Building2, badge: null },
    { id: 'beds', label: 'Bed Command Center', icon: BedDouble, badge: null },
    { id: 'diagnostics', label: 'Diagnostics Center', icon: FlaskConical, badge: null },
    { id: 'admission', label: 'Admission & Discharge', icon: DoorOpen, badge: null },
    {
      id: 'bottlenecks',
      label: 'Bottlenecks & Recovery',
      icon: AlertTriangle,
      badge: bottlenecksCount > 0 ? bottlenecksCount : null,
      badgeColor: 'bg-rose-500 text-white',
    },
    { id: 'reports', label: 'Operational Reports', icon: BarChart3, badge: null },
    { id: 'audit', label: 'Audit Trail', icon: ShieldCheck, badge: null },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none min-h-[calc(100vh-4rem)]">
      {/* Navigation list */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
          Operations Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                  : 'hover:bg-slate-800/80 hover:text-white text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : item.highlight ? 'text-blue-400' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge !== null && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    item.badgeColor || 'bg-slate-700 text-slate-200'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Operational Safety Boundary Card */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
          <div className="flex items-center gap-2 text-slate-300 font-semibold text-[11px]">
            <HeartHandshake className="w-3.5 h-3.5 text-blue-400" />
            <span>Operational Safety</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
            NEXORA coordinates flow & resource visibility only. Clinical decisions remain strictly with authorized medical staff.
          </p>
        </div>

        <button
          onClick={onLogout}
          className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-rose-300 hover:bg-slate-800 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out of Command Center</span>
        </button>
      </div>
    </aside>
  );
}
