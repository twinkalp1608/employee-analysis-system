import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../style/AdminPayroll.css";
import logo from "../../assets/images/techno.png";
import html2pdf from "html2pdf.js";

const HrPayroll = () => {
  const [formData, setFormData] = useState({
    employeeId: "",
    month: "",
    year: "",
    hra: "",
    da: "",
    bonus: "",
    pf: "",
    professionalTax: "",
    otherDeduction: "",
  });

  const [employees, setEmployees] = useState([]);
  const [grossSalary, setGrossSalary] = useState(0);
  const [totalDeduction, setTotalDeduction] = useState(0);
const [status] = useState("Pending Approval");
  const [netSalary, setNetSalary] = useState(0);
  const [showPayslip, setShowPayslip] = useState(false);
  const [selectedEmployeeData, setSelectedEmployeeData] = useState(null);
  const [payrollExists, setPayrollExists] = useState(false);
  const [existingPayrollMessage, setExistingPayrollMessage] = useState("");
  const [previewData, setPreviewData] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.employeeId || !formData.month || !formData.year) {
      alert("Please fill all required fields");
      return;
    }

    if (payrollExists) {
      alert("Payroll already generated for this employee for this month");
      return;
    }

    if (!previewData || netSalary === 0) {
      alert("Please calculate salary first");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const payrollData = {
        employeeId: formData.employeeId,
        month: formData.month,
        year: formData.year,
        hra: formData.hra || 0,
        da: formData.da || 0,
        bonus: formData.bonus || 0,
        pf: formData.pf || 0,
        professionalTax: formData.professionalTax || 0,
        otherDeduction: formData.otherDeduction || 0,
      };

await axios.post("http://localhost:5000/api/hr/payroll", payrollData, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

alert("Payroll generated and sent for admin approval ✅");

setFormData({
  employeeId: "",
  month: "",
  year: "",
  hra: "",
  da: "",
  bonus: "",
  pf: "",
  professionalTax: "",
  otherDeduction: "",
});

setPreviewData(null);
setGrossSalary(0);
setTotalDeduction(0);
setNetSalary(0);
setSelectedEmployeeData(null);
setPayrollExists(false);
setExistingPayrollMessage("");
setShowPayslip(false);
    } catch (error) {
      alert(error.response?.data?.message || "Error");
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get("http://localhost:5000/api/employees", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setEmployees(res.data);
    } catch (error) {
      alert("Error fetching employees");
    }
  };

  const checkExistingPayroll = async (employeeId, month, year) => {
    try {
      if (!employeeId || !month || !year) {
        setPayrollExists(false);
        setExistingPayrollMessage("");
        return;
      }

      const token = localStorage.getItem("token");

      const res = await axios.get("http://localhost:5000/api/hr/payroll/check", {
        params: { employeeId, month, year },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.exists) {
        setPayrollExists(true);
        setExistingPayrollMessage(
          "Payroll already generated for this employee for this month."
        );
      } else {
        setPayrollExists(false);
        setExistingPayrollMessage("");
      }
    } catch (error) {
      console.log("Payroll check error:", error);
      setPayrollExists(false);
      setExistingPayrollMessage("");
    }
  };

  const handleCalculate = async () => {
    if (!formData.employeeId || !formData.month || !formData.year) {
      alert("Please select employee, month and year first");
      return;
    }

    if (payrollExists) {
      alert("Payroll already generated for this employee for this month");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const res = await axios.post(
        "http://localhost:5000/api/hr/payroll/preview",
        {
          employeeId: formData.employeeId,
          month: formData.month,
          year: formData.year,
          hra: formData.hra || 0,
          da: formData.da || 0,
          bonus: formData.bonus || 0,
          pf: formData.pf || 0,
          professionalTax: formData.professionalTax || 0,
          otherDeduction: formData.otherDeduction || 0,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const preview = res.data.payrollPreview;

      setPreviewData(preview);
      setGrossSalary(preview.grossSalary || 0);
      setTotalDeduction(preview.totalDeduction || 0);
      setNetSalary(preview.netSalary || 0);
    } catch (error) {
      alert(error.response?.data?.message || "Error calculating payroll");
    }
  };

  useEffect(() => {
    if (formData.employeeId) {
      const emp = employees.find((e) => e._id === formData.employeeId);
      setSelectedEmployeeData(emp || null);
    } else {
      setSelectedEmployeeData(null);
    }
  }, [formData.employeeId, employees]);

  useEffect(() => {
    checkExistingPayroll(formData.employeeId, formData.month, formData.year);
  }, [formData.employeeId, formData.month, formData.year]);

  const handleGeneratePayslip = () => {
    if (!formData.employeeId || !formData.month || !formData.year) {
      alert("Please select employee, month and year");
      return;
    }

    if (!previewData || netSalary <= 0) {
      alert("Please calculate salary first");
      return;
    }

    setShowPayslip(true);
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById("payslip-content");

    if (!element) {
      alert("Payslip content not found");
      return;
    }

    const opt = {
      margin: 0.3,
      filename: `${
        selectedEmployeeData?.firstName || "employee"
      }_${formData.month}_${formData.year}_Payslip.pdf`,
      image: { type: "jpeg", quality: 1 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="payroll-container">
      <h2>HR Payroll Generation</h2>

      <div className="filters">
        <select
          name="employeeId"
          value={formData.employeeId}
          onChange={handleChange}
        >
          <option value="">Select Employee</option>
          {employees.map((emp) => (
            <option key={emp._id} value={emp._id}>
              {emp.firstName} {emp.lastName}
            </option>
          ))}
        </select>

        <select name="month" value={formData.month} onChange={handleChange}>
          <option value="">Select Month</option>
          <option>January</option>
          <option>February</option>
          <option>March</option>
          <option>April</option>
          <option>May</option>
          <option>June</option>
          <option>July</option>
          <option>August</option>
          <option>September</option>
          <option>October</option>
          <option>November</option>
          <option>December</option>
        </select>

        <input
          type="number"
          name="year"
          placeholder="Year"
          value={formData.year}
          onChange={handleChange}
        />
      </div>

      {existingPayrollMessage && (
        <p style={{ color: "red", marginTop: "10px", fontWeight: "600" }}>
          {existingPayrollMessage}
        </p>
      )}

      <div className="salary-section">
        <div className="salary-box">
          <h3>Salary Details</h3>

          <div className="auto-field">
            <label>Base Salary</label>
            <div className="auto-value">
              ₹ {previewData?.basicSalary || selectedEmployeeData?.salary || 0}
            </div>
          </div>

          <div className="auto-field">
            <label>HRA (20%)</label>
            <div className="auto-value">₹ {previewData?.hra || 0}</div>
          </div>

          <div className="auto-field">
            <label>DA (10%)</label>
            <div className="auto-value">₹ {previewData?.da || 0}</div>
          </div>

          <div className="auto-field">
            <label>Overtime (Auto from Attendance)</label>
            <div className="auto-value">₹ {previewData?.overtime || 0}</div>
          </div>

          <input
            type="number"
            name="bonus"
            placeholder="Enter Bonus (Optional)"
            value={formData.bonus}
            onChange={handleChange}
            disabled={payrollExists}
          />
        </div>

        <div className="salary-box">
          <h3>Deduction Details</h3>

          <div className="auto-field">
            <label>PF</label>
            <div className="auto-value">₹ {previewData?.pf || 0}</div>
          </div>

          <div className="auto-field">
            <label>Professional Tax</label>
            <div className="auto-value">
              ₹ {previewData?.professionalTax || 0}
            </div>
          </div>

          <div className="auto-field">
            <label>Leave Deduction</label>
            <div className="auto-value">
              ₹ {previewData?.leaveDeduction || 0}
            </div>
          </div>

          <div className="auto-field">
            <label>Half Day Deduction</label>
            <div className="auto-value">
              ₹ {previewData?.halfDayDeduction || 0}
            </div>
          </div>

          <input
            type="number"
            name="otherDeduction"
            placeholder="Enter Other Deduction (Optional)"
            value={formData.otherDeduction}
            onChange={handleChange}
            disabled={payrollExists}
          />
        </div>
      </div>

      <div className="summary">
        <div className="card blue">
          <h4>Gross Salary</h4>
          <h2>₹ {grossSalary}</h2>
        </div>

        <div className="card orange">
          <h4>Total Deductions</h4>
          <h2>₹ {totalDeduction}</h2>
        </div>

        <div className="card green">
          <h4>Net Salary</h4>
          <h2>₹ {netSalary}</h2>
        </div>
      </div>

      <div className="buttons">
        <button
          type="button"
          className="calculate"
          onClick={handleCalculate}
          disabled={payrollExists}
        >
          Calculate Salary
        </button>

        <button
          type="button"
          className="save"
          onClick={handleSubmit}
          disabled={payrollExists}
        >
Save & Send for Approval
        </button>

        <button
          type="button"
          className="generate"
          onClick={handleGeneratePayslip}
        >
Preview Payslip
        </button>
      </div>

      {showPayslip && (
        <div className="payslip-overlay">
          <div className="payslip-container" id="payslip-content">
            <div className="company-header">
              <div className="company-left">
                <img src={logo} alt="logo" className="main-logo" />
                <div>
                  <h2>TechnoGuide Infosoft Pvt. Ltd.</h2>
                  <p style={{ fontSize: "13px", color: "#777" }}>
                    Touch the sky with us..
                  </p>
                </div>
              </div>

              <div className="payslip-title">PAYSLIP</div>
            </div>

            <div className="employee-grid">
              <div>
                <p>
                  <b>Employee Name:</b> {selectedEmployeeData?.firstName}{" "}
                  {selectedEmployeeData?.lastName}
                </p>

                <p>
                  <b>Email:</b> {selectedEmployeeData?.email || "-"}
                </p>

                <p>
                  <b>Designation:</b>{" "}
                  {selectedEmployeeData?.designation?.name || "-"}
                </p>

                <p>
                  <b>Department:</b>{" "}
                  {selectedEmployeeData?.department?.name || "-"}
                </p>
              </div>

              <div>
                <p>
                  <b>Month:</b> {formData.month} {formData.year}
                </p>

                <p>
                  <b>Pay Period:</b> {formData.month} {formData.year}
                </p>

                <p>
                  <b>Status:</b>{" "}
                  <span className={status === "Paid" ? "paid" : "pending"}>
                    {status}
                  </span>
                </p>

                <p>
                  <b>Payment Date:</b> -
                </p>
              </div>
            </div>

            <div className="payment-info">
              <p>
                <b>Total Days:</b> {previewData?.totalDaysInMonth || 0}
              </p>
              <p>
                <b>Present Days:</b> {previewData?.presentDays || 0}
              </p>
              <p>
                <b>Absent Days:</b> {previewData?.absentDays || 0}
              </p>
              <p>
                <b>Half Days:</b> {previewData?.halfDays || 0}
              </p>
              <p>
                <b>Leave Days:</b> {previewData?.leaveDays || 0}
              </p>
              <p>
                <b>Overtime Hours:</b> {previewData?.overtimeHours || 0}
              </p>
            </div>

            <div className="salary-grid">
              <div className="salary-row">
                <span>Basic Salary</span>
                <span>₹ {previewData?.basicSalary || 0}</span>
              </div>

              <div className="salary-row">
                <span>HRA</span>
                <span>₹ {previewData?.hra || 0}</span>
              </div>

              <div className="salary-row">
                <span>DA</span>
                <span>₹ {previewData?.da || 0}</span>
              </div>

              <div className="salary-row">
                <span>Bonus</span>
                <span>₹ {previewData?.bonus || 0}</span>
              </div>

              <div className="salary-row">
                <span>Overtime</span>
                <span>₹ {previewData?.overtime || 0}</span>
              </div>

              <div className="salary-total">
                <span>Gross Salary</span>
                <span>₹ {previewData?.grossSalary || 0}</span>
              </div>

              <div className="salary-row">
                <span>PF</span>
                <span>₹ {previewData?.pf || 0}</span>
              </div>

              <div className="salary-row">
                <span>Professional Tax</span>
                <span>₹ {previewData?.professionalTax || 0}</span>
              </div>

              <div className="salary-row">
                <span>Leave Deduction</span>
                <span>₹ {previewData?.leaveDeduction || 0}</span>
              </div>

              <div className="salary-row">
                <span>Half Day Deduction</span>
                <span>₹ {previewData?.halfDayDeduction || 0}</span>
              </div>

              <div className="salary-row">
                <span>Other Deduction</span>
                <span>₹ {previewData?.otherDeduction || 0}</span>
              </div>

              <div className="salary-total">
                <span>Total Deduction</span>
                <span>₹ {previewData?.totalDeduction || 0}</span>
              </div>

              <div className="salary-total net">
                <span>Net Salary</span>
                <span>₹ {previewData?.netSalary || 0}</span>
              </div>
            </div>

            <div className="payment-info">
              <p>
                <b>Status:</b> <span className="pending">Pending</span>
              </p>

              <p>
                <b>Payment Mode:</b> -
              </p>

              <p>
                <b>Payment Date:</b> -
              </p>
            </div>

            <div className="modal-buttons">
              <button className="download-btn" onClick={handleDownloadPDF}>
                Download PDF
              </button>

              <button className="print-btn" onClick={() => window.print()}>
                Print
              </button>

              <button
                className="close-btn"
                onClick={() => setShowPayslip(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HrPayroll;