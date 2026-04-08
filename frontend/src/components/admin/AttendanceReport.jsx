import React, { useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "../../style/AttendanceReport.css";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const AttendanceReport = () => {
  const [month, setMonth] = useState("");

  const token = localStorage.getItem("token");

  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };

  const generatePDF = async () => {
    if (!month) {
      alert("Please select a month");
      return;
    }

    try {
      const res = await axios.get(
        "https://employee-analysis-system-1.onrender.com//api/admin/attendance",
        config
      );

      const filtered = res.data.filter((item) => {
        const d = new Date(item.date);
        const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        return yearMonth === month;
      });

      if (filtered.length === 0) {
        alert("No attendance records found for selected month");
        return;
      }

      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.text("Monthly Attendance Report", 14, 18);

      doc.setFontSize(11);
      doc.text(`Month: ${month}`, 14, 28);

      autoTable(doc, {
        startY: 36,
        head: [["Name", "Date", "Status", "In", "Out", "Hours", "Late", "Type"]],
        body: filtered.map((item) => [
          item.employeeId
            ? `${item.employeeId.firstName} ${item.employeeId.lastName}`
            : "N/A",
          new Date(item.date).toLocaleDateString(),
          item.status || "-",
          item.inTime || "-",
          item.outTime || "-",
          item.workingHours ?? 0,
          item.lateMinutes ?? 0,
          item.attendanceType || "Manual"
        ])
      });

      doc.save(`monthly-attendance-${month}.pdf`);
    } catch (error) {
      console.error(error);
      alert("Error generating PDF ❌");
    }
  };

  const generateExcel = async () => {
  if (!month) {
    alert("Please select a month");
    return;
  }

  try {
    const res = await axios.get(
      "https://employee-analysis-system-1.onrender.com//api/admin/attendance",
      config
    );

    const filtered = res.data.filter((item) => {
      const d = new Date(item.date);
      const yearMonth = `${d.getFullYear()}-${String(
        d.getMonth() + 1
      ).padStart(2, "0")}`;
      return yearMonth === month;
    });

    if (filtered.length === 0) {
      alert("No data found");
      return;
    }

    // 👉 Excel data format
    const excelData = filtered.map((item) => ({
      Name: item.employeeId
        ? `${item.employeeId.firstName} ${item.employeeId.lastName}`
        : "N/A",
      Date: new Date(item.date).toLocaleDateString(),
      Status: item.status,
      InTime: item.inTime,
      OutTime: item.outTime,
      WorkingHours: item.workingHours || 0,
      LateMinutes: item.lateMinutes || 0,
      Type: item.attendanceType || "Office",
    }));

    // 👉 Sheet create
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

    // 👉 File generate
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const fileData = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(fileData, `Attendance-${month}.xlsx`);
  } catch (error) {
    console.error(error);
    alert("Excel generation failed ❌");
  }
};

  return (
    <div className="monthly-report-page">
      <div className="monthly-report-card">
        <h2>Monthly Attendance Report</h2>
        <p className="report-subtitle">
          Select month and generate attendance PDF report.
        </p>

        <div className="report-form">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />

          <button onClick={generatePDF} className="report-btn">
            Generate PDF
          </button>
          <button onClick={generateExcel} className="report-btn excel-btn">
  Download Excel
</button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceReport;