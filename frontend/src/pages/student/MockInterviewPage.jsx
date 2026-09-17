import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Mic,
  Briefcase,
  Info
} from "lucide-react";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";

export function MockInterviewPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Mic className="w-8 h-8 text-indigo-600" />
            AI Mock Interview Simulator
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Voice-enabled technical and behavioral mock interview sessions.
          </p>
        </div>
      </div>

      {/* Honest Unavailable State Card */}
      <Card className="p-12 text-center max-w-xl mx-auto border-slate-200 shadow-sm">
        <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
          <Mic className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-extrabold text-slate-900 mb-2">
          AI Mock Interviews Aren't Available Yet
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
          This feature will appear here once the interview intelligence service is connected.
        </p>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left mb-6 text-xs text-slate-600 space-y-2">
          <div className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1">
            <Info className="w-4 h-4 text-indigo-600" /> Planned Simulator Capabilities:
          </div>
          <p>• Real-time speech-to-text transcription and cadence telemetry (WPM)</p>
          <p>• Automated STAR response structure evaluation and gap diagnostics</p>
          <p>• Role-specific panel questions calibrated for Tier-1 recruitment bars</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Button
            variant="primary"
            size="sm"
            icon={Briefcase}
            onClick={() => navigate("/student/jobs")}
          >
            Explore Active Drives
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/student/dashboard")}
          >
            Back to Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
}
