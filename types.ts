export type UrgencyTier = 
  | 'LEVEL_1_RESUSCITATION' // Immediate life-threat (e.g. cardiac arrest, severe respiratory distress)
  | 'LEVEL_2_EMERGENT'      // High risk, severe pain/distress, confused/lethargic (e.g. chest pain, stroke symptoms)
  | 'LEVEL_3_URGENT'        // Stable vitals, needs multiple resources (e.g. acute abdominal pain, high fever)
  | 'LEVEL_4_LESS_URGENT'   // Needs 1 resource (e.g. simple laceration, sprained ankle)
  | 'LEVEL_5_NON_URGENT';   // Routine, medication refill, mild rash, checkup

export type UnderOverTriageRisk = 'LOW' | 'MEDIUM' | 'HIGH';

export type CaseStatus = 
  | 'PENDING_TRIAGE'
  | 'CLINICIAN_REVIEWED'
  | 'BOOKED'
  | 'ESCALATED_TO_ED'
  | 'DISCHARGED';

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  mrn: string; // Medical Record Number
  historyNotes?: string;
}

export interface DialogueMessage {
  id: string;
  sender: 'patient' | 'agent' | 'system';
  text: string;
  timestamp: string;
  options?: string[]; // Quick replies
}

export interface DoctorSlot {
  id: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  slotType: 'URGENT_BUFFER' | 'STANDARD_OPEN';
  isBooked: boolean;
  bookedCaseId?: string;
  facility: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  avatar: string;
  room: string;
  hospitalAffiliation: string;
  urgentSlotsReserved: number;
  standardSlotsTotal: number;
  availableNextSlot: string;
}

export interface TriageCase {
  id: string;
  patient: Patient;
  submittedAt: string; // ISO string
  timeAgoDisplay?: string;
  chiefComplaint: string;
  symptomDetails: string;
  reportedDuration: string;
  painLevel: number; // 0-10
  associatedSymptoms: string[];
  vitals?: {
    heartRate?: number;
    bloodPressure?: string;
    oxygenSat?: number;
    temperature?: number;
  };
  comorbidities: string[];
  
  // AI Triage Analysis
  urgencyTier: UrgencyTier;
  acuityScore: number; // 1 to 100 (higher = more urgent)
  slaMinutesRemaining: number; // e.g. Level 2 = 15m, Level 3 = 120m, etc.
  isEmergencyEscalation: boolean;
  emergencyReason?: string;
  clinicalRationale: string;
  
  // Avoiding Under/Over-triaging
  underOverTriageRisk: UnderOverTriageRisk;
  underOverTriageRationale: string;
  clarifyingQuestionsAsked: string[];
  
  // Specialty & Slot Matching
  recommendedSpecialty: string;
  recommendedTimeframe: string;
  assignedSlot?: DoctorSlot;
  bookedSlot?: string;
  status: CaseStatus;
  
  // Clinician governance
  clinicianOverrideTier?: UrgencyTier;
  clinicianNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  
  // Intake dialogue history
  dialogueHistory: DialogueMessage[];
  
  // FIFO vs Urgency ranking comparison metrics
  fifoPosition: number;
  urgencyPosition: number;
  fifoEstimatedWait: string;
  urgencyEstimatedWait: string;
}

export interface TriageAnalysisResult {
  urgencyTier: UrgencyTier;
  acuityScore: number;
  isEmergencyEscalation: boolean;
  emergencyReason?: string;
  recommendedSpecialty: string;
  recommendedTimeframe: string;
  clinicalRationale: string;
  underOverTriageRisk: UnderOverTriageRisk;
  underOverTriageRationale: string;
  needsClarification: boolean;
  clarifyingQuestion?: string;
  clarifyingOptions?: string[];
  suggestedAction: 'CALL_911_NOW' | 'GO_TO_ED_IMMEDIATELY' | 'SAME_DAY_SPECIALIST' | 'NEXT_DAY_APPOINTMENT' | 'ROUTINE_SCHEDULING';
}

export interface DepartmentCapacity {
  specialty: string;
  departmentHead: string;
  totalCapacity: number;
  bookedStandard: number;
  urgentBuffersTotal: number;
  urgentBuffersAvailable: number;
  currentWaitDaysStandard: number;
  currentWaitMinsUrgent: number;
}
