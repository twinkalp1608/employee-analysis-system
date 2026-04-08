import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../style/EmployeeMarkAttendance.css";

const EmployeeMarkAttendance = () => {
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [workType, setWorkType] = useState("Office");
  const [dayBlocked, setDayBlocked] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState("");

  const token = localStorage.getItem("token");

  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };

  useEffect(() => {
    fetchTodayAttendance();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchTodayAttendance = async () => {
    try {
      const res = await axios.get(
        "https://employee-analysis-system-1.onrender.com//api/employee/attendance/today",
        config
      );

      setTodayAttendance(res.data.attendance || null);
      setDayBlocked(res.data.blocked || false);
      setBlockedMessage(res.data.message || "");
    } catch (error) {
      console.error(
        "Error fetching today attendance:",
        error.response?.data || error.message
      );
    }
  };

  const getLocation = () => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => reject(error)
      );
    });
  };

  const handleCheckIn = async () => {
    try {
      if (dayBlocked) {
        alert(`Attendance disabled: ${blockedMessage}`);
        return;
      }

      setLoading(true);

      let payload = { workType };

      const location = await getLocation();
      payload = { ...payload, ...location };

      const res = await axios.post(
        "https://employee-analysis-system-1.onrender.com//api/employee/attendance/check-in",
        payload,
        config
      );

      alert(res.data.message);
      fetchTodayAttendance();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Check-in failed ❌");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      if (dayBlocked) {
        alert(`Attendance disabled: ${blockedMessage}`);
        return;
      }

      setLoading(true);

      const res = await axios.put(
        "https://employee-analysis-system-1.onrender.com//api/employee/attendance/check-out",
        {},
        config
      );

      alert(res.data.message);
      fetchTodayAttendance();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Check-out failed ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="employee-attendance-page">
      <div className="employee-attendance-card">
        <div className="attendance-top">
          <div>
            <h2>My Attendance</h2>
            <p className="attendance-subtitle">
              Track your daily check-in and check-out
            </p>
          </div>

          <div className="live-clock-box">
            <p>Today</p>
            <h3>{new Date().toLocaleDateString()}</h3>
            <span>{currentTime.toLocaleTimeString()}</span>
          </div>
        </div>

        {dayBlocked && (
          <div
            style={{
              marginTop: "15px",
              marginBottom: "15px",
              padding: "12px 16px",
              borderRadius: "10px",
              background: "#fff3cd",
              color: "#856404",
              fontWeight: "600"
            }}
          >
            Attendance disabled: {blockedMessage}
          </div>
        )}

        <div className="attendance-status-grid">
          <div className="status-item">
            <p>Status</p>
            <h3>{todayAttendance?.status || "Not Marked"}</h3>
          </div>

          <div className="status-item">
            <p>Check In</p>
            <h3>{todayAttendance?.inTime || "-"}</h3>
          </div>

          <div className="status-item">
            <p>Check Out</p>
            <h3>{todayAttendance?.outTime || "-"}</h3>
          </div>

          <div className="status-item">
            <p>Working Hours</p>
            <h3>{todayAttendance?.workingHours || 0}</h3>
          </div>

          <div className="status-item">
            <p>Work Type</p>
            <h3>{todayAttendance?.attendanceType || workType}</h3>
          </div>
        </div>

        {!dayBlocked && (
          <div style={{ marginTop: "20px", marginBottom: "20px" }}>
            <label style={{ fontWeight: "600", marginRight: "10px" }}>
              Work Type:
            </label>

            <select
              value={workType}
              onChange={(e) => setWorkType(e.target.value)}
              style={{ padding: "10px", borderRadius: "8px" }}
            >
              <option value="Office">Office</option>
              <option value="WFH">Work From Home</option>
            </select>
          </div>
        )}

        <div className="attendance-action-box">
          {!dayBlocked && !todayAttendance?.inTime && (
            <button
              className="attendance-btn checkin-btn"
              onClick={handleCheckIn}
              disabled={loading}
            >
              {loading ? "Checking In..." : "Check In"}
            </button>
          )}

          {!dayBlocked && todayAttendance?.inTime && !todayAttendance?.outTime && (
            <button
              className="attendance-btn checkout-btn"
              onClick={handleCheckOut}
              disabled={loading}
            >
              {loading ? "Checking Out..." : "Check Out"}
            </button>
          )}

          {!dayBlocked && todayAttendance?.inTime && todayAttendance?.outTime && (
            <div className="attendance-complete-msg">
              Attendance completed for today ✅
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeMarkAttendance;