import React, { useState, useEffect } from 'react';
import { X, UserPlus, ShieldAlert, Check, Sparkles, AlertCircle, Phone, MapPin, HeartPulse, Building2 } from 'lucide-react';
import { OperationalPriority, Department } from '../../types';
import { api } from '../../services/api';

interface RegisterPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (patientId: string) => void;
}

const SAMPLE_PATIENTS = [
  {
    fullName: 'Eleanor Vance',
    age: 48,
    gender: 'FEMALE' as const,
    phone: '+1 (555) 234-5678',
    address: '742 Evergreen Terrace, Ward 3',
    emergencyName: 'Mark Vance',
    emergencyRelation: 'Spouse',
    emergencyPhone: '+1 (555) 876-5432',
    departmentId: 'DEP-EMERGENCY',
    priority: 'URGENT' as OperationalPriority,
    notes: 'Walk-in arrival presenting acute abdominal pain and nausea. Triage expedited.',
  },
  {
    fullName: 'Robert Chen',
    age: 62,
    gender: 'MALE' as const,
    phone: '+1 (555) 345-6789',
    address: '108 Harbor View Rd, Suite 4',
    emergencyName: 'Lisa Chen',
    emergencyRelation: 'Daughter',
    emergencyPhone: '+1 (555) 987-6543',
    departmentId: 'DEP-CARDIOLOGY',
    priority: 'CRITICAL' as OperationalPriority,
    notes: 'Referred from outpatient clinic with exertional dyspnea and irregular arrhythmia.',
  },
  {
    fullName: 'Sofia Morales',
    age: 29,
    gender: 'FEMALE' as const,
    phone: '+1 (555) 456-7890',
    address: '22 Elm Street, Apt 3B',
    emergencyName: 'Carlos Morales',
    emergencyRelation: 'Brother',
    emergencyPhone: '+1 (555) 654-3210',
    departmentId: 'DEP-GENERAL',
    priority: 'STANDARD' as OperationalPriority,
    notes: 'Routine scheduled admission for follow-up therapeutic evaluation.',
  },
];

export function RegisterPatientModal({
  isOpen,
  onClose,
  onSuccess,
}: RegisterPatientModalProps) {
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState<string>('35');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('FEMALE');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [departmentId, setDepartmentId] = useState('DEP-EMERGENCY');
  const [priority, setPriority] = useState<OperationalPriority>('STANDARD');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ id: string; name: string } | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccessInfo(null);
      setSubmitting(false);

      // Load live departments
      api.getDepartments().then((depts) => {
        if (depts && depts.length > 0) {
          setDepartments(depts);
        }
      }).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFillSample = () => {
    const sample = SAMPLE_PATIENTS[Math.floor(Math.random() * SAMPLE_PATIENTS.length)];
    setFullName(sample.fullName);
    setAge(String(sample.age));
    setGender(sample.gender);
    setPhone(sample.phone);
    setAddress(sample.address);
    setEmergencyName(sample.emergencyName);
    setEmergencyRelation(sample.emergencyRelation);
    setEmergencyPhone(sample.emergencyPhone);
    setDepartmentId(sample.departmentId);
    setPriority(sample.priority);
    setNotes(sample.notes);
    setError(null);
  };

  const resetForm = () => {
    setFullName('');
    setAge('35');
    setGender('FEMALE');
    setPhone('');
    setAddress('');
    setEmergencyName('');
    setEmergencyRelation('');
    setEmergencyPhone('');
    setDepartmentId('DEP-EMERGENCY');
    setPriority('STANDARD');
    setNotes('');
    setError(null);
    setSuccessInfo(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setError('Please provide the patient’s full legal name.');
      return;
    }

    const parsedAge = Number(age);
    if (isNaN(parsedAge) || parsedAge < 0 || parsedAge > 125) {
      setError('Please enter a valid age between 0 and 125 years.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await api.registerPatient({
        fullName: trimmedName,
        age: parsedAge,
        gender,
        phone: phone.trim() || '+1 (555) 000-0000',
        address: address.trim() || 'City Center, Ward 4',
        emergencyContact: {
          name: emergencyName.trim() || 'Next of Kin',
          relationship: emergencyRelation.trim() || 'Family',
          phone: emergencyPhone.trim() || '+1 (555) 111-2222',
        },
        departmentId: departmentId || 'DEP-EMERGENCY',
        priority,
        initialNotes: notes.trim() || 'Patient registered into hospital intake queue.',
      });

      if (!result || !result.patient) {
        throw new Error('Registration returned an invalid response. Please try again.');
      }

      setSuccessInfo({
        id: result.patient.id,
        name: result.patient.fullName,
      });

      // Brief visual confirmation before transitioning
      setTimeout(() => {
        onSuccess(result.patient.id);
        resetForm();
        onClose();
      }, 700);
    } catch (err: any) {
      console.error('Registration failed:', err);
      setError(err?.message || 'Failed to register patient. Please verify your connection.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-display">
                Register New Patient Journey
              </h2>
              <p className="text-xs text-slate-500">
                Authoritative hospital operational intake & queue registration
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Banner */}
        {successInfo && (
          <div className="p-4 bg-emerald-50 border-b border-emerald-200 flex items-center gap-3 text-emerald-900 animate-in fade-in">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <span className="font-bold">{successInfo.name}</span> registered successfully as{' '}
              <span className="font-mono font-bold bg-emerald-100 px-1 py-0.5 rounded text-emerald-800">
                #{successInfo.id}
              </span>
              . Synchronizing with operational queue...
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="m-4 mb-0 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold">Registration Error: </span>
              {error}
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Quick Auto-fill banner */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-600 font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Need to test registration quickly?</span>
            </span>
            <button
              type="button"
              onClick={handleFillSample}
              className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] transition-colors active:scale-95 border border-blue-200"
            >
              Fill Sample Patient
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Legal Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Katherine Stewart"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Age <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                max={125}
                required
                placeholder="e.g. 45"
                value={age}
                onChange={(e) => {
                  setAge(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Biological Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-700 font-medium"
              >
                <option value="FEMALE">Female</option>
                <option value="MALE">Male</option>
                <option value="OTHER">Other / Non-binary</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Phone
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="+1 (555) 321-7654"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Residential Address / Ward
              </label>
              <input
                type="text"
                placeholder="45 Elm St, Ward 4"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
              />
            </div>
          </div>

          {/* Department & Priority Section */}
          <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100 space-y-3">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-900">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Operational Routing & Clinical Priority</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Intake Department <span className="text-rose-500">*</span>
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800 font-semibold"
                >
                  {departments.length > 0 ? (
                    departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="DEP-EMERGENCY">Emergency & Trauma</option>
                      <option value="DEP-GENERAL">General Internal Medicine</option>
                      <option value="DEP-CARDIOLOGY">Cardiology Center</option>
                      <option value="DEP-RADIOLOGY">Diagnostic Radiology & Imaging</option>
                      <option value="DEP-LAB">Pathology & Diagnostic Laboratory</option>
                      <option value="DEP-SURGERY">Surgical Operations & OT</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Operational Priority <span className="text-rose-500">*</span>
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as OperationalPriority)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800 font-semibold"
                >
                  <option value="CRITICAL">🔴 Critical (Immediate Flow / Resuscitation)</option>
                  <option value="URGENT">🟠 Urgent (Expedited Triage & Bed Hold)</option>
                  <option value="STANDARD">🔵 Standard (Standard Operational Queue)</option>
                  <option value="LOW">🟢 Low (Routine Elective / Scheduled Intake)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Emergency Contact (Name & Relationship)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Contact Name (e.g. Sarah Jenkins)"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Relation (Spouse)"
                  value={emergencyRelation}
                  onChange={(e) => setEmergencyRelation(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Operational Check-in Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Patient walked in complaining of chest tightness and shortness of breath. Telemetry monitor requested."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 resize-none"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>

            <button
              type="submit"
              disabled={submitting || !fullName.trim() || !!successInfo}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Registering to Database...</span>
                </>
              ) : successInfo ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Registered!</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Accept & Confirm Registration</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
