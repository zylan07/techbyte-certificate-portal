import React, { useState, useEffect } from "react";
import { ArrowRight, X } from "lucide-react";
import { Header } from "../components/Header";
import { StepIndicator } from "../components/StepIndicator";
import { EventSelector } from "../components/EventSelector";
import { ExcelUpload } from "../components/ExcelUpload";
import { ParticipantTable } from "../components/ParticipantTable";
import { GenerationCard } from "../components/GenerationCard";
import { EmailDeliveryCard } from "../components/EmailDeliveryCard";
import { CertificatePreviewModal } from "../components/CertificatePreviewModal";
import { UploadErrorToast } from "../components/UploadErrorToast";

import {
  EventConfig,
  ValidationSummary,
  Participant,
  GenerateResponse,
  DeliveryReport,
  EmailConfigStatus
} from "../types";

import { EVENTS } from "../config/events";
import {
  uploadExcelFile,
  addSingleRecipientApi,
  generateCertificatesApi,
  sendCertificatesEmailApi,
  retryFailedEmailsApi,
  fetchEmailConfigStatus,
  selectSessionEventApi
} from "../services/api";

export const PortalPage: React.FC = () => {
  // Navigation & Workflow state
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [maxCompletedStep, setMaxCompletedStep] = useState<number>(1);

  // Event state
  const [selectedEvent, setSelectedEvent] = useState<EventConfig>(EVENTS[0]);

  // Upload & Participant data state
  const [isUploading, setIsUploading] = useState(false);
  const [validationSummary, setValidationSummary] = useState<ValidationSummary | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<{ current: number; total: number } | null>(null);
  const [generationResult, setGenerationResult] = useState<GenerateResponse | null>(null);
  const [overlayEventDetails, setOverlayEventDetails] = useState(false);

  // Preview modal state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewInitialIndex, setPreviewInitialIndex] = useState(0);

  // Email state
  const [isSending, setIsSending] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [deliveryReport, setDeliveryReport] = useState<DeliveryReport | null>(null);
  const [emailConfigStatus, setEmailConfigStatus] = useState<EmailConfigStatus | null>(null);

  // Notification Banner
  const [notification, setNotification] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  const showNotification = (message: string, type: "success" | "error" | "info" = "info") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 6000);
  };

  useEffect(() => {
    fetchEmailConfigStatus()
      .then(setEmailConfigStatus)
      .catch((err) => console.log("Notice fetching SMTP status:", err));
  }, []);

  // Step 1: Handle Event Selection & Session Synchronization
  const handleSelectEvent = async (event: EventConfig) => {
    setSelectedEvent(event);
    if (validationSummary) {
      setGenerationResult(null);
      setGenerationProgress(null);
      setDeliveryReport(null);
      setParticipants((prev) =>
        prev.map((p) => ({
          ...p,
          certificate_path: null,
          certificate_event: null,
          status: p.status === "invalid" || p.status === "duplicate" ? p.status : "ready",
        }))
      );
      await selectSessionEventApi(validationSummary.session_id, event.name).catch((err) =>
        console.warn("Notice syncing event to session:", err)
      );
      showNotification(`Switched active workflow to ${event.name}`, "info");
    }
  };

  // Step 1: Handle Event Confirmation
  const handleEventContinue = () => {
    setCurrentStep(2);
    setMaxCompletedStep((prev) => Math.max(prev, 1));
  };

  // Step 2: Handle Single Recipient Addition (Direct Entry)
  const handleAddSingleRecipient = async (name: string, mailId: string, classSection?: string) => {
    setIsUploading(true);
    setUploadError(null);
    setNotification(null);
    try {
      const summary = await addSingleRecipientApi(name, mailId, selectedEvent.name, classSection);
      setValidationSummary(summary);
      setParticipants(summary.participants);
      setGenerationResult(null);
      setDeliveryReport(null);

      showNotification(`Verified recipient: ${name}. Ready for certificate generation!`, "success");
    } catch (err: any) {
      setUploadError(err.message || "Error validating recipient");
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  // Step 2: Handle File Upload
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    setNotification(null);
    try {
      const summary = await uploadExcelFile(file, selectedEvent.name);
      setValidationSummary(summary);
      setParticipants(summary.participants);
      setGenerationResult(null);
      setDeliveryReport(null);

      if (summary.invalid_records > 0 || summary.duplicate_records > 0) {
        showNotification(
          `Parsed ${summary.total_records} rows: ${summary.valid_records} valid, ${summary.invalid_records} invalid, ${summary.duplicate_records} duplicates.`,
          "info"
        );
      } else {
        showNotification(
          `Successfully verified all ${summary.total_records} participant records!`,
          "success"
        );
      }
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload and validate spreadsheet");
    } finally {
      setIsUploading(false);
    }
  };

  // Proceed from Upload to Generation
  const handleProceedToGeneration = (ignoreWarnings: boolean = false) => {
    if (!validationSummary) return;
    setCurrentStep(3);
    setMaxCompletedStep((prev) => Math.max(prev, 2));
  };

  // Step 3: Handle Certificate Generation
  const handleGenerateCertificates = async () => {
    if (!validationSummary || isGenerating) return;

    setIsGenerating(true);
    setNotification(null);

    const totalToGenerate = validationSummary.valid_records;
    let currentCount = 0;

    const progressInterval = setInterval(() => {
      currentCount = Math.min(totalToGenerate - 1, currentCount + Math.ceil(totalToGenerate / 15) || 1);
      setGenerationProgress({ current: currentCount, total: totalToGenerate });
    }, 180);

    try {
      const result = await generateCertificatesApi(
        validationSummary.session_id,
        selectedEvent.name,
        overlayEventDetails
      );

      clearInterval(progressInterval);
      setGenerationProgress({ current: totalToGenerate, total: totalToGenerate });
      setGenerationResult(result);
      setParticipants(result.participants);
      setMaxCompletedStep((prev) => Math.max(prev, 3));

      showNotification(
        `Generated ${result.total_generated} high-resolution PDF certificates successfully!`,
        "success"
      );
    } catch (err: any) {
      clearInterval(progressInterval);
      showNotification(err.message || "Error during certificate generation", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  // Open Preview Modal for specific participant
  const handlePreviewParticipant = (participant: Participant) => {
    const validList = participants.filter((p) => p.status !== "invalid");
    const idx = validList.findIndex((p) => p.id === participant.id);
    setPreviewInitialIndex(idx >= 0 ? idx : 0);
    setPreviewOpen(true);
  };

  const handleOpenGeneralPreview = () => {
    setPreviewInitialIndex(0);
    setPreviewOpen(true);
  };

  // Step 4: Handle Email Dispatch
  const handleSendEmails = async () => {
    if (!validationSummary || isSending) return;

    setIsSending(true);
    setNotification(null);
    try {
      const report = await sendCertificatesEmailApi(
        validationSummary.session_id,
        selectedEvent.name
      );
      setDeliveryReport(report);
      setMaxCompletedStep((prev) => Math.max(prev, 4));

      showNotification(
        `Email dispatch complete: ${report.emails_sent} sent, ${report.failed} failed.`,
        report.failed === 0 ? "success" : "info"
      );
    } catch (err: any) {
      showNotification(err.message || "Error sending certificate emails", "error");
    } finally {
      setIsSending(false);
    }
  };

  // Step 4: Retry Failed Emails
  const handleRetryFailed = async () => {
    if (!validationSummary || isRetrying) return;

    setIsRetrying(true);
    setNotification(null);
    try {
      const report = await retryFailedEmailsApi(
        validationSummary.session_id,
        selectedEvent.name
      );
      setDeliveryReport(report);

      showNotification(
        `Retry execution completed: ${report.emails_sent} total delivered, ${report.failed} remaining failed.`,
        report.failed === 0 ? "success" : "info"
      );
    } catch (err: any) {
      showNotification(err.message || "Error during retry delivery", "error");
    } finally {
      setIsRetrying(false);
    }
  };

  const isRecognition = selectedEvent.template === "recognition";

  return (
    <div className="min-h-screen bg-[#07090e] bg-grid-pattern text-slate-100 flex flex-col font-sans selection:bg-rose-500/30 selection:text-rose-200">
      <Header />

      {/* Hero / Portal Title Banner */}
      <div className="border-b border-slate-800/80 bg-[#090b12]/60 backdrop-blur-sm py-8 px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-xs font-semibold uppercase tracking-wider">
            <span>TechByte Summit '26 Official Certificate System</span>
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl text-white tracking-wider">
            CERTIFICATE MANAGEMENT PORTAL
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Generate, validate, preview and distribute certificates through a unified certificate automation system.
          </p>
        </div>
      </div>

      <StepIndicator
        currentStep={currentStep}
        onStepClick={(step) => setCurrentStep(step)}
        maxCompletedStep={maxCompletedStep}
      />

      {/* Fixed Error Pop-up Toast for Upload & Validation Failures */}
      <UploadErrorToast error={uploadError} onDismiss={() => setUploadError(null)} />

      {/* Floating Status Notification for Success & Info only (never inline upload errors) */}
      {notification && notification.type !== "error" && (
        <div className="max-w-4xl mx-auto px-4 mt-4 w-full">
          <div
            className={`p-3.5 rounded-xl font-mono text-xs font-semibold flex items-center justify-between border shadow-lg ${
              notification.type === "success"
                ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-200"
                : "bg-[#0e121e] border-slate-800 text-slate-200"
            }`}
          >
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white ml-3 cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Main Dynamic Workflow View */}
      <main className="flex-1 pb-16">
        {currentStep === 1 && (
          <EventSelector
            events={EVENTS}
            selectedEvent={selectedEvent}
            onSelectEvent={handleSelectEvent}
            onContinue={handleEventContinue}
          />
        )}

        {currentStep === 2 && (
          <div className="space-y-8">
            <ExcelUpload
              selectedEvent={selectedEvent}
              onUpload={handleFileUpload}
              onAddSingle={handleAddSingleRecipient}
              isUploading={isUploading}
              validationSummary={validationSummary}
              onProceedToGeneration={handleProceedToGeneration}
              onBack={() => setCurrentStep(1)}
            />

            {participants.length > 0 && (
              <div className="max-w-5xl mx-auto px-4 space-y-4">
                <ParticipantTable
                  participants={participants}
                  onPreviewParticipant={handlePreviewParticipant}
                  isRecognition={isRecognition}
                />

                {/* Secondary Proceed Action at bottom of Participant Table */}
                {validationSummary && validationSummary.valid_records > 0 && (
                  <div className="p-5 rounded-2xl bg-[#0e121e] border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-xl">
                    <div className="font-mono text-xs text-slate-400">
                      <span>Ready to generate certificates for </span>
                      <strong className="text-emerald-400 font-semibold">{validationSummary.valid_records} verified recipients</strong>
                    </div>

                    <button
                      type="button"
                      id="proceed-to-generation-footer-btn"
                      onClick={() => handleProceedToGeneration(true)}
                      className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-950/50 hover:translate-x-0.5 transition-all cursor-pointer"
                    >
                      <span>PROCEED TO CERTIFICATE GENERATION</span>
                      <ArrowRight className="w-4 h-4 text-rose-200 stroke-[2.5]" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {currentStep === 3 && validationSummary && (
          <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
            <GenerationCard
              selectedEvent={selectedEvent}
              validationSummary={validationSummary}
              isGenerating={isGenerating}
              generationProgress={generationProgress}
              generationResult={generationResult}
              onGenerate={handleGenerateCertificates}
              onOpenPreview={handleOpenGeneralPreview}
              onContinueToEmail={() => setCurrentStep(4)}
              overlayEventDetails={overlayEventDetails}
              onToggleOverlayEventDetails={setOverlayEventDetails}
            />

            <ParticipantTable
              participants={participants}
              onPreviewParticipant={handlePreviewParticipant}
              isRecognition={isRecognition}
            />
          </div>
        )}

        {currentStep === 4 && validationSummary && (
          <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
            <EmailDeliveryCard
              selectedEvent={selectedEvent}
              validationSummary={validationSummary}
              deliveryReport={deliveryReport}
              isSending={isSending}
              isRetrying={isRetrying}
              emailConfigStatus={emailConfigStatus}
              onSendEmails={handleSendEmails}
              onRetryFailed={handleRetryFailed}
              onBackToGeneration={() => setCurrentStep(3)}
            />
          </div>
        )}
      </main>

      {/* Certificate Preview Modal */}
      {validationSummary && (
        <CertificatePreviewModal
          isOpen={previewOpen}
          onClose={() => setPreviewOpen(false)}
          participants={participants}
          initialIndex={previewInitialIndex}
          sessionId={validationSummary.session_id}
          selectedEvent={selectedEvent}
          overlayEventDetails={overlayEventDetails}
          onToggleOverlayEventDetails={setOverlayEventDetails}
        />
      )}

      {/* Institutional Technical Footer */}
      <footer className="border-t border-slate-800/80 bg-[#090b12] py-6 px-4 text-center font-mono text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span className="text-slate-400 font-semibold">TECHBYTE SUMMIT '26</span>
            <span>• Certificate Automation System</span>
          </div>
          <span>Department of Computer Science and Engineering, KPR Institute of Engineering and Technology</span>
        </div>
      </footer>
    </div>
  );
};
