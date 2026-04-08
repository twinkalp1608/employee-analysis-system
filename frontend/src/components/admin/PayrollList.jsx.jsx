import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../style/PayrollList.css";
import logo from "../../assets/images/techno.png";
import html2pdf from "html2pdf.js";

const PayrollList = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [showPayslip, setShowPayslip] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const role = localStorage.getItem("role");

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const fetchPayrolls = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get("http://localhost:5000/api/admin/payroll", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setPayrolls(res.data);
    } catch (error) {
      alert("Error fetching payrolls");
    }
  };

  const approvePayroll = async (id) => {
    try {
      const token = localStorage.getItem("token");

      await axios.put(
        `http://localhost:5000/api/admin/payroll/${id}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Payroll approved successfully ✅");
      fetchPayrolls();
    } catch (error) {
      alert(error.response?.data?.message || "Error approving payroll");
    }
  };

  const rejectPayroll = async (id) => {
    try {
      const rejectionReason = window.prompt("Enter rejection reason:");
      if (!rejectionReason) return;

      const token = localStorage.getItem("token");

      await axios.put(
        `http://localhost:5000/api/admin/payroll/${id}/reject`,
        { rejectionReason },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Payroll rejected successfully ❌");
      fetchPayrolls();
    } catch (error) {
      alert(error.response?.data?.message || "Error rejecting payroll");
    }
  };

  const handlePayNow = async (payroll) => {
    try {
      const token = localStorage.getItem("token");

      const { data } = await axios.post(
        `http://localhost:5000/api/admin/payroll/${payroll._id}/create-order`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const options = {
        key: data.key,
        amount: data.order.amount,
        currency: data.order.currency,
        name: "Employee Analysis System",
        description: `Salary Payment - ${payroll.month} ${payroll.year}`,
        order_id: data.order.id,
        handler: async function (response) {
          await axios.post(
            "http://localhost:5000/api/admin/payroll/verify-payment",
            {
              payrollId: payroll._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          alert("Payment successful ✅");
          fetchPayrolls();
        },
        theme: {
          color: "#0f4c81",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      alert(error.response?.data?.message || "Payment failed");
    }
  };

  const handleViewPayslip = (payroll) => {
    setSelectedPayslip(payroll);
    setShowPayslip(true);

    setTimeout(() => {
      const payslipSection = document.getElementById("inline-payslip-section");
      if (payslipSection) {
        payslipSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById("payslip-content");

    if (!element) {
      alert("Payslip content not found");
      return;
    }

    document.body.classList.add("pdf-mode");

    await new Promise((resolve) => setTimeout(resolve, 300));

    const opt = {
      margin: 0.3,
      filename: `${
        selectedPayslip?.employeeId?.firstName || "employee"
      }_${selectedPayslip?.month}_${selectedPayslip?.year}_Payslip.pdf`,
      image: { type: "jpeg", quality: 1 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        scrollX: 0,
        scrollY: 0,
      },
      jsPDF: {
        unit: "in",
        format: "a4",
        orientation: "portrait",
      },
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } finally {
      document.body.classList.remove("pdf-mode");
    }
  };

  return (
    <div className="payroll-list-container">
      <h2>
        {role === "admin"
          ? "Payroll Approval & Payment Control"
          : "Payroll List"}
      </h2>

      <table className="payroll-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Month</th>
            <th>Gross</th>
            <th>Deduction</th>
            <th>Net</th>
            <th>Status</th>
            <th>Generated By</th>
            <th>Rejection Reason</th>
            <th>Payment Mode</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {payrolls.map((payroll) => (
            <tr key={payroll._id}>
              <td>
                {payroll.employeeId?.firstName} {payroll.employeeId?.lastName}
              </td>

              <td>
                {payroll.month} {payroll.year}
              </td>

              <td>₹ {payroll.grossSalary}</td>
              <td>₹ {payroll.totalDeduction}</td>
              <td className="net">₹ {payroll.netSalary}</td>

              <td>
                <span
                  className={
                    payroll.status === "Paid"
                      ? "paid"
                      : payroll.status === "Approved"
                      ? "approved"
                      : payroll.status === "Rejected"
                      ? "rejected"
                      : "pending"
                  }
                >
                  {payroll.status}
                </span>
              </td>

              <td>{payroll.generatedBy?.name || "-"}</td>
              <td>{payroll.rejectionReason || "-"}</td>
              <td>{payroll.paymentMode || "-"}</td>

              <td>
                <button
                  className="view-btn"
                  onClick={() => handleViewPayslip(payroll)}
                >
                  View
                </button>

                {role === "admin" && payroll.status === "Pending Approval" && (
                  <>
                    <button
                      className="approve-btn"
                      onClick={() => approvePayroll(payroll._id)}
                    >
                      Approve
                    </button>

                    <button
                      className="reject-btn"
                      onClick={() => rejectPayroll(payroll._id)}
                    >
                      Reject
                    </button>
                  </>
                )}

                {role === "admin" && payroll.status === "Approved" && (
                  <button
                    className="paid-btn"
                    onClick={() => handlePayNow(payroll)}
                  >
                    Pay Now
                  </button>
                )}

                {role === "admin" && payroll.status === "Rejected" && (
                  <button
                    className="approve-btn"
                    onClick={() => approvePayroll(payroll._id)}
                  >
                    Approve
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showPayslip && selectedPayslip && (
        <div id="inline-payslip-section" className="inline-payslip-wrapper">
          <div className="payslip-container inline-payslip" id="payslip-content">
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
                  <b>Employee Name:</b> {selectedPayslip.employeeId?.firstName}{" "}
                  {selectedPayslip.employeeId?.lastName}
                </p>

                <p>
                  <b>Email:</b> {selectedPayslip.employeeId?.email || "-"}
                </p>

                <p>
                  <b>Designation:</b>{" "}
                  {selectedPayslip.employeeId?.designation?.name || "-"}
                </p>

                <p>
                  <b>Department:</b>{" "}
                  {selectedPayslip.employeeId?.department?.name || "-"}
                </p>
              </div>

              <div>
                <p>
                  <b>Month:</b> {selectedPayslip.month} {selectedPayslip.year}
                </p>

                <p>
                  <b>Pay Period:</b> {selectedPayslip.month}{" "}
                  {selectedPayslip.year}
                </p>

                <p>
                  <strong>Status:</strong>{" "}
                  <span
                    className={
                      selectedPayslip.status === "Paid"
                        ? "paid"
                        : selectedPayslip.status === "Approved"
                        ? "approved"
                        : selectedPayslip.status === "Rejected"
                        ? "rejected"
                        : "pending"
                    }
                  >
                    {selectedPayslip.status}
                  </span>
                </p>

                <p>
                  <b>Payment Date:</b>{" "}
                  {selectedPayslip.paymentDate
                    ? new Date(selectedPayslip.paymentDate).toLocaleDateString()
                    : "-"}
                </p>
              </div>
            </div>

            <div className="payment-info">
              <p>
                <b>Total Days:</b> {selectedPayslip.totalDaysInMonth || 0}
              </p>
              <p>
                <b>Present Days:</b> {selectedPayslip.presentDays || 0}
              </p>
              <p>
                <b>Absent Days:</b> {selectedPayslip.absentDays || 0}
              </p>
              <p>
                <b>Half Days:</b> {selectedPayslip.halfDays || 0}
              </p>
              <p>
                <b>Leave Days:</b> {selectedPayslip.leaveDays || 0}
              </p>
              <p>
                <b>Overtime Hours:</b> {selectedPayslip.overtimeHours || 0}
              </p>
            </div>

            <div className="salary-grid">
              <div className="salary-row">
                <span>Basic Salary</span>
                <span>₹ {selectedPayslip.basicSalary || 0}</span>
              </div>

              <div className="salary-row">
                <span>HRA</span>
                <span>₹ {selectedPayslip.hra || 0}</span>
              </div>

              <div className="salary-row">
                <span>DA</span>
                <span>₹ {selectedPayslip.da || 0}</span>
              </div>

              <div className="salary-row">
                <span>Bonus</span>
                <span>₹ {selectedPayslip.bonus || 0}</span>
              </div>

              <div className="salary-row">
                <span>Overtime</span>
                <span>₹ {selectedPayslip.overtime || 0}</span>
              </div>

              <div className="salary-row">
                <span>PF</span>
                <span>₹ {selectedPayslip.pf || 0}</span>
              </div>

              <div className="salary-row">
                <span>Professional Tax</span>
                <span>₹ {selectedPayslip.professionalTax || 0}</span>
              </div>

              <div className="salary-row">
                <span>Leave Deduction</span>
                <span>₹ {selectedPayslip.leaveDeduction || 0}</span>
              </div>

              <div className="salary-row">
                <span>Half Day Deduction</span>
                <span>₹ {selectedPayslip.halfDayDeduction || 0}</span>
              </div>

              <div className="salary-row">
                <span>Other Deduction</span>
                <span>₹ {selectedPayslip.otherDeduction || 0}</span>
              </div>

              <div className="salary-total" style={{backgroundColor:"orange"}}>
                <span>Total Deduction</span>
                <span>₹ {selectedPayslip.totalDeduction || 0}</span>
              </div>
              
              <div className="salary-total" style={{backgroundColor:"blue"}} >
                <span>Gross Salary</span>
                <span>₹ {selectedPayslip.grossSalary || 0}</span>
              </div>

              <div className="salary-total net">
                <span>Net Salary</span>
                <span>₹ {selectedPayslip.netSalary || 0}</span>
              </div>
            </div>

            <div className="payment-info">
              <p>
                <b>Status:</b>{" "}
                <span
                  className={
                    selectedPayslip.status === "Paid"
                      ? "paid"
                      : selectedPayslip.status === "Approved"
                      ? "approved"
                      : selectedPayslip.status === "Rejected"
                      ? "rejected"
                      : "pending"
                  }
                >
                  {selectedPayslip.status}
                </span>
              </p>

              <p>
                <b>Payment Mode:</b> {selectedPayslip.paymentMode || "-"}
              </p>

              <p>
                <b>Payment Date:</b>{" "}
                {selectedPayslip.paymentDate
                  ? new Date(selectedPayslip.paymentDate).toLocaleDateString()
                  : "-"}
              </p>
            </div>

            <div className="modal-buttons no-print">
              <button className="download-btn" onClick={handleDownloadPDF}>
                Download PDF
              </button>

              <button className="print-btn" onClick={() => window.print()}>
                Print
              </button>

              <button
                className="close-btn"
                onClick={() => {
                  setShowPayslip(false);
                  setSelectedPayslip(null);
                }}
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

export default PayrollList;