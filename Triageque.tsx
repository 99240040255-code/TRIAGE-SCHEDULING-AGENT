import React, { useState } from 'react';
import { 
  TriageCase, 
  UrgencyTier, 
  UnderOverTriageRisk 
} from '../types.ts';
import { 
  getTierBadge, 
  getUnderOverTriageRiskBadge, 
  getStatusBadge 
} from '../utils/triageUtils.ts';
import { 
  Search, 
  Filter, 
  AlertTriangle, 
  Siren, 
  Clock, 
  ChevronRight, 
  Sparkles, 
  ArrowUpDown, 
  CheckCircle2, 
  Stethoscope, 
  User, 
  ShieldAlert,
  Flame,
  FileText,
  Phone
} from 'lucide-react';

interface TriageQueueProps {
  cases: TriageCase[];
  queueMode: 'urgency' | 'fifo';
  setQueueMode: (mode: 'urgency' | 'fifo') => void;
  onSelectCase: (triageCase: TriageCase) => void;
  onQuickBook: (id: string) => Promise<void>;
  onEscalateED: (id: string, reason: string) => Promise<void>;
  onOpenIntakeModal: () => void;
}

export const TriageQueue: React.FC<TriageQueueProps> = ({
  cases,
  queueMode,
  setQueueMode,
  onSelectCase,
  onQuickBook,
  onEscalateED,
  onOpenIntakeModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');

  // Sort according to selected mode:
  // 'urgency': sorted by acuityScore descending
  // 'fifo': sorted by submittedAt ascending
  const sortedCases = [...cases].sort((a, b) => {
    if (queueMode === 'urgency') {
      return b.acuityScore - a.acuityScore;
    } else {
      return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
    }
  });

  const filteredCases = sortedCases.filter((c) => {
    const matchesSearch = 
      c.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.chiefComplaint.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.patient.mrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.recommendedSpecialty.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTier = tierFilter === 'ALL' || c.urgencyTier === tierFilter;
    const matchesRisk = riskFilter === 'ALL' || c.underOverTriageRisk === riskFilter;

    return matchesSearch && matchesTier && matchesRisk;
  });

  // Calculate high-level stats
  const total = cases.length;
  const level1Count = cases.filter((c) => c.urgencyTier === 'LEVEL_1_RESUSCITATION').length;
  const level2Count = cases.filter((c) => c.urgencyTier === 'LEVEL_2_EMERGENT').length;
  const level3Count = cases.filter((c) => c.urgencyTier === 'LEVEL_3_URGENT').length;
  const underOverRiskCount = cases.filter((c) => c.underOverTriageRisk === 'HIGH' || c.underOverTriageRisk === 'MEDIUM').length;

  return (
    <div className="space-y-6">
      {/* Overview Stat Widgets - Clean Minimalism */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Cases</span>
            <Stethoscope className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{total}</span>
            <span className="text-xs text-slate-400 font-medium">in triage</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">ESI 1 Critical</span>
            <Siren className="w-4 h-4 text-red-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-red-600">{level1Count}</span>
            <span className="text-xs text-slate-400 font-medium">911 / Diverted</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">ESI 2 Emergent</span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-orange-600">{level2Count}</span>
            <span className="text-xs text-slate-400 font-medium">&lt; 15 min SLA</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">ESI 3 Urgent</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600">{level3Count}</span>
            <span className="text-xs text-slate-400 font-medium">Same-Day</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Guard Check</span>
            <ShieldAlert className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-600">{underOverRiskCount}</span>
            <span className="text-xs text-slate-400 font-medium">Risk Guarded</span>
          </div>
        </div>
      </div>

      {/* FIFO vs Urgency Educational Callout Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                queueMode === 'urgency'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}>
                {queueMode === 'urgency' ? 'AI Acuity-Stratified Queue' : 'Traditional FIFO (First-Come)'}
              </span>
              <span className="text-xs text-slate-400 font-medium">Core Healthcare Problem #5 Resolved</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
              {queueMode === 'urgency' ? (
                <>
                  Patients are prioritized strictly by <strong>Emergency Severity Index (ESI)</strong> and clinical acuity score. 
                  High-risk presentations occupy <strong>Reserved Specialist Buffer Slots</strong> within 15 minutes, preventing life-threatening treatment delays.
                </>
              ) : (
                <>
                  In standard FIFO scheduling, patients receive appointments by booking timestamp. 
                  Notice how critical cardiac presentations wait behind routine medication reviews without acuity stratification!
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setQueueMode(queueMode === 'urgency' ? 'fifo' : 'urgency')}
              className="px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <span>Toggle to {queueMode === 'urgency' ? 'FIFO' : 'Urgency'}</span>
            </button>
            <button
              onClick={onOpenIntakeModal}
              className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-200" />
              <span>New Patient Intake</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search, Filters, and Controls */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search patient, MRN, complaint..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-1 text-xs text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
            <Filter className="w-3 h-3 text-slate-400" />
            <span>Urgency:</span>
          </div>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="text-xs p-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="ALL">All Tiers (ESI 1 - 5)</option>
            <option value="LEVEL_1_RESUSCITATION">ESI 1 • Resuscitation (911)</option>
            <option value="LEVEL_2_EMERGENT">ESI 2 • Emergent (&lt;15m)</option>
            <option value="LEVEL_3_URGENT">ESI 3 • Urgent (&lt;2h)</option>
            <option value="LEVEL_4_LESS_URGENT">ESI 4 • Less Urgent</option>
            <option value="LEVEL_5_NON_URGENT">ESI 5 • Non-Urgent</option>
          </select>

          <div className="flex items-center gap-1 text-xs text-slate-400 font-semibold uppercase tracking-wider text-[10px] ml-2">
            <span>Ambiguity:</span>
          </div>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="text-xs p-1.5 border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="HIGH">High Ambiguity Risk</option>
            <option value="MEDIUM">Moderate Risk</option>
            <option value="LOW">Low Risk</option>
          </select>
        </div>
      </div>

      {/* Patient Triage Queue Cards List */}
      <div className="space-y-3">
        {filteredCases.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200 shadow-xs">
            <Stethoscope className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No triage cases match current filter criteria</p>
            <p className="text-xs text-slate-500 mt-1">Try resetting search filters or launch a new patient intake scenario.</p>
          </div>
        ) : (
          filteredCases.map((c, index) => {
            const tier = getTierBadge(c.urgencyTier);
            const risk = getUnderOverTriageRiskBadge(c.underOverTriageRisk);
            const status = getStatusBadge(c.status);

            const isPriorityOne = index === 0 && queueMode === 'urgency';

            // Left colored accent border based on tier
            let borderAccent = 'border-l-slate-300';
            let numBoxClass = 'bg-slate-100 text-slate-600';
            if (c.urgencyTier === 'LEVEL_1_RESUSCITATION') {
              borderAccent = 'border-l-red-500';
              numBoxClass = 'bg-red-50 text-red-600';
            } else if (c.urgencyTier === 'LEVEL_2_EMERGENT') {
              borderAccent = 'border-l-orange-400';
              numBoxClass = 'bg-orange-50 text-orange-600';
            } else if (c.urgencyTier === 'LEVEL_3_URGENT') {
              borderAccent = 'border-l-blue-500';
              numBoxClass = 'bg-blue-50 text-blue-600';
            }

            const rankNum = queueMode === 'urgency' ? c.urgencyPosition : c.fifoPosition;
            const rankDisplay = rankNum < 10 ? `0${rankNum}` : `${rankNum}`;

            return (
              <div
                key={c.id}
                className={`bg-white rounded-xl border border-slate-200 border-l-4 ${borderAccent} p-5 shadow-xs transition-all hover:shadow-sm ${
                  c.isEmergencyEscalation
                    ? 'ring-1 ring-red-200 bg-red-50/10'
                    : isPriorityOne
                    ? 'ring-1 ring-blue-200'
                    : ''
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Number Box & Patient Info */}
                  <div className="flex items-start gap-4">
                    {/* Index Number Box matching Clean Minimalism */}
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-base flex-shrink-0 ${numBoxClass}`}>
                      {rankDisplay}
                    </div>

                    {/* Patient & Complaint Details */}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-base">
                          {c.patient.name}
                        </h3>
                        <span className="text-xs text-slate-400 font-normal">
                          (Age {c.patient.age})
                        </span>
                        <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {c.patient.mrn}
                        </span>
                        <span className="text-xs text-slate-400">• {c.timeAgoDisplay || 'recently'}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${status.classes}`}>
                          {status.label}
                        </span>
                      </div>

                      {/* Chief Complaint */}
                      <p className="text-sm text-slate-600">
                        <span className="font-semibold text-slate-700">Stated:</span> "{c.chiefComplaint}"
                      </p>

                      <p className="text-xs text-slate-500 line-clamp-1">
                        <span className="text-slate-600 font-medium">Presentation:</span> {c.symptomDetails}
                      </p>

                      {/* Associated symptom & specialty tags */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          Pain: {c.painLevel}/10
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                          {c.recommendedSpecialty}
                        </span>
                        {c.associatedSymptoms?.slice(0, 3).map((sym, i) => (
                          <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 border border-slate-200">
                            {sym}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: ESI Badge, Acuity & Guard Check */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:px-6 lg:border-x lg:border-slate-100">
                    {/* ESI Tier Badge */}
                    <div className="space-y-1 min-w-[130px]">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${tier.badgeBg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${tier.dotColor}`} />
                        {tier.label}
                      </span>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>SLA: {tier.targetWait}</span>
                      </div>
                    </div>

                    {/* Acuity Bar */}
                    <div className="space-y-1 w-28">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>Acuity</span>
                        <span>{c.acuityScore}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            c.acuityScore >= 90
                              ? 'bg-red-600'
                              : c.acuityScore >= 75
                              ? 'bg-orange-500'
                              : c.acuityScore >= 40
                              ? 'bg-blue-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${c.acuityScore}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {c.recommendedTimeframe}
                      </span>
                    </div>

                    {/* Ambiguity Risk */}
                    <div className="min-w-[110px]">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full block text-center ${risk.classes}`}>
                        {risk.label}
                      </span>
                      <span className="text-[9px] text-slate-400 block text-center mt-0.5">
                        Misclassification guard
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Wait time & Actions */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="text-right text-xs">
                      {queueMode === 'urgency' ? (
                        <span className="font-semibold text-blue-700 block">
                          Est. Wait: {c.urgencyEstimatedWait}
                        </span>
                      ) : (
                        <span className="font-semibold text-amber-700 block">
                          FIFO Wait: {c.fifoEstimatedWait}
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      {c.isEmergencyEscalation ? (
                        <button
                          onClick={() => onSelectCase(c)}
                          className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs transition-colors"
                        >
                          <Siren className="w-3.5 h-3.5" />
                          <span>Emergency Details</span>
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => onQuickBook(c.id)}
                            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-xs"
                            title="Quick assign to next open specialist buffer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-200" />
                            <span>Book Buffer</span>
                          </button>

                          <button
                            onClick={() => onSelectCase(c)}
                            className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                          >
                            <span>Review</span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
