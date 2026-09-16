import React from 'react';

export default function Header({ currentStep, canCalculate, isLocked }) {
  const steps = [
    { num: 1, label: 'Contract Intake' },
    { num: 2, label: 'HITL Terms Lock' },
    { num: 3, label: 'Invoice Intake' },
    { num: 4, label: 'Rate Mapping' },
    { num: 5, label: 'Leakage Audit' },
    { num: 6, label: 'Evidence Pack' },
  ];

  return (
    <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-bold text-black text-xl shadow-lg shadow-emerald-500/20">
              Y
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg text-white tracking-tight">YBY Revenue Assurance Copilot</span>
                <span className="px-2 py-0.5 text-xs font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full">
                  v1.0 Zero-Trust
                </span>
              </div>
              <p className="text-xs text-gray-400">Deterministic Contract-to-Invoice Revenue Leakage Audit & Recovery</p>
            </div>
          </div>

          {/* Security & Audit Invariant Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700/60">
              <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
              Client-Side Invoices
            </div>
            <div className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${
              isLocked 
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-600/50' 
                : 'bg-amber-950/50 text-amber-300 border-amber-600/40'
            }`}>
              <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              {isLocked ? 'Terms Locked' : 'Lock Required'}
            </div>
          </div>
        </div>

        {/* Workflow Steps Stepper */}
        <div className="mt-3 pt-3 border-t border-gray-800/80 flex items-center justify-between overflow-x-auto gap-2 text-xs">
          {steps.map((step) => {
            const isActive = currentStep === step.num;
            const isCompleted = currentStep > step.num;
            return (
              <div 
                key={step.num}
                className={`flex items-center space-x-2 whitespace-nowrap transition-colors ${
                  isActive 
                    ? 'text-emerald-400 font-semibold' 
                    : isCompleted 
                    ? 'text-gray-300' 
                    : 'text-gray-500'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  isActive
                    ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/30'
                    : isCompleted
                    ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-600/50'
                    : 'bg-gray-800 text-gray-500 border border-gray-700'
                }`}>
                  {isCompleted ? '✓' : step.num}
                </span>
                <span>{step.label}</span>
                {step.num < 6 && <span className="text-gray-700 hidden sm:inline ml-2">→</span>}
              </div>
            );
          })}
        </div>
      </div>
    </header>
  );
}
