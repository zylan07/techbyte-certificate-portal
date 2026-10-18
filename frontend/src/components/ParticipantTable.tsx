import React, { useState, useMemo } from "react";
import {
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  FileCheck2,
  Clock
} from "lucide-react";
import { Participant } from "../types";

interface ParticipantTableProps {
  participants: Participant[];
  onPreviewParticipant: (participant: Participant) => void;
  isRecognition?: boolean;
}

export const ParticipantTable: React.FC<ParticipantTableProps> = ({
  participants,
  onPreviewParticipant,
  isRecognition = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "READY" | "INVALID" | "DUPLICATE" | "GENERATED" | "SENT">("ALL");
  const [sortField, setSortField] = useState<"row_num" | "name" | "college_name">("row_num");
  const [sortAsc, setSortAsc] = useState(true);

  const filteredAndSorted = useMemo(() => {
    return participants
      .filter((p) => {
        if (statusFilter === "READY" && p.status !== "ready" && p.status !== "generated") return false;
        if (statusFilter === "INVALID" && p.status !== "invalid") return false;
        if (statusFilter === "DUPLICATE" && p.status !== "duplicate") return false;
        if (statusFilter === "GENERATED" && p.status !== "generated") return false;
        if (statusFilter === "SENT" && p.status !== "sent") return false;

        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.college_name.toLowerCase().includes(q) ||
          (p.class_section && p.class_section.toLowerCase().includes(q)) ||
          p.mail_id.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (typeof valA === "string") {
          const comp = valA.localeCompare(valB as string);
          return sortAsc ? comp : -comp;
        }
        return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
      });
  }, [participants, searchTerm, statusFilter, sortField, sortAsc]);

  const handleSort = (field: "row_num" | "name" | "college_name") => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const getStatusBadge = (status: string, error?: string | null) => {
    switch (status) {
      case "ready":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-950/50 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            Ready
          </span>
        );
      case "generated":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-cyan-950/50 text-cyan-400 border border-cyan-500/30">
            <FileCheck2 className="w-3 h-3" />
            Generated
          </span>
        );
      case "sent":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-950/50 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            Dispatched
          </span>
        );
      case "duplicate":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-amber-950/50 text-amber-400 border border-amber-500/30" title={error || ""}>
            <Clock className="w-3 h-3" />
            Duplicate
          </span>
        );
      case "invalid":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-rose-950/50 text-rose-400 border border-rose-500/30" title={error || ""}>
            <XCircle className="w-3 h-3" />
            Invalid
          </span>
        );
    }
  };

  return (
    <div className="bg-[#0e121e] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Table Header Controls */}
      <div className="p-5 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
            Participant Records Directory
          </span>
          <h3 className="font-heading text-xl text-white tracking-wide">
            VERIFIED PARTICIPANTS ({participants.length})
          </h3>
        </div>

        {/* Search & Filter pills */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 font-mono text-xs">
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search participants..."
              className="w-full bg-[#080a11] border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-[#080a11] border border-slate-800 rounded-xl">
            {(["ALL", "READY", "GENERATED", "SENT", "INVALID"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`px-2.5 py-1 rounded-lg text-[10px] uppercase font-semibold transition-colors cursor-pointer ${
                  statusFilter === filter
                    ? "bg-rose-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Element */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-[#080a11] text-slate-400 border-b border-slate-800 uppercase text-[11px]">
            <tr>
              <th
                onClick={() => handleSort("row_num")}
                className="py-3 px-4 cursor-pointer hover:text-white"
              >
                #
              </th>
              <th
                onClick={() => handleSort("name")}
                className="py-3 px-4 cursor-pointer hover:text-white"
              >
                Recipient Name
              </th>
              <th
                onClick={() => handleSort("college_name")}
                className="py-3 px-4 cursor-pointer hover:text-white"
              >
                {isRecognition ? "Class / Section" : "Institution / College"}
              </th>
              <th className="py-3 px-4">Delivery Mail ID</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-slate-300">
            {filteredAndSorted.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  No participants match current filters
                </td>
              </tr>
            ) : (
              filteredAndSorted.map((p) => (
                <tr key={p.id} className="hover:bg-[#111625]/60 transition-colors">
                  <td className="py-3 px-4 text-slate-500">{p.row_num}</td>
                  <td className="py-3 px-4 font-medium text-white">{p.name}</td>
                  <td className="py-3 px-4 text-slate-400">
                    {p.class_section || p.college_name || "—"}
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">{p.mail_id}</td>
                  <td className="py-3 px-4">{getStatusBadge(p.status, p.error_detail)}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => onPreviewParticipant(p)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="Preview Certificate"
                    >
                      <Eye className="w-3.5 h-3.5 text-rose-400" />
                      <span>Preview</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
