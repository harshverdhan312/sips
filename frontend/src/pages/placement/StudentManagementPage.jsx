import React, { useState, useEffect } from "react";
import {
  Users,
  Download,
  Eye
} from "lucide-react";
import { placementService } from "../../services/placementService";
import { DataTable } from "../../components/common/DataTable";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";
import { useNotifications } from "../../context/NotificationContext";

export function StudentManagementPage() {
  const { addToast } = useNotifications();
  const [students, setStudents] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Selected student modal
  const [activeStudent, setActiveStudent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await placementService.getStudents({
          branch: selectedBranch,
          status: selectedStatus
        });
        setStudents(data);
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, [selectedBranch, selectedStatus]);

  const handleExportCsv = () => {
    addToast("Exporting 480 Student Placement Readiness records to CSV...", "info");
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
          <img
            src={row.avatar}
            alt={row.name}
            className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
          />
          <div>
            <p className="font-bold text-slate-900">{row.name}</p>
            <span className="text-[11px] text-slate-400 font-mono">{row.usn}</span>
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
          {row.metrics.technicalScore}/100
        </span>
      )
    },
    {
      title: "Soft Skill",
      key: "metrics.softSkillScore",
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-purple-600">
          {row.metrics.softSkillScore}/100
        </span>
      )
    },
    {
      title: "Employability",
      key: "metrics.employabilityIndex",
      sortable: true,
      render: (row) => (
        <span className="font-bold text-slate-900">
          {row.metrics.employabilityIndex}/100
        </span>
      )
    },
    {
      title: "Placement Prob.",
      key: "metrics.placementProbability",
      sortable: true,
      render: (row) => (
        <span className="font-extrabold text-emerald-600">
          {row.metrics.placementProbability}%
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

        <Button variant="secondary" size="sm" icon={Download} onClick={handleExportCsv}>
          Export Roster (CSV)
        </Button>
      </div>

      {/* Filter Bar and DataTable */}
      <DataTable
        columns={columns}
        data={students}
        searchPlaceholder="Search candidate by name, USN, or branch..."
        searchKey={(item, q) =>
          item.name.toLowerCase().includes(q) ||
          item.usn.toLowerCase().includes(q) ||
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
              <option value="Computer Science">CSE</option>
              <option value="Information">ISE</option>
              <option value="Artificial Intelligence">AI/ML</option>
              <option value="Electronics">ECE</option>
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
        subtitle={activeStudent ? `${activeStudent.name} (${activeStudent.usn})` : ""}
      >
        {activeStudent && (
          <div className="space-y-6">
            {/* Header snippet */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <img
                src={activeStudent.avatar}
                alt={activeStudent.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-xs"
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
                  {activeStudent.metrics.employabilityIndex}/100
                </h4>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <p className="text-[10px] font-bold text-emerald-900 uppercase">
                  Placement Prob.
                </p>
                <h4 className="text-2xl font-black text-emerald-700 mt-1">
                  {activeStudent.metrics.placementProbability}%
                </h4>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                <p className="text-[10px] font-bold text-blue-900 uppercase">
                  Technical Score
                </p>
                <h4 className="text-2xl font-black text-blue-700 mt-1">
                  {activeStudent.metrics.technicalScore}
                </h4>
              </div>

              <div className="p-3 rounded-xl bg-purple-50 border border-purple-100">
                <p className="text-[10px] font-bold text-purple-900 uppercase">
                  Soft Skill Index
                </p>
                <h4 className="text-2xl font-black text-purple-700 mt-1">
                  {activeStudent.metrics.softSkillScore}
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
    </div>
  );
}
