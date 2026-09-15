import React, { useState } from "react";
import {
  Settings,
  Shield,
  Bell,
  Sliders,
  Save,
  CheckCircle2,
  Key,
  Mail,
  Cpu
} from "lucide-react";
import { Card, CardHeader } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { useNotifications } from "../../context/NotificationContext";

export function AdminSettingsPage() {
  const { addToast } = useNotifications();

  const [thresholds, setThresholds] = useState({
    readyMinProbability: 75,
    atRiskMaxProbability: 50,
    atsPassBenchmark: 80,
    minCgpaDefault: 7.0,
    dailyXpReward: 150
  });

  const [emailAlerts, setEmailAlerts] = useState({
    notifyOnAtRisk: true,
    weeklyDeanDigest: true,
    recruiterMatchBroadcast: true
  });

  const handleSave = (e) => {
    e.preventDefault();
    addToast("Platform operational settings saved successfully!", "success");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Settings className="w-8 h-8 text-indigo-600" />
            Global Platform Configuration
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure institutional placement thresholds, ATS scoring weights, and automated notification triggers.
          </p>
        </div>

        <Button variant="primary" size="sm" icon={Save} onClick={handleSave}>
          Save All Settings
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Placement Thresholds Card */}
        <Card>
          <CardHeader
            title="Institutional Placement Scoring Thresholds"
            subtitle="Defines criteria for classifying students into 'Ready', 'Needs Improvement', or 'At Risk'"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Placement Ready Threshold (%)
              </label>
              <input
                type="number"
                value={thresholds.readyMinProbability}
                onChange={(e) =>
                  setThresholds({
                    ...thresholds,
                    readyMinProbability: parseInt(e.target.value) || 0
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Candidates with probability &gt;= {thresholds.readyMinProbability}% marked 'Ready'
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                At-Risk Trigger Threshold (%)
              </label>
              <input
                type="number"
                value={thresholds.atRiskMaxProbability}
                onChange={(e) =>
                  setThresholds({
                    ...thresholds,
                    atRiskMaxProbability: parseInt(e.target.value) || 0
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Candidates &lt; {thresholds.atRiskMaxProbability}% flagged for intervention
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                ATS Resume Pass Benchmark
              </label>
              <input
                type="number"
                value={thresholds.atsPassBenchmark}
                onChange={(e) =>
                  setThresholds({
                    ...thresholds,
                    atsPassBenchmark: parseInt(e.target.value) || 0
                  })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Recommended score for corporate forwarding
              </span>
            </div>
          </div>
        </Card>

        {/* Automated Notifications & Email Alerts */}
        <Card>
          <CardHeader
            title="Automated Alert & Dispatch Triggers"
            subtitle="Configure automated notifications dispatched to students and placement officers"
          />

          <div className="space-y-3 text-xs sm:text-sm">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
              <div>
                <p className="font-bold text-slate-900">
                  Counselor Alert on At-Risk Detection
                </p>
                <p className="text-slate-500 text-xs">
                  Automatically alert placement coordinators when candidate drops below {thresholds.atRiskMaxProbability}%
                </p>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts.notifyOnAtRisk}
                onChange={(e) =>
                  setEmailAlerts({ ...emailAlerts, notifyOnAtRisk: e.target.checked })
                }
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
              <div>
                <p className="font-bold text-slate-900">
                  Weekly Dean & Principal Summary Digest
                </p>
                <p className="text-slate-500 text-xs">
                  Sends verified placement conversion and department-wise readiness briefings every Monday
                </p>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts.weeklyDeanDigest}
                onChange={(e) =>
                  setEmailAlerts({ ...emailAlerts, weeklyDeanDigest: e.target.checked })
                }
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
              <div>
                <p className="font-bold text-slate-900">
                  Instant Recruiter Match Broadcast
                </p>
                <p className="text-slate-500 text-xs">
                  Notify top matching candidates when a new company drive is uploaded
                </p>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts.recruiterMatchBroadcast}
                onChange={(e) =>
                  setEmailAlerts({
                    ...emailAlerts,
                    recruiterMatchBroadcast: e.target.checked
                  })
                }
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </label>
          </div>
        </Card>
      </form>
    </div>
  );
}
