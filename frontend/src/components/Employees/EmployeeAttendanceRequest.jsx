import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../style/EmployeeAttendanceRequest.css";

const EmployeeAttendanceRequest = () => {
  const [formData, setFormData] = useState({
    date: "",
    requestedInTime: "",
    requestedOutTime: "",
    reason: ""
  });

  const [blockedDates, setBlockedDates] = useState([]);
  const [blockedMessage, setBlockedMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };

  useEffect(() => {
    fetchBlockedDates();
  }, []);

  const fetchBlockedDates = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/holidays/blocked-dates",
        config
      );
      setBlockedDates(res.data || []);
    } catch (error) {
      console.error(
        "Error fetching blocked dates:",
        error.response?.data || error.message
      );
    }
  };

  const isWeekend = (dateStr) => {
    if (!dateStr) return false;
    const day = new Date(dateStr).getDay();
    return day === 0 || day === 6;
  };

  const getHolidayName = (dateStr) => {
    if (!dateStr) return "";

    const matchedHoliday = blockedDates.find((item) => item.date === dateStr);
    return matchedHoliday ? matchedHoliday.name : "";
  };

  const isHoliday = (dateStr) => {
    return !!getHolidayName(dateStr);
  };

  const getBlockedMessage = (dateStr) => {
    if (!dateStr) return "";

    if (isWeekend(dateStr)) {
      return "Attendance requests are not allowed on Saturday and Sunday ❌";
    }

    const holidayName = getHolidayName(dateStr);
    if (holidayName) {
      return `Attendance requests are not allowed on holidays: ${holidayName} ❌`;
    }

    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    const updatedForm = {
      ...formData,
      [name]: value
    };

    setFormData(updatedForm);

    if (name === "date") {
      setBlockedMessage(getBlockedMessage(value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const message = getBlockedMessage(formData.date);

    if (message) {
      alert(message);
      return;
    }

    try {
      setLoading(true);

      await axios.post(
        "http://localhost:5000/api/attendance/request",
        formData,
        config
      );

      alert("Attendance request sent successfully ✅");

      setFormData({
        date: "",
        requestedInTime: "",
        requestedOutTime: "",
        reason: ""
      });
      setBlockedMessage("");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Error sending request ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="attendance-request-page">
      <div className="attendance-request-card">
        <h2>Attendance Correction Request</h2>
        <p className="request-subtitle">
          Submit a request for missed check-in/check-out or attendance issues.
        </p>

        {blockedMessage && (
          <div
            style={{
              marginBottom: "15px",
              padding: "12px 14px",
              borderRadius: "8px",
              backgroundColor: "#fff3cd",
              color: "#856404",
              fontWeight: "600"
            }}
          >
            {blockedMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="attendance-request-form">
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />

          <input
            type="time"
            name="requestedInTime"
            value={formData.requestedInTime}
            onChange={handleChange}
            disabled={!!blockedMessage}
          />

          <input
            type="time"
            name="requestedOutTime"
            value={formData.requestedOutTime}
            onChange={handleChange}
            disabled={!!blockedMessage}
          />

          <textarea
            name="reason"
            placeholder="Enter reason"
            value={formData.reason}
            onChange={handleChange}
            required
            disabled={!!blockedMessage}
          />

          <button
            type="submit"
            className="request-btn"
            disabled={loading || !!blockedMessage}
          >
            {loading ? "Sending..." : "Send Request"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EmployeeAttendanceRequest;