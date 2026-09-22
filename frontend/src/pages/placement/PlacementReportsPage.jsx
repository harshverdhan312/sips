import React, { useState } from "react";
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  FileText,
  Printer,
  Sparkles,
  Building2,
  Share2
} from "lucide-react";
import { Card, CardHeader } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { ComingSoonModal } from "../../components/common/ComingSoonModal";

export function PlacementReportsPage() {
  const [comingSoonOpen, setComingSoonOpen] = useState(false);

  const triggerComingSoon = () => {
    setComingSoonOpen(true);
  };

  const reportsConfig = [
    {
      id: "naac",
      title: "NAAC & NBA Accreditation Compliance Report",
      description: "Standardized metric tables covering Criterion 5 (Student Progression & Campus Placements).",
      format: "PDF Document (Official Signature Ready)",
      generatedDate: "Updated Yesterday, 5:30 PM",
      status: "Ready"
    },
    {
      id: "dean",
      title: "Executive Dean & Principal Placement Briefing",
      description: "Comprehensive executive dashboard detailing placement conversion, median CTCs, and at-risk remediation.",
      format: "Executive Presentation (PDF/PPT)",
      generatedDate: "Updated 3 days ago",
      status: "Ready"
    },
    {
      id: "recruiter",
      title: "Corporate Recruiter Talent Supply Matrix",
      description: "Verified candidate roster categorized by coding milestones (LeetCode, GitHub) and ATS scores.",
      format: "Excel Spreadsheet (.xlsx)",
      generatedDate: "Updated Today, 9:00 AM",
      status: "Ready"
    },
    {
      id: "skills",
      title: "Curriculum Skill Gap Intervention Analysis",
      description: "Detailed recommendations for academic faculty on emerging cloud, containerization, and backend gaps.",
      format: "Analytical Summary Report (PDF)",
      generatedDate: "Updated Last Week",
      status: "Ready"
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileSpreadsheet className="w-8 h-8 text-indigo-600" />
            Institutional Placement & Accreditation Reports
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate and export verified placement documentation for accreditation bodies, college leadership, and recruiters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            icon={Printer}
            onClick={() => window.print()}
          >
            Print Summary
          </Button>
        </div>
      </div>

      {/* Reports Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportsConfig.map((rep) => (
          <Card
            key={rep.id}
            className="flex flex-col justify-between hover:border-slate-300 transition-all border-slate-200/90 shadow-xs"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                  <FileText className="w-5 h-5" />
                </div>
                <Badge variant="success" size="sm">
                  {rep.status}
                </Badge>
              </div>

              <h3 className="font-bold text-slate-900 text-base leading-snug">
                {rep.title}
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                {rep.description}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>{rep.format}</span>
                <span>{rep.generatedDate}</span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={Share2}
                onClick={triggerComingSoon}
              >
                Share
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Download}
                onClick={triggerComingSoon}
              >
                Download Report
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Report Generator Customizer */}
      <Card>
        <CardHeader
          title="Custom Query Report Generator"
          subtitle="Generate tailored cohort slices for department heads or special recruiters"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="cursor-pointer" onClick={triggerComingSoon}>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 cursor-pointer">
              Department Scope
            </label>
            <select
              value="All"
              readOnly
              onMouseDown={(e) => {
                e.preventDefault();
                triggerComingSoon();
              }}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-medium cursor-pointer"
            >
              <option value="All">All Departments (Institutional)</option>
              <option value="CSE">Computer Science & Engineering</option>
              <option value="ISE">Information Technology</option>
              <option value="AIML">Artificial Intelligence & ML</option>
              <option value="ECE">Electronics & Communication</option>
            </select>
          </div>

          <div className="cursor-pointer" onClick={triggerComingSoon}>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 cursor-pointer">
              Minimum CGPA Filter
            </label>
            <select
              readOnly
              onMouseDown={(e) => {
                e.preventDefault();
                triggerComingSoon();
              }}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-medium cursor-pointer"
            >
              <option>No CGPA Minimum (All 480 candidates)</option>
              <option>CGPA 7.0+ (Tier-2 Eligible)</option>
              <option>CGPA 8.0+ (Tier-1 Eligible)</option>
              <option>CGPA 8.5+ (Dream / Super Dream)</option>
            </select>
          </div>

          <div className="cursor-pointer" onClick={triggerComingSoon}>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 cursor-pointer">
              Output Format
            </label>
            <select
              readOnly
              onMouseDown={(e) => {
                e.preventDefault();
                triggerComingSoon();
              }}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-medium cursor-pointer"
            >
              <option>PDF Document (.pdf)</option>
              <option>Microsoft Excel (.xlsx)</option>
              <option>CSV Dataset (.csv)</option>
            </select>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
          <Button
            variant="primary"
            size="md"
            icon={Download}
            onClick={triggerComingSoon}
          >
            Generate & Download Custom Slice
          </Button>
        </div>
      </Card>

      <ComingSoonModal
        isOpen={comingSoonOpen}
        onClose={() => setComingSoonOpen(false)}
        title="Coming Soon"
        body="This feature is currently under development and will be available in a future update."
      />
    </div>
  );
}
