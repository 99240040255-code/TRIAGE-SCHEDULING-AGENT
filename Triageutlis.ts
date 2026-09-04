import { UrgencyTier, UnderOverTriageRisk, CaseStatus } from '../types.ts';

export function getTierBadge(tier: UrgencyTier) {
  switch (tier) {
    case 'LEVEL_1_RESUSCITATION':
      return {
        label: 'ESI 1 • Resuscitation',
        short: 'ESI 1',
        description: 'Immediate life-threat (Airway / Breathing / Circulation / Acute Stroke / ACS)',
        bg: 'bg-red-50/60 text-red-900 border-red-200',
        badgeBg: 'bg-red-100 text-red-700 font-bold',
        dotColor: 'bg-red-600',
        cardBorder: 'border-l-4 border-l-red-500 border-slate-200',
        numBoxBg: 'bg-red-50 text-red-600 border border-red-100',
        targetWait: 'Immediate (0 min)',
      };
    case 'LEVEL_2_EMERGENT':
      return {
        label: 'ESI 2 • Emergent',
        short: 'ESI 2',
        description: 'High risk presentation / Potential decompensation / Severe acute symptoms',
        bg: 'bg-orange-50/60 text-orange-900 border-orange-200',
        badgeBg: 'bg-orange-100 text-orange-700 font-bold',
        dotColor: 'bg-orange-500',
        cardBorder: 'border-l-4 border-l-orange-400 border-slate-200',
        numBoxBg: 'bg-orange-50 text-orange-600 border border-orange-100',
        targetWait: '< 15 minutes',
      };
    case 'LEVEL_3_URGENT':
      return {
        label: 'ESI 3 • Urgent',
        short: 'ESI 3',
        description: 'Stable vitals, multiple clinical resources indicated (Labs, Imaging, Urgent Buffer)',
        bg: 'bg-amber-50/60 text-amber-900 border-amber-200',
        badgeBg: 'bg-amber-100 text-amber-800 font-bold',
        dotColor: 'bg-amber-500',
        cardBorder: 'border-l-4 border-l-amber-400 border-slate-200',
        numBoxBg: 'bg-amber-50 text-amber-600 border border-amber-100',
        targetWait: '< 120 minutes',
      };
    case 'LEVEL_4_LESS_URGENT':
      return {
        label: 'ESI 4 • Less Urgent',
        short: 'ESI 4',
        description: 'Single diagnostic or treatment resource needed (e.g. minor injury or standard clinic)',
        bg: 'bg-blue-50/60 text-blue-900 border-blue-200',
        badgeBg: 'bg-blue-100 text-blue-700 font-bold',
        dotColor: 'bg-blue-500',
        cardBorder: 'border-l-4 border-l-blue-400 border-slate-200',
        numBoxBg: 'bg-blue-50 text-blue-600 border border-blue-100',
        targetWait: '< 24-48 hours',
      };
    case 'LEVEL_5_NON_URGENT':
      return {
        label: 'ESI 5 • Non-Urgent',
        short: 'ESI 5',
        description: 'Routine maintenance, medication refill, preventative scheduled checkup',
        bg: 'bg-slate-50 text-slate-800 border-slate-200',
        badgeBg: 'bg-slate-100 text-slate-700 font-bold',
        dotColor: 'bg-slate-400',
        cardBorder: 'border-l-4 border-l-slate-300 border-slate-200',
        numBoxBg: 'bg-slate-100 text-slate-600 border border-slate-200',
        targetWait: '3-7 days (Elective)',
      };
    default:
      return {
        label: 'Pending Assessment',
        short: 'Pending',
        description: 'Awaiting triage classification',
        bg: 'bg-slate-50 text-slate-800 border-slate-200',
        badgeBg: 'bg-slate-100 text-slate-600 font-bold',
        dotColor: 'bg-slate-400',
        cardBorder: 'border-l-4 border-l-slate-300 border-slate-200',
        numBoxBg: 'bg-slate-100 text-slate-600 border border-slate-200',
        targetWait: 'Standard',
      };
  }
}

export function getUnderOverTriageRiskBadge(risk: UnderOverTriageRisk) {
  switch (risk) {
    case 'HIGH':
      return {
        label: 'High Ambiguity Risk',
        description: 'Sparse self-reported info; requires targeted clarification to avoid under/over-triaging.',
        classes: 'bg-amber-50 text-amber-800 border border-amber-200',
      };
    case 'MEDIUM':
      return {
        label: 'Moderate Triage Risk',
        description: 'Differential diagnosis broad; clinical review recommended.',
        classes: 'bg-slate-100 text-slate-700 border border-slate-200',
      };
    case 'LOW':
      return {
        label: 'Low Misclassification Risk',
        description: 'Clear symptomatology matching clinical guidelines.',
        classes: 'bg-blue-50 text-blue-700 border border-blue-100',
      };
  }
}

export function getStatusBadge(status: CaseStatus) {
  switch (status) {
    case 'PENDING_TRIAGE':
      return {
        label: 'Needs Care Review',
        classes: 'bg-amber-50 text-amber-800 border border-amber-200 font-semibold',
      };
    case 'CLINICIAN_REVIEWED':
      return {
        label: 'Clinician Validated',
        classes: 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold',
      };
    case 'BOOKED':
      return {
        label: 'Buffer Slot Booked',
        classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold',
      };
    case 'ESCALATED_TO_ED':
      return {
        label: 'Escalated to 911 / ED',
        classes: 'bg-red-600 text-white font-bold tracking-tight',
      };
    case 'DISCHARGED':
      return {
        label: 'Completed',
        classes: 'bg-slate-100 text-slate-600 border border-slate-200',
      };
  }
}
