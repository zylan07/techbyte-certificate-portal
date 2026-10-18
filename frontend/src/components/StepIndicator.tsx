import React from "react";
import { Check } from "lucide-react";

interface StepIndicatorProps {
  currentStep: number;
  onStepClick: (step: number) => void;
  maxCompletedStep: number;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  onStepClick,
  maxCompletedStep,
}) => {
  const steps = [
    { number: 1, id: "events", label: "Select Event", code: "01" },
    { number: 2, id: "data", label: "Participant Data", code: "02" },
    { number: 3, id: "generation", label: "Generate & Preview", code: "03" },
    { number: 4, id: "delivery", label: "Email Delivery", code: "04" },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6">
      {/* Desktop / Tablet Timeline matching Team_registration */}
      <div className="hidden sm:flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-slate-800 -z-0"></div>
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-rose-600 to-rose-400 -z-0 transition-all duration-300"
          style={{
            width: `${((Math.min(currentStep, 4) - 1) / (steps.length - 1)) * 100}%`,
          }}
        ></div>

        {steps.map((step) => {
          const isCompleted = currentStep > step.number || maxCompletedStep >= step.number;
          const isCurrent = currentStep === step.number;
          const isClickable = step.number <= maxCompletedStep + 1;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center group">
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => onStepClick(step.number)}
                className={`w-9 h-9 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all duration-200 border-2 ${
                  isCompleted && !isCurrent
                    ? "bg-rose-600 border-rose-500 text-white shadow-md shadow-rose-950/60 cursor-pointer"
                    : isCurrent
                    ? "bg-[#0b0e17] border-rose-500 text-rose-400 ring-4 ring-rose-500/20 shadow-lg shadow-rose-950/40 cursor-default"
                    : isClickable
                    ? "bg-[#0c0f18] border-slate-700 text-slate-400 hover:border-slate-500 cursor-pointer"
                    : "bg-[#0c0f18] border-slate-800 text-slate-600 cursor-not-allowed opacity-50"
                }`}
                title={step.label}
              >
                {isCompleted && !isCurrent ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                  step.code
                )}
              </button>
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => onStepClick(step.number)}
                className={`mt-2 font-mono text-xs tracking-wider uppercase whitespace-nowrap transition-colors ${
                  isCurrent
                    ? "text-rose-400 font-semibold"
                    : isCompleted
                    ? "text-slate-300 hover:text-white cursor-pointer"
                    : isClickable
                    ? "text-slate-400 hover:text-slate-300 cursor-pointer"
                    : "text-slate-600 cursor-not-allowed"
                }`}
              >
                {step.label}
              </button>
            </div>
          );
        })}
      </div>

      {/* Mobile Compact Bar */}
      <div className="sm:hidden flex items-center justify-between bg-[#0e121d] px-4 py-2.5 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-600 text-white font-mono text-xs font-bold">
            {currentStep}
          </span>
          <span className="font-mono text-xs text-slate-400">/ 4</span>
          <span className="font-mono text-xs text-white uppercase font-semibold ml-1">
            {steps.find((s) => s.number === currentStep)?.label || "Step"}
          </span>
        </div>
        <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-rose-500 transition-all duration-300 rounded-full"
            style={{
              width: `${(Math.min(currentStep, 4) / 4) * 100}%`,
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};
