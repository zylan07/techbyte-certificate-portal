import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  UserPlus,
  Mail,
  User,
  GraduationCap,
  Layers
} from "lucide-react";
import { EventConfig, ValidationSummary } from "../types";
import { getTemplateDownloadUrl, getErrorReportDownloadUrl } from "../services/api";

interface ExcelUploadProps {
  selectedEvent: EventConfig;
  onUpload: (file: File) => Promise<void>;
  onAddSingle?: (name: string, mailId: string, classSection?: string) => Promise<void>;
  isUploading: boolean;
  validationSummary: ValidationSummary | null;
  onProceedToGeneration: (ignoreWarnings?: boolean) => void;
  onBack: () => void;
}

export const ExcelUpload: React.FC<ExcelUploadProps> = ({
  selectedEvent,
  onUpload,
  onAddSingle,
  isUploading,
  validationSummary,
  onProceedToGeneration,
  onBack,
}) => {
  const isRecognition = selectedEvent.template === "recognition";
  const [activeTab, setActiveTab] = useState<"bulk" | "single">("bulk");
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [ignoreWarnings, setIgnoreWarnings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Single recipient form state
  const [singleName, setSingleName] = useState("");
  const [singleClassSection, setSingleClassSection] = useState("");
  const [singleEmail, setSingleEmail] = useState("");
  const [singleError, setSingleError] = useState<string | null>(null);
  const [isSubmittingSingle, setIsSubmittingSingle] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFileName(file.name);
      onUpload(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFileName(file.name);
      onUpload(file);
      e.target.value = "";
    }
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSingleError(null);

    const trimmedName = singleName.trim();
    const trimmedClass = singleClassSection.trim();
    const trimmedEmail = singleEmail.trim();

    if (!trimmedName) {
      setSingleError("Recipient Name cannot be empty");
      return;
    }
    if (isRecognition && !trimmedClass) {
      setSingleError("Class / Section cannot be empty");
      return;
    }
    if (!trimmedEmail) {
      setSingleError("Mail ID cannot be empty");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setSingleError(`Invalid email address format: "${trimmedEmail}"`);
      return;
    }

    if (onAddSingle) {
      setIsSubmittingSingle(true);
      try {
        await onAddSingle(trimmedName, trimmedEmail, trimmedClass || undefined);
        setSingleName("");
        setSingleClassSection("");
        setSingleEmail("");
      } catch (err: any) {
        setSingleError(err.message || "Failed to register recipient");
      } finally {
        setIsSubmittingSingle(false);
      }
    }
  };

  const hasIssues = Boolean(
    validationSummary &&
      (validationSummary.invalid_records > 0 || validationSummary.duplicate_records > 0)
  );

  const canProceed = Boolean(
    validationSummary &&
      validationSummary.valid_records > 0 &&
      (!hasIssues || ignoreWarnings)
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-rose-400 font-semibold block mb-1">
            Phase 02 // Participant Data Ingestion
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl tracking-wide text-white">
            UPLOAD PARTICIPANT DATA
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Active Workflow: <span className="text-rose-400 font-semibold">{selectedEvent.name}</span>
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1.5 p-1 bg-[#090b12] border border-slate-800 rounded-xl self-start sm:self-auto font-mono text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("bulk")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === "bulk"
                ? "bg-rose-600 text-white font-semibold shadow-md shadow-rose-950/50"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Spreadsheet Upload</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("single")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === "single"
                ? "bg-rose-600 text-white font-semibold shadow-md shadow-rose-950/50"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Single Entry</span>
          </button>
        </div>
      </div>

      {/* Main Ingestion Panel */}
      <div className="bg-[#0e121e] border border-slate-800 rounded-2xl p-6 space-y-6">
        {/* Required Input Format Specification Banner */}
        <div className="p-4 rounded-xl bg-[#080a11] border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-rose-400" />
              Required Columns Structure
            </span>

            <a
              href={getTemplateDownloadUrl(selectedEvent.name)}
              download
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-mono text-[11px] transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-rose-400" />
              <span>Download Excel Template</span>
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono text-xs">
            <div className="p-2.5 rounded-lg bg-[#0c0f18] border border-slate-800/80 flex items-center gap-2">
              <span className="w-5 h-5 rounded flex items-center justify-center bg-rose-500/20 text-rose-400 font-bold text-[10px]">1</span>
              <div>
                <span className="text-white font-semibold block">Name</span>
                <span className="text-[10px] text-slate-500">Printed on certificate</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[#0c0f18] border border-slate-800/80 flex items-center gap-2">
              <span className="w-5 h-5 rounded flex items-center justify-center bg-rose-500/20 text-rose-400 font-bold text-[10px]">2</span>
              <div>
                <span className="text-white font-semibold block">{isRecognition ? "Class / Section" : "College Name"}</span>
                <span className="text-[10px] text-slate-500">
                  {isRecognition ? "e.g. III CSE D" : "e.g. KPR Institute"}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-[#0c0f18] border border-slate-800/80 flex items-center gap-2">
              <span className="w-5 h-5 rounded flex items-center justify-center bg-rose-500/20 text-rose-400 font-bold text-[10px]">3</span>
              <div>
                <span className="text-white font-semibold block">Mail ID</span>
                <span className="text-[10px] text-slate-500">Delivery only (not printed)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab 1: Bulk Spreadsheet Upload */}
        {activeTab === "bulk" && (
          <div className="space-y-4">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
                dragActive
                  ? "border-rose-500 bg-rose-950/20"
                  : "border-slate-800 hover:border-slate-700 bg-[#080a11]/60 hover:bg-[#0c0f18]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleChange}
                className="hidden"
              />

              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-600/20 to-rose-900/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-950/30">
                <UploadCloud className="w-7 h-7" />
              </div>

              <div>
                <p className="font-heading text-xl text-white tracking-wide">
                  {selectedFileName ? selectedFileName : "DROP PARTICIPANTS SPREADSHEET HERE"}
                </p>
                <p className="text-xs font-mono text-slate-400 mt-1">
                  Supported formats: .xlsx, .xls, .csv • Max size: 25 MB
                </p>
              </div>

              {selectedFileName && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 font-mono text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>File loaded: {selectedFileName}</span>
                </div>
              )}

              {isUploading && (
                <div className="flex items-center gap-2 text-rose-400 font-mono text-xs mt-2">
                  <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>Parsing and validating participant entries...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Single Direct Recipient Entry */}
        {activeTab === "single" && (
          <form onSubmit={handleSingleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-slate-400 block font-medium flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-rose-400" />
                  Recipient Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={singleName}
                  onChange={(e) => setSingleName(e.target.value)}
                  placeholder="e.g. SATHYA R V"
                  className="w-full bg-[#080a11] border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>

              {/* Class / Section or College */}
              <div className="space-y-1.5">
                <label className="text-slate-400 block font-medium flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-rose-400" />
                  {isRecognition ? "Class / Section *" : "College Name *"}
                </label>
                <input
                  type="text"
                  required
                  value={singleClassSection}
                  onChange={(e) => setSingleClassSection(e.target.value)}
                  placeholder={isRecognition ? "e.g. III CSE D" : "e.g. KPR Institute"}
                  className="w-full bg-[#080a11] border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-slate-400 block font-medium flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-rose-400" />
                  Participant Mail ID *
                </label>
                <input
                  type="email"
                  required
                  value={singleEmail}
                  onChange={(e) => setSingleEmail(e.target.value)}
                  placeholder="e.g. 24cs192@kpriet.ac.in"
                  className="w-full bg-[#080a11] border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>
            </div>

            {singleError && (
              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300 font-mono text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{singleError}</span>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSubmittingSingle}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono font-semibold text-xs tracking-wider uppercase shadow-md shadow-rose-950/40 transition-colors cursor-pointer disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                <span>{isSubmittingSingle ? "Registering..." : "Add & Validate Recipient"}</span>
              </button>
            </div>
          </form>
        )}

        {/* Validation Results Metrics Cards */}
        {validationSummary && (
          <div className="space-y-6 pt-4 border-t border-slate-800/80">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
                Verification Pipeline Status
              </span>
              <h3 className="font-heading text-xl text-white tracking-wide">
                VALIDATION METRICS SUMMARY
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              {/* Total Records */}
              <div className="p-4 rounded-xl bg-[#080a11] border border-slate-800 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  TOTAL RECORDS
                </span>
                <span className="text-2xl font-bold text-white mt-1 block">
                  {validationSummary.total_records}
                </span>
              </div>

              {/* Valid */}
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                  VALID
                </span>
                <span className="text-2xl font-bold text-emerald-400 mt-1 block">
                  {validationSummary.valid_records}
                </span>
              </div>

              {/* Invalid */}
              <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block">
                  INVALID
                </span>
                <span className="text-2xl font-bold text-rose-400 mt-1 block">
                  {validationSummary.invalid_records}
                </span>
              </div>

              {/* Duplicates */}
              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                  DUPLICATES
                </span>
                <span className="text-2xl font-bold text-amber-400 mt-1 block">
                  {validationSummary.duplicate_records}
                </span>
              </div>
            </div>

            {/* Validation Issues Table */}
            {validationSummary.errors.length > 0 && (
              <div className="rounded-xl border border-slate-800 bg-[#080a11] overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between font-mono text-xs">
                  <span className="text-rose-400 flex items-center gap-1.5 font-semibold">
                    <AlertTriangle className="w-4 h-4" />
                    Validation Issues ({validationSummary.errors.length})
                  </span>
                  <a
                    href={getErrorReportDownloadUrl(validationSummary.session_id)}
                    className="text-slate-400 hover:text-white inline-flex items-center gap-1 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-rose-400" />
                    <span>Download Report</span>
                  </a>
                </div>

                <div className="max-h-56 overflow-y-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-[#0c0f18] text-slate-400 sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">Row</th>
                        <th className="py-2.5 px-3">Name</th>
                        <th className="py-2.5 px-3">{isRecognition ? "Class / Section" : "College"}</th>
                        <th className="py-2.5 px-3">Email</th>
                        <th className="py-2.5 px-3">Issue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {validationSummary.errors.map((err, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/40">
                          <td className="py-2 px-3 text-slate-500">{err.row}</td>
                          <td className="py-2 px-3 font-medium text-slate-200">{err.name}</td>
                          <td className="py-2 px-3 text-slate-400">{err.college}</td>
                          <td className="py-2 px-3 text-slate-400 text-[11px]">{err.email}</td>
                          <td className="py-2 px-3 text-rose-400">{err.error}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Warning Override Toggle */}
            {hasIssues && validationSummary.valid_records > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
                <div className="flex items-center gap-2 text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>
                    Some rows contain validation issues. You can skip invalid rows and proceed with {validationSummary.valid_records} valid records.
                  </span>
                </div>
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={ignoreWarnings}
                    onChange={(e) => setIgnoreWarnings(e.target.checked)}
                    className="rounded border-slate-700 text-rose-600 focus:ring-rose-500 bg-[#080a11]"
                  />
                  <span>Proceed with valid rows</span>
                </label>
              </div>
            )}

                        {/* Proceed Action Button Area */}
            <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-800 bg-[#080a11] hover:bg-slate-800 text-slate-300 hover:text-white font-mono text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-slate-400" />
                <span>Back to Events</span>
              </button>

              <button
                type="button"
                id="proceed-to-generation-btn"
                disabled={!canProceed}
                onClick={() => onProceedToGeneration(ignoreWarnings)}
                className={`inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl font-mono font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  canProceed
                    ? "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/50 hover:translate-x-0.5 active:translate-y-0.5"
                    : "bg-slate-800/60 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-50"
                }`}
              >
                <span>PROCEED TO CERTIFICATE GENERATION</span>
                <ArrowRight className="w-4 h-4 text-rose-200 stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
