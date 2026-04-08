import React, { useState } from "react";
import axios from "axios";
import html2pdf from "html2pdf.js";
import "../../style/EmployeeViewPayslip.css";
import logo from "../../assets/images/techno.png";
const EmployeeViewPayslip = () => {
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [payroll, setPayroll] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const months = [
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
    "December",
  ];

  const years = [2024, 2025, 2026, 2027];

  const handleViewPayslip = async () => {
    if (!month || !year) {
      setMessage("Please select month and year");
      setPayroll(null);
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const res = await axios.get(
        `https://employee-analysis-system-1.onrender.com/api/employee/payroll/view?month=${month}&year=${year}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setPayroll(res.data.payroll);
      setMessage("");
    } catch (error) {
      console.log("Error fetching payslip:", error);
      setPayroll(null);
      setMessage(
        error.response?.data?.message || "Payslip not found for selected month"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById("employee-payslip-download");

    const opt = {
      margin: 0.3,
      filename: `${payroll.employeeId?.employeeId || "Payslip"}-${payroll.month}-${payroll.year}.pdf`,
      image: { type: "jpeg", quality: 1 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="employee-view-payslip-page">
      <div className="employee-payslip-header">
        <h2>View Payslip</h2>
        <p>Select month and year to view your saved payslip</p>
      </div>

      <div className="employee-payslip-filter-card">
        <div className="employee-payslip-filter-group">
          <div className="employee-payslip-field">
            <label>Select Month</label>
            <select value={month} onChange={(e) => setMonth(e.target.value)}>
              <option value="">-- Select Month --</option>
              {months.map((m, index) => (
                <option key={index} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="employee-payslip-field">
            <label>Select Year</label>
            <select value={year} onChange={(e) => setYear(e.target.value)}>
              <option value="">-- Select Year --</option>
              {years.map((y, index) => (
                <option key={index} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="employee-payslip-btn-box">
            <button onClick={handleViewPayslip} className="employee-view-btn">
              {loading ? "Loading..." : "View Payslip"}
            </button>
          </div>
        </div>

        {message && <p className="employee-payslip-message">{message}</p>}
      </div>

      {payroll && (
  <div className="employee-payslip-card-wrapper">
    <div id="employee-payslip-download" className="payslip-container employee-payslip-fixed">
      <div className="company-header">
        <div className="company-left">
          <img src={logo} alt="Company Logo" className="main-logo" />
          <div>
            <h2>TechnoGuide Infosoft Pvt. Ltd.</h2>
            <p>Touch the sky with us..</p>
          </div>
        </div>
        <div className="payslip-title">PAYSLIP</div>
      </div>

      <div className="employee-grid">
        <div>
          <p>
            <strong>Employee Name:</strong> {payroll.employeeId?.firstName}{" "}
            {payroll.employeeId?.lastName}
          </p>
          <p>
            <strong>Email:</strong> {payroll.employeeId?.email}
          </p>
          <p>
            <strong>Designation:</strong>{" "}
            {payroll.employeeId?.designation?.name || "N/A"}
          </p>
          <p>
            <strong>Department:</strong>{" "}
            {payroll.employeeId?.department?.name || "N/A"}
          </p>
        </div>

        <div>
          <p>
            <strong>Month:</strong> {payroll.month} {payroll.year}
          </p>
          <p>
            <strong>Pay Period:</strong> {payroll.month} {payroll.year}
          </p>
          <p>
            <strong>Status:</strong>{" "}
            <span className={payroll.status === "Paid" ? "paid" : "pending"}>
              {payroll.status}
            </span>
          </p>
          <p>
            <strong>Payment Date:</strong>{" "}
            {payroll.paymentDate
              ? new Date(payroll.paymentDate).toLocaleDateString("en-GB")
              : "N/A"}
          </p>
        </div>
      </div>

      <div className="employee-grid single-info-block">
        <div>
          <p><strong>Total Days:</strong> {payroll.totalDays || 0}</p>
          <p><strong>Present Days:</strong> {payroll.presentDays || 0}</p>
          <p><strong>Absent Days:</strong> {payroll.absentDays || 0}</p>
          <p><strong>Half Days:</strong> {payroll.halfDays || 0}</p>
          <p><strong>Leave Days:</strong> {payroll.leaveDays || 0}</p>
          <p><strong>Overtime Hours:</strong> {payroll.overtimeHours || 0}</p>
        </div>
      </div>

      <div className="salary-grid">
        <div className="salary-table">
          <div className="salary-header">
            <span>Earnings</span>
            <span>Amount</span>
          </div>

          <div className="salary-row">
            <span>Basic Salary</span>
            <span>₹ {payroll.basicSalary || 0}</span>
          </div>
          <div className="salary-row">
            <span>HRA</span>
            <span>₹ {payroll.hra || 0}</span>
          </div>
          <div className="salary-row">
            <span>DA</span>
            <span>₹ {payroll.da || 0}</span>
          </div>
          <div className="salary-row">
            <span>Bonus</span>
            <span>₹ {payroll.bonus || 0}</span>
          </div>
          <div className="salary-row">
            <span>Overtime</span>
            <span>₹ {payroll.overtime || 0}</span>
          </div>
          <div className="salary-total">
            <span>Gross Salary</span>
            <span>₹ {payroll.grossSalary || 0}</span>
          </div>
        </div>

        <div className="salary-table">
          <div className="salary-header">
            <span>Deductions</span>
            <span>Amount</span>
          </div>

          <div className="salary-row">
            <span>PF</span>
            <span>₹ {payroll.pf || 0}</span>
          </div>
          <div className="salary-row">
            <span>Professional Tax</span>
            <span>₹ {payroll.professionalTax || 0}</span>
          </div>
          <div className="salary-row">
            <span>Leave Deduction</span>
            <span>₹ {payroll.leaveDeduction || 0}</span>
          </div>
          <div className="salary-row">
            <span>Half Day Deduction</span>
            <span>₹ {payroll.halfDayDeduction || 0}</span>
          </div>
          <div className="salary-row">
            <span>Other Deduction</span>
            <span>₹ {payroll.otherDeduction || 0}</span>
          </div>
          <div className="salary-total">
            <span>Total Deduction</span>
            <span>₹ {payroll.totalDeduction || 0}</span>
          </div>
        </div>
      </div>

      <div className="salary-table net-salary-table">
        <div className="salary-total net">
          <span>Net Salary</span>
          <span>₹ {payroll.netSalary || 0}</span>
        </div>
      </div>

      <div className="payment-info">
        <p>
          <strong>Status:</strong>{" "}
          <span className={payroll.status === "Paid" ? "paid" : "pending"}>
            {payroll.status}
          </span>
        </p>
        <p><strong>Payment Mode:</strong> {payroll.paymentMode || "N/A"}</p>
        <p>
          <strong>Payment Date:</strong>{" "}
          {payroll.paymentDate
            ? new Date(payroll.paymentDate).toLocaleDateString("en-GB")
            : "N/A"}
        </p>
      </div>
    </div>

    
  </div>

  
)}
<div className="employee-download-btn-wrap">
      <button onClick={handleDownloadPDF} className="employee-download-btn">
        Download PDF
      </button>
    </div>
    </div>
  );
};

export default EmployeeViewPayslip;