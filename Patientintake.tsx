import React, { useState } from 'react';
import { 
  TriageCase, 
  UrgencyTier, 
  DialogueMessage, 
  TriageAnalysisResult 
} from '../types.ts';
import { 
  getTierBadge, 
  getUnderOverTriageRiskBadge 
} from '../utils/triageUtils.ts';
import { 
  Send, 
  Bot, 
  User, 
  Siren, 
  AlertTriangle, 
  Sparkles, 
  CheckCircle2, 
  PhoneCall, 
  Calendar, 
  Clock, 
  RotateCcw, 
  ShieldCheck,
  Stethoscope,
  Info
} from 'lucide-react';

interface PatientIntakeProps {
  onCaseCreated: (newCase: any) => Promise<void>;
  onSwitchToQueue: () => void;
}

export const PatientIntake: React.FC<PatientIntakeProps> = ({
  onCaseCreated,
  onSwitchToQueue,
}) => {
  const [patientName, setPatientName] = useState('Sarah Jenkins');
  const [patientAge, setPatientAge] = useState<number>(45);
  const [patientGender, setPatientGender] = useState('Female');
  const [patientPhone, setPatientPhone] = useState('(555) 349-1122');
  const [comorbidities, setComorbidities] = useState<string[]>([]);
  const [painLevel, setPainLevel] = useState<number>(5);

  const [inputMessage, setInputMessage] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<TriageAnalysisResult | null>(null);

  const [messages, setMessages] = useState<DialogueMessage[]>([
    {
      id: 'm-init',
      sender: 'agent',
      text: 'Hello, I am your Clinical Intake Assistant. What symptoms or health concern are you experiencing today?',
      timestamp: 'Just now',
    },
  ]);

  const [caseSubmitted, setCaseSubmitted] = useState(false);

  // Scenario Presets to test all 5 clinical challenges immediately
  const scenarios = [
    {
      title: 'Crushing Chest Pain',
      badge: 'ESI 2 • Emergent',
      badgeBg: 'bg-orange-600 text-white',
      complaint: 'Crushing tightness in the center of my chest radiating to my jaw, with cold sweats.',
      pain: 8,
      age: 58,
      history: ['Hypertension', 'High Cholesterol'],
    },
    {
      title: 'Sudden Slurred Speech & Weakness',
      badge: 'Immediate 911',
      badgeBg: 'bg-rose-600 text-white',
      complaint: 'My right arm suddenly went weak and my speech started slurring 20 minutes ago.',
      pain: 1,
      age: 68,
      history: ['Atrial Fibrillation'],
    },
    {
      title: 'Severe RLQ Abdominal Pain',
      badge: 'ESI 3 • Urgent',
      badgeBg: 'bg-amber-600 text-white',
      complaint: 'Sharp, severe pain in my lower right stomach that started at my navel. Hurt to cough and have a fever.',
      pain: 8,
      age: 26,
      history: [],
    },
    {
      title: 'Vague Dizziness & Fatigue',
      badge: 'Avoid Under/Over-Triage',
      badgeBg: 'bg-indigo-600 text-white',
      complaint: 'I have been feeling dizzy and faint today.',
      pain: 3,
      age: 42,
      history: ['None'],
    },
    {
      title: 'Twisted Knee Playing Sports',
      badge: 'ESI 4 • Ortho',
      badgeBg: 'bg-sky-600 text-white',
      complaint: 'I twisted my knee playing soccer yesterday. Mild swelling, can walk with a slight limp.',
      pain: 4,
      age: 31,
      history: [],
    },
    {
      title: 'Blood Pressure Refill',
      badge: 'ESI 5 • Routine',
      badgeBg: 'bg-emerald-600 text-white',
      complaint: 'I need a renewal refill on my Lisinopril prescription. No symptoms, blood pressure is normal.',
      pain: 0,
      age: 52,
      history: ['Hypertension'],
    },
  ];

  const loadScenario = (s: typeof scenarios[0]) => {
    setInputMessage(s.complaint);
    setPainLevel(s.pain);
    setPatientAge(s.age);
    setComorbidities(s.history);
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim()) return;

    const userMsg: DialogueMessage = {
      id: `usr-${Date.now()}`,
      sender: 'patient',
      text: textToSend,
      timestamp: 'Just now',
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsAnalyzing(true);

    try {
      // Call server-side Gemini triage analysis API
      const res = await fetch('/api/triage/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaint: textToSend,
          dialogue: updatedMessages,
          painLevel,
          patientAge,
          comorbidities,
        }),
      });

      if (!res.ok) {
        throw new Error('Server analysis error');
      }

      const result: TriageAnalysisResult = await res.json();
      setAnalysisResult(result);

      // Generate conversational reply for patient
      let agentReplyText = '';
      let replyOptions: string[] | undefined = undefined;

      if (result.isEmergencyEscalation) {
        agentReplyText = `EMERGENCY ALERT: Based on your symptoms (${result.emergencyReason || 'Critical red-flag'}), you need immediate emergency evaluation. Please call 911 or proceed to the nearest Emergency Department immediately. Do not wait for a routine clinic appointment.`;
      } else if (result.needsClarification && result.clarifyingQuestion) {
        agentReplyText = `Thank you for sharing that. To ensure we match you with the right specialist and avoid delaying important care: ${result.clarifyingQuestion}`;
        replyOptions = result.clarifyingOptions;
      } else {
        agentReplyText = `I have completed your clinical intake assessment. We have categorized your urgency as ${result.urgencyTier.replace('LEVEL_', 'ESI Level ')} and matched you with ${result.recommendedSpecialty}. Recommended timeframe: ${result.recommendedTimeframe}.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `agt-${Date.now()}`,
          sender: 'agent',
          text: agentReplyText,
          timestamp: 'Just now',
          options: replyOptions,
        },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `agt-${Date.now()}`,
          sender: 'agent',
          text: 'Thank you for sharing your symptoms. Our clinical care team has received your information and will review your priority slot immediately.',
          timestamp: 'Just now',
        },
      ]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmitToQueue = async () => {
    if (!analysisResult) return;
    setIsAnalyzing(true);
    try {
      const firstPatientMsg = messages.find((m) => m.sender === 'patient')?.text || 'Intake Consultation';
      await onCaseCreated({
        patient: {
          name: patientName,
          age: patientAge,
          gender: patientGender,
          phone: patientPhone,
          historyNotes: comorbidities.join(', ') || 'None',
        },
        chiefComplaint: firstPatientMsg,
        symptomDetails: messages.filter((m) => m.sender === 'patient').map((m) => m.text).join('; '),
        reportedDuration: 'Recent',
        painLevel,
        comorbidities,
        urgencyTier: analysisResult.urgencyTier,
        acuityScore: analysisResult.acuityScore,
        isEmergencyEscalation: analysisResult.isEmergencyEscalation,
        emergencyReason: analysisResult.emergencyReason,
        clinicalRationale: analysisResult.clinicalRationale,
        underOverTriageRisk: analysisResult.underOverTriageRisk,
        underOverTriageRationale: analysisResult.underOverTriageRationale,
        clarifyingQuestionsAsked: messages
          .filter((m) => m.sender === 'agent' && m.options)
          .map((m) => m.text),
        recommendedSpecialty: analysisResult.recommendedSpecialty,
        recommendedTimeframe: analysisResult.recommendedTimeframe,
        dialogueHistory: messages,
      });

      setCaseSubmitted(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: 'm-init',
        sender: 'agent',
        text: 'Hello, I am your Clinical Intake Assistant. What symptoms or health concern are you experiencing today?',
        timestamp: 'Just now',
      },
    ]);
    setAnalysisResult(null);
    setCaseSubmitted(false);
    setInputMessage('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Title & Explanatory Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Patient Conversational Intake
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
              Low-Friction Clinical Agent
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Solves <strong>Challenge #5</strong> (keeping intake simple for the patient), 
            <strong>Challenge #3</strong> (instant emergency escalation detection), and 
            <strong>Challenge #4</strong> (asking targeted questions to prevent under/over-triaging).
          </p>
        </div>

        <button
          onClick={handleReset}
          className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 self-start md:self-auto transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>Reset Session</span>
        </button>
      </div>

      {/* Quick Clinical Test Scenarios */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            1-Click Clinical Test Scenarios
          </span>
          <span className="text-[11px] text-slate-400">Click preset to simulate realistic intake</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {scenarios.map((s, idx) => (
            <button
              key={idx}
              onClick={() => loadScenario(s)}
              className="p-3 rounded-lg bg-slate-50/70 border border-slate-200/80 hover:border-blue-500 hover:bg-white hover:shadow-xs transition-all text-left flex flex-col justify-between"
            >
              <span className="text-xs font-bold text-slate-800 line-clamp-1">{s.title}</span>
              <span className={`mt-2 inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${s.badgeBg}`}>
                {s.badge}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Intake Grid: Left Dialogue Box, Right Live Clinical Assessment */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Conversational Portal */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col h-[620px] overflow-hidden">
          {/* Chat Header */}
          <div className="bg-white text-slate-900 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold block leading-tight text-slate-900">Virtual Triage Assistant</span>
                <span className="text-[10px] text-blue-600 font-medium">Real-time Emergency & Urgency Screening</span>
              </div>
            </div>

            <span className="text-[11px] text-slate-500">
              Patient: <strong className="text-slate-900">{patientName}</strong> ({patientAge}y)
            </span>
          </div>

          {/* Emergency Escalation Alert Banner inside Chat */}
          {analysisResult?.isEmergencyEscalation && (
            <div className="bg-red-600 text-white p-4 flex items-start gap-3 border-b border-red-700">
              <Siren className="w-6 h-6 flex-shrink-0 mt-0.5 animate-pulse" />
              <div>
                <h4 className="font-black text-sm tracking-tight">
                  CRITICAL EMERGENCY DETECTED: DO NOT WAIT FOR AN APPOINTMENT
                </h4>
                <p className="text-xs mt-1 text-red-100 leading-relaxed">
                  {analysisResult.emergencyReason || 'Your stated symptoms indicate potential life-threat or time-sensitive emergency.'}
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  <a
                    href="tel:911"
                    className="px-3.5 py-1.5 bg-white text-red-600 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-xs hover:bg-red-50 transition-colors"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call 911 Now</span>
                  </a>
                  <span className="text-[11px] text-red-100">or proceed to Nearest Emergency Department</span>
                </div>
              </div>
            </div>
          )}

          {/* Messages Flow */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/40">
            {messages.map((m) => {
              const isAgent = m.sender === 'agent';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isAgent ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-4 py-2.5 text-xs leading-relaxed ${
                      isAgent
                        ? 'bg-white text-slate-800 border border-slate-200 shadow-xs'
                        : 'bg-blue-600 text-white shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] opacity-70 mb-1">
                      <span className="font-semibold">{isAgent ? 'Triage Assistant' : patientName}</span>
                      <span>{m.timestamp}</span>
                    </div>
                    <p className="whitespace-pre-wrap">{m.text}</p>
                  </div>

                  {/* Clarifying Option Pills */}
                  {m.options && m.options.length > 0 && !caseSubmitted && (
                    <div className="mt-2 flex flex-wrap gap-1.5 pl-2 max-w-[90%]">
                      <span className="text-[10px] font-bold text-slate-400 block w-full">
                        Quick Reply Options:
                      </span>
                      {m.options.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => handleSendMessage(opt)}
                          disabled={isAnalyzing}
                          className="px-3 py-1 bg-white hover:bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-[11px] font-semibold transition-all shadow-xs hover:border-blue-400"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {isAnalyzing && (
              <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 p-2.5 rounded-lg border border-blue-200 w-fit">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                </span>
                <span className="font-medium">Evaluating symptoms against ESI protocols & red-flags...</span>
              </div>
            )}
          </div>

          {/* Chat Input & Pain Rating Controls */}
          <div className="p-3 bg-white border-t border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between text-xs px-1 text-slate-600">
              <span className="font-semibold">Self-Reported Pain Level:</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={painLevel}
                  onChange={(e) => setPainLevel(Number(e.target.value))}
                  className="w-28 accent-blue-600 cursor-pointer"
                />
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  painLevel >= 8 ? 'bg-red-100 text-red-700' : painLevel >= 5 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                }`}>
                  {painLevel} / 10
                </span>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Describe your symptoms (e.g. chest pressure, dizziness, knee twist)..."
                disabled={isAnalyzing || caseSubmitted}
                className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 text-slate-800"
              />
              <button
                type="submit"
                disabled={isAnalyzing || !inputMessage.trim() || caseSubmitted}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Live Clinical Urgency & Specialist Matching Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Live Decision Engine Output
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ESI Protocol</span>
            </div>

            {analysisResult ? (
              <div className="space-y-4">
                {/* ESI Tier Card */}
                {(() => {
                  const badge = getTierBadge(analysisResult.urgencyTier);
                  return (
                    <div className={`p-4 rounded-xl border ${badge.cardBorder} ${badge.bg}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                          Calculated Urgency Tier
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${badge.badgeBg}`}>
                          {badge.short}
                        </span>
                      </div>
                      <h4 className="text-base font-black mt-1 text-slate-900">{badge.label}</h4>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{badge.description}</p>

                      <div className="mt-3 pt-2.5 border-t border-slate-200 flex justify-between text-xs font-semibold text-slate-700">
                        <span>Acuity Score: {analysisResult.acuityScore} / 100</span>
                        <span>SLA: {badge.targetWait}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Specialist & Slot Match */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
                    Recommended Care Path
                  </span>
                  <div className="text-xs space-y-1">
                    <p>
                      <strong className="text-slate-800">Specialty: </strong>
                      <span className="text-blue-700 font-bold">{analysisResult.recommendedSpecialty}</span>
                    </p>
                    <p>
                      <strong className="text-slate-800">Target Timeframe: </strong>
                      <span className="font-semibold text-slate-700">{analysisResult.recommendedTimeframe}</span>
                    </p>
                    <p className="text-slate-600 leading-relaxed text-[11px] pt-1">
                      <strong className="text-slate-800">Clinical Justification: </strong>
                      {analysisResult.clinicalRationale}
                    </p>
                  </div>
                </div>

                {/* Avoiding Under/Over-Triage Guardrail Rationale */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800 text-[11px]">
                      Under/Over-Triage Prevention:
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      getUnderOverTriageRiskBadge(analysisResult.underOverTriageRisk).classes
                    }`}>
                      {getUnderOverTriageRiskBadge(analysisResult.underOverTriageRisk).label}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
                    {analysisResult.underOverTriageRationale}
                  </p>
                </div>

                {/* Submission Action */}
                {!caseSubmitted ? (
                  <button
                    onClick={handleSubmitToQueue}
                    disabled={isAnalyzing}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Route to Care Team Queue</span>
                  </button>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-center space-y-2">
                    <p className="text-xs font-bold text-emerald-900 flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Successfully Scheduled & Added to Clinician Board!
                    </p>
                    <button
                      onClick={onSwitchToQueue}
                      className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                      View in Active Queue
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Stethoscope className="w-8 h-8 mx-auto opacity-50 text-blue-600" />
                <p className="text-xs font-semibold text-slate-700">Awaiting Patient Symptom Input</p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Type a symptom in the chat or select one of the 1-click test scenarios above to see the live acuity score and specialist match.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
