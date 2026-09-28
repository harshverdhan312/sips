import React, { useState, useEffect, useMemo } from "react";
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
  FileText,
  ExternalLink,
  Share2,
  Trash2,
  GraduationCap,
  UserX,
  ShieldAlert,
  AlertTriangle
} from "lucide-react";
import { placementService } from "../../services/placementService";
import { adminService } from "../../services/adminService";
import { DataTable } from "../../components/common/DataTable";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";
import { ComingSoonModal } from "../../components/common/ComingSoonModal";
import Avatar from "../../components/common/Avatar";
import { useNotifications } from "../../context/NotificationContext";

export function StudentManagementPage() {
  const { showSuccess, showError, showWarning, showInfo } = useNotifications();
  const [students, setStudents] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedAccountStatus, setSelectedAccountStatus] = useState("All");

  // Multi-select state for bulk actions
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [bulkStatusModalOpen, setBulkStatusModalOpen] = useState(false);
  const [bulkTargetStatus, setBulkTargetStatus] = useState("PASSOUT");
  const [updatingBulkStatus, setUpdatingBulkStatus] = useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkDeleteConfirmText, setBulkDeleteConfirmText] = useState("");
  const [deletingBulkStudents, setDeletingBulkStudents] = useState(false);

  // Selected student modal
  const [activeStudent, setActiveStudent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [counselingComingSoon, setCounselingComingSoon] = useState(false);

  // Student Account Lifecycle Modals
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusModalStudent, setStatusModalStudent] = useState(null);
  const [targetAccountStatus, setTargetAccountStatus] = useState("ACTIVE");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Hardened Delete Student Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteModalStudent, setDeleteModalStudent] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingStudent, setDeletingStudent] = useState(false);

  // Add Student modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [savingStudent, setSavingStudent] = useState(false);
  const [addStudentErrors, setAddStudentErrors] = useState({});
  const [academicStructure, setAcademicStructure] = useState([]);
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    rollNo: "",
    course: "",
    branch: "Computer Science & Engineering",
    section: "",
    batch: "",
    cgpa: "",
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
  const [exporting, setExporting] = useState(false);

  // Load students and academic structure from backend
  const loadStudents = async () => {
    try {
      const data = await placementService.getStudents();
      setStudents(data);
    } catch (e) {
      console.error("Failed to load students:", e);
      showError("Failed to load student roster.");
    }
  };

  const loadAcademicStructure = async () => {
    try {
      const structure = await placementService.getAcademicStructure();
      if (Array.isArray(structure) && structure.length > 0) {
        setAcademicStructure(structure);
        const firstCourse = structure[0];
        const firstBranch = firstCourse?.branches?.[0];
        const firstSec = firstBranch?.sections?.[0] || "";
        setNewStudent((prev) => ({
          ...prev,
          course: prev.course || firstCourse?.courseName || "",
          branch: prev.branch || firstBranch?.branchName || "Computer Science & Engineering",
          section: prev.section || firstSec
        }));
      }
    } catch (e) {
      console.warn("Could not load academic structure:", e);
    }
  };

  useEffect(() => {
    loadStudents();
    loadAcademicStructure();
  }, []);

  // Compute all unique available branches dynamically from dataset and academic structure
  const filterBranchList = useMemo(() => {
    const branchSet = new Set();
    students.forEach((s) => {
      if (s.branch && s.branch.trim()) {
        branchSet.add(s.branch.trim());
      }
    });
    // Add branches from academicStructure
    (academicStructure || []).forEach((c) => {
      (c.branches || []).forEach((b) => {
        if (b.branchName && b.branchName.trim()) {
          branchSet.add(b.branchName.trim());
        }
      });
    });
    // Ensure all standard engineering branches are included
    [
      "Computer Science",
      "Computer Science & Engineering",
      "Information Science",
      "Electronics",
      "Electronics & Communication",
      "Electrical",
      "Mechanical",
      "Civil"
    ].forEach((b) => branchSet.add(b));
    return Array.from(branchSet).sort();
  }, [students, academicStructure]);

  // Compute filtered students list combining branch and status filters
  const filteredStudents = useMemo(() => {
    return students.filter((st) => {
      // Branch filter
      if (selectedBranch && selectedBranch !== "All") {
        const sBranch = (st.branch || "").toLowerCase().trim();
        const selBranch = selectedBranch.toLowerCase().trim();
        if (selBranch === "computer science" || selBranch === "computer science & engineering" || selBranch === "cse") {
          if (!sBranch.includes("computer") && !sBranch.includes("cs")) return false;
        } else if (selBranch === "electronics" || selBranch === "electronics & communication" || selBranch === "ece") {
          if (!sBranch.includes("electron") && !sBranch.includes("ec")) return false;
        } else if (selBranch === "information science" || selBranch === "ise" || selBranch === "it") {
          if (!sBranch.includes("information") && !sBranch.includes("is") && !sBranch.includes("it")) return false;
        } else if (selBranch === "electrical" || selBranch === "electrical engineering" || selBranch === "eee") {
          if (!sBranch.includes("electric") && !sBranch.includes("ee")) return false;
        } else if (selBranch === "mechanical" || selBranch === "mechanical engineering" || selBranch === "me") {
          if (!sBranch.includes("mechanic") && !sBranch.includes("me")) return false;
        } else if (selBranch === "civil" || selBranch === "civil engineering") {
          if (!sBranch.includes("civil")) return false;
        } else {
          if (!sBranch.includes(selBranch) && !selBranch.includes(sBranch)) return false;
        }
      }

      // Status filter
      if (selectedStatus && selectedStatus !== "All") {
        const sStatus = (st.status || "").toLowerCase().trim();
        const sPlacementStatus = (st.placementStatus || "").toLowerCase().trim();
        const selStatus = selectedStatus.toLowerCase().trim();

        if (selStatus === "placement ready" || selStatus === "ready") {
          if (sStatus !== "placement ready" && (st.metrics?.employabilityIndex || 0) < 75) return false;
        } else if (selStatus === "needs improvement" || selStatus === "needs_improvement") {
          if (sStatus !== "needs improvement" && ((st.metrics?.employabilityIndex || 0) < 50 || (st.metrics?.employabilityIndex || 0) >= 75)) return false;
        } else if (selStatus === "at risk" || selStatus === "at_risk") {
          if (sStatus !== "at risk" && (st.metrics?.employabilityIndex || 0) >= 50) return false;
        } else if (selStatus === "placed") {
          if (sPlacementStatus !== "placed") return false;
        } else if (selStatus === "unplaced") {
          if (sPlacementStatus !== "unplaced") return false;
        } else {
          if (sStatus !== selStatus && sPlacementStatus !== selStatus) return false;
        }
      }

      // Account lifecycle status filter
      if (selectedAccountStatus && selectedAccountStatus !== "All") {
        const selAcc = selectedAccountStatus.toLowerCase().replace(/[\s-_]/g, "");
        const sAcc = (st.accountStatus || "ACTIVE").toLowerCase().replace(/[\s-_]/g, "");
        if (selAcc === "active" && sAcc !== "active") return false;
        if ((selAcc === "passout" || selAcc === "pass-out") && sAcc !== "passout") return false;
        if ((selAcc === "debarred" || selAcc === "deactivated") && (sAcc !== "debarred" && sAcc !== "deactivated")) return false;
      }

      return true;
    });
  }, [students, selectedBranch, selectedStatus, selectedAccountStatus]);

  // Derived academic structure helper lists
  const allBranches = Array.from(
    new Set(academicStructure.flatMap((c) => (c.branches || []).map((b) => b.branchName)))
  ).filter(Boolean);

  const selectedCourseObj =
    academicStructure.find((c) => c.courseName === newStudent.course) || academicStructure[0];
  const availableBranches = selectedCourseObj?.branches || [];
  const selectedBranchObj =
    availableBranches.find((b) => b.branchName === newStudent.branch) || availableBranches[0];
  const availableSections = selectedBranchObj?.sections || [];

  const handleCourseChange = (courseName) => {
    const courseObj = academicStructure.find((c) => c.courseName === courseName);
    const firstBranch = courseObj?.branches?.[0];
    const firstSection = firstBranch?.sections?.[0] || "";
    setNewStudent((prev) => ({
      ...prev,
      course: courseName,
      branch: firstBranch?.branchName || "",
      section: firstSection
    }));
  };

  const handleBranchChange = (branchName) => {
    const branchObj = availableBranches.find((b) => b.branchName === branchName);
    const firstSection = branchObj?.sections?.[0] || "";
    setNewStudent((prev) => ({
      ...prev,
      branch: branchName,
      section: firstSection
    }));
  };

  const handleSectionChange = (section) => {
    setNewStudent((prev) => ({
      ...prev,
      section
    }));
  };

  const handleExportCsv = async () => {
    if (exporting) return;
    setExporting(true);
    showInfo("Exporting Student Placement Readiness records to CSV...");
    try {
      const { blob, filename } = await adminService.exportStudentsCSV({
        branch: selectedBranch,
        status: selectedStatus
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || `sips_placement_roster_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showSuccess("Placement roster CSV downloaded successfully.");
    } catch (err) {
      console.error("Failed to export students CSV:", err);
      showError(err.message || "Failed to export roster CSV.");
    } finally {
      setExporting(false);
    }
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
        course: academicStructure[0]?.courseName || "",
        branch: academicStructure[0]?.branches?.[0]?.branchName || "Computer Science & Engineering",
        section: academicStructure[0]?.branches?.[0]?.sections?.[0] || "",
        batch: "",
        cgpa: "",
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

  const handleCopyProfileLink = (username) => {
    if (!username) return;
    try {
      const url = `${window.location.origin}/u/${encodeURIComponent(username)}`;
      navigator.clipboard.writeText(url);
      showSuccess("Profile link copied to clipboard");
    } catch (e) {
      showError("Failed to copy link to clipboard");
    }
  };

  const handleOpenStatusModal = (student, newStatus) => {
    setStatusModalStudent(student);
    setTargetAccountStatus(newStatus);
    setStatusModalOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!statusModalStudent || !targetAccountStatus || updatingStatus) return;
    setUpdatingStatus(true);
    try {
      const studentId = statusModalStudent.id || statusModalStudent._id;
      await placementService.updateStudentAccountStatus(studentId, targetAccountStatus);
      showSuccess(`Student account status updated to ${targetAccountStatus}.`);
      setStatusModalOpen(false);
      setStudents((prev) =>
        prev.map((s) =>
          (s.id === studentId || s._id === studentId)
            ? { ...s, accountStatus: targetAccountStatus }
            : s
        )
      );
      if (activeStudent && (activeStudent.id === studentId || activeStudent._id === studentId)) {
        setActiveStudent((prev) => ({ ...prev, accountStatus: targetAccountStatus }));
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      showError(err.message || "Failed to update student account status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleOpenDeleteModal = (student) => {
    setDeleteModalStudent(student);
    setDeleteConfirmText("");
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalStudent || deletingStudent) return;
    setDeletingStudent(true);
    try {
      const studentId = deleteModalStudent.id || deleteModalStudent._id;
      await placementService.deleteStudent(studentId);
      showSuccess(`Student ${deleteModalStudent.name} and associated records permanently deleted.`);
      setDeleteModalOpen(false);
      setStudents((prev) => prev.filter((s) => s.id !== studentId && s._id !== studentId));
      if (activeStudent && (activeStudent.id === studentId || activeStudent._id === studentId)) {
        setModalOpen(false);
        setActiveStudent(null);
      }
    } catch (err) {
      console.error("Failed to delete student:", err);
      showError(err.message || "Failed to delete student.");
    } finally {
      setDeletingStudent(false);
    }
  };

  const handleToggleSelectAll = (e) => {
    if (e.target.checked) {
      const allFilteredIds = filteredStudents.map((s) => s.id || s._id);
      setSelectedStudentIds(allFilteredIds);
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleToggleSelectStudent = (studentId, e) => {
    e.stopPropagation();
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const isAllSelected = filteredStudents.length > 0 && filteredStudents.every((s) => selectedStudentIds.includes(s.id || s._id));
  const isSomeSelected = filteredStudents.some((s) => selectedStudentIds.includes(s.id || s._id)) && !isAllSelected;

  const handleOpenBulkStatusModal = (status) => {
    setBulkTargetStatus(status);
    setBulkStatusModalOpen(true);
  };

  const handleConfirmBulkStatus = async () => {
    if (selectedStudentIds.length === 0 || updatingBulkStatus) return;
    setUpdatingBulkStatus(true);
    try {
      await placementService.bulkUpdateStudentAccountStatus(selectedStudentIds, bulkTargetStatus);
      showSuccess(`Updated account status for ${selectedStudentIds.length} candidate(s) to ${bulkTargetStatus}.`);
      setStudents((prev) =>
        prev.map((s) => {
          const sId = s.id || s._id;
          if (selectedStudentIds.includes(sId)) {
            return { ...s, accountStatus: bulkTargetStatus };
          }
          return s;
        })
      );
      setSelectedStudentIds([]);
      setBulkStatusModalOpen(false);
    } catch (err) {
      console.error("Failed bulk update:", err);
      showError(err.message || "Failed to update bulk student status.");
    } finally {
      setUpdatingBulkStatus(false);
    }
  };

  const handleOpenBulkDeleteModal = () => {
    setBulkDeleteConfirmText("");
    setBulkDeleteModalOpen(true);
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedStudentIds.length === 0 || deletingBulkStudents) return;
    setDeletingBulkStudents(true);
    try {
      await placementService.bulkDeleteStudents(selectedStudentIds);
      showSuccess(`Permanently deleted ${selectedStudentIds.length} candidate(s) and their associated records.`);
      setStudents((prev) => prev.filter((s) => !selectedStudentIds.includes(s.id || s._id)));
      setSelectedStudentIds([]);
      setBulkDeleteModalOpen(false);
    } catch (err) {
      console.error("Failed bulk delete:", err);
      showError(err.message || "Failed to delete selected students.");
    } finally {
      setDeletingBulkStudents(false);
    }
  };

  const deleteExpectedMatch = useMemo(() => {
    if (!deleteModalStudent) return [];
    const expected = [];
    if (deleteModalStudent.name) expected.push(deleteModalStudent.name.trim().toLowerCase());
    if (deleteModalStudent.rollNo) expected.push(deleteModalStudent.rollNo.trim().toLowerCase());
    if (deleteModalStudent.usn) expected.push(deleteModalStudent.usn.trim().toLowerCase());
    return expected;
  }, [deleteModalStudent]);

  const isDeleteConfirmed = useMemo(() => {
    const input = (deleteConfirmText || "").trim().toLowerCase();
    return input.length > 0 && deleteExpectedMatch.includes(input);
  }, [deleteConfirmText, deleteExpectedMatch]);

  const columns = [
    {
      title: (
        <input
          type="checkbox"
          checked={isAllSelected}
          ref={(el) => {
            if (el) el.indeterminate = isSomeSelected;
          }}
          onChange={handleToggleSelectAll}
          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          title="Select all filtered candidates"
        />
      ),
      key: "select",
      className: "w-10 text-center",
      render: (row) => {
        const sId = row.id || row._id;
        return (
          <input
            type="checkbox"
            checked={selectedStudentIds.includes(sId)}
            onChange={(e) => handleToggleSelectStudent(sId, e)}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            title={`Select ${row.name}`}
          />
        );
      }
    },
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
      render: (row) => (
        <div>
          <span className="text-slate-800 font-medium">{row.branch}</span>
          {(row.course || row.section) && (
            <p className="text-[11px] text-slate-400">
              {row.course ? row.course : ""}{row.course && row.section ? " • " : ""}{row.section ? `Sec ${row.section}` : ""}
            </p>
          )}
        </div>
      )
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
          {row.metrics?.technicalScore ?? 0}/100
        </span>
      )
    },
    {
      title: "Soft Skill",
      key: "metrics.softSkillScore",
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-purple-600">
          {row.metrics?.softSkillScore ?? 0}/100
        </span>
      )
    },
    {
      title: "Employability",
      key: "metrics.employabilityIndex",
      sortable: true,
      render: (row) => (
        <span className="font-bold text-slate-900">
          {row.metrics?.employabilityIndex ?? 0}/100
        </span>
      )
    },
    {
      title: "Placement Prob.",
      key: "metrics.placementProbability",
      sortable: true,
      render: (row) => (
        <span className="font-extrabold text-emerald-600">
          {row.metrics?.placementProbability ?? 0}%
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
      title: "Account",
      key: "accountStatus",
      sortable: true,
      render: (row) => {
        const acc = (row.accountStatus || "ACTIVE").toUpperCase();
        if (acc === "PASSOUT") {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              Pass-Out
            </span>
          );
        }
        if (acc === "DEBARRED" || acc === "DEACTIVATED") {
          return (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200"
              title="Debarred: Can login, cannot apply to placement drives"
            >
              <ShieldAlert className="w-3 h-3 text-rose-500" />
              Debarred
            </span>
          );
        }
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Active
          </span>
        );
      }
    },
    {
      title: "Action",
      key: "actions",
      className: "text-right",
      render: (row) => {
        const acc = (row.accountStatus || "ACTIVE").toUpperCase();
        return (
          <div className="flex items-center justify-end gap-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="outline"
              size="xs"
              icon={Eye}
              onClick={() => handleViewStudent(row)}
              title="Candidate Placement Intelligence Profile"
            >
              Placement Profile
            </Button>
            {row.publicProfile?.enabled && row.publicProfile?.username && (
              <a
                href={`/u/${encodeURIComponent(row.publicProfile.username)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 border border-indigo-200 transition-colors"
                title="Open Student's Public Career Profile (New Tab)"
              >
                <span>Career Profile</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {acc === "ACTIVE" && (
              <>
                <button
                  type="button"
                  onClick={() => handleOpenStatusModal(row, "PASSOUT")}
                  className="px-2 py-1 rounded-lg text-xs font-medium text-amber-700 hover:bg-amber-50 border border-amber-200 transition-colors cursor-pointer"
                  title="Mark student as pass-out (graduated)"
                >
                  Mark Pass-Out
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenStatusModal(row, "DEBARRED")}
                  className="px-2 py-1 rounded-lg text-xs font-medium text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                  title="Debar student from applying to placement drives"
                >
                  Debar
                </button>
              </>
            )}
            {acc === "PASSOUT" && (
              <>
                <button
                  type="button"
                  onClick={() => handleOpenStatusModal(row, "ACTIVE")}
                  className="px-2 py-1 rounded-lg text-xs font-medium text-emerald-700 hover:bg-emerald-50 border border-emerald-200 transition-colors cursor-pointer"
                  title="Restore active portal access"
                >
                  Restore Access
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenStatusModal(row, "DEBARRED")}
                  className="px-2 py-1 rounded-lg text-xs font-medium text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
                  title="Debar student from applying to placement drives"
                >
                  Debar
                </button>
              </>
            )}
            {(acc === "DEBARRED" || acc === "DEACTIVATED") && (
              <>
                <button
                  type="button"
                  onClick={() => handleOpenStatusModal(row, "ACTIVE")}
                  className="px-2 py-1 rounded-lg text-xs font-medium text-emerald-700 hover:bg-emerald-50 border border-emerald-200 transition-colors cursor-pointer"
                  title="Restore student's ability to apply to placement drives"
                >
                  Restore (Allow Applications)
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenStatusModal(row, "PASSOUT")}
                  className="px-2 py-1 rounded-lg text-xs font-medium text-amber-700 hover:bg-amber-50 border border-amber-200 transition-colors cursor-pointer"
                  title="Mark student as pass-out (graduated)"
                >
                  Mark Pass-Out
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => handleOpenDeleteModal(row)}
              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
              title="Delete student and all records"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      }
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
          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={handleExportCsv}
            loading={exporting}
            disabled={exporting}
          >
            {exporting ? "Exporting..." : "Export Roster"}
          </Button>
        </div>
      </div>

      {/* Floating Bulk Selection Actions Bar */}
      {selectedStudentIds.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-500 text-xs font-black font-mono shadow-xs">
              {selectedStudentIds.length}
            </span>
            <div>
              <p className="text-sm font-bold text-white">
                {selectedStudentIds.length} candidate{selectedStudentIds.length > 1 ? "s" : ""} selected
              </p>
              <p className="text-[11px] text-slate-400">
                Choose a bulk operation to apply across all selected candidates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              type="button"
              onClick={() => handleOpenBulkStatusModal("PASSOUT")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 text-xs font-semibold transition-colors cursor-pointer"
              title="Mark selected candidates as Pass-Out (graduated)"
            >
              <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
              <span>Mark Pass-Out</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenBulkStatusModal("DEBARRED")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/40 text-xs font-semibold transition-colors cursor-pointer"
              title="Debar selected candidates from applying to placement drives"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Debar Candidates</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenBulkStatusModal("ACTIVE")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 text-xs font-semibold transition-colors cursor-pointer"
              title="Restore active privileges and allow applications"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Restore Access</span>
            </button>

            <button
              type="button"
              onClick={handleOpenBulkDeleteModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600/30 hover:bg-red-600/50 text-red-200 border border-red-500/40 text-xs font-semibold transition-colors cursor-pointer"
              title="Permanently delete selected candidates and cleanup records"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>Delete Selected</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedStudentIds([])}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Filter Bar and DataTable */}
      <DataTable
        columns={columns}
        data={filteredStudents}
        searchPlaceholder="Search candidate by name, USN, or branch..."
        searchKey={(item, q) =>
          Boolean(
            (item.name && item.name.toLowerCase().includes(q)) ||
            (item.usn && item.usn.toLowerCase().includes(q)) ||
            (item.rollNo && item.rollNo.toLowerCase().includes(q)) ||
            (item.branch && item.branch.toLowerCase().includes(q)) ||
            (item.email && item.email.toLowerCase().includes(q))
          )
        }
        onRowClick={(row) => handleViewStudent(row)}
        filterComponent={
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="All">All Branches</option>
              {filterBranchList.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="All">All Placement Statuses</option>
              <option value="Needs Improvement">Needs Improvement</option>
              <option value="Placement Ready">Placement Ready</option>
              <option value="At Risk">At Risk</option>
              <option value="Placed">Placed</option>
              <option value="Unplaced">Unplaced</option>
            </select>

            <select
              value={selectedAccountStatus}
              onChange={(e) => setSelectedAccountStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="All">All Account Statuses</option>
              <option value="Active">Active</option>
              <option value="Pass-Out">Pass-Out</option>
              <option value="Debarred">Debarred</option>
            </select>

            {(selectedBranch !== "All" || selectedStatus !== "All" || selectedAccountStatus !== "All") && (
              <button
                type="button"
                onClick={() => {
                  setSelectedBranch("All");
                  setSelectedStatus("All");
                  setSelectedAccountStatus("All");
                }}
                className="px-2 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
              >
                Reset Filters
              </button>
            )}
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
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-slate-900 text-lg">
                    {activeStudent.name}
                  </h3>
                  <Badge
                    variant={
                      activeStudent.status === "Placement Ready"
                        ? "success"
                        : activeStudent.status === "Needs Improvement"
                        ? "warning"
                        : activeStudent.status === "Placed"
                        ? "success"
                        : activeStudent.status === "Resume Pending"
                        ? "neutral"
                        : "danger"
                    }
                    size="sm"
                  >
                    {activeStudent.status}
                  </Badge>
                  {((activeStudent.accountStatus || "ACTIVE").toUpperCase() === "PASSOUT") && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                      Account: Pass-Out
                    </span>
                  )}
                  {((activeStudent.accountStatus || "ACTIVE").toUpperCase() === "DEBARRED" || (activeStudent.accountStatus || "ACTIVE").toUpperCase() === "DEACTIVATED") && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                      <ShieldAlert className="w-3 h-3 text-rose-500" />
                      Account: Debarred
                    </span>
                  )}
                  {((activeStudent.accountStatus || "ACTIVE").toUpperCase() === "ACTIVE") && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Account: Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeStudent.course ? `${activeStudent.course} • ` : ""}{activeStudent.branch}{activeStudent.section ? ` (Sec ${activeStudent.section})` : ""} • Batch {activeStudent.batch}
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
                  {activeStudent.resumeUrl ? `${activeStudent.metrics?.employabilityIndex ?? 0}/100` : "Pending Resume"}
                </h4>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <p className="text-[10px] font-bold text-emerald-900 uppercase">
                  Placement Prob.
                </p>
                <h4 className="text-2xl font-black text-emerald-700 mt-1">
                  {activeStudent.resumeUrl ? `${activeStudent.metrics?.placementProbability ?? 0}%` : "Not Evaluated"}
                </h4>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                <p className="text-[10px] font-bold text-blue-900 uppercase">
                  Technical Score
                </p>
                <h4 className="text-2xl font-black text-blue-700 mt-1">
                  {activeStudent.resumeUrl ? (activeStudent.metrics?.technicalScore ?? 0) : "Pending"}
                </h4>
              </div>

              <div className="p-3 rounded-xl bg-purple-50 border border-purple-100">
                <p className="text-[10px] font-bold text-purple-900 uppercase">
                  Soft Skill Index
                </p>
                <h4 className="text-2xl font-black text-purple-700 mt-1">
                  {activeStudent.resumeUrl ? (activeStudent.metrics?.softSkillScore ?? 0) : "Pending"}
                </h4>
              </div>
            </div>

            {/* Skills & Interventions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <h4 className="font-bold text-slate-900 mb-2">Verified Strengths</h4>
                {activeStudent.resumeUrl && Array.isArray(activeStudent.strongSkills) && activeStudent.strongSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {activeStudent.strongSkills.map((s, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100"
                      >
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic py-2 text-xs">
                    No verified strengths yet. Upload your resume to analyze your skills.
                  </p>
                )}
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-white">
                <h4 className="font-bold text-slate-900 mb-2">Skill Gaps Requiring Action</h4>
                {activeStudent.resumeUrl && Array.isArray(activeStudent.weakSkills) && activeStudent.weakSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {activeStudent.weakSkills.map((w, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 font-semibold border border-rose-100"
                      >
                        ! {w}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic py-2 text-xs">
                    No skill-gap analysis available yet. Upload your resume to identify your skill gaps.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {(activeStudent.accountStatus || "ACTIVE").toUpperCase() === "DEACTIVATED" ? (
                  <span className="text-xs text-rose-500 font-medium">
                    Public career profile is hidden while student account is deactivated.
                  </span>
                ) : activeStudent.publicProfile?.enabled && activeStudent.publicProfile?.username ? (
                  <>
                    <a
                      href={`/u/${encodeURIComponent(activeStudent.publicProfile.username)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition-colors border border-indigo-200"
                      title="Open student's public career profile in a new tab"
                    >
                      <span>View Career Profile</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopyProfileLink(activeStudent.publicProfile.username)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors border border-slate-200 cursor-pointer"
                      title="Copy public career profile URL"
                    >
                      <Share2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy Link</span>
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-slate-400 italic">
                    Student has not enabled a public career profile.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
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
                  onClick={() => setCounselingComingSoon(true)}
                >
                  Schedule Career Counseling
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ComingSoonModal
        isOpen={counselingComingSoon}
        onClose={() => setCounselingComingSoon(false)}
        title="Career Counselling Coming Soon"
        body="Career counselling features are currently under development and will be available in a future update."
      />

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
                placeholder="e.g. 8.5"
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

          {/* Academic Structure: Course, Branch, Section Cascading Fields */}
          {academicStructure.length > 0 ? (
            <div className="space-y-3 p-3 bg-slate-50/80 border border-slate-200/80 rounded-xl">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Degree Program / Course *
                  </label>
                  <select
                    disabled={savingStudent}
                    value={newStudent.course}
                    onChange={(e) => handleCourseChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {academicStructure.map((c) => (
                      <option key={c.courseName} value={c.courseName}>
                        {c.courseName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Branch / Department *
                  </label>
                  <select
                    disabled={savingStudent}
                    value={newStudent.branch}
                    onChange={(e) => handleBranchChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {availableBranches.map((b) => (
                      <option key={b.branchName} value={b.branchName}>
                        {b.branchName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Section
                  </label>
                  <select
                    disabled={savingStudent}
                    value={newStudent.section}
                    onChange={(e) => handleSectionChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {availableSections.map((s) => (
                      <option key={s} value={s}>
                        Section {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Batch Year
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2026"
                    disabled={savingStudent}
                    value={newStudent.batch}
                    onChange={(e) => setNewStudent({ ...newStudent, batch: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Department / Branch
                </label>
                <input
                  type="text"
                  disabled={savingStudent}
                  placeholder="e.g. Computer Science & Engineering"
                  value={newStudent.branch}
                  onChange={(e) => setNewStudent({ ...newStudent, branch: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Batch Year
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2026"
                  disabled={savingStudent}
                  value={newStudent.batch}
                  onChange={(e) => setNewStudent({ ...newStudent, batch: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          )}

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
              The first row must include: <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-indigo-200 text-indigo-700 font-bold">Name, Roll No, Email</code> (supported: <code className="font-mono bg-white px-1 py-0.5 rounded border border-indigo-200 text-slate-700">Course, Branch, Section, Batch, CGPA, Skills</code>)
            </p>
            <div className="p-2 rounded-lg bg-white border border-indigo-100 font-mono text-[11px] text-slate-600 overflow-x-auto">
              Name, Roll No, Email, Course, Branch, Section, Batch, CGPA, Skills<br />
              Aarav Sharma, 1RV21CS001, aarav@college.edu, B.Tech, Computer Science, A, 2025, 8.8, "Python, React, SQL"<br />
              Diya Patel, 1RV21CS002, diya@college.edu, B.Tech, Information Science, B, 2025, 9.1, "Java, Spring, Docker"
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
                placeholder={'Name, Roll No, Email, Course, Branch, Section, Batch, CGPA, Skills\nAarav Sharma, 1RV21CS001, aarav@college.edu, B.Tech, Computer Science, A, 2025, 8.8, "Python, React, SQL"'}
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

      {/* Account Lifecycle Status Confirmation Modal */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        maxWidth="max-w-md"
        title={
          targetAccountStatus === "PASSOUT"
            ? "Mark Student as Pass-Out?"
            : targetAccountStatus === "DEBARRED"
            ? "Debar Student from Placement Drives?"
            : targetAccountStatus === "DEACTIVATED"
            ? "Deactivate Student Access?"
            : "Restore Student Placement Privileges?"
        }
        subtitle={
          statusModalStudent
            ? `${statusModalStudent.name} (${statusModalStudent.usn || statusModalStudent.rollNo})`
            : ""
        }
      >
        {statusModalStudent && (
          <div className="space-y-4 text-xs text-slate-600">
            {targetAccountStatus === "PASSOUT" && (
              <>
                <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-amber-950">
                    <GraduationCap className="w-4 h-4 text-amber-600" />
                    <span>Graduated / Pass-Out Lifecycle Transition</span>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Student: <strong>{statusModalStudent.name}</strong> • Batch: <strong>{statusModalStudent.batch || "N/A"}</strong>
                  </p>
                </div>

                <div className="space-y-2 py-1">
                  <p className="font-semibold text-slate-800">This action will:</p>
                  <ul className="space-y-1.5 pl-1">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-600 font-bold">•</span>
                      <span>Disable student portal login and immediate API access</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Preserve institutional placement records & match telemetry</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Preserve college records</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Keep the public Career Profile available if enabled</span>
                    </li>
                  </ul>
                </div>
              </>
            )}

            {targetAccountStatus === "DEBARRED" && (
              <>
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-rose-950">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>Debarment from Campus Placement Drives</span>
                  </div>
                  <p className="text-xs text-rose-800 leading-relaxed">
                    Student: <strong>{statusModalStudent.name}</strong> ({statusModalStudent.usn || statusModalStudent.rollNo})
                  </p>
                </div>

                <div className="space-y-2 py-1">
                  <p className="font-semibold text-slate-800">This action will:</p>
                  <ul className="space-y-1.5 pl-1">
                    <li className="flex items-start gap-2">
                      <span className="text-rose-600 font-bold">•</span>
                      <span>Block student from applying to any job postings (returns 403 Forbidden)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Allow student to log in, view dashboard, metrics, and manage profile</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Preserve all candidate records and public career profile</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Can be restored by Placement Cell at any time</span>
                    </li>
                  </ul>
                </div>
              </>
            )}

            {targetAccountStatus === "DEACTIVATED" && (
              <>
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-rose-950">
                    <UserX className="w-4 h-4 text-rose-600" />
                    <span>Administrative Access Revocation</span>
                  </div>
                  <p className="text-xs text-rose-800 leading-relaxed">
                    Student: <strong>{statusModalStudent.name}</strong>
                  </p>
                </div>

                <div className="space-y-2 py-1">
                  <p className="font-semibold text-slate-800">This action will:</p>
                  <ul className="space-y-1.5 pl-1">
                    <li className="flex items-start gap-2">
                      <span className="text-rose-600 font-bold">•</span>
                      <span>Block student login</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-rose-600 font-bold">•</span>
                      <span>Immediately revoke student API access</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Preserve college records</span>
                    </li>
                  </ul>
                </div>
              </>
            )}

            {targetAccountStatus === "ACTIVE" && (
              <>
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-950">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Restore Full Student Placement Privileges</span>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Student: <strong>{statusModalStudent.name}</strong>
                  </p>
                </div>

                <div className="space-y-2 py-1">
                  <p className="font-semibold text-slate-800">This action will:</p>
                  <ul className="space-y-1.5 pl-1">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Restore student portal login capability (if previously pass-out)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>Restore ability to apply to campus placement drives & job postings</span>
                    </li>
                  </ul>
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStatusModalOpen(false)}
                disabled={updatingStatus}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant={
                  targetAccountStatus === "DEBARRED" || targetAccountStatus === "DEACTIVATED"
                    ? "danger"
                    : targetAccountStatus === "PASSOUT"
                    ? "primary"
                    : "success"
                }
                size="sm"
                loading={updatingStatus}
                onClick={handleConfirmStatusChange}
              >
                {targetAccountStatus === "PASSOUT"
                  ? "Mark as Pass-Out"
                  : targetAccountStatus === "DEBARRED"
                  ? "Debar Student"
                  : targetAccountStatus === "DEACTIVATED"
                  ? "Deactivate"
                  : "Restore Access"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Bulk Lifecycle Status Confirmation Modal */}
      <Modal
        isOpen={bulkStatusModalOpen}
        onClose={() => setBulkStatusModalOpen(false)}
        maxWidth="max-w-md"
        title={
          bulkTargetStatus === "PASSOUT"
            ? `Mark ${selectedStudentIds.length} Students as Pass-Out?`
            : bulkTargetStatus === "DEBARRED"
            ? `Debar ${selectedStudentIds.length} Students from Drives?`
            : `Restore Full Access for ${selectedStudentIds.length} Students?`
        }
        subtitle={`${selectedStudentIds.length} selected candidates`}
      >
        <div className="space-y-4 text-xs text-slate-600">
          {bulkTargetStatus === "PASSOUT" && (
            <>
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-amber-950">
                  <GraduationCap className="w-4 h-4 text-amber-600" />
                  <span>Bulk Pass-Out / Alumni Transition</span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  You are marking <strong>{selectedStudentIds.length}</strong> selected candidate(s) as Pass-Out / Graduated.
                </p>
              </div>

              <div className="space-y-2 py-1">
                <p className="font-semibold text-slate-800">This action will:</p>
                <ul className="space-y-1.5 pl-1">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>Disable student portal login for all selected students</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Preserve all institutional placement metrics and historical records</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Keep public Career Profiles available (if enabled by students)</span>
                  </li>
                </ul>
              </div>
            </>
          )}

          {bulkTargetStatus === "DEBARRED" && (
            <>
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-rose-950">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Bulk Debarment from Campus Placement</span>
                </div>
                <p className="text-xs text-rose-800 leading-relaxed">
                  You are debarring <strong>{selectedStudentIds.length}</strong> selected candidate(s) from applying to placement drives.
                </p>
              </div>

              <div className="space-y-2 py-1">
                <p className="font-semibold text-slate-800">This action will:</p>
                <ul className="space-y-1.5 pl-1">
                  <li className="flex items-start gap-2">
                    <span className="text-rose-600 font-bold">•</span>
                    <span>Block job applications (attempting to apply returns 403 Forbidden)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Allow students to log in and view dashboard, profiles, and drive details</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Can be restored at any time by the Placement Cell</span>
                  </li>
                </ul>
              </div>
            </>
          )}

          {bulkTargetStatus === "ACTIVE" && (
            <>
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-950">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Restore Active Privileges</span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Restoring full placement portal privileges and job application eligibility for <strong>{selectedStudentIds.length}</strong> student(s).
                </p>
              </div>

              <div className="space-y-2 py-1">
                <p className="font-semibold text-slate-800">This action will:</p>
                <ul className="space-y-1.5 pl-1">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Restore student portal login capability</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>Restore full ability to apply for placement drives</span>
                  </li>
                </ul>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setBulkStatusModalOpen(false)}
              disabled={updatingBulkStatus}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={
                bulkTargetStatus === "DEBARRED"
                  ? "danger"
                  : bulkTargetStatus === "PASSOUT"
                  ? "primary"
                  : "success"
              }
              size="sm"
              loading={updatingBulkStatus}
              onClick={handleConfirmBulkStatus}
            >
              {bulkTargetStatus === "PASSOUT"
                ? "Confirm Bulk Pass-Out"
                : bulkTargetStatus === "DEBARRED"
                ? "Confirm Bulk Debarment"
                : "Restore All Selected"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Hardened Delete Student Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        maxWidth="max-w-md"
        title="Delete Student"
        subtitle={
          deleteModalStudent
            ? `${deleteModalStudent.name} (${deleteModalStudent.usn || deleteModalStudent.rollNo})`
            : ""
        }
      >
        {deleteModalStudent && (
          <div className="space-y-4 text-xs text-slate-600">
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-rose-950">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Warning</span>
              </div>
              <p className="text-xs text-rose-800 leading-relaxed">
                This permanently removes the student account and associated removable data. This action cannot be undone.
              </p>
            </div>

            <div className="space-y-1 text-slate-700">
              <p><strong>Student:</strong> {deleteModalStudent.name}</p>
              <p><strong>Student ID / USN:</strong> {deleteModalStudent.usn || deleteModalStudent.rollNo}</p>
            </div>

            <div className="space-y-2 pt-1">
              <label className="block text-slate-700 font-semibold text-xs leading-relaxed">
                To confirm deletion, type the student's name (<span className="font-mono font-bold text-slate-900 select-all">{deleteModalStudent.name}</span>) or USN/Roll No (<span className="font-mono font-bold text-slate-900 select-all">{deleteModalStudent.usn || deleteModalStudent.rollNo}</span>) below:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type name or USN exactly to confirm"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deletingStudent}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                icon={Trash2}
                disabled={!isDeleteConfirmed || deletingStudent}
                loading={deletingStudent}
                onClick={handleConfirmDelete}
              >
                {deletingStudent ? "Deleting..." : "Delete Student"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Bulk Delete Students Confirmation Modal */}
      <Modal
        isOpen={bulkDeleteModalOpen}
        onClose={() => setBulkDeleteModalOpen(false)}
        maxWidth="max-w-md"
        title={`Bulk Delete ${selectedStudentIds.length} Students`}
        subtitle="Destructive administrative operation"
      >
        <div className="space-y-4 text-xs text-slate-600">
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-rose-950">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Permanent Cascading Deletion</span>
            </div>
            <p className="text-xs text-rose-800 leading-relaxed">
              This permanently deletes all <strong>{selectedStudentIds.length}</strong> selected student accounts, their job applications, placement predictions, notifications, and uploaded files. This action cannot be undone.
            </p>
          </div>

          <div className="space-y-2 pt-1">
            <label className="block text-slate-700 font-semibold text-xs leading-relaxed">
              To confirm bulk deletion, type <span className="font-mono font-bold text-rose-700 select-all">DELETE</span> below:
            </label>
            <input
              type="text"
              value={bulkDeleteConfirmText}
              onChange={(e) => setBulkDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setBulkDeleteModalOpen(false)}
              disabled={deletingBulkStudents}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={bulkDeleteConfirmText.trim().toUpperCase() !== "DELETE" || deletingBulkStudents}
              loading={deletingBulkStudents}
              onClick={handleConfirmBulkDelete}
            >
              Permanently Delete {selectedStudentIds.length} Students
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
