import React, { useState } from "react";
import {
  FileText,
  LayoutTemplate,
  Presentation,
  Briefcase,
  Radio,
  Code2,
  Terminal,
  Award,
  Check,
  Sparkles,
  Layers,
  Calendar,
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import { EventConfig } from "../types";

interface EventSelectorProps {
  events: EventConfig[];
  selectedEvent: EventConfig;
  onSelectEvent: (event: EventConfig) => void;
  onContinue: () => void;
}

// Icon map for technical symposium events
const EVENT_ICONS: Record<string, React.FC<{ className?: string }>> = {
  "paper-presentation": FileText,
  "project-presentation": LayoutTemplate,
  "poster-presentation": Presentation,
  "executive-development-programme": Briefcase,
  "conclave-on-emergent-trends": Radio,
  "coding-contest": Code2,
  "12-hour-hackathon": Terminal,
  "certificate-of-recognition": Award,
};

// Numeric technical labels
const EVENT_CODES: Record<string, string> = {
  "paper-presentation": "01",
  "project-presentation": "02",
  "poster-presentation": "03",
  "executive-development-programme": "04",
  "conclave-on-emergent-trends": "05",
  "coding-contest": "06",
  "12-hour-hackathon": "07",
  "certificate-of-recognition": "08",
};

export const EventSelector: React.FC<EventSelectorProps> = ({
  events,
  selectedEvent,
  onSelectEvent,
  onContinue,
}) => {
  const [filterCategory, setFilterCategory] = useState<"ALL" | "PARTICIPATION" | "RECOGNITION">("ALL");

  const filteredEvents = events.filter((ev) => {
    if (filterCategory === "PARTICIPATION") return ev.category !== "recognition";
    if (filterCategory === "RECOGNITION") return ev.category === "recognition";
    return true;
  });

  const isRecognition = selectedEvent.template === "recognition";

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Category Filter Pills & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-rose-400 font-semibold block mb-1">
            Phase 01 // Event & Certificate Selection
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl tracking-wide text-white">
            SELECT CERTIFICATE WORKFLOW
          </h2>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-[#090b12] border border-slate-800 rounded-xl self-start sm:self-auto font-mono text-xs">
          <button
            type="button"
            onClick={() => setFilterCategory("ALL")}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filterCategory === "ALL"
                ? "bg-rose-600 text-white font-semibold shadow-md shadow-rose-950/50"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            All Workflows ({events.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory("PARTICIPATION")}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filterCategory === "PARTICIPATION"
                ? "bg-rose-600 text-white font-semibold shadow-md shadow-rose-950/50"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Participation (7)
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory("RECOGNITION")}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filterCategory === "RECOGNITION"
                ? "bg-rose-600 text-white font-semibold shadow-md shadow-rose-950/50"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Recognition (1)
          </button>
        </div>
      </div>

      {/* Event Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredEvents.map((event) => {
          const isSelected = selectedEvent.id === event.id;
          const IconComp = EVENT_ICONS[event.id] || FileText;
          const eventCode = EVENT_CODES[event.id] || "00";
          const isRecogCard = event.category === "recognition";

          return (
            <div
              key={event.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectEvent(event)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectEvent(event);
                }
              }}
              className={`group relative rounded-2xl p-5 transition-all duration-200 cursor-pointer select-none border text-left flex flex-col justify-between ${
                isSelected
                  ? "bg-[#111625] border-rose-500 shadow-xl shadow-rose-950/30 ring-1 ring-rose-500/50"
                  : "bg-[#0c0f18]/90 hover:bg-[#101421] border-slate-800 hover:border-slate-700"
              }`}
            >
              <div>
                {/* Top: Code & Select indicator */}
                <div className="flex items-start justify-between gap-3 mb-3.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                      {eventCode}
                    </span>
                    <span
                      className={`text-[10px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded ${
                        isRecogCard
                          ? "bg-amber-950/40 text-amber-400 border border-amber-500/20"
                          : "bg-slate-800/40 text-slate-400 border border-slate-700/40"
                      }`}
                    >
                      {isRecogCard ? "Honor" : "Event"}
                    </span>
                  </div>

                  {/* Selection Checkbox */}
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-rose-600 text-white shadow-sm shadow-rose-950/50"
                        : "border border-slate-700 group-hover:border-slate-500 bg-slate-900/60"
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>

                {/* Icon & Title */}
                <div className="flex items-center gap-3 mb-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 ${
                      isSelected
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                        : "bg-slate-800/60 text-slate-400 border border-slate-700/60 group-hover:text-slate-300"
                    }`}
                  >
                    <IconComp className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="font-heading text-xl tracking-wide text-white group-hover:text-rose-200 transition-colors leading-tight">
                    {event.name}
                  </h3>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                  {event.description}
                </p>
              </div>

              {/* Card Footer */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>{event.date}</span>
                <span className={isSelected ? "text-rose-400 font-semibold" : "text-slate-600"}>
                  {isSelected ? "Active" : "Select"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Workflow Specification Panel */}
      <div className="bg-[#0e121e] border border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                Configured Workflow Specifications
              </span>
              <span className="font-heading text-xl text-white tracking-wide">
                {selectedEvent.name}
              </span>
            </div>
          </div>

          <span className="font-mono text-xs px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
            Template: {selectedEvent.template_filename || "Default"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          {/* Card 1: Template Type */}
          <div className="p-4 rounded-xl bg-[#080a11] border border-slate-800/80 space-y-1.5">
            <span className="text-slate-500 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-rose-400" /> Certificate Template
            </span>
            <p className="text-slate-200 font-medium">
              {isRecognition
                ? "Official Certificate of Recognition"
                : selectedEvent.template === "geeksforgeeks"
                ? "GeeksforGeeks Co-Branded Layout"
                : "Standard Institutional Layout"}
            </p>
            <p className="text-slate-500 text-[11px]">
              High-DPI vector overlay @ 2000×1414 resolution
            </p>
          </div>

          {/* Card 2: Dynamic Input Columns */}
          <div className="p-4 rounded-xl bg-[#080a11] border border-slate-800/80 space-y-1.5">
            <span className="text-slate-500 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Required Input Fields
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {isRecognition ? (
                <>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 text-[11px]">Name</span>
                  <span className="text-slate-500">+</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 text-[11px]">Class / Section</span>
                  <span className="text-slate-500">+</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 text-[11px]">Mail ID</span>
                </>
              ) : (
                <>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 text-[11px]">Name</span>
                  <span className="text-slate-500">+</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 text-[11px]">College Name</span>
                  <span className="text-slate-500">+</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 text-[11px]">Mail ID</span>
                </>
              )}
            </div>
            <p className="text-slate-500 text-[11px]">
              {isRecognition
                ? "3-column format for Recognition recipients"
                : "3-column format for Event participants"}
            </p>
          </div>

          {/* Card 3: Schedule */}
          <div className="p-4 rounded-xl bg-[#080a11] border border-slate-800/80 space-y-1.5">
            <span className="text-slate-500 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" /> Event Schedule
            </span>
            <p className="text-slate-200 font-medium">{selectedEvent.date}</p>
            <p className="text-slate-500 text-[11px] truncate">
              {selectedEvent.department}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onContinue}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono font-semibold text-xs tracking-wider uppercase shadow-lg shadow-rose-950/50 transition-all hover:translate-x-0.5 cursor-pointer"
          >
            <span>Continue to Data Ingestion</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
