import React, { useState } from "react";
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { Button } from "./Button";

export function PasswordChangeModal({ isOpen, onClose, isForceChange = false }) {
  const { changePassword } = useAuth();
  const { showSuccess, showError } = useNotifications();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showError("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showError("New password and confirmation do not match.");
      return;
    }

    try {
      setLoading(true);
      await changePassword(currentPassword, newPassword);
      showSuccess("Password updated successfully! Your account is now secured.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onClose();
    } catch (err) {
      showError(err.message || "Failed to update password. Please check your current password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-6 text-white text-center">
          <div className="w-12 h-12 rounded-full bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center mx-auto mb-3 text-indigo-300">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold tracking-tight">
            {isForceChange ? "Set Up Your Permanent Password" : "Change Account Password"}
          </h3>
          <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
            {isForceChange
              ? "You logged in with a temporary generated password. Please establish a strong permanent password to secure your portal."
              : "Update your password to keep your administrator portal secure."}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Current / Temporary Password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              New Permanent Password
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            {!isForceChange && (
              <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
            )}
            <Button type="submit" variant="primary" size="sm" loading={loading} className="w-full">
              Update & Secure Account
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
