import fs from 'fs';
import path from 'path';
import {
  AuditLog,
  Bed,
  BottleneckAlert,
  DashboardMetrics,
  Department,
  DiagnosticRecord,
  OperationalNotification,
  Patient,
  PatientFlowEvent,
  User,
  Visit,
} from '../src/types';

export interface WeatherStatus {
  condition: 'NORMAL' | 'SURGE_ALERT';
  label: string;
  temperature: string;
  windSpeed: string;
  advisory: string;
  impactLevel: 'LOW' | 'CRITICAL';
  statusColor: 'GREEN' | 'RED';
  lastUpdated: string;
}

export interface NexoraDatabase {
  patients: Patient[];
  visits: Visit[];
  beds: Bed[];
  departments: Department[];
  diagnostics: DiagnosticRecord[];
  bottlenecks: BottleneckAlert[];
  auditLogs: AuditLog[];
  notifications: OperationalNotification[];
  weather: WeatherStatus;
  meta: {
    initializedAt: string;
    lastSavedAt: string;
    totalWrites: number;
    dbEngine: string;
  };
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Initial seed generators
const DEFAULT_WEATHER: WeatherStatus = {
  condition: 'NORMAL',
  label: 'Fair & Mild (Optimal EMS Intake)',
  temperature: '72°F (22°C)',
  windSpeed: '6 mph SW',
  advisory: 'Standard metropolitan ambulance routing active. Weather index is GREEN.',
  impactLevel: 'LOW',
  statusColor: 'GREEN',
  lastUpdated: new Date().toISOString(),
};

export class DatabaseService {
  private db: NexoraDatabase | null = null;

  constructor() {
    this.ensureDataDirectory();
    this.initDatabase();
  }

  private ensureDataDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private initDatabase() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.db = JSON.parse(raw);
        console.log(`[Database] Loaded existing database from ${DB_FILE}`);
        return;
      }
    } catch (e) {
      console.warn('[Database] Could not read existing DB file, creating fresh seed:', e);
    }

    this.db = this.generateInitialSeed();
    this.persist();
    console.log(`[Database] Initialized new persistent database at ${DB_FILE}`);
  }

  private generateInitialSeed(): NexoraDatabase {
    const departments: Department[] = [
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

    const beds: Bed[] = [
      { id: 'BED-101', bedNumber: 'ED-01', ward: 'EMERGENCY_OBS', wardName: 'Emergency Observation', roomNumber: 'ER-Bay 1', status: 'OCCUPIED', currentPatientId: 'PAT-1002', currentPatientName: 'Eleanor Davis', currentVisitId: 'VIS-2002', admittedAt: '2026-09-10T05:30:00Z' },
      { id: 'BED-102', bedNumber: 'ED-02', ward: 'EMERGENCY_OBS', wardName: 'Emergency Observation', roomNumber: 'ER-Bay 1', status: 'OCCUPIED', currentPatientId: 'PAT-1005', currentPatientName: 'Julian Thorne', currentVisitId: 'VIS-2005', admittedAt: '2026-09-10T06:15:00Z' },
      { id: 'BED-103', bedNumber: 'ED-03', ward: 'EMERGENCY_OBS', wardName: 'Emergency Observation', roomNumber: 'ER-Bay 2', status: 'AVAILABLE', lastSanitizedAt: '2026-09-10T06:45:00Z' },
      { id: 'BED-104', bedNumber: 'ED-04', ward: 'EMERGENCY_OBS', wardName: 'Emergency Observation', roomNumber: 'ER-Bay 2', status: 'PREPARING', notes: 'Linens and telemetry monitor being installed' },
      { id: 'BED-105', bedNumber: 'ED-05', ward: 'EMERGENCY_OBS', wardName: 'Emergency Observation', roomNumber: 'ER-Bay 3', status: 'CLEANING', notes: 'Sanitizing terminal wipe-down' },
      { id: 'BED-106', bedNumber: 'ED-06', ward: 'EMERGENCY_OBS', wardName: 'Emergency Observation', roomNumber: 'ER-Bay 3', status: 'AVAILABLE', lastSanitizedAt: '2026-09-10T07:10:00Z' },
      { id: 'BED-107', bedNumber: 'ED-07', ward: 'EMERGENCY_OBS', wardName: 'Emergency Observation', roomNumber: 'ER-Bay 4', status: 'OCCUPIED', currentPatientId: 'PAT-1011', currentPatientName: 'Robert Langdon', currentVisitId: 'VIS-2011', admittedAt: '2026-09-10T04:20:00Z' },
      { id: 'BED-108', bedNumber: 'ED-08', ward: 'EMERGENCY_OBS', wardName: 'Emergency Observation', roomNumber: 'ER-Bay 4', status: 'BLOCKED', notes: 'Negative pressure filter replacement underway' },
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
      { id: 'BED-301', bedNumber: 'GWB-01', ward: 'GENERAL_WARD_B', wardName: 'General Ward B (Level 3)', roomNumber: '301-A', status: 'OCCUPIED', currentPatientId: 'PAT-1025', currentPatientName: 'Oliver Twist', currentVisitId: 'VIS-2025', admittedAt: '2026-09-09T19:20:00Z' },
      { id: 'BED-302', bedNumber: 'GWB-02', ward: 'GENERAL_WARD_B', wardName: 'General Ward B (Level 3)', roomNumber: '301-B', status: 'OCCUPIED', currentPatientId: 'PAT-1028', currentPatientName: 'Hannah Abbott', currentVisitId: 'VIS-2028', admittedAt: '2026-09-09T20:45:00Z' },
      { id: 'BED-303', bedNumber: 'GWB-03', ward: 'GENERAL_WARD_B', wardName: 'General Ward B (Level 3)', roomNumber: '302-A', status: 'AVAILABLE', lastSanitizedAt: '2026-09-10T06:10:00Z' },
      { id: 'BED-304', bedNumber: 'GWB-04', ward: 'GENERAL_WARD_B', wardName: 'General Ward B (Level 3)', roomNumber: '302-B', status: 'PREPARING' },
      { id: 'BED-305', bedNumber: 'GWB-05', ward: 'GENERAL_WARD_B', wardName: 'General Ward B (Level 3)', roomNumber: '303-A', status: 'AVAILABLE', lastSanitizedAt: '2026-09-10T03:30:00Z' },
      { id: 'BED-306', bedNumber: 'GWB-06', ward: 'GENERAL_WARD_B', wardName: 'General Ward B (Level 3)', roomNumber: '303-B', status: 'OCCUPIED', currentPatientId: 'PAT-1031', currentPatientName: 'Derek Morgan', currentVisitId: 'VIS-2031', admittedAt: '2026-09-08T09:00:00Z' },
      { id: 'BED-307', bedNumber: 'GWB-07', ward: 'GENERAL_WARD_B', wardName: 'General Ward B (Level 3)', roomNumber: '304-A', status: 'CLEANING' },
      { id: 'BED-308', bedNumber: 'GWB-08', ward: 'GENERAL_WARD_B', wardName: 'General Ward B (Level 3)', roomNumber: '304-B', status: 'AVAILABLE', lastSanitizedAt: '2026-09-10T06:55:00Z' },
      { id: 'BED-401', bedNumber: 'ICU-01', ward: 'ICU', wardName: 'Intensive Care Unit (Level 4)', roomNumber: 'ICU-Rm 1', status: 'OCCUPIED', currentPatientId: 'PAT-1008', currentPatientName: 'Arthur Dent', currentVisitId: 'VIS-2008', admittedAt: '2026-09-10T01:15:00Z' },
      { id: 'BED-402', bedNumber: 'ICU-02', ward: 'ICU', wardName: 'Intensive Care Unit (Level 4)', roomNumber: 'ICU-Rm 2', status: 'OCCUPIED', currentPatientId: 'PAT-1019', currentPatientName: 'Evelyn Salt', currentVisitId: 'VIS-2019', admittedAt: '2026-09-09T16:00:00Z' },
      { id: 'BED-403', bedNumber: 'ICU-03', ward: 'ICU', wardName: 'Intensive Care Unit (Level 4)', roomNumber: 'ICU-Rm 3', status: 'AVAILABLE', lastSanitizedAt: '2026-09-10T05:00:00Z' },
      { id: 'BED-404', bedNumber: 'ICU-04', ward: 'ICU', wardName: 'Intensive Care Unit (Level 4)', roomNumber: 'ICU-Rm 4', status: 'PREPARING', notes: 'Ventilator pre-check completed' },
      { id: 'BED-405', bedNumber: 'ICU-05', ward: 'ICU', wardName: 'Intensive Care Unit (Level 4)', roomNumber: 'ICU-Rm 5', status: 'OCCUPIED', currentPatientId: 'PAT-1033', currentPatientName: 'Lucas Grey', currentVisitId: 'VIS-2033', admittedAt: '2026-09-09T23:45:00Z' },
      { id: 'BED-406', bedNumber: 'ICU-06', ward: 'ICU', wardName: 'Intensive Care Unit (Level 4)', roomNumber: 'ICU-Rm 6', status: 'BLOCKED', notes: 'Biomedical maintenance scheduled' },
      { id: 'BED-501', bedNumber: 'PACU-01', ward: 'POST_SURGICAL', wardName: 'Post-Surgical Unit (Level 4)', roomNumber: 'PACU-Bay 1', status: 'OCCUPIED', currentPatientId: 'PAT-1015', currentPatientName: 'Victoria Price', currentVisitId: 'VIS-2015', admittedAt: '2026-09-10T03:00:00Z' },
      { id: 'BED-502', bedNumber: 'PACU-02', ward: 'POST_SURGICAL', wardName: 'Post-Surgical Unit (Level 4)', roomNumber: 'PACU-Bay 1', status: 'AVAILABLE', lastSanitizedAt: '2026-09-10T06:30:00Z' },
      { id: 'BED-503', bedNumber: 'PACU-03', ward: 'POST_SURGICAL', wardName: 'Post-Surgical Unit (Level 4)', roomNumber: 'PACU-Bay 2', status: 'AVAILABLE', lastSanitizedAt: '2026-09-10T05:15:00Z' },
      { id: 'BED-504', bedNumber: 'PACU-04', ward: 'POST_SURGICAL', wardName: 'Post-Surgical Unit (Level 4)', roomNumber: 'PACU-Bay 2', status: 'CLEANING' },
      { id: 'BED-505', bedNumber: 'PACU-05', ward: 'POST_SURGICAL', wardName: 'Post-Surgical Unit (Level 4)', roomNumber: 'PACU-Bay 3', status: 'AVAILABLE', lastSanitizedAt: '2026-09-10T07:00:00Z' },
      { id: 'BED-506', bedNumber: 'PACU-06', ward: 'POST_SURGICAL', wardName: 'Post-Surgical Unit (Level 4)', roomNumber: 'PACU-Bay 3', status: 'PREPARING' },
      { id: 'BED-507', bedNumber: 'PACU-07', ward: 'POST_SURGICAL', wardName: 'Post-Surgical Unit (Level 4)', roomNumber: 'PACU-Bay 4', status: 'OCCUPIED', currentPatientId: 'PAT-1035', currentPatientName: 'Diana Prince', currentVisitId: 'VIS-2035', admittedAt: '2026-09-10T02:40:00Z' },
      { id: 'BED-508', bedNumber: 'PACU-08', ward: 'POST_SURGICAL', wardName: 'Post-Surgical Unit (Level 4)', roomNumber: 'PACU-Bay 4', status: 'AVAILABLE', lastSanitizedAt: '2026-09-10T06:05:00Z' },
    ];

    const patients: Patient[] = [
      {
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
      {
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
      {
        id: 'PAT-1003',
        fullName: 'Marcus Aurelius Sterling',
        age: 58,
        gender: 'MALE',
        phone: '+1 (555) 456-7890',
        address: '88 Roman Way, Central City',
        emergencyContact: { name: 'Faustina Sterling', relationship: 'Wife', phone: '+1 (555) 456-7891' },
        registrationDate: '2026-09-10T06:40:00Z',
        activeVisitId: 'VIS-2003',
      },
      {
        id: 'PAT-1004',
        fullName: 'Sophia Chen',
        age: 29,
        gender: 'FEMALE',
        phone: '+1 (555) 567-8901',
        address: '404 Silicon Ave, Tech District',
        emergencyContact: { name: 'David Chen', relationship: 'Brother', phone: '+1 (555) 567-8902' },
        registrationDate: '2026-09-10T06:50:00Z',
        activeVisitId: 'VIS-2004',
      },
      {
        id: 'PAT-1005',
        fullName: 'Julian Thorne',
        age: 51,
        gender: 'MALE',
        phone: '+1 (555) 678-9012',
        address: '19 Highclere Castle Rd',
        emergencyContact: { name: 'Lady Thorne', relationship: 'Wife', phone: '+1 (555) 678-9013' },
        registrationDate: '2026-09-10T04:30:00Z',
        activeVisitId: 'VIS-2005',
      },
      {
        id: 'PAT-1006',
        fullName: 'Beatrice Vance',
        age: 74,
        gender: 'FEMALE',
        phone: '+1 (555) 789-0123',
        address: '33 Rosewood Manor',
        emergencyContact: { name: 'Dr. Alistair Vance', relationship: 'Nephew', phone: '+1 (555) 789-0124' },
        registrationDate: '2026-09-09T17:00:00Z',
        activeVisitId: 'VIS-2006',
      },
    ];

    const visits: Visit[] = [
      {
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
      {
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
        nextOperationalAction: 'Continuous telemetry observation & troponin check',
        operationalStatus: 'NORMAL',
        lastUpdated: '2026-09-10T05:30:00Z',
      },
      {
        id: 'VIS-2003',
        patientId: 'PAT-1003',
        patientName: 'Marcus Aurelius Sterling',
        patientAge: 58,
        patientGender: 'MALE',
        departmentId: 'DEP-RADIOLOGY',
        departmentName: 'Diagnostic Radiology & Imaging',
        currentStage: 'ADMISSION_REQUESTED',
        priority: 'CRITICAL',
        arrivalTime: '2026-09-10T06:40:00Z',
        stageEnteredAt: '2026-09-10T07:05:00Z',
        waitDurationMinutes: 42,
        assignedResource: 'Dr. Arthur Pendelton',
        nextOperationalAction: 'Inpatient Cardiology Bed Placement Required',
        operationalStatus: 'DELAYED',
        lastUpdated: '2026-09-10T07:05:00Z',
      },
      {
        id: 'VIS-2004',
        patientId: 'PAT-1004',
        patientName: 'Sophia Chen',
        patientAge: 29,
        patientGender: 'FEMALE',
        departmentId: 'DEP-EMERGENCY',
        departmentName: 'Emergency & Trauma',
        currentStage: 'WAITING_FOR_BED',
        priority: 'URGENT',
        arrivalTime: '2026-09-10T06:50:00Z',
        stageEnteredAt: '2026-09-10T07:15:00Z',
        waitDurationMinutes: 34,
        assignedResource: 'Charge Nurse Sarah',
        nextOperationalAction: 'Assign Inpatient Ward Bed or Observation Bay',
        operationalStatus: 'ATTENTION',
        lastUpdated: '2026-09-10T07:15:00Z',
      },
      {
        id: 'VIS-2005',
        patientId: 'PAT-1005',
        patientName: 'Julian Thorne',
        patientAge: 51,
        patientGender: 'MALE',
        departmentId: 'DEP-CARDIOLOGY',
        departmentName: 'Cardiology Center',
        currentStage: 'DISCHARGE_READY',
        priority: 'STANDARD',
        arrivalTime: '2026-09-10T04:30:00Z',
        stageEnteredAt: '2026-09-10T07:10:00Z',
        waitDurationMinutes: 18,
        assignedResource: 'Dr. Patricia Wright',
        assignedBedId: 'BED-102',
        assignedBedNumber: 'ED-02',
        nextOperationalAction: 'Reconcile pharmacy script and authorize departure',
        operationalStatus: 'NORMAL',
        lastUpdated: '2026-09-10T07:10:00Z',
      },
      {
        id: 'VIS-2006',
        patientId: 'PAT-1006',
        patientName: 'Beatrice Vance',
        patientAge: 74,
        patientGender: 'FEMALE',
        departmentId: 'DEP-GENERAL',
        departmentName: 'General Internal Medicine',
        currentStage: 'DISCHARGE_PREPARATION',
        priority: 'STANDARD',
        arrivalTime: '2026-09-09T17:00:00Z',
        stageEnteredAt: '2026-09-10T06:30:00Z',
        waitDurationMinutes: 45,
        assignedResource: 'Dr. Michael Sterling',
        assignedBedId: 'BED-201',
        assignedBedNumber: 'GWA-01',
        nextOperationalAction: 'Awaiting transport pickup confirmation & final signoff',
        operationalStatus: 'NORMAL',
        lastUpdated: '2026-09-10T06:30:00Z',
      },
    ];

    const diagnostics: DiagnosticRecord[] = [
      {
        id: 'DX-5001',
        patientId: 'PAT-1003',
        patientName: 'Marcus Aurelius Sterling',
        visitId: 'VIS-2003',
        departmentId: 'DEP-RADIOLOGY',
        departmentName: 'Diagnostic Radiology',
        diagnosticType: 'CT_SCAN',
        modality: 'CT_SCAN',
        testName: 'Contrast CT Angiography (Aorta / Coronary)',
        status: 'REQUESTED',
        priority: 'CRITICAL',
        requestedAt: '2026-09-10T06:55:00Z',
        notes: 'Rule out acute aortic dissection. Stat processing requested.',
      },
      {
        id: 'DX-5002',
        patientId: 'PAT-1001',
        patientName: 'Jonathan Miller',
        visitId: 'VIS-2001',
        departmentId: 'DEP-RADIOLOGY',
        departmentName: 'Diagnostic Radiology',
        diagnosticType: 'XRAY',
        modality: 'XRAY',
        testName: 'Chest Radiograph 2-View (PA & Lateral)',
        status: 'IN_PROGRESS',
        priority: 'URGENT',
        requestedAt: '2026-09-10T07:22:00Z',
        notes: 'Rule out pneumonia or pneumothorax.',
      },
      {
        id: 'DX-5003',
        patientId: 'PAT-1002',
        patientName: 'Eleanor Davis',
        visitId: 'VIS-2002',
        departmentId: 'DEP-LAB',
        departmentName: 'Pathology & Lab',
        diagnosticType: 'CARDIAC_ENZYMES',
        modality: 'CARDIAC_ENZYMES',
        testName: 'High-Sensitivity Troponin I (Serial Check 2)',
        status: 'COMPLETED',
        priority: 'CRITICAL',
        requestedAt: '2026-09-10T05:35:00Z',
        completedAt: '2026-09-10T06:05:00Z',
        turnaroundTimeMinutes: 30,
        resultsNotes: 'Troponin I baseline within normal limits (< 0.04 ng/mL).',
      },
    ];

    const bottlenecks: BottleneckAlert[] = [
      {
        id: 'BN-801',
        departmentId: 'DEP-RADIOLOGY',
        departmentName: 'Diagnostic Radiology & Imaging',
        severity: 'HIGH',
        queueLength: 11,
        avgWaitMinutes: 44,
        thresholdQueue: 6,
        thresholdWaitMinutes: 30,
        impactSummary: 'CT Scanner Suite 2 calibration delay combined with sudden STAT trauma influx',
        suggestedActions: [
          'Deploy Rapid Contrast CT Protocol',
          'Fast-Track Low-Risk Outpatient Imaging',
          'Authorize Emergency On-Call Radiologist',
          'Reroute Non-Urgent Scans to Satellite Suite',
        ],
        delayFactor: 1.9,
        impactedDownstream: ['Emergency & Trauma Flow', 'Cardiology Admissions'],
        detectedAt: '2026-09-10T07:00:00Z',
      },
      {
        id: 'BN-802',
        departmentId: 'DEP-EMERGENCY',
        departmentName: 'Emergency & Trauma',
        severity: 'MEDIUM',
        queueLength: 7,
        avgWaitMinutes: 28,
        thresholdQueue: 5,
        thresholdWaitMinutes: 25,
        impactSummary: 'Inpatient bed wait backlog preventing ED observation bay turnover',
        suggestedActions: [
          'Expedite Ward Morning Discharges',
          'Activate Surge Telemetry Observation',
          'Redeploy Nursing Float Pool',
          'Initiate Bed Placement Escort',
        ],
        delayFactor: 1.5,
        impactedDownstream: ['General Internal Medicine', 'Ambulance Offload Time'],
        detectedAt: '2026-09-10T07:15:00Z',
      },
    ];

    const auditLogs: AuditLog[] = [
      {
        id: 'LOG-1',
        timestamp: new Date().toISOString(),
        userId: 'USR-ADMIN',
        userName: 'Dr. Alistair Vance',
        userRole: 'ADMIN',
        action: 'SYSTEM_BOOT',
        entity: 'FLOW_RECOVERY',
        entityId: 'SYS-NEXORA-01',
        previousValue: 'OFFLINE',
        newValue: 'ONLINE',
        details: 'Connected to persistent backend database and initialized real-time flow engine.',
      },
    ];

    const notifications: OperationalNotification[] = [
      {
        id: 'NOTIF-1',
        timestamp: new Date().toISOString(),
        title: 'Backend & Database Connected',
        message: 'NEXORA Health core server and persistent database online on port 3000.',
        type: 'BOTTLENECK',
        severity: 'INFO',
        isRead: false,
      },
      {
        id: 'NOTIF-2',
        timestamp: new Date().toISOString(),
        title: 'Radiology Choke-Point Detected',
        message: 'Average CT scan wait time reached 44 min. Protocol deployment recommended.',
        type: 'BOTTLENECK',
        severity: 'WARNING',
        relatedDepartmentId: 'DEP-RADIOLOGY',
        isRead: false,
      },
    ];

    return {
      patients,
      visits,
      beds,
      departments,
      diagnostics,
      bottlenecks,
      auditLogs,
      notifications,
      weather: DEFAULT_WEATHER,
      meta: {
        initializedAt: new Date().toISOString(),
        lastSavedAt: new Date().toISOString(),
        totalWrites: 1,
        dbEngine: 'Persistent File-Backed JSON Database Engine',
      },
    };
  }

  public getDatabase(): NexoraDatabase {
    if (!this.db) {
      this.initDatabase();
    }
    return this.db!;
  }

  public persist() {
    if (!this.db) return;
    this.ensureDataDirectory();
    this.db.meta.lastSavedAt = new Date().toISOString();
    this.db.meta.totalWrites += 1;
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.db, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Database] Failed to write database file:', err);
    }
  }

  public logAudit(log: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const db = this.getDatabase();
    const entry: AuditLog = {
      ...log,
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    db.auditLogs.unshift(entry);
    if (db.auditLogs.length > 500) db.auditLogs.pop();
    this.persist();
    return entry;
  }

  public addNotification(notif: Omit<OperationalNotification, 'id' | 'timestamp' | 'isRead'>): OperationalNotification {
    const db = this.getDatabase();
    const entry: OperationalNotification = {
      ...notif,
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    db.notifications.unshift(entry);
    if (db.notifications.length > 100) db.notifications.pop();
    this.persist();
    return entry;
  }

  public resetToSeed() {
    this.db = this.generateInitialSeed();
    this.persist();
    return this.db;
  }
}

export const dbService = new DatabaseService();
