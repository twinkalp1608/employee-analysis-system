import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "../../style/Report.css";

const Report = () => {
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  const [reportType, setReportType] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [department, setDepartment] = useState("all");
  const [employee, setEmployee] = useState("all");
  const [status, setStatus] = useState("all");
  const [reportData, setReportData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);

  const [summary, setSummary] = useState({
    totalRecords: 0,
    totalActive: 0,
    totalPendingLate: 0,
  });

  const reportOptions =
    role === "employee"
      ? [
          { value: "Attendance Report", label: "My Attendance Report" },
          { value: "Leave Report", label: "My Leave Report" },
          { value: "Payroll Report", label: "My Payroll Report" },
          { value: "Performance Report", label: "My Performance Report" },
        ]
      : [
          { value: "Attendance Report", label: "Attendance Report" },
          { value: "Leave Report", label: "Leave Report" },
          { value: "Payroll Report", label: "Payroll Report" },
          { value: "Performance Report", label: "Performance Report" },
        ];

  useEffect(() => {
    fetchDepartments();
    fetchEmployees();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await axios.get("https://employee-analysis-system-1.onrender.com/api/departments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDepartments(res.data || []);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get("https://employee-analysis-system-1.onrender.com/api/employees", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmployees(res.data || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const filteredEmployees = useMemo(() => {
    if (department === "all") return employees;

    return employees.filter((emp) => {
      if (!emp.department) return false;

      if (typeof emp.department === "object") {
        return String(emp.department._id) === String(department);
      }

      return String(emp.department) === String(department);
    });
  }, [employees, department]);

  const handleDepartmentChange = async (e) => {
    const selectedDepartment = e.target.value;
    setDepartment(selectedDepartment);
    setEmployee("all");

    try {
      if (selectedDepartment === "all") {
        await fetchEmployees();
        return;
      }

      const res = await axios.get(
        `https://employee-analysis-system-1.onrender.com/api/employees/by-department/${selectedDepartment}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setEmployees(res.data || []);
    } catch (error) {
      console.error("Department employee fetch error:", error);
      await fetchEmployees();
    }
  };

  const handleGenerateReport = async () => {
    if (!reportType) {
      alert("Please select report type");
      return;
    }

    if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
      alert("From Date cannot be greater than To Date");
      return;
    }

    try {
      setLoading(true);

      const endpoint =
        role === "hr"
          ? "https://employee-analysis-system-1.onrender.com/api/reports/generate-and-save"
          : "https://employee-analysis-system-1.onrender.com/api/reports/generate";

      const res = await axios.post(
        endpoint,
        {
          reportType,
          fromDate,
          toDate,
          department,
          employee,
          status,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setReportData(res.data.rows || res.data.report?.rows || []);
      setSummary(
        res.data.summary ||
          res.data.report?.summary || {
            totalRecords: 0,
            totalActive: 0,
            totalPendingLate: 0,
          }
      );

      if (role === "hr") {
        alert("Report generated and saved successfully");
      }
    } catch (error) {
      console.error("Generate report error:", error);
      alert(error.response?.data?.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setReportType("");
    setFromDate("");
    setToDate("");
    setDepartment("all");
    setEmployee("all");
    setStatus("all");
    setReportData([]);
    setSummary({
      totalRecords: 0,
      totalActive: 0,
      totalPendingLate: 0,
    });

    await fetchEmployees();
  };

  return (
    <div className="report-page">
      <h2 className="report-page-title">
        {role === "hr" ? "HR Reports Module" : "My Reports"}
      </h2>

      <div className="report-filter-card">
        <div className="report-filter-header">
          <h3>{role === "hr" ? "Generate & Save Report" : "Generate Report"}</h3>
        </div>

        <div className="report-filter-grid">
          <div className="filter-group">
            <label>Report Type</label>
            <select
              value={reportType}
              onChange={(e) => {
                setReportType(e.target.value);
                setStatus("all");
              }}
            >
              <option value="" disabled>
                Select Report Type
              </option>
              {reportOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          {role !== "employee" && (
            <div className="filter-group">
              <label>Department</label>
              <select value={department} onChange={handleDepartmentChange}>
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {role !== "employee" && (
            <div className="filter-group">
              <label>Employee</label>
              <select value={employee} onChange={(e) => setEmployee(e.target.value)}>
                <option value="all">All Employees</option>
                {filteredEmployees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.firstName} {emp.lastName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="filter-group">
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All Status</option>

              {reportType === "Attendance Report" && (
                <>
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Late">Late</option>
                  <option value="Half-Day">Half-Day</option>
                  <option value="Leave">Leave</option>
                  <option value="WFH">WFH</option>
                </>
              )}

              {reportType === "Leave Report" && (
                <>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </>
              )}

              {reportType === "Payroll Report" && (
                <>
                  <option value="Draft">Draft</option>
                  <option value="Pending Approval">Pending Approval</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Paid">Paid</option>
                </>
              )}

              {reportType === "Performance Report" && (
                <>
                  <option value="Draft">Draft</option>
                  <option value="Finalized">Finalized</option>
                </>
              )}
            </select>
          </div>
        </div>

        <div className="report-action-row">
          <button
            className="generate-btn"
            onClick={handleGenerateReport}
            disabled={loading}
          >
            {loading
              ? "Processing..."
              : role === "hr"
              ? "Generate & Save Report"
              : "Generate Report"}
          </button>

          <button className="reset-btn" onClick={handleReset}>
            Reset
          </button>
        </div>
      </div>

      <div className="report-summary-grid">
        <div className="summary-card blue">
          <h4>Total Records</h4>
          <p>{summary.totalRecords}</p>
        </div>
        <div className="summary-card green">
          <h4>Total Active</h4>
          <p>{summary.totalActive}</p>
        </div>
        <div className="summary-card orange">
          <h4>Pending / Late</h4>
          <p>{summary.totalPendingLate}</p>
        </div>
      </div>

      <div className="report-table-card">
        <div className="report-table-header">
          <h3>Report Preview</h3>
        </div>

        <div className="report-table-wrapper">
          <table className="report-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Date</th>
                <th>Status</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {reportData.length > 0 ? (
                reportData.map((item, index) => (
                  <tr key={index}>
                    <td>{item.employeeName}</td>
                    <td>{item.department}</td>
                    <td>{item.date}</td>
                    <td>{item.status}</td>
                    <td>{item.details}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>
                    No report data available
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

export default Report;