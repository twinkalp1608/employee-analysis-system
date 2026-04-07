import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../style/EmployeePerformance.css";

const EmployeePerformance = () => {
  const [data, setData] = useState({
    employee: null,
    latestPerformance: null,
    performanceHistory: [],
    averageKpiScore: 0,
    totalReviews: 0,
  });

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchPerformanceSummary();
  }, []);

  const fetchPerformanceSummary = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        "${import.meta.env.VITE_API_URL}/api/employee/performance/summary",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setData(res.data);
      setMessage("");
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Failed to fetch performance");
    } finally {
      setLoading(false);
    }
  };

  const getReviewLabel = (item) => {
    if (item.reviewType === "Monthly") {
      return `Month ${item.reviewMonth}/${item.reviewYear}`;
    }
    if (item.reviewType === "Quarterly") {
      return `Q${item.reviewQuarter} / ${item.reviewYear}`;
    }
    return `Year ${item.reviewYear}`;
  };

  const getRatingClass = (rating) => {
    switch (rating) {
      case "Excellent":
        return "excellent";
      case "Very Good":
        return "very-good";
      case "Good":
        return "good";
      case "Average":
        return "average";
      default:
        return "needs-improvement";
    }
  };

  if (loading) {
    return <div className="employee-performance-page">Loading performance...</div>;
  }

  return (
    <div className="employee-performance-page">
      <div className="employee-performance-header">
        <div>
          <h2>My Performance</h2>
          <p>View your latest review and performance history</p>
        </div>
      </div>

      {message && <div className="performance-message error">{message}</div>}

      {!data.latestPerformance ? (
        <div className="no-performance-card">
          <h3>No Performance Data Found</h3>
          <p>Your performance review has not been generated yet.</p>
        </div>
      ) : (
        <>
          <div className="performance-top-grid">
            <div className="performance-card">
              <h4>Employee Info</h4>
              <p>
                <strong>Name:</strong>{" "}
                {data.employee?.firstName} {data.employee?.lastName}
              </p>
              <p>
                <strong>Employee ID:</strong> {data.employee?.employeeId || "-"}
              </p>
              <p>
                <strong>Department:</strong> {data.employee?.department?.name || "-"}
              </p>
              <p>
                <strong>Designation:</strong> {data.employee?.designation?.name || "-"}
              </p>
            </div>

            <div className="performance-card">
              <h4>Latest Review</h4>
              <p>
                <strong>Review Type:</strong>{" "}
                {getReviewLabel(data.latestPerformance)}
              </p>
              <p>
                <strong>Status:</strong> {data.latestPerformance.status}
              </p>
              <p>
                <strong>Rating:</strong>{" "}
                <span className={`rating-badge ${getRatingClass(data.latestPerformance.rating)}`}>
                  {data.latestPerformance.rating}
                </span>
              </p>
              <p>
                <strong>KPI Score:</strong> {data.latestPerformance.kpiScore}
              </p>
            </div>

            <div className="performance-card">
              <h4>Overall Summary</h4>
              <p>
                <strong>Total Reviews:</strong> {data.totalReviews}
              </p>
              <p>
                <strong>Average KPI:</strong> {data.averageKpiScore}
              </p>
              <p>
                <strong>Attendance Score:</strong> {data.latestPerformance.attendanceScore}
              </p>
              <p>
                <strong>Task Score:</strong> {data.latestPerformance.taskScore}
              </p>
            </div>
          </div>

          <div className="performance-detail-grid">
            <div className="performance-card">
              <h4>Latest Review Details</h4>
              <div className="score-grid">
                <div className="score-box">
                  <span>Attendance</span>
                  <strong>{data.latestPerformance.attendanceScore}</strong>
                </div>
                <div className="score-box">
                  <span>Task</span>
                  <strong>{data.latestPerformance.taskScore}</strong>
                </div>
                <div className="score-box">
                  <span>Early Bonus</span>
                  <strong>{data.latestPerformance.earlyCompletionBonus}</strong>
                </div>
                <div className="score-box">
                  <span>Leave Deduction</span>
                  <strong>{data.latestPerformance.leaveDeduction}</strong>
                </div>
                <div className="score-box">
                  <span>Final KPI</span>
                  <strong>{data.latestPerformance.kpiScore}</strong>
                </div>
              </div>
            </div>

            <div className="performance-card">
              <h4>Manager / HR Comment</h4>
              <div className="review-comment-box">
                {data.latestPerformance.reviewComment || "No comment added"}
              </div>
            </div>
          </div>

          <div className="performance-card history-card">
            <h4>Performance History</h4>
            <div className="table-wrapper">
              <table className="performance-table">
                <thead>
                  <tr>
                    <th>Review Period</th>
                    <th>Review Type</th>
                    <th>Attendance</th>
                    <th>Task</th>
                    <th>Bonus</th>
                    <th>Deduction</th>
                    <th>KPI</th>
                    <th>Rating</th>
                    <th>Status</th>
                    <th>Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {data.performanceHistory.map((item) => (
                    <tr key={item._id}>
                      <td>{getReviewLabel(item)}</td>
                      <td>{item.reviewType}</td>
                      <td>{item.attendanceScore}</td>
                      <td>{item.taskScore}</td>
                      <td>{item.earlyCompletionBonus}</td>
                      <td>{item.leaveDeduction}</td>
                      <td>{item.kpiScore}</td>
                      <td>
                        <span className={`rating-badge ${getRatingClass(item.rating)}`}>
                          {item.rating}
                        </span>
                      </td>
                      <td>{item.status}</td>
                      <td>{item.reviewComment || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EmployeePerformance;