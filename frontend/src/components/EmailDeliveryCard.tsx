import React, { useState } from "react";
import {
  Mail,
  Send,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Activity
} from "lucide-react";
import { DeliveryReport, EmailConfigStatus, EventConfig, ValidationSummary } from "../types";
import { testEmailConnectionApi } from "../services/api";

interface EmailDeliveryCardProps {
  selectedEvent: EventConfig;
  validationSummary: ValidationSummary;
  deliveryReport: DeliveryReport | null;
  isSending: boolean;
  isRetrying: boolean;
  emailConfigStatus: EmailConfigStatus | null;
  onSendEmails: () => Promise<void>;
  onRetryFailed: () => Promise<void>;
  onBackToGeneration: () => void;
}

export const EmailDeliveryCard: React.FC<EmailDeliveryCardProps> = ({
  selectedEvent,
  validationSummary,
  deliveryReport,
  isSending,
  isRetrying,
  emailConfigStatus,
  onSendEmails,
  onRetryFailed,
  onBackToGeneration,
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const totalCertificates = validationSummary.valid_records;

  const handleConfirmSend = async () => {
    setShowConfirmModal(false);
    await onSendEmails();
  };

  const handleTestSmtp = async () => {
    setIsTestingSmtp(true);
    setSmtpTestResult(null);
    try {
      const res = await testEmailConnectionApi();
      setSmtpTestResult({ success: res.success, message: res.message });
    } catch (err: any) {
      setSmtpTestResult({ success: false, message: err.message || "SMTP test connection failed" });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  return (
    <div className="bg-[#0e121e] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-rose-400 font-semibold block mb-1">
            Phase 04 // Distribution System
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl tracking-wide text-white">
            {deliveryReport ? "CERTIFICATE DELIVERY REPORT" : "DISPATCH CERTIFICATES VIA EMAIL"}
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Automated delivery attaches each recipient's personalized PDF directly to their registered email.
          </p>
        </div>

        <button
          type="button"
          disabled={isTestingSmtp}
          onClick={handleTestSmtp}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#080a11] hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-300 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Activity className="w-3.5 h-3.5 text-rose-400" />
          <span>{isTestingSmtp ? "Testing..." : "Test SMTP Link"}</span>
        </button>
      </div>

      {/* SMTP Test Alert */}
      {smtpTestResult && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-mono flex items-center gap-2 ${
            smtpTestResult.success
              ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
              : "bg-rose-950/30 border-rose-500/30 text-rose-300"
          }`}
        >
          {smtpTestResult.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          )}
          <span>{smtpTestResult.message}</span>
        </div>
      )}

      {/* Distribution Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
        <div className="p-4 rounded-xl bg-[#080a11] border border-slate-800/80">
          <span className="text-slate-500 text-[10px] uppercase tracking-wider block">Recipients</span>
          <span className="text-xl font-bold text-white mt-1 block">{totalCertificates}</span>
        </div>
        <div className="p-4 rounded-xl bg-[#080a11] border border-slate-800/80">
          <span className="text-slate-500 text-[10px] uppercase tracking-wider block">Attachments</span>
          <span className="text-xl font-bold text-white mt-1 block">{totalCertificates} Individual PDFs</span>
        </div>
        <div className="p-4 rounded-xl bg-[#080a11] border border-slate-800/80">
          <span className="text-slate-500 text-[10px] uppercase tracking-wider block">Engine Status</span>
          <span className="text-xl font-bold text-emerald-400 mt-1 block">READY</span>
        </div>
      </div>

      {/* Pre-Delivery Notice */}
      {!deliveryReport && (
        <div className="p-5 rounded-xl bg-[#080a11] border border-slate-800/80 font-mono text-xs space-y-2 text-slate-400">
          <div className="flex items-center gap-2 text-slate-200 font-semibold">
            <Mail className="w-4 h-4 text-rose-400" />
            <span>Ready for Batch Dispatch</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Clicking Send will initiate delivery for all {totalCertificates} verified recipients. Each participant will receive a dedicated email containing their Certificate PDF attachment.
          </p>
        </div>
      )}

      {/* Post-Delivery Report Table */}
      {deliveryReport && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs text-center">
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
              <span className="text-[10px] text-emerald-400 uppercase font-semibold">Sent Successfully</span>
              <span className="text-2xl font-bold text-emerald-400 block mt-1">{deliveryReport.emails_sent}</span>
            </div>
            <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30">
              <span className="text-[10px] text-rose-400 uppercase font-semibold">Failed</span>
              <span className="text-2xl font-bold text-rose-400 block mt-1">{deliveryReport.failed}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#080a11] border border-slate-800 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Batch</span>
              <span className="text-2xl font-bold text-white block mt-1">{deliveryReport.total_participants}</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#080a11] overflow-hidden">
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-[#0c0f18] text-slate-400 sticky top-0 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Recipient</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Attachment</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {deliveryReport.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40">
                      <td className="py-2 px-3 font-medium text-slate-200">{item.name}</td>
                      <td className="py-2 px-3 text-slate-400 text-[11px]">{item.email}</td>
                      <td className="py-2 px-3 text-slate-400 text-[11px]">{item.certificate}</td>
                      <td className="py-2 px-3">
                        {item.status === "SENT" ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
                          </span>
                        ) : (
                          <span className="text-rose-400 flex items-center gap-1" title={item.error || ""}>
                            <XCircle className="w-3.5 h-3.5" /> Failed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-2 flex justify-between items-center">
        <button
          type="button"
          onClick={onBackToGeneration}
          className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white font-mono text-xs transition-colors cursor-pointer"
        >
          ← Back to Generator
        </button>

        {!deliveryReport ? (
          <button
            type="button"
            disabled={isSending || totalCertificates === 0}
            onClick={() => setShowConfirmModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono font-semibold text-xs tracking-wider uppercase shadow-lg shadow-rose-950/50 transition-all hover:translate-x-0.5 cursor-pointer disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
            <span>{isSending ? "Dispatching..." : "Send Certificates"}</span>
          </button>
        ) : deliveryReport.failed > 0 ? (
          <button
            type="button"
            disabled={isRetrying}
            onClick={onRetryFailed}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-mono font-semibold text-xs tracking-wider uppercase shadow-lg shadow-amber-950/50 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isRetrying ? "Retrying..." : `Retry ${deliveryReport.failed} Failed`}</span>
          </button>
        ) : (
          <div className="inline-flex items-center gap-2 text-emerald-400 font-mono text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>All Emails Successfully Delivered</span>
          </div>
        )}
      </div>

      {/* Send Confirmation Dialog */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowConfirmModal(false)}
        >
          <div
            className="bg-[#0e121e] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative font-mono text-xs space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-rose-400 text-sm font-semibold uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" />
              <span>Confirm Email Dispatch</span>
            </div>

            <p className="text-slate-300 leading-relaxed">
              You are about to dispatch <strong>{totalCertificates}</strong> personalized certificate emails for <strong>{selectedEvent.name}</strong>.
            </p>

            <div className="p-3 bg-[#080a11] rounded-xl border border-slate-800 space-y-1.5 text-slate-400 text-[11px]">
              <div>Workflow: <span className="text-white">{selectedEvent.name}</span></div>
              <div>Recipients: <span className="text-white">{totalCertificates} addresses</span></div>
              <div>Attachment: <span className="text-rose-400">[Name]_Techbyte_Summit_26.pdf</span></div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSend}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-colors cursor-pointer shadow-md shadow-rose-950/50"
              >
                Yes, Dispatch Emails
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
