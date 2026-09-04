import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

import { TriageCase, CaseStatus } from './src/types.ts';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client with required User-Agent
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Initial clinical dataset showing traditional FIFO vs Urgency-Stratified Scheduling
let triageCases: TriageCase[] = [
  {
    id: 'CASE-101',
    patient: {
      id: 'PT-801',
      name: 'Eleanor Vance',
      age: 62,
      gender: 'Female',
      phone: '(555) 234-8901',
      mrn: 'MRN-90281',
      historyNotes: 'Hypertension, Type 2 Diabetes, Hyperlipidemia',
    },
    submittedAt: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
    timeAgoDisplay: '28m ago',
    chiefComplaint: 'Substernal chest tightness radiating to left jaw',
    symptomDetails: 'Began 45 minutes ago while walking uphill. Feels like heavy pressure. Associated with mild shortness of breath and cold sweat. Took 1 aspirin at home.',
    reportedDuration: '45 minutes',
    painLevel: 8,
    associatedSymptoms: ['Shortness of breath', 'Diaphoresis', 'Jaw pain', 'Nausea'],
    vitals: {
      heartRate: 104,
      bloodPressure: '158/96',
      oxygenSat: 96,
      temperature: 37.0,
    },
    comorbidities: ['Type 2 Diabetes', 'Hypertension'],
    urgencyTier: 'LEVEL_2_EMERGENT',
    acuityScore: 94,
    slaMinutesRemaining: 12,
    isEmergencyEscalation: false,
    clinicalRationale: 'High clinical suspicion for Acute Coronary Syndrome (ACS) given classic radiation to jaw, diaphoresis, and diabetic vascular risk profile. Requires immediate ECG and urgent cardiology evaluation within 15 minutes.',
    underOverTriageRisk: 'LOW',
    underOverTriageRationale: 'Classic ischemic presentation with autonomic symptoms and elevated cardiovascular risk markers.',
    clarifyingQuestionsAsked: ['Did pain radiate to left arm, neck, or jaw?', 'Are you experiencing dizziness or cold sweating?'],
    recommendedSpecialty: 'Cardiology / Acute Care',
    recommendedTimeframe: 'Immediate (< 15 min priority slot)',
    status: 'PENDING_TRIAGE',
    dialogueHistory: [
      { id: 'm1', sender: 'agent', text: 'Hello Eleanor, what symptoms are prompting your visit today?', timestamp: '28m ago' },
      { id: 'm2', sender: 'patient', text: 'I have this heavy tightness in the center of my chest that started walking up the stairs.', timestamp: '27m ago' },
      { id: 'm3', sender: 'agent', text: 'Does this tightness spread anywhere like your left arm, neck, or jaw? And are you sweating or nauseous?', timestamp: '26m ago' },
      { id: 'm4', sender: 'patient', text: 'Yes, it aches up into my left jaw and my palms are cold and clammy.', timestamp: '25m ago' }
    ],
    fifoPosition: 4,
    urgencyPosition: 1,
    fifoEstimatedWait: '3 days (Next available general slot)',
    urgencyEstimatedWait: 'Immediate (Reserved Urgent Buffer Slot)'
  },
  {
    id: 'CASE-102',
    patient: {
      id: 'PT-802',
      name: 'Marcus Chen',
      age: 28,
      gender: 'Male',
      phone: '(555) 789-3412',
      mrn: 'MRN-44109',
      historyNotes: 'No chronic conditions, non-smoker',
    },
    submittedAt: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
    timeAgoDisplay: '1h 35m ago',
    chiefComplaint: 'Severe sharp pain in right lower abdomen with nausea',
    symptomDetails: 'Started around belly button 12 hours ago, now localized to right lower quadrant. Hurts severely to cough or jump. Low-grade fever 38.2°C.',
    reportedDuration: '12 hours',
    painLevel: 9,
    associatedSymptoms: ['Fever', 'Anorexia', 'Nausea', 'Localized rebound pain'],
    vitals: {
      heartRate: 98,
      bloodPressure: '126/82',
      oxygenSat: 99,
      temperature: 38.2,
    },
    comorbidities: ['None'],
    urgencyTier: 'LEVEL_3_URGENT',
    acuityScore: 82,
    slaMinutesRemaining: 45,
    isEmergencyEscalation: false,
    clinicalRationale: 'Classic migration of periumbilical pain to McBurney point with fever and anorexia suggests acute appendicitis. Needs ultrasound/CT surgical evaluation within 2 hours.',
    underOverTriageRisk: 'MEDIUM',
    underOverTriageRationale: 'Self-reported abdominal pain can sometimes mimic uncomplicated gastroenteritis, but focal RLQ localization and fever necessitate prompt evaluation.',
    clarifyingQuestionsAsked: ['Did the pain move from your belly button to your right lower side?', 'Has your appetite decreased?'],
    recommendedSpecialty: 'General Surgery / Urgent Evaluation',
    recommendedTimeframe: 'Urgent Same-Day (< 2 hours)',
    status: 'CLINICIAN_REVIEWED',
    dialogueHistory: [
      { id: 'm1', sender: 'agent', text: 'Hello Marcus, tell me about what you are feeling.', timestamp: '1h 35m ago' },
      { id: 'm2', sender: 'patient', text: 'My stomach hurts really bad down on the right side. I threw up this morning.', timestamp: '1h 33m ago' }
    ],
    fifoPosition: 1,
    urgencyPosition: 2,
    fifoEstimatedWait: 'Today 2:00 PM',
    urgencyEstimatedWait: 'Within 45 min'
  },
  {
    id: 'CASE-103',
    patient: {
      id: 'PT-803',
      name: 'Arthur Pendelton',
      age: 71,
      gender: 'Male',
      phone: '(555) 901-4433',
      mrn: 'MRN-78120',
      historyNotes: 'Atrial fibrillation, on anticoagulant therapy',
    },
    submittedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    timeAgoDisplay: '15m ago',
    chiefComplaint: 'Sudden weakness in right hand and mild slurring of words',
    symptomDetails: 'Wife noticed he was dropping his coffee cup 20 minutes ago. When asked what was wrong, speech sounded slightly garbled.',
    reportedDuration: '20 minutes',
    painLevel: 0,
    associatedSymptoms: ['Unilateral limb weakness', 'Dysarthria', 'Facial asymmetry'],
    vitals: {
      heartRate: 88,
      bloodPressure: '172/102',
      oxygenSat: 97,
      temperature: 36.8,
    },
    comorbidities: ['Atrial Fibrillation', 'Stroke History'],
    urgencyTier: 'LEVEL_1_RESUSCITATION',
    acuityScore: 99,
    slaMinutesRemaining: 0,
    isEmergencyEscalation: true,
    emergencyReason: 'CRITICAL STROKE ALERT: Acute focal neurological deficits within tPA thrombolysis therapeutic window (< 4.5 hours). Requires immediate 911 activation / Code Stroke ED redirect, NOT outpatient clinic scheduling.',
    clinicalRationale: 'Acute focal neurological deficit in high-risk patient on anticoagulants. High suspicion for acute ischemic stroke vs intracranial hemorrhage.',
    underOverTriageRisk: 'LOW',
    underOverTriageRationale: 'Clear objective FAST symptoms requiring immediate protocol diversion.',
    clarifyingQuestionsAsked: ['Can Arthur smile evenly and raise both arms without one drifting down?'],
    recommendedSpecialty: 'Emergency Department / Stroke Center',
    recommendedTimeframe: 'IMMEDIATE EMERGENCY ESCALATION',
    status: 'ESCALATED_TO_ED',
    dialogueHistory: [
      { id: 'm1', sender: 'agent', text: 'Please describe the most pressing symptom.', timestamp: '15m ago' },
      { id: 'm2', sender: 'patient', text: 'My husband dropped his cup and his words sound slurry.', timestamp: '14m ago' },
      { id: 'm3', sender: 'agent', text: 'EMERGENCY PROTOCOL TRIGGERED: Connecting to emergency dispatcher and alerting clinic triage nurse immediately.', timestamp: '13m ago' }
    ],
    fifoPosition: 5,
    urgencyPosition: 0,
    fifoEstimatedWait: '4 days (Under FIFO would have missed stroke window!)',
    urgencyEstimatedWait: 'Immediate Emergency Diversion'
  },
  {
    id: 'CASE-104',
    patient: {
      id: 'PT-804',
      name: 'Maya Lin',
      age: 34,
      gender: 'Female',
      phone: '(555) 443-1289',
      mrn: 'MRN-33019',
      historyNotes: 'Mild asthma, seasonal allergies',
    },
    submittedAt: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
    timeAgoDisplay: '2h 20m ago',
    chiefComplaint: 'Right knee twisted while playing soccer, moderate swelling',
    symptomDetails: 'Felt a pop yesterday afternoon. Able to put weight on leg with limp. No bone deformities or open wounds.',
    reportedDuration: '24 hours',
    painLevel: 5,
    associatedSymptoms: ['Joint swelling', 'Mild joint instability'],
    vitals: {
      heartRate: 74,
      bloodPressure: '118/76',
      oxygenSat: 99,
      temperature: 36.6,
    },
    comorbidities: ['None'],
    urgencyTier: 'LEVEL_4_LESS_URGENT',
    acuityScore: 42,
    slaMinutesRemaining: 180,
    isEmergencyEscalation: false,
    clinicalRationale: 'Likely ligamentous or meniscal strain/sprain. Weight-bearing intact with neurovascular integrity. Safe for outpatient sub-acute orthopedic slot within 24-48 hours.',
    underOverTriageRisk: 'LOW',
    underOverTriageRationale: 'Clear localized mechanism of injury without vascular compromise or inability to ambulate.',
    clarifyingQuestionsAsked: ['Can you bear weight on the knee?', 'Did you hear or feel a loud pop?'],
    recommendedSpecialty: 'Orthopedics / Sports Medicine',
    recommendedTimeframe: 'Within 24-48 hours',
    status: 'BOOKED',
    bookedSlot: 'Tomorrow at 10:30 AM with Dr. Gregory Vance',
    dialogueHistory: [
      { id: 'm1', sender: 'agent', text: 'Tell us what happened to your knee.', timestamp: '2h 20m ago' },
      { id: 'm2', sender: 'patient', text: 'Twisted it turning during soccer yesterday. It swollen and sore but I can limp on it.', timestamp: '2h 18m ago' }
    ],
    fifoPosition: 2,
    urgencyPosition: 4,
    fifoEstimatedWait: 'Today 3:30 PM (Displacing urgent patients)',
    urgencyEstimatedWait: 'Tomorrow 10:30 AM (Appropriate sub-acute slot)'
  },
  {
    id: 'CASE-105',
    patient: {
      id: 'PT-805',
      name: 'David Reynolds',
      age: 51,
      gender: 'Male',
      phone: '(555) 671-8890',
      mrn: 'MRN-19042',
      historyNotes: 'Controlled hyperlipidemia',
    },
    submittedAt: new Date(Date.now() - 210 * 60 * 1000).toISOString(),
    timeAgoDisplay: '3h 30m ago',
    chiefComplaint: 'Annual checkup & refill for Atorvastatin cholesterol medication',
    symptomDetails: 'No current symptoms. Needs routine 90-day lab work and maintenance medication refill.',
    reportedDuration: 'Ongoing maintenance',
    painLevel: 0,
    associatedSymptoms: [],
    vitals: {
      heartRate: 70,
      bloodPressure: '122/78',
      oxygenSat: 99,
      temperature: 36.7,
    },
    comorbidities: ['Hyperlipidemia'],
    urgencyTier: 'LEVEL_5_NON_URGENT',
    acuityScore: 15,
    slaMinutesRemaining: 1440,
    isEmergencyEscalation: false,
    clinicalRationale: 'Routine asymptomatic preventive health & chronic medication maintenance. Appropriate for standard elective primary care appointment.',
    underOverTriageRisk: 'LOW',
    underOverTriageRationale: 'Completely asymptomatic maintenance request.',
    clarifyingQuestionsAsked: ['Are you experiencing any side effects or new symptoms since last visit?'],
    recommendedSpecialty: 'Primary Care / Internal Medicine',
    recommendedTimeframe: 'Routine Scheduling (3 - 7 days)',
    status: 'PENDING_TRIAGE',
    dialogueHistory: [
      { id: 'm1', sender: 'agent', text: 'How can we help you today?', timestamp: '3h 30m ago' },
      { id: 'm2', sender: 'patient', text: 'I just need my annual bloodwork and cholesterol refill renewed.', timestamp: '3h 28m ago' }
    ],
    fifoPosition: 3,
    urgencyPosition: 5,
    fifoEstimatedWait: 'Today 4:15 PM (Taking urgent slot under FIFO)',
    urgencyEstimatedWait: 'Friday 9:00 AM (Appropriate routine slot)'
  }
];

// Department capacity and reserved urgent buffers
const departmentCapacities = [
  {
    specialty: 'Cardiology',
    departmentHead: 'Dr. Sarah Al-Mansoor, MD, FACC',
    totalCapacity: 24,
    bookedStandard: 18,
    urgentBuffersTotal: 6,
    urgentBuffersAvailable: 4,
    currentWaitDaysStandard: 8.5,
    currentWaitMinsUrgent: 14,
  },
  {
    specialty: 'Neurology / Stroke',
    departmentHead: 'Dr. Julian Thorne, MD, PhD',
    totalCapacity: 16,
    bookedStandard: 12,
    urgentBuffersTotal: 4,
    urgentBuffersAvailable: 2,
    currentWaitDaysStandard: 12.0,
    currentWaitMinsUrgent: 10,
  },
  {
    specialty: 'General Surgery / Acute Abdomen',
    departmentHead: 'Dr. Rebecca Sterling, MD, FACS',
    totalCapacity: 20,
    bookedStandard: 15,
    urgentBuffersTotal: 5,
    urgentBuffersAvailable: 3,
    currentWaitDaysStandard: 5.0,
    currentWaitMinsUrgent: 35,
  },
  {
    specialty: 'Orthopedics & Sports Medicine',
    departmentHead: 'Dr. Gregory Vance, MD, FAAOS',
    totalCapacity: 30,
    bookedStandard: 26,
    urgentBuffersTotal: 4,
    urgentBuffersAvailable: 3,
    currentWaitDaysStandard: 4.2,
    currentWaitMinsUrgent: 60,
  },
  {
    specialty: 'Primary Care / Urgent Walk-in',
    departmentHead: 'Dr. Kevin Patel, MD',
    totalCapacity: 50,
    bookedStandard: 42,
    urgentBuffersTotal: 8,
    urgentBuffersAvailable: 5,
    currentWaitDaysStandard: 2.1,
    currentWaitMinsUrgent: 25,
  },
  {
    specialty: 'Pulmonology',
    departmentHead: 'Dr. Evelyn Morales, MD, FCCP',
    totalCapacity: 18,
    bookedStandard: 14,
    urgentBuffersTotal: 4,
    urgentBuffersAvailable: 3,
    currentWaitDaysStandard: 6.4,
    currentWaitMinsUrgent: 30,
  }
];

// Available specialist doctor roster with reserved urgent buffer slots
const doctorsList = [
  {
    id: 'DOC-1',
    name: 'Dr. Sarah Al-Mansoor',
    specialty: 'Cardiology',
    avatar: 'https://images.unsplash.com/photo-1594824813589-40898497645d?auto=format&fit=crop&q=80&w=200',
    room: 'Suite 302, Heart Center',
    hospitalAffiliation: 'St. Jude Academic Medical Center',
    urgentSlotsReserved: 4,
    standardSlotsTotal: 18,
    availableNextSlot: 'Today 11:15 AM (Urgent Buffer)',
  },
  {
    id: 'DOC-2',
    name: 'Dr. Julian Thorne',
    specialty: 'Neurology / Stroke',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200',
    room: 'Pavilion B, Neuro Clinic',
    hospitalAffiliation: 'St. Jude Academic Medical Center',
    urgentSlotsReserved: 2,
    standardSlotsTotal: 12,
    availableNextSlot: 'Today 11:30 AM (Urgent Buffer)',
  },
  {
    id: 'DOC-3',
    name: 'Dr. Rebecca Sterling',
    specialty: 'General Surgery / Acute Abdomen',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200',
    room: 'Suite 410, Surgical Wing',
    hospitalAffiliation: 'St. Jude Academic Medical Center',
    urgentSlotsReserved: 3,
    standardSlotsTotal: 15,
    availableNextSlot: 'Today 1:00 PM (Urgent Buffer)',
  },
  {
    id: 'DOC-4',
    name: 'Dr. Gregory Vance',
    specialty: 'Orthopedics & Sports Medicine',
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200',
    room: 'Sports Clinic Room 12',
    hospitalAffiliation: 'Orthopedic Specialty Pavilion',
    urgentSlotsReserved: 3,
    standardSlotsTotal: 26,
    availableNextSlot: 'Tomorrow 10:30 AM (Standard Slot)',
  },
  {
    id: 'DOC-5',
    name: 'Dr. Kevin Patel',
    specialty: 'Primary Care / Urgent Walk-in',
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200',
    room: 'Outpatient Clinic 101',
    hospitalAffiliation: 'Community Health Annex',
    urgentSlotsReserved: 5,
    standardSlotsTotal: 42,
    availableNextSlot: 'Today 2:45 PM (Standard Open)',
  }
];

// Fallback rule-based clinical triage engine if AI key is absent or network fails
function evaluateClinicalTriageRuleBased(complaint: string, dialogueText: string, painLevel: number = 5): any {
  const text = `${complaint} ${dialogueText}`.toLowerCase();

  // 1. Critical Red Flag Emergency Detection (ESI 1 or immediate ED escalation)
  if (
    text.includes('slur') ||
    text.includes('stroke') ||
    text.includes('face droop') ||
    text.includes('can’t speak') ||
    text.includes('cannot speak') ||
    text.includes('paralysis') ||
    text.includes('unconscious') ||
    text.includes('unresponsive') ||
    text.includes('worst headache of my life') ||
    text.includes('thunderclap') ||
    text.includes('blue lips') ||
    text.includes('cyanosis') ||
    text.includes('choking') ||
    text.includes('anaphylaxis') ||
    (text.includes('throat') && text.includes('closing'))
  ) {
    return {
      urgencyTier: 'LEVEL_1_RESUSCITATION',
      acuityScore: 98,
      isEmergencyEscalation: true,
      emergencyReason: 'CRITICAL EMERGENCY RED FLAG: Symptoms indicate immediate life-threat or time-sensitive stroke/neurological/airway emergency. Patient must call 911 or report to the nearest Emergency Department immediately.',
      recommendedSpecialty: 'Emergency Department / Rapid Response',
      recommendedTimeframe: 'IMMEDIATE (0 min - Do not book outpatient slot)',
      clinicalRationale: 'Immediate airway, breathing, circulation, or time-critical neurovascular event requiring emergency transport and stabilization.',
      underOverTriageRisk: 'LOW',
      underOverTriageRationale: 'Clear unmistakable objective red-flag presentation matching clinical emergency guidelines.',
      needsClarification: false,
      suggestedAction: 'CALL_911_NOW'
    };
  }

  // 2. High Urgency Emergent (ESI 2 - Chest pain, severe dyspnea, acute high distress)
  if (
    text.includes('chest pain') ||
    text.includes('chest pressure') ||
    text.includes('chest tightness') ||
    text.includes('heart attack') ||
    (text.includes('short of breath') && painLevel >= 6) ||
    text.includes('coughing blood') ||
    text.includes('hemoptysis') ||
    (text.includes('fainted') && text.includes('chest'))
  ) {
    return {
      urgencyTier: 'LEVEL_2_EMERGENT',
      acuityScore: 92,
      isEmergencyEscalation: false,
      recommendedSpecialty: 'Cardiology / Acute Medical Evaluation',
      recommendedTimeframe: 'Priority Same-Day Urgent Buffer (< 15-30 min)',
      clinicalRationale: 'High clinical suspicion for Acute Coronary Syndrome (ACS) or acute cardiopulmonary compromise. Requires continuous telemetry, immediate ECG, and physician bedside triage.',
      underOverTriageRisk: 'LOW',
      underOverTriageRationale: 'High-risk cardiopulmonary presentation that cannot wait in a standard first-come-first-served queue without grave morbidity risk.',
      needsClarification: false,
      suggestedAction: 'SAME_DAY_SPECIALIST'
    };
  }

  // 3. ESI 3 - Urgent (Severe localized abdominal pain, high fever with stiff neck, suspected fracture)
  if (
    text.includes('appendix') ||
    (text.includes('abdominal pain') && painLevel >= 6) ||
    text.includes('stomach pain') && (text.includes('vomit') || text.includes('fever')) ||
    (text.includes('fever') && text.includes('stiff neck')) ||
    text.includes('kidney stone') ||
    (text.includes('pain') && painLevel >= 8)
  ) {
    return {
      urgencyTier: 'LEVEL_3_URGENT',
      acuityScore: 78,
      isEmergencyEscalation: false,
      recommendedSpecialty: 'General Surgery / Urgent Care Evaluation',
      recommendedTimeframe: 'Urgent Slot (< 2-4 hours)',
      clinicalRationale: 'Acute visceral pain or systemic sign requiring diagnostic imaging (CT/US), IV fluids, or surgical consultation to prevent secondary complications.',
      underOverTriageRisk: 'MEDIUM',
      underOverTriageRationale: 'Self-reported abdominal and systemic distress can vary from benign cramps to surgical emergencies; targeted clinical clarification is advised.',
      needsClarification: false,
      suggestedAction: 'SAME_DAY_SPECIALIST'
    };
  }

  // 4. Ambiguity / Clarification Needed Check (Preventing under/over-triaging)
  if (
    (text.includes('dizzy') || text.includes('dizziness') || text.includes('headache') || text.includes('stomach')) &&
    !text.includes('duration') &&
    text.length < 50
  ) {
    return {
      urgencyTier: 'LEVEL_4_LESS_URGENT',
      acuityScore: 48,
      isEmergencyEscalation: false,
      recommendedSpecialty: 'Primary Care / Urgent Walk-in',
      recommendedTimeframe: 'Within 24 hours (pending clarification)',
      clinicalRationale: 'Vague non-specific symptom reported. Additional targeted questions required to rule out central vertigo, cardiac syncope, or acute intracranial pathology.',
      underOverTriageRisk: 'HIGH',
      underOverTriageRationale: 'High risk of under-triaging a serious condition or over-triaging a benign one based on sparse self-reported words.',
      needsClarification: true,
      clarifyingQuestion: 'To help us match the right doctor, does the room feel like it is spinning around you (vertigo), or do you feel lightheaded like you might faint when standing up?',
      clarifyingOptions: [
        'Room is spinning (Vertigo)',
        'Lightheaded when standing up',
        'Have chest fluttering or nausea',
        'Just feeling fatigued / mild'
      ],
      suggestedAction: 'NEXT_DAY_APPOINTMENT'
    };
  }

  // 5. ESI 4 - Less Urgent (Musculoskeletal sprain, minor laceration, earache, mild infection)
  if (
    text.includes('twist') ||
    text.includes('sprain') ||
    text.includes('knee') ||
    text.includes('ankle') ||
    text.includes('wrist') ||
    text.includes('sore throat') ||
    text.includes('ear pain') ||
    text.includes('pink eye') ||
    text.includes('uti') ||
    text.includes('burn')
  ) {
    return {
      urgencyTier: 'LEVEL_4_LESS_URGENT',
      acuityScore: 40,
      isEmergencyEscalation: false,
      recommendedSpecialty: text.includes('knee') || text.includes('ankle') ? 'Orthopedics & Sports Medicine' : 'Primary Care / Walk-in Clinic',
      recommendedTimeframe: 'Next 24 to 48 hours',
      clinicalRationale: 'Single resource need (X-ray or simple prescription). Patient is hemodynamically stable without neurovascular compromise.',
      underOverTriageRisk: 'LOW',
      underOverTriageRationale: 'Isolated peripheral complaint with stable vital status.',
      needsClarification: false,
      suggestedAction: 'NEXT_DAY_APPOINTMENT'
    };
  }

  // 6. ESI 5 - Non-Urgent (Refill, routine checkup, mild rash, wart, wellness)
  return {
    urgencyTier: 'LEVEL_5_NON_URGENT',
    acuityScore: 18,
    isEmergencyEscalation: false,
    recommendedSpecialty: 'Primary Care / Internal Medicine',
    recommendedTimeframe: 'Routine Scheduling (3 - 7 days)',
    clinicalRationale: 'Non-acute condition, routine health maintenance, or chronic medication refill. No acute intervention or resource requirement.',
    underOverTriageRisk: 'LOW',
    underOverTriageRationale: 'Asymptomatic or chronic stable condition.',
    needsClarification: false,
    suggestedAction: 'ROUTINE_SCHEDULING'
  };
}

// REST API Endpoints

// 1. Get all active triage cases (calculated with both FIFO and Urgency rank)
app.get('/api/triage/cases', (req, res) => {
  // Sort by urgency acuityScore descending to reflect Urgency queue
  const urgencySorted = [...triageCases].sort((a, b) => b.acuityScore - a.acuityScore);
  // Sort by submittedAt ascending to reflect FIFO queue
  const fifoSorted = [...triageCases].sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());

  const casesWithPositions = triageCases.map((c) => {
    const urgencyIdx = urgencySorted.findIndex((x) => x.id === c.id) + 1;
    const fifoIdx = fifoSorted.findIndex((x) => x.id === c.id) + 1;
    return {
      ...c,
      urgencyPosition: urgencyIdx,
      fifoPosition: fifoIdx,
    };
  });

  res.json({
    cases: casesWithPositions,
    stats: {
      totalCases: triageCases.length,
      level1Emergency: triageCases.filter((c) => c.urgencyTier === 'LEVEL_1_RESUSCITATION').length,
      level2Emergent: triageCases.filter((c) => c.urgencyTier === 'LEVEL_2_EMERGENT').length,
      level3Urgent: triageCases.filter((c) => c.urgencyTier === 'LEVEL_3_URGENT').length,
      level4LessUrgent: triageCases.filter((c) => c.urgencyTier === 'LEVEL_4_LESS_URGENT').length,
      level5NonUrgent: triageCases.filter((c) => c.urgencyTier === 'LEVEL_5_NON_URGENT').length,
      averageAcuity: Math.round(triageCases.reduce((acc, c) => acc + c.acuityScore, 0) / (triageCases.length || 1)),
      overUnderTriageRiskCount: triageCases.filter((c) => c.underOverTriageRisk === 'HIGH' || c.underOverTriageRisk === 'MEDIUM').length,
    }
  });
});

// 2. Clinical AI Triage Analysis (using Gemini API server-side with fallback)
app.post('/api/triage/analyze', async (req, res) => {
  try {
    const { complaint, dialogue = [], painLevel = 5, patientAge = 40, comorbidities = [] } = req.body;

    if (!complaint && dialogue.length === 0) {
      return res.status(400).json({ error: 'Complaint or dialogue text is required' });
    }

    const dialogueSummary = dialogue.map((d: any) => `${d.sender}: ${d.text}`).join('\n');
    const fullText = `${complaint || ''}\nDialogue context:\n${dialogueSummary}`;

    const gemini = getGeminiClient();

    if (gemini) {
      try {
        const prompt = `You are an expert Clinical Triage & Scheduling AI Agent operating in an accredited hospital ambulatory network.
Your clinical objective is to solve these 5 core challenges:
1. Determine how urgent the patient's stated symptoms are based on Emergency Severity Index (ESI Level 1 to 5).
2. Match the exact best medical specialty and timeframe.
3. Identify when symptoms are severe enough to require immediate escalation to 911 / Emergency Department (e.g. stroke, crushing chest pain, anaphylaxis, severe respiratory distress) rather than outpatient scheduling.
4. Avoid UNDER-TRIAGING (missing a hidden life-threat) or OVER-TRIAGING (wasting urgent capacity) based on limited self-reported info. If ambiguous, provide a high-value clarifying question.
5. Keep the communication compassionate, crystal clear, and simple for the patient.

Patient Age: ${patientAge}
Reported Pain Level: ${painLevel} / 10
Known Comorbidities: ${comorbidities.join(', ') || 'None reported'}
Patient Statement & Dialogue:
${fullText}

Return valid JSON with the following schema:
{
  "urgencyTier": "LEVEL_1_RESUSCITATION" | "LEVEL_2_EMERGENT" | "LEVEL_3_URGENT" | "LEVEL_4_LESS_URGENT" | "LEVEL_5_NON_URGENT",
  "acuityScore": number from 1 to 100,
  "isEmergencyEscalation": boolean,
  "emergencyReason": string (if isEmergencyEscalation is true),
  "recommendedSpecialty": string,
  "recommendedTimeframe": string (e.g. "Immediate", "Urgent Same-Day (< 2h)", "Within 24-48h", "Routine (3-7 days)"),
  "clinicalRationale": string (concise clinical justification for clinicians),
  "underOverTriageRisk": "LOW" | "MEDIUM" | "HIGH",
  "underOverTriageRationale": string (how this rating avoids under or over-triaging),
  "needsClarification": boolean,
  "clarifyingQuestion": string (optional, 1 clear question to distinguish ambiguous symptoms),
  "clarifyingOptions": string[] (array of 3-4 simple multiple choice answer pills),
  "suggestedAction": "CALL_911_NOW" | "GO_TO_ED_IMMEDIATELY" | "SAME_DAY_SPECIALIST" | "NEXT_DAY_APPOINTMENT" | "ROUTINE_SCHEDULING"
}`;

        const response = await gemini.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          }
        });

        const rawText = response.text || '{}';
        const parsed = JSON.parse(rawText);
        return res.json(parsed);
      } catch (geminiError) {
        console.warn('Gemini API call failed or timed out, falling back to clinical rule engine:', geminiError);
        // Fall back gracefully to rule-based engine
      }
    }

    // Fallback: rule-based clinical evaluation
    const fallbackResult = evaluateClinicalTriageRuleBased(complaint || '', dialogueSummary, painLevel);
    return res.json(fallbackResult);
  } catch (error: any) {
    console.error('Triage analysis error:', error);
    res.status(500).json({ error: 'Failed to complete triage analysis', details: error.message });
  }
});

// 3. Create a new patient intake triage case
app.post('/api/triage/cases', (req, res) => {
  try {
    const {
      patient,
      chiefComplaint,
      symptomDetails,
      reportedDuration = '1 day',
      painLevel = 5,
      associatedSymptoms = [],
      vitals,
      comorbidities = [],
      urgencyTier = 'LEVEL_3_URGENT',
      acuityScore = 70,
      isEmergencyEscalation = false,
      emergencyReason,
      clinicalRationale = 'Assessed based on intake dialogue.',
      underOverTriageRisk = 'LOW',
      underOverTriageRationale = 'Standard assessment.',
      clarifyingQuestionsAsked = [],
      recommendedSpecialty = 'Primary Care',
      recommendedTimeframe = 'Within 24 hours',
      dialogueHistory = []
    } = req.body;

    const newId = `CASE-${Math.floor(100 + Math.random() * 900)}`;
    const newCase = {
      id: newId,
      patient: {
        id: `PT-${Math.floor(100 + Math.random() * 900)}`,
        name: patient?.name || 'Anonymous Patient',
        age: Number(patient?.age) || 38,
        gender: patient?.gender || 'Not specified',
        phone: patient?.phone || '(555) 000-0000',
        mrn: `MRN-${Math.floor(10000 + Math.random() * 90000)}`,
        historyNotes: patient?.historyNotes || 'None reported'
      },
      submittedAt: new Date().toISOString(),
      timeAgoDisplay: 'Just now',
      chiefComplaint,
      symptomDetails: symptomDetails || chiefComplaint,
      reportedDuration,
      painLevel: Number(painLevel),
      associatedSymptoms,
      vitals: vitals || { heartRate: 78, bloodPressure: '120/80', oxygenSat: 98, temperature: 37.0 },
      comorbidities,
      urgencyTier,
      acuityScore: Number(acuityScore),
      slaMinutesRemaining: urgencyTier === 'LEVEL_1_RESUSCITATION' ? 0 : urgencyTier === 'LEVEL_2_EMERGENT' ? 15 : urgencyTier === 'LEVEL_3_URGENT' ? 120 : 720,
      isEmergencyEscalation: Boolean(isEmergencyEscalation),
      emergencyReason,
      clinicalRationale,
      underOverTriageRisk,
      underOverTriageRationale,
      clarifyingQuestionsAsked,
      recommendedSpecialty,
      recommendedTimeframe,
      status: (isEmergencyEscalation ? 'ESCALATED_TO_ED' : 'PENDING_TRIAGE') as CaseStatus,
      dialogueHistory,
      fifoPosition: triageCases.length + 1,
      urgencyPosition: 1,
      fifoEstimatedWait: 'Queued by arrival time',
      urgencyEstimatedWait: isEmergencyEscalation ? 'Immediate 911/ED' : 'Reserved urgency slot'
    };

    triageCases.unshift(newCase);
    res.status(201).json({ success: true, case: newCase });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Update / Review / Override case (for Clinicians and Care Teams)
app.patch('/api/triage/cases/:id', (req, res) => {
  const { id } = req.params;
  const index = triageCases.findIndex((c) => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Case not found' });
  }

  const existing = triageCases[index];
  const {
    clinicianOverrideTier,
    clinicianNotes,
    status,
    bookedSlot,
    assignedDoctor
  } = req.body;

  let updatedAcuity = existing.acuityScore;
  if (clinicianOverrideTier) {
    if (clinicianOverrideTier === 'LEVEL_1_RESUSCITATION') updatedAcuity = 99;
    else if (clinicianOverrideTier === 'LEVEL_2_EMERGENT') updatedAcuity = 90;
    else if (clinicianOverrideTier === 'LEVEL_3_URGENT') updatedAcuity = 75;
    else if (clinicianOverrideTier === 'LEVEL_4_LESS_URGENT') updatedAcuity = 40;
    else if (clinicianOverrideTier === 'LEVEL_5_NON_URGENT') updatedAcuity = 15;
  }

  triageCases[index] = {
    ...existing,
    urgencyTier: clinicianOverrideTier || existing.urgencyTier,
    acuityScore: updatedAcuity,
    clinicianOverrideTier: clinicianOverrideTier || existing.clinicianOverrideTier,
    clinicianNotes: clinicianNotes !== undefined ? clinicianNotes : existing.clinicianNotes,
    status: status || existing.status,
    bookedSlot: bookedSlot || existing.bookedSlot,
    reviewedBy: req.body.reviewedBy || 'Dr. Triage Officer on Duty',
    reviewedAt: new Date().toISOString(),
  };

  res.json({ success: true, case: triageCases[index] });
});

// 5. Get Department Capacities and Urgent Reserve Buffers (for Administrators)
app.get('/api/departments', (req, res) => {
  res.json({ departments: departmentCapacities });
});

// 6. Get Available Providers and Slot Matrix
app.get('/api/providers', (req, res) => {
  res.json({ doctors: doctorsList });
});

// Vite middleware in development or static serve in production
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
    console.log(`Triage Scheduling Agent server listening on port ${PORT}`);
  });
}

startServer();
