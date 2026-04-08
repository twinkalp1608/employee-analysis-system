import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import axios from "axios";

import "../style/Dashboard.css";
import EmployeeList from "../components/admin/EmployeeList";
import HRList from "../components/admin/HRList";
import Department from "../components/admin/Department";
import Attendance from "../components/admin/Attendance";
import AttendanceList from "../components/admin/AttendanceList";
import MarkAttendance from "../components/admin/MarkAttendance";
import AddDesignation from "../components/admin/AddDesignation";
import AttendanceRequests from "../components/admin/AttendanceRequest.jsx";
import AttendanceReport from "../components/admin/AttendanceReport.jsx";
import AdminLeave from "../components/admin/AdminLeave";
import AdminPayroll from "../components/admin/AdminPayroll";
import PayrollList from "../components/admin/PayrollList.jsx";
import AdminHome from "../components/admin/AdminHome.jsx";
import Task from "../components/admin/Task";
import Performance from "../components/admin/Performance";
import LiveLocation from "../components/admin/LiveLocation.jsx";
import EngagementManagement from "../components/admin/EngagementManagement";
// Recruitment imports
import AdminRecruitmentDashboard from "../components/admin/AdminRecruitmentDashboard";
import AdminJobApproval from "../components/admin/AdminJobApproval";
import AdminSavedReports from "../components/admin/AdminSavedReports.jsx";

const Dashboard = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [showDropdown, setShowDropdown] = useState(false);
  const [userName, setUserName] = useState("U");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const navigate = useNavigate();
  const location = useLocation(); // URL check for active menu

  const getPageTitle = () => {
    switch (location.pathname) {
      case "/dashboard":
        return "🏠 Admin Dashboard";

      case "/dashboard/employee":
        return "🧑‍💼Employee Management";

      case "/dashboard/hr":
        return "👩‍💼 Manage HR";

      case "/dashboard/organization/department":
        return "🏢 Department Management";

      case "/dashboard/organization/designation":
        return "💼 Designation Management";

      case "/dashboard/attendance":
      case "/dashboard/attendance/list":
        return "📅 Attendance List";

      case "/dashboard/attendance/add":
        return "✅ Mark Attendance";

      case "/dashboard/attendance/report":
        return "📄 Attendance Report";

      case "/dashboard/attendance/requests":
        return "📩 Attendance Requests";

      case "/dashboard/attendance/live-locations":
        return "📍 Live Location Tracking";

      case "/dashboard/leave":
        return "📝 Leave Management";

      case "/dashboard/task":
        return "📋 Task Management";

      case "/dashboard/engagement":
        return "💬 Employee Engagement";

      case "/dashboard/performance":
        return "📊 Performance Management";

      case "/dashboard/payroll":
        return role === "hr" ? "💵 Payroll Creation" : "💵 Payroll List";

      case "/dashboard/payroll/list":
        return "💵 Payroll List";

      case "/dashboard/recruitment":
        return "📌 Recruitment Dashboard";

      case "/dashboard/recruitment/job-approval":
        return "✅ Job Approval";

      case "/dashboard/report":
        return "📊 Reports";

      default:
        return "HR Management System";
    }
  };

  const userData = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // Fetch first letter of username
  useEffect(() => {
    if (userData.email) {
      setUserName(userData.email.charAt(0).toUpperCase());
    }
  }, [userData]);

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Close profile dropdown when clicked outside
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
  const [openMenu, setOpenMenu] = useState(null);

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const menuItems = [
    { name: "Home", icon: "🏠", path: "" },
    { name: "Employee", icon: "🧑‍💼", path: "employee" },
    { name: "HR", icon: "👩‍💼", path: "hr" },
    { name: "Attendance", icon: "📅", path: "attendance" },
    { name: "Leave", icon: "📝", path: "leave" },
    { name: "Payroll", icon: "💵", path: "payroll" },
    { name: "Report", icon: "📊", path: "report" },
    { name: "department", icon: "🏢", path: "department" },
  ];

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/notifications/${role}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setNotifications(res.data);
    } catch (err) {
      console.error("Error fetching notifications:", err);
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
          `http://localhost:5000/api/notifications/read-all/${role}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        fetchNotifications();
      } catch (err) {
        console.error("Error marking notifications as read:", err);
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
      default:
        return "🔔";
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="dashboard">
      {/* Sidebar */}
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

        {/* Menu Items */}
        <ul className="sidebar-menu">
          <li className={location.pathname === "/dashboard" ? "active" : ""}>
            <span className="menu-icon">🏠</span>
            {!isCollapsed && (
              <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                Home
              </Link>
            )}
          </li>

          <li
            className={
              location.pathname === "/dashboard/employee" ? "active" : ""
            }
          >
            <span className="menu-icon">🧑‍💼</span>
            {!isCollapsed && (
              <Link
                to="/dashboard/employee"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Employee
              </Link>
            )}
          </li>

          {role === "admin" && (
            <li
              className={location.pathname === "/dashboard/hr" ? "active" : ""}
            >
              <span className="menu-icon">👩‍💼</span>
              {!isCollapsed && (
                <Link
                  to="/dashboard/hr"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  HR
                </Link>
              )}
            </li>
          )}

          <li
            onClick={() => toggleMenu("organization")}
            className="dropdown-menu"
          >
            <span className="menu-icon">🏢</span>
            {!isCollapsed && <span>Organization ▾</span>}
          </li>

          {openMenu === "organization" && !isCollapsed && (
            <ul className="submenu">
              <li>
                <Link
                  to="/dashboard/organization/department"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Add Department
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard/organization/designation"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Add Designation
                </Link>
              </li>
            </ul>
          )}

          <li
            onClick={() => toggleMenu("attendance")}
            className="dropdown-menu"
          >
            <span className="menu-icon">📅</span>
            {!isCollapsed && <span>Attendance ▾</span>}
          </li>

          {openMenu === "attendance" && !isCollapsed && (
            <ul className="submenu">
              <li>
                <Link
                  to="/dashboard/attendance/list"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Attendance List
                </Link>
              </li>
              <li>
                <Link to="/dashboard/attendance/add">Add Attendance</Link>
              </li>
              <li>
                <Link
                  to="/dashboard/attendance/report"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Attendance Report
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard/attendance/requests"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Attendance Requests
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard/attendance/live-locations"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Live Locations
                </Link>
              </li>
            </ul>
          )}

          <li
            className={location.pathname === "/dashboard/leave" ? "active" : ""}
          >
            <span className="menu-icon">📝</span>
            {!isCollapsed && (
              <Link
                to="/dashboard/leave"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Leave
              </Link>
            )}
          </li>

          <li
            className={location.pathname === "/dashboard/task" ? "active" : ""}
          >
            <span className="menu-icon">📋</span>
            {!isCollapsed && (
              <Link
                to="/dashboard/task"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Task
              </Link>
            )}
          </li>

          <li
            className={
              location.pathname === "/dashboard/engagement" ? "active" : ""
            }
          >
            <span className="menu-icon">💬</span>
            {!isCollapsed && (
              <Link
                to="/dashboard/engagement"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Engagement
              </Link>
            )}
          </li>

          <li
            className={
              location.pathname === "/dashboard/performance" ? "active" : ""
            }
          >
            <span className="menu-icon">⭐</span>
            {!isCollapsed && (
              <Link
                to="/dashboard/performance"
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
              {role === "hr" && (
                <li>
                  <Link
                    to="/dashboard/payroll"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Create Payroll
                  </Link>
                </li>
              )}

              <li>
                <Link
                  to="/dashboard/payroll/list"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Payroll List
                </Link>
              </li>
            </ul>
          )}

          {/* Recruitment Menu */}
          <li
            onClick={() => toggleMenu("recruitment")}
            className="dropdown-menu"
          >
            <span className="menu-icon">📌</span>
            {!isCollapsed && <span>Recruitment ▾</span>}
          </li>

          {openMenu === "recruitment" && !isCollapsed && (
            <ul className="submenu">
              <li>
                <Link
                  to="/dashboard/recruitment"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Recruitment Dashboard
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard/recruitment/job-approval"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Job Approval
                </Link>
              </li>
            </ul>
          )}

          <li
            className={
              location.pathname === "/dashboard/report" ? "active" : ""
            }
          >
            <span className="menu-icon">📊</span>
            {!isCollapsed && (
              <Link
                to="/dashboard/report"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Report
              </Link>
            )}
          </li>
        </ul>

        {/* Logout Button */}
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

      {/* Main Content Wrapper */}
      <div className="main-content-wrapper">
        {/* Header */}
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
            <div
              className="notification-wrapper"
              onClick={handleNotificationClick}
            >
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
                          <small>
                            {new Date(item.createdAt).toLocaleString()}
                          </small>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="notification-item">
                      No notifications available
                    </div>
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

        {/* Main Content */}
        <div className="main-content">
          <div className="content-area">
            <Routes>
              <Route path="" element={<AdminHome />} />
              <Route path="employee" element={<EmployeeList />} />
              {role === "admin" && (
                <Route path="hr" element={<HRList token={token} />} />
              )}
              <Route path="attendance" element={<Attendance />}>
                <Route index element={<AttendanceList />} />
                <Route path="add" element={<MarkAttendance />} />
                <Route path="list" element={<AttendanceList />} />
                <Route path="report" element={<AttendanceReport />} />
                <Route path="requests" element={<AttendanceRequests />} />
                <Route path="live-locations" element={<LiveLocation />} />
              </Route>
              <Route path="leave" element={<AdminLeave />} />
              <Route path="payroll">
                {role === "hr" && <Route index element={<AdminPayroll />} />}
                <Route path="list" element={<PayrollList />} />
              </Route>

{/* Recruitment Routes */}
              <Route
                path="recruitment"
                element={<AdminRecruitmentDashboard />}
              />
              <Route
                path="recruitment/job-approval"
                element={<AdminJobApproval />}
              />
              
              <Route
                path="report"
                element={<AdminSavedReports />} />
              
              <Route path="organization">
                <Route path="department" element={<Department />} />
                <Route path="designation" element={<AddDesignation />} />
              </Route>
              <Route path="engagement" element={<EngagementManagement />} />
              <Route path="performance" element={<Performance />} />
              <Route path="task" element={<Task />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
