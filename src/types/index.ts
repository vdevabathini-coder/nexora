/**
 * NEXORA Health — Hospital Flow Intelligence Platform
 * Core Type Definitions
 * "One Patient. One Flow. Zero Blind Spots."
 */

export type PatientStatus =
  | 'REGISTERED'
  | 'WAITING'
  | 'CONSULTATION'
  | 'DIAGNOSTICS'
  | 'TREATMENT'
  | 'ADMISSION_REQUESTED'
  | 'WAITING_FOR_BED'
  | 'ADMITTED'
  | 'DISCHARGE_PREPARATION'
  | 'DISCHARGE_READY'
  | 'DISCHARGED'
  | 'CANCELLED';

export type BedStatus =
  | 'AVAILABLE'
  | 'PREPARING'
  | 'OCCUPIED'
  | 'CLEANING'
  | 'BLOCKED';

export type DiagnosticStatus =
  | 'REQUESTED'
  | 'QUEUED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type OperationalPriority = 'CRITICAL' | 'URGENT' | 'STANDARD' | 'LOW';

export type UserRole =
  | 'ADMIN'
  | 'OPERATIONS_STAFF'
  | 'BED_MANAGER'
  | 'CLINICAL_STAFF';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  departmentId?: string;
  avatar?: string;
}

export interface Patient {
  id: string;
  fullName: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phone: string;
  address: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  registrationDate: string; // ISO String
  activeVisitId?: string;
}

export interface PatientFlowEvent {
  id: string;
  patientId: string;
  visitId: string;
  stage: PatientStatus;
  status: 'STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  departmentId: string;
  departmentName: string;
  resourceId?: string;
  startedAt: string; // ISO String
  completedAt?: string | null;
  durationMinutes?: number;
  notes?: string;
  performedBy: string;
}

export interface Visit {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: 'MALE' | 'FEMALE' | 'OTHER';
  departmentId: string;
  departmentName: string;
  currentStage: PatientStatus;
  priority: OperationalPriority;
  arrivalTime: string; // ISO string
  stageEnteredAt: string; // ISO string
  waitDurationMinutes: number;
  assignedResource?: string;
  assignedBedId?: string;
  assignedBedNumber?: string;
  nextOperationalAction: string;
  operationalStatus: 'NORMAL' | 'ATTENTION' | 'DELAYED';
  dischargeReadiness?: {
    physicianSigned: boolean;
    medicationsReconciled: boolean;
    transportArranged: boolean;
    dischargeDeskNotified: boolean;
    departurePlanReady: boolean;
  };
  dischargedAt?: string;
  notes?: string;
  lastUpdated: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  iconName: string;
  location: string;
  leadPhysician: string;
  totalCapacity: number;
  waitingCount: number;
  activeCount: number;
  completedCount: number;
  avgWaitMinutes: number;
  operationalStatus: 'OPTIMAL' | 'ATTENTION' | 'DELAYED';
  maxThresholdWaitMinutes: number;
}

export interface Bed {
  id: string;
  bedNumber: string;
  ward: 'EMERGENCY_OBS' | 'GENERAL_WARD_A' | 'GENERAL_WARD_B' | 'ICU' | 'POST_SURGICAL';
  wardName: string;
  roomNumber: string;
  status: BedStatus;
  currentPatientId?: string;
  currentPatientName?: string;
  currentVisitId?: string;
  admittedAt?: string;
  lastSanitizedAt?: string;
  notes?: string;
}

export type DiagnosticModality =
  | 'XRAY'
  | 'CT_SCAN'
  | 'MRI'
  | 'ULTRASOUND'
  | 'BLOOD_TEST'
  | 'CARDIAC_ENZYMES'
  | 'URINALYSIS'
  | 'PATHOLOGY';

export interface DiagnosticRecord {
  id: string;
  patientId: string;
  patientName: string;
  visitId: string;
  departmentId: string;
  departmentName: string;
  diagnosticType?: string;
  modality?: string;
  testName: string;
  status: DiagnosticStatus;
  requestedAt: string;
  startedAt?: string;
  completedAt?: string;
  turnaroundTimeMinutes?: number;
  priority?: OperationalPriority;
  labRoom?: string;
  notes?: string;
  resultsNotes?: string;
}

export type NotificationItem = OperationalNotification;

export interface OperationalNotification {
  id: string;
  title: string;
  message: string;
  type: 'BOTTLENECK' | 'BED_AVAILABLE' | 'BED_REQUIRED' | 'DISCHARGE_READY' | 'STAGE_ADVANCE' | 'SYSTEM';
  severity: 'INFO' | 'WARNING' | 'ALERT';
  timestamp: string;
  isRead: boolean;
  relatedPatientId?: string;
  relatedDepartmentId?: string;
  relatedBedId?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entity: 'PATIENT' | 'VISIT' | 'BED' | 'DIAGNOSTIC' | 'FLOW_RECOVERY' | 'DEPARTMENT';
  entityId: string;
  previousValue: string;
  newValue: string;
  details?: string;
}

export interface BottleneckAlert {
  id: string;
  departmentId: string;
  departmentName: string;
  severity: 'MODERATE' | 'SEVERE' | 'HIGH' | 'MEDIUM' | 'LOW';
  queueLength: number;
  thresholdQueue: number;
  avgWaitMinutes: number;
  thresholdWaitMinutes: number;
  affectedPatientsCount?: number;
  detectedAt?: string;
  impactSummary?: string;
  recoveryOptions?: FlowRecoveryOption[];
  delayFactor?: number;
  impactedDownstream?: string[];
  suggestedActions?: string[];
}

export interface FlowRecoveryOption {
  id: string;
  optionLabel: string;
  title: string;
  description: string;
  actionType: 'REASSIGN_STAFF' | 'REROUTE_WORKLOAD' | 'INCREASE_CAPACITY' | 'FAST_TRACK_DISCHARGE';
  projectedReductionMinutes: number;
  requiresApproval: boolean;
  status: 'PROPOSED' | 'APPROVED' | 'EXECUTED';
  approvedBy?: string;
  approvedAt?: string;
}

export interface DashboardMetrics {
  totalActivePatients: number;
  waitingPatients: number;
  inConsultation: number;
  diagnosticsPending: number;
  admissionsPending: number;
  availableBeds: number;
  occupiedBeds: number;
  dischargeReady: number;
  avgWaitTimeMinutes: number;
  activeBottlenecksCount: number;
}
