import React, { useState, useEffect } from "react";
import {
  Users,
  Download,
  Upload,
  Eye,
  UserPlus,
  KeyRound,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileText
} from "lucide-react";
import { placementService } from "../../services/placementService";
import { adminService } from "../../services/adminService";
import { DataTable } from "../../components/common/DataTable";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";
import Avatar from "../../components/common/Avatar";
import { useNotifications } from "../../context/NotificationContext";

export function StudentManagementPage() {
  const { showSuccess, showError, showWarning, showInfo } = useNotifications();
  const [students, setStudents] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Selected student modal
  const [activeStudent, setActiveStudent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Add Student modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [savingStudent, setSavingStudent] = useState(false);
  const [addStudentErrors, setAddStudentErrors] = useState({});
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    rollNo: "",
    branch: "Computer Science & Engineering",
    batch: "2025",
    cgpa: "7.5",
    password: ""
  });

  // Bulk CSV Import Modal State
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvText, setCsvText] = useState("");
  const [importMode, setImportMode] = useState("file"); // "file" | "text"
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState(null);

  // Load students from backend
  const loadStudents = async () => {
    try {
      const data = await placementService.getStudents({
        branch: selectedBranch,
        status: selectedStatus
      });
      setStudents(data);
    } catch (e) {
      console.error("Failed to load students:", e);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [selectedBranch, selectedStatus]);

  const handleExportCsv = () => {
    showInfo("Exporting Student Placement Readiness records to CSV...");
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!newStudent.name.trim()) {
      newErrors.name = "Full name is required.";
    }

    if (!newStudent.email.trim()) {
      newErrors.email = "Institutional email is required.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newStudent.email.trim())) {
        newErrors.email = "Please enter a valid email address.";
      }
    }

    if (!newStudent.rollNo.trim()) {
      newErrors.rollNo = "Roll No / USN is required.";
    }

    const cgpaVal = parseFloat(newStudent.cgpa);
    if (newStudent.cgpa !== "" && (isNaN(cgpaVal) || cgpaVal < 0 || cgpaVal > 10)) {
      newErrors.cgpa = "CGPA must be between 0 and 10.";
    }

    if (Object.keys(newErrors).length > 0) {
      setAddStudentErrors(newErrors);
      if (newErrors.email === "Please enter a valid email address.") {
        showError("Please enter a valid email address.");
      } else {
        showWarning("Please fill in all required fields.");
      }
      return;
    }

    setAddStudentErrors({});
    setSavingStudent(true);
    try {
      const res = await adminService.createStudent(newStudent);
      showSuccess(`Student created successfully. Initial password: ${res.student.initialPassword}`);
      setAddModalOpen(false);
      setNewStudent({
        name: "",
        email: "",
        rollNo: "",
        branch: "Computer Science & Engineering",
        batch: "2025",
        cgpa: "7.5",
        password: ""
      });

      await loadStudents();
    } catch (err) {
      const msg = err.message || "Failed to create student account.";
      setAddStudentErrors({ general: msg });
      showError(msg);
    } finally {
      setSavingStudent(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
      const msg = "Please select a valid CSV file.";
      setImportError(msg);
      showError(msg);
      setCsvFile(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      const msg = "File size exceeds the allowed limit.";
      setImportError(msg);
      showError(msg);
      setCsvFile(null);
      return;
    }

    setImportError(null);
    setImportResult(null);
    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      setCsvText(evt.target?.result || "");
    };
    reader.readAsText(file);
  };

  const handleBulkImport = async (e) => {
    e.preventDefault();
    const payload = csvText.trim();
    if (!payload) {
      const msg = "Please select a CSV file or paste CSV content.";
      setImportError(msg);
      showWarning(msg);
      return;
    }

    // Verify headers
    const firstLine = payload.split(/\r?\n/)[0] || "";
    const lowerFirst = firstLine.toLowerCase();
    const hasName = lowerFirst.includes("name");
    const hasRoll = lowerFirst.includes("roll") || lowerFirst.includes("usn");
    const hasEmail = lowerFirst.includes("email");

    if (!hasName || !hasRoll || !hasEmail) {
      const msg = "CSV file must contain Name, Roll No (or USN), and Email columns.";
      setImportError(msg);
      showError(msg);
      return;
    }

    setImporting(true);
    setImportError(null);
    setImportResult(null);

    try {
      const res = await adminService.uploadStudentsCSV(payload);
      const outcome = res.results || res;
      setImportResult(outcome);

      if (outcome.success > 0) {
        showSuccess(`Imported ${outcome.success} of ${outcome.total || outcome.success} students successfully.`);
        await loadStudents();
      }
      if (outcome.failed > 0) {
        showWarning(`Import encountered issues for ${outcome.failed} rows. Please review below.`);
      }
    } catch (err) {
      console.error("Bulk CSV import error:", err);
      const msg = err.message || "Failed to process the uploaded file.";
      setImportError(msg);
      showError(msg);
    } finally {
      setImporting(false);
    }
  };

  const handleViewStudent = (student) => {
    setActiveStudent(student);
    setModalOpen(true);
  };

  const columns = [
    {
      title: "Student",
      key: "name",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar
            src={row.profileImageUrl || row.avatar}
            name={row.name}
            size="sm"
            className="border border-slate-200 shrink-0"
          />
          <div>
            <p className="font-bold text-slate-900">{row.name}</p>
            <span className="text-[11px] text-slate-400 font-mono">{row.usn || row.rollNo}</span>
          </div>
        </div>
      )
    },
    {
      title: "Branch",
      key: "branch",
      sortable: true,
      render: (row) => <span className="text-slate-600">{row.branch}</span>
    },
    {
      title: "CGPA",
      key: "cgpa",
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-slate-900">{row.cgpa}</span>
      )
    },
    {
      title: "Tech Score",
      key: "metrics.technicalScore",
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-indigo-600">
          {row.metrics?.technicalScore || 65}/100
        </span>
      )
    },
    {
      title: "Soft Skill",
      key: "metrics.softSkillScore",
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-purple-600">
          {row.metrics?.softSkillScore || 65}/100
        </span>
      )
    },
    {
      title: "Employability",
      key: "metrics.employabilityIndex",
      sortable: true,
      render: (row) => (
        <span className="font-bold text-slate-900">
          {row.metrics?.employabilityIndex || 65}/100
        </span>
      )
    },
    {
      title: "Placement Prob.",
      key: "metrics.placementProbability",
      sortable: true,
      render: (row) => (
        <span className="font-extrabold text-emerald-600">
          {row.metrics?.placementProbability || 70}%
        </span>
      )
    },
    {
      title: "Status",
      key: "status",
      sortable: true,
      render: (row) => (
        <Badge
          variant={
            row.status === "Placement Ready"
              ? "success"
              : row.status === "Needs Improvement"
              ? "warning"
              : "danger"
          }
          size="sm"
        >
          {row.status}
        </Badge>
      )
    },
    {
      title: "Action",
      key: "actions",
      className: "text-right",
      render: (row) => (
        <Button
          variant="outline"
          size="xs"
          icon={Eye}
          onClick={(e) => {
            e.stopPropagation();
            handleViewStudent(row);
          }}
        >
          View Profile
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-8 h-8 text-indigo-600" />
            Batch Student Directory & Placement Profiles
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Search, filter, and inspect comprehensive placement readiness scores for all registered students.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={Upload}
            onClick={() => {
              setImportModalOpen(true);
              setImportResult(null);
              setImportError(null);
            }}
          >
            Import CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={UserPlus}
            onClick={() => setAddModalOpen(true)}
          >
            Add Student
          </Button>
          <Button variant="secondary" size="sm" icon={Download} onClick={handleExportCsv}>
            Export Roster
          </Button>
        </div>
      </div>

      {/* Filter Bar and DataTable */}
      <DataTable
        columns={columns}
        data={students}
        searchPlaceholder="Search candidate by name, USN, or branch..."
        searchKey={(item, q) =>
          item.name.toLowerCase().includes(q) ||
          (item.usn && item.usn.toLowerCase().includes(q)) ||
          (item.rollNo && item.rollNo.toLowerCase().includes(q)) ||
          item.branch.toLowerCase().includes(q)
        }
        onRowClick={(row) => handleViewStudent(row)}
        filterComponent={
          <div className="flex items-center gap-2">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="All">All Branches</option>
              <option value="Computer Science & Engineering">CSE</option>
              <option value="Information Science">ISE</option>
              <option value="Artificial Intelligence">AI/ML</option>
              <option value="Electronics & Communication">ECE</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="All">All Statuses</option>
              <option value="Placement Ready">Placement Ready</option>
              <option value="Needs Improvement">Needs Improvement</option>
              <option value="At Risk">At Risk</option>
            </select>
          </div>
        }
      />

      {/* Detailed Student Analytics Drawer / Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="max-w-3xl"
        title="Candidate Placement Intelligence Profile"
        subtitle={activeStudent ? `${activeStudent.name} (${activeStudent.usn || activeStudent.rollNo})` : ""}
      >
        {activeStudent && (
          <div className="space-y-6">
            {/* Header snippet */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <Avatar
                src={activeStudent.profileImageUrl || activeStudent.avatar}
                name={activeStudent.name}
                size="xl"
                variant="rounded"
                className="w-16 h-16 rounded-2xl border-2 border-white shadow-xs shrink-0"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-lg">
                    {activeStudent.name}
                  </h3>
                  <Badge
                    variant={
                      activeStudent.status === "Placement Ready"
                        ? "success"
                        : activeStudent.status === "Needs Improvement"
                        ? "warning"
                        : "danger"
                    }
                    size="sm"
                  >
                    {activeStudent.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">
                  {activeStudent.branch} • Batch {activeStudent.batch}
                </p>
                <p className="text-xs font-semibold text-slate-700 mt-1">
                  CGPA: {activeStudent.cgpa}/10 • Email: {activeStudent.email}
                </p>
              </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                <p className="text-[10px] font-bold text-indigo-900 uppercase">
                  Employability Index
                </p>
                <h4 className="text-2xl font-black text-indigo-700 mt-1">
                  {activeStudent.metrics?.employabilityIndex || 65}/100
                </h4>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <p className="text-[10px] font-bold text-emerald-900 uppercase">
                  Placement Prob.
                </p>
                <h4 className="text-2xl font-black text-emerald-700 mt-1">
                  {activeStudent.metrics?.placementProbability || 70}%
                </h4>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                <p className="text-[10px] font-bold text-blue-900 uppercase">
                  Technical Score
                </p>
                <h4 className="text-2xl font-black text-blue-700 mt-1">
                  {activeStudent.metrics?.technicalScore || 65}
                </h4>
              </div>

              <div className="p-3 rounded-xl bg-purple-50 border border-purple-100">
                <p className="text-[10px] font-bold text-purple-900 uppercase">
                  Soft Skill Index
                </p>
                <h4 className="text-2xl font-black text-purple-700 mt-1">
                  {activeStudent.metrics?.softSkillScore || 65}
                </h4>
              </div>
            </div>

            {/* Skills & Interventions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <h4 className="font-bold text-slate-900 mb-2">Verified Strengths</h4>
                <div className="flex flex-wrap gap-1.5">
                  {(activeStudent.strongSkills || ["React.js", "Python", "Problem Solving"]).map(
                    (s, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100"
                      >
                        ✓ {s}
                      </span>
                    )
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <h4 className="font-bold text-slate-900 mb-2">Skill Gaps Requiring Action</h4>
                <div className="flex flex-wrap gap-1.5">
                  {(activeStudent.weakSkills || ["Cloud AWS", "Docker Containerization"]).map(
                    (w, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 font-semibold border border-rose-100"
                      >
                        ! {w}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(false)}
              >
                Close Window
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  addToast(`Intervention notice issued to ${activeStudent.name}`, "info");
                  setModalOpen(false);
                }}
              >
                Schedule Career Counseling
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Student Modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        maxWidth="max-w-xl"
        title="Provision New Student Account"
        subtitle="Create an individual student account with institutional login credentials"
      >
        <form onSubmit={handleCreateStudent} className="space-y-4" noValidate>
          {addStudentErrors.general && (
            <div className="flex items-start gap-2.5 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="leading-snug">{addStudentErrors.general}</span>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              disabled={savingStudent}
              value={newStudent.name}
              onChange={(e) => {
                setNewStudent({ ...newStudent, name: e.target.value });
                if (addStudentErrors.name || addStudentErrors.general) {
                  setAddStudentErrors((prev) => ({ ...prev, name: "", general: "" }));
                }
              }}
              placeholder="e.g. Aarav Sharma"
              className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                addStudentErrors.name
                  ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                  : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-600"
              }`}
            />
            {addStudentErrors.name && (
              <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {addStudentErrors.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Institutional Email *
            </label>
            <input
              type="email"
              required
              disabled={savingStudent}
              value={newStudent.email}
              onChange={(e) => {
                setNewStudent({ ...newStudent, email: e.target.value });
                if (addStudentErrors.email || addStudentErrors.general) {
                  setAddStudentErrors((prev) => ({ ...prev, email: "", general: "" }));
                }
              }}
              placeholder="aarav.sharma@college.edu"
              className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                addStudentErrors.email
                  ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                  : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-600"
              }`}
            />
            {addStudentErrors.email && (
              <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {addStudentErrors.email}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Roll No / USN *
              </label>
              <input
                type="text"
                required
                disabled={savingStudent}
                value={newStudent.rollNo}
                onChange={(e) => {
                  setNewStudent({ ...newStudent, rollNo: e.target.value });
                  if (addStudentErrors.rollNo || addStudentErrors.general) {
                    setAddStudentErrors((prev) => ({ ...prev, rollNo: "", general: "" }));
                  }
                }}
                placeholder="1RV21CS001"
                className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                  addStudentErrors.rollNo
                    ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                    : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-600"
                }`}
              />
              {addStudentErrors.rollNo && (
                <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {addStudentErrors.rollNo}
                </p>
              )}
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                CGPA (0 - 10)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                disabled={savingStudent}
                value={newStudent.cgpa}
                onChange={(e) => {
                  setNewStudent({ ...newStudent, cgpa: e.target.value });
                  if (addStudentErrors.cgpa || addStudentErrors.general) {
                    setAddStudentErrors((prev) => ({ ...prev, cgpa: "", general: "" }));
                  }
                }}
                className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                  addStudentErrors.cgpa
                    ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500"
                    : "border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-600"
                }`}
              />
              {addStudentErrors.cgpa && (
                <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {addStudentErrors.cgpa}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Department / Branch
              </label>
              <select
                disabled={savingStudent}
                value={newStudent.branch}
                onChange={(e) => setNewStudent({ ...newStudent, branch: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="Computer Science & Engineering">CSE</option>
                <option value="Information Science">ISE</option>
                <option value="Artificial Intelligence">AI/ML</option>
                <option value="Electronics & Communication">ECE</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Batch Year
              </label>
              <input
                type="text"
                disabled={savingStudent}
                value={newStudent.batch}
                onChange={(e) => setNewStudent({ ...newStudent, batch: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Initial Password (Optional - Defaults to Roll No)
            </label>
            <input
              type="password"
              disabled={savingStudent}
              value={newStudent.password}
              onChange={(e) => setNewStudent({ ...newStudent, password: e.target.value })}
              placeholder="Leave blank to use Roll No as password"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              disabled={savingStudent}
              onClick={() => setAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={savingStudent} disabled={savingStudent}>
              {savingStudent ? "Creating student..." : "Provision Student"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Bulk CSV Student Import Modal */}
      <Modal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        maxWidth="max-w-2xl"
        title="Bulk Import Students via CSV"
        subtitle="Upload institutional roster spreadsheet to batch-provision student accounts"
      >
        <form onSubmit={handleBulkImport} className="space-y-4">
          {/* Format Helper Card */}
          <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-indigo-900 mb-1">
              <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
              Required CSV Header Format
            </div>
            <p className="text-slate-600 mb-2">
              The first row must include: <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-indigo-200 text-indigo-700 font-bold">Name, Roll No, Email</code> (optional: <code className="font-mono bg-white px-1 py-0.5 rounded border border-indigo-200 text-slate-700">Branch, Batch, CGPA, Skills</code>)
            </p>
            <div className="p-2 rounded-lg bg-white border border-indigo-100 font-mono text-[11px] text-slate-600 overflow-x-auto">
              Name, Roll No, Email, Branch, Batch, CGPA, Skills<br />
              Aarav Sharma, 1RV21CS001, aarav@college.edu, Computer Science, 2025, 8.8, "Python, React, SQL"<br />
              Diya Patel, 1RV21CS002, diya@college.edu, Information Science, 2025, 9.1, "Java, Spring, Docker"
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex gap-2 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setImportMode("file")}
              className={`px-3 py-1.5 rounded-lg border transition-all ${
                importMode === "file"
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              Upload .CSV File
            </button>
            <button
              type="button"
              onClick={() => setImportMode("text")}
              className={`px-3 py-1.5 rounded-lg border transition-all ${
                importMode === "text"
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              Paste Raw CSV Text
            </button>
          </div>

          {/* File Upload Dropzone */}
          {importMode === "file" ? (
            <div>
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl cursor-pointer bg-slate-50/50 hover:bg-indigo-50/20 transition-all">
                <Upload className="w-8 h-8 text-indigo-500 mb-2" />
                <span className="text-xs font-bold text-slate-800">
                  {csvFile ? csvFile.name : "Click to select or drag & drop CSV file"}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  {csvFile ? `${(csvFile.size / 1024).toFixed(1)} KB` : "Supports .csv files up to 10MB"}
                </span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div>
              <textarea
                rows={6}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Name, Roll No, Email, Branch, Batch, CGPA, Skills&#10;Aarav Sharma, 1RV21CS001, aarav@college.edu, Computer Science, 2025, 8.8, Python, React"
                className="w-full p-3 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 resize-none"
              />
            </div>
          )}

          {/* Error Message */}
          {importError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{importError}</span>
            </div>
          )}

          {/* Results Summary */}
          {importResult && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center gap-4 font-bold">
                <span className="text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  {importResult.success} Uploaded
                </span>
                {importResult.failed > 0 && (
                  <span className="text-rose-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {importResult.failed} Skipped / Failed
                  </span>
                )}
              </div>

              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-200/80 max-h-32 overflow-y-auto space-y-1">
                  <p className="font-semibold text-slate-700 text-[11px]">Row validation notices:</p>
                  {importResult.errors.map((err, i) => (
                    <p key={i} className="text-[11px] text-rose-600 font-mono">
                      • {err}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setImportModalOpen(false)}
            >
              {importResult?.success ? "Done" : "Cancel"}
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={importing}
              disabled={importing || !csvText.trim()}
            >
              {importing ? "Importing students..." : "Upload & Provision Students"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
