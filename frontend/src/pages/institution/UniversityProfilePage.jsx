import React, { useState, useEffect } from "react";
import {
  Building2,
  Mail,
  Globe,
  Phone,
  MapPin,
  ShieldCheck,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { institutionService } from "../../services/institutionService";
import { Card, CardHeader } from "../../components/common/Card";
import { Button } from "../../components/common/Button";

export function UniversityProfilePage() {
  const { user, updateUser } = useAuth();
  const { showSuccess, showError } = useNotifications();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: "",
    officialEmail: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    website: "",
    phone: "",
    acceptedDomains: ""
  });

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await institutionService.getProfile();
      const inst = res.institution || {};
      setForm({
        name: inst.name || user?.institutionName || "",
        code: inst.code || "",
        officialEmail: inst.officialEmail || user?.email || "",
        address: inst.address || "",
        city: inst.city || "",
        state: inst.state || "",
        country: inst.country || "India",
        website: inst.website || "",
        phone: inst.phone || "",
        acceptedDomains: Array.isArray(inst.acceptedDomains) ? inst.acceptedDomains.join(", ") : ""
      });
    } catch (err) {
      console.error("Failed to load university profile:", err);
      showError("Could not load university profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showError("University / Institute name is required");
      return;
    }

    try {
      setSaving(true);
      const domainsArr = form.acceptedDomains
        .split(",")
        .map((d) => d.trim().toLowerCase())
        .filter(Boolean);

      const payload = {
        name: form.name.trim(),
        code: form.code.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        country: form.country.trim(),
        website: form.website.trim(),
        phone: form.phone.trim(),
        acceptedDomains: domainsArr
      };

      const res = await institutionService.updateProfile(payload);
      showSuccess("University profile updated successfully");
      if (res.institution) {
        updateUser({ institutionName: res.institution.name });
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
      showError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-indigo-600" />
            University Profile & Institutional Identity
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure institutional metadata, official communication channels, and identity standards.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadProfile}
          disabled={loading}
          icon={RefreshCw}
        >
          Reload
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card padding="p-6">
          <CardHeader
            title="General Institutional Information"
            subtitle="Visible on departmental placement portals and institutional reports"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mt-4">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                University / Institution Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Apex Technical University"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Institution Code
              </label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="e.g. ATU-BLR"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Official Institutional Email (Read-only)
              </label>
              <input
                type="email"
                disabled
                value={form.officialEmail}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Official Website
              </label>
              <input
                type="url"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://www.university.edu"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Official Phone Number
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 80 1234 5678"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          </div>
        </Card>

        <Card padding="p-6">
          <CardHeader
            title="Campus Location & Domains"
            subtitle="Campus physical premises and domain authorization"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mt-4">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Street / Campus Address
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="e.g. 12th Km, Mysore Road, RV Vidyaniketan"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                City
              </label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="e.g. Bengaluru"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                State / Province
              </label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                placeholder="e.g. Karnataka"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Country
              </label>
              <input
                type="text"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                placeholder="e.g. India"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Accepted Email Domains (comma separated)
              </label>
              <input
                type="text"
                value={form.acceptedDomains}
                onChange={(e) => setForm({ ...form, acceptedDomains: e.target.value })}
                placeholder="e.g. university.edu, cs.university.edu"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="submit"
            loading={saving}
            disabled={saving}
            icon={Save}
            size="md"
          >
            Save Profile Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
