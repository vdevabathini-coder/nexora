import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { dbService, WeatherStatus } from './server/db';
import { PatientStatus, BedStatus, DiagnosticStatus } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`[API ${req.method}] ${req.path}`);
  }
  next();
});

// --- API ROUTES FIRST ---

// 1. Health & Database Status
app.get('/api/health', (req, res) => {
  const db = dbService.getDatabase();
  res.json({
    status: 'ok',
    backend: 'online',
    database: {
      connected: true,
      engine: db.meta.dbEngine,
      totalPatients: db.patients.length,
      totalVisits: db.visits.length,
      totalBeds: db.beds.length,
      totalDepartments: db.departments.length,
      lastSavedAt: db.meta.lastSavedAt,
      totalWrites: db.meta.totalWrites,
    },
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/db/status', (req, res) => {
  const db = dbService.getDatabase();
  res.json({
    connected: true,
    meta: db.meta,
    counts: {
      patients: db.patients.length,
      visits: db.visits.length,
      beds: db.beds.length,
      departments: db.departments.length,
      diagnostics: db.diagnostics.length,
      bottlenecks: db.bottlenecks.length,
      auditLogs: db.auditLogs.length,
      notifications: db.notifications.length,
    },
    weather: db.weather,
  });
});

// 2. Weather & Surge Monitoring ("wheather" & surge state)
app.get('/api/weather', (req, res) => {
  const db = dbService.getDatabase();
  res.json(db.weather);
});

app.post('/api/weather/toggle', (req, res) => {
  const db = dbService.getDatabase();
  if (db.weather.condition === 'NORMAL') {
    db.weather = {
      condition: 'SURGE_ALERT',
      label: 'Severe Storm & Trauma Surge (High Influx)',
      temperature: '48°F (9°C) Heavy Rain & Gale',
      windSpeed: '42 mph NW Gusting',
      advisory: 'RED WEATHER SURGE: Multi-vehicle accidents & acute respiratory trauma incoming. ED and Radiology prioritized.',
      impactLevel: 'CRITICAL',
      statusColor: 'RED',
      lastUpdated: new Date().toISOString(),
    };
    dbService.addNotification({
      title: 'Severe Weather Surge Alert Activated',
      message: 'Ambulance rerouting and trauma surge protocols initiated. Bed release prioritized.',
      type: 'BOTTLENECK',
      severity: 'WARNING',
    });
    dbService.logAudit({
      action: 'WEATHER_SURGE_ACTIVATED',
      entity: 'DEPARTMENT',
      entityId: 'WEATHER-SURGE-RED',
      previousValue: 'NORMAL',
      newValue: 'SURGE_ALERT',
      details: 'Hospital weather status toggled to RED (Severe Storm Surge).',
      userName: 'Flow Coordinator',
      userId: 'USR-OPS',
      userRole: 'OPERATIONS_STAFF',
    });
  } else {
    db.weather = {
      condition: 'NORMAL',
      label: 'Fair & Mild (Optimal EMS Intake)',
      temperature: '72°F (22°C)',
      windSpeed: '6 mph SW',
      advisory: 'Standard metropolitan ambulance routing active. Weather index is GREEN.',
      impactLevel: 'LOW',
      statusColor: 'GREEN',
      lastUpdated: new Date().toISOString(),
    };
    dbService.addNotification({
      title: 'Weather Conditions Normalized',
      message: 'Hospital flow returned to standard operating baseline. Weather index is GREEN.',
      type: 'BOTTLENECK',
      severity: 'INFO',
    });
    dbService.logAudit({
      action: 'WEATHER_NORMALIZED',
      entity: 'DEPARTMENT',
      entityId: 'WEATHER-SURGE-GREEN',
      previousValue: 'SURGE_ALERT',
      newValue: 'NORMAL',
      details: 'Hospital weather status restored to GREEN (Fair & Clear).',
      userName: 'Flow Coordinator',
      userId: 'USR-OPS',
      userRole: 'OPERATIONS_STAFF',
    });
  }
  dbService.persist();
  res.json(db.weather);
});

// 3. Dashboard Metrics
app.get('/api/metrics', (req, res) => {
  const db = dbService.getDatabase();
  const activeVisits = db.visits.filter((v) => v.currentStage !== 'DISCHARGED' && v.currentStage !== 'CANCELLED');
  const availableBeds = db.beds.filter((b) => b.status === 'AVAILABLE').length;
  const occupiedBeds = db.beds.filter((b) => b.status === 'OCCUPIED').length;
  const occupancyRate = db.beds.length > 0 ? Math.round((occupiedBeds / db.beds.length) * 100) : 0;
  const waitingPatients = activeVisits.filter((v) => v.currentStage === 'WAITING' || v.currentStage === 'REGISTERED').length;
  const inConsultation = activeVisits.filter((v) => v.currentStage === 'CONSULTATION' || v.currentStage === 'TREATMENT').length;
  const inDiagnostics = activeVisits.filter((v) => v.currentStage === 'DIAGNOSTICS').length;
  const inAdmissionQueue = activeVisits.filter((v) => v.currentStage === 'ADMISSION_REQUESTED' || v.currentStage === 'WAITING_FOR_BED').length;
  const readyForDischarge = activeVisits.filter((v) => v.currentStage === 'DISCHARGE_READY' || v.currentStage === 'DISCHARGE_PREPARATION').length;

  const totalWait = activeVisits.reduce((acc, v) => acc + (v.waitDurationMinutes || 0), 0);
  const avgWaitTimeMinutes = activeVisits.length > 0 ? Math.round(totalWait / activeVisits.length) : 0;

  res.json({
    totalActivePatients: activeVisits.length,
    waitingPatients,
    inConsultation,
    inDiagnostics,
    inAdmissionQueue,
    readyForDischarge,
    availableBeds,
    occupiedBeds,
    bedOccupancyRate: occupancyRate,
    avgWaitTimeMinutes,
    bottlenecksActive: db.bottlenecks.length,
    slaComplianceRate: 94,
    lastRefreshed: new Date().toISOString(),
  });
});

// 4. Departments
app.get('/api/departments', (req, res) => {
  const db = dbService.getDatabase();
  res.json(db.departments);
});

// 5. Patients
app.get('/api/patients', (req, res) => {
  const db = dbService.getDatabase();
  res.json(db.patients);
});

app.get('/api/patients/:id', (req, res) => {
  const db = dbService.getDatabase();
  const patient = db.patients.find((p) => p.id === req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  const visit = db.visits.find((v) => v.id === patient.activeVisitId || v.patientId === patient.id);
  const diagnostics = db.diagnostics.filter((d) => d.patientId === patient.id);
  const currentStage = (visit?.currentStage || 'REGISTERED') as PatientStatus;
  const dept = db.departments.find((d) => d.id === visit?.departmentId) || db.departments[0];

  const events: any[] = [
    {
      id: `EVT-${patient.id}-1`,
      patientId: patient.id,
      visitId: visit?.id || '',
      stage: 'REGISTERED',
      status: currentStage === 'REGISTERED' ? 'IN_PROGRESS' : 'COMPLETED',
      startedAt: patient.registrationDate || new Date().toISOString(),
      completedAt: currentStage === 'REGISTERED' ? null : (visit?.stageEnteredAt || patient.registrationDate),
      durationMinutes: 5,
      departmentId: dept.id,
      departmentName: dept.name,
      staffName: 'Intake Staff',
      staffRole: 'OPERATIONS_STAFF',
      fromStage: 'REGISTERED',
      toStage: 'REGISTERED',
      performedBy: 'Intake Registration Desk',
      notes: visit?.notes || 'Patient intake logged into hospital database.',
    },
  ];

  if (currentStage !== 'REGISTERED') {
    events.push({
      id: `EVT-${patient.id}-2`,
      patientId: patient.id,
      visitId: visit?.id || '',
      stage: currentStage,
      status: currentStage === 'DISCHARGED' || currentStage === 'CANCELLED' ? 'COMPLETED' : 'IN_PROGRESS',
      startedAt: visit?.stageEnteredAt || patient.registrationDate || new Date().toISOString(),
      completedAt: currentStage === 'DISCHARGED' || currentStage === 'CANCELLED' ? (visit?.lastUpdated || new Date().toISOString()) : null,
      durationMinutes: visit?.waitDurationMinutes || 12,
      departmentId: dept.id,
      departmentName: dept.name,
      staffName: 'Clinical Coordinator',
      staffRole: 'CLINICAL_COORDINATOR',
      fromStage: 'REGISTERED',
      toStage: currentStage,
      performedBy: visit?.assignedResource || 'Operational Team',
      notes: visit?.nextOperationalAction || 'Active clinical flow tracking.',
    });
  }

  res.json({ patient, visit, events, diagnostics });
});

app.post('/api/patients', (req, res) => {
  const db = dbService.getDatabase();
  const data = req.body;

  if (!data || !data.fullName || !data.fullName.trim()) {
    return res.status(400).json({ error: 'Patient full legal name is required' });
  }

  const maxPatientNum = db.patients.reduce((max, p) => {
    const num = parseInt(String(p.id).replace(/\D/g, ''), 10);
    return !isNaN(num) && num > max ? num : max;
  }, 1000);
  const patientId = `PAT-${maxPatientNum + 1}`;

  const maxVisitNum = db.visits.reduce((max, v) => {
    const num = parseInt(String(v.id).replace(/\D/g, ''), 10);
    return !isNaN(num) && num > max ? num : max;
  }, 2000);
  const visitId = `VIS-${maxVisitNum + 1}`;
  const now = new Date().toISOString();

  const newPatient = {
    id: patientId,
    fullName: data.fullName.trim(),
    age: Number(data.age) || 30,
    gender: data.gender || 'OTHER',
    phone: data.phone || '+1 (555) 000-0000',
    address: data.address || 'City Center, Ward 4',
    emergencyContact: data.emergencyContact || { name: 'Family Member', relationship: 'Next of Kin', phone: '+1 (555) 111-2222' },
    registrationDate: now,
    activeVisitId: visitId,
  };

  const dept = db.departments.find((d) => d.id === data.departmentId) || db.departments[0];
  const newVisit = {
    id: visitId,
    patientId: patientId,
    patientName: newPatient.fullName,
    patientAge: newPatient.age,
    patientGender: newPatient.gender,
    departmentId: dept.id,
    departmentName: dept.name,
    currentStage: 'REGISTERED' as PatientStatus,
    priority: data.priority || 'STANDARD',
    arrivalTime: now,
    stageEnteredAt: now,
    waitDurationMinutes: 0,
    assignedResource: 'Intake & Triage Desk',
    nextOperationalAction: 'Awaiting clinical triage review',
    operationalStatus: 'NORMAL' as const,
    notes: data.initialNotes || 'New patient registered in hospital operational flow.',
    lastUpdated: now,
  };

  db.patients.unshift(newPatient);
  db.visits.unshift(newVisit);

  dept.waitingCount += 1;

  dbService.logAudit({
    action: 'PATIENT_REGISTERED',
    entity: 'PATIENT',
    entityId: patientId,
    previousValue: 'NONE',
    newValue: newVisit.priority,
    details: `Patient ${newPatient.fullName} registered into ${dept.name}. Priority: ${newVisit.priority}`,
    userName: 'Admission Desk',
    userId: 'USR-OPS',
    userRole: 'OPERATIONS_STAFF',
  });

  dbService.addNotification({
    title: 'New Patient Registered',
    message: `${newPatient.fullName} registered into ${dept.name} (${newVisit.priority}).`,
    type: 'STAGE_ADVANCE',
    severity: newVisit.priority === 'CRITICAL' ? 'WARNING' : 'INFO',
    relatedDepartmentId: dept.id,
  });

  dbService.persist();
  res.status(201).json({ patient: newPatient, visit: newVisit });
});

// 6. Visits & Stage Progression
app.get('/api/visits', (req, res) => {
  const db = dbService.getDatabase();
  res.json(db.visits);
});

// Advance stage (Generic)
app.post('/api/visits/:id/stage', (req, res) => {
  const db = dbService.getDatabase();
  const visit = db.visits.find((v) => v.id === req.params.id);
  if (!visit) return res.status(404).json({ error: 'Visit not found' });

  const { nextStage, assignedResource, notes, assignedBedId } = req.body;
  const previousStage = visit.currentStage;
  visit.currentStage = nextStage;
  visit.stageEnteredAt = new Date().toISOString();
  visit.lastUpdated = new Date().toISOString();
  if (assignedResource) visit.assignedResource = assignedResource;
  if (notes) visit.notes = notes;

  if (assignedBedId) {
    const bed = db.beds.find((b) => b.id === assignedBedId);
    if (bed) {
      bed.status = 'OCCUPIED';
      bed.currentPatientId = visit.patientId;
      bed.currentPatientName = visit.patientName;
      bed.currentVisitId = visit.id;
      bed.admittedAt = new Date().toISOString();
      visit.assignedBedId = bed.id;
      visit.assignedBedNumber = bed.bedNumber;
    }
  }

  if (nextStage === 'DISCHARGED') {
    if (visit.assignedBedId) {
      const bed = db.beds.find((b) => b.id === visit.assignedBedId);
      if (bed) {
        bed.status = 'CLEANING';
        bed.currentPatientId = undefined;
        bed.currentPatientName = undefined;
        bed.currentVisitId = undefined;
        bed.notes = 'Terminal sanitation in progress after patient discharge.';
      }
    }
  }

  dbService.logAudit({
    action: 'STAGE_ADVANCED',
    entity: 'VISIT',
    entityId: visit.id,
    previousValue: previousStage,
    newValue: nextStage,
    details: `Patient ${visit.patientName} advanced from ${previousStage} to ${nextStage}. Notes: ${notes || 'None'}`,
    userName: 'Clinical Coordinator',
    userId: 'USR-CLINIC',
    userRole: 'CLINICAL_STAFF',
  });

  dbService.persist();
  res.json(visit);
});

// ACCEPT Admission / Placement (Green Action)
app.post('/api/visits/:id/accept', (req, res) => {
  const db = dbService.getDatabase();
  const visit = db.visits.find((v) => v.id === req.params.id);
  if (!visit) return res.status(404).json({ error: 'Visit not found' });

  const { targetStage = 'ADMITTED', bedId, notes = 'Admission officially accepted & authorized' } = req.body;
  const previousStage = visit.currentStage;

  visit.currentStage = targetStage;
  visit.lastUpdated = new Date().toISOString();
  visit.stageEnteredAt = new Date().toISOString();
  visit.nextOperationalAction = 'Inpatient care regimen underway';

  if (bedId) {
    const bed = db.beds.find((b) => b.id === bedId);
    if (bed) {
      bed.status = 'OCCUPIED';
      bed.currentPatientId = visit.patientId;
      bed.currentPatientName = visit.patientName;
      bed.currentVisitId = visit.id;
      bed.admittedAt = new Date().toISOString();
      visit.assignedBedId = bed.id;
      visit.assignedBedNumber = bed.bedNumber;
    }
  }

  dbService.logAudit({
    action: 'ADMISSION_ACCEPTED',
    entity: 'VISIT',
    entityId: visit.id,
    previousValue: previousStage,
    newValue: targetStage,
    details: `[ACCEPT] Inpatient admission approved for ${visit.patientName}. Assigned bed: ${visit.assignedBedNumber || 'Pending Bed'}. ${notes}`,
    userName: 'Chief Placement Officer',
    userId: 'USR-BED',
    userRole: 'BED_MANAGER',
  });

  dbService.addNotification({
    title: 'Admission Accepted',
    message: `${visit.patientName} admission accepted and finalized. Flow progressing.`,
    type: 'STAGE_ADVANCE',
    severity: 'INFO',
  });

  dbService.persist();
  res.json({ success: true, visit, message: `Admission accepted for ${visit.patientName}` });
});

// REJECT / CANCEL Admission or Visit (Red Action)
app.post('/api/visits/:id/reject', (req, res) => {
  const db = dbService.getDatabase();
  const visit = db.visits.find((v) => v.id === req.params.id);
  if (!visit) return res.status(404).json({ error: 'Visit not found' });

  const { reason = 'Clinically diverted or cancelled by triage authority' } = req.body;
  const previousStage = visit.currentStage;

  visit.currentStage = 'CANCELLED';
  visit.lastUpdated = new Date().toISOString();
  visit.nextOperationalAction = `Cancelled/Diverted: ${reason}`;

  if (visit.assignedBedId) {
    const bed = db.beds.find((b) => b.id === visit.assignedBedId);
    if (bed) {
      bed.status = 'AVAILABLE';
      bed.currentPatientId = undefined;
      bed.currentPatientName = undefined;
      bed.currentVisitId = undefined;
      bed.lastSanitizedAt = new Date().toISOString();
    }
  }

  dbService.logAudit({
    action: 'ADMISSION_REJECTED',
    entity: 'VISIT',
    entityId: visit.id,
    previousValue: previousStage,
    newValue: 'CANCELLED',
    details: `[REJECT] Admission rejected/cancelled for ${visit.patientName}. Reason: ${reason}`,
    userName: 'Triage Supervisor',
    userId: 'USR-ADMIN',
    userRole: 'ADMIN',
  });

  dbService.addNotification({
    title: 'Admission Cancelled / Rejected',
    message: `Admission for ${visit.patientName} was cancelled or diverted (${reason}).`,
    type: 'STAGE_ADVANCE',
    severity: 'WARNING',
  });

  dbService.persist();
  res.json({ success: true, visit, message: `Admission rejected for ${visit.patientName}` });
});

// Discharge Accept (Finalize)
app.post('/api/visits/:id/discharge', (req, res) => {
  const db = dbService.getDatabase();
  const visit = db.visits.find((v) => v.id === req.params.id);
  if (!visit) return res.status(404).json({ error: 'Visit not found' });

  const previousStage = visit.currentStage;
  visit.currentStage = 'DISCHARGED';
  visit.lastUpdated = new Date().toISOString();
  visit.nextOperationalAction = 'Discharge complete. Record archived.';

  if (visit.assignedBedId) {
    const bed = db.beds.find((b) => b.id === visit.assignedBedId);
    if (bed) {
      bed.status = 'CLEANING';
      bed.currentPatientId = undefined;
      bed.currentPatientName = undefined;
      bed.currentVisitId = undefined;
      bed.notes = 'Terminal sanitization dispatched post-discharge.';
    }
  }

  dbService.logAudit({
    action: 'DISCHARGE_ACCEPTED',
    entity: 'VISIT',
    entityId: visit.id,
    previousValue: previousStage,
    newValue: 'DISCHARGED',
    details: `[ACCEPT] Discharge approved and finalized for ${visit.patientName}. Bed released for terminal cleaning.`,
    userName: 'Discharge Coordinator',
    userId: 'USR-OPS',
    userRole: 'OPERATIONS_STAFF',
  });

  dbService.addNotification({
    title: 'Discharge Authorized & Finalized',
    message: `${visit.patientName} discharged. Associated bed scheduled for cleaning.`,
    type: 'DISCHARGE_READY',
    severity: 'INFO',
  });

  dbService.persist();
  res.json({ success: true, visit });
});

// Discharge Reject / Hold (Red Action)
app.post('/api/visits/:id/hold-discharge', (req, res) => {
  const db = dbService.getDatabase();
  const visit = db.visits.find((v) => v.id === req.params.id);
  if (!visit) return res.status(404).json({ error: 'Visit not found' });

  const { reason = 'Clinical criteria unmet, discharge placed on hold' } = req.body;
  visit.currentStage = 'ADMITTED';
  visit.nextOperationalAction = `Discharge Hold: ${reason}`;
  visit.lastUpdated = new Date().toISOString();

  dbService.logAudit({
    action: 'DISCHARGE_REJECTED_HOLD',
    entity: 'VISIT',
    entityId: visit.id,
    previousValue: 'DISCHARGE_READY',
    newValue: 'ADMITTED',
    details: `[REJECT/HOLD] Discharge held for ${visit.patientName}. Reason: ${reason}`,
    userName: 'Attending Physician',
    userId: 'USR-CLINIC',
    userRole: 'CLINICAL_STAFF',
  });

  dbService.addNotification({
    title: 'Discharge Placed On Hold',
    message: `Discharge for ${visit.patientName} suspended. Retained in inpatient care.`,
    type: 'DISCHARGE_READY',
    severity: 'WARNING',
  });

  dbService.persist();
  res.json({ success: true, visit, message: 'Discharge placed on hold' });
});

// 7. Beds Management
app.get('/api/beds', (req, res) => {
  const db = dbService.getDatabase();
  res.json(db.beds);
});

// Bed assign (Accept)
app.post('/api/beds/:id/assign', (req, res) => {
  const db = dbService.getDatabase();
  const bed = db.beds.find((b) => b.id === req.params.id);
  if (!bed) return res.status(404).json({ error: 'Bed not found' });

  const { patientId, visitId } = req.body;
  const patient = db.patients.find((p) => p.id === patientId);
  const visit = db.visits.find((v) => v.id === visitId);

  if (!patient || !visit) {
    return res.status(400).json({ error: 'Invalid patient or visit ID' });
  }

  bed.status = 'OCCUPIED';
  bed.currentPatientId = patient.id;
  bed.currentPatientName = patient.fullName;
  bed.currentVisitId = visit.id;
  bed.admittedAt = new Date().toISOString();

  visit.assignedBedId = bed.id;
  visit.assignedBedNumber = bed.bedNumber;
  visit.currentStage = 'ADMITTED';
  visit.nextOperationalAction = `Inpatient monitoring on ${bed.wardName}`;

  dbService.logAudit({
    action: 'BED_ASSIGNMENT_ACCEPTED',
    entity: 'BED',
    entityId: bed.id,
    previousValue: 'AVAILABLE',
    newValue: 'OCCUPIED',
    details: `[ACCEPT] Bed ${bed.bedNumber} assigned to ${patient.fullName} (${patient.id}).`,
    userName: 'Placement Supervisor',
    userId: 'USR-BED',
    userRole: 'BED_MANAGER',
  });

  dbService.persist();
  res.json({ success: true, bed, visit });
});

// Bed release / clear
app.post('/api/beds/:id/release', (req, res) => {
  const db = dbService.getDatabase();
  const bed = db.beds.find((b) => b.id === req.params.id);
  if (!bed) return res.status(404).json({ error: 'Bed not found' });

  const previousPatient = bed.currentPatientName || 'Patient';
  bed.status = 'CLEANING';
  bed.currentPatientId = undefined;
  bed.currentPatientName = undefined;
  bed.currentVisitId = undefined;
  bed.notes = 'Terminal sanitation in progress';

  dbService.logAudit({
    action: 'BED_RELEASED',
    entity: 'BED',
    entityId: bed.id,
    previousValue: 'OCCUPIED',
    newValue: 'CLEANING',
    details: `[RELEASE] Bed ${bed.bedNumber} released from ${previousPatient}. Cleaning dispatched.`,
    userName: 'Ward Coordinator',
    userId: 'USR-BED',
    userRole: 'BED_MANAGER',
  });

  dbService.persist();
  res.json({ success: true, bed });
});

// Bed update status
app.post('/api/beds/:id/status', (req, res) => {
  const db = dbService.getDatabase();
  const bed = db.beds.find((b) => b.id === req.params.id);
  if (!bed) return res.status(404).json({ error: 'Bed not found' });

  const { status, notes } = req.body;
  const previousStatus = bed.status;
  bed.status = status as BedStatus;
  if (notes !== undefined) bed.notes = notes;
  if (status === 'AVAILABLE') {
    bed.lastSanitizedAt = new Date().toISOString();
    bed.currentPatientId = undefined;
    bed.currentPatientName = undefined;
    bed.currentVisitId = undefined;
  }

  dbService.logAudit({
    action: 'BED_STATUS_UPDATED',
    entity: 'BED',
    entityId: bed.id,
    previousValue: previousStatus,
    newValue: status,
    details: `Bed ${bed.bedNumber} status updated to ${status}.`,
    userName: 'Ward Staff',
    userId: 'USR-BED',
    userRole: 'BED_MANAGER',
  });

  dbService.persist();
  res.json({ success: true, bed });
});

// 8. Diagnostics
app.get('/api/diagnostics', (req, res) => {
  const db = dbService.getDatabase();
  res.json(db.diagnostics);
});

app.post('/api/diagnostics', (req, res) => {
  const db = dbService.getDatabase();
  const data = req.body;

  const newRecord: any = {
    id: `DX-${5000 + db.diagnostics.length + 1}`,
    patientId: data.patientId,
    patientName: data.patientName,
    visitId: data.visitId,
    departmentId: data.departmentId,
    departmentName: data.departmentId === 'DEP-RADIOLOGY' ? 'Diagnostic Radiology' : 'Pathology & Lab',
    diagnosticType: data.modality,
    modality: data.modality,
    testName: data.testName,
    status: 'REQUESTED' as DiagnosticStatus,
    priority: data.priority || 'URGENT',
    requestedAt: new Date().toISOString(),
    notes: data.notes,
  };

  db.diagnostics.unshift(newRecord);

  dbService.logAudit({
    action: 'DIAGNOSTIC_ORDERED',
    entity: 'DIAGNOSTIC',
    entityId: newRecord.id,
    previousValue: 'NONE',
    newValue: 'REQUESTED',
    details: `Order created: ${newRecord.testName} for ${newRecord.patientName} (${newRecord.priority}).`,
    userName: 'Ordering Physician',
    userId: 'USR-CLINIC',
    userRole: 'CLINICAL_STAFF',
  });

  dbService.persist();
  res.status(201).json(newRecord);
});

// Diagnostic Accept / Start / Complete (Green Action)
app.post('/api/diagnostics/:id/accept', (req, res) => {
  const db = dbService.getDatabase();
  const rec = db.diagnostics.find((d) => d.id === req.params.id);
  if (!rec) return res.status(404).json({ error: 'Diagnostic record not found' });

  const { targetStatus = 'COMPLETED', resultsNotes } = req.body;
  const previousStatus = rec.status;

  rec.status = targetStatus;
  if (targetStatus === 'COMPLETED') {
    rec.completedAt = new Date().toISOString();
    rec.turnaroundTimeMinutes = Math.floor((new Date().getTime() - new Date(rec.requestedAt).getTime()) / 60000) || 25;
    rec.resultsNotes = resultsNotes || 'Findings verified by Attending Radiologist/Pathologist. Report attached.';
  }

  dbService.logAudit({
    action: 'DIAGNOSTIC_ACCEPTED',
    entity: 'DIAGNOSTIC',
    entityId: rec.id,
    previousValue: previousStatus,
    newValue: targetStatus,
    details: `[ACCEPT] Diagnostic order ${rec.testName} accepted & verified for ${rec.patientName}.`,
    userName: 'Diagnostic Specialist',
    userId: 'USR-CLINIC',
    userRole: 'CLINICAL_STAFF',
  });

  dbService.persist();
  res.json({ success: true, record: rec });
});

// Diagnostic Reject / Cancel (Red Action)
app.post('/api/diagnostics/:id/reject', (req, res) => {
  const db = dbService.getDatabase();
  const rec = db.diagnostics.find((d) => d.id === req.params.id);
  if (!rec) return res.status(404).json({ error: 'Diagnostic record not found' });

  const { reason = 'Order cancelled due to clinical contraindication or duplicate request' } = req.body;
  const previousStatus = rec.status;

  rec.status = 'CANCELLED';
  rec.resultsNotes = `Cancelled/Rejected: ${reason}`;

  dbService.logAudit({
    action: 'DIAGNOSTIC_REJECTED',
    entity: 'DIAGNOSTIC',
    entityId: rec.id,
    previousValue: previousStatus,
    newValue: 'CANCELLED',
    details: `[REJECT] Diagnostic order ${rec.testName} rejected/cancelled. Reason: ${reason}`,
    userName: 'Diagnostic Specialist',
    userId: 'USR-CLINIC',
    userRole: 'CLINICAL_STAFF',
  });

  dbService.persist();
  res.json({ success: true, record: rec, message: 'Diagnostic test rejected/cancelled' });
});

app.post('/api/diagnostics/:id/status', (req, res) => {
  const db = dbService.getDatabase();
  const rec = db.diagnostics.find((d) => d.id === req.params.id);
  if (!rec) return res.status(404).json({ error: 'Diagnostic record not found' });

  const { status, resultsNotes } = req.body;
  rec.status = status;
  if (status === 'COMPLETED') {
    rec.completedAt = new Date().toISOString();
    rec.turnaroundTimeMinutes = Math.floor((new Date().getTime() - new Date(rec.requestedAt).getTime()) / 60000) || 28;
    if (resultsNotes) rec.resultsNotes = resultsNotes;
  }

  dbService.persist();
  res.json(rec);
});

// 9. Bottlenecks
app.get('/api/bottlenecks', (req, res) => {
  const db = dbService.getDatabase();
  res.json(db.bottlenecks);
});

// Accept & Deploy Recovery Protocol (Green Action)
app.post('/api/bottlenecks/:id/accept', (req, res) => {
  const db = dbService.getDatabase();
  const { action, departmentId } = req.body;

  const dept = db.departments.find((d) => d.id === departmentId);
  if (dept) {
    dept.waitingCount = Math.max(2, dept.waitingCount - 4);
    dept.avgWaitMinutes = Math.max(16, dept.avgWaitMinutes - 18);
    dept.operationalStatus = 'OPTIMAL';
  }

  // Clear bottleneck if mitigated
  db.bottlenecks = db.bottlenecks.filter((b) => b.id !== req.params.id);

  dbService.logAudit({
    action: 'RECOVERY_PROTOCOL_ACCEPTED',
    entity: 'FLOW_RECOVERY',
    entityId: req.params.id,
    previousValue: 'CHOKE_POINT',
    newValue: 'OPTIMAL',
    details: `[ACCEPT] Protocol "${action}" accepted and deployed for ${dept?.name || departmentId}. Queue backlog cleared.`,
    userName: 'Operations Director',
    userId: 'USR-ADMIN',
    userRole: 'ADMIN',
  });

  dbService.addNotification({
    title: 'Protocol Accepted & Executed',
    message: `Protocol "${action}" deployed for ${dept?.name}. Flow restored to optimal.`,
    type: 'STAGE_ADVANCE',
    severity: 'INFO',
  });

  dbService.persist();
  res.json({ success: true, message: `Protocol "${action}" deployed successfully.` });
});

// Reject / Dismiss Bottleneck Protocol (Red Action)
app.post('/api/bottlenecks/:id/reject', (req, res) => {
  const db = dbService.getDatabase();
  const { reason = 'Protocol dismissed by operational director discretion' } = req.body;

  dbService.logAudit({
    action: 'RECOVERY_PROTOCOL_REJECTED',
    entity: 'FLOW_RECOVERY',
    entityId: req.params.id,
    previousValue: 'SUGGESTED',
    newValue: 'DISMISSED',
    details: `[REJECT] Protocol suggestion dismissed for bottleneck ${req.params.id}. Reason: ${reason}`,
    userName: 'Operations Director',
    userId: 'USR-ADMIN',
    userRole: 'ADMIN',
  });

  dbService.persist();
  res.json({ success: true, message: 'Recovery protocol dismissed.' });
});

// 10. Notifications
app.get('/api/notifications', (req, res) => {
  const db = dbService.getDatabase();
  res.json(db.notifications);
});

app.post('/api/notifications/:id/read', (req, res) => {
  const db = dbService.getDatabase();
  const n = db.notifications.find((notif) => notif.id === req.params.id);
  if (n) {
    n.isRead = true;
    dbService.persist();
  }
  res.json({ success: true });
});

app.post('/api/notifications/read-all', (req, res) => {
  const db = dbService.getDatabase();
  db.notifications.forEach((n) => (n.isRead = true));
  dbService.persist();
  res.json({ success: true });
});

// 11. Audit Logs
app.get('/api/audit-logs', (req, res) => {
  const db = dbService.getDatabase();
  res.json(db.auditLogs);
});

// 12. Reset & Surge
app.post('/api/reset', (req, res) => {
  const db = dbService.resetToSeed();
  res.json({ success: true, message: 'Database reset to baseline state.', counts: { patients: db.patients.length, beds: db.beds.length } });
});

app.post('/api/surge', (req, res) => {
  const db = dbService.getDatabase();
  const ed = db.departments.find((d) => d.id === 'DEP-EMERGENCY');
  const rad = db.departments.find((d) => d.id === 'DEP-RADIOLOGY');

  if (ed) {
    ed.waitingCount += 4;
    ed.avgWaitMinutes += 22;
    ed.operationalStatus = 'DELAYED';
  }
  if (rad) {
    rad.waitingCount += 3;
    rad.avgWaitMinutes += 28;
    rad.operationalStatus = 'DELAYED';
  }

  dbService.addNotification({
    title: 'Emergency Surge Influx Simulated',
    message: 'High acute volume admitted to ED & Radiology. Queue thresholds exceeded.',
    type: 'BOTTLENECK',
    severity: 'WARNING',
  });

  dbService.persist();
  res.json({ success: true, message: 'Surge scenario triggered.' });
});

// --- VITE & STATIC SERVING ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[NEXORA Health] Express Server & Database running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
