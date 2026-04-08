import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import "../style/Dashboard.css";
import axios from "axios";
import EmployeeList from "../components/admin/EmployeeList";
// import HRList from "../components/admin/HRList";
import Department from "../components/admin/Department";
import Attendance from "../components/admin/Attendance";
import AttendanceList from "../components/admin/AttendanceList";
// import MarkAttendance from "../components/admin/MarkAttendance";
import AttendanceRequests from "../components/admin/AttendanceRequest.jsx";
import AttendanceReport from "../components/admin/AttendanceReport.jsx";
import AddDesignation from "../components/admin/AddDesignation";
import AdminLeave from "../components/admin/AdminLeave";
import AdminPayroll from "../components/admin/AdminPayroll";
import PayrollList from "../components/admin/PayrollList.jsx";
import HrHome from "../components/admin/HrHome.jsx";
import Task from "../components/admin/Task";
import Performance from "../components/admin/Performance.jsx";
import EngagementManagement from "../components/admin/EngagementManagement";

// Recruitment imports
import HRRecruitmentDashboard from "../components/admin/HRRecruitmentDashboard";
import CreateJob from "../components/admin/CreateJob";
import ManageJobs from "../components/admin/ManageJobs";
import CandidateList from "../components/admin/CandidateList";
import Report from "../components/admin/Report.jsx";

const HrDashboard = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [userName, setUserName] = useState("U");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [openMenu, setOpenMenu] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const getPageTitle = () => {
    switch (location.pathname) {
      case "/hrdashboard":
        return "🏠 HR Dashboard";

      case "/hrdashboard/employee":
        return "🧑‍💼 Employee Management";

      case "/hrdashboard/organization/department":
        return "🏢 Department Management";

      case "/hrdashboard/organization/designation":
        return "💼 Designation Management";

      case "/hrdashboard/attendance":
      case "/hrdashboard/attendance/list":
        return "📅 Attendance List";

      case "/hrdashboard/attendance/add":
        return "✅ Mark Attendance";

      case "/hrdashboard/attendance/report":
        return "📄 Attendance Report";

      case "/hrdashboard/attendance/requests":
        return "📩 Attendance Requests";

      case "/hrdashboard/leave":
        return "📝 Leave Management";

      case "/hrdashboard/task":
        return "📋 Task Management";

      case "/hrdashboard/engagement":
        return "💬 Employee Engagement";

      case "/hrdashboard/performance":
        return "📊 Performance Management";

      case "/hrdashboard/payroll":
        return "💵 Payroll Creation";

      case "/hrdashboard/payroll/list":
        return "💵 Payroll List";

      case "/hrdashboard/recruitment":
        return "📌 Recruitment Dashboard";

      case "/hrdashboard/recruitment/create-job":
        return "➕ Create Job";

      case "/hrdashboard/recruitment/manage-jobs":
        return "📋 Manage Jobs";

      case "/hrdashboard/recruitment/candidates":
        return "👨‍💼 Candidate List";

      case "/hrdashboard/report":
        return "📊 Reports";

      default:
        return "HR Management System";
    }
  };

  useEffect(() => {
    if (userData.email) {
      setUserName(userData.email.charAt(0).toUpperCase());
    }
  }, [userData]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".profile-section")) {
        setShowDropdown(false);
      }

      if (!event.target.closest(".notification-wrapper")) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const fetchNotifications = async () => {
    try {
      const res = await axios.get("https://employee-analysis-system-1.onrender.com/api/notifications/hr", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNotifications(res.data);
    } catch (err) {
      console.error("Error fetching HR notifications:", err);
    }
  };

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  const handleNotificationClick = async (e) => {
    e.stopPropagation();

    const isOpening = !showNotifications;
    setShowNotifications(isOpening);

    if (isOpening) {
      try {
        await axios.put(
          "https://employee-analysis-system-1.onrender.com/api/notifications/read-all/hr",
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        fetchNotifications();
      } catch (err) {
        console.error("Error marking HR notifications as read:", err);
      }
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "leave":
        return "📝";
      case "employee":
        return "👤";
      case "payroll":
        return "💰";
      case "attendance":
        return "📅";
      case "department":
        return "🏢";
      case "designation":
        return "💼";
      case "task":
        return "📋";
      case "performance":
        return "⭐";
      default:
        return "🔔";
    }
  };

  const formatNotificationTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();

    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    const isToday = date.toDateString() === now.toDateString();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    if (diffHours < 24 && isToday) {
      return `Today, ${date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })}`;
    }
    if (isYesterday) return "Yesterday";

    return date.toLocaleDateString([], {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="dashboard">
      <div
        className={`sidebar ${isCollapsed ? "collapsed" : ""} ${
          isMobileMenuOpen ? "active" : ""
        }`}
      >
        <div className="sidebar-logo">
          <div className="logo"></div>
          {!isCollapsed && <span className="logo-text">TechnoGuide</span>}
        </div>

        <div
          className="collapse-btn"
          onClick={() => {
            if (window.innerWidth <= 768) {
              setIsMobileMenuOpen(!isMobileMenuOpen);
            } else {
              setIsCollapsed(!isCollapsed);
            }
          }}
        >
          ☰
        </div>

        <ul className="sidebar-menu">
          <li className={location.pathname === "/hrdashboard" ? "active" : ""}>
            <span className="menu-icon">🏠</span>
            {!isCollapsed && (
              <Link to="/hrdashboard" onClick={() => setIsMobileMenuOpen(false)}>
                Home
              </Link>
            )}
          </li>

          <li
            className={location.pathname === "/hrdashboard/employee" ? "active" : ""}
          >
            <span className="menu-icon">🧑‍💼</span>
            {!isCollapsed && (
              <Link
                to="/hrdashboard/employee"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Employee
              </Link>
            )}
          </li>

          <li onClick={() => toggleMenu("organization")} className="dropdown-menu">
            <span className="menu-icon">🏢</span>
            {!isCollapsed && <span>Organization ▾</span>}
          </li>

          {openMenu === "organization" && !isCollapsed && (
            <ul className="submenu">
              <li>
                <Link
                  to="/hrdashboard/organization/department"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Add Department
                </Link>
              </li>
              <li>
                <Link
                  to="/hrdashboard/organization/designation"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Add Designation
                </Link>
              </li>
            </ul>
          )}

          <li onClick={() => toggleMenu("attendance")} className="dropdown-menu">
            <span className="menu-icon">📅</span>
            {!isCollapsed && <span>Attendance ▾</span>}
          </li>

          {openMenu === "attendance" && !isCollapsed && (
            <ul className="submenu">
              <li>
                <Link
                  to="/hrdashboard/attendance/list"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Attendance List
                </Link>
              </li>

              <li>
                <Link
                  to="/hrdashboard/attendance/report"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Attendance Report
                </Link>
              </li>

              <li>
                <Link
                  to="/hrdashboard/attendance/requests"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Attendance Requests
                </Link>
              </li>
            </ul>
          )}

          <li className={location.pathname === "/hrdashboard/leave" ? "active" : ""}>
            <span className="menu-icon">📝</span>
            {!isCollapsed && (
              <Link to="/hrdashboard/leave" onClick={() => setIsMobileMenuOpen(false)}>
                Leave
              </Link>
            )}
          </li>

          <li className={location.pathname === "/hrdashboard/task" ? "active" : ""}>
            <span className="menu-icon">📋</span>
            {!isCollapsed && (
              <Link to="/hrdashboard/task" onClick={() => setIsMobileMenuOpen(false)}>
                Task
              </Link>
            )}
          </li>

          <li
            className={location.pathname === "/hrdashboard/engagement" ? "active" : ""}
          >
            <span className="menu-icon">💬</span>
            {!isCollapsed && (
              <Link
                to="/hrdashboard/engagement"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Engagement
              </Link>
            )}
          </li>

          <li
            className={location.pathname === "/hrdashboard/performance" ? "active" : ""}
          >
            <span className="menu-icon">⭐</span>
            {!isCollapsed && (
              <Link
                to="/hrdashboard/performance"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Performance
              </Link>
            )}
          </li>

          <li onClick={() => toggleMenu("payroll")} className="dropdown-menu">
            <span className="menu-icon">💵</span>
            {!isCollapsed && <span>Payroll ▾</span>}
          </li>

          {openMenu === "payroll" && !isCollapsed && (
            <ul className="submenu">
              <li>
                <Link
                  to="/hrdashboard/payroll"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Create Payroll
                </Link>
              </li>
              <li>
                <Link
                  to="/hrdashboard/payroll/list"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Payroll List
                </Link>
              </li>
            </ul>
          )}

          <li onClick={() => toggleMenu("recruitment")} className="dropdown-menu">
            <span className="menu-icon">📌</span>
            {!isCollapsed && <span>Recruitment ▾</span>}
          </li>

          {openMenu === "recruitment" && !isCollapsed && (
            <ul className="submenu">
              <li>
                <Link
                  to="/hrdashboard/recruitment"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Recruitment Dashboard
                </Link>
              </li>
              <li>
                <Link
                  to="/hrdashboard/recruitment/create-job"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Create Job
                </Link>
              </li>
              <li>
                <Link
                  to="/hrdashboard/recruitment/manage-jobs"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Manage Jobs
                </Link>
              </li>
              <li>
                <Link
                  to="/hrdashboard/recruitment/candidates"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Candidates
                </Link>
              </li>
            </ul>
          )}

          <li className={location.pathname === "/hrdashboard/report" ? "active" : ""}>
            <span className="menu-icon">📊</span>
            {!isCollapsed && (
              <Link to="/hrdashboard/report" onClick={() => setIsMobileMenuOpen(false)}>
                Report
              </Link>
            )}
          </li>
        </ul>

        {!isCollapsed ? (
          <button className="logout-btn" onClick={logout}>
            🚪 Logout
          </button>
        ) : (
          <button className="logout-btn-icon" onClick={logout} title="Logout">
            🚪
          </button>
        )}
      </div>

      <div className="main-content-wrapper">
        <div className="header">
          <div className="header-left">
            <div className="fancy-page-header">
              <div className="fancy-title-content">
                <span className="title-badge"></span>
                <h1>{getPageTitle()}</h1>
              </div>
            </div>
          </div>

          <div className="header-right">
            <div className="notification-wrapper" onClick={handleNotificationClick}>
              <div className="notification-icon" title="Notifications">
                🔔
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </div>

              {showNotifications && (
                <div className="notification-dropdown">
                  <div className="notification-header">Notifications</div>

                  {notifications.length > 0 ? (
                    notifications.map((item) => (
                      <div
                        key={item._id}
                        className={`notification-item ${item.isRead ? "read" : "unread"}`}
                      >
                        <div className="notification-content">
                          <div className="notification-top">
                            <span className="notif-icon">
                              {getNotificationIcon(item.type)}
                            </span>
                            <strong>{item.title}</strong>
                          </div>
                          <p>{item.message}</p>
                          <small>{formatNotificationTime(item.createdAt)}</small>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="notification-item">No notifications available</div>
                  )}
                </div>
              )}
            </div>

            <div
              className="profile-section"
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(!showDropdown);
              }}
            >
              <div className="user-avatar">{userName}</div>
              <div className="user-name">{userData.email}</div>

              {showDropdown && (
                <div className="profile-dropdown">
                  <p className="email">{userData.email}</p>
                  <hr />
                  <p onClick={logout} className="logout">
                    Logout
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="main-content">
          <div className="content-area">
            <Routes>
              <Route path="" element={<HrHome />} />
              <Route path="employee" element={<EmployeeList />} />

              <Route path="attendance" element={<Attendance />}>
                <Route index element={<AttendanceList />} />
                <Route path="list" element={<AttendanceList />} />
                <Route path="report" element={<AttendanceReport />} />
                <Route path="requests" element={<AttendanceRequests />} />
              </Route>

              <Route path="leave" element={<AdminLeave />} />
              <Route path="task" element={<Task />} />

              <Route path="payroll">
                <Route index element={<AdminPayroll />} />
                <Route path="list" element={<PayrollList />} />
              </Route>

              <Route path="recruitment" element={<HRRecruitmentDashboard />} />
              <Route path="recruitment/create-job" element={<CreateJob />} />
              <Route path="recruitment/manage-jobs" element={<ManageJobs />} />
              <Route path="recruitment/candidates" element={<CandidateList />} />

              <Route path="report" element={<Report />} />

              <Route path="organization">
                <Route path="department" element={<Department />} />
                <Route path="designation" element={<AddDesignation />} />
              </Route>

              <Route path="performance" element={<Performance />} />
              <Route path="engagement" element={<EngagementManagement />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HrDashboard;