import React, { useState } from "react";
import {
  ShieldCheck,
  Activity,
  Server,
  Lock,
  Radio,
  CheckCircle2,
  Cpu
} from "lucide-react";

export const Header: React.FC = () => {
  const [showStatus, setShowStatus] = useState(false);

  return (
    <header className="border-b border-slate-800/80 bg-[#090b12]/90 backdrop-blur-md sticky top-0 z-50 pt-[env(safe-area-inset-top,0px)]">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 min-h-16 sm:min-h-18 py-2.5 sm:py-0 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="relative flex-shrink-0 flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-rose-600 to-rose-900 border border-rose-500/30 shadow-lg shadow-rose-950/40 text-white font-mono font-bold text-base sm:text-lg">
            TB
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-heading text-xl sm:text-2xl tracking-wider text-white truncate">
                TECHBYTE SUMMIT 26
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono tracking-wider font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 flex-shrink-0">
                OFFICIAL PORTAL
              </span>
            </div>
            <p className="text-[11px] sm:text-xs font-mono text-slate-400 tracking-wide uppercase truncate">
              CERTIFICATE MANAGEMENT PORTAL
            </p>
          </div>
        </div>

        {/* Right Info & Status Indicator */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <div className="hidden md:flex flex-col text-right font-mono">
            <span className="text-[11px] font-medium text-slate-300">Department of CSE</span>
            <span className="text-[10px] text-slate-500">KPR Institute of Engineering & Technology</span>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden md:block"></div>

          <button
            onClick={() => setShowStatus(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border text-[11px] sm:text-xs font-mono transition-all cursor-pointer bg-emerald-950/30 text-emerald-400 border-emerald-500/30 hover:bg-emerald-900/40"
            title="System Status"
            aria-label="System Status"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
            <span className="hidden sm:inline">System: Operational</span>
            <span className="sm:hidden">Online</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping ml-0.5"></span>
          </button>
        </div>
      </div>

      {/* System Status Modal (Clean, read-only, NO secrets, no SMTP passwords or API keys) */}
      {showStatus && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowStatus(false)}
        >
          <div
            className="bg-[#0e121e] border border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2 text-rose-400 font-mono text-sm uppercase tracking-wider font-semibold">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>System Status</span>
              </div>
              <button
                onClick={() => setShowStatus(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close status dialog"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="bg-[#080a11] border border-slate-800/80 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-slate-500" /> Service
                  </span>
                  <span className="text-slate-200 font-medium">Certificate Automation Gateway</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-slate-500" /> Connectivity
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950/50 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Operational
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-slate-500" /> Rendering Pipeline
                  </span>
                  <span className="text-slate-200">ReportLab High-DPI Vector Engine</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-500" /> Security & Transit
                  </span>
                  <span className="text-emerald-400">Encrypted (TLS / Internal)</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Environment</span>
                  <span className="text-slate-200">Production (Live Summit 26)</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl flex items-start gap-2.5 text-slate-300 text-[11px] leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>
                  The certificate automation cluster is operational. Automated vector overlay, batch rendering, and secure email delivery services are running smoothly.
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-4 mt-2">
              <button
                type="button"
                onClick={() => setShowStatus(false)}
                className="px-4 py-2 text-xs font-mono font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
