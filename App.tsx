/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TriageCase } from './types.ts';
import { Header } from './components/Header.tsx';
import { TriageQueue } from './components/TriageQueue.tsx';
import { PatientIntake } from './components/PatientIntake.tsx';
import { AdminCapacity } from './components/AdminCapacity.tsx';
import { CaseDetailModal } from './components/CaseDetailModal.tsx';
import { Activity } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'clinician' | 'patient' | 'admin'>('clinician');
  const [queueMode, setQueueMode] = useState<'urgency' | 'fifo'>('urgency');
  const [cases, setCases] = useState<TriageCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState<TriageCase | null>(null);

  // Fetch cases from server
  const fetchCases = async () => {
    try {
      const res = await fetch('/api/triage/cases');
      if (res.ok) {
        const data = await res.json();
        setCases(data.cases || []);
      }
    } catch (err) {
      console.error('Failed to load triage cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  // Update case (override tier, clinician note, etc.)
  const handleUpdateCase = async (id: string, updates: Partial<TriageCase>) => {
    try {
      const res = await fetch(`/api/triage/cases/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        setCases((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...data.case } : c))
        );
        if (selectedCase?.id === id) {
          setSelectedCase((prev) => (prev ? { ...prev, ...data.case } : null));
        }
      }
    } catch (err) {
      console.error('Failed to update case:', err);
    }
  };

  // Quick book slot
  const handleQuickBook = async (id: string) => {
    const targetCase = cases.find((c) => c.id === id);
    const slotString = `Today Urgent Buffer Slot (with ${targetCase?.recommendedSpecialty || 'Specialist'})`;
    await handleUpdateCase(id, {
      status: 'BOOKED',
      bookedSlot: slotString,
    });
  };

  // Escalate to Emergency Department / 911
  const handleEscalateED = async (id: string, reason: string) => {
    await handleUpdateCase(id, {
      status: 'ESCALATED_TO_ED',
      isEmergencyEscalation: true,
      emergencyReason: reason,
      urgencyTier: 'LEVEL_1_RESUSCITATION',
      acuityScore: 99,
    });
  };

  // Submit new intake case
  const handleCreateCase = async (newCaseData: any) => {
    try {
      const res = await fetch('/api/triage/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCaseData),
      });
      if (res.ok) {
        await fetchCases();
      }
    } catch (err) {
      console.error('Failed to create triage case:', err);
    }
  };

  const emergencyCasesCount = cases.filter((c) => c.isEmergencyEscalation).length;
  const pendingTriageCount = cases.filter((c) => c.status === 'PENDING_TRIAGE').length;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-teal-600 selection:text-white">
      {/* Top Header Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        queueMode={queueMode}
        setQueueMode={setQueueMode}
        emergencyCount={emergencyCasesCount}
        pendingCount={pendingTriageCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-500 space-y-3">
            <Activity className="w-8 h-8 text-teal-600 animate-spin" />
            <p className="text-xs font-semibold uppercase tracking-wider">
              Loading Clinical Triage Network...
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'clinician' && (
              <TriageQueue
                cases={cases}
                queueMode={queueMode}
                setQueueMode={setQueueMode}
                onSelectCase={(c) => setSelectedCase(c)}
                onQuickBook={handleQuickBook}
                onEscalateED={handleEscalateED}
                onOpenIntakeModal={() => setActiveTab('patient')}
              />
            )}

            {activeTab === 'patient' && (
              <PatientIntake
                onCaseCreated={handleCreateCase}
                onSwitchToQueue={() => setActiveTab('clinician')}
              />
            )}

            {activeTab === 'admin' && <AdminCapacity />}
          </>
        )}
      </main>

      {/* Case Detail & Clinician Override Modal */}
      {selectedCase && (
        <CaseDetailModal
          triageCase={selectedCase}
          onClose={() => setSelectedCase(null)}
          onUpdateCase={handleUpdateCase}
          onBookSlot={async (id, slot) => {
            await handleUpdateCase(id, { status: 'BOOKED', bookedSlot: slot });
          }}
          onEscalateED={handleEscalateED}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © 2026 <strong>Triage Scheduling Agent</strong> • St. Jude Ambulatory Network
          </span>
          <span className="text-[11px] text-slate-400">
            Certified Emergency Severity Index (ESI) Implementation • Gemini Clinical Reasoning
          </span>
        </div>
      </footer>
    </div>
  );
}
