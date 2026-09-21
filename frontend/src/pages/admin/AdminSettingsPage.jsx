import React, { useState, useEffect } from "react";
import {
  Settings,
  Shield,
  Bell,
  Sliders,
  Save,
  CheckCircle2,
  Key,
  Mail,
  Cpu,
  Building2,
  Camera,
  X,
  RefreshCw,
  Upload
} from "lucide-react";
import { Card, CardHeader } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import Avatar from "../../components/common/Avatar";
import { useNotifications } from "../../context/NotificationContext";
import { useAuth } from "../../context/AuthContext";
import { adminService } from "../../services/adminService";

export function AdminSettingsPage() {
  const { addToast } = useNotifications();
  const { user, updateUser } = useAuth();
  const [collegeProfile, setCollegeProfile] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

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

  useEffect(() => {
    async function loadCollege() {
      const data = await adminService.getCollegeProfile();
      if (data) {
        setCollegeProfile(data);
      }
    }
    loadCollege();
  }, []);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      addToast("Please upload a valid image (JPEG, PNG, WebP, or GIF).", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast("Image size exceeds the 5MB limit.", "error");
      return;
    }

    setUploadingLogo(true);
    try {
      const res = await adminService.uploadCollegeLogo(file);
      const updated = await adminService.getCollegeProfile();
      setCollegeProfile(updated || { ...collegeProfile, logoUrl: res.logoUrl });
      updateUser({
        avatar: res.logoUrl,
        logoUrl: res.logoUrl
      });
      addToast("Institutional logo updated successfully!", "success");
    } catch (err) {
      console.error(err);
      addToast(err.message || "Failed to upload college logo.", "error");
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  };

  const handleLogoDelete = async () => {
    setUploadingLogo(true);
    try {
      await adminService.deleteCollegeLogo();
      const updated = await adminService.getCollegeProfile();
      setCollegeProfile(updated || { ...collegeProfile, logoUrl: null });
      updateUser({
        avatar: null,
        logoUrl: null
      });
      addToast("Institutional logo removed.", "success");
    } catch (err) {
      console.error(err);
      addToast(err.message || "Failed to remove college logo.", "error");
    } finally {
      setUploadingLogo(false);
    }
  };

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

      {/* Institutional Identity & Brand Logo */}
      <Card>
        <CardHeader
          title="Institutional Identity & Campus Branding"
          subtitle="Manage college tenant details and upload institutional logo displayed across student portals and administrative dashboards"
        />

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pt-2">
          {/* Logo container with overlay and delete */}
          <div className="relative group shrink-0">
            <Avatar
              src={collegeProfile?.logoUrl || user?.logoUrl || user?.avatar}
              name={collegeProfile?.name || user?.collegeName || "College"}
              size="3xl"
              variant="rounded"
              isCollege={true}
              className="w-24 h-24 rounded-2xl border-2 border-slate-200 shadow-sm"
            />

            <label
              htmlFor="college-logo-input"
              className={`absolute inset-0 rounded-2xl bg-slate-900/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity border-2 border-slate-200 ${
                uploadingLogo ? "opacity-100" : ""
              }`}
              title="Upload institutional logo"
            >
              {uploadingLogo ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Camera className="w-5 h-5 mb-0.5" />
                  <span className="text-[10px] font-bold">Change</span>
                </>
              )}
            </label>
            <input
              id="college-logo-input"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={handleLogoUpload}
              disabled={uploadingLogo}
            />

            {(collegeProfile?.logoUrl || user?.logoUrl) && !uploadingLogo && (
              <button
                type="button"
                onClick={handleLogoDelete}
                className="absolute -top-1.5 -right-1.5 p-1 bg-rose-600 text-white rounded-full shadow-md hover:bg-rose-700 transition-colors cursor-pointer border-2 border-white z-20"
                title="Remove logo"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex-1 space-y-2">
            <div>
              <h3 className="text-lg font-black text-slate-900">
                {collegeProfile?.name || user?.collegeName || "Institution"}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Tenant Slug: <span className="font-mono text-indigo-600 font-bold">{collegeProfile?.slug || user?.collegeSlug || "default"}</span>
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-slate-600">
              <span className="px-2.5 py-1 bg-slate-100 rounded-lg font-medium flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                {collegeProfile?.acceptedDomains?.join(", ") || "Accepted Campus Domains"}
              </span>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Verified Tenant Active
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <label
                htmlFor="college-logo-input"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl cursor-pointer transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                {uploadingLogo ? "Uploading..." : "Upload Logo (PNG/JPEG)"}
              </label>
              {(collegeProfile?.logoUrl || user?.logoUrl) && (
                <button
                  type="button"
                  onClick={handleLogoDelete}
                  disabled={uploadingLogo}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-xl cursor-pointer transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </Card>

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
