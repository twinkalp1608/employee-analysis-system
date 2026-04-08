import React, { useEffect, useState } from "react";
import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "../style/EmployeeDashboard.css";

import EmployeeHome from "../components/Employees/EmployeeHome";
import EmployeeProfile from "../components/Employees/EmployeeProfile";
import EmployeeApplyLeave from "../components/Employees/EmployeeApplyLeave";
import EmployeeMarkAttendance from "../components/Employees/EmployeeMarkAttendance";
import EmployeeAttendanceRequest from "../components/Employees/EmployeeAttendanceRequest";
import EmployeeSurvey from "../components/Employees/EmployeeSurvey";
import EmployeeViewPayslip from "../components/Employees/EmployeeViewPayslip";
import EmployeeTasks from "../components/Employees/EmployeeTask";
import EmployeePayrollHistory from "../components/Employees/EmployeePayrollHistory";
import EmployeePerformance from "../components/Employees/EmployeePerformance";

const EmployeeDashboard = () => {
  const [employee, setEmployee] = useState(null);
  const [summary, setSummary] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userName, setUserName] = useState("E");
  const [openMenu, setOpenMenu] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");

  const getPageTitle = () => {
    switch (location.pathname) {
      case "/employee-dashboard":
        return "🏠 Employee Dashboard";
        case "/employee-dashboard/my-profile":
  return "👤 My Profile";
      case "/employee-dashboard/apply-leave":
        return "📝 Apply Leave";
      case "/employee-dashboard/attendance":
        return "📅 Mark Attendance";
      case "/employee-dashboard/attendance-request":
        return "📩 Attendance Request";
      case "/employee-dashboard/engagement":
        return "💬 Engagement Survey";
      case "/employee-dashboard/view-payslip":
        return "💵 View Payslip";
      case "/employee-dashboard/payroll-history":
        return "📜 Payroll History";
      case "/employee-dashboard/tasks":
        return "📋 My Tasks";
        case "/employee-dashboard/performance":
        return "⭐ My Performance";
      default:
        return "Employee Dashboard";
    }
  };

  useEffect(() => {
    fetchEmployeeDashboard();
    fetchLeaves();
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (employee?.firstName) {
      setUserName(employee.firstName.charAt(0).toUpperCase());
    }
  }, [employee]);

  useEffect(() => {
    if (
      location.pathname.startsWith("/employee-dashboard/attendance") ||
      location.pathname === "/employee-dashboard/attendance-request"
    ) {
      setOpenMenu("attendance");
    } else if (
      location.pathname.startsWith("/employee-dashboard/view-payslip") ||
      location.pathname.startsWith("/employee-dashboard/payroll-history")
    ) {
      setOpenMenu("payroll");
    }
  }, [location.pathname]);

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

  const fetchEmployeeDashboard = async () => {
    try {
      const res = await axios.get("https://employee-analysis-system-1.onrender.com//api/employee-dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setEmployee(res.data.employee);
      setSummary(res.data.summary);
    } catch (err) {
      console.log("Error fetching employee dashboard:", err);
    }
  };

  const fetchLeaves = async () => {
    try {
      const res = await axios.get("https://employee-analysis-system-1.onrender.com//api/leave/my-leaves", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setLeaves(res.data || []);
    } catch (err) {
      console.log("Error fetching leaves:", err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await axios.get("https://employee-analysis-system-1.onrender.com//api/notifications/employee", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data || []);
    } catch (err) {
      console.log("Employee notifications not available:", err);
      setNotifications([]);
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
          "https://employee-analysis-system-1.onrender.com//api/notifications/read-all/employee",
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        fetchNotifications();
      } catch (err) {
        console.log("Error marking employee notifications as read:", err);
      }
    }
  };

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "leave":
        return "📝";
      case "attendance":
        return "📅";
      case "payroll":
        return "💰";
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

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const approvedLeaveCount = leaves.filter(
    (leave) => leave.status === "Approved"
  ).length;

  if (!employee) return <div className="loading">Loading...</div>;

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

        <ul className="sidebar-menu">
          <li className={location.pathname === "/employee-dashboard" ? "active" : ""}>
            <span className="menu-icon">🏠</span>
            {!isCollapsed && (
              <Link to="/employee-dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                Home
              </Link>
            )}
          </li>

          <li
  className={
    location.pathname === "/employee-dashboard/my-profile" ? "active" : ""
  }
>
  <span className="menu-icon">👤</span>
  {!isCollapsed && (
    <Link
      to="/employee-dashboard/my-profile"
      onClick={() => setIsMobileMenuOpen(false)}
    >
      My Profile
    </Link>
  )}
</li>

          <li
            className={
              location.pathname === "/employee-dashboard/apply-leave" ? "active" : ""
            }
          >
            <span className="menu-icon">📝</span>
            {!isCollapsed && (
              <Link
                to="/employee-dashboard/apply-leave"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Apply Leave
              </Link>
            )}
          </li>

          <li
            onClick={() => toggleMenu("attendance")}
            className={`dropdown-menu ${
              location.pathname === "/employee-dashboard/attendance" ||
              location.pathname === "/employee-dashboard/attendance-request"
                ? "active"
                : ""
            }`}
          >
            <span className="menu-icon">📅</span>
            {!isCollapsed && <span>Attendance ▾</span>}
          </li>

          {openMenu === "attendance" && !isCollapsed && (
            <ul className="submenu">
              <li>
                <Link
                  to="/employee-dashboard/attendance"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Mark Attendance
                </Link>
              </li>
              <li>
                <Link
                  to="/employee-dashboard/attendance-request"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Attendance Request
                </Link>
              </li>
            </ul>
          )}

          <li
            className={
              location.pathname === "/employee-dashboard/engagement" ? "active" : ""
            }
          >
            <span className="menu-icon">💬</span>
            {!isCollapsed && (
              <Link
                to="/employee-dashboard/engagement"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Engagement
              </Link>
            )}
          </li>

          <li
            onClick={() => toggleMenu("payroll")}
            className={`dropdown-menu ${
              location.pathname === "/employee-dashboard/view-payslip" ||
              location.pathname === "/employee-dashboard/payroll-history"
                ? "active"
                : ""
            }`}
          >
            <span className="menu-icon">💵</span>
            {!isCollapsed && <span>Payroll ▾</span>}
          </li>

          {openMenu === "payroll" && !isCollapsed && (
            <ul className="submenu">
              <li>
                <Link
                  to="/employee-dashboard/view-payslip"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  View Payslip
                </Link>
              </li>
              <li>
                <Link
                  to="/employee-dashboard/payroll-history"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Payroll History
                </Link>
              </li>
            </ul>
          )}

          <li
            className={location.pathname === "/employee-dashboard/tasks" ? "active" : ""}
          >
            <span className="menu-icon">📋</span>
            {!isCollapsed && (
              <Link
                to="/employee-dashboard/tasks"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                My Task
              </Link>
            )}
          </li>


          <li
            className={
              location.pathname === "/employee-dashboard/performance" ? "active" : ""
            }
          >
            <span className="menu-icon">⭐</span>
            {!isCollapsed && (
              <Link
                to="/employee-dashboard/performance"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                My Performance
              </Link>
            )}
          </li>
        </ul>

        {!isCollapsed ? (
          <button className="logout-btn" onClick={handleLogout}>
            🚪 Logout
          </button>
        ) : (
          <button className="logout-btn-icon" onClick={handleLogout} title="Logout">
            🚪
          </button>
        )}
      </div>

      {/* Main Content */}
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
              <div className="user-name">{employee.email}</div>

              {showDropdown && (
                <div className="profile-dropdown">
                  <p className="email">{employee.email}</p>
                  <hr />
                  <p className="logout" onClick={handleLogout}>
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
              <Route index element={<EmployeeHome />} />
              <Route path="my-profile" element={<EmployeeProfile />} />
              <Route path="apply-leave" element={<EmployeeApplyLeave />} />
              <Route path="attendance" element={<EmployeeMarkAttendance />} />
              <Route path="attendance-request" element={<EmployeeAttendanceRequest />} />
              <Route path="engagement" element={<EmployeeSurvey />} />
<Route path="view-payslip" element={<EmployeeViewPayslip />} />  
<Route path="payroll-history" element={<EmployeePayrollHistory />} />            
              <Route path="tasks" element={<EmployeeTasks />} />
              <Route path="performance" element={<EmployeePerformance />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;