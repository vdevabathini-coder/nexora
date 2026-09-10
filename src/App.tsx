import React, { useState, useEffect } from 'react';
import { User, Visit, NotificationItem, BottleneckAlert } from './types';
import { api } from './services/api';
import { DEMO_USERS } from './services/storage';

// Common Components
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';

// Views
import { LoginView } from './components/auth/LoginView';
import { OperationsDashboard } from './components/dashboard/OperationsDashboard';
import { PatientList } from './components/patients/PatientList';
import { PatientFlowPassport } from './components/flow/PatientFlowPassport';
import { DepartmentCommandCenter } from './components/departments/DepartmentCommandCenter';
import { BedCommandCenter } from './components/beds/BedCommandCenter';
import { DiagnosticsCenter } from './components/diagnostics/DiagnosticsCenter';
import { AdmissionDischargeHub } from './components/admission/AdmissionDischargeHub';
import { BottleneckRecovery } from './components/bottlenecks/BottleneckRecovery';
import { OperationalReports } from './components/reports/OperationalReports';
import { AuditTrail } from './components/audit/AuditTrail';

// Modals
import { RegisterPatientModal } from './components/patients/RegisterPatientModal';
import { AdvanceStageModal } from './components/patients/AdvanceStageModal';
import { OperationsGuideModal } from './components/demo/OperationsGuideModal';

export default function App() {
  // Authentication
  const [currentUser, setCurrentUser] = useState<User | null>(DEMO_USERS[0]); // Default to Dr. Vance for immediate access
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [viewFilter, setViewFilter] = useState<string | undefined>(undefined);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('PAT-1003');

  // Modals
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [advanceModalVisit, setAdvanceModalVisit] = useState<Visit | null>(null);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  // Global Alerts & Badges
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [bottlenecksCount, setBottlenecksCount] = useState<number>(0);

  const loadGlobalMeta = async () => {
    try {
      const [n, bn] = await Promise.all([api.getNotifications(), api.getBottlenecks()]);
      setNotifications(n);
      setBottlenecksCount(bn.length);
    } catch (e) {
      console.error('Error loading global meta:', e);
    }
  };

  useEffect(() => {
    loadGlobalMeta();
    const unsub = api.subscribe(loadGlobalMeta);
    return unsub;
  }, []);

  const handleNavigate = (view: string, filter?: string) => {
    setActiveView(view);
    setViewFilter(filter);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
  };

  const handleOpenAdvanceModal = (visit: Visit) => {
    setAdvanceModalVisit(visit);
  };

  const handleSwitchUser = (user: User) => {
    setCurrentUser(user);
    api.setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // If not logged in, render the Login screen
  if (!currentUser) {
    return <LoginView onLoginSuccess={setCurrentUser} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900 font-sans antialiased">
      {/* Top Authoritative Navbar */}
      <Navbar
        currentUser={currentUser}
        onUserChange={handleSwitchUser}
        onOpenDemo={() => setIsDemoModalOpen(true)}
        onSelectPatient={(id) => {
          setSelectedPatientId(id);
          setActiveView('passport');
        }}
        onNavigate={handleNavigate}
        activeView={activeView}
      />

      {/* Main Container: Sidebar + Active Content View */}
      <div className="flex-1 flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
        <Sidebar
          activeView={activeView}
          onNavigate={(view) => handleNavigate(view)}
          currentUser={currentUser}
          onLogout={handleLogout}
          bottlenecksCount={bottlenecksCount}
        />

        {/* Dynamic View Router */}
        <main className="flex-1 overflow-y-auto">
          {activeView === 'dashboard' && (
            <OperationsDashboard
              onNavigate={handleNavigate}
              onSelectPatient={handleSelectPatient}
              onOpenRegister={() => setIsRegisterOpen(true)}
              onOpenDemo={() => setIsDemoModalOpen(true)}
            />
          )}

          {activeView === 'patients' && (
            <PatientList
              onSelectPatient={(id) => {
                handleSelectPatient(id);
                setActiveView('passport');
              }}
              onOpenRegister={() => setIsRegisterOpen(true)}
              onOpenAdvanceModal={handleOpenAdvanceModal}
              initialFilter={viewFilter}
            />
          )}

          {activeView === 'passport' && (
            <PatientFlowPassport
              selectedPatientId={selectedPatientId}
              onAdvanceStage={handleOpenAdvanceModal}
              onSelectPatient={handleSelectPatient}
            />
          )}

          {activeView === 'departments' && (
            <DepartmentCommandCenter
              initialDeptId={viewFilter}
              onAdvanceStage={handleOpenAdvanceModal}
              onSelectPatient={(id) => {
                handleSelectPatient(id);
                setActiveView('passport');
              }}
            />
          )}

          {activeView === 'beds' && (
            <BedCommandCenter
              currentUser={currentUser}
              onSelectPatient={(id) => {
                handleSelectPatient(id);
                setActiveView('passport');
              }}
              initialFilter={viewFilter}
            />
          )}

          {activeView === 'diagnostics' && (
            <DiagnosticsCenter
              onSelectPatient={(id) => {
                handleSelectPatient(id);
                setActiveView('passport');
              }}
            />
          )}

          {activeView === 'admission' && (
            <AdmissionDischargeHub
              initialTab={viewFilter === 'DISCHARGE' ? 'DISCHARGE' : 'ADMISSIONS'}
              onSelectPatient={(id) => {
                handleSelectPatient(id);
                setActiveView('passport');
              }}
              onNavigateToBeds={() => setActiveView('beds')}
            />
          )}

          {activeView === 'bottlenecks' && <BottleneckRecovery />}

          {activeView === 'reports' && <OperationalReports />}

          {activeView === 'audit' && <AuditTrail />}
        </main>
      </div>

      {/* Global Modals */}
      <RegisterPatientModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={(newPatientId) => {
          setSelectedPatientId(newPatientId);
          setActiveView('passport');
        }}
      />

      <AdvanceStageModal
        visit={advanceModalVisit}
        isOpen={advanceModalVisit !== null}
        onClose={() => setAdvanceModalVisit(null)}
        onSuccess={() => {
          setAdvanceModalVisit(null);
        }}
      />

      <OperationsGuideModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onNavigate={handleNavigate}
        onSelectPatient={handleSelectPatient}
      />
    </div>
  );
}
