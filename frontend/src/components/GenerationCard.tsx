import React from "react";
import {
  Sparkles,
  Download,
  Eye,
  CheckCircle2,
  ArrowRight,
  Cpu
} from "lucide-react";
import { EventConfig, GenerateResponse, ValidationSummary } from "../types";
import { getZipDownloadUrl } from "../services/api";

interface GenerationCardProps {
  selectedEvent: EventConfig;
  validationSummary: ValidationSummary;
  isGenerating: boolean;
  generationProgress: { current: number; total: number } | null;
  generationResult: GenerateResponse | null;
  onGenerate: () => void;
  onOpenPreview: () => void;
  onContinueToEmail: () => void;
  overlayEventDetails: boolean;
  onToggleOverlayEventDetails: (val: boolean) => void;
}

export const GenerationCard: React.FC<GenerationCardProps> = ({
  selectedEvent,
  validationSummary,
  isGenerating,
  generationProgress,
  generationResult,
  onGenerate,
  onOpenPreview,
  onContinueToEmail,
  overlayEventDetails,
  onToggleOverlayEventDetails,
}) => {
  const totalEligible = validationSummary.valid_records;
  const isCompleted = generationResult !== null && !isGenerating;
  const isRecognition = selectedEvent.template === "recognition";

  return (
    <div className="bg-[#0e121e] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-rose-400 font-semibold block mb-1">
            Phase 03 // Certificate Engine
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl tracking-wide text-white">
            GENERATE INDIVIDUAL PDF CERTIFICATES
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            High-DPI vector typography rendering over template: {selectedEvent.template_filename || "Official Template"}
          </p>
        </div>

        {!isRecognition && (
          <label className="flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer select-none px-3 py-1.5 rounded-xl bg-[#080a11] border border-slate-800">
            <input
              type="checkbox"
              checked={overlayEventDetails}
              onChange={(e) => onToggleOverlayEventDetails(e.target.checked)}
              className="rounded border-slate-700 text-rose-600 focus:ring-rose-500 bg-[#080a11]"
            />
            <span>Overlay Event & Date</span>
          </label>
        )}
      </div>

      {/* Progress or Status Area */}
      {isGenerating ? (
        <div className="p-6 rounded-2xl bg-[#080a11] border border-slate-800 space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-rose-400 font-semibold flex items-center gap-2">
              <Cpu className="w-4 h-4 animate-spin" />
              GENERATING CERTIFICATES
            </span>
            <span className="text-slate-400">
              Processing {generationProgress?.current || 1} / {generationProgress?.total || totalEligible}
            </span>
          </div>

          <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-200"
              style={{
                width: `${Math.min(
                  100,
                  Math.round(
                    ((generationProgress?.current || 1) / (generationProgress?.total || totalEligible || 1)) * 100
                  )
                )}%`,
              }}
            ></div>
          </div>

          <p className="text-[11px] text-slate-500">
            Applying auto-scaling font math and high-DPI vector ReportLab compilation...
          </p>
        </div>
      ) : isCompleted ? (
        <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-4 font-mono text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                All {generationResult?.total_generated} Certificates Generated Successfully
              </h4>
              <p className="text-slate-400 text-[11px] mt-0.5">
                PDF files are rendered at 2000×1414 resolution and stored in session cache.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {generationResult?.zip_download_url && (
              <a
                href={getZipDownloadUrl(generationResult.session_id)}
                download
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4 text-rose-400" />
                <span>Download Archive (.ZIP)</span>
              </a>
            )}

            <button
              type="button"
              onClick={onOpenPreview}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#080a11] border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>Preview Certificates</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-[#080a11] border border-slate-800 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between flex-wrap gap-2 text-slate-400">
            <span>Eligible Recipients: <strong className="text-white">{totalEligible}</strong></span>
            <span>Target Resolution: <strong className="text-white">2000 × 1414 (High-DPI)</strong></span>
            <span>File Convention: <strong className="text-rose-400">[Name]_Techbyte_Summit_26.pdf</strong></span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Ready to generate individual vector PDF certificates. The engine automatically computes name width, applies auto-scaling font math, and embeds crisp institutional signatures.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-2 flex justify-between items-center">
        <button
          type="button"
          onClick={onOpenPreview}
          disabled={!isCompleted}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white font-mono text-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Eye className="w-4 h-4" />
          <span>Quick Preview</span>
        </button>

        {!isCompleted ? (
          <button
            type="button"
            disabled={isGenerating || totalEligible === 0}
            onClick={onGenerate}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono font-semibold text-xs tracking-wider uppercase shadow-lg shadow-rose-950/50 transition-all hover:translate-x-0.5 cursor-pointer disabled:opacity-40"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate All Certificates</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onContinueToEmail}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono font-semibold text-xs tracking-wider uppercase shadow-lg shadow-rose-950/50 transition-all hover:translate-x-0.5 cursor-pointer"
          >
            <span>Proceed to Email Distribution</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
