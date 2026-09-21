import React, { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Shield,
  GraduationCap,
  Building2,
  Trash2,
  Edit2
} from "lucide-react";
import { adminService } from "../../services/adminService";
import { DataTable } from "../../components/common/DataTable";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { Modal } from "../../components/common/Modal";
import Avatar from "../../components/common/Avatar";
import { useNotifications } from "../../context/NotificationContext";

export function AdminUserManagementPage() {
  const { addToast } = useNotifications();
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  // Add User Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "student",
    department: "Computer Science & Engineering"
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await adminService.getUsers();
        setUsers(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const created = await adminService.createUser(newUser);
      setUsers((prev) => [created, ...prev]);
      setModalOpen(false);
      setNewUser({
        name: "",
        email: "",
        role: "student",
        department: "Computer Science & Engineering"
      });
      addToast(`User ${created.name} (${created.role}) created successfully!`, "success");
    } catch (e) {
      console.error(e);
      addToast("Failed to create user.", "error");
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const nextStatus = currentStatus === "Active" ? "Suspended" : "Active";
    try {
      const updated = await adminService.updateUserStatus(userId, nextStatus);
      setUsers(updated);
      addToast(`User status changed to ${nextStatus}`, "info");
    } catch (e) {
      console.error(e);
    }
  };

  const filteredUsers =
    roleFilter === "All" ? users : users.filter((u) => u.role === roleFilter);

  const columns = [
    {
      title: "Name & Avatar",
      key: "name",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar
            src={row.profileImageUrl || row.avatar}
            name={row.name}
            isCollege={row.role === "admin" || row.role === "placement"}
            size="sm"
            className="border border-slate-200 shrink-0"
          />
          <div>
            <p className="font-bold text-slate-900">{row.name}</p>
            <span className="text-[11px] text-slate-400">{row.email}</span>
          </div>
        </div>
      )
    },
    {
      title: "Role",
      key: "role",
      sortable: true,
      render: (row) => (
        <Badge
          variant={
            row.role === "admin"
              ? "danger"
              : row.role === "placement"
              ? "purple"
              : "primary"
          }
          size="sm"
        >
          {row.role === "admin"
            ? "Platform Admin"
            : row.role === "placement"
            ? "Placement Officer"
            : "Student"}
        </Badge>
      )
    },
    {
      title: "Department",
      key: "department",
      sortable: true,
      render: (row) => <span className="text-slate-600">{row.department}</span>
    },
    {
      title: "Status",
      key: "status",
      sortable: true,
      render: (row) => (
        <Badge
          variant={row.status === "Active" ? "success" : "danger"}
          size="sm"
        >
          {row.status}
        </Badge>
      )
    },
    {
      title: "Last Active",
      key: "lastActive",
      sortable: true,
      render: (row) => <span className="text-slate-500">{row.lastActive}</span>
    },
    {
      title: "Actions",
      key: "actions",
      className: "text-right",
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="xs"
            onClick={() => handleToggleStatus(row.id, row.status)}
          >
            {row.status === "Active" ? "Deactivate" : "Activate"}
          </Button>
        </div>
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
            User & Access Control Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage student records, placement officer roles, and system administrator access credentials.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => setModalOpen(true)}
        >
          Add New User
        </Button>
      </div>

      {/* Users DataTable */}
      <DataTable
        columns={columns}
        data={filteredUsers}
        searchPlaceholder="Search users by name, email, or department..."
        searchKey={(item, q) =>
          item.name.toLowerCase().includes(q) ||
          item.email.toLowerCase().includes(q) ||
          item.department.toLowerCase().includes(q)
        }
        filterComponent={
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700"
          >
            <option value="All">All Roles</option>
            <option value="student">Students</option>
            <option value="placement">Placement Officers</option>
            <option value="admin">Administrators</option>
          </select>
        }
      />

      {/* Add User Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Provision New SIPS User"
        subtitle="User will receive an institutional welcome email with activation credentials"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              placeholder="e.g. Aditi Rao"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Institutional Email
            </label>
            <input
              type="email"
              required
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              placeholder="e.g. aditi.rao@institution.edu"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Role Assignment
              </label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium"
              >
                <option value="student">Student</option>
                <option value="placement">Placement Officer</option>
                <option value="admin">Platform Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Department
              </label>
              <select
                value={newUser.department}
                onChange={(e) =>
                  setNewUser({ ...newUser, department: e.target.value })
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium"
              >
                <option value="Computer Science & Engineering">CSE</option>
                <option value="Information Technology">ISE</option>
                <option value="Artificial Intelligence & ML">AI/ML</option>
                <option value="Electronics & Communication">ECE</option>
                <option value="Placement Operations">Placement Cell</option>
                <option value="Institutional Administration">Administration</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create User
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
