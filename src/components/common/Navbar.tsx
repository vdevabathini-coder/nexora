import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Bell,
  Search,
  Sparkles,
  Shield,
  UserCheck,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  X,
  BedDouble,
  CloudSun,
  CloudLightning,
  Database,
  User as UserIcon,
} from 'lucide-react';
import { User, OperationalNotification, Patient, Bed } from '../../types';
import { DEMO_USERS } from '../../services/storage';
import { api, WeatherStatus, BackendDatabaseStatus } from '../../services/api';

interface NavbarProps {
  currentUser: User;
  onUserChange: (user: User) => void;
  onOpenDemo: () => void;
  onSelectPatient: (patientId: string) => void;
  onNavigate: (view: string, filter?: string) => void;
  activeView: string;
}

export function Navbar({
  currentUser,
  onUserChange,
  onOpenDemo,
  onSelectPatient,
  onNavigate,
}: NavbarProps) {
  const [notifications, setNotifications] = useState<OperationalNotification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    patients: Patient[];
    beds: Bed[];
  }>({ patients: [], beds: [] });
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Weather & Database Backend States
  const [weather, setWeather] = useState<WeatherStatus>({
    condition: 'NORMAL',
    label: 'Fair & Mild (Optimal Flow)',
    temperature: '72°F (22°C)',
    windSpeed: '6 mph SW',
    advisory: 'Standard metropolitan ambulance routing active. Weather index is GREEN.',
    impactLevel: 'LOW',
    statusColor: 'GREEN',
    lastUpdated: new Date().toISOString(),
  });
  const [dbStatus, setDbStatus] = useState<BackendDatabaseStatus | null>(null);
  const [showDbModal, setShowDbModal] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const loadNotifs = async () => {
      const data = await api.getNotifications();
      setNotifications(data);
    };
    const loadStatus = async () => {
      const [w, db] = await Promise.all([api.getWeather(), api.getBackendStatus()]);
      setWeather(w);
      setDbStatus(db);
    };
    loadNotifs();
    loadStatus();
    const unsub = api.subscribe(() => {
      loadNotifs();
      loadStatus();
    });
    return unsub;
  }, []);

  const handleToggleWeather = async () => {
    const updated = await api.toggleWeather();
    setWeather(updated);
  };

  // Global search effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ patients: [], beds: [] });
      setShowSearchDropdown(false);
      return;
    }

    const query = searchQuery.toLowerCase();
    const doSearch = async () => {
      const allPatients = await api.getPatients();
      const allBeds = await api.getBeds();

      const matchedPatients = allPatients.filter(
        (p) =>
          p.fullName.toLowerCase().includes(query) ||
          p.id.toLowerCase().includes(query) ||
          p.phone.includes(query)
      );

      const matchedBeds = allBeds.filter(
        (b) =>
          b.bedNumber.toLowerCase().includes(query) ||
          b.wardName.toLowerCase().includes(query) ||
          (b.currentPatientName && b.currentPatientName.toLowerCase().includes(query))
      );

      setSearchResults({
        patients: matchedPatients.slice(0, 5),
        beds: matchedBeds.slice(0, 4),
      });
      setShowSearchDropdown(true);
    };

    doSearch();
  }, [searchQuery]);

  // Click outside search
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
  };

  const handleReset = async () => {
    await api.resetDemoData();
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 lg:px-6 flex items-center justify-between shadow-xs">
      {/* Brand & Live status */}
      <div className="flex items-center gap-3">
        <div
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm shadow-blue-200">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-slate-900 font-display">NEXORA</span>
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">HEALTH</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium hidden sm:block leading-none -mt-0.5">
              Hospital Flow Intelligence
            </p>
          </div>
        </div>

        {/* Live Pulse Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Flow Engine Active</span>
        </div>

        {/* Live Weather & Surge Status: Green (Optimal) vs Red (Surge Alert) */}
        <button
          onClick={handleToggleWeather}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold transition-all shadow-xs active:scale-95 ${
            weather.condition === 'NORMAL'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
              : 'bg-rose-50 border-rose-400 text-rose-800 hover:bg-rose-100 animate-pulse'
          }`}
          title={`Hospital Weather Condition: ${weather.condition}. Click to toggle storm surge!`}
        >
          {weather.condition === 'NORMAL' ? (
            <CloudSun className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <CloudLightning className="w-3.5 h-3.5 text-rose-600" />
          )}
          <span className="hidden sm:inline">Weather:</span>
          <span>{weather.condition === 'NORMAL' ? 'GREEN (Optimal)' : 'RED (Surge Alert)'}</span>
        </button>

        {/* Backend & Persistent Database Indicator */}
        <button
          onClick={() => setShowDbModal(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-colors shadow-xs active:scale-95"
          title="Click to view Backend & Database Synchronization"
        >
          <Database className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden sm:inline">DB & Backend: Connected</span>
          <span className="sm:hidden">DB: OK</span>
        </button>
      </div>

      {/* Center: Global Search */}
      <div ref={searchRef} className="relative hidden md:block w-72 lg:w-96">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search patient, bed, ID (e.g. Miller, PAT-1001, GWA-01)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.trim() && setShowSearchDropdown(true)}
            className="w-full pl-9 pr-8 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 placeholder-slate-400 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showSearchDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {searchResults.patients.length === 0 && searchResults.beds.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                No matching patients or beds found for "{searchQuery}"
              </div>
            ) : (
              <>
                {searchResults.patients.length > 0 && (
                  <div className="p-2">
                    <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Patients ({searchResults.patients.length})
                    </div>
                    {searchResults.patients.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          onSelectPatient(p.id);
                          onNavigate('passport');
                          setShowSearchDropdown(false);
                          setSearchQuery('');
                        }}
                        className="px-2.5 py-2 rounded-lg hover:bg-blue-50 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                            <UserIcon className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-900">{p.fullName}</p>
                            <p className="text-[11px] text-slate-500">{p.id} • Age {p.age}</p>
                          </div>
                        </div>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                          View Flow
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {searchResults.beds.length > 0 && (
                  <div className="p-2">
                    <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Beds ({searchResults.beds.length})
                    </div>
                    {searchResults.beds.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => {
                          onNavigate('beds');
                          setShowSearchDropdown(false);
                          setSearchQuery('');
                        }}
                        className="px-2.5 py-2 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <BedDouble className="w-4 h-4 text-slate-500" />
                          <div>
                            <p className="text-xs font-semibold text-slate-800">Bed {b.bedNumber}</p>
                            <p className="text-[11px] text-slate-500">{b.wardName} • Room {b.roomNumber}</p>
                          </div>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                            b.status === 'AVAILABLE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : b.status === 'OCCUPIED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Live Demo Trigger */}
        <button
          onClick={onOpenDemo}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-linear-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
          <span>Live Demo Mode</span>
        </button>

        {/* Reset Demo Data */}
        <button
          onClick={handleReset}
          title="Reset Demo Baseline"
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg relative transition-colors"
            title="Operational Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 divide-y divide-slate-100">
              <div className="p-3 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Operational Alerts ({unreadCount} new)
                  </span>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    Mark All Read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No active notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        api.markNotificationRead(n.id);
                        if (n.type === 'BOTTLENECK') onNavigate('bottlenecks');
                        if (n.type === 'BED_AVAILABLE' || n.type === 'BED_REQUIRED') onNavigate('beds');
                        if (n.type === 'DISCHARGE_READY') onNavigate('admission', 'DISCHARGE');
                        setShowNotifs(false);
                      }}
                      className={`p-3 text-left hover:bg-slate-50 cursor-pointer transition-colors ${
                        !n.isRead ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`text-xs font-semibold ${
                            n.severity === 'ALERT'
                              ? 'text-rose-700'
                              : n.severity === 'WARNING'
                              ? 'text-amber-700'
                              : 'text-blue-700'
                          }`}
                        >
                          {n.title}
                        </span>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-1.5 block">
                        {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 border border-slate-200 transition-colors"
          >
            <div className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center text-xs font-bold font-mono">
              {currentUser.avatar || 'OP'}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-none">{currentUser.name}</p>
              <p className="text-[10px] text-slate-500 font-medium">{currentUser.roleTitle}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Role selection dropdown */}
          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
              <div className="p-3 bg-slate-50 border-b border-slate-100">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Switch Active Role
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Simulate hospital operational viewpoints
                </p>
              </div>
              <div className="p-1.5 space-y-1">
                {DEMO_USERS.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => {
                      onUserChange(user);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      currentUser.id === user.id ? 'bg-blue-50 text-blue-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-[10px] text-slate-400 font-normal">{user.roleTitle}</p>
                    </div>
                    {currentUser.id === user.id && (
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Database & Backend Health Modal */}
      {showDbModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-display">
                    Persistent Backend & Database Status
                  </h3>
                  <p className="text-xs text-slate-500">Live operational data storage engine</p>
                </div>
              </div>
              <button
                onClick={() => setShowDbModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center gap-2 text-emerald-900 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>Connection Health</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[11px]">
                  ONLINE (GREEN)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Database Engine</span>
                  <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                    {dbStatus?.database.engine || 'Persistent JSON Storage'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Writes</span>
                  <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                    {dbStatus?.database.totalWrites || 42} Writes Recorded
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Patients in DB</span>
                  <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                    {dbStatus?.database.totalPatients || 0} Records
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Hospital Beds in DB</span>
                  <span className="text-sm font-bold text-slate-800 mt-0.5 block">
                    {dbStatus?.database.totalBeds || 0} Beds Configured
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600">
                <div className="font-semibold text-slate-800 mb-1">Color Legend & Working Options:</div>
                <ul className="space-y-1 text-[11px] list-disc pl-4 text-slate-600">
                  <li><strong className="text-emerald-700">GREEN BUTTONS</strong>: Accept admissions, accept diagnostics, assign beds, authorize discharges, accept recovery protocols.</li>
                  <li><strong className="text-rose-700">RED BUTTONS</strong>: Reject/cancel admissions, reject/cancel diagnostics, release beds, reject/hold discharges, dismiss recovery protocols.</li>
                  <li><strong className="text-slate-800">WEATHER SURGE STATUS</strong>: GREEN = optimal intake. RED = severe storm surge inflow.</li>
                </ul>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowDbModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
