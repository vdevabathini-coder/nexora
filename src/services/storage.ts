/**
 * NEXORA Health — Hospital Flow Intelligence Platform
 * Persistent State & Storage Layer (Firebase Firestore emulation / sync with LocalStorage)
 * Handles realistic demo datasets, CRUD operations, stage transitions, bed management, and audit logging.
 */

import {
  AuditLog,
  Bed,
  BottleneckAlert,
  DashboardMetrics,
  Department,
  DiagnosticRecord,
  OperationalNotification,
  OperationalPriority,
  Patient,
  PatientFlowEvent,
  PatientStatus,
  User,
  Visit,
} from '../types';

// Default Demo Users
export const DEMO_USERS: User[] = [
  {
    id: 'USR-ADMIN',
    name: 'Dr. Alistair Vance',
    email: 'admin@nexora.health',
    role: 'ADMIN',
    roleTitle: 'Hospital Operations Director',
    avatar: 'AV',
  },
  {
    id: 'USR-OPS',
    name: 'Sarah Jenkins, RN',
    email: 'operations@nexora.health',
    role: 'OPERATIONS_STAFF',
    roleTitle: 'Chief Flow Coordinator',
    avatar: 'SJ',
  },
  {
    id: 'USR-BED',
    name: 'Marcus Chen',
    email: 'bedmanager@nexora.health',
    role: 'BED_MANAGER',
    roleTitle: 'Patient Placement Supervisor',
    avatar: 'MC',
  },
  {
    id: 'USR-CLINIC',
    name: 'Dr. Elena Rostova',
    email: 'clinical@nexora.health',
    role: 'CLINICAL_STAFF',
    roleTitle: 'Emergency Department Lead',
    departmentId: 'DEP-EMERGENCY',
    avatar: 'ER',
  },
];

// Initial 6 Departments
const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: 'DEP-EMERGENCY',
    name: 'Emergency & Trauma',
    code: 'ED',
    iconName: 'Flame',
    location: 'Building A, Ground Floor',
    leadPhysician: 'Dr. Elena Rostova',
    totalCapacity: 25,
    waitingCount: 7,
    activeCount: 11,
    completedCount: 38,
    avgWaitMinutes: 22,
    operationalStatus: 'ATTENTION',
    maxThresholdWaitMinutes: 30,
  },
  {
    id: 'DEP-GENERAL',
    name: 'General Internal Medicine',
    code: 'GIM',
    iconName: 'Stethoscope',
    location: 'Building B, Level 1',
    leadPhysician: 'Dr. Michael Sterling',
    totalCapacity: 30,
    waitingCount: 4,
    activeCount: 8,
    completedCount: 45,
    avgWaitMinutes: 16,
    operationalStatus: 'OPTIMAL',
    maxThresholdWaitMinutes: 35,
  },
  {
    id: 'DEP-CARDIOLOGY',
    name: 'Cardiology Center',
    code: 'CARD',
    iconName: 'HeartPulse',
    location: 'Heart Tower, Level 3',
    leadPhysician: 'Dr. Patricia Wright',
    totalCapacity: 18,
    waitingCount: 3,
    activeCount: 6,
    completedCount: 22,
    avgWaitMinutes: 19,
    operationalStatus: 'OPTIMAL',
    maxThresholdWaitMinutes: 30,
  },
  {
    id: 'DEP-RADIOLOGY',
    name: 'Diagnostic Radiology & Imaging',
    code: 'RAD',
    iconName: 'Scan',
    location: 'Building A, Basement 1',
    leadPhysician: 'Dr. Arthur Pendelton',
    totalCapacity: 15,
    waitingCount: 11,
    activeCount: 5,
    completedCount: 29,
    avgWaitMinutes: 44,
    operationalStatus: 'DELAYED',
    maxThresholdWaitMinutes: 30,
  },
  {
    id: 'DEP-LAB',
    name: 'Pathology & Diagnostic Laboratory',
    code: 'PATH',
    iconName: 'FlaskConical',
    location: 'Central Tower, Level 2',
    leadPhysician: 'Dr. Angela Mercer',
    totalCapacity: 20,
    waitingCount: 5,
    activeCount: 7,
    completedCount: 64,
    avgWaitMinutes: 24,
    operationalStatus: 'OPTIMAL',
    maxThresholdWaitMinutes: 35,
  },
  {
    id: 'DEP-SURGERY',
    name: 'Surgical Operations & OT',
    code: 'SURG',
    iconName: 'Scissors',
    location: 'Surgical Pavilion, Level 4',
    leadPhysician: 'Dr. Keith Sullivan',
    totalCapacity: 12,
    waitingCount: 2,
    activeCount: 4,
    completedCount: 15,
    avgWaitMinutes: 14,
    operationalStatus: 'OPTIMAL',
    maxThresholdWaitMinutes: 25,
  },
];

// Generate 40 Beds across 5 wards
const INITIAL_BEDS: Bed[] = [
  // Emergency Observation (8 beds)
  { id: 'BED-101', bedNumber: 'ED-01', ward: 'EMERGENCY_OBS', wardName: 'Emergency Observation', roomNumber: 'ER-Bay 1', status: 'OCCUPIED', currentPatientId: 'PAT-1002', currentPatientName: 'Eleanor Davis', currentVisitId: 'VIS-2002', admittedAt: '2026-09-10T05:30:00Z' },
  { id: 'BED-102', bedNumber: 'ED-02', ward: 'EMERGENCY_OBS', wardName: 'Emergency Observation', roomNumber: 'ER-Bay 1', status: 'OCCUPIED', currentPatientId: 'PAT-1005', currentPatientName: 'Julian Thorne', currentVisitId: 'VIS-2005', admittedAt: '2026-09-10T06:15:00Z' },
  { id: 'BED-103', bedNumber: 'ED-03', ward: 'EMERGENCY_OBS', wardName: 'Emergency Observation', roomNumber: 'ER-Bay 2', status: 'AVAILABLE', lastSanitizedAt: '2026-09-10T06:45:00Z' },
  { id: 'BED-104', bedNumber: 'ED-04', ward: 'EMERGENCY_OBS', wardName: 'Emergency Observation', roomNumber: 'ER-Bay 2', status: 'PREPARING', notes: 'Linens and telemetry monitor being installed' },
  { id: 'BED-105', bedNumber: 'ED-05', ward: 'EMERGENCY_OBS', wardName: 'Emergency Observation', roomNumber: 'ER-Bay 3', status: 'CLEANING', notes: 'Sanitizing terminal wipe-down' },
  { id: 'BED-106', bedNumber: 'ED-06', ward: 'EMERGENCY_OBS', wardName: 'Emergency Observation', roomNumber: 'ER-Bay 3', status: 'AVAILABLE', lastSanitizedAt: '2026-09-10T07:10:00Z' },
  { id: 'BED-107', bedNumber: 'ED-07', ward: 'EMERGENCY_OBS', wardName: 'Emergency Observation', roomNumber: 'ER-Bay 4', status: 'OCCUPIED', currentPatientId: 'PAT-1011', currentPatientName: 'Robert Langdon', currentVisitId: 'VIS-2011', admittedAt: '2026-09-10T04:20:00Z' },
  { id: 'BED-108', bedNumber: 'ED-08', ward: 'EMERGENCY_OBS', wardName: 'Emergency Observation', roomNumber: 'ER-Bay 4', status: 'BLOCKED', notes: 'Negative pressure filter replacement underway' },

  // General Ward A (10 beds)
  { id: 'BED-201', bedNumber: 'GWA-01', ward: 'GENERAL_WARD_A', wardName: 'General Ward A (Level 2)', roomNumber: '201-A', status: 'OCCUPIED', currentPatientId: 'PAT-1006', currentPatientName: 'Beatrice Vance', currentVisitId: 'VIS-2006', admittedAt: '2026-09-09T18:00:00Z' },
  { id: 'BED-202', bedNumber: 'GWA-02', ward: 'GENERAL_WARD_A', wardName: 'General Ward A (Level 2)', roomNumber: '201-B', status: 'AVAILABLE', lastSanitizedAt: '2026-09-10T06:00:00Z' },
  { id: 'BED-203', bedNumber: 'GWA-03', ward: 'GENERAL_WARD_A', wardName: 'General Ward A (Level 2)', roomNumber: '202-A', status: 'OCCUPIED', currentPatientId: 'PAT-1014', currentPatientName: 'Claire Bennet', currentVisitId: 'VIS-2014', admittedAt: '2026-09-09T22:30:00Z' },
  { id: 'BED-204', bedNumber: 'GWA-04', ward: 'GENERAL_WARD_A', wardName: 'General Ward A (Level 2)', roomNumber: '202-B', status: 'AVAILABLE', lastSanitizedAt: '2026-09-10T07:20:00Z' },
  { id: 'BED-205', bedNumber: 'GWA-05', ward: 'GENERAL_WARD_A', wardName: 'General Ward A (Level 2)', roomNumber: '203-A', status: 'PREPARING', notes: 'Reserved for incoming transfer from ED' },
  { id: 'BED-206', bedNumber: 'GWA-06', ward: 'GENERAL_WARD_A', wardName: 'General Ward A (Level 2)', roomNumber: '203-B', status: 'OCCUPIED', currentPatientId: 'PAT-1018', currentPatientName: 'Samuel Jackson', currentVisitId: 'VIS-2018', admittedAt: '2026-09-08T14:15:00Z' },
  { id: 'BED-207', bedNumber: 'GWA-07', ward: 'GENERAL_WARD_A', wardName: 'General Ward A (Level 2)', roomNumber: '204-A', status: 'CLEANING', notes: 'Discharged patient bed terminal sanitation' },
  { id: 'BED-208', bedNumber: 'GWA-08', ward: 'GENERAL_WARD_A', wardName: 'General Ward A (Level 2)', roomNumber: '204-B', status: 'AVAILABLE', lastSanitizedAt: '2026-09-10T05:40:00Z' },
  { id: 'BED-209', bedNumber: 'GWA-09', ward: 'GENERAL_WARD_A', wardName: 'General Ward A (Level 2)', roomNumber: '205-A', status: 'OCCUPIED', currentPatientId: 'PAT-1022', currentPatientName: 'Grace Hopper', currentVisitId: 'VIS-2022', admittedAt: '2026-09-09T11:00:00Z' },
  { id: 'BED-210', bedNumber: 'GWA-10', ward: 'GENERAL_WARD_A', wardName: 'General Ward A (Level 2)', roomNumber: '205-B', status: 'AVAILABLE', lastSanitizedAt: '2026-09-10T04:50:00Z' },

  // General Ward B (8 beds)
  { id: 'BED-301', bedNumber: 'GWB-01', ward: 'GENERAL_WARD_B', wardName: 'General Ward B (Level 3)', roomNumber: '301-A', status: 'OCCUPIED', currentPatientId: 'PAT-1025', currentPatientName: 'Oliver Twist', currentVisitId: 'VIS-2025', admittedAt: '2026-09-09T19:20:00Z' },
  { id: 'BED-302', bedNumber: 'GWB-02', ward: 'GENERAL_WARD_B', wardName: 'General Ward B (Level 3)', roomNumber: '301-B', status: 'OCCUPIED', currentPatientId: 'PAT-1028', currentPatientName: 'Hannah Abbott', currentVisitId: 'VIS-2028', admittedAt: '2026-09-09T20:45:00Z' },
  { id: 'BED-303', bedNumber: 'GWB-03', ward: 'GENERAL_WARD_B', wardName: 'General Ward B (Level 3)', roomNumber: '302-A', status: 'AVAILABLE', lastSanitizedAt: '2026-09-10T06:10:00Z' },
  { id: 'BED-304', bedNumber: 'GWB-04', ward: 'GENERAL_WARD_B', wardName: 'General Ward B (Level 3)', roomNumber: '302-B', status: 'PREPARING' },
  { id: 'BED-305', bedNumber: 'GWB-05', ward: 'GENERAL_WARD_B', wardName: 'General Ward B (Level 3)', roomNumber: '303-A', status: 'AVAILABLE', lastSanitizedAt: '2026-09-10T03:30:00Z' },
  { id: 'BED-306', bedNumber: 'GWB-06', ward: 'GENERAL_WARD_B', wardName: 'General Ward B (Level 3)', roomNumber: '303-B', status: 'OCCUPIED', currentPatientId: 'PAT-1031', currentPatientName: 'Derek Morgan', currentVisitId: 'VIS-2031', admittedAt: '2026-09-08T09:00:00Z' },
  { id: 'BED-307', bedNumber: 'GWB-07', ward: 'GENERAL_WARD_B', wardName: 'General Ward B (Level 3)', roomNumber: '304-A', status: 'CLEANING' },
  { id: 'BED-308', bedNumber: 'GWB-08', ward: 'GENERAL_WARD_B', wardName: 'General Ward B (Level 3)', roomNumber: '304-B', status: 'AVAILABLE', lastSanitizedAt: '2026-09-10T06:55:00Z' },

  // ICU / Critical Care (6 beds)
  { id: 'BED-401', bedNumber: 'ICU-01', ward: 'ICU', wardName: 'Intensive Care Unit (Level 4)', roomNumber: 'ICU-Rm 1', status: 'OCCUPIED', currentPatientId: 'PAT-1008', currentPatientName: 'Arthur Dent', currentVisitId: 'VIS-2008', admittedAt: '2026-09-10T01:15:00Z' },
  { id: 'BED-402', bedNumber: 'ICU-02', ward: 'ICU', wardName: 'Intensive Care Unit (Level 4)', roomNumber: 'ICU-Rm 2', status: 'OCCUPIED', currentPatientId: 'PAT-1019', currentPatientName: 'Evelyn Salt', currentVisitId: 'VIS-2019', admittedAt: '2026-09-09T16:00:00Z' },
  { id: 'BED-403', bedNumber: 'ICU-03', ward: 'ICU', wardName: 'Intensive Care Unit (Level 4)', roomNumber: 'ICU-Rm 3', status: 'AVAILABLE', lastSanitizedAt: '2026-09-10T05:00:00Z' },
  { id: 'BED-404', bedNumber: 'ICU-04', ward: 'ICU', wardName: 'Intensive Care Unit (Level 4)', roomNumber: 'ICU-Rm 4', status: 'PREPARING', notes: 'Ventilator pre-check completed' },
  { id: 'BED-405', bedNumber: 'ICU-05', ward: 'ICU', wardName: 'Intensive Care Unit (Level 4)', roomNumber: 'ICU-Rm 5', status: 'OCCUPIED', currentPatientId: 'PAT-1033', currentPatientName: 'Lucas Grey', currentVisitId: 'VIS-2033', admittedAt: '2026-09-09T23:45:00Z' },
  { id: 'BED-406', bedNumber: 'ICU-06', ward: 'ICU', wardName: 'Intensive Care Unit (Level 4)', roomNumber: 'ICU-Rm 6', status: 'BLOCKED', notes: 'Biomedical maintenance scheduled' },

  // Post-Surgical Recovery (8 beds)
  { id: 'BED-501', bedNumber: 'PACU-01', ward: 'POST_SURGICAL', wardName: 'Post-Surgical Unit (Level 4)', roomNumber: 'PACU-Bay 1', status: 'OCCUPIED', currentPatientId: 'PAT-1015', currentPatientName: 'Victoria Price', currentVisitId: 'VIS-2015', admittedAt: '2026-09-10T03:00:00Z' },
  { id: 'BED-502', bedNumber: 'PACU-02', ward: 'POST_SURGICAL', wardName: 'Post-Surgical Unit (Level 4)', roomNumber: 'PACU-Bay 1', status: 'AVAILABLE', lastSanitizedAt: '2026-09-10T06:30:00Z' },
  { id: 'BED-503', bedNumber: 'PACU-03', ward: 'POST_SURGICAL', wardName: 'Post-Surgical Unit (Level 4)', roomNumber: 'PACU-Bay 2', status: 'AVAILABLE', lastSanitizedAt: '2026-09-10T05:15:00Z' },
  { id: 'BED-504', bedNumber: 'PACU-04', ward: 'POST_SURGICAL', wardName: 'Post-Surgical Unit (Level 4)', roomNumber: 'PACU-Bay 2', status: 'CLEANING' },
  { id: 'BED-505', bedNumber: 'PACU-05', ward: 'POST_SURGICAL', wardName: 'Post-Surgical Unit (Level 4)', roomNumber: 'PACU-Bay 3', status: 'AVAILABLE', lastSanitizedAt: '2026-09-10T07:00:00Z' },
  { id: 'BED-506', bedNumber: 'PACU-06', ward: 'POST_SURGICAL', wardName: 'Post-Surgical Unit (Level 4)', roomNumber: 'PACU-Bay 3', status: 'PREPARING' },
  { id: 'BED-507', bedNumber: 'PACU-07', ward: 'POST_SURGICAL', wardName: 'Post-Surgical Unit (Level 4)', roomNumber: 'PACU-Bay 4', status: 'OCCUPIED', currentPatientId: 'PAT-1035', currentPatientName: 'Diana Prince', currentVisitId: 'VIS-2035', admittedAt: '2026-09-10T02:40:00Z' },
  { id: 'BED-508', bedNumber: 'PACU-08', ward: 'POST_SURGICAL', wardName: 'Post-Surgical Unit (Level 4)', roomNumber: 'PACU-Bay 4', status: 'AVAILABLE', lastSanitizedAt: '2026-09-10T06:05:00Z' },
];

// Initial 32 Patients across stages:
// REGISTERED, WAITING, CONSULTATION, DIAGNOSTICS, TREATMENT, ADMISSION_REQUESTED, WAITING_FOR_BED, ADMITTED, DISCHARGE_PREPARATION, DISCHARGE_READY, DISCHARGED
const INITIAL_PATIENTS: { patient: Patient; visit: Visit }[] = [
  {
    patient: {
      id: 'PAT-1001',
      fullName: 'Jonathan Miller',
      age: 42,
      gender: 'MALE',
      phone: '+1 (555) 234-8901',
      address: '742 Evergreen Terrace, Springfield',
      emergencyContact: { name: 'Sarah Miller', relationship: 'Spouse', phone: '+1 (555) 234-8902' },
      registrationDate: '2026-09-10T07:15:00Z',
      activeVisitId: 'VIS-2001',
    },
    visit: {
      id: 'VIS-2001',
      patientId: 'PAT-1001',
      patientName: 'Jonathan Miller',
      patientAge: 42,
      patientGender: 'MALE',
      departmentId: 'DEP-EMERGENCY',
      departmentName: 'Emergency & Trauma',
      currentStage: 'WAITING',
      priority: 'URGENT',
      arrivalTime: '2026-09-10T07:15:00Z',
      stageEnteredAt: '2026-09-10T07:20:00Z',
      waitDurationMinutes: 28,
      assignedResource: 'Triage Nurse 3',
      nextOperationalAction: 'Awaiting consultation with Attending Physician',
      operationalStatus: 'NORMAL',
      lastUpdated: '2026-09-10T07:20:00Z',
    },
  },
  {
    patient: {
      id: 'PAT-1002',
      fullName: 'Eleanor Davis',
      age: 67,
      gender: 'FEMALE',
      phone: '+1 (555) 345-6789',
      address: '12 Oak Ridge Blvd, Westwood',
      emergencyContact: { name: 'Mark Davis', relationship: 'Son', phone: '+1 (555) 345-6790' },
      registrationDate: '2026-09-10T05:10:00Z',
      activeVisitId: 'VIS-2002',
    },
    visit: {
      id: 'VIS-2002',
      patientId: 'PAT-1002',
      patientName: 'Eleanor Davis',
      patientAge: 67,
      patientGender: 'FEMALE',
      departmentId: 'DEP-EMERGENCY',
      departmentName: 'Emergency & Trauma',
      currentStage: 'ADMITTED',
      priority: 'CRITICAL',
      arrivalTime: '2026-09-10T05:10:00Z',
      stageEnteredAt: '2026-09-10T05:30:00Z',
      waitDurationMinutes: 12,
      assignedResource: 'Dr. Elena Rostova',
      assignedBedId: 'BED-101',
      assignedBedNumber: 'ED-01',
      nextOperationalAction: 'Continuous cardiac telemetry monitoring',
      operationalStatus: 'NORMAL',
      lastUpdated: '2026-09-10T05:30:00Z',
    },
  },
  {
    patient: {
      id: 'PAT-1003',
      fullName: 'Sophia Ramirez',
      age: 29,
      gender: 'FEMALE',
      phone: '+1 (555) 456-7890',
      address: '304 Marina Vista, Baytown',
      emergencyContact: { name: 'Carlos Ramirez', relationship: 'Brother', phone: '+1 (555) 456-7891' },
      registrationDate: '2026-09-10T06:30:00Z',
      activeVisitId: 'VIS-2003',
    },
    visit: {
      id: 'VIS-2003',
      patientId: 'PAT-1003',
      patientName: 'Sophia Ramirez',
      patientAge: 29,
      patientGender: 'FEMALE',
      departmentId: 'DEP-RADIOLOGY',
      departmentName: 'Diagnostic Radiology & Imaging',
      currentStage: 'DIAGNOSTICS',
      priority: 'URGENT',
      arrivalTime: '2026-09-10T06:30:00Z',
      stageEnteredAt: '2026-09-10T06:50:00Z',
      waitDurationMinutes: 48,
      assignedResource: 'CT Scanner 1',
      nextOperationalAction: 'Contrast CT Scan scan in progress (Turnaround Delayed)',
      operationalStatus: 'DELAYED',
      lastUpdated: '2026-09-10T06:50:00Z',
    },
  },
  {
    patient: {
      id: 'PAT-1004',
      fullName: 'Liam Washington',
      age: 35,
      gender: 'MALE',
      phone: '+1 (555) 567-8901',
      address: '88 Heritage Point, Southside',
      emergencyContact: { name: 'Angela Washington', relationship: 'Spouse', phone: '+1 (555) 567-8902' },
      registrationDate: '2026-09-10T06:45:00Z',
      activeVisitId: 'VIS-2004',
    },
    visit: {
      id: 'VIS-2004',
      patientId: 'PAT-1004',
      patientName: 'Liam Washington',
      patientAge: 35,
      patientGender: 'MALE',
      departmentId: 'DEP-GENERAL',
      departmentName: 'General Internal Medicine',
      currentStage: 'CONSULTATION',
      priority: 'STANDARD',
      arrivalTime: '2026-09-10T06:45:00Z',
      stageEnteredAt: '2026-09-10T07:10:00Z',
      waitDurationMinutes: 25,
      assignedResource: 'Dr. Michael Sterling (Exam Room 3)',
      nextOperationalAction: 'Physician physical assessment in progress',
      operationalStatus: 'NORMAL',
      lastUpdated: '2026-09-10T07:10:00Z',
    },
  },
  {
    patient: {
      id: 'PAT-1005',
      fullName: 'Julian Thorne',
      age: 58,
      gender: 'MALE',
      phone: '+1 (555) 678-9012',
      address: '15 High St, Northfield',
      emergencyContact: { name: 'Rebecca Thorne', relationship: 'Spouse', phone: '+1 (555) 678-9013' },
      registrationDate: '2026-09-10T05:50:00Z',
      activeVisitId: 'VIS-2005',
    },
    visit: {
      id: 'VIS-2005',
      patientId: 'PAT-1005',
      patientName: 'Julian Thorne',
      patientAge: 58,
      patientGender: 'MALE',
      departmentId: 'DEP-EMERGENCY',
      departmentName: 'Emergency & Trauma',
      currentStage: 'TREATMENT',
      priority: 'URGENT',
      arrivalTime: '2026-09-10T05:50:00Z',
      stageEnteredAt: '2026-09-10T06:40:00Z',
      waitDurationMinutes: 18,
      assignedResource: 'Treatment Cubicle 4',
      assignedBedId: 'BED-102',
      assignedBedNumber: 'ED-02',
      nextOperationalAction: 'IV infusion therapy administration and observation',
      operationalStatus: 'NORMAL',
      lastUpdated: '2026-09-10T06:40:00Z',
    },
  },
  {
    patient: {
      id: 'PAT-1006',
      fullName: 'Beatrice Vance',
      age: 74,
      gender: 'FEMALE',
      phone: '+1 (555) 789-0123',
      address: '90 Elderwood Way, Green Valley',
      emergencyContact: { name: 'Peter Vance', relationship: 'Son', phone: '+1 (555) 789-0124' },
      registrationDate: '2026-09-09T17:30:00Z',
      activeVisitId: 'VIS-2006',
    },
    visit: {
      id: 'VIS-2006',
      patientId: 'PAT-1006',
      patientName: 'Beatrice Vance',
      patientAge: 74,
      patientGender: 'FEMALE',
      departmentId: 'DEP-GENERAL',
      departmentName: 'General Internal Medicine',
      currentStage: 'DISCHARGE_READY',
      priority: 'STANDARD',
      arrivalTime: '2026-09-09T17:30:00Z',
      stageEnteredAt: '2026-09-10T06:50:00Z',
      waitDurationMinutes: 10,
      assignedBedId: 'BED-201',
      assignedBedNumber: 'GWA-01',
      nextOperationalAction: 'Ready for discharge processing and pharmacy checkout',
      operationalStatus: 'NORMAL',
      dischargeReadiness: {
        physicianSigned: true,
        medicationsReconciled: true,
        transportArranged: true,
        dischargeDeskNotified: true,
        departurePlanReady: true,
      },
      lastUpdated: '2026-09-10T06:50:00Z',
    },
  },
  {
    patient: {
      id: 'PAT-1007',
      fullName: 'Marcus Aurelius Sterling',
      age: 51,
      gender: 'MALE',
      phone: '+1 (555) 890-1234',
      address: '44 Colosseum Way, Central City',
      emergencyContact: { name: 'Faustina Sterling', relationship: 'Spouse', phone: '+1 (555) 890-1235' },
      registrationDate: '2026-09-10T06:00:00Z',
      activeVisitId: 'VIS-2007',
    },
    visit: {
      id: 'VIS-2007',
      patientId: 'PAT-1007',
      patientName: 'Marcus Aurelius Sterling',
      patientAge: 51,
      patientGender: 'MALE',
      departmentId: 'DEP-CARDIOLOGY',
      departmentName: 'Cardiology Center',
      currentStage: 'WAITING_FOR_BED',
      priority: 'CRITICAL',
      arrivalTime: '2026-09-10T06:00:00Z',
      stageEnteredAt: '2026-09-10T06:55:00Z',
      waitDurationMinutes: 38,
      assignedResource: 'Dr. Patricia Wright',
      nextOperationalAction: 'Waiting for telemetry bed placement in Cardiology/ICU',
      operationalStatus: 'ATTENTION',
      lastUpdated: '2026-09-10T06:55:00Z',
    },
  },
  {
    patient: {
      id: 'PAT-1008',
      fullName: 'Arthur Dent',
      age: 45,
      gender: 'MALE',
      phone: '+1 (555) 901-2345',
      address: '42 Cottington Lane, Cottington',
      emergencyContact: { name: 'Ford Prefect', relationship: 'Friend', phone: '+1 (555) 901-2346' },
      registrationDate: '2026-09-10T00:50:00Z',
      activeVisitId: 'VIS-2008',
    },
    visit: {
      id: 'VIS-2008',
      patientId: 'PAT-1008',
      patientName: 'Arthur Dent',
      patientAge: 45,
      patientGender: 'MALE',
      departmentId: 'DEP-EMERGENCY',
      departmentName: 'Emergency & Trauma',
      currentStage: 'ADMITTED',
      priority: 'CRITICAL',
      arrivalTime: '2026-09-10T00:50:00Z',
      stageEnteredAt: '2026-09-10T01:15:00Z',
      waitDurationMinutes: 15,
      assignedBedId: 'BED-401',
      assignedBedNumber: 'ICU-01',
      nextOperationalAction: 'Post-stabilization arterial line monitoring',
      operationalStatus: 'NORMAL',
      lastUpdated: '2026-09-10T01:15:00Z',
    },
  },
  {
    patient: {
      id: 'PAT-1009',
      fullName: 'Camila Rodriguez',
      age: 23,
      gender: 'FEMALE',
      phone: '+1 (555) 012-3456',
      address: '22 Ocean Ave, Seaport',
      emergencyContact: { name: 'Elena Rodriguez', relationship: 'Mother', phone: '+1 (555) 012-3457' },
      registrationDate: '2026-09-10T07:25:00Z',
      activeVisitId: 'VIS-2009',
    },
    visit: {
      id: 'VIS-2009',
      patientId: 'PAT-1009',
      patientName: 'Camila Rodriguez',
      patientAge: 23,
      patientGender: 'FEMALE',
      departmentId: 'DEP-LAB',
      departmentName: 'Pathology & Diagnostic Laboratory',
      currentStage: 'WAITING',
      priority: 'STANDARD',
      arrivalTime: '2026-09-10T07:25:00Z',
      stageEnteredAt: '2026-09-10T07:28:00Z',
      waitDurationMinutes: 12,
      assignedResource: 'Phlebotomy Station 2',
      nextOperationalAction: 'Awaiting blood draw intake queue',
      operationalStatus: 'NORMAL',
      lastUpdated: '2026-09-10T07:28:00Z',
    },
  },
  {
    patient: {
      id: 'PAT-1010',
      fullName: 'David K. O’Connor',
      age: 63,
      gender: 'MALE',
      phone: '+1 (555) 123-4567',
      address: '109 St. Patrick Circle, Dublin Hills',
      emergencyContact: { name: 'Fiona O’Connor', relationship: 'Daughter', phone: '+1 (555) 123-4568' },
      registrationDate: '2026-09-10T06:15:00Z',
      activeVisitId: 'VIS-2010',
    },
    visit: {
      id: 'VIS-2010',
      patientId: 'PAT-1010',
      patientName: 'David K. O’Connor',
      patientAge: 63,
      patientGender: 'MALE',
      departmentId: 'DEP-RADIOLOGY',
      departmentName: 'Diagnostic Radiology & Imaging',
      currentStage: 'DIAGNOSTICS',
      priority: 'URGENT',
      arrivalTime: '2026-09-10T06:15:00Z',
      stageEnteredAt: '2026-09-10T06:40:00Z',
      waitDurationMinutes: 52,
      assignedResource: 'MRI Unit 2',
      nextOperationalAction: 'Diagnostic MRI queue bottleneck delayed (42 min over SLA)',
      operationalStatus: 'DELAYED',
      lastUpdated: '2026-09-10T06:40:00Z',
    },
  },
  {
    patient: {
      id: 'PAT-1011',
      fullName: 'Robert Langdon',
      age: 48,
      gender: 'MALE',
      phone: '+1 (555) 234-5678',
      address: '5 Beacon Hill Rd, Cambridge',
      emergencyContact: { name: 'Vittoria Vetra', relationship: 'Colleague', phone: '+1 (555) 234-5679' },
      registrationDate: '2026-09-10T04:00:00Z',
      activeVisitId: 'VIS-2011',
    },
    visit: {
      id: 'VIS-2011',
      patientId: 'PAT-1011',
      patientName: 'Robert Langdon',
      patientAge: 48,
      patientGender: 'MALE',
      departmentId: 'DEP-EMERGENCY',
      departmentName: 'Emergency & Trauma',
      currentStage: 'ADMISSION_REQUESTED',
      priority: 'URGENT',
      arrivalTime: '2026-09-10T04:00:00Z',
      stageEnteredAt: '2026-09-10T06:45:00Z',
      waitDurationMinutes: 45,
      assignedResource: 'Dr. Elena Rostova',
      assignedBedId: 'BED-107',
      assignedBedNumber: 'ED-07',
      nextOperationalAction: 'Admission requested: awaiting bed coordinator confirmation for General Ward',
      operationalStatus: 'ATTENTION',
      lastUpdated: '2026-09-10T06:45:00Z',
    },
  },
  {
    patient: {
      id: 'PAT-1012',
      fullName: 'Nadia Petrov',
      age: 38,
      gender: 'FEMALE',
      phone: '+1 (555) 345-7890',
      address: '83 Aurora Blvd, Northport',
      emergencyContact: { name: 'Ivan Petrov', relationship: 'Spouse', phone: '+1 (555) 345-7891' },
      registrationDate: '2026-09-10T07:05:00Z',
      activeVisitId: 'VIS-2012',
    },
    visit: {
      id: 'VIS-2012',
      patientId: 'PAT-1012',
      patientName: 'Nadia Petrov',
      patientAge: 38,
      patientGender: 'FEMALE',
      departmentId: 'DEP-CARDIOLOGY',
      departmentName: 'Cardiology Center',
      currentStage: 'CONSULTATION',
      priority: 'URGENT',
      arrivalTime: '2026-09-10T07:05:00Z',
      stageEnteredAt: '2026-09-10T07:22:00Z',
      waitDurationMinutes: 17,
      assignedResource: 'Dr. Patricia Wright',
      nextOperationalAction: 'Cardiac stress test review and physician consultation',
      operationalStatus: 'NORMAL',
      lastUpdated: '2026-09-10T07:22:00Z',
    },
  },
  {
    patient: {
      id: 'PAT-1013',
      fullName: 'Hannah Scott',
      age: 31,
      gender: 'FEMALE',
      phone: '+1 (555) 456-8901',
      address: '201 Pine Meadows, Mill Valley',
      emergencyContact: { name: 'Gary Scott', relationship: 'Spouse', phone: '+1 (555) 456-8902' },
      registrationDate: '2026-09-10T07:32:00Z',
      activeVisitId: 'VIS-2013',
    },
    visit: {
      id: 'VIS-2013',
      patientId: 'PAT-1013',
      patientName: 'Hannah Scott',
      patientAge: 31,
      patientGender: 'FEMALE',
      departmentId: 'DEP-EMERGENCY',
      departmentName: 'Emergency & Trauma',
      currentStage: 'REGISTERED',
      priority: 'STANDARD',
      arrivalTime: '2026-09-10T07:32:00Z',
      stageEnteredAt: '2026-09-10T07:32:00Z',
      waitDurationMinutes: 6,
      nextOperationalAction: 'Awaiting triage intake nurse evaluation',
      operationalStatus: 'NORMAL',
      lastUpdated: '2026-09-10T07:32:00Z',
    },
  },
  {
    patient: {
      id: 'PAT-1014',
      fullName: 'Claire Bennet',
      age: 26,
      gender: 'FEMALE',
      phone: '+1 (555) 567-9012',
      address: '55 Pine Creek, Odessa',
      emergencyContact: { name: 'Noah Bennet', relationship: 'Father', phone: '+1 (555) 567-9013' },
      registrationDate: '2026-09-09T22:00:00Z',
      activeVisitId: 'VIS-2014',
    },
    visit: {
      id: 'VIS-2014',
      patientId: 'PAT-1014',
      patientName: 'Claire Bennet',
      patientAge: 26,
      patientGender: 'FEMALE',
      departmentId: 'DEP-GENERAL',
      departmentName: 'General Internal Medicine',
      currentStage: 'DISCHARGE_PREPARATION',
      priority: 'STANDARD',
      arrivalTime: '2026-09-09T22:00:00Z',
      stageEnteredAt: '2026-09-10T06:15:00Z',
      waitDurationMinutes: 20,
      assignedBedId: 'BED-203',
      assignedBedNumber: 'GWA-02',
      nextOperationalAction: 'Awaiting pharmacy discharge medication reconciliation sign-off',
      operationalStatus: 'NORMAL',
      dischargeReadiness: {
        physicianSigned: true,
        medicationsReconciled: false,
        transportArranged: true,
        dischargeDeskNotified: false,
        departurePlanReady: false,
      },
      lastUpdated: '2026-09-10T06:15:00Z',
    },
  },
  {
    patient: {
      id: 'PAT-1015',
      fullName: 'Victoria Price',
      age: 54,
      gender: 'FEMALE',
      phone: '+1 (555) 678-0123',
      address: '77 Royal Crescent, Bathgate',
      emergencyContact: { name: 'Thomas Price', relationship: 'Spouse', phone: '+1 (555) 678-0124' },
      registrationDate: '2026-09-10T02:00:00Z',
      activeVisitId: 'VIS-2015',
    },
    visit: {
      id: 'VIS-2015',
      patientId: 'PAT-1015',
      patientName: 'Victoria Price',
      patientAge: 54,
      patientGender: 'FEMALE',
      departmentId: 'DEP-SURGERY',
      departmentName: 'Surgical Operations & OT',
      currentStage: 'ADMITTED',
      priority: 'CRITICAL',
      arrivalTime: '2026-09-10T02:00:00Z',
      stageEnteredAt: '2026-09-10T03:00:00Z',
      waitDurationMinutes: 10,
      assignedBedId: 'BED-501',
      assignedBedNumber: 'PACU-01',
      nextOperationalAction: 'Post-anesthesia recovery observation protocol',
      operationalStatus: 'NORMAL',
      lastUpdated: '2026-09-10T03:00:00Z',
    },
  },
  {
    patient: {
      id: 'PAT-1016',
      fullName: 'Ethan Hunt',
      age: 49,
      gender: 'MALE',
      phone: '+1 (555) 789-1234',
      address: '100 Langley Drive, Arlington',
      emergencyContact: { name: 'Luther Stickell', relationship: 'Associate', phone: '+1 (555) 789-1235' },
      registrationDate: '2026-09-10T06:55:00Z',
      activeVisitId: 'VIS-2016',
    },
    visit: {
      id: 'VIS-2016',
      patientId: 'PAT-1016',
      patientName: 'Ethan Hunt',
      patientAge: 49,
      patientGender: 'MALE',
      departmentId: 'DEP-RADIOLOGY',
      departmentName: 'Diagnostic Radiology & Imaging',
      currentStage: 'WAITING',
      priority: 'URGENT',
      arrivalTime: '2026-09-10T06:55:00Z',
      stageEnteredAt: '2026-09-10T06:58:00Z',
      waitDurationMinutes: 38,
      assignedResource: 'X-Ray Bay 3',
      nextOperationalAction: 'Queued for musculoskeletal trauma radiography series',
      operationalStatus: 'DELAYED',
      lastUpdated: '2026-09-10T06:58:00Z',
    },
  },
  {
    patient: {
      id: 'PAT-1017',
      fullName: 'Maya Lin',
      age: 33,
      gender: 'FEMALE',
      phone: '+1 (555) 890-2345',
      address: '14 Studio Square, Midtown',
      emergencyContact: { name: 'Andrew Lin', relationship: 'Brother', phone: '+1 (555) 890-2346' },
      registrationDate: '2026-09-10T07:18:00Z',
      activeVisitId: 'VIS-2017',
    },
    visit: {
      id: 'VIS-2017',
      patientId: 'PAT-1017',
      patientName: 'Maya Lin',
      patientAge: 33,
      patientGender: 'FEMALE',
      departmentId: 'DEP-GENERAL',
      departmentName: 'General Internal Medicine',
      currentStage: 'WAITING',
      priority: 'STANDARD',
      arrivalTime: '2026-09-10T07:18:00Z',
      stageEnteredAt: '2026-09-10T07:20:00Z',
      waitDurationMinutes: 18,
      assignedResource: 'Waiting Room B',
      nextOperationalAction: 'Awaiting primary consultation intake',
      operationalStatus: 'NORMAL',
      lastUpdated: '2026-09-10T07:20:00Z',
    },
  },
  {
    patient: {
      id: 'PAT-1018',
      fullName: 'Samuel Jackson',
      age: 62,
      gender: 'MALE',
      phone: '+1 (555) 901-3456',
      address: '89 Pulpit St, Inglewood',
      emergencyContact: { name: 'Latanya Jackson', relationship: 'Spouse', phone: '+1 (555) 901-3457' },
      registrationDate: '2026-09-08T13:40:00Z',
      activeVisitId: 'VIS-2018',
    },
    visit: {
      id: 'VIS-2018',
      patientId: 'PAT-1018',
      patientName: 'Samuel Jackson',
      patientAge: 62,
      patientGender: 'MALE',
      departmentId: 'DEP-GENERAL',
      departmentName: 'General Internal Medicine',
      currentStage: 'ADMITTED',
      priority: 'STANDARD',
      arrivalTime: '2026-09-08T13:40:00Z',
      stageEnteredAt: '2026-09-08T14:15:00Z',
      waitDurationMinutes: 10,
      assignedBedId: 'BED-206',
      assignedBedNumber: 'GWA-06',
      nextOperationalAction: 'Inpatient recovery rounds scheduled for 09:00',
      operationalStatus: 'NORMAL',
      lastUpdated: '2026-09-08T14:15:00Z',
    },
  },
  {
    patient: {
      id: 'PAT-1019',
      fullName: 'Evelyn Salt',
      age: 41,
      gender: 'FEMALE',
      phone: '+1 (555) 012-4567',
      address: '9 Embassy Row, Northwest',
      emergencyContact: { name: 'Mike Salt', relationship: 'Spouse', phone: '+1 (555) 012-4568' },
      registrationDate: '2026-09-09T15:30:00Z',
      activeVisitId: 'VIS-2019',
    },
    visit: {
      id: 'VIS-2019',
      patientId: 'PAT-1019',
      patientName: 'Evelyn Salt',
      patientAge: 41,
      patientGender: 'FEMALE',
      departmentId: 'DEP-EMERGENCY',
      departmentName: 'Emergency & Trauma',
      currentStage: 'ADMITTED',
      priority: 'CRITICAL',
      arrivalTime: '2026-09-09T15:30:00Z',
      stageEnteredAt: '2026-09-09T16:00:00Z',
      waitDurationMinutes: 14,
      assignedBedId: 'BED-402',
      assignedBedNumber: 'ICU-02',
      nextOperationalAction: 'Intensive hemodialysis support in progress',
      operationalStatus: 'NORMAL',
      lastUpdated: '2026-09-09T16:00:00Z',
    },
  },
  {
    patient: {
      id: 'PAT-1020',
      fullName: 'Lucas Bennett',
      age: 19,
      gender: 'MALE',
      phone: '+1 (555) 123-5678',
      address: '404 University Village, Campus',
      emergencyContact: { name: 'Donna Bennett', relationship: 'Mother', phone: '+1 (555) 123-5679' },
      registrationDate: '2026-09-10T07:10:00Z',
      activeVisitId: 'VIS-2020',
    },
    visit: {
      id: 'VIS-2020',
      patientId: 'PAT-1020',
      patientName: 'Lucas Bennett',
      patientAge: 19,
      patientGender: 'MALE',
      departmentId: 'DEP-EMERGENCY',
      departmentName: 'Emergency & Trauma',
      currentStage: 'TREATMENT',
      priority: 'URGENT',
      arrivalTime: '2026-09-10T07:10:00Z',
      stageEnteredAt: '2026-09-10T07:25:00Z',
      waitDurationMinutes: 15,
      assignedResource: 'Laceration Repair Rm 2',
      nextOperationalAction: 'Wound closure and tetanus prophylaxis',
      operationalStatus: 'NORMAL',
      lastUpdated: '2026-09-10T07:25:00Z',
    },
  },
  {
    patient: {
      id: 'PAT-1021',
      fullName: 'Zoe Saldana',
      age: 46,
      gender: 'FEMALE',
      phone: '+1 (555) 234-6789',
      address: '12 Starfleet Way, Pacific Palisades',
      emergencyContact: { name: 'Marco Perego', relationship: 'Spouse', phone: '+1 (555) 234-6790' },
      registrationDate: '2026-09-10T07:35:00Z',
      activeVisitId: 'VIS-2021',
    },
    visit: {
      id: 'VIS-2021',
      patientId: 'PAT-1021',
      patientName: 'Zoe Saldana',
      patientAge: 46,
      patientGender: 'FEMALE',
      departmentId: 'DEP-CARDIOLOGY',
      departmentName: 'Cardiology Center',
      currentStage: 'REGISTERED',
      priority: 'URGENT',
      arrivalTime: '2026-09-10T07:35:00Z',
      stageEnteredAt: '2026-09-10T07:35:00Z',
      waitDurationMinutes: 3,
      nextOperationalAction: 'Initial ECG order pending placement',
      operationalStatus: 'NORMAL',
      lastUpdated: '2026-09-10T07:35:00Z',
    },
  },
  {
    patient: {
      id: 'PAT-1022',
      fullName: 'Grace Hopper',
      age: 85,
      gender: 'FEMALE',
      phone: '+1 (555) 345-8901',
      address: '1906 Compiler Way, Annapolis',
      emergencyContact: { name: 'Margaret Hamilton', relationship: 'Niece', phone: '+1 (555) 345-8902' },
      registrationDate: '2026-09-09T10:15:00Z',
      activeVisitId: 'VIS-2022',
    },
    visit: {
      id: 'VIS-2022',
      patientId: 'PAT-1022',
      patientName: 'Grace Hopper',
      patientAge: 85,
      patientGender: 'FEMALE',
      departmentId: 'DEP-GENERAL',
      departmentName: 'General Internal Medicine',
      currentStage: 'ADMITTED',
      priority: 'STANDARD',
      arrivalTime: '2026-09-09T10:15:00Z',
      stageEnteredAt: '2026-09-09T11:00:00Z',
      waitDurationMinutes: 12,
      assignedBedId: 'BED-209',
      assignedBedNumber: 'GWA-09',
      nextOperationalAction: 'Physical therapy mobility assessment at 10:00',
      operationalStatus: 'NORMAL',
      lastUpdated: '2026-09-09T11:00:00Z',
    },
  },
  {
    patient: {
      id: 'PAT-1023',
      fullName: 'Simon Pegg',
      age: 52,
      gender: 'MALE',
      phone: '+1 (555) 456-9012',
      address: '28 Cornetto Lane, Londonderry',
      emergencyContact: { name: 'Maureen Pegg', relationship: 'Spouse', phone: '+1 (555) 456-9013' },
      registrationDate: '2026-09-10T05:00:00Z',
      activeVisitId: 'VIS-2023',
    },
    visit: {
      id: 'VIS-2023',
      patientId: 'PAT-1023',
      patientName: 'Simon Pegg',
      patientAge: 52,
      patientGender: 'MALE',
      departmentId: 'DEP-GENERAL',
      departmentName: 'General Internal Medicine',
      currentStage: 'DISCHARGED',
      priority: 'LOW',
      arrivalTime: '2026-09-10T05:00:00Z',
      stageEnteredAt: '2026-09-10T07:15:00Z',
      waitDurationMinutes: 0,
      nextOperationalAction: 'Discharge complete. Record archived.',
      operationalStatus: 'NORMAL',
      dischargedAt: '2026-09-10T07:15:00Z',
      lastUpdated: '2026-09-10T07:15:00Z',
    },
  },
  {
    patient: {
      id: 'PAT-1024',
      fullName: 'Benjamin Sisko',
      age: 49,
      gender: 'MALE',
      phone: '+1 (555) 567-0123',
      address: '9 Deep Space Promenade, Bajor',
      emergencyContact: { name: 'Jake Sisko', relationship: 'Son', phone: '+1 (555) 567-0124' },
      registrationDate: '2026-09-10T06:20:00Z',
      activeVisitId: 'VIS-2024',
    },
    visit: {
      id: 'VIS-2024',
      patientId: 'PAT-1024',
      patientName: 'Benjamin Sisko',
      patientAge: 49,
      patientGender: 'MALE',
      departmentId: 'DEP-SURGERY',
      departmentName: 'Surgical Operations & OT',
      currentStage: 'WAITING',
      priority: 'URGENT',
      arrivalTime: '2026-09-10T06:20:00Z',
      stageEnteredAt: '2026-09-10T06:40:00Z',
      waitDurationMinutes: 58,
      assignedResource: 'Pre-Op Holding 3',
      nextOperationalAction: 'Awaiting pre-operative anesthesia clearance',
      operationalStatus: 'ATTENTION',
      lastUpdated: '2026-09-10T06:40:00Z',
    },
  },
];

// Sample historical flow events for Jonathan Miller (PAT-1001) to power the Patient Flow Passport immediately!
const INITIAL_FLOW_EVENTS: PatientFlowEvent[] = [
  {
    id: 'EVT-101',
    patientId: 'PAT-1001',
    visitId: 'VIS-2001',
    stage: 'REGISTERED',
    status: 'COMPLETED',
    departmentId: 'DEP-EMERGENCY',
    departmentName: 'Emergency & Trauma',
    startedAt: '2026-09-10T07:15:00Z',
    completedAt: '2026-09-10T07:20:00Z',
    durationMinutes: 5,
    resourceId: 'Registration Desk 2',
    performedBy: 'Staff Sarah Jenkins',
    notes: 'Initial check-in verified. Insurance pre-authorized.',
  },
  {
    id: 'EVT-102',
    patientId: 'PAT-1001',
    visitId: 'VIS-2001',
    stage: 'WAITING',
    status: 'IN_PROGRESS',
    departmentId: 'DEP-EMERGENCY',
    departmentName: 'Emergency & Trauma',
    startedAt: '2026-09-10T07:20:00Z',
    completedAt: null,
    durationMinutes: 28,
    resourceId: 'ED Waiting Area A',
    performedBy: 'Triage Nurse 3',
    notes: 'Vitals logged: BP 142/90, HR 88, SpO2 98%. Priority assigned: URGENT.',
  },
  // Flow events for Eleanor Davis (PAT-1002)
  {
    id: 'EVT-201',
    patientId: 'PAT-1002',
    visitId: 'VIS-2002',
    stage: 'REGISTERED',
    status: 'COMPLETED',
    departmentId: 'DEP-EMERGENCY',
    departmentName: 'Emergency & Trauma',
    startedAt: '2026-09-10T05:10:00Z',
    completedAt: '2026-09-10T05:13:00Z',
    durationMinutes: 3,
    resourceId: 'Ambulance Bay 1',
    performedBy: 'Paramedic Intake',
  },
  {
    id: 'EVT-202',
    patientId: 'PAT-1002',
    visitId: 'VIS-2002',
    stage: 'WAITING',
    status: 'COMPLETED',
    departmentId: 'DEP-EMERGENCY',
    departmentName: 'Emergency & Trauma',
    startedAt: '2026-09-10T05:13:00Z',
    completedAt: '2026-09-10T05:18:00Z',
    durationMinutes: 5,
    resourceId: 'Rapid Triage',
    performedBy: 'Dr. Elena Rostova',
  },
  {
    id: 'EVT-203',
    patientId: 'PAT-1002',
    visitId: 'VIS-2002',
    stage: 'CONSULTATION',
    status: 'COMPLETED',
    departmentId: 'DEP-EMERGENCY',
    departmentName: 'Emergency & Trauma',
    startedAt: '2026-09-10T05:18:00Z',
    completedAt: '2026-09-10T05:25:00Z',
    durationMinutes: 7,
    resourceId: 'Resuscitation Rm 1',
    performedBy: 'Dr. Elena Rostova',
  },
  {
    id: 'EVT-204',
    patientId: 'PAT-1002',
    visitId: 'VIS-2002',
    stage: 'ADMISSION_REQUESTED',
    status: 'COMPLETED',
    departmentId: 'DEP-EMERGENCY',
    departmentName: 'Emergency & Trauma',
    startedAt: '2026-09-10T05:25:00Z',
    completedAt: '2026-09-10T05:30:00Z',
    durationMinutes: 5,
    resourceId: 'ED Bed Placement Desk',
    performedBy: 'Marcus Chen',
  },
  {
    id: 'EVT-205',
    patientId: 'PAT-1002',
    visitId: 'VIS-2002',
    stage: 'ADMITTED',
    status: 'IN_PROGRESS',
    departmentId: 'DEP-EMERGENCY',
    departmentName: 'Emergency & Trauma',
    startedAt: '2026-09-10T05:30:00Z',
    completedAt: null,
    resourceId: 'Bed ED-01',
    performedBy: 'Marcus Chen',
    notes: 'Admitted to ED Observation Bed 01.',
  },
  // Flow events for Beatrice Vance (PAT-1006)
  {
    id: 'EVT-601',
    patientId: 'PAT-1006',
    visitId: 'VIS-2006',
    stage: 'REGISTERED',
    status: 'COMPLETED',
    departmentId: 'DEP-GENERAL',
    departmentName: 'General Internal Medicine',
    startedAt: '2026-09-09T17:30:00Z',
    completedAt: '2026-09-09T17:38:00Z',
    durationMinutes: 8,
    performedBy: 'Intake Staff',
  },
  {
    id: 'EVT-602',
    patientId: 'PAT-1006',
    visitId: 'VIS-2006',
    stage: 'CONSULTATION',
    status: 'COMPLETED',
    departmentId: 'DEP-GENERAL',
    departmentName: 'General Internal Medicine',
    startedAt: '2026-09-09T17:45:00Z',
    completedAt: '2026-09-09T18:15:00Z',
    durationMinutes: 30,
    performedBy: 'Dr. Michael Sterling',
  },
  {
    id: 'EVT-603',
    patientId: 'PAT-1006',
    visitId: 'VIS-2006',
    stage: 'ADMITTED',
    status: 'COMPLETED',
    departmentId: 'DEP-GENERAL',
    departmentName: 'General Internal Medicine',
    startedAt: '2026-09-09T18:15:00Z',
    completedAt: '2026-09-10T06:50:00Z',
    durationMinutes: 755,
    resourceId: 'Bed GWA-01',
    performedBy: 'Marcus Chen',
  },
  {
    id: 'EVT-604',
    patientId: 'PAT-1006',
    visitId: 'VIS-2006',
    stage: 'DISCHARGE_READY',
    status: 'IN_PROGRESS',
    departmentId: 'DEP-GENERAL',
    departmentName: 'General Internal Medicine',
    startedAt: '2026-09-10T06:50:00Z',
    completedAt: null,
    resourceId: 'Discharge Lounge Desk',
    performedBy: 'Sarah Jenkins',
    notes: 'All clinical and pharmacy clearances achieved.',
  },
];

// Initial 22 Diagnostics
const INITIAL_DIAGNOSTICS: DiagnosticRecord[] = [
  {
    id: 'DX-5001',
    patientId: 'PAT-1003',
    patientName: 'Sophia Ramirez',
    visitId: 'VIS-2003',
    departmentId: 'DEP-RADIOLOGY',
    departmentName: 'Diagnostic Radiology & Imaging',
    diagnosticType: 'CT_SCAN',
    testName: 'Abdomen & Pelvis with Contrast',
    status: 'IN_PROGRESS',
    requestedAt: '2026-09-10T06:35:00Z',
    startedAt: '2026-09-10T07:10:00Z',
    priority: 'URGENT',
    labRoom: 'CT Suite 1',
  },
  {
    id: 'DX-5002',
    patientId: 'PAT-1010',
    patientName: 'David K. O’Connor',
    visitId: 'VIS-2010',
    departmentId: 'DEP-RADIOLOGY',
    departmentName: 'Diagnostic Radiology & Imaging',
    diagnosticType: 'MRI',
    testName: 'Lumbar Spine MRI non-contrast',
    status: 'QUEUED',
    requestedAt: '2026-09-10T06:20:00Z',
    priority: 'URGENT',
    labRoom: 'MRI Room B',
  },
  {
    id: 'DX-5003',
    patientId: 'PAT-1016',
    patientName: 'Ethan Hunt',
    visitId: 'VIS-2016',
    departmentId: 'DEP-RADIOLOGY',
    departmentName: 'Diagnostic Radiology & Imaging',
    diagnosticType: 'X_RAY',
    testName: 'Right Tibia/Fibula 3-View X-Ray',
    status: 'QUEUED',
    requestedAt: '2026-09-10T06:58:00Z',
    priority: 'URGENT',
    labRoom: 'X-Ray Bay 3',
  },
  {
    id: 'DX-5004',
    patientId: 'PAT-1009',
    patientName: 'Camila Rodriguez',
    visitId: 'VIS-2009',
    departmentId: 'DEP-LAB',
    departmentName: 'Pathology & Diagnostic Laboratory',
    diagnosticType: 'CBC_BLOOD',
    testName: 'Complete Blood Count with Differential',
    status: 'IN_PROGRESS',
    requestedAt: '2026-09-10T07:26:00Z',
    startedAt: '2026-09-10T07:30:00Z',
    priority: 'STANDARD',
    labRoom: 'Hematology Bench 2',
  },
  {
    id: 'DX-5005',
    patientId: 'PAT-1007',
    patientName: 'Marcus Aurelius Sterling',
    visitId: 'VIS-2007',
    departmentId: 'DEP-CARDIOLOGY',
    departmentName: 'Cardiology Center',
    diagnosticType: 'ECG',
    testName: '12-Lead Electrocardiogram',
    status: 'COMPLETED',
    requestedAt: '2026-09-10T06:05:00Z',
    startedAt: '2026-09-10T06:10:00Z',
    completedAt: '2026-09-10T06:18:00Z',
    turnaroundTimeMinutes: 13,
    priority: 'CRITICAL',
    labRoom: 'ECG Bay 1',
  },
  {
    id: 'DX-5006',
    patientId: 'PAT-1005',
    patientName: 'Julian Thorne',
    visitId: 'VIS-2005',
    departmentId: 'DEP-LAB',
    departmentName: 'Pathology & Diagnostic Laboratory',
    diagnosticType: 'METABOLIC_PANEL',
    testName: 'Comprehensive Metabolic Panel (CMP)',
    status: 'COMPLETED',
    requestedAt: '2026-09-10T05:55:00Z',
    startedAt: '2026-09-10T06:05:00Z',
    completedAt: '2026-09-10T06:35:00Z',
    turnaroundTimeMinutes: 40,
    priority: 'URGENT',
    labRoom: 'Biochemistry Analyzer 4',
  },
  {
    id: 'DX-5007',
    patientId: 'PAT-1002',
    patientName: 'Eleanor Davis',
    visitId: 'VIS-2002',
    departmentId: 'DEP-CARDIOLOGY',
    departmentName: 'Cardiology Center',
    diagnosticType: 'ECG',
    testName: 'Serial 12-Lead Troponin Correlation',
    status: 'COMPLETED',
    requestedAt: '2026-09-10T05:15:00Z',
    startedAt: '2026-09-10T05:18:00Z',
    completedAt: '2026-09-10T05:28:00Z',
    turnaroundTimeMinutes: 13,
    priority: 'CRITICAL',
    labRoom: 'Emergency Bay 1',
  },
  {
    id: 'DX-5008',
    patientId: 'PAT-1021',
    patientName: 'Zoe Saldana',
    visitId: 'VIS-2021',
    departmentId: 'DEP-CARDIOLOGY',
    departmentName: 'Cardiology Center',
    diagnosticType: 'ECG',
    testName: 'High-Resolution Rhythm Strip',
    status: 'REQUESTED',
    requestedAt: '2026-09-10T07:36:00Z',
    priority: 'URGENT',
  },
];

// Initial Operational Notifications
const INITIAL_NOTIFICATIONS: OperationalNotification[] = [
  {
    id: 'NOTIF-1',
    title: 'Radiology Queue Exceeded SLA Threshold',
    message: 'Diagnostic Radiology queue reached 11 patients (threshold: 8). Average wait time is now 44 minutes.',
    type: 'BOTTLENECK',
    severity: 'ALERT',
    timestamp: '2026-09-10T07:15:00Z',
    isRead: false,
    relatedDepartmentId: 'DEP-RADIOLOGY',
  },
  {
    id: 'NOTIF-2',
    title: 'Bed GWA-04 Sanitized & Available',
    message: 'General Ward A Room 202-B terminal cleaning completed. Ready for immediate patient placement.',
    type: 'BED_AVAILABLE',
    severity: 'INFO',
    timestamp: '2026-09-10T07:20:00Z',
    isRead: false,
    relatedBedId: 'BED-204',
  },
  {
    id: 'NOTIF-3',
    title: 'Critical Bed Requirement: PAT-1007',
    message: 'Patient Marcus Aurelius Sterling in Cardiology has waited 38 min for telemetry bed.',
    type: 'BED_REQUIRED',
    severity: 'WARNING',
    timestamp: '2026-09-10T07:10:00Z',
    isRead: false,
    relatedPatientId: 'PAT-1007',
  },
  {
    id: 'NOTIF-4',
    title: 'Discharge Ready: Beatrice Vance (PAT-1006)',
    message: 'All clinical clearances signed. Patient Beatrice Vance is ready for discharge desk handoff.',
    type: 'DISCHARGE_READY',
    severity: 'INFO',
    timestamp: '2026-09-10T06:55:00Z',
    isRead: true,
    relatedPatientId: 'PAT-1006',
  },
];

// Initial Audit Logs
const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'AUD-901',
    timestamp: '2026-09-10T07:20:00Z',
    userId: 'USR-BED',
    userName: 'Marcus Chen',
    userRole: 'BED_MANAGER',
    action: 'Bed Status Updated',
    entity: 'BED',
    entityId: 'BED-204',
    previousValue: 'CLEANING',
    newValue: 'AVAILABLE',
    details: 'Terminal cleaning check complete; released into active pool.',
  },
  {
    id: 'AUD-902',
    timestamp: '2026-09-10T07:15:00Z',
    userId: 'USR-OPS',
    userName: 'Sarah Jenkins, RN',
    userRole: 'OPERATIONS_STAFF',
    action: 'Patient Stage Advanced',
    entity: 'VISIT',
    entityId: 'VIS-2023',
    previousValue: 'DISCHARGE_READY',
    newValue: 'DISCHARGED',
    details: 'Patient Simon Pegg departure formalities completed.',
  },
  {
    id: 'AUD-903',
    timestamp: '2026-09-10T07:10:00Z',
    userId: 'USR-CLINIC',
    userName: 'Dr. Elena Rostova',
    userRole: 'CLINICAL_STAFF',
    action: 'Diagnostic Test Started',
    entity: 'DIAGNOSTIC',
    entityId: 'DX-5001',
    previousValue: 'QUEUED',
    newValue: 'IN_PROGRESS',
    details: 'CT Abdomen scan initiated in CT Suite 1.',
  },
  {
    id: 'AUD-904',
    timestamp: '2026-09-10T06:50:00Z',
    userId: 'USR-CLINIC',
    userName: 'Dr. Michael Sterling',
    userRole: 'CLINICAL_STAFF',
    action: 'Discharge Readiness Approved',
    entity: 'VISIT',
    entityId: 'VIS-2006',
    previousValue: 'ADMITTED',
    newValue: 'DISCHARGE_READY',
    details: 'Physician signed final discharge authorization.',
  },
];

// Initial Bottlenecks
const INITIAL_BOTTLENECKS: BottleneckAlert[] = [
  {
    id: 'BN-101',
    departmentId: 'DEP-RADIOLOGY',
    departmentName: 'Diagnostic Radiology & Imaging',
    severity: 'SEVERE',
    queueLength: 11,
    thresholdQueue: 8,
    avgWaitMinutes: 44,
    thresholdWaitMinutes: 30,
    affectedPatientsCount: 11,
    detectedAt: '2026-09-10T07:00:00Z',
    impactSummary: 'Radiology delay causes downstream consultation freezes and increases ED boarding time by an estimated 35%.',
    recoveryOptions: [
      {
        id: 'REC-OPT-A',
        optionLabel: 'Option A',
        title: 'Reassign Available Ultrasound Technician to CT Prep',
        description: 'Reposition Tech Jennifer Hayes from idle Ultrasound Bay 2 to CT Suite 1 intake protocol to accelerate throughput.',
        actionType: 'REASSIGN_STAFF',
        projectedReductionMinutes: 18,
        requiresApproval: true,
        status: 'PROPOSED',
      },
      {
        id: 'REC-OPT-B',
        optionLabel: 'Option B',
        title: 'Reroute Stable Outpatient Scans to Auxiliary Annex Suite',
        description: 'Transfer 4 non-urgent outpatient contrast exams to the Ambulatory Care Wing scanner.',
        actionType: 'REROUTE_WORKLOAD',
        projectedReductionMinutes: 24,
        requiresApproval: true,
        status: 'PROPOSED',
      },
      {
        id: 'REC-OPT-C',
        optionLabel: 'Option C',
        title: 'Authorize Overtime Float Shift for Rapid Reading Radiologist',
        description: 'Bring Dr. K. Henderson online remotely for immediate concurrent study interpretation.',
        actionType: 'INCREASE_CAPACITY',
        projectedReductionMinutes: 30,
        requiresApproval: true,
        status: 'PROPOSED',
      },
    ],
  },
];

// Storage Keys
const STORAGE_KEYS = {
  CURRENT_USER: 'nexora_current_user',
  PATIENTS: 'nexora_patients',
  VISITS: 'nexora_visits',
  FLOW_EVENTS: 'nexora_flow_events',
  DEPARTMENTS: 'nexora_departments',
  BEDS: 'nexora_beds',
  DIAGNOSTICS: 'nexora_diagnostics',
  NOTIFICATIONS: 'nexora_notifications',
  AUDIT_LOGS: 'nexora_audit_logs',
  BOTTLENECKS: 'nexora_bottlenecks',
};

// Listeners registry for reactive real-time updates
type StorageListener = () => void;
const listeners: Set<StorageListener> = new Set();

export function subscribeToStore(listener: StorageListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners(): void {
  listeners.forEach((l) => {
    try {
      l();
    } catch (e) {
      console.error('Listener error', e);
    }
  });
}

// Storage initialization & helpers
export const storageService = {
  initialize(): void {
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER)) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(DEMO_USERS[0]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.DEPARTMENTS)) {
      localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(INITIAL_DEPARTMENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.BEDS)) {
      localStorage.setItem(STORAGE_KEYS.BEDS, JSON.stringify(INITIAL_BEDS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PATIENTS)) {
      const patients = INITIAL_PATIENTS.map((p) => p.patient);
      const visits = INITIAL_PATIENTS.map((p) => p.visit);
      localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
      localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));
    }
    if (!localStorage.getItem(STORAGE_KEYS.FLOW_EVENTS)) {
      localStorage.setItem(STORAGE_KEYS.FLOW_EVENTS, JSON.stringify(INITIAL_FLOW_EVENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.DIAGNOSTICS)) {
      localStorage.setItem(STORAGE_KEYS.DIAGNOSTICS, JSON.stringify(INITIAL_DIAGNOSTICS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.BOTTLENECKS)) {
      localStorage.setItem(STORAGE_KEYS.BOTTLENECKS, JSON.stringify(INITIAL_BOTTLENECKS));
    }
  },

  resetToDefault(): void {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    this.initialize();
    notifyListeners();
  },

  // Auth User
  getCurrentUser(): User {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) return DEMO_USERS[0];
    try {
      return JSON.parse(raw);
    } catch {
      return DEMO_USERS[0];
    }
  },

  setCurrentUser(user: User): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    notifyListeners();
  },

  // Patients & Visits
  getPatients(): Patient[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PATIENTS);
    return raw ? JSON.parse(raw) : [];
  },

  getVisits(): Visit[] {
    const raw = localStorage.getItem(STORAGE_KEYS.VISITS);
    return raw ? JSON.parse(raw) : [];
  },

  getPatientById(id: string): { patient: Patient; visit?: Visit; events: PatientFlowEvent[]; diagnostics: DiagnosticRecord[] } | null {
    const patients = this.getPatients();
    const patient = patients.find((p) => p.id === id);
    if (!patient) return null;

    const visits = this.getVisits();
    const visit = visits.find((v) => v.id === patient.activeVisitId || v.patientId === patient.id);
    const flowEvents = this.getFlowEvents().filter((e) => e.patientId === patient.id);
    const diagnostics = this.getDiagnostics().filter((d) => d.patientId === patient.id);

    return { patient, visit, events: flowEvents, diagnostics };
  },

  syncRegisteredPatient(patient: Patient, visit: Visit): void {
    const patients = this.getPatients();
    const visits = this.getVisits();
    const existingPatientIdx = patients.findIndex((p) => p.id === patient.id);
    if (existingPatientIdx >= 0) {
      patients[existingPatientIdx] = patient;
    } else {
      patients.unshift(patient);
    }
    const existingVisitIdx = visits.findIndex((v) => v.id === visit.id);
    if (existingVisitIdx >= 0) {
      visits[existingVisitIdx] = visit;
    } else {
      visits.unshift(visit);
    }
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
    localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));

    this.addFlowEvent({
      patientId: patient.id,
      visitId: visit.id,
      stage: 'REGISTERED',
      status: 'COMPLETED',
      departmentId: visit.departmentId,
      departmentName: visit.departmentName,
      startedAt: patient.registrationDate,
      completedAt: patient.registrationDate,
      durationMinutes: 1,
      performedBy: this.getCurrentUser().name,
      notes: visit.notes || 'New patient registered in hospital flow.',
    });

    notifyListeners();
  },

  registerPatient(data: {
    fullName: string;
    age: number;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    phone: string;
    address: string;
    emergencyContact: { name: string; relationship: string; phone: string };
    departmentId: string;
    priority: OperationalPriority;
    initialNotes?: string;
  }): { patient: Patient; visit: Visit } {
    const patients = this.getPatients();
    const visits = this.getVisits();
    const departments = this.getDepartments();
    const dept = departments.find((d) => d.id === data.departmentId) || departments[0];

    const newPatientId = `PAT-${1000 + patients.length + 1}`;
    const newVisitId = `VIS-${2000 + visits.length + 1}`;
    const now = new Date().toISOString();

    const newPatient: Patient = {
      id: newPatientId,
      fullName: data.fullName,
      age: data.age,
      gender: data.gender,
      phone: data.phone,
      address: data.address,
      emergencyContact: data.emergencyContact,
      registrationDate: now,
      activeVisitId: newVisitId,
    };

    const newVisit: Visit = {
      id: newVisitId,
      patientId: newPatientId,
      patientName: data.fullName,
      patientAge: data.age,
      patientGender: data.gender,
      departmentId: dept.id,
      departmentName: dept.name,
      currentStage: 'REGISTERED',
      priority: data.priority,
      arrivalTime: now,
      stageEnteredAt: now,
      waitDurationMinutes: 1,
      assignedResource: 'Triage Queue',
      nextOperationalAction: 'Awaiting triage nurse physical review',
      operationalStatus: 'NORMAL',
      lastUpdated: now,
    };

    patients.unshift(newPatient);
    visits.unshift(newVisit);

    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
    localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));

    // Create registration flow event
    this.addFlowEvent({
      patientId: newPatientId,
      visitId: newVisitId,
      stage: 'REGISTERED',
      status: 'COMPLETED',
      departmentId: dept.id,
      departmentName: dept.name,
      startedAt: now,
      completedAt: now,
      durationMinutes: 1,
      performedBy: this.getCurrentUser().name,
      notes: data.initialNotes || 'New patient registered in hospital flow.',
    });

    // Create Audit Log
    this.logAudit({
      action: 'Patient Registered',
      entity: 'PATIENT',
      entityId: newPatientId,
      previousValue: 'NONE',
      newValue: 'REGISTERED',
      details: `Patient ${data.fullName} registered for ${dept.name} with priority ${data.priority}.`,
    });

    notifyListeners();
    return { patient: newPatient, visit: newVisit };
  },

  advancePatientStage(
    visitId: string,
    nextStage: PatientStatus,
    options?: {
      assignedResource?: string;
      notes?: string;
      assignedBedId?: string;
    }
  ): Visit | null {
    const visits = this.getVisits();
    const index = visits.findIndex((v) => v.id === visitId);
    if (index === -1) return null;

    const visit = visits[index];
    const prevStage = visit.currentStage;
    const now = new Date().toISOString();

    // Complete previous active flow event
    const events = this.getFlowEvents();
    const activeEvent = events.find(
      (e) => e.visitId === visitId && e.stage === prevStage && e.status === 'IN_PROGRESS'
    );
    if (activeEvent) {
      activeEvent.status = 'COMPLETED';
      activeEvent.completedAt = now;
      const started = new Date(activeEvent.startedAt).getTime();
      activeEvent.durationMinutes = Math.max(1, Math.round((new Date(now).getTime() - started) / 60000));
    }

    // Determine default next action based on stage
    let nextAction = 'Operational status active';
    switch (nextStage) {
      case 'REGISTERED':
        nextAction = 'Awaiting triage nurse review';
        break;
      case 'WAITING':
        nextAction = 'Awaiting consultation with attending staff';
        break;
      case 'CONSULTATION':
        nextAction = 'Physician evaluation in progress';
        break;
      case 'DIAGNOSTICS':
        nextAction = 'Diagnostic imaging or laboratory turnaround pending';
        break;
      case 'TREATMENT':
        nextAction = 'Therapeutic procedure / medication administration in progress';
        break;
      case 'ADMISSION_REQUESTED':
        nextAction = 'Admission requested: awaiting bed manager confirmation';
        break;
      case 'WAITING_FOR_BED':
        nextAction = 'Waiting for assigned ward bed to become available/sanitized';
        break;
      case 'ADMITTED':
        nextAction = 'Inpatient observation and clinical routine active';
        break;
      case 'DISCHARGE_PREPARATION':
        nextAction = 'Reconciling discharge medications and physician sign-off';
        break;
      case 'DISCHARGE_READY':
        nextAction = 'Ready for discharge lounge check-out';
        break;
      case 'DISCHARGED':
        nextAction = 'Patient discharged. Visit finalized.';
        break;
      default:
        nextAction = 'Standard operational observation';
    }

    visit.currentStage = nextStage;
    visit.stageEnteredAt = now;
    visit.waitDurationMinutes = 0;
    visit.nextOperationalAction = nextAction;
    visit.lastUpdated = now;

    if (options?.assignedResource) {
      visit.assignedResource = options.assignedResource;
    }
    if (options?.assignedBedId) {
      visit.assignedBedId = options.assignedBedId;
    }
    if (nextStage === 'DISCHARGED') {
      visit.dischargedAt = now;
      // If patient had bed, release it to cleaning
      if (visit.assignedBedId) {
        this.updateBedStatus(visit.assignedBedId, 'CLEANING', { notes: 'Discharged patient terminal cleaning' });
      }
    }

    visits[index] = visit;
    localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));
    localStorage.setItem(STORAGE_KEYS.FLOW_EVENTS, JSON.stringify(events));

    // Create new flow event for next stage
    this.addFlowEvent({
      patientId: visit.patientId,
      visitId: visit.id,
      stage: nextStage,
      status: nextStage === 'DISCHARGED' ? 'COMPLETED' : 'IN_PROGRESS',
      departmentId: visit.departmentId,
      departmentName: visit.departmentName,
      startedAt: now,
      completedAt: nextStage === 'DISCHARGED' ? now : null,
      durationMinutes: nextStage === 'DISCHARGED' ? 1 : undefined,
      resourceId: options?.assignedResource || visit.assignedResource,
      performedBy: this.getCurrentUser().name,
      notes: options?.notes || `Stage transitioned from ${prevStage} to ${nextStage}`,
    });

    // Log Audit
    this.logAudit({
      action: 'Patient Stage Advanced',
      entity: 'VISIT',
      entityId: visit.id,
      previousValue: prevStage,
      newValue: nextStage,
      details: `Patient ${visit.patientName} moved to ${nextStage}. Assigned: ${visit.assignedResource || 'N/A'}.`,
    });

    // Create Notification if notable stage
    if (nextStage === 'DISCHARGE_READY') {
      this.addNotification({
        title: `Discharge Ready: ${visit.patientName}`,
        message: `${visit.patientName} has completed all clinical criteria and is ready for departure processing.`,
        type: 'DISCHARGE_READY',
        severity: 'INFO',
        relatedPatientId: visit.patientId,
      });
    } else if (nextStage === 'ADMISSION_REQUESTED') {
      this.addNotification({
        title: `Admission Requested: ${visit.patientName}`,
        message: `${visit.patientName} in ${visit.departmentName} requires bed assignment.`,
        type: 'BED_REQUIRED',
        severity: 'WARNING',
        relatedPatientId: visit.patientId,
      });
    }

    notifyListeners();
    return visit;
  },

  // Flow Events
  getFlowEvents(): PatientFlowEvent[] {
    const raw = localStorage.getItem(STORAGE_KEYS.FLOW_EVENTS);
    return raw ? JSON.parse(raw) : [];
  },

  addFlowEvent(event: Omit<PatientFlowEvent, 'id'>): PatientFlowEvent {
    const events = this.getFlowEvents();
    const newEvent: PatientFlowEvent = {
      ...event,
      id: `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    events.push(newEvent);
    localStorage.setItem(STORAGE_KEYS.FLOW_EVENTS, JSON.stringify(events));
    return newEvent;
  },

  // Departments
  getDepartments(): Department[] {
    const raw = localStorage.getItem(STORAGE_KEYS.DEPARTMENTS);
    return raw ? JSON.parse(raw) : [];
  },

  // Beds
  getBeds(): Bed[] {
    const raw = localStorage.getItem(STORAGE_KEYS.BEDS);
    return raw ? JSON.parse(raw) : [];
  },

  updateBedStatus(bedId: string, status: Bed['status'], options?: { patientId?: string; patientName?: string; visitId?: string; notes?: string }): Bed | null {
    const beds = this.getBeds();
    const index = beds.findIndex((b) => b.id === bedId);
    if (index === -1) return null;

    const bed = beds[index];
    const prevStatus = bed.status;
    bed.status = status;

    if (status === 'OCCUPIED') {
      bed.currentPatientId = options?.patientId;
      bed.currentPatientName = options?.patientName;
      bed.currentVisitId = options?.visitId;
      bed.admittedAt = new Date().toISOString();
    } else if (status === 'AVAILABLE') {
      bed.currentPatientId = undefined;
      bed.currentPatientName = undefined;
      bed.currentVisitId = undefined;
      bed.lastSanitizedAt = new Date().toISOString();
    } else if (status === 'CLEANING' || status === 'PREPARING') {
      bed.currentPatientId = undefined;
      bed.currentPatientName = undefined;
    }

    if (options?.notes) {
      bed.notes = options.notes;
    }

    beds[index] = bed;
    localStorage.setItem(STORAGE_KEYS.BEDS, JSON.stringify(beds));

    this.logAudit({
      action: 'Bed Status Changed',
      entity: 'BED',
      entityId: bed.id,
      previousValue: prevStatus,
      newValue: status,
      details: `Bed ${bed.bedNumber} (${bed.wardName}) status updated to ${status}.`,
    });

    if (status === 'AVAILABLE') {
      this.addNotification({
        title: `Bed Available: ${bed.bedNumber}`,
        message: `${bed.bedNumber} in ${bed.wardName} is now clean and available for placement.`,
        type: 'BED_AVAILABLE',
        severity: 'INFO',
        relatedBedId: bed.id,
      });
    }

    notifyListeners();
    return bed;
  },

  assignBedToPatient(bedId: string, patientId: string, visitId: string): boolean {
    const beds = this.getBeds();
    const bed = beds.find((b) => b.id === bedId);
    const visits = this.getVisits();
    const visit = visits.find((v) => v.id === visitId);

    if (!bed || !visit) return false;

    // Update bed
    this.updateBedStatus(bedId, 'OCCUPIED', {
      patientId: visit.patientId,
      patientName: visit.patientName,
      visitId: visit.id,
    });

    // Update visit
    visit.assignedBedId = bed.id;
    visit.assignedBedNumber = bed.bedNumber;
    visit.currentStage = 'ADMITTED';
    visit.nextOperationalAction = `Inpatient care active in ${bed.wardName} (${bed.bedNumber})`;
    visit.lastUpdated = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));

    this.logAudit({
      action: 'Bed Assigned',
      entity: 'BED',
      entityId: bed.id,
      previousValue: 'AVAILABLE',
      newValue: `OCCUPIED (${visit.patientName})`,
      details: `Bed ${bed.bedNumber} assigned to patient ${visit.patientName} (${visit.patientId}).`,
    });

    notifyListeners();
    return true;
  },

  releaseBed(bedId: string): boolean {
    const beds = this.getBeds();
    const bed = beds.find((b) => b.id === bedId);
    if (!bed) return false;

    const prevPatient = bed.currentPatientName || 'N/A';
    this.updateBedStatus(bedId, 'CLEANING', {
      notes: `Released from patient ${prevPatient}. Awaiting sanitation.`,
    });

    this.logAudit({
      action: 'Bed Released',
      entity: 'BED',
      entityId: bed.id,
      previousValue: `OCCUPIED (${prevPatient})`,
      newValue: 'CLEANING',
      details: `Bed ${bed.bedNumber} released and flagged for terminal sanitation.`,
    });

    notifyListeners();
    return true;
  },

  // Diagnostics
  getDiagnostics(): DiagnosticRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.DIAGNOSTICS);
    return raw ? JSON.parse(raw) : [];
  },

  addDiagnostic(record: Omit<DiagnosticRecord, 'id' | 'requestedAt'>): DiagnosticRecord {
    const records = this.getDiagnostics();
    const newRecord: DiagnosticRecord = {
      ...record,
      id: `DX-${Date.now().toString().slice(-4)}`,
      requestedAt: new Date().toISOString(),
    };
    records.unshift(newRecord);
    localStorage.setItem(STORAGE_KEYS.DIAGNOSTICS, JSON.stringify(records));

    this.logAudit({
      action: 'Diagnostic Test Requested',
      entity: 'DIAGNOSTIC',
      entityId: newRecord.id,
      previousValue: 'NONE',
      newValue: newRecord.status,
      details: `${newRecord.testName} requested for ${newRecord.patientName}.`,
    });

    notifyListeners();
    return newRecord;
  },

  updateDiagnosticStatus(id: string, status: DiagnosticRecord['status']): DiagnosticRecord | null {
    const records = this.getDiagnostics();
    const index = records.findIndex((r) => r.id === id);
    if (index === -1) return null;

    const record = records[index];
    const prev = record.status;
    record.status = status;
    const now = new Date().toISOString();

    if (status === 'IN_PROGRESS' && !record.startedAt) {
      record.startedAt = now;
    } else if (status === 'COMPLETED') {
      record.completedAt = now;
      if (record.requestedAt) {
        const reqTime = new Date(record.requestedAt).getTime();
        record.turnaroundTimeMinutes = Math.max(5, Math.round((new Date(now).getTime() - reqTime) / 60000));
      }
    }

    records[index] = record;
    localStorage.setItem(STORAGE_KEYS.DIAGNOSTICS, JSON.stringify(records));

    this.logAudit({
      action: 'Diagnostic Status Updated',
      entity: 'DIAGNOSTIC',
      entityId: record.id,
      previousValue: prev,
      newValue: status,
      details: `${record.testName} for ${record.patientName} marked as ${status}.`,
    });

    notifyListeners();
    return record;
  },

  // Notifications
  getNotifications(): OperationalNotification[] {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return raw ? JSON.parse(raw) : [];
  },

  addNotification(notif: Omit<OperationalNotification, 'id' | 'timestamp' | 'isRead'>): OperationalNotification {
    const notifs = this.getNotifications();
    const newNotif: OperationalNotification = {
      ...notif,
      id: `NOTIF-${Date.now()}`,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    notifs.unshift(newNotif);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
    notifyListeners();
    return newNotif;
  },

  markNotificationRead(id: string): void {
    const notifs = this.getNotifications();
    const n = notifs.find((item) => item.id === id);
    if (n) {
      n.isRead = true;
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
      notifyListeners();
    }
  },

  markAllNotificationsRead(): void {
    const notifs = this.getNotifications().map((n) => ({ ...n, isRead: true }));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
    notifyListeners();
  },

  // Audit Logs
  getAuditLogs(): AuditLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    return raw ? JSON.parse(raw) : [];
  },

  logAudit(entry: {
    action: string;
    entity: AuditLog['entity'];
    entityId: string;
    previousValue: string;
    newValue: string;
    details?: string;
  }): AuditLog {
    const logs = this.getAuditLogs();
    const user = this.getCurrentUser();
    const newLog: AuditLog = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId,
      previousValue: entry.previousValue,
      newValue: entry.newValue,
      details: entry.details,
    };
    logs.unshift(newLog);
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs.slice(0, 200)));
    return newLog;
  },

  // Bottlenecks & Recovery
  getBottlenecks(): BottleneckAlert[] {
    const raw = localStorage.getItem(STORAGE_KEYS.BOTTLENECKS);
    return raw ? JSON.parse(raw) : [];
  },

  approveRecoveryOption(bottleneckId: string, optionId: string): boolean {
    const bottlenecks = this.getBottlenecks();
    const bn = bottlenecks.find((b) => b.id === bottleneckId);
    if (!bn) return false;

    const opt = bn.recoveryOptions.find((o) => o.id === optionId);
    if (!opt) return false;

    const user = this.getCurrentUser();
    const now = new Date().toISOString();

    opt.status = 'APPROVED';
    opt.approvedBy = `${user.name} (${user.roleTitle})`;
    opt.approvedAt = now;

    // Apply simulated operational relief
    bn.avgWaitMinutes = Math.max(15, bn.avgWaitMinutes - opt.projectedReductionMinutes);
    bn.queueLength = Math.max(4, bn.queueLength - 4);
    if (bn.avgWaitMinutes <= bn.thresholdWaitMinutes) {
      bn.severity = 'MODERATE';
    }

    // Update department stats
    const depts = this.getDepartments();
    const dept = depts.find((d) => d.id === bn.departmentId);
    if (dept) {
      dept.avgWaitMinutes = bn.avgWaitMinutes;
      dept.waitingCount = bn.queueLength;
      if (dept.avgWaitMinutes <= dept.maxThresholdWaitMinutes) {
        dept.operationalStatus = 'OPTIMAL';
      }
      localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(depts));
    }

    localStorage.setItem(STORAGE_KEYS.BOTTLENECKS, JSON.stringify(bottlenecks));

    this.logAudit({
      action: 'Flow Recovery Approved',
      entity: 'FLOW_RECOVERY',
      entityId: opt.id,
      previousValue: 'PROPOSED',
      newValue: 'APPROVED',
      details: `Human Staff Approval: "${opt.title}" approved by ${user.name}. Projected wait reduction: ${opt.projectedReductionMinutes} min.`,
    });

    this.addNotification({
      title: `Flow Recovery Action Approved`,
      message: `Operational measure "${opt.title}" initiated. Radiology queue load balancing active.`,
      type: 'STAGE_ADVANCE',
      severity: 'INFO',
      relatedDepartmentId: bn.departmentId,
    });

    notifyListeners();
    return true;
  },

  // Calculated Dashboard Metrics
  getDashboardMetrics(): DashboardMetrics {
    const visits = this.getVisits();
    const beds = this.getBeds();
    const diagnostics = this.getDiagnostics();
    const bottlenecks = this.getBottlenecks();

    const activeVisits = visits.filter((v) => v.currentStage !== 'DISCHARGED' && v.currentStage !== 'CANCELLED');
    const waiting = activeVisits.filter((v) => v.currentStage === 'WAITING' || v.currentStage === 'REGISTERED').length;
    const consultation = activeVisits.filter((v) => v.currentStage === 'CONSULTATION').length;
    const diagPending = diagnostics.filter((d) => d.status === 'REQUESTED' || d.status === 'QUEUED' || d.status === 'IN_PROGRESS').length;
    const admissionPending = activeVisits.filter((v) => v.currentStage === 'ADMISSION_REQUESTED' || v.currentStage === 'WAITING_FOR_BED').length;
    const availableBeds = beds.filter((b) => b.status === 'AVAILABLE').length;
    const occupiedBeds = beds.filter((b) => b.status === 'OCCUPIED').length;
    const dischargeReady = activeVisits.filter((v) => v.currentStage === 'DISCHARGE_READY' || v.currentStage === 'DISCHARGE_PREPARATION').length;

    const totalWait = activeVisits.reduce((acc, curr) => acc + (curr.waitDurationMinutes || 0), 0);
    const avgWait = activeVisits.length > 0 ? Math.round(totalWait / activeVisits.length) : 0;

    return {
      totalActivePatients: activeVisits.length,
      waitingPatients: waiting,
      inConsultation: consultation,
      diagnosticsPending: diagPending,
      admissionsPending: admissionPending,
      availableBeds,
      occupiedBeds,
      dischargeReady,
      avgWaitTimeMinutes: avgWait,
      activeBottlenecksCount: bottlenecks.length,
    };
  },
};

// Initialize on module load
storageService.initialize();
