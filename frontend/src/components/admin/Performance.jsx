import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../style/Performance.css";

const Performance = () => {
  const role = localStorage.getItem("role");

  const [data, setData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [viewType, setViewType] = useState("all");
const [form, setForm] = useState({
  employee: "",
  reviewComment: "",
  reviewType: "Monthly",
  reviewMonth: new Date().getMonth() + 1,
  reviewYear: new Date().getFullYear()
});

  const token = localStorage.getItem("token");

  const fetchPerformance = async () => {
    try {
      const res = await axios.get("${import.meta.env.VITE_API_URL}/api/performance", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
      setViewType("all");
    } catch (error) {
      alert("Error fetching performance data");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/performance/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPerformance();
    } catch (error) {
      alert("Error deleting record");
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get("${import.meta.env.VITE_API_URL}/api/employees", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(res.data);
    } catch (error) {
      alert("Error fetching employees");
    }
  };

  useEffect(() => {
    fetchPerformance();
    if (role === "hr") {
      fetchEmployees();
    }
  }, [role]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("${import.meta.env.VITE_API_URL}/api/performance", form, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(res.data.message);

     setForm({
  employee: "",
  reviewComment: "",
  reviewType: "Monthly",
  reviewMonth: new Date().getMonth() + 1,
  reviewYear: new Date().getFullYear()
});

      fetchPerformance();
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong");
    }
  };

  const fetchTopPerformers = async () => {
    try {
      const res = await axios.get("${import.meta.env.VITE_API_URL}/api/performance/top", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
      setViewType("top");
    } catch (error) {
      alert("Error fetching top performers");
    }
  };

  const fetchLowPerformers = async () => {
    try {
      const res = await axios.get("${import.meta.env.VITE_API_URL}/api/performance/low", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
      setViewType("low");
    } catch (error) {
      alert("Error fetching low performers");
    }
  };

  const fetchDepartmentReport = async () => {
    try {
      const res = await axios.get("${import.meta.env.VITE_API_URL}/api/performance/department", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
      setViewType("department");
    } catch (error) {
      alert("Error fetching department report");
    }
  };

  const getRatingClass = (rating) => {
  if (rating === "Excellent" || rating === "Very Good") {
    return "rating-badge excellent";
  }
  if (rating === "Good" || rating === "Average") {
    return "rating-badge average";
  }
  return "rating-badge low";
};

const getMonthName = (monthNumber) => {
  const months = [
    "",
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];
  return months[monthNumber] || "";
};

  const getKpiClass = (kpi) => {
    const value = Number(kpi || 0);
    if (value >= 80) return "kpi-badge high";
    if (value >= 50) return "kpi-badge medium";
    return "kpi-badge low";
  };

  const handleFinalize = async (id) => {
  try {
    const res = await axios.put(
      `${import.meta.env.VITE_API_URL}/api/performance/finalize/${id}`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    alert(res.data.message);
    fetchPerformance();
  } catch (error) {
    alert(error.response?.data?.message || "Error finalizing record");
  }
};

  return (
    <div className="performance-page">
      {/* <div className="performance-banner">
        <h2>Performance Module</h2>
        <p>Manage employee ratings, reviews, KPI scores and department reports</p>
      </div> */}

      {role === "hr" && (
        <div className="performance-card">
          <div className="section-header">
            {/* <h3>⭐ Give Rating</h3> */}
            {/* <p>Submit employee performance review</p> */}
          </div>

          <form className="performance-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Employee</label>
              <select
                value={form.employee}
                onChange={(e) => setForm({ ...form, employee: e.target.value })}
                required
              >
                <option value="">Select Employee</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.firstName} {emp.lastName}
                  </option>
                ))}
              </select>
            </div>

           

            <div className="form-group">
              <label>Review Type</label>
              <select
                value={form.reviewType}
                onChange={(e) => setForm({ ...form, reviewType: e.target.value })}
              >
                <option>Monthly</option>
                <option>Quarterly</option>
                <option>Yearly</option>
              </select>
            </div>
{form.reviewType === "Monthly" && (
  <div className="form-group">
    <label>Select Month</label>
    <select
      value={form.reviewMonth}
      onChange={(e) =>
        setForm({ ...form, reviewMonth: Number(e.target.value) })
      }
      required
    >
      <option value={1}>January</option>
      <option value={2}>February</option>
      <option value={3}>March</option>
      <option value={4}>April</option>
      <option value={5}>May</option>
      <option value={6}>June</option>
      <option value={7}>July</option>
      <option value={8}>August</option>
      <option value={9}>September</option>
      <option value={10}>October</option>
      <option value={11}>November</option>
      <option value={12}>December</option>
    </select>
  </div>
)}

{form.reviewType === "Monthly" && (
  <div className="form-group">
    <label>Select Year</label>
    <input
      type="number"
      value={form.reviewYear}
      onChange={(e) =>
        setForm({ ...form, reviewYear: Number(e.target.value) })
      }
      min="2020"
      max="2100"
      required
    />
  </div>
)}
            <div className="form-group full-width">
              <label>Review Comment</label>
              <textarea
                placeholder="Write review comment"
                value={form.reviewComment}
                onChange={(e) =>
                  setForm({ ...form, reviewComment: e.target.value })
                }
              />
            </div>

           <button type="submit" className="submit-btn">
  Generate Performance
</button>
          </form>
        </div>
      )}

      {role === "admin" && (
        <div className="performance-card">
          <div className="section-header">
            <h3>Performance Review⭐</h3>
            <p>View ratings, top performers, low performers and department reports</p>
          </div>

          <div className="filter-buttons">
            <button className="theme-btn blue-btn" onClick={fetchPerformance}>
  View All Records
</button>

            <button className="theme-btn orange-btn" onClick={fetchTopPerformers}>
              🏆 Top Performers
            </button>

            <button className="theme-btn blue-btn" onClick={fetchLowPerformers}>
              📉 Low Performers
            </button>

            <button className="theme-btn orange-btn" onClick={fetchDepartmentReport}>
              📊 Department Report
            </button>
          </div>
        </div>
      )}

      <div className="performance-card">
        <div className="table-title">
          <h3>
            {viewType === "all" && "Performance Records"}
            {viewType === "top" && "Top Performers"}
            {viewType === "low" && "Low Performers"}
            {viewType === "department" && "Department Report"}
          </h3>
        </div>

        <div className="table-wrapper">
          <table className="performance-table">
            <thead>
              <tr>
                {viewType === "department" ? (
                  <>
  <th>Department</th>
  <th>Average KPI</th>
</>
                ) : (
               <>
  <th>Employee</th>
  <th>Attendance</th>
  <th>Task</th>
  <th>Bonus</th>
  <th>Deduction</th>
  <th>Final KPI</th>
  <th>Rating</th>
  <th>Review Type</th>
  <th>Comment</th>
  <th>Status</th>
  {(role === "admin" || role === "hr") && <th>Action</th>}
</>
                )}
              </tr>
            </thead>

            <tbody>
              {data.length > 0 ? (
                data.map((item, index) => (
                  <tr key={item._id || index}>
                    {viewType === "department" ? (
                      <>
                        <td className="employee-name">
                          {item.departmentName || "N/A"}
                        </td>
                        <td>
                          <span className="dept-badge">
  {item.avgKpiScore || 0}%
</span>
                        </td>
                      </>
                    ) : (
                      <>
  <td className="employee-name">
    {item.employee?.firstName} {item.employee?.lastName}
  </td>

  <td>{item.attendanceScore ?? 0}%</td>

  <td>{item.taskScore ?? 0}%</td>

  <td>+{item.earlyCompletionBonus ?? 0}</td>

  <td>-{item.leaveDeduction ?? 0}</td>

  <td>
    <span className={getKpiClass(item.kpiScore)}>
      {item.kpiScore ?? 0}%
    </span>
  </td>

  <td>
    <span className={getRatingClass(item.rating)}>
      {item.rating}
    </span>
  </td>

 <td>
  <span className="review-type-badge">
    {item.reviewType}
    {item.reviewType === "Monthly" && item.reviewMonth && item.reviewYear
      ? ` (${item.reviewMonth}/${item.reviewYear})`
      : ""}
  </span>
</td>

<td className="comment-cell">
  {item.reviewComment || "No comment"}
</td>

<td>
  <span className={item.status === "Finalized" ? "status-final" : "status-draft"}>
    {item.status || "Draft"}
  </span>
</td>

{(role === "admin" || role === "hr") && (
  <td>
    {role === "hr" && viewType === "all" ? (
      item.status !== "Finalized" ? (
        <button
          className="finalize-btn"
          onClick={() => handleFinalize(item._id)}
        >
          Finalize
        </button>
      ) : (
        <span className="dash-text">Finalized</span>
      )
    ) : role === "admin" && (viewType === "all" || viewType === "low") ? (
      <button
        className="delete-btn"
        onClick={() => handleDelete(item._id)}
      >
        Delete
      </button>
    ) : (
      <span className="dash-text">-</span>
    )}
  </td>
)}
</>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
<td
  colSpan={
    viewType === "department"
      ? 2
      : (role === "admin" || role === "hr")
      ? 11
      : 10
  }
  className="no-data"
>
  No data found
</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Performance;