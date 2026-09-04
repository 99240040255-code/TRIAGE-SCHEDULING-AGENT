import React, { useState } from 'react';
import { 
  TriageCase, 
  UrgencyTier, 
  CaseStatus 
} from '../types.ts';
import { 
  getTierBadge, 
  getUnderOverTriageRiskBadge, 
  getStatusBadge 
} from '../utils/triageUtils.ts';
import { 
  X, 
  AlertTriangle, 
  Siren, 
  Clock, 
  User, 
  Activity, 
  CheckCircle2, 
  HeartPulse, 
  Calendar, 
  FileText, 
  ChevronRight,
  ShieldAlert,
  PhoneCall,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';

interface CaseDetailModalProps {
  triageCase: TriageCase | null;
  onClose: () => void;
  onUpdateCase: (id: string, updates: Partial<TriageCase>) => Promise<void>;
  onBookSlot: (id: string, slotDesc: string) => Promise<void>;
  onEscalateED: (id: string, reason: string) => Promise<void>;
}

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({
  triageCase,
  onClose,
  onUpdateCase,
  onBookSlot,
  onEscalateED,
}) => {
  if (!triageCase) return null;

  const [overrideTier, setOverrideTier] = useState<UrgencyTier>(
    triageCase.clinicianOverrideTier || triageCase.urgencyTier
  );
  const [clinicianNotes, setClinicianNotes] = useState(triageCase.clinicianNotes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const tierBadge = getTierBadge(triageCase.urgencyTier);
  const riskBadge = getUnderOverTriageRiskBadge(triageCase.underOverTriageRisk);
  const statusBadge = getStatusBadge(triageCase.status);

  const handleSaveClinicianReview = async () => {
    setIsSubmitting(true);
    try {
      await onUpdateCase(triageCase.id, {
        clinicianOverrideTier: overrideTier,
        clinicianNotes,
        status: 'CLINICIAN_REVIEWED' as CaseStatus,
      });
      setSuccessMessage('Clinician evaluation saved and priority queue updated.');
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmSlot = async () => {
    setIsSubmitting(true);
    const slotString = triageCase.bookedSlot || `Today Urgent Slot with ${triageCase.recommendedSpecialty}`;
    try {
      await onBookSlot(triageCase.id, slotString);
      setSuccessMessage('Specialist appointment locked & confirmed in patient record.');
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmergencyEscalate = async () => {
    const confirm = window.confirm(
      `ESCALATION PROTOCOL WARNING:\nAre you sure you want to escalate ${triageCase.patient.name} directly to 911 / Emergency Department Rapid Response?\nThis bypasses standard scheduling.`
    );
    if (!confirm) return;

    setIsSubmitting(true);
    try {
      await onEscalateED(
        triageCase.id,
        'Direct Clinician Escalation: Patient requires immediate emergency department transfer.'
      );
      setSuccessMessage('Patient successfully escalated to ED Rapid Response.');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-white text-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 border border-blue-100 rounded-lg text-blue-600">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Case Review: {triageCase.id}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusBadge.classes}`}>
                  {statusBadge.label}
                </span>
                {triageCase.isEmergencyEscalation && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-600 text-white flex items-center gap-1">
                    <Siren className="w-3 h-3 animate-pulse" /> Code Red Flag
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Submitted {triageCase.timeAgoDisplay || 'recently'} • Medical Record: {triageCase.patient.mrn}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert Banner */}
        {successMessage && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 text-xs text-emerald-800 flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Top Grid: Patient Demographics & Urgency vs FIFO Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Patient Card */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Patient Demographics
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-base">{triageCase.patient.name}</span>
                  <span className="text-xs text-slate-500 font-medium">
                    ({triageCase.patient.age}y, {triageCase.patient.gender})
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">Phone: {triageCase.patient.phone}</p>
                <div className="mt-2 text-xs">
                  <span className="font-medium text-slate-700">Comorbidities: </span>
                  <span className="text-slate-600">
                    {triageCase.comorbidities?.length ? triageCase.comorbidities.join(', ') : 'None documented'}
                  </span>
                </div>
              </div>

              {/* Vitals strip */}
              {triageCase.vitals && (
                <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Heart Rate</span>
                    <p className="font-semibold text-slate-800">{triageCase.vitals.heartRate ?? '—'} bpm</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Blood Press</span>
                    <p className="font-semibold text-slate-800">{triageCase.vitals.bloodPressure ?? '—'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">O2 Sat</span>
                    <p className="font-semibold text-slate-800">{triageCase.vitals.oxygenSat ?? '—'}%</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Temp</span>
                    <p className="font-semibold text-slate-800">{triageCase.vitals.temperature ?? '—'}°C</p>
                  </div>
                </div>
              )}
            </div>

            {/* Urgency Acuity Card */}
            <div className={`p-4 rounded-xl border ${tierBadge.cardBorder} ${tierBadge.bg} flex flex-col justify-between shadow-xs`}>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                    Urgency Classification
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${tierBadge.badgeBg}`}>
                    {tierBadge.short}
                  </span>
                </div>
                <div className="mt-2">
                  <h3 className="text-base font-extrabold tracking-tight text-slate-900">{tierBadge.label}</h3>
                  <p className="text-xs mt-1 text-slate-600 leading-relaxed">{tierBadge.description}</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-700">
                <div>
                  <span className="block opacity-75 text-[10px] uppercase font-semibold">Clinical Acuity</span>
                  <span className="font-extrabold text-sm">{triageCase.acuityScore} / 100</span>
                </div>
                <div className="text-right">
                  <span className="block opacity-75 text-[10px] uppercase font-semibold">Target SLA</span>
                  <span className="font-bold">{tierBadge.targetWait}</span>
                </div>
              </div>
            </div>

            {/* FIFO vs Urgency Scheduling Comparison (Addresses Problem 5) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-slate-700">
                  <ArrowUpDown className="w-4 h-4 text-blue-600" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Queue Impact Comparison
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Contrast between traditional first-come and urgency-stratified routing:
                </p>

                <div className="mt-3 space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200">
                    <div className="flex justify-between font-semibold text-amber-900">
                      <span>Traditional FIFO:</span>
                      <span>Queue Position #{triageCase.fifoPosition}</span>
                    </div>
                    <p className="text-[11px] text-amber-800 mt-0.5">Wait: {triageCase.fifoEstimatedWait}</p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200">
                    <div className="flex justify-between font-semibold text-emerald-900">
                      <span>AI Urgency Queue:</span>
                      <span>Queue Position #{triageCase.urgencyPosition}</span>
                    </div>
                    <p className="text-[11px] text-emerald-800 mt-0.5 font-medium">Wait: {triageCase.urgencyEstimatedWait}</p>
                  </div>
                </div>
              </div>

              <span className="text-[10px] text-slate-400 mt-2 block">
                Urgent buffers prevent acute patients waiting behind routine visits.
              </span>
            </div>
          </div>

          {/* Chief Complaint & Symptoms */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Stated Chief Complaint & Intake Findings
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Reported Pain: {triageCase.painLevel} / 10
              </span>
            </div>

            <p className="text-sm font-semibold text-slate-800 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              "{triageCase.chiefComplaint}"
            </p>

            <div className="text-xs text-slate-600 space-y-1">
              <p>
                <strong className="text-slate-800">Onset & Details: </strong>
                {triageCase.symptomDetails}
              </p>
              <p>
                <strong className="text-slate-800">Duration: </strong>
                {triageCase.reportedDuration}
              </p>
              {triageCase.associatedSymptoms?.length > 0 && (
                <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                  <strong className="text-slate-800">Associated Symptoms: </strong>
                  {triageCase.associatedSymptoms.map((sym, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-medium">
                      {sym}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Under/Over-Triage Risk Mitigation */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-slate-900 text-sm">
                  Misclassification Safeguard (Under/Over-Triage Analysis)
                </h4>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${riskBadge.classes}`}>
                {riskBadge.label}
              </span>
            </div>

            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              <strong className="text-slate-800">Clinical Guardrail Rationale: </strong>
              {triageCase.underOverTriageRationale}
            </p>

            {triageCase.clarifyingQuestionsAsked?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Targeted Clarifications Asked During Intake:
                </span>
                <ul className="space-y-1">
                  {triageCase.clarifyingQuestionsAsked.map((q, idx) => (
                    <li key={idx} className="text-xs text-slate-600 flex items-start gap-1.5">
                      <ChevronRight className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Clinical Rationale & Specialist Matching */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Specialist & Time Slot Recommendation
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-blue-700">Target Specialty</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{triageCase.recommendedSpecialty}</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Matched via complaint etiology and anatomical presentation.
                </p>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
                <span className="text-[10px] uppercase font-bold text-blue-700">Assigned Timeframe</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{triageCase.recommendedTimeframe}</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {triageCase.bookedSlot || 'Recommended priority slot in Urgent Reserve Buffer'}
                </p>
              </div>
            </div>

            <div className="mt-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs text-xs">
              <span className="text-[10px] uppercase font-bold text-blue-700">AI Clinical Justification</span>
              <p className="text-slate-700 mt-1 leading-relaxed">{triageCase.clinicalRationale}</p>
            </div>
          </div>

          {/* Dialogue History Transcript */}
          {triageCase.dialogueHistory?.length > 0 && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <h4 className="font-bold text-slate-900 text-[10px] uppercase tracking-widest mb-2">
                Patient Intake Conversation Log
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                {triageCase.dialogueHistory.map((m) => (
                  <div
                    key={m.id}
                    className={`text-xs p-2.5 rounded-lg ${
                      m.sender === 'agent'
                        ? 'bg-blue-50 text-blue-900 border border-blue-100 ml-4'
                        : 'bg-slate-50 text-slate-800 border border-slate-200 mr-4'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                      <span className="font-semibold capitalize">{m.sender === 'agent' ? 'Intake Agent' : triageCase.patient.name}</span>
                      <span>{m.timestamp}</span>
                    </div>
                    <p>{m.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clinician Governance: Override Urgency Tier & Add Clinical Notes */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-blue-600" />
                Clinician Triage Governance & Override
              </h4>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Staff: Nurse / Attending Physician
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Urgency Tier (Clinician Override)
                </label>
                <select
                  value={overrideTier}
                  onChange={(e) => setOverrideTier(e.target.value as UrgencyTier)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50/60 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                >
                  <option value="LEVEL_1_RESUSCITATION">ESI 1 • Resuscitation (Immediate Life-Threat)</option>
                  <option value="LEVEL_2_EMERGENT">ESI 2 • Emergent (High Risk / ACS / Stroke / Severe Pain)</option>
                  <option value="LEVEL_3_URGENT">ESI 3 • Urgent (Multiple Resources / Abdominal / Fever)</option>
                  <option value="LEVEL_4_LESS_URGENT">ESI 4 • Less Urgent (Single Resource / Minor Injury)</option>
                  <option value="LEVEL_5_NON_URGENT">ESI 5 • Non-Urgent (Routine Maintenance / Refill)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Adjusting the tier dynamically updates patient queue ranking and SLA alarms.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Clinician Review Notes / Orders
                </label>
                <textarea
                  value={clinicianNotes}
                  onChange={(e) => setClinicianNotes(e.target.value)}
                  placeholder="e.g. Order stat 12-lead ECG, notify on-call cardiologist, hold oral fluids..."
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50/60 focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 text-slate-800"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleEmergencyEscalate}
                disabled={isSubmitting}
                className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Siren className="w-4 h-4" />
                <span>Escalate Immediately to 911 / ED</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveClinicianReview}
                  disabled={isSubmitting}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Save Notes & Tier
                </button>

                <button
                  type="button"
                  onClick={handleConfirmSlot}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Lock & Book Urgent Buffer Slot</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>St. Jude Ambulatory Health • HIPAA Compliant Decision Support</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg font-medium transition-colors shadow-xs"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
