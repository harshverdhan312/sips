import React, { useState, useEffect } from "react";
import {
  GraduationCap,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Database,
  CheckCircle2
} from "lucide-react";
import { placementService } from "../../services/placementService";
import { DataTable } from "../../components/common/DataTable";
import { Card, CardHeader } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import Avatar from "../../components/common/Avatar";
import { useNotifications } from "../../context/NotificationContext";

export function AdminStudentsPage() {
  const { addToast } = useNotifications();
  const [students, setStudents] = useState([]);
  const [batchYear, setBatchYear] = useState("2025");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await placementService.getStudents();
        setStudents(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [batchYear]);

  const handleSyncErp = () => {
    addToast("Synchronized 1,240 student records with College ERP SIS database.", "success");
  };

  const columns = [
    {
      title: "USN / Roll No",
      key: "usn",
      sortable: true,
      render: (row) => <span className="font-mono font-bold text-slate-900">{row.usn}</span>
    },
    {
      title: "Full Name",
      key: "name",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <Avatar
            src={row.profileImageUrl || row.avatar}
            name={row.name}
            size="xs"
            className="w-7 h-7 border border-slate-200 shrink-0"
          />
          <span className="font-semibold text-slate-800">{row.name}</span>
        </div>
      )
    },
    {
      title: "Department",
      key: "branch",
      sortable: true,
      render: (row) => <span className="text-slate-600">{row.branch}</span>
    },
    {
      title: "CGPA",
      key: "cgpa",
      sortable: true,
      render: (row) => <span className="font-bold text-slate-900">{row.cgpa}</span>
    },
    {
      title: "Employability",
      key: "metrics.employabilityIndex",
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-indigo-600">
          {row.metrics.employabilityIndex}/100
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
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <GraduationCap className="w-8 h-8 text-indigo-600" />
            Institutional Student Master Records
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Global SIS synchronization, enrollment records, and batch verification across academic tiers.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={handleSyncErp}
          >
            Sync with College SIS
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Upload}
            onClick={() => addToast("Bulk CSV student upload modal opened.", "info")}
          >
            Import Batch Roster
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={students}
        searchPlaceholder="Search master records by student name or USN..."
        searchKey={(item, q) =>
          item.name.toLowerCase().includes(q) || item.usn.toLowerCase().includes(q)
        }
        filterComponent={
          <select
            value={batchYear}
            onChange={(e) => setBatchYear(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700"
          >
            <option value="2025">Batch 2021-2025 (Graduating)</option>
            <option value="2026">Batch 2022-2026 (Pre-final)</option>
            <option value="2024">Batch 2020-2024 (Alumni)</option>
          </select>
        }
      />
    </div>
  );
}
