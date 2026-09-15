import { mockUsers } from "../data/mockUsers";
import { mockStudentsList } from "../data/mockStudents";

export const adminService = {
  async getSystemStats() {
    await new Promise((res) => setTimeout(res, 200));
    return {
      totalUsers: 1460,
      activeToday: 412,
      studentsEnrolled: 1240,
      placementOfficers: 18,
      administrators: 4,
      resumesParsedTotal: 2840,
      mockInterviewsCompleted: 3420,
      systemHealth: "Optimal (99.98% Uptime)",
      apiLatency: "48ms",
      storageUsage: "18.4 GB / 100 GB"
    };
  },

  async getUsers() {
    await new Promise((res) => setTimeout(res, 200));
    const saved = localStorage.getItem("sips_admin_users");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return mockUsers;
  },

  async createUser(userData) {
    await new Promise((res) => setTimeout(res, 350));
    const users = await this.getUsers();
    const newUser = {
      id: "usr_" + Date.now(),
      name: userData.name,
      email: userData.email,
      role: userData.role || "student",
      department: userData.department || "Computer Science & Engineering",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      status: "Active",
      lastActive: "Just created",
      title: userData.title || "User"
    };
    const updated = [newUser, ...users];
    localStorage.setItem("sips_admin_users", JSON.stringify(updated));
    return newUser;
  },

  async updateUserStatus(userId, newStatus) {
    await new Promise((res) => setTimeout(res, 200));
    const users = await this.getUsers();
    const updated = users.map((u) => (u.id === userId ? { ...u, status: newStatus } : u));
    localStorage.setItem("sips_admin_users", JSON.stringify(updated));
    return updated;
  },

  async getAuditLogs() {
    await new Promise((res) => setTimeout(res, 150));
    return [
      { id: "log_1", action: "User Role Updated", actor: "Prof. Rajesh Nair", target: "rahul.v@sips.demo", timestamp: "12 mins ago" },
      { id: "log_2", action: "New Job Drive Created", actor: "Dr. Arvind Varma", target: "Google Early Career 2025", timestamp: "45 mins ago" },
      { id: "log_3", action: "Bulk Student Import", actor: "Meera Sen", target: "80 Records (Batch 2025 CSE)", timestamp: "2 hours ago" },
      { id: "log_4", action: "System Backup Completed", actor: "Automated Routine", target: "PostgreSQL & Vector Indexes", timestamp: "4 hours ago" },
      { id: "log_5", action: "Permission Override", actor: "Prof. Rajesh Nair", target: "Placement Cell Superuser", timestamp: "Yesterday" }
    ];
  }
};
