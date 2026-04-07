import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../style/EmployeeHome.css";

const EmployeeHome = ({ getNotificationIcon, formatNotificationTime }) => {
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [summary, setSummary] = useState({
    totalDays: 0,
    present: 0,
    absent: 0,
    late: 0,
    halfDay: 0,
    todayStatus: "Not Marked",
    presentToday: false,
  });
  const [leaves, setLeaves] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [approvedLeaveCount, setApprovedLeaveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchEmployeeHomeData();
  }, []);

  const fetchEmployeeHomeData = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      const token = localStorage.getItem("token");

      const res = await axios.get("${import.meta.env.VITE_API_URL}/api/employee/home", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Employee Home API Response:", res.data);

      setEmployee(res.data?.employee || null);
      setSummary({
        totalDays: res.data?.summary?.totalDays || 0,
        present: res.data?.summary?.present || 0,
        absent: res.data?.summary?.absent || 0,
        late: res.data?.summary?.late || 0,
        halfDay: res.data?.summary?.halfDay || 0,
        todayStatus: res.data?.summary?.todayStatus || "Not Marked",
        presentToday: res.data?.summary?.presentToday || false,
      });
      setLeaves(res.data?.leaves || []);
      setNotifications(res.data?.notifications || []);
      setTasks(res.data?.tasks || []);
      setApprovedLeaveCount(res.data?.approvedLeaveCount || 0);
    } catch (error) {
      console.log("Error fetching employee home data:", error);
      setErrorMsg(
        error.response?.data?.message || "Failed to load employee home data"
      );
    } finally {
      setLoading(false);
    }
  };

  const latestLeaves = leaves.slice(0, 3);
  const latestNotifications = notifications.slice(0, 4);

  const pendingTasks = tasks.filter(
    (task) =>
      task.status === "Pending" ||
      task.status === "In Progress" ||
      task.status === "Overdue"
  );

  const todayAttendanceStatus =
    summary?.todayStatus || (summary?.presentToday ? "Present" : "Not Marked");

  const currentTime = new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  const statCards = [
    { label: "Total Days", value: summary?.totalDays || 0 },
    { label: "Present", value: summary?.present || 0 },
    { label: "Absent", value: summary?.absent || 0 },
    { label: "Approved Leaves", value: approvedLeaveCount || 0 },
    { label: "Late", value: summary?.late || 0 },
    { label: "Half Day", value: summary?.halfDay || 0 },
  ];

  if (loading) {
    return (
      <div className="employee-home-page">
        <div className="employee-home-card">
          <h3>Loading employee home...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="employee-home-page">
      {errorMsg && (
        <div className="employee-home-card" style={{ marginBottom: "20px" }}>
          <p style={{ color: "red", fontWeight: "600" }}>{errorMsg}</p>
        </div>
      )}

      <div className="employee-home-grid">
        {/* Today's Status */}
        <div className="employee-home-card hero-status-card">
          <div className="card-header">
            <h3>Today’s Status</h3>
          </div>

          <div className="hero-status-content">
            <div className="hero-status-left">
              <div className="status-time-box">
                <span>Current Time</span>
                <h2>{currentTime}</h2>
              </div>

              <div className="status-time-box">
                <span>Attendance Status</span>
                <h2>{todayAttendanceStatus}</h2>
              </div>
            </div>

            <div className="hero-status-right">
              <span
                className={`status-badge-large ${
                  todayAttendanceStatus === "Present"
                    ? "present"
                    : todayAttendanceStatus === "Absent"
                    ? "absent"
                    : "progress"
                }`}
              >
                {todayAttendanceStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Payroll Summary */}
        <div className="employee-home-card payroll-summary-card">
          <div className="card-header">
            <h3>Payroll Summary</h3>
          </div>

          <div className="payroll-summary-content">
            <p className="payroll-label">Current Salary</p>
            <h1>
              ₹ {employee?.salary ? Number(employee.salary).toLocaleString() : 0}
            </h1>

            <div className="payroll-buttons">
              <button
                className="action-btn blue"
                onClick={() => navigate("/employee-dashboard/view-payslip")}
              >
                View Payslip
              </button>
              <button
                className="action-btn purple"
                onClick={() => navigate("/employee-dashboard/payroll-history")}
              >
                Payroll History
              </button>
            </div>
          </div>
        </div>

        {/* Attendance Stats */}
        <div className="employee-home-card full-width-card">
          <div className="card-header">
            <h3>Attendance Summary</h3>
          </div>

          <div className="attendance-summary-stats professional-stats">
            {statCards.map((item, index) => (
              <div className="attendance-stat-box" key={index}>
                <p>{item.label}</p>
                <h2>{item.value}</h2>
              </div>
            ))}
          </div>
        </div>

        {/* Leave Requests */}
        <div className="employee-home-card">
          <div className="card-header">
            <h3>Recent Leave Requests</h3>
          </div>

          <div className="mini-table">
            <div className="mini-table-header three-cols">
              <span>Date</span>
              <span>Type</span>
              <span>Status</span>
            </div>

            {latestLeaves.length > 0 ? (
              latestLeaves.map((leave) => (
                <div className="mini-table-row three-cols" key={leave._id}>
                  <span>
                    {new Date(leave.fromDate).toLocaleDateString("en-GB")} -{" "}
                    {new Date(leave.toDate).toLocaleDateString("en-GB")}
                  </span>
                  <span>{leave.leaveType}</span>
                  <span>
                    <span
                      className={`status-pill ${
                        leave.status === "Approved"
                          ? "approved"
                          : leave.status === "Rejected"
                          ? "rejected"
                          : "pending"
                      }`}
                    >
                      {leave.status}
                    </span>
                  </span>
                </div>
              ))
            ) : (
              <p className="empty-text">No leave records</p>
            )}
          </div>
        </div>

        {/* Leave Reasons */}
        <div className="employee-home-card">
          <div className="card-header">
            <h3>Leave Reasons</h3>
          </div>

          <div className="mini-table">
            <div className="mini-table-header two-cols">
              <span>Reason</span>
              <span>Status</span>
            </div>

            {latestLeaves.length > 0 ? (
              latestLeaves.map((leave) => (
                <div className="mini-table-row two-cols" key={leave._id}>
                  <span className="reason-text">{leave.reason || "No reason"}</span>
                  <span>
                    <span
                      className={`status-pill ${
                        leave.status === "Approved"
                          ? "approved"
                          : leave.status === "Rejected"
                          ? "rejected"
                          : "pending"
                      }`}
                    >
                      {leave.status}
                    </span>
                  </span>
                </div>
              ))
            ) : (
              <p className="empty-text">No leave records</p>
            )}
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="employee-home-card">
          <div className="card-header">
            <h3>Pending Tasks</h3>
          </div>

          <div className="task-list">
            {pendingTasks.length > 0 ? (
              pendingTasks.slice(0, 4).map((task) => (
                <div className="task-item" key={task._id}>
                  <div className="task-icon">📌</div>
                  <div className="task-info">
                    <h4>{task.title}</h4>
                    <p>
                      {task.deadline
                        ? new Date(task.deadline).toLocaleDateString("en-GB")
                        : "No deadline"}
                    </p>
                  </div>
                  <span className="task-status">{task.status}</span>
                </div>
              ))
            ) : (
              <p className="empty-text">No pending tasks</p>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="employee-home-card">
          <div className="card-header">
            <h3>Recent Notifications</h3>
          </div>

          <div className="notification-list-home">
            {latestNotifications.length > 0 ? (
              latestNotifications.map((item) => (
                <div className="notification-item-home" key={item._id}>
                  <div className="notification-left">
                    <div className="notification-icon-box">
                      {getNotificationIcon ? getNotificationIcon(item.type) : "🔔"}
                    </div>
                    <div className="notification-text">
                      <h4>{item.title}</h4>
                      <p>{item.message}</p>
                    </div>
                  </div>
                  <span className="notification-time">
                    {formatNotificationTime
                      ? formatNotificationTime(item.createdAt)
                      : ""}
                  </span>
                </div>
              ))
            ) : (
              <p className="empty-text">No notifications available</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="employee-home-card full-width-card">
          <div className="card-header">
            <h3>Quick Actions</h3>
          </div>

          <div className="quick-buttons-row">
            <button
              className="quick-btn green"
              onClick={() => navigate("/employee-dashboard/apply-leave")}
            >
              Apply Leave
            </button>

            <button
              className="quick-btn blue"
              onClick={() => navigate("/employee-dashboard/attendance")}
            >
              Mark Attendance
            </button>

            <button
              className="quick-btn purple"
              onClick={() => navigate("/employee-dashboard/attendance-request")}
            >
              Attendance Request
            </button>

            <button
              className="quick-btn orange"
              onClick={() => navigate("/employee-dashboard/payroll-history")}
            >
              Payroll History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeHome;