import React from 'react';
import { 
  Stethoscope, 
  Users, 
  MessageSquare, 
  BarChart3, 
  Siren, 
  ShieldCheck, 
  ArrowUpDown,
  Sparkles
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'clinician' | 'patient' | 'admin';
  setActiveTab: (tab: 'clinician' | 'patient' | 'admin') => void;
  queueMode: 'urgency' | 'fifo';
  setQueueMode: (mode: 'urgency' | 'fifo') => void;
  emergencyCount: number;
  pendingCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  queueMode,
  setQueueMode,
  emergencyCount,
  pendingCount,
}) => {
  return (
    <header className="bg-white text-slate-900 border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Emergency Global Ticker if emergency cases exist */}
      {emergencyCount > 0 && (
        <div className="bg-red-600 text-white px-4 py-1.5 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            <Siren className="w-3.5 h-3.5" />
            <span>
              <strong>EMERGENCY ESCALATION ACTIVE:</strong> {emergencyCount} critical patient{emergencyCount > 1 ? 's' : ''} redirected to Emergency Services (Code Stroke/ACS). Rapid Response alerted.
            </span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Identity - Clean Minimalism */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-2">
                <path d="M4.5 12.5l3 3 7-7" />
                <circle cx="12" cy="12" r="10" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-lg text-slate-900 leading-none">
                  TRIAGE.AI
                </span>
                <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-blue-200">
                  ESI Protocol
                </span>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mt-0.5">
                Clinical Scheduling
              </p>
            </div>
          </div>

          {/* Perspective View Switcher */}
          <nav className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80">
            <button
              id="tab-clinician"
              onClick={() => setActiveTab('clinician')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'clinician'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              {activeTab === 'clinician' && (
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
              )}
              <Users className="w-3.5 h-3.5" />
              <span>Active Queue</span>
              {pendingCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === 'clinician' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'
                }`}>
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              id="tab-patient"
              onClick={() => setActiveTab('patient')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'patient'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              {activeTab === 'patient' && (
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
              )}
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Patient Intake</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-50 text-blue-600 font-bold border border-blue-100">
                Live
              </span>
            </button>

            <button
              id="tab-admin"
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'admin'
                  ? 'bg-white text-blue-700 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              {activeTab === 'admin' && (
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
              )}
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Capacity & Admin</span>
            </button>
          </nav>

          {/* Right Status Block & Prioritization Mode Switcher */}
          <div className="hidden lg:flex items-center gap-4 pl-4 border-l border-slate-200">
            {/* System Urgency Status */}
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold leading-tight">
                System Urgency
              </p>
              <p className="text-orange-500 font-bold text-xs leading-tight mt-0.5">
                Elevated ({pendingCount} Pending)
              </p>
            </div>

            {/* Queue Mode Buttons */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
              <button
                id="btn-queue-urgency"
                onClick={() => setQueueMode('urgency')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                  queueMode === 'urgency'
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Patients sorted by medical urgency and SLA risk"
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Urgency Queue</span>
              </button>
              <button
                id="btn-queue-fifo"
                onClick={() => setQueueMode('fifo')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                  queueMode === 'fifo'
                    ? 'bg-slate-800 text-white shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Traditional first-come-first-served"
              >
                <ArrowUpDown className="w-3 h-3" />
                <span>FIFO</span>
              </button>
            </div>

            {/* Clinician Pill */}
            <div className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <div className="leading-tight">
                <span className="font-semibold text-xs block text-white">Dr. Aris Thorne</span>
                <span className="text-[9px] text-slate-400 uppercase tracking-wider">Clinician View</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
