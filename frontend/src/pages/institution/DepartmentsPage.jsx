import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Power,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Building2,
  Mail,
  Phone,
  Info,
  X
} from "lucide-react";
import { useNotifications } from "../../context/NotificationContext";
import { institutionService } from "../../services/institutionService";
import { Card, CardHeader } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";

export function DepartmentsPage() {
  const { showSuccess, showError, showWarning } = useNotifications();
  const [searchParams, setSearchParams] = useSearchParams();

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Create Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    code: "",
    username: "",
    password: "",
    programs: [],
    contactEmail: "",
    contactPhone: ""
  });
  const [createErrors, setCreateErrors] = useState({});

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editDeptId, setEditDeptId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    code: "",
    programs: [],
    contactEmail: "",
    contactPhone: "",
    newPassword: ""
  });

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const res = await institutionService.getDepartments();
      setDepartments(res.departments || []);
    } catch (err) {
      console.error("Failed to load departments:", err);
      showError("Could not load departments list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
    if (searchParams.get("action") === "new") {
      setCreateModalOpen(true);
      searchParams.delete("action");
      setSearchParams(searchParams, { replace: true });
    }
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!createForm.name.trim()) errors.name = "Department name is required";
    if (!createForm.username.trim()) {
      errors.username = "Department username is required";
    } else if (!/^[a-z0-9_.-]+$/.test(createForm.username.trim().toLowerCase())) {
      errors.username = "Username must be lowercase letters, numbers, underscore, hyphen or dot";
    }

    if (!createForm.password) {
      errors.password = "Password is required for department login";
    } else if (createForm.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      showWarning("Please correct the errors in the form");
      return;
    }

    setCreateErrors({});
    setCreating(true);

    try {
      const programsArr = createForm.programs
        .filter(p => p.name && p.name.trim())
        .map(p => ({
          name: p.name.trim(),
          branches: Array.isArray(p.branches) ? p.branches.map(b => b.trim()).filter(Boolean) : typeof p.branches === 'string' ? p.branches.split(',').map(b => b.trim()).filter(Boolean) : []
        }));

      const payload = {
        name: createForm.name.trim(),
        code: createForm.code.trim().toUpperCase(),
        username: createForm.username.trim().toLowerCase(),
        password: createForm.password,
        programs: programsArr,
        contactEmail: createForm.contactEmail.trim().toLowerCase(),
        contactPhone: createForm.contactPhone.trim()
      };

      const res = await institutionService.createDepartment(payload);
      showSuccess(`Department "${payload.name}" created successfully with username: ${payload.username}`);
      setCreateModalOpen(false);
      setCreateForm({
        name: "",
        code: "",
        username: "",
        password: "",
        programs: [],
        contactEmail: "",
        contactPhone: ""
      });
      loadDepartments();
    } catch (err) {
      console.error("Failed to create department:", err);
      showError(err.message || "Failed to create department");
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (dept) => {
    setEditDeptId(dept._id);
    setEditForm({
      name: dept.name || "",
      code: dept.code || "",
      programs: Array.isArray(dept.programs)
        ? dept.programs.map(p => ({
            name: typeof p === 'object' ? p.name : p,
            branches: typeof p === 'object' && Array.isArray(p.branches) ? p.branches : []
          }))
        : [],
      contactEmail: dept.contactEmail || "",
      contactPhone: dept.contactPhone || "",
      newPassword: ""
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) {
      showError("Department name is required");
      return;
    }

    setEditing(true);
    try {
      const programsArr = editForm.programs
        .filter(p => p.name && p.name.trim())
        .map(p => ({
          name: p.name.trim(),
          branches: Array.isArray(p.branches) ? p.branches.map(b => b.trim()).filter(Boolean) : typeof p.branches === 'string' ? p.branches.split(',').map(b => b.trim()).filter(Boolean) : []
        }));

      const payload = {
        name: editForm.name.trim(),
        code: editForm.code.trim().toUpperCase(),
        programs: programsArr,
        contactEmail: editForm.contactEmail.trim().toLowerCase(),
        contactPhone: editForm.contactPhone.trim()
      };

      if (editForm.newPassword && editForm.newPassword.trim()) {
        payload.password = editForm.newPassword.trim();
      }

      await institutionService.updateDepartment(editDeptId, payload);
      showSuccess("Department updated successfully");
      setEditModalOpen(false);
      loadDepartments();
    } catch (err) {
      console.error("Failed to update department:", err);
      showError(err.message || "Failed to update department");
    } finally {
      setEditing(false);
    }
  };

  const handleToggleStatus = async (dept) => {
    try {
      await institutionService.toggleDepartmentStatus(dept._id);
      const newStatus = dept.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      showSuccess(`Department "${dept.name}" status changed to ${newStatus}`);
      setDepartments((prev) =>
        prev.map((d) => (d._id === dept._id ? { ...d, status: newStatus } : d))
      );
    } catch (err) {
      console.error("Failed to toggle department status:", err);
      showError(err.message || "Failed to toggle status");
    }
  };

  const handleDelete = async () => {
    if (!deptToDelete) return;
    setDeleting(true);
    try {
      await institutionService.deleteDepartment(deptToDelete._id);
      showSuccess(`Department "${deptToDelete.name}" deleted successfully`);
      setDeleteModalOpen(false);
      setDeptToDelete(null);
      loadDepartments();
    } catch (err) {
      console.error("Failed to delete department:", err);
      showError(err.message || "Failed to delete department");
    } finally {
      setDeleting(false);
    }
  };

  const filteredDepts = departments.filter((d) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (d.name && d.name.toLowerCase().includes(q)) ||
      (d.code && d.code.toLowerCase().includes(q)) ||
      (d.username && d.username.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-indigo-600" />
            Academic Departments & Placement Units
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Provision autonomous department credentials (e.g. BBA, BCA, MBA). Department admins log in through University / Department Sign In.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadDepartments}
            disabled={loading}
            icon={RefreshCw}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setCreateModalOpen(true)}
          >
            Create Department
          </Button>
        </div>
      </div>

      {/* Info Pill */}
      <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-2.5 text-xs text-indigo-950">
        <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          <strong>Architecture Notice:</strong> Each department gets dedicated login credentials and full administrative isolation. Department admins log into the existing SIPS Placement Dashboard to manage students, campus drives, applications, matching, and CSV exports.
        </span>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader
          title={`Department Roster (${filteredDepts.length})`}
          subtitle="Authorized institutional units with autonomous credentials"
          action={
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, code, username..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          }
        />

        {filteredDepts.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <Layers className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No departments found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create your first department (e.g. BCA, BBA, MBA) to enable departmental placement cells.
            </p>
            <Button
              size="sm"
              icon={Plus}
              onClick={() => setCreateModalOpen(true)}
            >
              Add Department Now
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-4">Department Name</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Sign-in Username</th>
                  <th className="py-3 px-4">Academic Programs</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDepts.map((dept) => (
                  <tr key={dept._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 font-black flex items-center justify-center text-xs">
                          {(dept.code || dept.name || "D").substring(0, 3).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{dept.name}</p>
                          {dept.contactEmail && (
                            <p className="text-[11px] text-slate-400 flex items-center gap-1 font-normal">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {dept.contactEmail}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                      {dept.code || "—"}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 font-mono font-bold text-indigo-700 text-xs border border-slate-200/70">
                        <KeyRound className="w-3 h-3 text-indigo-500" />
                        {dept.username}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                      {dept.programs && dept.programs.length > 0 ? (
                        <div className="flex items-center gap-1 flex-wrap">
                          {dept.programs.map((p, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold"
                            >
                              {typeof p === 'object' ? `${p.name} ${p.branches && p.branches.length ? `(${p.branches.join(', ')})` : ''}` : p}
                            </span>
                          ))}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge
                        variant={dept.status === "ACTIVE" ? "success" : "neutral"}
                        className="text-[10px]"
                      >
                        {dept.status || "ACTIVE"}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(dept)}
                          title={dept.status === "ACTIVE" ? "Deactivate Department" : "Activate Department"}
                          className={`p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                            dept.status === "ACTIVE"
                              ? "text-slate-500 border-slate-200 hover:text-amber-600 hover:bg-amber-50"
                              : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(dept)}
                          title="Edit Department"
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 text-xs cursor-pointer transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setDeptToDelete(dept);
                            setDeleteModalOpen(true);
                          }}
                          title="Delete Department"
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-xs cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Department Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        maxWidth="max-w-lg"
        title="Create Academic Department"
        subtitle="Generates login credentials for the department placement cell"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Department Name * (e.g. BCA, BBA, MBA, Computer Science)
            </label>
            <input
              type="text"
              required
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              placeholder="e.g. Bachelor of Computer Applications"
              className={`w-full px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 ${
                createErrors.name
                  ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                  : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-600"
              }`}
            />
            {createErrors.name && <p className="text-[11px] text-rose-600 mt-1">{createErrors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Department Code (e.g. BCA)
              </label>
              <input
                type="text"
                value={createForm.code}
                onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
                placeholder="e.g. BCA"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Sign-in Username *
              </label>
              <input
                type="text"
                required
                value={createForm.username}
                onChange={(e) => setCreateForm({ ...createForm, username: e.target.value.toLowerCase() })}
                placeholder="e.g. abc_bca"
                className={`w-full px-3 py-2 rounded-xl border font-mono text-xs font-medium focus:outline-none focus:ring-2 ${
                  createErrors.username
                    ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                    : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-600"
                }`}
              />
              {createErrors.username && <p className="text-[11px] text-rose-600 mt-1">{createErrors.username}</p>}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Initial Password * (For department sign-in)
            </label>
            <input
              type="password"
              required
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              placeholder="••••••••"
              className={`w-full px-3 py-2 rounded-xl border text-xs font-medium focus:outline-none focus:ring-2 ${
                createErrors.password
                  ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                  : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-600"
              }`}
            />
            {createErrors.password && <p className="text-[11px] text-rose-600 mt-1">{createErrors.password}</p>}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Programs & Branches
            </label>
            <div className="space-y-3">
              {createForm.programs.map((p, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      placeholder="Program Name (e.g. B.Tech)"
                      value={p.name}
                      onChange={(e) => {
                        const newP = [...createForm.programs];
                        newP[idx].name = e.target.value;
                        setCreateForm({ ...createForm, programs: newP });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Add branch and press Enter..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const val = e.target.value.trim();
                            if (val) {
                              const newP = [...createForm.programs];
                              if (!Array.isArray(newP[idx].branches)) newP[idx].branches = [];
                              if (!newP[idx].branches.includes(val)) {
                                newP[idx].branches.push(val);
                              }
                              setCreateForm({ ...createForm, programs: newP });
                              e.target.value = "";
                            }
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      />
                      {Array.isArray(p.branches) && p.branches.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {p.branches.map((b, bIdx) => (
                            <span
                              key={bIdx}
                              className="px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1.5"
                            >
                              {b}
                              <button
                                type="button"
                                onClick={() => {
                                  const newP = [...createForm.programs];
                                  newP[idx].branches = newP[idx].branches.filter((_, i) => i !== bIdx);
                                  setCreateForm({ ...createForm, programs: newP });
                                }}
                                className="text-slate-400 hover:text-rose-500 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      const newP = createForm.programs.filter((_, i) => i !== idx);
                      setCreateForm({ ...createForm, programs: newP });
                    }}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateForm({ ...createForm, programs: [...createForm.programs, { name: "", branches: [] }] })}
                className="w-full py-2 border-dashed rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <Plus className="w-3 h-3" /> Add Program
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={createForm.contactEmail}
                onChange={(e) => setCreateForm({ ...createForm, contactEmail: e.target.value })}
                placeholder="bca@university.edu"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                value={createForm.contactPhone}
                onChange={(e) => setCreateForm({ ...createForm, contactPhone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCreateModalOpen(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={creating}
              disabled={creating}
            >
              Create Department
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Department Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        maxWidth="max-w-lg"
        title="Edit Department"
        subtitle="Update department metadata or reset login password"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Department Name *
            </label>
            <input
              type="text"
              required
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Department Code
            </label>
            <input
              type="text"
              value={editForm.code}
              onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Programs & Branches
            </label>
            <div className="space-y-3">
              {editForm.programs.map((p, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      placeholder="Program Name (e.g. B.Tech)"
                      value={p.name}
                      onChange={(e) => {
                        const newP = [...editForm.programs];
                        newP[idx].name = e.target.value;
                        setEditForm({ ...editForm, programs: newP });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Add branch and press Enter..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const val = e.target.value.trim();
                            if (val) {
                              const newP = [...editForm.programs];
                              if (!Array.isArray(newP[idx].branches)) newP[idx].branches = [];
                              if (!newP[idx].branches.includes(val)) {
                                newP[idx].branches.push(val);
                              }
                              setEditForm({ ...editForm, programs: newP });
                              e.target.value = "";
                            }
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      />
                      {Array.isArray(p.branches) && p.branches.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {p.branches.map((b, bIdx) => (
                            <span
                              key={bIdx}
                              className="px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1.5"
                            >
                              {b}
                              <button
                                type="button"
                                onClick={() => {
                                  const newP = [...editForm.programs];
                                  newP[idx].branches = newP[idx].branches.filter((_, i) => i !== bIdx);
                                  setEditForm({ ...editForm, programs: newP });
                                }}
                                className="text-slate-400 hover:text-rose-500 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      const newP = editForm.programs.filter((_, i) => i !== idx);
                      setEditForm({ ...editForm, programs: newP });
                    }}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditForm({ ...editForm, programs: [...editForm.programs, { name: "", branches: [] }] })}
                className="w-full py-2 border-dashed rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <Plus className="w-3 h-3" /> Add Program
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={editForm.contactEmail}
                onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                value={editForm.contactPhone}
                onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Reset Password (leave blank to keep current password)
            </label>
            <input
              type="password"
              value={editForm.newPassword}
              onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditModalOpen(false)}
              disabled={editing}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={editing}
              disabled={editing}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        maxWidth="max-w-md"
        title="Delete Department"
        subtitle={deptToDelete?.name}
      >
        <div className="space-y-4 text-xs text-slate-600">
          <p>
            Are you sure you want to delete the department <strong>"{deptToDelete?.name}"</strong>?
          </p>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
            Departments with active students or recruitment drives cannot be deleted without first clearing their records.
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              loading={deleting}
              disabled={deleting}
              onClick={handleDelete}
            >
              Delete Department
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
