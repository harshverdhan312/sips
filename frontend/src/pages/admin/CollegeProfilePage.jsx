import React, { useState, useEffect } from "react";
import {
  Building2,
  Save,
  RotateCcw,
  Camera,
  X,
  RefreshCw,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Hash
} from "lucide-react";
import { Card, CardHeader } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { DashboardSkeleton } from "../../components/common/LoadingSkeleton";
import Avatar from "../../components/common/Avatar";
import { useNotifications } from "../../context/NotificationContext";
import { useAuth } from "../../context/AuthContext";
import { adminService } from "../../services/adminService";

export function CollegeProfilePage() {
  const { addToast } = useNotifications();
  const { user, updateUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [originalProfile, setOriginalProfile] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    adminEmail: "",
    logoUrl: null,
    code: "",
    address: "",
    city: "",
    state: "",
    website: "",
    contactEmail: "",
    contactPhone: "",
    establishedYear: "",
    acceptedDomains: ""
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        const college = await adminService.getCollegeProfile();
        if (college) {
          setOriginalProfile(college);
          setFormData({
            name: college.name || "",
            slug: college.slug || "",
            adminEmail: college.adminEmail || "",
            logoUrl: college.logoUrl || null,
            code: college.code || "",
            address: college.address || "",
            city: college.city || "",
            state: college.state || "",
            website: college.website || "",
            contactEmail: college.contactEmail || "",
            contactPhone: college.contactPhone || "",
            establishedYear: college.establishedYear ? String(college.establishedYear) : "",
            acceptedDomains: Array.isArray(college.acceptedDomains) ? college.acceptedDomains.join(", ") : ""
          });
        }
      } catch (err) {
        console.error("Failed to load college profile:", err);
        addToast("Failed to load college profile details.", "error");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [addToast]);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = "College name is required.";
    }

    if (formData.contactEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.contactEmail.trim())) {
        errs.contactEmail = "Please enter a valid email format.";
      }
    }

    if (formData.establishedYear) {
      const year = parseInt(formData.establishedYear, 10);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1800 || year > currentYear + 1) {
        errs.establishedYear = `Year must be between 1800 and ${currentYear + 1}.`;
      }
    }

    if (formData.acceptedDomains.trim()) {
      const domains = formData.acceptedDomains.split(",").map((d) => d.trim()).filter(Boolean);
      const domainRegex = /^[a-z0-9.-]+\.[a-z]{2,}$/i;
      const invalid = domains.find((d) => !domainRegex.test(d));
      if (invalid) {
        errs.acceptedDomains = `Invalid domain format: "${invalid}".`;
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleReset = () => {
    if (!originalProfile) return;
    setFormData({
      name: originalProfile.name || "",
      slug: originalProfile.slug || "",
      adminEmail: originalProfile.adminEmail || "",
      logoUrl: originalProfile.logoUrl || null,
      code: originalProfile.code || "",
      address: originalProfile.address || "",
      city: originalProfile.city || "",
      state: originalProfile.state || "",
      website: originalProfile.website || "",
      contactEmail: originalProfile.contactEmail || "",
      contactPhone: originalProfile.contactPhone || "",
      establishedYear: originalProfile.establishedYear ? String(originalProfile.establishedYear) : "",
      acceptedDomains: Array.isArray(originalProfile.acceptedDomains) ? originalProfile.acceptedDomains.join(", ") : ""
    });
    setErrors({});
    addToast("Form reset to saved values.", "info");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      addToast("Please correct the errors in the form before saving.", "error");
      return;
    }

    setSaving(true);
    try {
      const domainsList = formData.acceptedDomains
        ? formData.acceptedDomains.split(",").map((d) => d.trim().toLowerCase()).filter(Boolean)
        : undefined;

      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        website: formData.website.trim(),
        contactEmail: formData.contactEmail.trim(),
        contactPhone: formData.contactPhone.trim(),
        establishedYear: formData.establishedYear ? parseInt(formData.establishedYear, 10) : null
      };

      if (domainsList && domainsList.length > 0) {
        payload.acceptedDomains = domainsList;
      }

      const updated = await adminService.updateCollegeProfile(payload);
      setOriginalProfile(updated);
      updateUser({
        collegeName: updated.name,
        name: user?.backendRole === "COLLEGE_ADMIN" ? `${updated.name} Placement Cell` : user?.name,
        avatar: updated.logoUrl,
        logoUrl: updated.logoUrl
      });
      addToast("College profile updated successfully!", "success");
    } catch (err) {
      console.error("Save college profile error:", err);
      addToast(err.message || "Failed to update college profile.", "error");
    } finally {
      setSaving(false);
    }
  };

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
      setFormData((prev) => ({ ...prev, logoUrl: res.logoUrl }));
      if (originalProfile) {
        setOriginalProfile((prev) => ({ ...prev, logoUrl: res.logoUrl }));
      }
      updateUser({
        avatar: res.logoUrl,
        logoUrl: res.logoUrl
      });
      addToast("College logo updated successfully!", "success");
    } catch (err) {
      console.error("Upload logo error:", err);
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
      setFormData((prev) => ({ ...prev, logoUrl: null }));
      if (originalProfile) {
        setOriginalProfile((prev) => ({ ...prev, logoUrl: null }));
      }
      updateUser({
        avatar: null,
        logoUrl: null
      });
      addToast("College logo removed.", "success");
    } catch (err) {
      console.error("Delete logo error:", err);
      addToast(err.message || "Failed to remove college logo.", "error");
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-8 h-8 text-indigo-600" />
            College Profile & Institutional Identity
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your institution's profile, contact channels, campus email domains, and official logo.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            icon={RotateCcw}
            onClick={handleReset}
            disabled={saving || uploadingLogo}
          >
            Reset
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={saving ? RefreshCw : Save}
            onClick={handleSubmit}
            disabled={saving || uploadingLogo}
            className={saving ? "animate-pulse" : ""}
          >
            {saving ? "Saving Changes..." : "Save Profile"}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Institutional Identity Card */}
        <Card>
          <CardHeader
            title="Institutional Identity"
            subtitle="Core campus branding and system identifiers"
          />

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-4 border-b border-slate-100">
            {/* Logo Container with Upload Overlay */}
            <div className="relative group shrink-0">
              <Avatar
                src={formData.logoUrl}
                name={formData.name || "College"}
                size="3xl"
                variant="rounded"
                isCollege={true}
                className="w-24 h-24 rounded-2xl border-2 border-slate-200 shadow-sm"
              />

              <label
                htmlFor="college-profile-logo-input"
                className={`absolute inset-0 rounded-2xl bg-slate-900/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity border-2 border-slate-200 ${
                  uploadingLogo ? "opacity-100" : ""
                }`}
                title="Change college logo"
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
                id="college-profile-logo-input"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handleLogoUpload}
                disabled={uploadingLogo}
              />

              {formData.logoUrl && !uploadingLogo && (
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

            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tenant Slug</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-mono font-bold">
                  {formData.slug || "default"}
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Tenant
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Administrative account: <span className="font-semibold text-slate-700">{formData.adminEmail || "admin@college.edu"}</span>
              </p>
              <p className="text-[11px] text-slate-400">
                Logo is automatically displayed on student dashboards, placement reports, and top navigation.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                College / University Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="e.g. R.V. College of Engineering"
                className={`w-full px-3.5 py-2 rounded-xl border text-sm font-semibold transition-all ${
                  errors.name ? "border-rose-400 focus:ring-rose-200" : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-100"
                }`}
              />
              {errors.name && <p className="text-xs text-rose-500 mt-1 font-medium">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Institutional College Code
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => handleInputChange("code", e.target.value)}
                  placeholder="e.g. RVCE-01, 1RV"
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Contact Information Card */}
        <Card>
          <CardHeader
            title="Campus Location & Contact Information"
            subtitle="Official contact channels and physical address"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Campus Address
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="e.g. RV Vidyaniketan Post, Mysuru Road"
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                City / District
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                placeholder="e.g. Bengaluru"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                State / Province
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => handleInputChange("state", e.target.value)}
                placeholder="e.g. Karnataka"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Official Website URL
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  placeholder="https://rvce.edu.in"
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Public Contact Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                  placeholder="e.g. placement@rvce.edu.in"
                  className={`w-full pl-9 pr-3.5 py-2 rounded-xl border text-sm font-semibold transition-all ${
                    errors.contactEmail ? "border-rose-400 focus:ring-rose-200" : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-100"
                  }`}
                />
              </div>
              {errors.contactEmail && <p className="text-xs text-rose-500 mt-1 font-medium">{errors.contactEmail}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Contact Phone / Extension
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.contactPhone}
                  onChange={(e) => handleInputChange("contactPhone", e.target.value)}
                  placeholder="+91 80 6818 8100"
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Academic & Domain Security Card */}
        <Card>
          <CardHeader
            title="Institutional Accreditation & Email Domains"
            subtitle="Campus authentication boundaries and establishment year"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Established Year
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  value={formData.establishedYear}
                  onChange={(e) => handleInputChange("establishedYear", e.target.value)}
                  placeholder="e.g. 1963"
                  className={`w-full pl-9 pr-3.5 py-2 rounded-xl border text-sm font-semibold transition-all ${
                    errors.establishedYear ? "border-rose-400 focus:ring-rose-200" : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-100"
                  }`}
                />
              </div>
              {errors.establishedYear && <p className="text-xs text-rose-500 mt-1 font-medium">{errors.establishedYear}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Accepted Email Domains (Comma-separated)
              </label>
              <input
                type="text"
                value={formData.acceptedDomains}
                onChange={(e) => handleInputChange("acceptedDomains", e.target.value)}
                placeholder="e.g. rvce.edu.in, student.rvce.edu.in"
                className={`w-full px-3.5 py-2 rounded-xl border text-sm font-semibold transition-all ${
                  errors.acceptedDomains ? "border-rose-400 focus:ring-rose-200" : "border-slate-200 focus:border-indigo-500 focus:ring-indigo-100"
                }`}
              />
              {errors.acceptedDomains ? (
                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.acceptedDomains}</p>
              ) : (
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Students and placement officers must sign in with an email matching one of these domains.
                </span>
              )}
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
}
