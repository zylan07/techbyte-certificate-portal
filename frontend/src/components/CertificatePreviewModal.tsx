import React, { useEffect, useState, useCallback } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from "lucide-react";
import { Participant, EventConfig } from "../types";
import { getPreviewImageUrl, getPreviewPdfUrl } from "../services/api";

interface CertificatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  initialIndex?: number;
  sessionId: string;
  selectedEvent: EventConfig;
  overlayEventDetails: boolean;
  onToggleOverlayEventDetails: (val: boolean) => void;
}

export const CertificatePreviewModal: React.FC<CertificatePreviewModalProps> = ({
  isOpen,
  onClose,
  participants,
  initialIndex = 0,
  sessionId,
  selectedEvent,
  overlayEventDetails,
  onToggleOverlayEventDetails,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const validParticipants = participants.filter((p) => p.status !== "invalid");
  const currentParticipant = validParticipants[currentIndex] || validParticipants[0];

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setImgLoaded(false);
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < validParticipants.length - 1) {
      setCurrentIndex((i) => i + 1);
      setImgLoaded(false);
    }
  }, [currentIndex, validParticipants.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || !currentParticipant) return null;

  const previewImgUrl = getPreviewImageUrl(
    sessionId,
    currentParticipant.id,
    overlayEventDetails,
    selectedEvent.name
  );

  const previewPdfUrl = getPreviewPdfUrl(
    sessionId,
    currentParticipant.id,
    overlayEventDetails,
    selectedEvent.name
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-[#0c0f18] border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-800/80 flex items-center justify-between gap-4 bg-[#080a11]">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold">
              PREVIEW
            </span>
            <div className="truncate">
              <span className="font-heading text-lg text-white tracking-wide truncate block">
                {currentParticipant.name}
              </span>
              <span className="text-[11px] font-mono text-slate-400 truncate block">
                {currentParticipant.class_section || currentParticipant.college_name || "Recipient"} • {selectedEvent.name}
              </span>
            </div>
          </div>

          {/* Navigation & Controls */}
          <div className="flex items-center gap-2 font-mono text-xs flex-shrink-0">
            <div className="flex items-center gap-1 bg-[#0c0f18] border border-slate-800 rounded-xl px-2 py-1 text-slate-400">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="p-1 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>
                {currentIndex + 1} / {validParticipants.length}
              </span>
              <button
                type="button"
                onClick={handleNext}
                disabled={currentIndex === validParticipants.length - 1}
                className="p-1 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(2, z + 0.2))}
              className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer hidden sm:block"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
              className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer hidden sm:block"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setZoomLevel(1)}
              className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer hidden sm:block"
              title="Reset Zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <a
              href={previewPdfUrl}
              download={`${currentParticipant.name.replace(/\s+/g, "_")}_Certificate.pdf`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download PDF</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ml-1"
              aria-label="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Display Frame */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-[#07090e] flex items-center justify-center">
          <div
            className="transition-transform duration-150 ease-out shadow-2xl rounded-lg overflow-hidden border border-slate-800"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: "center center" }}
          >
            <img
              src={previewImgUrl}
              alt={`Certificate preview for ${currentParticipant.name}`}
              onLoad={() => setImgLoaded(true)}
              className="max-h-[72vh] w-auto object-contain block select-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
