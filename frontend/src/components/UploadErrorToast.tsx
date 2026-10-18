import React, { useEffect, useRef, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface UploadErrorToastProps {
  error: string | null;
  onDismiss: () => void;
  autoDismissMs?: number;
}

export const UploadErrorToast: React.FC<UploadErrorToastProps> = ({
  error,
  onDismiss,
  autoDismissMs = 6000,
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!error) return;

    if (isPaused) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setTimeout(() => {
      onDismiss();
    }, autoDismissMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [error, isPaused, autoDismissMs, onDismiss]);

  if (!error) return null;

  return (
    <aside
      role="alert"
      aria-live="assertive"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="fixed z-[9999] top-3 sm:top-4 md:top-6 right-3 sm:right-4 md:right-6 left-3 sm:left-auto max-w-[calc(100%-24px)] sm:max-w-[480px] md:max-w-[560px] w-full animate-toast-slide-in pointer-events-auto"
    >
      <div className="relative overflow-hidden rounded-2xl bg-[#140609] border border-rose-500/50 p-4 sm:p-5 shadow-[0_12px_40px_rgba(0,0,0,0.8),0_0_20px_rgba(225,29,72,0.25)] backdrop-blur-xl">
        {/* Decorative left accent edge */}
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-rose-500 via-rose-600 to-rose-700"></div>

        <div className="flex items-start gap-3 sm:gap-3.5 pl-1.5">
          {/* Warning Icon Badge */}
          <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center flex-shrink-0 text-rose-400 mt-0.5 shadow-sm shadow-rose-950/60">
            <AlertTriangle className="w-4 h-4 stroke-[2.2]" />
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-rose-400">
                Phase 02 // Pipeline Failure
              </span>
            </div>

            <h4 className="font-heading text-base sm:text-lg tracking-wider text-white font-bold uppercase leading-tight">
              UPLOAD VALIDATION FAILED
            </h4>

            <p className="font-mono text-xs text-rose-100/90 leading-relaxed mt-1.5 break-words whitespace-pre-wrap">
              {error}
            </p>
          </div>

          {/* Close Dismiss Button */}
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss upload error notification"
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Footer info bar */}
        <div className="mt-3 pt-2.5 border-t border-rose-950/60 flex items-center justify-between text-[10px] font-mono text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Verify spreadsheet headers against required template
          </span>
          <span className="text-slate-500 hidden sm:inline">
            {isPaused ? "Paused on hover" : "Auto-dismiss in 6s"}
          </span>
        </div>
      </div>
    </aside>
  );
};
