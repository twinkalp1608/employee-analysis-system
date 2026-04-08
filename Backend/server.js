require("dotenv").config();

const nodemailer = require("nodemailer");
// OTP Generation Function
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
}

// Nodemailer Setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const fs = require("fs");
const bcrypt = require("bcrypt");
const axios = require("axios");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const Razorpay = require("razorpay");
const crypto = require("crypto");

function drawPdfTable(doc, rows, startY) {
  const pageWidth = doc.page.width;
  const margin = 30;
  const usableWidth = pageWidth - margin * 2;

  const columns = [
    { key: "employeeName", label: "Employee", width: 120 },
    { key: "department", label: "Department", width: 90 },
    { key: "date", label: "Date", width: 90 },
    { key: "status", label: "Status", width: 80 },
    {
      key: "details",
      label: "Details",
      width: usableWidth - (120 + 90 + 90 + 80),
    },
  ];

  let y = startY;

  const drawHeader = () => {
    doc.fillColor("#0F4C81").rect(margin, y, usableWidth, 24).fill();

    let x = margin;
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(10);

    columns.forEach((col) => {
      doc.text(col.label, x + 6, y + 7, {
        width: col.width - 12,
        ellipsis: true,
      });
      x += col.width;
    });

    y += 24;
  };

  const addNewPageWithHeader = () => {
    doc.addPage({ size: "A4", layout: "landscape", margin: 30 });
    y = 30;
    drawHeader();
  };

  drawHeader();

  rows.forEach((row, index) => {
    const values = columns.map((col) => String(row[col.key] ?? "-"));

    const heights = values.map((value, i) =>
      doc.heightOfString(value, {
        width: columns[i].width - 12,
        align: "left",
      }),
    );

    const rowHeight = Math.max(28, ...heights) + 10;

    if (y + rowHeight > doc.page.height - 50) {
      addNewPageWithHeader();
    }

    doc
      .fillColor(index % 2 === 0 ? "#F8FAFC" : "#FFFFFF")
      .rect(margin, y, usableWidth, rowHeight)
      .fill();

    doc
      .strokeColor("#D9E2EC")
      .lineWidth(0.6)
      .rect(margin, y, usableWidth, rowHeight)
      .stroke();

    let x = margin;
    doc.fillColor("#1F2937").font("Helvetica").fontSize(9);

    columns.forEach((col, i) => {
      doc.text(values[i], x + 6, y + 5, {
        width: col.width - 12,
        align: "left",
      });

      doc
        .moveTo(x + col.width, y)
        .lineTo(x + col.width, y + rowHeight)
        .strokeColor("#E5E7EB")
        .stroke();

      x += col.width;
    });

    y += rowHeight;
  });

  return y;
}

const app = express();
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

const path = require("path");
app.use("/uploads", express.static("uploads"));

app.get("/api/download-resume/:filename", (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);

    let filePath;

    // jo DB ma "uploads/filename.pdf" save hoy
    if (filename.startsWith("uploads/")) {
      filePath = path.join(__dirname, filename);
    } else {
      // jo DB ma khali filename.pdf save hoy
      filePath = path.join(__dirname, "uploads", filename);
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Resume file not found" });
    }

    res.download(filePath);
  } catch (error) {
    console.error("Error downloading resume:", error);
    res.status(500).json({ message: "Error downloading resume" });
  }
});

const SECRET_KEY = process.env.JWT_SECRET || "MY_SECRET_KEY";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/* ==============================
        🔹 MongoDB Connection
      ============================== */



mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch((err) => console.log("MongoDB Error:", err.message));
/* ==============================
        🔹 Schema
      ============================== */

const LoginSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, required: true },
    password: { type: String, required: true },
    otp: Number,
    otpExpiry: Date, // 👈 AHI ADD KARVU
  },
  { timestamps: true },
);

// Employee Schema
const EmployeeSchema = new mongoose.Schema(
  {
    employeeId: String,
    firstName: String,
    lastName: String,
    email: { type: String, unique: true },
    mobile: String,
    gender: String,
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },
    designation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Designation",
    },
    shift: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shift",
      default: null,
    },
    joiningDate: Date,
    salary: Number,
    role: {
      type: String,
      default: "employee",
    },
    status: String,
    password: String,
    address: String,
    dob: Date,
    resume: String,
    profilePhoto: String,
  },
  { timestamps: true },
);

// Department Schema
const DepartmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    status: { type: String, default: "Active" },
  },
  { timestamps: true },
);

// Designation schema
const DesignationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    status: { type: String, default: "Active" },
  },
  { timestamps: true },
);

// Attendance Schema
const AttendanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["Present", "Absent", "Half-Day", "Leave", "Late", "WFH"],
      required: true,
    },
    inTime: String,
    outTime: String,
    remarks: String,

    workingHours: {
      type: Number,
      default: 0,
    },
    lateMinutes: {
      type: Number,
      default: 0,
    },
    overtimeHours: {
      type: Number,
      default: 0,
    },

    attendanceType: {
      type: String,
      enum: ["Manual", "GPS", "Regularized", "WFH", "Office"],
      default: "Office",
    },

    isRegularized: {
      type: Boolean,
      default: false,
    },
    regularizedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HR",
      default: null,
    },
    regularizationReason: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

// Prevent duplicate attendance (same employee + same date)
AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
// Shift Schema
const ShiftSchema = new mongoose.Schema(
  {
    shiftName: {
      type: String,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    graceMinutes: {
      type: Number,
      default: 10,
    },
    status: {
      type: String,
      default: "Active",
    },
  },
  { timestamps: true },
);

const AttendanceRequestSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    requestedInTime: String,
    requestedOutTime: String,
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HR",
      default: null,
    },
    reviewRemark: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

const OfficeSettingSchema = new mongoose.Schema(
  {
    officeName: String,
    latitude: Number,
    longitude: Number,
    radiusMeters: {
      type: Number,
      default: 100,
    },
  },
  { timestamps: true },
);

const HolidaySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

const QRAttendanceSchema = new mongoose.Schema(
  {
    qrToken: {
      type: String,
      required: true,
      unique: true,
    },
    date: {
      type: Date,
      required: true,
    },
    expiryTime: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

const LiveLocationSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    attendanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attendance",
      default: null,
    },
    workType: {
      type: String,
      enum: ["WFH", "Office"],
      default: "WFH",
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    locationName: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    checkInTime: {
      type: Date,
      default: Date.now,
    },
    checkOutTime: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// Leave Schema
const LeaveSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    leaveType: {
      type: String,
      required: true,
    },
    fromDate: {
      type: Date,
      required: true,
    },
    toDate: {
      type: Date,
      required: true,
    },
    reason: String,
    status: {
      type: String,
      default: "Pending",
    },
  },
  { timestamps: true },
);

// Payroll Schema
const PayrollSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    month: String,
    year: Number,

    basicSalary: Number,
    hra: { type: Number, default: 0 },
    da: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    overtime: { type: Number, default: 0 },

    perDaySalary: Number,
    totalDaysInMonth: Number,
    presentDays: Number,
    absentDays: Number,
    halfDays: Number,
    leaveDays: Number,
    overtimeHours: Number,
    halfDayDeduction: Number,

    grossSalary: Number,

    pf: { type: Number, default: 0 },
    professionalTax: { type: Number, default: 0 },
    leaveDeduction: { type: Number, default: 0 },
    otherDeduction: { type: Number, default: 0 },

    totalDeduction: Number,
    netSalary: Number,

    status: {
      type: String,
      enum: ["Draft", "Pending Approval", "Approved", "Rejected", "Paid"],
      default: "Pending Approval",
    },

    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HR",
      default: null,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },

    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },

    rejectionReason: {
      type: String,
      default: "",
    },

    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    rejectedAt: {
      type: Date,
      default: null,
    },

    paymentMode: String,
    transactionId: String,
    paymentDate: Date,
    upiId: String,
    referenceNumber: String,

    razorpayOrderId: {
      type: String,
      default: "",
    },
    razorpayPaymentId: {
      type: String,
      default: "",
    },
    razorpaySignature: {
      type: String,
      default: "",
    },
    currency: {
      type: String,
      default: "INR",
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Created", "Paid", "Failed"],
      default: "Pending",
    },

    paidDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

PayrollSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

// Task Schema
const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HR",
      required: true,
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },

    startDate: Date,
    deadline: Date,

    status: {
      type: String,
      enum: [
        "Pending",
        "In Progress",
        "Under Review",
        "Completed",
        "Rework Required",
        "Overdue",
      ],
      default: "Pending",
    },

    remarks: {
      type: String,
      default: "",
    },

    attachment: {
      type: String,
      default: "",
    },
    employeeSubmission: {
      type: String,
      default: "",
    },

    submissionRemarks: {
      type: String,
      default: "",
    },

    submittedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// ==============================
// 🔹 Performance Schema
// ==============================

const PerformanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    rating: {
      type: String,
      enum: ["Excellent", "Very Good", "Good", "Average", "Needs Improvement"],
      required: true,
    },

    reviewComment: {
      type: String,
      default: "",
    },

    reviewType: {
      type: String,
      enum: ["Monthly", "Quarterly", "Yearly"],
      default: "Monthly",
    },

    reviewMonth: Number,
    reviewYear: Number,
    reviewQuarter: Number,

    attendanceScore: {
      type: Number,
      default: 0,
    },

    taskScore: {
      type: Number,
      default: 0,
    },

    earlyCompletionBonus: {
      type: Number,
      default: 0,
    },

    leaveDeduction: {
      type: Number,
      default: 0,
    },

    kpiScore: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Draft", "Finalized"],
      default: "Draft",
    },

    finalizedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HR",
    },
  },
  { timestamps: true },
);

PerformanceSchema.index(
  { employee: 1, reviewType: 1, reviewMonth: 1, reviewYear: 1 },
  {
    unique: true,
    partialFilterExpression: { reviewType: "Monthly" },
  },
);

PerformanceSchema.index(
  { employee: 1, reviewType: 1, reviewQuarter: 1, reviewYear: 1 },
  {
    unique: true,
    partialFilterExpression: { reviewType: "Quarterly" },
  },
);

PerformanceSchema.index(
  { employee: 1, reviewType: 1, reviewYear: 1 },
  {
    unique: true,
    partialFilterExpression: { reviewType: "Yearly" },
  },
);
// ==============================
// 🔹 Employee Engagement Schemas
// ==============================

const EngagementSurveySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "createdByModel",
    },
    createdByModel: {
      type: String,
      enum: ["HR"],
      required: true,
      default: "HR",
    },
    surveyFor: {
      type: String,
      enum: ["All", "Department"],
      default: "All",
    },
    targetDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    questions: [
      {
        questionText: {
          type: String,
          required: true,
          trim: true,
        },
        category: {
          type: String,
          enum: [
            "Job Satisfaction",
            "Manager Support",
            "Workload",
            "Work Environment",
            "Team Collaboration",
            "Growth",
            "General",
          ],
          default: "General",
        },
        answerType: {
          type: String,
          enum: ["rating", "text"],
          default: "rating",
        },
      },
    ],
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isAnonymous: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["Draft", "Active", "Closed"],
      default: "Active",
    },
  },
  { timestamps: true },
);

const EngagementResponseSchema = new mongoose.Schema(
  {
    surveyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EngagementSurvey",
      required: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    answers: [
      {
        questionText: {
          type: String,
          default: "",
        },
        category: {
          type: String,
          default: "General",
        },
        answerType: {
          type: String,
          enum: ["rating", "text"],
          default: "rating",
        },
        rating: {
          type: Number,
          min: 1,
          max: 5,
          default: null,
        },
        textAnswer: {
          type: String,
          default: "",
        },
      },
    ],
    overallComment: {
      type: String,
      default: "",
    },
    satisfactionScore: {
      type: Number,
      default: 0,
    },
    workEnvironmentScore: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

// One employee can submit one response per survey
EngagementResponseSchema.index(
  { surveyId: 1, employeeId: 1 },
  { unique: true },
);

/* ==============================
   🔹 Recruitment Schemas
============================== */

const JobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      default: "",
      trim: true,
    },
    type: {
      type: String,
      default: "Full Time",
      trim: true,
    },
    experience: {
      type: String,
      default: "",
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    salaryRange: {
      type: String,
      default: "",
      trim: true,
    },
    openings: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "closed"],
      default: "pending",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HR",
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    rejectionReason: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

const JobApplicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    skills: {
      type: String,
      default: "",
      trim: true,
    },
    experience: {
      type: String,
      default: "",
      trim: true,
    },
    coverLetter: {
      type: String,
      default: "",
      trim: true,
    },
    resume: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["applied", "shortlisted", "interview", "selected", "rejected"],
      default: "applied",
    },
  },
  { timestamps: true },
);

// Same email cannot apply twice for same job
JobApplicationSchema.index({ jobId: 1, email: 1 }, { unique: true });

// Notification Schema
const NotificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        "leave",
        "employee",
        "payroll",
        "attendance",
        "department",
        "designation",
        "task",
        "performance",
        "engagement",
        "recruitment",
      ],
      default: "employee",
    },
    role: {
      type: String,
      enum: ["admin", "hr", "employee"],
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

//GenerateReportSchema
const GeneratedReportSchema = new mongoose.Schema(
  {
    reportType: {
      type: String,
      enum: [
        "Attendance Report",
        "Leave Report",
        "Payroll Report",
        "Performance Report",
      ],
      required: true,
    },
    fromDate: {
      type: Date,
      default: null,
    },
    toDate: {
      type: Date,
      default: null,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    statusFilter: {
      type: String,
      default: "all",
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HR",
      required: true,
    },
    rows: [
      {
        employeeName: String,
        department: String,
        date: String,
        status: String,
        details: String,
      },
    ],
    summary: {
      totalRecords: { type: Number, default: 0 },
      totalActive: { type: Number, default: 0 },
      totalPendingLate: { type: Number, default: 0 },
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

/* ==============================
        🔹 Models
      ============================== */

const Admin = mongoose.model("Admin", LoginSchema, "users");
const HR = mongoose.model("HR", LoginSchema, "hrlogin");
const Employee = mongoose.model("Employee", EmployeeSchema, "employees");
const Department = mongoose.model(
  "Department",
  DepartmentSchema,
  "departments",
);
const Attendance = mongoose.model("Attendance", AttendanceSchema, "attendance");
const Shift = mongoose.model("Shift", ShiftSchema, "shifts");
const AttendanceRequest = mongoose.model(
  "AttendanceRequest",
  AttendanceRequestSchema,
  "attendance_requests",
);
const QRAttendance = mongoose.model(
  "QRAttendance",
  QRAttendanceSchema,
  "qr_attendance",
);
const OfficeSetting = mongoose.model(
  "OfficeSetting",
  OfficeSettingSchema,
  "office_settings",
);

const Holiday = mongoose.model("Holiday", HolidaySchema, "holidays");
const LiveLocation = mongoose.model(
  "LiveLocation",
  LiveLocationSchema,
  "live_locations",
);
const Designation = mongoose.model(
  "Designation",
  DesignationSchema,
  "designations",
);
const Leave = mongoose.model("Leave", LeaveSchema, "leaves");
const Payroll = mongoose.model("Payroll", PayrollSchema, "payroll");
const Task = mongoose.model("Task", TaskSchema, "tasks");
const EngagementSurvey = mongoose.model(
  "EngagementSurvey",
  EngagementSurveySchema,
  "engagement_surveys",
);

const EngagementResponse = mongoose.model(
  "EngagementResponse",
  EngagementResponseSchema,
  "engagement_responses",
);

const Performance = mongoose.model(
  "Performance",
  PerformanceSchema,
  "performance",
);
const Notification = mongoose.model(
  "Notification",
  NotificationSchema,
  "notifications",
);

const Job = mongoose.model("Job", JobSchema, "jobs");
const JobApplication = mongoose.model(
  "JobApplication",
  JobApplicationSchema,
  "job_applications",
);

const GeneratedReport = mongoose.model(
  "GeneratedReport",
  GeneratedReportSchema,
  "generated_reports",
);

/* ==============================
        🔹 VERIFY TOKEN
      ============================== */

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

function timeStringToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}
// Calculate working hours based on inTime and outTime
function calculateWorkingHours(inTime, outTime) {
  if (!inTime || !outTime) return 0;
  const inMinutes = timeStringToMinutes(inTime);
  const outMinutes = timeStringToMinutes(outTime);
  if (outMinutes <= inMinutes) return 0;
  return Number(((outMinutes - inMinutes) / 60).toFixed(2));
}
// Haversine formula to calculate distance between two lat/lon points
function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180;

  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateLateAndStatus(inTime, shift) {
  let lateMinutes = 0;
  let status = "Present";

  if (!inTime || !shift?.startTime) {
    return { lateMinutes, status };
  }

  const shiftStart = timeStringToMinutes(shift.startTime);
  const empIn = timeStringToMinutes(inTime);
  const grace = shift.graceMinutes ?? 10;

  if (empIn > shiftStart + grace) {
    lateMinutes = empIn - (shiftStart + grace);

    // 30 min ya vadhare late = Half-Day
    if (lateMinutes >= 30) {
      status = "Half-Day";
    } else {
      status = "Late";
    }
  }

  return { lateMinutes, status };
}
async function getLocationName(latitude, longitude) {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
      {
        headers: {
          "User-Agent": "HRMS-LiveLocation-App",
        },
      },
    );

    return response.data?.display_name || "Location not found";
  } catch (error) {
    console.error("Reverse geocoding error:", error.message);
    return "Location not found";
  }
}
// Performance Rating Logic
function getAutoRating(score) {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Very Good";
  if (score >= 70) return "Good";
  if (score >= 60) return "Average";
  return "Needs Improvement";
}

function getLeaveDeduction(totalLeaves) {
  if (totalLeaves >= 5) return 10;
  if (totalLeaves >= 3) return 5;
  return 0;
}

function getEarlyCompletionBonus(earlyCompletedTasks) {
  if (earlyCompletedTasks >= 2) return 10;
  if (earlyCompletedTasks >= 1) return 5;
  return 0;
}

function calculateAverage(numbers) {
  if (!numbers || numbers.length === 0) return 0;
  const total = numbers.reduce((sum, num) => sum + Number(num || 0), 0);
  return Number((total / numbers.length).toFixed(2));
}

function getEngagementLevel(score) {
  if (score >= 4.5) return "Excellent";
  if (score >= 4.0) return "Very Good";
  if (score >= 3.0) return "Good";
  if (score >= 2.0) return "Average";
  return "Needs Improvement";
}

function getMonthNumber(monthName) {
  const months = {
    January: 0,
    February: 1,
    March: 2,
    April: 3,
    May: 4,
    June: 5,
    July: 6,
    August: 7,
    September: 8,
    October: 9,
    November: 10,
    December: 11,
  };

  return months[monthName];
}

function getPayrollDateRange(month, year) {
  const monthIndex = getMonthNumber(month);

  if (monthIndex === undefined) {
    return null;
  }

  const startDate = new Date(Number(year), monthIndex, 1);
  const endDate = new Date(Number(year), monthIndex + 1, 1);

  return { startDate, endDate, monthIndex };
}

function formatDate(date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-GB");
}

function formatCurrency(value) {
  return Number(value || 0).toFixed(2);
}

function buildDetails(parts = []) {
  return parts.filter(Boolean).join(" | ");
}

function normalizeRow(row) {
  return {
    employeeName: row.employeeName || "-",
    department: row.department || "-",
    date: row.date || "-",
    status: row.status || "-",
    details: row.details || "-",
  };
}

function ensureValidDateRange(fromDate, toDate) {
  const startDate = fromDate ? new Date(fromDate) : null;
  const endDate = toDate ? new Date(toDate) : null;

  if (startDate && isNaN(startDate.getTime())) {
    throw new Error("Invalid fromDate");
  }

  if (endDate && isNaN(endDate.getTime())) {
    throw new Error("Invalid toDate");
  }

  if (endDate) {
    endDate.setHours(23, 59, 59, 999);
  }

  if (startDate && endDate && startDate > endDate) {
    throw new Error("From date cannot be greater than To date");
  }

  return { startDate, endDate };
}

function isDateBetween(targetDate, startDate, endDate) {
  if (!targetDate) return false;
  const date = new Date(targetDate);
  return (!startDate || date >= startDate) && (!endDate || date <= endDate);
}

function isDateRangeOverlapping(itemStart, itemEnd, filterStart, filterEnd) {
  if (!itemStart || !itemEnd) return false;

  const start = new Date(itemStart);
  const end = new Date(itemEnd);

  if (filterStart && end < filterStart) return false;
  if (filterEnd && start > filterEnd) return false;

  return true;
}

function getStartAndEndOfDay(date = new Date()) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return { startOfDay, endOfDay };
}

function isWeekend(date = new Date()) {
  const day = new Date(date).getDay();
  return day === 0 || day === 6; // Sunday & Saturday
}

async function isHoliday(date = new Date()) {
  const { startOfDay, endOfDay } = getStartAndEndOfDay(date);

  const holiday = await Holiday.findOne({
    date: { $gte: startOfDay, $lte: endOfDay },
    status: "Active",
  });

  return holiday;
}

app.get("/api/notifications/:role", verifyToken, async (req, res) => {
  try {
    const { role } = req.params;

    if (req.user.role !== role) {
      return res.status(403).json({ message: "Access denied" });
    }

    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const notifications = await Notification.find({
      role,
      $or: [
        { isRead: false },
        {
          isRead: true,
          readAt: { $gte: last24Hours },
        },
      ],
    }).sort({ createdAt: -1 });

    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put("/api/notifications/read-all/:role", verifyToken, async (req, res) => {
  try {
    const { role } = req.params;

    if (req.user.role !== role) {
      return res.status(403).json({ message: "Access denied" });
    }

    await Notification.updateMany(
      { role, isRead: false },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
        },
      },
    );

    res.json({ message: "All notifications marked as read ✅" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// // ✅ Create Task (Admin / HR)
// app.post("/api/tasks", verifyToken, async (req, res) => {
//   try {
//     if (req.user.role !== "hr") {
//       return res.status(403).json({ message: "Admin or HR access only" });
//     }

//     const {
//       title,
//       description,
//       assignedTo,
//       priority,
//       startDate,
//       deadline,
//       status,
//     } = req.body;

//     const task = new Task({
//       title,
//       description,
//       assignedTo,
//       priority,
//       startDate: startDate ? new Date(startDate) : null,
//       deadline: deadline ? new Date(deadline) : null,
//       status,
//       createdBy: req.user.id,
//     });

//     await task.save();

//     res.status(201).json({ message: "Task created successfully ✅" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: err.message });
//   }
// });

// // ✅ Get All Tasks (Admin / HR) with Overdue Detection
// app.get("/api/tasks", verifyToken, async (req, res) => {
//   try {

//     if (req.user.role !== "admin" && req.user.role !== "hr") {
//       return res.status(403).json({
//         message: "Admin or HR access only"
//       });
//     }

//     const today = new Date();

//     // 🔥 Automatically mark overdue tasks
//     await Task.updateMany(
//       {
//         deadline: { $lt: today },
//         status: { $ne: "Completed" }
//       },
//       {
//         $set: { status: "Overdue" }
//       }
//     );

//     // Fetch updated tasks
//     const tasks = await Task.find()
//       .populate("assignedTo", "firstName lastName email")
//       .sort({ createdAt: -1 });

//     res.json(tasks);

//   } catch (err) {
//     res.status(500).json({
//       message: err.message
//     });
//   }
// });

// // ✅ Delete Task (Admin / HR)
// app.delete("/api/tasks/:id", verifyToken, async (req, res) => {
//   try {
//     if (req.user.role !== "admin" && req.user.role !== "hr") {
//       return res.status(403).json({ message: "Admin or HR access only" });
//     }

//     const deletedTask = await Task.findByIdAndDelete(req.params.id);

//     if (!deletedTask) {
//       return res.status(404).json({ message: "Task not found" });
//     }

//     res.json({ message: "Task deleted successfully ✅" });

//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // ✅ Update Task (Admin / HR)
// app.put("/api/tasks/:id", verifyToken, async (req, res) => {
//   try {
//     if (req.user.role !== "admin" && req.user.role !== "hr") {
//       return res.status(403).json({ message: "Admin or HR access only" });
//     }

//     const {
//       title,
//       description,
//       assignedTo,
//       priority,
//       startDate,
//       deadline,
//       status,
//     } = req.body;

//     const updatedTask = await Task.findByIdAndUpdate(
//       req.params.id,
//       {
//         title,
//         description,
//         assignedTo,
//         priority,
//         startDate,
//         deadline,
//         status,
//       },
//       { new: true }
//     );

//     if (!updatedTask) {
//       return res.status(404).json({ message: "Task not found" });
//     }

//     res.json({
//       message: "Task updated successfully ✅",
//       task: updatedTask,
//     });

//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // ✅ Employee - Get My Tasks
// app.get("/api/employee/tasks", verifyToken, async (req, res) => {
//   try {

//     if (req.user.role !== "employee") {
//       return res.status(403).json({
//         message: "Employee access only"
//       });
//     }

//     const tasks = await Task.find({
//       assignedTo: req.user.id
//     })
//     .populate("assignedTo", "firstName lastName email")
//     .sort({ createdAt: -1 });

//     res.json(tasks);

//   } catch (err) {
//     res.status(500).json({
//       message: err.message
//     });
//   }
// });

// // ✅ Employee - Update Task Status
// app.put("/api/employee/tasks/:id", verifyToken, async (req, res) => {
//   try {

//     if (req.user.role !== "employee") {
//       return res.status(403).json({
//         message: "Employee access only"
//       });
//     }

//     const { status } = req.body;

//     if (!["Pending", "In Progress", "Completed"].includes(status)) {
//       return res.status(400).json({
//         message: "Invalid status"
//       });
//     }

//     const task = await Task.findOneAndUpdate(
//       {
//         _id: req.params.id,
//         assignedTo: req.user.id
//       },
//       {
//         status: status
//       },
//       {
//         new: true
//       }
//     );

//     if (!task) {
//       return res.status(404).json({
//         message: "Task not found"
//       });
//     }

//     res.json({
//       message: "Task status updated successfully ✅",
//       task
//     });

//   } catch (err) {
//     res.status(500).json({
//       message: err.message
//     });
//   }
// });

// ✅ Create Admin (Temporary - for first time setup)
app.post("/create-admin", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new Admin({
      name,
      email,
      password: hashedPassword,
    });

    await newAdmin.save();

    res.status(201).json({ message: "Admin created successfully 👑" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// "employees" collection

/* ==============================
        🔥 SINGLE LOGIN API
      ============================== */

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 🔹 Check Admin Collection
    // 🔹 Check Admin
    const admin = await Admin.findOne({ email });
    if (admin) {
      const isMatch = await bcrypt.compare(password, admin.password);
      if (isMatch) {
        const token = jwt.sign({ id: admin._id, role: "admin" }, SECRET_KEY, {
          expiresIn: "1h",
        });

        return res.json({
          message: "Admin Login Successful 👑",
          token,
          role: "admin",
          userId: admin._id,
        });
      }
    }

    // 🔹 Check HR
    const hr = await HR.findOne({ email });
    if (hr) {
      const isMatch = await bcrypt.compare(password, hr.password);
      if (isMatch) {
        const token = jwt.sign({ id: hr._id, role: "hr" }, SECRET_KEY, {
          expiresIn: "1h",
        });

        return res.json({
          message: "HR Login Successful 👩‍💼",
          token,
          role: "hr",
          userId: hr._id,
        });
      }
    }

    //Employee check
    // 🔹 Check Employee
    // 🔹 Check Employee
    const employee = await Employee.findOne({ email });

    if (employee) {
      const isMatch = await bcrypt.compare(password, employee.password);

      if (isMatch) {
        const token = jwt.sign(
          { id: employee._id, role: "employee" }, // 👈 AA LINE
          SECRET_KEY,
          { expiresIn: "1h" },
        );

        return res.json({
          message: "Employee Login Successful 👨‍💼",
          token,
          role: "employee",
          userId: employee._id,
        });
      }
    }

    // ❌ If not matched
    return res.status(401).json({
      message: "Invalid Email or Password",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
});

async function generateReportData({
  reportType,
  fromDate,
  toDate,
  department,
  employee,
  status,
  user,
}) {
  const { startDate, endDate } = ensureValidDateRange(fromDate, toDate);

  // =========================
  // ATTENDANCE REPORT
  // =========================
  if (reportType === "Attendance Report") {
    const query = {};

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    if (employee && employee !== "all") {
      query.employeeId = employee;
    }

    if (status && status !== "all") {
      query.status = status;
    }

    let records = await Attendance.find(query)
      .populate({
        path: "employeeId",
        select: "firstName lastName employeeId department designation",
        populate: [
          { path: "department", select: "name" },
          { path: "designation", select: "name" },
        ],
      })
      .sort({ date: -1, createdAt: -1 });

    if (department && department !== "all") {
      records = records.filter(
        (item) =>
          item.employeeId?.department &&
          String(item.employeeId.department._id) === String(department),
      );
    }

    if (user.role === "employee") {
      records = records.filter(
        (item) => String(item.employeeId?._id) === String(user.id),
      );
    }

    const rows = records.map((item) =>
      normalizeRow({
        employeeName: item.employeeId
          ? `${item.employeeId.firstName || ""} ${item.employeeId.lastName || ""}`.trim()
          : "-",
        department: item.employeeId?.department?.name || "-",
        date: formatDate(item.date),
        status: item.status || "-",
        details: buildDetails([
          `Code: ${item.employeeId?.employeeId || "-"}`,
          `Designation: ${item.employeeId?.designation?.name || "-"}`,
          `In: ${item.inTime || "-"}`,
          `Out: ${item.outTime || "-"}`,
          `Working Hours: ${item.workingHours || 0}`,
          `Late: ${item.lateMinutes || 0} min`,
          `Overtime: ${item.overtimeHours || 0} hr`,
          `Remarks: ${item.remarks || "-"}`,
        ]),
      }),
    );

    return {
      rows,
      summary: {
        totalRecords: rows.length,
        totalActive: rows.filter((r) =>
          ["Present", "Late", "WFH"].includes(r.status),
        ).length,
        totalPendingLate: rows.filter((r) =>
          ["Late", "Absent", "Half-Day", "Leave"].includes(r.status),
        ).length,
      },
    };
  }

  // =========================
  // LEAVE REPORT
  // =========================
  if (reportType === "Leave Report") {
    const query = {};

    if (employee && employee !== "all") {
      query.employeeId = employee;
    }

    if (status && status !== "all") {
      query.status = status;
    }

    let records = await Leave.find(query)
      .populate({
        path: "employeeId",
        select: "firstName lastName employeeId department designation",
        populate: [
          { path: "department", select: "name" },
          { path: "designation", select: "name" },
        ],
      })
      .sort({ createdAt: -1 });

    if (startDate || endDate) {
      records = records.filter((item) =>
        isDateRangeOverlapping(item.fromDate, item.toDate, startDate, endDate),
      );
    }

    if (department && department !== "all") {
      records = records.filter(
        (item) =>
          item.employeeId?.department &&
          String(item.employeeId.department._id) === String(department),
      );
    }

    if (user.role === "employee") {
      records = records.filter(
        (item) => String(item.employeeId?._id) === String(user.id),
      );
    }

    const rows = records.map((item) =>
      normalizeRow({
        employeeName: item.employeeId
          ? `${item.employeeId.firstName || ""} ${item.employeeId.lastName || ""}`.trim()
          : "-",
        department: item.employeeId?.department?.name || "-",
        date: `${formatDate(item.fromDate)} to ${formatDate(item.toDate)}`,
        status: item.status || "-",
        details: buildDetails([
          `Code: ${item.employeeId?.employeeId || "-"}`,
          `Designation: ${item.employeeId?.designation?.name || "-"}`,
          `Leave Type: ${item.leaveType || "-"}`,
          `Reason: ${item.reason || "-"}`,
        ]),
      }),
    );

    return {
      rows,
      summary: {
        totalRecords: rows.length,
        totalActive: rows.filter((r) => r.status === "Approved").length,
        totalPendingLate: rows.filter((r) => r.status === "Pending").length,
      },
    };
  }

  // =========================
  // PAYROLL REPORT
  // =========================
  if (reportType === "Payroll Report") {
    const query = {};

    if (employee && employee !== "all") {
      query.employeeId = employee;
    }

    if (status && status !== "all") {
      query.status = status;
    }

    let records = await Payroll.find(query)
      .populate({
        path: "employeeId",
        select: "firstName lastName employeeId department designation",
        populate: [
          { path: "department", model: "Department", select: "name" },
          { path: "designation", model: "Designation", select: "name" },
        ],
      })
      .sort({ createdAt: -1 });

    if (department && department !== "all") {
      records = records.filter(
        (item) =>
          item.employeeId?.department &&
          String(item.employeeId.department._id) === String(department),
      );
    }

    if (reportType === "Leave Report") {
      const query = {};

      if (employee && employee !== "all") {
        query.employeeId = employee;
      }

      if (status && status !== "all") {
        query.status = status;
      }

      let records = await Leave.find(query)
        .populate({
          path: "employeeId",
          select: "firstName lastName employeeId department designation",
          populate: [
            { path: "department", select: "name" },
            { path: "designation", select: "name" },
          ],
        })
        .sort({ createdAt: -1 });

      if (startDate || endDate) {
        records = records.filter((item) =>
          isDateRangeOverlapping(
            item.fromDate,
            item.toDate,
            startDate,
            endDate,
          ),
        );
      }

      if (department && department !== "all") {
        records = records.filter(
          (item) =>
            item.employeeId?.department &&
            String(item.employeeId.department._id) === String(department),
        );
      }

      if (user.role === "employee") {
        records = records.filter(
          (item) => String(item.employeeId?._id) === String(user.id),
        );
      }

      const rows = records.map((item) =>
        normalizeRow({
          employeeName: item.employeeId
            ? `${item.employeeId.firstName || ""} ${item.employeeId.lastName || ""}`.trim()
            : "-",
          department: item.employeeId?.department?.name || "-",
          date: `${formatDate(item.fromDate)} to ${formatDate(item.toDate)}`,
          status: item.status || "-",
          details: buildDetails([
            `Code: ${item.employeeId?.employeeId || "-"}`,
            `Designation: ${item.employeeId?.designation?.name || "-"}`,
            `Leave Type: ${item.leaveType || "-"}`,
            `Reason: ${item.reason || "-"}`,
          ]),
        }),
      );

      return {
        rows,
        summary: {
          totalRecords: rows.length,
          totalActive: rows.filter((r) => r.status === "Approved").length,
          totalPendingLate: rows.filter((r) => r.status === "Pending").length,
        },
      };
    }

    if (user.role === "employee") {
      records = records.filter(
        (item) => String(item.employeeId?._id) === String(user.id),
      );
    }

    const rows = records.map((item) =>
      normalizeRow({
        employeeName: item.employeeId
          ? `${item.employeeId.firstName || ""} ${item.employeeId.lastName || ""}`.trim()
          : "-",
        department: item.employeeId?.department?.name || "-",
        date: `${item.month || "-"} ${item.year || "-"}`,
        status: item.status || "-",
        details: buildDetails([
          `Code: ${item.employeeId?.employeeId || "-"}`,
          `Designation: ${item.employeeId?.designation?.name || "-"}`,
          `Gross: ₹${formatCurrency(item.grossSalary)}`,
          `Deduction: ₹${formatCurrency(item.totalDeduction)}`,
          `Net: ₹${formatCurrency(item.netSalary)}`,
          `Payment Mode: ${item.paymentMode || "-"}`,
          `Payment Date: ${formatDate(item.paymentDate)}`,
        ]),
      }),
    );

    return {
      rows,
      summary: {
        totalRecords: rows.length,
        totalActive: rows.filter((r) => ["Approved", "Paid"].includes(r.status))
          .length,
        totalPendingLate: rows.filter((r) =>
          ["Pending Approval", "Rejected", "Draft"].includes(r.status),
        ).length,
      },
    };
  }

  // =========================
  // PERFORMANCE REPORT
  // =========================
  if (reportType === "Performance Report") {
    const query = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (user.role === "hr") {
      query.createdBy = user.id;
    }

    if (user.role === "employee") {
      query.employee = user.id;
    }

    if (employee && employee !== "all") {
      query.employee = employee;
    }

    let records = await Performance.find(query)
      .populate({
        path: "employee",
        select: "firstName lastName employeeId department designation",
        populate: [
          { path: "department", select: "name" },
          { path: "designation", select: "name" },
        ],
      })
      .sort({ createdAt: -1 });

    if (department && department !== "all") {
      records = records.filter(
        (item) =>
          item.employee?.department &&
          String(item.employee.department._id) === String(department),
      );
    }

    if (startDate || endDate) {
      records = records.filter((item) => {
        const performanceDate = item.finalizedAt || item.createdAt;
        return isDateBetween(performanceDate, startDate, endDate);
      });
    }

    const rows = records.map((item) =>
      normalizeRow({
        employeeName: item.employee
          ? `${item.employee.firstName || ""} ${item.employee.lastName || ""}`.trim()
          : "-",
        department: item.employee?.department?.name || "-",
        date:
          item.reviewType === "Monthly"
            ? `${item.reviewType} - ${item.reviewMonth || "-"} / ${item.reviewYear || "-"}`
            : item.reviewType === "Quarterly"
              ? `${item.reviewType} - Q${item.reviewQuarter || "-"} / ${item.reviewYear || "-"}`
              : `${item.reviewType || "-"} - ${item.reviewYear || "-"}`,
        status: item.status || "-",
        details: buildDetails([
          `Code: ${item.employee?.employeeId || "-"}`,
          `Designation: ${item.employee?.designation?.name || "-"}`,
          `Rating: ${item.rating || "-"}`,
          `KPI: ${item.kpiScore || 0}`,
          `Attendance Score: ${item.attendanceScore || 0}`,
          `Task Score: ${item.taskScore || 0}`,
          `Comment: ${item.reviewComment || "-"}`,
        ]),
      }),
    );

    return {
      rows,
      summary: {
        totalRecords: rows.length,
        totalActive: rows.filter((r) => r.status === "Finalized").length,
        totalPendingLate: rows.filter((r) => r.status === "Draft").length,
      },
    };
  }

  return {
    rows: [],
    summary: {
      totalRecords: 0,
      totalActive: 0,
      totalPendingLate: 0,
    },
  };
}

app.post("/api/reports/generate-and-save", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "hr") {
      return res.status(403).json({ message: "Only HR can generate reports" });
    }

    const {
      reportType,
      fromDate,
      toDate,
      department = "all",
      employee = "all",
      status = "all",
    } = req.body;

    if (
      ![
        "Attendance Report",
        "Leave Report",
        "Payroll Report",
        "Performance Report",
      ].includes(reportType)
    ) {
      return res.status(400).json({ message: "Invalid report type" });
    }

    const result = await generateReportData({
      reportType,
      fromDate,
      toDate,
      department,
      employee,
      status,
      user: req.user,
    });

    const savedReport = new GeneratedReport({
      reportType,
      fromDate: fromDate || null,
      toDate: toDate || null,
      department: department !== "all" ? department : null,
      employee: employee !== "all" ? employee : null,
      statusFilter: status || "all",
      generatedBy: req.user.id,
      rows: result.rows,
      summary: result.summary,
      generatedAt: new Date(),
    });

    await savedReport.save();

    res.status(201).json({
      message: "Report generated and saved successfully ✅",
      report: savedReport,
      rows: result.rows,
      summary: result.summary,
    });
  } catch (err) {
    console.error("Generate and save report error:", err);
    res.status(500).json({ message: err.message || "Failed to save report" });
  }
});

app.get("/api/reports/saved", verifyToken, async (req, res) => {
  try {
    if (!["admin", "hr"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    let query = {};

    if (req.user.role === "hr") {
      query.generatedBy = req.user.id;
    }

    const reports = await GeneratedReport.find(query)
      .populate("generatedBy", "name email")
      .populate("department", "name")
      .populate("employee", "firstName lastName")
      .sort({ generatedAt: -1 });

    res.json(reports);
  } catch (err) {
    console.error("Fetch saved reports error:", err);
    res
      .status(500)
      .json({ message: err.message || "Failed to fetch saved reports" });
  }
});

app.get("/api/reports/saved/:id", verifyToken, async (req, res) => {
  try {
    if (!["admin", "hr"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const report = await GeneratedReport.findById(req.params.id)
      .populate("generatedBy", "name email")
      .populate("department", "name")
      .populate("employee", "firstName lastName");

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (
      req.user.role === "hr" &&
      String(report.generatedBy?._id) !== String(req.user.id)
    ) {
      return res
        .status(403)
        .json({ message: "You can only view your own reports" });
    }

    res.json(report);
  } catch (err) {
    console.error("Fetch saved report detail error:", err);
    res
      .status(500)
      .json({ message: err.message || "Failed to fetch report detail" });
  }
});

app.post("/api/reports/generate", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({
        message: "Direct report generation is not allowed for this role",
      });
    }

    const {
      reportType,
      fromDate,
      toDate,
      department = "all",
      employee = "all",
      status = "all",
    } = req.body;

    if (
      ![
        "Attendance Report",
        "Leave Report",
        "Payroll Report",
        "Performance Report",
      ].includes(reportType)
    ) {
      return res.status(400).json({ message: "Invalid report type" });
    }

    const result = await generateReportData({
      reportType,
      fromDate,
      toDate,
      department,
      employee,
      status,
      user: req.user,
    });

    res.json({
      message: "Report generated successfully ✅",
      rows: result.rows,
      summary: result.summary,
    });
  } catch (err) {
    console.error("Generate report error:", err);
    res
      .status(500)
      .json({ message: err.message || "Failed to generate report" });
  }
});

app.get("/api/reports/export-excel/:id", verifyToken, async (req, res) => {
  try {
    if (!["admin", "hr"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const report = await GeneratedReport.findById(req.params.id)
      .populate("generatedBy", "name email")
      .populate("department", "name")
      .populate("employee", "firstName lastName");

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (
      req.user.role === "hr" &&
      String(report.generatedBy?._id) !== String(req.user.id)
    ) {
      return res
        .status(403)
        .json({ message: "You can only export your own reports" });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Report");

    worksheet.addRow([report.reportType || "Report"]);
    worksheet.addRow([
      `From Date: ${report.fromDate ? formatDate(report.fromDate) : "-"}`,
    ]);
    worksheet.addRow([
      `To Date: ${report.toDate ? formatDate(report.toDate) : "-"}`,
    ]);
    worksheet.addRow([`Generated By: ${report.generatedBy?.name || "-"}`]);
    worksheet.addRow([]);

    worksheet.columns = [
      { header: "Employee", key: "employeeName", width: 28 },
      { header: "Department", key: "department", width: 22 },
      { header: "Date", key: "date", width: 25 },
      { header: "Status", key: "status", width: 20 },
      { header: "Details", key: "details", width: 90 },
    ];

    if (report.rows.length > 0) {
      report.rows.forEach((row) => worksheet.addRow(row));
    } else {
      worksheet.addRow({
        employeeName: "No report data available",
        department: "",
        date: "",
        status: "",
        details: "",
      });
    }

    worksheet.addRow([]);
    worksheet.addRow(["Total Records", report.summary.totalRecords]);
    worksheet.addRow(["Total Active", report.summary.totalActive]);
    worksheet.addRow(["Pending / Late", report.summary.totalPendingLate]);

    worksheet.getRow(1).font = { bold: true, size: 16 };
    worksheet.getRow(6).font = { bold: true };

    const fileName = `${(report.reportType || "Report").replace(/\s+/g, "_")}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Excel export error:", err);
    res.status(500).json({ message: err.message || "Excel export failed" });
  }
});

app.get("/api/reports/export-pdf/:id", verifyToken, async (req, res) => {
  try {
    if (!["admin", "hr"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const report = await GeneratedReport.findById(req.params.id)
      .populate("generatedBy", "name email")
      .populate("department", "name")
      .populate("employee", "firstName lastName");

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (
      req.user.role === "hr" &&
      String(report.generatedBy?._id) !== String(req.user.id)
    ) {
      return res
        .status(403)
        .json({ message: "You can only export your own reports" });
    }

    let signerName = "HR Manager";
    if (report.generatedBy?.name) {
      signerName = report.generatedBy.name;
    }

    const fileName = `${(report.reportType || "Report").replace(/\s+/g, "_")}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 30,
      bufferPages: true,
    });

    doc.on("error", (err) => {
      console.error("PDF document error:", err);
    });

    doc.pipe(res);

    const generatedOn = new Date(report.generatedAt).toLocaleString("en-GB");
    const margin = 30;
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const contentWidth = pageWidth - margin * 2;

    doc.rect(0, 0, pageWidth, 78).fill("#0F4C81");

    doc
      .fillColor("#FFFFFF")
      .font("Helvetica-Bold")
      .fontSize(24)
      .text("TechnoGuide Pvt. Ltd.", margin, 20, {
        width: contentWidth,
        align: "left",
      });

    doc.font("Helvetica").fontSize(10).text("Professional Report", margin, 50, {
      width: contentWidth,
      align: "left",
    });

    doc
      .fillColor("#111827")
      .font("Helvetica-Bold")
      .fontSize(22)
      .text(report.reportType || "Report", margin, 92, {
        width: contentWidth,
        align: "center",
      });

    doc.roundedRect(margin, 132, contentWidth, 46, 8).fill("#F8FAFC");
    doc.roundedRect(margin, 132, contentWidth, 46, 8).stroke("#D1D5DB");

    doc
      .fillColor("#4B5563")
      .font("Helvetica")
      .fontSize(10)
      .text(`Generated On: ${generatedOn}`, margin + 12, 144)
      .text(
        `From Date: ${report.fromDate ? formatDate(report.fromDate) : "All"}`,
        margin + 12,
        160,
      )
      .text(
        `To Date: ${report.toDate ? formatDate(report.toDate) : "All"}`,
        margin + 180,
        160,
      )
      .text(
        `Department: ${report.department?.name || "All Departments"}`,
        margin + 350,
        160,
      )
      .text(
        `Employee: ${
          report.employee
            ? `${report.employee.firstName || ""} ${report.employee.lastName || ""}`.trim()
            : "All Employees"
        }`,
        margin + 560,
        160,
      );

    let finalY = 240;

    if (!report.rows || report.rows.length === 0) {
      doc
        .fillColor("#9CA3AF")
        .font("Helvetica")
        .fontSize(12)
        .text("No report data available", margin, 220, {
          width: contentWidth,
          align: "center",
        });
    } else {
      try {
        finalY = drawPdfTable(doc, report.rows, 195);
      } catch (tableError) {
        console.error("Table draw error:", tableError);
        doc
          .fillColor("#DC2626")
          .font("Helvetica")
          .fontSize(12)
          .text("Failed to render report table", margin, 220, {
            width: contentWidth,
            align: "center",
          });
      }
    }

    const signatureY = Math.max(finalY + 30, pageHeight - 110);

    if (signatureY < pageHeight - 45) {
      doc
        .strokeColor("#9CA3AF")
        .moveTo(pageWidth - 240, signatureY)
        .lineTo(pageWidth - 80, signatureY)
        .stroke();

      doc
        .fillColor("#111827")
        .font("Helvetica-Bold")
        .fontSize(10)
        .text(signerName, pageWidth - 235, signatureY + 8, {
          width: 160,
          align: "center",
        });

      doc
        .fillColor("#6B7280")
        .font("Helvetica")
        .fontSize(9)
        .text("Authorized Signatory", pageWidth - 235, signatureY + 22, {
          width: 160,
          align: "center",
        });
    }

    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(i);

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#6B7280")
        .text(`Page ${i + 1} of ${range.count}`, 0, doc.page.height - 22, {
          width: doc.page.width,
          align: "center",
        });
    }

    doc.end();
  } catch (err) {
    console.error("PDF export error:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: err.message || "PDF export failed" });
    }
  }
});

app.get("/api/departments", verifyToken, async (req, res) => {
  try {
    const departments = await Department.find({ status: "Active" }).sort({
      name: 1,
    });
    res.json(departments);
  } catch (err) {
    console.error("Fetch departments error:", err);
    res.status(500).json({ message: "Failed to fetch departments" });
  }
});

app.get(
  "/api/job-titles/by-department/:departmentId",
  verifyToken,
  async (req, res) => {
    try {
      const { departmentId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(departmentId)) {
        return res.status(400).json({ message: "Invalid department id" });
      }

      const jobTitles = await Designation.find({
        department: departmentId,
        status: "Active",
      })
        .select("name department")
        .sort({ name: 1 });

      res.json(jobTitles);
    } catch (err) {
      console.error("Fetch job titles by department error:", err);
      res.status(500).json({ message: "Failed to fetch job titles" });
    }
  },
);

app.get("/api/job-titles", verifyToken, async (req, res) => {
  try {
    const jobTitles = await Designation.find({ status: "Active" })
      .populate("department", "name")
      .sort({ name: 1 });

    res.json(jobTitles);
  } catch (err) {
    console.error("Fetch job titles error:", err);
    res.status(500).json({ message: "Failed to fetch job titles" });
  }
});

app.get("/api/employees", verifyToken, async (req, res) => {
  try {
    let query = {};

    // employee login hoy to potano data j male
    if (req.user.role === "employee") {
      query._id = req.user.id;
    }

    const employees = await Employee.find(query)
      .populate("department", "name")
      .populate("designation", "name")
      .sort({ firstName: 1, lastName: 1 });

    res.json(employees);
  } catch (err) {
    console.error("Fetch employees error:", err);
    res.status(500).json({ message: "Failed to fetch employees" });
  }
});

app.get(
  "/api/employees/by-department/:departmentId",
  verifyToken,
  async (req, res) => {
    try {
      const { departmentId } = req.params;

      let query = {
        department: departmentId,
      };

      if (req.user.role === "employee") {
        query._id = req.user.id;
        query.department = departmentId;
      }

      const employees = await Employee.find(query)
        .populate("department", "name")
        .populate("designation", "name")
        .sort({ firstName: 1, lastName: 1 });

      res.json(employees);
    } catch (err) {
      console.error("Fetch employees by department error:", err);
      res
        .status(500)
        .json({ message: "Failed to fetch employees by department" });
    }
  },
);

/* ==============================
        🔹 Multer Setup
      ============================== */

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// ✅ Public - Get all approved jobs
app.get("/api/jobs", async (req, res) => {
  try {
    const jobs = await Job.find({ status: "approved" }).sort({ createdAt: -1 });

    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Public - Get single job details
app.get("/api/jobs/:id", async (req, res) => {
  try {
    const job = await Job.findOne({
      _id: req.params.id,
      status: "approved",
    });

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json({ job });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Public - Apply for job
app.post("/api/candidates/apply", upload.single("resume"), async (req, res) => {
  try {
    const { jobId, fullName, email, phone, skills, experience, coverLetter } =
      req.body;

    if (!jobId || !fullName || !email || !phone) {
      return res.status(400).json({
        message: "jobId, fullName, email and phone are required",
      });
    }

    const job = await Job.findById(jobId);

    if (!job || job.status !== "approved") {
      return res.status(404).json({ message: "Job not available" });
    }

    const existingApplication = await JobApplication.findOne({
      jobId,
      email,
    });

    if (existingApplication) {
      return res.status(400).json({
        message: "You have already applied for this job",
      });
    }

    const newApplication = new JobApplication({
      jobId,
      fullName,
      email,
      phone,
      skills,
      experience,
      coverLetter,
      resume: req.file ? "uploads/" + req.file.filename : "",
    });

    await newApplication.save();

    await Notification.create({
      title: "New Job Application",
      message: `${fullName} applied for ${job.title}.`,
      type: "recruitment",
      role: "hr",
    });

    await Notification.create({
      title: "Recruitment Update",
      message: `New candidate applied for ${job.title}.`,
      type: "recruitment",
      role: "admin",
    });

    res.status(201).json({
      message: "Application submitted successfully ✅",
      application: newApplication,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        message: "You have already applied for this job",
      });
    }

    res.status(500).json({ message: err.message });
  }
});

/* ==============================
        🔹 Protected Routes
      ============================== */

// ✅ Admin Dashboard
app.get("/api/admin-dashboard", verifyToken, (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access only" });
  }

  res.json({
    message: "Welcome Admin 👑",
    user: req.user,
  });
});

// ✅ HR Dashboard
app.get("/api/hr-dashboard", verifyToken, (req, res) => {
  if (req.user.role !== "hr") {
    return res.status(403).json({ message: "HR access only" });
  }

  res.json({
    message: "Welcome HR 👩‍💼",
    user: req.user,
  });
});

// ✅ Employee Dashboard
app.get("/api/employee-dashboard", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ message: "Employee access only" });
    }

    const employeeId = req.user.id;

    const employee = await Employee.findById(employeeId)
      .populate("department", "name")
      .populate("designation", "name");

    const attendance = await Attendance.find({ employeeId }).sort({ date: -1 });

    // Attendance Summary Count
    const totalDays = attendance.length;
    const present = attendance.filter((a) => a.status === "Present").length;
    const absent = attendance.filter((a) => a.status === "Absent").length;
    const leave = attendance.filter((a) => a.status === "Leave").length;
    const halfDay = attendance.filter((a) => a.status === "Half-Day").length;
    const late = attendance.filter((a) => a.status === "Late").length;

    res.json({
      employee,
      attendance,
      summary: {
        totalDays,
        present,
        absent,
        leave,
        halfDay,
        late,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ==============================
        🔹 Add Employee API
      ============================== */

app.post(
  "/api/employees",
  verifyToken,
  upload.fields([
    { name: "resume", maxCount: 1 },
    { name: "profilePhoto", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      console.log("BODY:", req.body);
      console.log("FILES:", req.files);

      if (!req.body.email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const existingEmail = await Employee.findOne({ email: req.body.email });
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      let assignedShift = req.body.shift || null;

      if (!assignedShift) {
        const defaultShift = await Shift.findOne({ status: "Active" }).sort({
          createdAt: -1,
        });

        if (defaultShift) {
          assignedShift = defaultShift._id;
        }
      }

      const newEmployee = new Employee({
        employeeId: req.body.employeeId,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        mobile: req.body.mobile,
        gender: req.body.gender,
        department: req.body.department,
        designation: req.body.designation,
        shift: assignedShift,
        joiningDate: new Date(req.body.joiningDate), // Convert string to Date
        salary: Number(req.body.salary), // Convert string to Number
        role: "employee",
        status: req.body.status,
        password: await bcrypt.hash(req.body.password, 10),
        address: req.body.address,
        dob: new Date(req.body.dob), // Convert string to Date
        resume: req.files?.resume
          ? "uploads/" + req.files.resume[0].filename
          : "",
        profilePhoto: req.files?.profilePhoto
          ? "uploads/" + req.files.profilePhoto[0].filename
          : "",
      });
      await newEmployee.save();

      await Notification.create({
        title: "New Employee Added",
        message: `${req.body.firstName} ${req.body.lastName} has been added successfully.`,
        type: "employee",
        role: "admin",
      });

      await Notification.create({
        title: "Employee Added Successfully",
        message: `${req.body.firstName} ${req.body.lastName} has been added successfully.`,
        type: "employee",
        role: "hr",
      });

      res.status(201).json({ message: "Employee Added Successfully ✅" });
    } catch (error) {
      console.log("SERVER ERROR:", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  },
);

// ✅ Get All Employees
app.get("/api/employees", verifyToken, async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate("department", "name")
      .populate("designation", "name")
      .populate("shift", "shiftName startTime endTime graceMinutes");
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// ✅ Get Single Employee
app.get("/api/employees/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const employee = await Employee.findById(id)
      .populate("department", "name")
      .populate("designation", "name")
      .populate("shift", "shiftName startTime endTime graceMinutes");
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.json(employee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Update Employee
// ✅ Update Employee with Multer (files support)
// ✅ Update Employee
app.put(
  "/api/employees/:id",
  verifyToken,
  upload.fields([
    { name: "resume", maxCount: 1 },
    { name: "profilePhoto", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const employeeId = req.params.id;

      // ✅ only admin / hr / employee allowed
      if (!["admin", "hr", "employee"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      // ✅ employee can edit only own profile
      if (
        req.user.role === "employee" &&
        String(req.user.id) !== String(employeeId)
      ) {
        return res
          .status(403)
          .json({ message: "You can edit only your own profile" });
      }

      let updateData = { ...req.body };

      // ✅ date/number conversion
      if (updateData.joiningDate) {
        updateData.joiningDate = new Date(updateData.joiningDate);
      }

      if (updateData.salary) {
        updateData.salary = Number(updateData.salary);
      }

      if (updateData.dob) {
        updateData.dob = new Date(updateData.dob);
      }

      // ✅ HR restrictions
      if (req.user.role === "hr") {
        delete updateData.email;
        delete updateData.salary;
        delete updateData.joiningDate;
        delete updateData.gender;
        delete updateData.password;
      }

      // ✅ Employee restrictions
      if (req.user.role === "employee") {
        delete updateData.salary;
        delete updateData.joiningDate;
        delete updateData.department;
        delete updateData.designation;
        delete updateData.role;
        delete updateData.status;
        delete updateData.password;
      }

      // ✅ Only admin can change password
      if (req.user.role === "admin" && updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }

      // ✅ file upload support
      if (req.files?.resume) {
        updateData.resume = "uploads/" + req.files.resume[0].filename;
      }

      if (req.files?.profilePhoto) {
        updateData.profilePhoto =
          "uploads/" + req.files.profilePhoto[0].filename;
      }

      const updatedEmployee = await Employee.findByIdAndUpdate(
        employeeId,
        updateData,
        { new: true },
      )
        .populate("department", "name")
        .populate("designation", "name");

      if (!updatedEmployee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      res.json({
        message: "Profile updated successfully ✅",
        employee: updatedEmployee,
      });
    } catch (err) {
      console.log("Update employee error:", err);
      res.status(500).json({ message: err.message });
    }
  },
);

// ✅ DELETE Employee
app.delete("/api/employees/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    const employeeId = req.params.id;

    // Delete related attendance
    await Attendance.deleteMany({ employeeId });

    // Delete related leaves
    await Leave.deleteMany({ employeeId });

    // Then delete employee
    const employee = await Employee.findByIdAndDelete(employeeId);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json({
      message: "Employee, attendance and leave deleted successfully ✅",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Create Employee (Example Protected Route)
// router.post("/", async (req, res) => {
//   try {
//     const employee = new Employee(req.body);
//     await employee.save();
//     res.status(201).json(employee);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

/* ==============================
      🔹 SEND OTP API
    ============================== */

app.post("/api/send-otp", async (req, res) => {
  const { email } = req.body;

  const user =
    (await Admin.findOne({ email })) ||
    (await HR.findOne({ email })) ||
    (await Employee.findOne({ email }));
  if (!user) return res.status(404).json({ message: "Email not found" });

  const otp = generateOTP();
  user.otp = otp;
  user.otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes
  await user.save();
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your OTP for Login",
    text: `Hello ${user.name},\n\nYour OTP is: ${otp}\nIt is valid for 5 minutes.\n\n- Techno Guide`,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.log("Error sending OTP email:", err);
      return res.status(500).json({ message: "Failed to send OTP email" });
    } else {
      console.log("OTP email sent successfully ✔"); // ONLY this log
      res.json({ message: "OTP sent successfully ✅" });
    }
  });
});

/* ==============================
      🔹 VERIFY OTP API
    ============================== */

app.post("/api/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  const user =
    (await Admin.findOne({ email })) ||
    (await HR.findOne({ email })) ||
    (await Employee.findOne({ email }));

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // ❌ Wrong OTP
  if (user.otp != otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  // ❌ Expired OTP
  if (Date.now() > user.otpExpiry) {
    return res.status(400).json({ message: "OTP expired" });
  }

  // ✅ Correct OTP
  res.json({ message: "OTP verified successfully ✅" });
});

app.post("/api/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const user =
    (await Admin.findOne({ email })) ||
    (await HR.findOne({ email })) ||
    (await Employee.findOne({ email }));
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.otp != otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  if (Date.now() > user.otpExpiry) {
    return res.status(400).json({ message: "OTP expired" });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  user.otp = undefined;
  user.otpExpiry = undefined;
  await user.save();

  res.json({ message: "Password reset successful ✅" });
});

// ✅ Get All HR Users (Admin Only)
app.get("/hr", verifyToken, async (req, res) => {
  try {
    // Only admin can fetch all HR users
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }
    const hrUsers = await HR.find({}, "-password"); // Exclude password
    res.json(hrUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// ✅ Add HR User (Admin Only)
app.post("/hr", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    const { name, email, password } = req.body;

    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required" });
    }

    const existingHR = await HR.findOne({ email });
    if (existingHR) {
      return res
        .status(400)
        .json({ message: "HR with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10); // Hash password

    const newHR = new HR({ name, email, password: hashedPassword });
    await newHR.save();

    res.status(201).json({ message: "HR added successfully ✅" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

//Update HR User (Admin Only)
app.put("/hr/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    const { id } = req.params;
    const { name, email, password } = req.body;

    const updateData = { name, email };

    if (password && password.trim() !== "") {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedHR = await HR.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedHR) {
      return res.status(404).json({ message: "HR not found" });
    }

    res.json({ message: "HR updated successfully ✅" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

//Delete HR User (Admin Only)
app.delete("/hr/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    const { id } = req.params;
    const deletedHR = await HR.findByIdAndDelete(id);

    if (!deletedHR) {
      return res.status(404).json({ message: "HR not found" });
    }

    res.json({ message: "HR deleted successfully ✅" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

//  Add Department
app.post("/api/departments", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "hr") {
      return res.status(403).json({ message: "Admin or HR access only" });
    }

    const { name } = req.body;

    const existing = await Department.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: "Department already exists" });
    }

    const newDepartment = new Department({ name });
    await newDepartment.save();

    await Notification.create({
      title: "Department Created",
      message: `Department ${name} has been created successfully.`,
      type: "department",
      role: "admin",
    });

    await Notification.create({
      title: "Department Updated",
      message: `Department ${name} has been created successfully.`,
      type: "department",
      role: "hr",
    });

    res.status(201).json(newDepartment); // ✅ CHANGED HERE
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});
//  Get All Departments
app.get("/api/departments", verifyToken, async (req, res) => {
  try {
    const departments = await Department.find({ status: "Active" });
    res.json(departments);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

// ✅ Update Department
app.put("/api/departments/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "hr") {
      return res.status(403).json({ message: "Admin or HR access only" });
    }

    const { name } = req.body;

    const updated = await Department.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true },
    );

    if (!updated) {
      return res.status(404).json({ message: "Department not found" });
    }

    await Notification.create({
      title: "Department Updated",
      message: `Department ${name} has been updated successfully.`,
      type: "department",
      role: "hr",
    });

    res.json({ message: "Department updated successfully ✅", updated });
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
});

// ✅ Delete Department
app.delete("/api/departments/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "hr") {
      return res.status(403).json({ message: "Admin or HR access only" });
    }

    const deleted = await Department.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Department not found" });
    }

    res.json({ message: "Department deleted successfully ✅" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});

//add  designation
app.post("/api/designations", verifyToken, async (req, res) => {
  try {
    const { name, department } = req.body;

    const newDesignation = new Designation({ name, department });
    await newDesignation.save();

    await Notification.create({
      title: "Designation Updated",
      message: `Designation ${name} has been created successfully.`,
      type: "designation",
      role: "hr",
    });
    res.status(201).json(newDesignation);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});
//get designation
app.get("/api/designations", verifyToken, async (req, res) => {
  try {
    const { departmentId } = req.query;

    let filter = { status: "Active" };

    if (departmentId) {
      filter.department = departmentId;
    }

    const designations = await Designation.find(filter).populate(
      "department",
      "name",
    );

    res.json(designations);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});
app.get("/api/designations/:id", verifyToken, async (req, res) => {
  try {
    const designation = await Designation.findById(req.params.id).populate(
      "department",
      "name",
    );

    if (!designation) {
      return res.status(404).json({ message: "Designation not found" });
    }

    res.json(designation);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

app.put("/api/designations/:id", verifyToken, async (req, res) => {
  try {
    const { name, department } = req.body;

    const updated = await Designation.findByIdAndUpdate(
      req.params.id,
      { name, department },
      { new: true },
    );

    if (!updated) {
      return res.status(404).json({ message: "Designation not found" });
    }

    await Notification.create({
      title: "Designation Updated",
      message: `Designation ${name} has been updated successfully.`,
      type: "designation",
      role: "hr",
    });

    res.json({ message: "Designation updated successfully ✅", updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Update failed" });
  }
});

app.delete("/api/designations/:id", verifyToken, async (req, res) => {
  try {
    const deleted = await Designation.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Designation not found" });
    }

    res.json({ message: "Designation deleted successfully ✅" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete failed" });
  }
});

//add Attendance
app.post("/api/admin/attendance", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "hr") {
      return res.status(403).json({ message: "Admin or HR access only" });
    }

    const {
      employeeId,
      date,
      status,
      inTime,
      outTime,
      remarks,
      regularizationReason,
    } = req.body;

    let finalInTime = inTime || null;
    let finalOutTime = outTime || null;
    let finalStatus = status;
    let lateMinutes = 0;
    let workingHours = 0;
    let overtimeHours = 0;

    if (finalStatus === "Absent" || finalStatus === "Leave") {
      finalInTime = null;
      finalOutTime = null;
    }

    if (finalInTime && finalOutTime) {
      workingHours = calculateWorkingHours(finalInTime, finalOutTime);

      if (workingHours > 8) {
        overtimeHours = Number((workingHours - 8).toFixed(2));
      }

      if (workingHours > 0 && workingHours < 4.5) {
        finalStatus = "Half-Day";
      }
    }

    const employee = await Employee.findById(employeeId).populate("shift");

    let shiftData = employee?.shift;

    if (!shiftData) {
      shiftData = await Shift.findOne({ status: "Active" }).sort({
        createdAt: -1,
      });
    }

    if (shiftData?.startTime && finalInTime) {
      const result = calculateLateAndStatus(finalInTime, shiftData);
      lateMinutes = result.lateMinutes;

      if (finalStatus !== "Absent" && finalStatus !== "Leave") {
        finalStatus = result.status;
      }
    }

    const attendance = new Attendance({
      employeeId,
      date,
      status: finalStatus,
      inTime: finalInTime,
      outTime: finalOutTime,
      remarks,
      workingHours,
      lateMinutes,
      overtimeHours,
      attendanceType: "Regularized",
      isRegularized: req.user.role === "hr",
      regularizedBy: req.user.role === "hr" ? req.user.id : null,
      regularizationReason: regularizationReason || "",
    });

    await attendance.save();

    res.status(201).json({
      message: "Attendance added successfully ✅",
      attendance,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ message: "Attendance already marked for this date ❌" });
    }
    res.status(400).json({ message: err.message });
  }
});

// ➤ Get All Attendance
app.get("/api/admin/attendance", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "hr") {
      return res.status(403).json({ message: "Admin or HR access only" });
    }

    const attendance = await Attendance.find()
      .populate("employeeId", "firstName lastName email")
      .sort({ date: -1 });

    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put("/api/admin/attendance/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "hr") {
      return res.status(403).json({ message: "Admin or HR access only" });
    }

    const { status, inTime, outTime, remarks, regularizationReason } = req.body;

    let workingHours = 0;
    let overtimeHours = 0;
    let lateMinutes = 0;

    const oldAttendance = await Attendance.findById(req.params.id);

    if (!oldAttendance) {
      return res.status(404).json({ message: "Attendance not found" });
    }

    const employee = await Employee.findById(oldAttendance.employeeId).populate(
      "shift",
    );

    let shiftData = employee?.shift;

    if (!shiftData) {
      shiftData = await Shift.findOne({ status: "Active" }).sort({
        createdAt: -1,
      });
    }

    let finalStatus = status;
    let finalInTime = status === "Absent" || status === "Leave" ? null : inTime;
    let finalOutTime =
      status === "Absent" || status === "Leave" ? null : outTime;

    if (finalInTime && finalOutTime) {
      workingHours = calculateWorkingHours(finalInTime, finalOutTime);

      if (workingHours > 8) {
        overtimeHours = Number((workingHours - 8).toFixed(2));
      }

      if (workingHours > 0 && workingHours < 4.5) {
        finalStatus = "Half-Day";
      }
    }

    if (shiftData?.startTime && finalInTime) {
      const result = calculateLateAndStatus(finalInTime, shiftData);
      lateMinutes = result.lateMinutes;

      if (finalStatus !== "Absent" && finalStatus !== "Leave") {
        finalStatus = result.status;
      }
    }

    if (finalStatus === "Absent" || finalStatus === "Leave") {
      lateMinutes = 0;
      workingHours = 0;
      overtimeHours = 0;
    }

    const updatedAttendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      {
        status: finalStatus,
        inTime: finalInTime,
        outTime: finalOutTime,
        remarks,
        workingHours,
        overtimeHours,
        lateMinutes,
        isRegularized: true,
        regularizedBy: req.user.id,
        regularizationReason: regularizationReason || "Updated by HR/Admin",
      },
      { new: true },
    );

    if (!updatedAttendance) {
      return res.status(404).json({ message: "Attendance not found" });
    }

    res.json({
      message: "Attendance updated successfully ✅",
      attendance: updatedAttendance,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ➤ Delete Attendance
app.delete("/api/admin/attendance/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin or HR access only" });
    }

    await Attendance.findByIdAndDelete(req.params.id);

    res.json({ message: "Attendance deleted successfully ✅" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/attendance/request", verifyToken, async (req, res) => {
  try {
    // ✅ Only employee can send request
    if (req.user.role !== "employee") {
      return res.status(403).json({ message: "Employee access only" });
    }

    const { date, requestedInTime, requestedOutTime, reason } = req.body;

    // ✅ Required fields validation
    if (!date || !reason) {
      return res.status(400).json({
        message: "Date and reason are required",
      });
    }

    const requestDate = new Date(date);

    // ✅ Invalid date check
    if (isNaN(requestDate.getTime())) {
      return res.status(400).json({
        message: "Invalid date",
      });
    }

    // ✅ Block Saturday & Sunday
    if (isWeekend(requestDate)) {
      return res.status(400).json({
        message: "Attendance request is not allowed on Saturday and Sunday ❌",
      });
    }

    // ✅ Block Holidays
    const holiday = await isHoliday(requestDate);
    if (holiday) {
      return res.status(400).json({
        message: `Attendance request is not allowed on holidays: ${holiday.name} ❌`,
      });
    }

    const { startOfDay, endOfDay } = getStartAndEndOfDay(requestDate);

    // ✅ Prevent duplicate pending request for same date
    const existingRequest = await AttendanceRequest.findOne({
      employeeId: req.user.id,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: "Pending",
    });

    if (existingRequest) {
      return res.status(400).json({
        message: "You already have a pending attendance request for this date",
      });
    }

    // ✅ Save request
    const request = new AttendanceRequest({
      employeeId: req.user.id,
      date: requestDate,
      requestedInTime,
      requestedOutTime,
      reason,
    });

    await request.save();

    res.status(201).json({
      message: "Attendance regularization request sent successfully ✅",
      request,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/holidays/blocked-dates", verifyToken, async (req, res) => {
  try {
    const holidays = await Holiday.find({ status: "Active" }).select("date name -_id");

    const formattedDates = holidays.map((item) => {
      const d = new Date(item.date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");

      return {
        date: `${year}-${month}-${day}`,
        name: item.name,
      };
    });

    res.json(formattedDates);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/attendance/requests", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "hr" && req.user.role !== "admin") {
      return res.status(403).json({ message: "HR or Admin access only" });
    }

    const requests = await AttendanceRequest.find()
      .populate("employeeId", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put("/api/attendance/requests/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "hr" && req.user.role !== "admin") {
      return res.status(403).json({ message: "HR or Admin access only" });
    }

    const { status, reviewRemark } = req.body;

    const request = await AttendanceRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    request.status = status;
    request.reviewedBy = req.user.id;
    request.reviewRemark = reviewRemark || "";
    await request.save();

    if (status === "Approved") {
      const existingAttendance = await Attendance.findOne({
        employeeId: request.employeeId,
        date: request.date,
      });

      if (!existingAttendance) {
        await Attendance.create({
          employeeId: request.employeeId,
          date: request.date,
          status: "Present",
          inTime: request.requestedInTime,
          outTime: request.requestedOutTime,
          attendanceType: "Regularized",
          isRegularized: true,
          regularizedBy: req.user.id,
          regularizationReason: request.reason,
          remarks: "Approved from attendance request",
        });
      }
    }

    res.json({ message: `Request ${status} successfully ✅`, request });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put("/api/fix-null-shifts", async (req, res) => {
  try {
    const defaultShift = await Shift.findOne({ status: "Active" }).sort({
      createdAt: -1,
    });

    if (!defaultShift) {
      return res.status(404).json({ message: "No active shift found" });
    }

    const result = await Employee.updateMany(
      { $or: [{ shift: null }, { shift: { $exists: false } }] },
      { $set: { shift: defaultShift._id } },
    );

    res.json({
      message: "Null shifts fixed successfully ✅",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/shifts", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "hr") {
      return res.status(403).json({ message: "Admin or HR access only" });
    }

    const shift = new Shift(req.body);
    await shift.save();

    res.status(201).json({ message: "Shift created successfully ✅", shift });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/shifts", verifyToken, async (req, res) => {
  try {
    const shifts = await Shift.find({ status: "Active" }).sort({
      createdAt: -1,
    });
    res.json(shifts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/office-settings", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "hr") {
      return res.status(403).json({ message: "Admin or HR access only" });
    }

    const existing = await OfficeSetting.findOne();

    if (existing) {
      const updated = await OfficeSetting.findByIdAndUpdate(
        existing._id,
        req.body,
        { new: true },
      );
      return res.json({
        message: "Office settings updated ✅",
        office: updated,
      });
    }

    const office = new OfficeSetting(req.body);
    await office.save();

    res.status(201).json({ message: "Office settings created ✅", office });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/office-settings", verifyToken, async (req, res) => {
  try {
    const office = await OfficeSetting.findOne();
    res.json(office);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/attendance/qr/generate", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "hr") {
      return res.status(403).json({ message: "Admin or HR access only" });
    }

    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    await QRAttendance.updateMany(
      { date: { $gte: startOfDay, $lte: endOfDay } },
      { isActive: false },
    );

    const qrToken = `QR-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() + 8);

    const qrRecord = new QRAttendance({
      qrToken,
      date: new Date(),
      expiryTime,
      isActive: true,
    });

    await qrRecord.save();

    res.status(201).json({
      message: "QR generated successfully ✅",
      qrToken,
      expiryTime,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/attendance/qr/active", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "hr") {
      return res.status(403).json({ message: "Admin or HR access only" });
    }

    const now = new Date();

    const activeQR = await QRAttendance.findOne({
      isActive: true,
      expiryTime: { $gt: now },
    }).sort({ createdAt: -1 });

    if (!activeQR) {
      return res.status(404).json({ message: "No active QR found" });
    }

    res.json(activeQR);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/employee/attendance/today", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ message: "Employee access only" });
    }

    const today = new Date();
    const { startOfDay, endOfDay } = getStartAndEndOfDay(today);

    const attendance = await Attendance.findOne({
      employeeId: req.user.id,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    let blocked = false;
    let message = "";

    if (isWeekend(today)) {
      blocked = true;
      message = "Saturday/Sunday";
    } else {
      const holiday = await isHoliday(today);
      if (holiday) {
        blocked = true;
        message = holiday.name;
      }
    }

    res.json({
      attendance: attendance || null,
      blocked,
      message,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/employee/attendance/check-in", verifyToken, async (req, res) => {
  try {
    // ✅ Only employee can check-in
    if (req.user.role !== "employee") {
      return res.status(403).json({ message: "Employee access only" });
    }

    const today = new Date();

    // ✅ Block weekends
    if (isWeekend(today)) {
      return res.status(400).json({
        message: "Attendance cannot be marked on Saturday and Sunday ❌",
      });
    }

    // ✅ Block holidays
    const holiday = await isHoliday(today);
    if (holiday) {
      return res.status(400).json({
        message: `Today is a holiday: ${holiday.name} ❌`,
      });
    }

    const { latitude, longitude, workType } = req.body;
    const finalWorkType = workType === "WFH" ? "WFH" : "Office";

    console.log("CHECK-IN BODY:", req.body);
    console.log("WORK TYPE:", finalWorkType);
    console.log("LATITUDE:", latitude);
    console.log("LONGITUDE:", longitude);

    // ✅ Office location validation (only for Office work type)
    if (finalWorkType !== "WFH") {
      const office = await OfficeSetting.findOne();

      if (!office) {
        return res.status(400).json({ message: "Office settings not found" });
      }

      if (!latitude || !longitude) {
        return res.status(400).json({ message: "Location is required" });
      }

      const distance = getDistanceInMeters(
        Number(latitude),
        Number(longitude),
        Number(office.latitude),
        Number(office.longitude)
      );

      if (distance > office.radiusMeters) {
        return res.status(403).json({
          message: `You are outside the office range. Allowed radius is ${office.radiusMeters} meters`,
        });
      }
    }

    // ✅ Check if attendance already exists for today
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAttendance = await Attendance.findOne({
      employeeId: req.user.id,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (existingAttendance) {
      return res
        .status(400)
        .json({ message: "Attendance already marked for today" });
    }

    // ✅ Get employee & shift
    const employee = await Employee.findById(req.user.id).populate("shift");

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    let shiftData = employee.shift;

    if (!shiftData) {
      shiftData = await Shift.findOne({ status: "Active" }).sort({ createdAt: -1 });
    }

    console.log("EMPLOYEE ID:", req.user.id);
    console.log("SHIFT DATA USED:", shiftData);

    const now = new Date();
    const inTime = now.toTimeString().slice(0, 5);

    let status = "Present";
    let lateMinutes = 0;

    // ✅ Calculate late / half-day
    if (shiftData?.startTime) {
      const result = calculateLateAndStatus(inTime, shiftData);
      lateMinutes = result.lateMinutes;
      status = result.status;
    }

    // ✅ Save attendance
    const attendance = new Attendance({
      employeeId: req.user.id,
      date: now,
      status,
      inTime,
      outTime: "",
      remarks:
        finalWorkType === "WFH"
          ? "Self check-in from home"
          : "Self check-in from office",
      workingHours: 0,
      lateMinutes,
      overtimeHours: 0,
      attendanceType: finalWorkType,
    });

    await attendance.save();

    // ✅ Save live location (only for WFH)
    if (finalWorkType === "WFH" && latitude && longitude) {
      const locationName = await getLocationName(latitude, longitude);

      await LiveLocation.findOneAndUpdate(
        { employeeId: req.user.id, isActive: true },
        {
          employeeId: req.user.id,
          attendanceId: attendance._id,
          workType: "WFH",
          latitude: Number(latitude),
          longitude: Number(longitude),
          locationName,
          isActive: true,
          lastUpdated: new Date(),
          checkInTime: new Date(),
          checkOutTime: null,
        },
        { upsert: true, new: true }
      );
    }

    res.status(201).json({
      message: "Check-in successful ✅",
      attendance,
    });

  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(400)
        .json({ message: "Attendance already marked for today" });
    }

    res.status(500).json({ message: err.message });
  }
});

app.put("/api/employee/live-location", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ message: "Employee access only" });
    }

    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res
        .status(400)
        .json({ message: "Latitude and longitude are required" });
    }

    const locationName = await getLocationName(latitude, longitude);

    const liveLocation = await LiveLocation.findOneAndUpdate(
      { employeeId: req.user.id, isActive: true },
      {
        latitude: Number(latitude),
        longitude: Number(longitude),
        locationName,
        lastUpdated: new Date(),
      },
      { new: true },
    );

    if (!liveLocation) {
      return res
        .status(404)
        .json({ message: "Active live location not found" });
    }

    res.json({
      message: "Live location updated successfully ✅",
      liveLocation,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/admin/live-locations", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "hr") {
      return res.status(403).json({ message: "Admin or HR access only" });
    }

    const locations = await LiveLocation.find({
      isActive: true,
      workType: "WFH",
    })
      .populate("employeeId", "firstName lastName email")
      .sort({ lastUpdated: -1 });

    res.json(locations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put("/api/employee/attendance/check-out", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ message: "Employee access only" });
    }

    const today = new Date();

    if (isWeekend(today)) {
      return res.status(400).json({
        message:"Attendance cannot be marked on Saturday/Sunday ❌",
      });
    }

    const holiday = await isHoliday(today);
    if (holiday) {
      return res.status(400).json({
        message: `Today is Holiday: ${holiday.name} ❌`,
      });
    }

    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const attendance = await Attendance.findOne({
      employeeId: req.user.id,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    if (!attendance) {
      return res.status(404).json({ message: "Check-in not found for today" });
    }

    if (attendance.outTime) {
      return res.status(400).json({ message: "Check-out already done" });
    }

    const now = new Date();
    const outTime = now.toTimeString().slice(0, 5);

    const workingHours = calculateWorkingHours(attendance.inTime, outTime);

    let overtimeHours = 0;
    let finalStatus = attendance.status;

    if (workingHours > 8) {
      overtimeHours = Number((workingHours - 8).toFixed(2));
    }

    if (workingHours > 0 && workingHours < 4.5) {
      finalStatus = "Half-Day";
    }

    attendance.outTime = outTime;
    attendance.workingHours = workingHours;
    attendance.overtimeHours = overtimeHours;
    attendance.status = finalStatus;

    await attendance.save();

    await LiveLocation.findOneAndUpdate(
      { employeeId: req.user.id, isActive: true },
      {
        isActive: false,
        checkOutTime: new Date(),
        lastUpdated: new Date(),
      }
    );

    res.json({
      message: "Check-out successful ✅",
      attendance,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Employee Apply Leave
app.post("/api/leave/apply", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ message: "Employee access only" });
    }

    const { leaveType, fromDate, toDate, reason } = req.body;

    const leave = new Leave({
      employeeId: req.user.id, // 🔥 direct token mathi
      leaveType,
      fromDate,
      toDate,
      reason,
    });

    await leave.save();

    await Notification.create({
      title: "Leave Request Pending",
      message: "A new leave request is pending for approval.",
      type: "leave",
      role: "admin",
    });

    await Notification.create({
      title: "New Leave Request Received",
      message: "A new leave request has been received.",
      type: "leave",
      role: "hr",
    });
    res.status(201).json({ message: "Leave applied successfully ✅" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Get Employee Leaves
app.get("/api/leave/my-leaves", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ message: "Employee access only" });
    }

    const leaves = await Leave.find({ employeeId: req.user.id }).sort({
      createdAt: -1,
    });

    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Admin Get All Leaves
app.get("/api/admin/leaves", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "hr") {
      return res.status(403).json({ message: "Admin or HR access only" });
    }

    const leaves = await Leave.find()
      .populate("employeeId", "firstName lastName email")
      .sort({ createdAt: -1 });

    const validLeaves = leaves.filter((leave) => leave.employeeId);
    res.json(validLeaves);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Admin Approve / Reject Leave
app.put("/api/admin/leave-status/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "hr") {
      return res.status(403).json({ message: "Admin or HR access only" });
    }

    const { status } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const updatedLeave = await Leave.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    );

    if (!updatedLeave) {
      return res.status(404).json({ message: "Leave not found" });
    }

    res.json({
      message: `Leave ${status} successfully ✅`,
      updatedLeave,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Check Existing Payroll
app.get("/api/hr/payroll/check", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "hr") {
      return res.status(403).json({ message: "HR access only" });
    }

    const { employeeId, month, year } = req.query;

    if (!employeeId || !month || !year) {
      return res.status(400).json({
        message: "employeeId, month and year are required",
      });
    }

    const existingPayroll = await Payroll.findOne({
      employeeId,
      month,
      year: Number(year),
    });

    res.json({
      exists: !!existingPayroll,
      payroll: existingPayroll || null,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Create Payroll
app.post("/api/hr/payroll", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "hr") {
      return res.status(403).json({ message: "HR access only" });
    }

    const { employeeId, month, year, bonus = 0, otherDeduction = 0 } = req.body;

    if (!employeeId || !month || !year) {
      return res.status(400).json({
        message: "employeeId, month and year are required",
      });
    }

    const existing = await Payroll.findOne({
      employeeId,
      month,
      year: Number(year),
    });

    if (existing) {
      return res.status(400).json({
        message: "Payroll already generated for this month",
      });
    }

    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    if (!employee.salary || Number(employee.salary) <= 0) {
      return res.status(400).json({
        message: "Employee salary is missing or invalid",
      });
    }

    const dateRange = getPayrollDateRange(month, year);

    if (!dateRange) {
      return res.status(400).json({ message: "Invalid month name" });
    }

    const { startDate, endDate, monthIndex } = dateRange;

    const attendanceRecords = await Attendance.find({
      employeeId,
      date: { $gte: startDate, $lt: endDate },
    });

    const totalDaysInMonth = new Date(
      Number(year),
      monthIndex + 1,
      0,
    ).getDate();

    const presentDays = attendanceRecords.filter(
      (a) =>
        a.status === "Present" || a.status === "Late" || a.status === "WFH",
    ).length;

    const absentDays = attendanceRecords.filter(
      (a) => a.status === "Absent",
    ).length;

    const halfDays = attendanceRecords.filter(
      (a) => a.status === "Half-Day",
    ).length;

    const leaveDays = attendanceRecords.filter(
      (a) => a.status === "Leave",
    ).length;

    const overtimeHours = attendanceRecords.reduce(
      (sum, a) => sum + Number(a.overtimeHours || 0),
      0,
    );

    const basicSalary = Number(employee.salary);
    const perDaySalary = Number((basicSalary / totalDaysInMonth).toFixed(2));
    const hra = Number((basicSalary * 0.2).toFixed(2));
    const da = Number((basicSalary * 0.1).toFixed(2));
    const pf = Number((basicSalary * 0.12).toFixed(2));
    const professionalTax = basicSalary > 15000 ? 200 : 0;

    const leaveDeduction = Number((absentDays * perDaySalary).toFixed(2));
    const halfDayDeduction = Number((halfDays * (perDaySalary / 2)).toFixed(2));

    const overtimeRatePerHour = Number(
      (basicSalary / totalDaysInMonth / 8).toFixed(2),
    );
    const overtime = Number((overtimeHours * overtimeRatePerHour).toFixed(2));

    const grossSalary =
      basicSalary + hra + da + Number(bonus) + Number(overtime);

    const totalDeduction =
      pf +
      professionalTax +
      Number(leaveDeduction) +
      Number(halfDayDeduction) +
      Number(otherDeduction);

    const netSalary = Number((grossSalary - totalDeduction).toFixed(2));

    const payroll = new Payroll({
      employeeId,
      month,
      year: Number(year),

      basicSalary,
      hra,
      da,
      bonus: Number(bonus),
      overtime,

      perDaySalary,
      totalDaysInMonth,
      presentDays,
      absentDays,
      halfDays,
      leaveDays,
      overtimeHours,
      halfDayDeduction,

      grossSalary,

      pf,
      professionalTax,
      leaveDeduction,
      otherDeduction: Number(otherDeduction),

      totalDeduction,
      netSalary,

      status: "Pending Approval",
      generatedBy: req.user.id,
      approvedBy: null,
      rejectedBy: null,
      rejectionReason: "",
      paidBy: null,
      approvedAt: null,
      rejectedAt: null,
      paidDate: null,
      paymentMode: "",
      transactionId: "",
      paymentDate: null,
      upiId: "",
      referenceNumber: "",
    });

    await payroll.save();

    await Notification.create({
      title: "Payroll Generated",
      message: `Payroll has been generated successfully for ${month} ${year}.`,
      type: "payroll",
      role: "admin",
    });

    await Notification.create({
      title: "Payroll Generated",
      message: `Payroll has been generated successfully for ${month} ${year}.`,
      type: "payroll",
      role: "hr",
    });

    res.status(201).json({
      message: "Payroll created successfully 💰",
      payroll,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Get All Payroll (Admin)
app.get("/api/admin/payroll", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "hr") {
      return res.status(403).json({ message: "Admin or HR access only" });
    }

    const payrolls = await Payroll.find()
      .populate({
        path: "employeeId",
        populate: [
          { path: "department", model: "Department" },
          { path: "designation", model: "Designation" },
        ],
      })
      .populate("generatedBy", "name email")
      .populate("approvedBy", "name email")
      .populate("paidBy", "name email")
      .sort({ createdAt: -1 });

    res.json(payrolls);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/api/hr/payroll/preview", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "hr") {
      return res.status(403).json({ message: "HR access only" });
    }

    const { employeeId, month, year, bonus = 0, otherDeduction = 0 } = req.body;

    if (!employeeId || !month || !year) {
      return res.status(400).json({
        message: "employeeId, month and year are required",
      });
    }

    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    if (!employee.salary || Number(employee.salary) <= 0) {
      return res.status(400).json({
        message: "Employee salary is missing or invalid",
      });
    }

    const dateRange = getPayrollDateRange(month, year);

    if (!dateRange) {
      return res.status(400).json({ message: "Invalid month name" });
    }

    const { startDate, endDate, monthIndex } = dateRange;

    const attendanceRecords = await Attendance.find({
      employeeId,
      date: { $gte: startDate, $lt: endDate },
    });

    const totalDaysInMonth = new Date(
      Number(year),
      monthIndex + 1,
      0,
    ).getDate();
    const basicSalary = Number(employee.salary);
    const perDaySalary = Number((basicSalary / totalDaysInMonth).toFixed(2));
    const hra = Number((basicSalary * 0.2).toFixed(2));
    const da = Number((basicSalary * 0.1).toFixed(2));
    const pf = Number((basicSalary * 0.12).toFixed(2));
    const professionalTax = basicSalary > 15000 ? 200 : 0;

    const presentDays = attendanceRecords.filter(
      (a) =>
        a.status === "Present" || a.status === "Late" || a.status === "WFH",
    ).length;

    const absentDays = attendanceRecords.filter(
      (a) => a.status === "Absent",
    ).length;
    const halfDays = attendanceRecords.filter(
      (a) => a.status === "Half-Day",
    ).length;
    const leaveDays = attendanceRecords.filter(
      (a) => a.status === "Leave",
    ).length;

    const overtimeHours = attendanceRecords.reduce(
      (sum, a) => sum + Number(a.overtimeHours || 0),
      0,
    );

    const leaveDeduction = Number((absentDays * perDaySalary).toFixed(2));
    const halfDayDeduction = Number((halfDays * (perDaySalary / 2)).toFixed(2));
    const overtimeRatePerHour = Number(
      (basicSalary / totalDaysInMonth / 8).toFixed(2),
    );
    const overtime = Number((overtimeHours * overtimeRatePerHour).toFixed(2));

    const grossSalary =
      basicSalary + hra + da + Number(bonus) + Number(overtime);

    const totalDeduction =
      pf +
      professionalTax +
      Number(leaveDeduction) +
      Number(halfDayDeduction) +
      Number(otherDeduction);

    const netSalary = Number((grossSalary - totalDeduction).toFixed(2));

    res.json({
      employee: {
        _id: employee._id,
        employeeId: employee.employeeId,
        firstName: employee.firstName,
        lastName: employee.lastName,
        salary: employee.salary,
      },
      payrollPreview: {
        month,
        year: Number(year),
        basicSalary,
        hra,
        da,
        bonus: Number(bonus),
        overtime,
        overtimeHours,
        perDaySalary,
        totalDaysInMonth,
        presentDays,
        absentDays,
        halfDays,
        leaveDays,
        leaveDeduction,
        halfDayDeduction,
        pf,
        professionalTax,
        otherDeduction: Number(otherDeduction),
        grossSalary,
        totalDeduction,
        netSalary,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Get Logged-in Employee Payroll
app.get("/api/employee/payroll", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ message: "Employee access only" });
    }

    const payroll = await Payroll.find({
      employeeId: req.user.id,
      status: { $in: ["Approved", "Paid"] },
    })
      .populate({
        path: "employeeId",
        populate: [
          { path: "department", model: "Department" },
          { path: "designation", model: "Designation" },
        ],
      })
      .sort({ year: -1, createdAt: -1 });

    res.json(payroll);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/employee/payroll/history", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ message: "Access denied" });
    }

    const employeeId = req.user.id;

    const payrolls = await Payroll.find({ employeeId })
      .populate("employeeId", "firstName lastName employeeId")
      .sort({ year: -1, createdAt: -1 });

    res.status(200).json({ payrolls });
  } catch (error) {
    console.error("Payroll history fetch error:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching payroll history" });
  }
});

app.get("/api/employee/payroll/view", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { month, year } = req.query;

    console.log("----- EMPLOYEE PAYSLIP VIEW DEBUG -----");
    console.log("Logged in user:", req.user);
    console.log("Month from query:", month);
    console.log("Year from query:", year);
    console.log("User ID from token:", req.user.id);

    if (!month || !year) {
      return res.status(400).json({ message: "Month and year are required" });
    }

    const payroll = await Payroll.findOne({
      employeeId: req.user.id,
      year: Number(year),
      month: { $regex: new RegExp(`^${month.trim()}$`, "i") },
    }).populate({
      path: "employeeId",
      populate: [
        { path: "department", select: "name" },
        { path: "designation", select: "name" },
      ],
    });

    console.log("Payroll found:", payroll);

    if (!payroll) {
      return res
        .status(404)
        .json({ message: "Payslip not found for selected month and year" });
    }

    res.status(200).json({ payroll });
  } catch (error) {
    console.log("Error fetching employee payslip:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/api/admin/payroll/:id/approve", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    const payroll = await Payroll.findById(req.params.id);

    if (!payroll) {
      return res.status(404).json({ message: "Payroll not found" });
    }

    if (!["Pending Approval", "Rejected"].includes(payroll.status)) {
      return res.status(400).json({
        message: "Only pending/rejected payroll can be approved",
      });
    }

    payroll.status = "Approved";
    payroll.approvedBy = req.user.id;
    payroll.approvedAt = new Date();
    payroll.rejectedBy = null;
    payroll.rejectedAt = null;
    payroll.rejectionReason = "";

    await payroll.save();

    res.json({ message: "Payroll approved successfully ✅", payroll });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put("/api/admin/payroll/:id/reject", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ message: "Rejection reason is required" });
    }

    const payroll = await Payroll.findById(req.params.id);

    if (!payroll) {
      return res.status(404).json({ message: "Payroll not found" });
    }

    if (!["Pending Approval", "Approved"].includes(payroll.status)) {
      return res.status(400).json({
        message: "Only pending/approved payroll can be rejected",
      });
    }

    payroll.status = "Rejected";
    payroll.rejectedBy = req.user.id;
    payroll.rejectedAt = new Date();
    payroll.rejectionReason = rejectionReason;

    await payroll.save();

    res.json({ message: "Payroll rejected successfully ❌", payroll });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Update Payroll Status
app.post("/api/admin/payroll/:id/create-order", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ message: "Razorpay keys missing in .env" });
    }

    const payroll = await Payroll.findById(req.params.id).populate(
      "employeeId",
      "firstName lastName email employeeId"
    );

    if (!payroll) {
      return res.status(404).json({ message: "Payroll not found" });
    }

    if (payroll.status !== "Approved") {
      return res.status(400).json({
        message: "Only approved payroll can be paid",
      });
    }

    if (payroll.paymentStatus === "Paid" || payroll.status === "Paid") {
      return res.status(400).json({
        message: "Payroll already paid",
      });
    }

    const amount = Math.round(Number(payroll.netSalary || 0) * 100);

    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: "Invalid payroll amount",
      });
    }

    const options = {
      amount,
      currency: "INR",
      receipt: `pay_${String(payroll._id).slice(-8)}_${Date.now()
        .toString()
        .slice(-6)}`,
      notes: {
        payrollId: payroll._id.toString(),
        employeeId: payroll.employeeId?._id?.toString() || "",
        employeeName: `${payroll.employeeId?.firstName || ""} ${payroll.employeeId?.lastName || ""}`.trim(),
        month: payroll.month || "",
        year: String(payroll.year || ""),
      },
    };

    console.log("Create order options:", options);

    const order = await razorpay.orders.create(options);

    payroll.razorpayOrderId = order.id;
    payroll.paymentStatus = "Created";
    payroll.currency = order.currency;
    await payroll.save();

    res.json({
      message: "Razorpay order created successfully ✅",
      key: process.env.RAZORPAY_KEY_ID,
      order,
      payroll: {
        _id: payroll._id,
        netSalary: payroll.netSalary,
        month: payroll.month,
        year: payroll.year,
        employeeName: `${payroll.employeeId?.firstName || ""} ${payroll.employeeId?.lastName || ""}`.trim(),
        email: payroll.employeeId?.email || "",
      },
    });
  } catch (err) {
    console.error("Create Razorpay order error:", err);
    res.status(500).json({
      message: err?.error?.description || err.message || "Failed to create order",
    });
  }
});


app.post("/api/admin/payroll/verify-payment", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    const {
      payrollId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !payrollId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({ message: "Missing payment details" });
    }

    const payroll = await Payroll.findById(payrollId);

    if (!payroll) {
      return res.status(404).json({ message: "Payroll not found" });
    }

    if (payroll.status !== "Approved") {
      return res.status(400).json({
        message: "Only approved payroll can be verified",
      });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      payroll.paymentStatus = "Failed";
      await payroll.save();

      return res.status(400).json({ message: "Invalid payment signature" });
    }

    payroll.status = "Paid";
    payroll.paymentStatus = "Paid";
    payroll.paymentMode = "Online";
    payroll.transactionId = razorpay_payment_id;
    payroll.referenceNumber = razorpay_order_id;
    payroll.razorpayOrderId = razorpay_order_id;
    payroll.razorpayPaymentId = razorpay_payment_id;
    payroll.razorpaySignature = razorpay_signature;
    payroll.paymentDate = new Date();
    payroll.paidDate = new Date();
    payroll.paidBy = req.user.id;

    await payroll.save();

    res.json({
      message: "Payroll payment verified and marked as Paid ✅",
      payroll,
    });
  } catch (err) {
    console.error("Verify payment error:", err);
    res.status(500).json({ message: err.message || "Payment verification failed" });
  }
});

app.put("/api/admin/payroll/:id/payment-failed", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    const payroll = await Payroll.findById(req.params.id);

    if (!payroll) {
      return res.status(404).json({ message: "Payroll not found" });
    }

    payroll.paymentStatus = "Failed";
    await payroll.save();

    res.json({ message: "Payment marked as failed", payroll });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// ✅ Delete Payroll
//    app.delete("/api/admin/payroll/:id", verifyToken, async (req, res) => {
//   try {
//     if (req.user.role !== "admin") {
//       return res.status(403).json({ message: "Admin access only" });
//     }

//     const payroll = await Payroll.findByIdAndDelete(req.params.id);

//     if (!payroll) {
//       return res.status(404).json({ message: "Payroll not found" });
//     }

//     res.json({ message: "Payroll deleted successfully ✅" });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// ✅ Admin Dashboard Statistics
app.get("/api/admin/dashboard-stats", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "hr") {
      return res.status(403).json({ message: "Access denied" });
    }

    // 1. Total Counts
    const totalEmployees = await Employee.countDocuments();
    const totalHR = await HR.countDocuments();
    const totalDepartments = await Department.countDocuments();

    // 2. Today's Attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await Attendance.find({
      date: { $gte: today, $lt: tomorrow },
    });

    const attendanceStats = {
      present: todayAttendance.filter((a) => a.status === "Present").length,
      absent: todayAttendance.filter((a) => a.status === "Absent").length,
      leave: todayAttendance.filter((a) => a.status === "Leave").length,
    };

    // 3. Pending Leave Requests
    const pendingLeaves = await Leave.countDocuments({ status: "Pending" });

    // 4. Monthly Payroll (Sum of all employee salaries as placeholder)
    const employees = await Employee.find({}, "salary");
    const totalPayroll = employees.reduce(
      (sum, emp) => sum + (emp.salary || 0),
      0,
    );

    // 5. Recent Activities (Latest 5 items)
    const recentEmployees = await Employee.find()
      .sort({ createdAt: -1 })
      .limit(2);
    const recentLeaves = await Leave.find()
      .populate("employeeId", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(2);
    const recentDept = await Department.find().sort({ createdAt: -1 }).limit(1);

    const activities = [
      ...recentEmployees.map((emp) => ({
        type: "New employee added",
        detail: `${emp.firstName} ${emp.lastName}`,
        date: emp.createdAt,
      })),
      ...recentLeaves.map((leave) => ({
        type: "Leave Request",
        detail: `${leave.employeeId?.firstName} ${leave.employeeId?.lastName} - ${leave.status}`,
        date: leave.createdAt,
      })),
      ...recentDept.map((dept) => ({
        type: "Department created",
        detail: dept.name,
        date: dept.createdAt,
      })),
    ]
      .sort((a, b) => b.date - a.date)
      .slice(0, 5);

    // 6. Last 3 Months Attendance Data
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(today.getMonth() - 2);
    threeMonthsAgo.setDate(1);
    threeMonthsAgo.setHours(0, 0, 0, 0);

    const last3MonthsAttendance = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: threeMonthsAgo, $lte: today },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
          },
          present: {
            $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] },
          },
          absent: {
            $sum: { $cond: [{ $eq: ["$status", "Absent"] }, 1, 0] },
          },
          leave: {
            $sum: { $cond: [{ $eq: ["$status", "Leave"] }, 1, 0] },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const monthNames = [
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
      "December",
    ];

    const monthlyStats = last3MonthsAttendance.map((item) => ({
      month: monthNames[item._id.month],
      present: item.present,
      absent: item.absent,
      leave: item.leave,
    }));

    // 7. Department Distribution
    const deptDistribution = await Employee.aggregate([
      { $group: { _id: "$department", count: { $sum: 1 } } },
      {
        $lookup: {
          from: "departments",
          localField: "_id",
          foreignField: "_id",
          as: "deptInfo",
        },
      },
      { $unwind: "$deptInfo" },
      { $project: { name: "$deptInfo.name", value: "$count" } },
    ]);

    // 8. Designation Distribution
    const desigDistribution = await Employee.aggregate([
      { $group: { _id: "$designation", count: { $sum: 1 } } },
      {
        $lookup: {
          from: "designations",
          localField: "_id",
          foreignField: "_id",
          as: "desigInfo",
        },
      },
      { $unwind: "$desigInfo" },
      { $project: { name: "$desigInfo.name", value: "$count" } },
    ]);

    res.json({
      counts: {
        totalEmployees,
        totalHR,
        totalDepartments,
        pendingLeaves,
        totalPayroll,
      },
      attendance: attendanceStats,
      monthlyAttendance: monthlyStats,
      deptDistribution,
      desigDistribution,
      activities,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

// ✅ HR Create Task final
// ✅ HR Create Task
app.post(
  "/api/tasks",
  verifyToken,
  upload.single("attachment"),
  async (req, res) => {
    try {
      if (req.user.role !== "hr") {
        return res.status(403).json({ message: "HR access only" });
      }

      const { title, description, assignedTo, priority, startDate, deadline } =
        req.body;
      const assignedEmployees = Array.isArray(assignedTo)
        ? assignedTo
        : [assignedTo];

      if (!title || !assignedTo || assignedEmployees.length === 0) {
        return res.status(400).json({
          message: "Title and at least one assigned employee are required",
        });
      }

      if (startDate && deadline && new Date(deadline) < new Date(startDate)) {
        return res
          .status(400)
          .json({ message: "Deadline cannot be before start date" });
      }

      // const task = new Task({
      //   title,
      //   description,
      //   assignedTo,
      //   priority,
      //   startDate: startDate ? new Date(startDate) : null,
      //   deadline: deadline ? new Date(deadline) : null,
      //   attachment: req.file ? "uploads/" + req.file.filename : "",
      //   assignedBy: req.user.id,
      // });

      // await task.save();

      const createdTasks = [];

      for (const employeeId of assignedEmployees) {
        const task = new Task({
          title,
          description,
          assignedTo: employeeId,
          priority,
          startDate: startDate ? new Date(startDate) : null,
          deadline: deadline ? new Date(deadline) : null,
          attachment: req.file ? "uploads/" + req.file.filename : "",
          assignedBy: req.user.id,
        });

        await task.save();
        createdTasks.push(task);
      }

      await Notification.create({
        title: "Task Assigned",
        message: `${createdTasks.length} task(s) have been assigned successfully.`,
        type: "task",
        role: "hr",
      });

      res
        .status(201)
        .json({
          message: "Task(s) created successfully ✅",
          tasks: createdTasks,
        });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

// ✅ Admin / HR Get Tasks
app.get("/api/tasks", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "hr") {
      return res.status(403).json({ message: "Admin or HR access only" });
    }

    const today = new Date();

    await Task.updateMany(
      {
        deadline: { $lt: today },
        status: { $ne: "Completed" },
      },
      {
        $set: { status: "Overdue" },
      },
    );

    let filter = {};

    if (req.user.role === "hr") {
      filter.assignedBy = req.user.id;
    }

    const tasks = await Task.find(filter)
      .populate("assignedTo", "firstName lastName email")
      .populate("assignedBy", "name email")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ HR Update Task
app.put(
  "/api/tasks/:id",
  verifyToken,
  upload.single("attachment"),
  async (req, res) => {
    try {
      if (req.user.role !== "hr") {
        return res.status(403).json({ message: "HR access only" });
      }

      const { title, description, assignedTo, priority, startDate, deadline } =
        req.body;

      if (!title || !assignedTo) {
        return res
          .status(400)
          .json({ message: "Title and assigned employee are required" });
      }

      if (startDate && deadline && new Date(deadline) < new Date(startDate)) {
        return res
          .status(400)
          .json({ message: "Deadline cannot be before start date" });
      }

      const updateData = {
        title,
        description,
        assignedTo,
        priority,
        startDate: startDate ? new Date(startDate) : null,
        deadline: deadline ? new Date(deadline) : null,
      };

      if (req.file) {
        updateData.attachment = "uploads/" + req.file.filename;
      }

      const updatedTask = await Task.findOneAndUpdate(
        { _id: req.params.id, assignedBy: req.user.id },
        updateData,
        { new: true },
      );

      if (!updatedTask) {
        return res
          .status(404)
          .json({ message: "Task not found or unauthorized" });
      }

      res.json({ message: "Task updated successfully ✅", updatedTask });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

// ✅ HR Delete Task
app.delete("/api/tasks/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "hr") {
      return res.status(403).json({ message: "HR access only" });
    }

    const deletedTask = await Task.findOneAndDelete({
      _id: req.params.id,
      assignedBy: req.user.id,
    });

    if (!deletedTask) {
      return res
        .status(404)
        .json({ message: "Task not found or unauthorized" });
    }

    res.json({ message: "Task deleted successfully ✅" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Employee Get My Tasks
app.get("/api/employee/tasks", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ message: "Employee access only" });
    }

    const today = new Date();

    await Task.updateMany(
      {
        assignedTo: req.user.id,
        deadline: { $lt: today },
        status: { $ne: "Completed" },
      },
      {
        $set: { status: "Overdue" },
      },
    );

    const tasks = await Task.find({ assignedTo: req.user.id })
      .populate("assignedBy", "name email")
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// ✅ Employee Update Task Status
app.put("/api/employee/tasks/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ message: "Employee access only" });
    }

    const { status, remarks } = req.body;

    if (!["Pending", "In Progress"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updateData = {
      status,
      remarks: remarks || "",
    };

    // if (status === "Completed") {
    //   updateData.completedAt = new Date();
    // } else {
    //   updateData.completedAt = null;
    // }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, assignedTo: req.user.id },
      updateData,
      { new: true },
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (status === "Completed") {
      await Notification.create({
        title: "Task Completed",
        message: "An employee has completed an assigned task.",
        type: "task",
        role: "hr",
      });
    }

    res.json({ message: "Task status updated successfully ✅", task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put(
  "/api/employee/tasks/:id/submit",
  verifyToken,
  upload.single("employeeSubmission"),
  async (req, res) => {
    try {
      if (req.user.role !== "employee") {
        return res.status(403).json({ message: "Employee access only" });
      }

      const { submissionRemarks } = req.body;

      const task = await Task.findOneAndUpdate(
        { _id: req.params.id, assignedTo: req.user.id },
        {
          status: "Under Review",
          submissionRemarks: submissionRemarks || "",
          employeeSubmission: req.file ? "uploads/" + req.file.filename : "",
          submittedAt: new Date(),
        },
        { new: true },
      );

      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      await Notification.create({
        title: "Task Submitted For Review",
        message: "An employee has submitted a task for review.",
        type: "task",
        role: "hr",
      });

      res.json({
        message: "Task submitted for review successfully ✅",
        task,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

app.put("/api/tasks/review/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "hr") {
      return res.status(403).json({ message: "HR access only" });
    }

    const { status } = req.body;

    if (!["Completed", "Rework Required"].includes(status)) {
      return res.status(400).json({ message: "Invalid review status" });
    }

    const updateData = {
      status,
    };

    if (status === "Completed") {
      updateData.completedAt = new Date();
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, assignedBy: req.user.id },
      updateData,
      { new: true },
    );

    if (!task) {
      return res
        .status(404)
        .json({ message: "Task not found or unauthorized" });
    }

    res.json({ message: "Task reviewed successfully ✅", task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ HR / Admin - Task Summary Chart API
app.get("/api/hr/tasks-summary", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "hr" && req.user.role !== "admin") {
      return res.status(403).json({
        message: "HR or Admin access only",
      });
    }

    let filter = {};

    if (req.user.role === "hr") {
      filter.assignedBy = req.user.id;
    }

    const pending = await Task.countDocuments({ ...filter, status: "Pending" });
    const inProgress = await Task.countDocuments({
      ...filter,
      status: "In Progress",
    });
    const completed = await Task.countDocuments({
      ...filter,
      status: "Completed",
    });
    const overdue = await Task.countDocuments({ ...filter, status: "Overdue" });

    res.json({
      pending,
      inProgress,
      completed,
      overdue,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

// ==============================
// 👨‍💼 Employee My Performance Summary
// ==============================
app.get("/api/employee/performance/summary", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ message: "Employee access only" });
    }

    const employeeId = req.user.id;

    const performanceList = await Performance.find({
      employee: employeeId,
    })
      .populate({
        path: "employee",
        select: "firstName lastName employeeId department designation",
        populate: [
          { path: "department", select: "name" },
          { path: "designation", select: "name" },
        ],
      })
      .sort({ reviewYear: -1, reviewMonth: -1, createdAt: -1 });

    if (!performanceList.length) {
      return res.json({
        employee: null,
        latestPerformance: null,
        performanceHistory: [],
        averageKpiScore: 0,
        totalReviews: 0,
      });
    }

    const latestPerformance = performanceList[0];

    const averageKpiScore = Number(
      (
        performanceList.reduce(
          (sum, item) => sum + Number(item.kpiScore || 0),
          0,
        ) / performanceList.length
      ).toFixed(2),
    );

    res.json({
      employee: latestPerformance.employee,
      latestPerformance,
      performanceHistory: performanceList,
      averageKpiScore,
      totalReviews: performanceList.length,
    });
  } catch (err) {
    console.error("Employee performance summary error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ==============================
// 👨‍💼 Employee My Performance By Id
// ==============================
app.get("/api/employee/performance/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ message: "Employee access only" });
    }

    const performance = await Performance.findOne({
      _id: req.params.id,
      employee: req.user.id,
    }).populate({
      path: "employee",
      select: "firstName lastName employeeId department designation",
      populate: [
        { path: "department", select: "name" },
        { path: "designation", select: "name" },
      ],
    });

    if (!performance) {
      return res.status(404).json({ message: "Performance record not found" });
    }

    res.json(performance);
  } catch (err) {
    console.error("Employee performance detail error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ==============================
// ⭐ HR Give Performance Rating
// ==============================

app.post("/api/performance", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "hr") {
      return res.status(403).json({ message: "HR access only" });
    }

    const { employee, reviewComment, reviewType, reviewMonth, reviewYear } =
      req.body;
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const currentQuarter = Math.ceil(currentMonth / 3);

    // For Monthly selected month/year use karva
    const selectedMonth = Number(reviewMonth) || currentMonth;
    const selectedYear = Number(reviewYear) || currentYear;

    let someDate = new Date();
    let endDate = new Date();

    if (reviewType === "Monthly") {
      if (!reviewMonth || !reviewYear) {
        return res.status(400).json({
          message: "Please select month and year for monthly review",
        });
      }
    }

    if (reviewType === "Monthly") {
      someDate = new Date(selectedYear, selectedMonth - 1, 1, 0, 0, 0, 0);
      endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);
    }

    if (reviewType === "Quarterly") {
      const quarterStartMonth = (currentQuarter - 1) * 3;
      someDate = new Date(currentYear, quarterStartMonth, 1, 0, 0, 0, 0);
      endDate = new Date(
        currentYear,
        quarterStartMonth + 3,
        0,
        23,
        59,
        59,
        999,
      );
    }

    if (reviewType === "Yearly") {
      someDate = new Date(currentYear, 0, 1, 0, 0, 0, 0);
      endDate = new Date(currentYear, 11, 31, 23, 59, 59, 999);
    }

    // 1. Attendance Score
    const totalAttendance = await Attendance.countDocuments({
      employeeId: employee,
      date: { $gte: someDate, $lte: endDate },
    });

    const presentAttendance = await Attendance.countDocuments({
      employeeId: employee,
      status: { $in: ["Present", "WFH"] },
      date: { $gte: someDate, $lte: endDate },
    });

    const attendanceScore =
      totalAttendance === 0
        ? 0
        : Math.round((presentAttendance / totalAttendance) * 100);

    // 2. Task Score
    const totalTasks = await Task.countDocuments({
      assignedTo: employee,
      createdAt: { $gte: someDate, $lte: endDate },
    });

    const completedTasks = await Task.countDocuments({
      assignedTo: employee,
      status: "Completed",
      createdAt: { $gte: someDate, $lte: endDate },
    });

    const taskScore =
      totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    // 3. Early Completion Bonus
    const earlyCompletedTasks = await Task.countDocuments({
      assignedTo: employee,
      status: "Completed",
      completedAt: { $ne: null },
      deadline: { $ne: null },
      createdAt: { $gte: someDate, $lte: endDate },
      $expr: { $lt: ["$completedAt", "$deadline"] },
    });

    const earlyCompletionBonus = getEarlyCompletionBonus(earlyCompletedTasks);

    // 4. Leave Deduction
    const totalLeaves = await Leave.countDocuments({
      employeeId: employee,
      status: "Approved",
      fromDate: { $gte: someDate, $lte: endDate },
    });

    const leaveDeduction = getLeaveDeduction(totalLeaves);

    // 5. Final KPI
    let baseKpi = Math.round(attendanceScore * 0.5 + taskScore * 0.5);
    let finalKpi = baseKpi + earlyCompletionBonus - leaveDeduction;

    if (finalKpi > 100) finalKpi = 100;
    if (finalKpi < 0) finalKpi = 0;

    const rating = getAutoRating(finalKpi);

    // Same cycle filter
    let cycleFilter = {
      employee,
      reviewType,
    };

    if (reviewType === "Monthly") {
      cycleFilter.reviewMonth = selectedMonth;
      cycleFilter.reviewYear = selectedYear;
    }

    if (reviewType === "Quarterly") {
      cycleFilter.reviewQuarter = currentQuarter;
      cycleFilter.reviewYear = currentYear;
    }

    if (reviewType === "Yearly") {
      cycleFilter.reviewYear = currentYear;
    }

    const existingPerformance = await Performance.findOne(cycleFilter);

    if (existingPerformance) {
      if (existingPerformance.status === "Finalized") {
        return res.status(400).json({
          message:
            "This review cycle is already finalized. You cannot regenerate it.",
        });
      }

      existingPerformance.reviewComment = reviewComment || "";
      existingPerformance.attendanceScore = attendanceScore;
      existingPerformance.taskScore = taskScore;
      existingPerformance.earlyCompletionBonus = earlyCompletionBonus;
      existingPerformance.leaveDeduction = leaveDeduction;
      existingPerformance.kpiScore = finalKpi;
      existingPerformance.rating = rating;
      existingPerformance.createdBy = req.user.id;
      existingPerformance.status = "Draft";
      existingPerformance.finalizedAt = null;

      await existingPerformance.save();

      await Notification.create({
        title: "Performance Updated",
        message: "Performance has been regenerated successfully.",
        type: "performance",
        role: "hr",
      });

      return res.status(200).json({
        message: "Performance updated successfully ✅",
        performance: existingPerformance,
        selectedPeriod:
          reviewType === "Monthly"
            ? `${selectedMonth}-${selectedYear}`
            : reviewType,
      });
    }

    const performanceData = {
      employee,
      reviewComment: reviewComment || "",
      reviewType,
      attendanceScore,
      taskScore,
      earlyCompletionBonus,
      leaveDeduction,
      kpiScore: finalKpi,
      rating,
      status: "Draft",
      finalizedAt: null,
      createdBy: req.user.id,
    };

    if (reviewType === "Monthly") {
      performanceData.reviewMonth = selectedMonth;
      performanceData.reviewYear = selectedYear;
    }

    if (reviewType === "Quarterly") {
      performanceData.reviewQuarter = currentQuarter;
      performanceData.reviewYear = currentYear;
    }

    if (reviewType === "Yearly") {
      performanceData.reviewYear = currentYear;
    }

    const performance = new Performance(performanceData);
    await performance.save();

    await Notification.create({
      title: "Performance Generated",
      message: "Performance has been generated automatically.",
      type: "performance",
      role: "hr",
    });

    res.status(201).json({
      message: "Performance generated automatically ✅",
      performance,
      selectedPeriod:
        reviewType === "Monthly"
          ? `${selectedMonth}-${selectedYear}`
          : reviewType,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==============================
// 👀 Get Performance (Role Based)
// ==============================

app.get("/api/performance", verifyToken, async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === "hr") {
      filter.createdBy = req.user.id;
    }

    if (req.user.role === "employee") {
      filter.employee = req.user.id;
    }

    const data = await Performance.find(filter)
      .populate({
        path: "employee",
        select: "firstName lastName employeeId department designation",
        populate: [
          { path: "department", select: "name" },
          { path: "designation", select: "name" },
        ],
      })
      .sort({ createdAt: -1 });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==============================
// 🏆 Admin Top Performer
// ==============================

app.get("/api/performance/top", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    const topPerformers = await Performance.aggregate([
      {
        $group: {
          _id: "$employee",
          avgKpiScore: { $avg: "$kpiScore" },
        },
      },
      { $sort: { avgKpiScore: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "employees",
          localField: "_id",
          foreignField: "_id",
          as: "employee",
        },
      },
      { $unwind: "$employee" },
      {
        $project: {
          _id: 1,
          employee: {
            firstName: "$employee.firstName",
            lastName: "$employee.lastName",
          },
          avgKpiScore: { $round: ["$avgKpiScore", 1] },
          kpiScore: { $round: ["$avgKpiScore", 0] },
          rating: {
            $switch: {
              branches: [
                { case: { $gte: ["$avgKpiScore", 90] }, then: "Excellent" },
                { case: { $gte: ["$avgKpiScore", 80] }, then: "Very Good" },
                { case: { $gte: ["$avgKpiScore", 70] }, then: "Good" },
                { case: { $gte: ["$avgKpiScore", 60] }, then: "Average" },
              ],
              default: "Needs Improvement",
            },
          },
          reviewType: { $literal: "Top Performer" },
          reviewComment: { $literal: "Best average performer" },
        },
      },
    ]);

    res.json(topPerformers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==============================
// 📉 Low Performance Alert
// ==============================

app.get("/api/performance/low", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    const low = await Performance.find({
      kpiScore: { $lt: 60 },
    })
      .populate("employee", "firstName lastName")
      .sort({ kpiScore: 1 });

    res.json(low);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==============================
// 📊 Department Performance Report
// ==============================

app.get("/api/performance/department", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    const report = await Performance.aggregate([
      {
        $lookup: {
          from: "employees",
          localField: "employee",
          foreignField: "_id",
          as: "emp",
        },
      },
      { $unwind: "$emp" },
      {
        $lookup: {
          from: "departments",
          localField: "emp.department",
          foreignField: "_id",
          as: "dept",
        },
      },
      { $unwind: "$dept" },
      {
        $group: {
          _id: "$dept._id",
          departmentName: { $first: "$dept.name" },
          avgKpiScore: { $avg: "$kpiScore" },
        },
      },
      {
        $project: {
          _id: 1,
          departmentName: 1,
          avgKpiScore: { $round: ["$avgKpiScore", 1] },
        },
      },
      { $sort: { avgKpiScore: -1 } },
    ]);

    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put("/api/performance/finalize/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "hr") {
      return res.status(403).json({ message: "HR access only" });
    }

    const performance = await Performance.findById(req.params.id);

    if (!performance) {
      return res.status(404).json({ message: "Performance record not found" });
    }

    if (performance.status === "Finalized") {
      return res.status(400).json({ message: "Performance already finalized" });
    }

    performance.status = "Finalized";
    performance.finalizedAt = new Date();
    await performance.save();

    await Notification.create({
      title: "Performance Finalized",
      message: "Performance review has been finalized successfully.",
      type: "performance",
      role: "hr",
    });

    res.json({
      message: "Performance finalized successfully ✅",
      performance,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Admin / HR Delete Performance Record
app.delete("/api/performance/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "hr") {
      return res.status(403).json({ message: "Admin or HR access only" });
    }

    const deletedPerformance = await Performance.findByIdAndDelete(
      req.params.id,
    );

    if (!deletedPerformance) {
      return res.status(404).json({ message: "Performance record not found" });
    }

    res.json({ message: "Performance deleted successfully ✅" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ HR Recruitment Dashboard
app.get("/api/hr/recruitment/dashboard", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "hr") {
      return res.status(403).json({ message: "HR access only" });
    }

    const totalJobs = await Job.countDocuments({ createdBy: req.user.id });
    const totalCandidates = await JobApplication.countDocuments();
    const shortlisted = await JobApplication.countDocuments({
      status: "shortlisted",
    });
    const selected = await JobApplication.countDocuments({
      status: "selected",
    });

    res.json({
      totalJobs,
      totalCandidates,
      shortlisted,
      selected,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ HR Create Job
app.post("/api/hr/jobs", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "hr") {
      return res.status(403).json({ message: "HR access only" });
    }

    const {
      title,
      department,
      location,
      type,
      experience,
      description,
      skills,
      salaryRange,
      openings,
    } = req.body;

    const newJob = new Job({
      title,
      department,
      location,
      type,
      experience,
      description,
      skills: Array.isArray(skills)
        ? skills
        : typeof skills === "string"
          ? skills
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
      salaryRange,
      openings,
      createdBy: req.user.id,
      status: "pending",
    });

    await newJob.save();

    await Notification.create({
      title: "New Job Created",
      message: `${title} job has been created and is waiting for admin approval.`,
      type: "recruitment",
      role: "admin",
    });

    res.status(201).json({
      message: "Job created successfully and sent for approval ✅",
      job: newJob,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ HR Get Jobs
app.get("/api/hr/jobs", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "hr") {
      return res.status(403).json({ message: "HR access only" });
    }

    const jobs = await Job.find({ createdBy: req.user.id }).sort({
      createdAt: -1,
    });

    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ HR Delete Job
app.delete("/api/hr/jobs/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "hr") {
      return res.status(403).json({ message: "HR access only" });
    }

    const job = await Job.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    await JobApplication.deleteMany({ jobId: req.params.id });

    res.json({ message: "Job deleted successfully ✅" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ HR Get Candidates
app.get("/api/hr/candidates", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "hr") {
      return res.status(403).json({ message: "HR access only" });
    }

    const candidates = await JobApplication.find()
      .populate("jobId", "title department location")
      .sort({ createdAt: -1 });

    const formattedCandidates = candidates.map((item) => ({
      _id: item._id,
      name: item.fullName,
      email: item.email,
      phone: item.phone,
      skills: item.skills,
      experience: item.experience,
      coverLetter: item.coverLetter,
      resume: item.resume,
      status: item.status,
      jobTitle: item.jobId?.title || "N/A",
      department: item.jobId?.department || "N/A",
      location: item.jobId?.location || "N/A",
      jobId: item.jobId?._id || null,
      appliedAt: item.createdAt,
    }));

    res.json({ candidates: formattedCandidates });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ HR Update Candidate Status
// ✅ HR Update Candidate Status + Send Email
app.put("/api/hr/candidates/:id/status", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "hr") {
      return res.status(403).json({ message: "HR access only" });
    }

    const { status } = req.body;

    if (
      !["applied", "shortlisted", "interview", "selected", "rejected"].includes(
        status,
      )
    ) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const application = await JobApplication.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    ).populate("jobId", "title department location");

    if (!application) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    // 🔔 Admin notification
    await Notification.create({
      title: "Candidate Status Updated",
      message: `${application.fullName} status changed to ${status} for ${application.jobId?.title || "job"}.`,
      type: "recruitment",
      role: "admin",
    });

    // 📧 Interview email
    if (status === "interview") {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: application.email,
        subject: `Interview Invitation - ${application.jobId?.title || "Job Position"}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Interview Invitation</h2>
            <p>Dear <b>${application.fullName}</b>,</p>

            <p>Thank you for applying for the position of 
            <b>${application.jobId?.title || "this role"}</b>.</p>

            <p>We are pleased to inform you that you have been shortlisted for the interview round.</p>

            <p>Our HR team will contact you soon with the interview schedule.</p>

            <p>Best regards,<br/>HR Team<br/>TechnoGuide</p>
          </div>
        `,
      });
    }

    // 📧 Selection email
    if (status === "selected") {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: application.email,
        subject: `Congratulations! Selected for ${application.jobId?.title || "the role"}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Congratulations 🎉</h2>
            <p>Dear <b>${application.fullName}</b>,</p>

            <p>We are happy to inform you that you have been 
            <b>selected</b> for the position of 
            <b>${application.jobId?.title || "Employee"}</b> at TechnoGuide.</p>

            <p>Our HR team will contact you soon regarding the next joining formalities.</p>

            <p>We look forward to welcoming you to our company.</p>

            <p>Best regards,<br/>HR Team<br/>TechnoGuide</p>
          </div>
        `,
      });
    }

    res.json({
      message: `Candidate status updated to ${status} successfully ✅`,
      candidate: application,
    });
  } catch (err) {
    console.log("Candidate status update error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ✅ Admin Recruitment Dashboard
app.get("/api/admin/recruitment/dashboard", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    const totalJobs = await Job.countDocuments();
    const pendingJobs = await Job.countDocuments({ status: "pending" });
    const approvedJobs = await Job.countDocuments({ status: "approved" });
    const totalCandidates = await JobApplication.countDocuments();
    const selectedCandidates = await JobApplication.countDocuments({
      status: "selected",
    });
    const rejectedCandidates = await JobApplication.countDocuments({
      status: "rejected",
    });

    res.json({
      totalJobs,
      pendingJobs,
      approvedJobs,
      totalCandidates,
      selectedCandidates,
      rejectedCandidates,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Admin Get Pending Jobs
app.get("/api/admin/jobs/pending", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    const jobs = await Job.find({ status: "pending" })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Admin Approve / Reject Job
app.put("/api/admin/jobs/:id/status", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access only" });
    }

    const { status, rejectionReason } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updateData = {
      status,
      approvedBy: req.user.id,
      rejectionReason: status === "rejected" ? rejectionReason || "" : "",
    };

    const job = await Job.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    }).populate("createdBy", "name email");

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    await Notification.create({
      title: `Job ${status === "approved" ? "Approved" : "Rejected"}`,
      message: `${job.title} job has been ${status} by admin.`,
      type: "recruitment",
      role: "hr",
    });

    res.json({
      message: `Job ${status} successfully ✅`,
      job,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ==============================
   🔹 Employee Engagement Module APIs
============================== */

// ✅ HR - Create Survey
app.post("/api/engagement/surveys", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "hr") {
      return res.status(403).json({ message: "Only HR can create surveys" });
    }

    const {
      title,
      description,
      questions,
      endDate,
      isAnonymous,
      surveyFor,
      targetDepartment,
      status,
    } = req.body;

    if (
      !title ||
      !Array.isArray(questions) ||
      questions.length === 0 ||
      !endDate
    ) {
      return res.status(400).json({
        message: "Title, questions and endDate are required",
      });
    }

    const cleanQuestions = questions
      .map((q) => ({
        questionText: q.questionText?.trim(),
        category: q.category || "General",
        answerType: q.answerType || "rating",
      }))
      .filter((q) => q.questionText);

    if (cleanQuestions.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one valid question is required" });
    }

    if (surveyFor === "Department" && !targetDepartment) {
      return res
        .status(400)
        .json({ message: "Department is required for department wise survey" });
    }

    const survey = new EngagementSurvey({
      title: title.trim(),
      description: description || "",
      createdBy: req.user.id,
      createdByModel: "HR",
      surveyFor: surveyFor || "All",
      targetDepartment: surveyFor === "Department" ? targetDepartment : null,
      questions: cleanQuestions,
      endDate: new Date(endDate),
      isAnonymous: isAnonymous ?? true,
      status: status || "Active",
    });

    await survey.save();

    await Notification.create({
      title: "New Engagement Survey",
      message: `${survey.title} survey has been created.`,
      type: "engagement",
      role: "admin",
    });

    await Notification.create({
      title: "New Engagement Survey",
      message: `${survey.title} survey is now available for employees.`,
      type: "engagement",
      role: "employee",
    });

    res.status(201).json({
      message: "Engagement survey created successfully ✅",
      survey,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Admin + HR - Get all surveys
app.get("/api/engagement/surveys", verifyToken, async (req, res) => {
  try {
    if (!["admin", "hr", "employee"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    let filter = {};

    if (req.user.role === "employee") {
      const employee = await Employee.findById(req.user.id);

      filter = {
        status: "Active",
        endDate: { $gte: new Date() },
        $or: [
          { surveyFor: "All" },
          {
            surveyFor: "Department",
            targetDepartment: employee?.department || null,
          },
        ],
      };
    }

    const surveys = await EngagementSurvey.find(filter)
      .populate("targetDepartment", "name")
      .sort({ createdAt: -1 });

    res.json(surveys);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Employee - Get available surveys
app.get("/api/employee/engagement/surveys", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ message: "Employee access only" });
    }

    const employee = await Employee.findById(req.user.id);

    const surveys = await EngagementSurvey.find({
      status: "Active",
      endDate: { $gte: new Date() },
      $or: [
        { surveyFor: "All" },
        {
          surveyFor: "Department",
          targetDepartment: employee?.department || null,
        },
      ],
    })
      .populate("targetDepartment", "name")
      .sort({ createdAt: -1 });

    res.json(surveys);
  } catch (err) {
    console.error("Employee engagement surveys error:", err);
    res.status(500).json({ message: err.message });
  }
});

// ✅ Employee - Submit survey response
app.post(
  "/api/employee/engagement/respond/:surveyId",
  verifyToken,
  async (req, res) => {
    try {
      if (req.user.role !== "employee") {
        return res.status(403).json({ message: "Employee access only" });
      }

      const { surveyId } = req.params;
      const { answers, overallComment } = req.body;

      const survey = await EngagementSurvey.findById(surveyId);

      if (!survey) {
        return res.status(404).json({ message: "Survey not found" });
      }

      if (survey.status !== "Active") {
        return res.status(400).json({ message: "Survey is not active" });
      }

      if (new Date(survey.endDate) < new Date()) {
        return res.status(400).json({ message: "Survey has expired" });
      }

      const employee = await Employee.findById(req.user.id);

      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      if (
        survey.surveyFor === "Department" &&
        String(survey.targetDepartment) !== String(employee.department)
      ) {
        return res
          .status(403)
          .json({ message: "This survey is not assigned to your department" });
      }

      const alreadySubmitted = await EngagementResponse.findOne({
        surveyId,
        employeeId: req.user.id,
      });

      if (alreadySubmitted) {
        return res
          .status(400)
          .json({ message: "You already submitted this survey" });
      }

      if (!Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({ message: "Answers are required" });
      }

      const normalizedAnswers = answers.map((a) => ({
        questionText: a.questionText || "",
        category: a.category || "General",
        answerType: a.answerType || "rating",
        rating: a.answerType === "rating" ? Number(a.rating) : null,
        textAnswer: a.answerType === "text" ? a.textAnswer || "" : "",
      }));

      const ratingAnswers = normalizedAnswers.filter(
        (a) =>
          a.answerType === "rating" &&
          a.rating &&
          a.rating >= 1 &&
          a.rating <= 5,
      );

      const workEnvironmentRatings = normalizedAnswers.filter(
        (a) =>
          a.answerType === "rating" &&
          a.category === "Work Environment" &&
          a.rating &&
          a.rating >= 1 &&
          a.rating <= 5,
      );

      const satisfactionScore = calculateAverage(
        ratingAnswers.map((a) => a.rating),
      );

      const workEnvironmentScore = calculateAverage(
        workEnvironmentRatings.map((a) => a.rating),
      );

      const response = new EngagementResponse({
        surveyId,
        employeeId: req.user.id,
        department: employee.department || null,
        answers: normalizedAnswers,
        overallComment: overallComment || "",
        satisfactionScore,
        workEnvironmentScore,
      });

      await response.save();

      await Notification.create({
        title: "Survey Response Submitted",
        message: `${employee.firstName} ${employee.lastName} submitted engagement feedback.`,
        type: "engagement",
        role: "hr",
      });

      await Notification.create({
        title: "Survey Response Submitted",
        message: `${employee.firstName} ${employee.lastName} submitted engagement feedback.`,
        type: "engagement",
        role: "admin",
      });

      res.status(201).json({
        message: "Survey submitted successfully ✅",
        response,
      });
    } catch (err) {
      if (err.code === 11000) {
        return res
          .status(400)
          .json({ message: "You already submitted this survey" });
      }
      res.status(500).json({ message: err.message });
    }
  },
);

// ✅ Admin + HR - Get responses of one survey
app.get(
  "/api/engagement/responses/:surveyId",
  verifyToken,
  async (req, res) => {
    try {
      if (req.user.role !== "admin" && req.user.role !== "hr") {
        return res.status(403).json({ message: "Admin or HR access only" });
      }

      const survey = await EngagementSurvey.findById(req.params.surveyId);

      if (!survey) {
        return res.status(404).json({ message: "Survey not found" });
      }

      const responses = await EngagementResponse.find({
        surveyId: req.params.surveyId,
      })
        .populate("employeeId", "firstName lastName email")
        .populate("department", "name")
        .sort({ createdAt: -1 });

      res.json({
        survey,
        responses,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

// ✅ Admin + HR - Summary dashboard
app.get("/api/engagement/summary", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "hr") {
      return res.status(403).json({ message: "Admin or HR access only" });
    }

    const responses = await EngagementResponse.find()
      .populate("department", "name")
      .sort({ createdAt: -1 });

    const totalResponses = responses.length;

    const satisfactionScores = responses.map((r) => r.satisfactionScore || 0);
    const environmentScores = responses.map((r) => r.workEnvironmentScore || 0);

    const overallSatisfactionScore = calculateAverage(satisfactionScores);
    const overallEnvironmentScore = calculateAverage(environmentScores);

    const departmentMap = {};

    responses.forEach((item) => {
      const deptName = item.department?.name || "No Department";

      if (!departmentMap[deptName]) {
        departmentMap[deptName] = {
          department: deptName,
          totalResponses: 0,
          satisfactionScores: [],
          environmentScores: [],
        };
      }

      departmentMap[deptName].totalResponses += 1;
      departmentMap[deptName].satisfactionScores.push(
        item.satisfactionScore || 0,
      );
      departmentMap[deptName].environmentScores.push(
        item.workEnvironmentScore || 0,
      );
    });

    const departmentWise = Object.values(departmentMap).map((dept) => ({
      department: dept.department,
      totalResponses: dept.totalResponses,
      averageSatisfactionScore: calculateAverage(dept.satisfactionScores),
      averageWorkEnvironmentScore: calculateAverage(dept.environmentScores),
      engagementLevel: getEngagementLevel(
        calculateAverage(dept.satisfactionScores),
      ),
    }));

    res.json({
      totalResponses,
      overallSatisfactionScore,
      overallEnvironmentScore,
      overallEngagementLevel: getEngagementLevel(overallSatisfactionScore),
      departmentWise,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ HR only - Close survey
app.put("/api/engagement/surveys/:id/close", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "hr") {
      return res.status(403).json({ message: "Only HR can close surveys" });
    }

    const survey = await EngagementSurvey.findByIdAndUpdate(
      req.params.id,
      { status: "Closed" },
      { new: true },
    );

    if (!survey) {
      return res.status(404).json({ message: "Survey not found" });
    }

    await Notification.create({
      title: "Survey Closed",
      message: `${survey.title} survey has been closed.`,
      type: "engagement",
      role: "admin",
    });

    res.json({
      message: "Survey closed successfully ✅",
      survey,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ HR only - Delete survey
app.delete("/api/engagement/surveys/:id", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "hr") {
      return res.status(403).json({ message: "Only HR can delete surveys" });
    }

    const survey = await EngagementSurvey.findByIdAndDelete(req.params.id);

    if (!survey) {
      return res.status(404).json({ message: "Survey not found" });
    }

    await EngagementResponse.deleteMany({ surveyId: req.params.id });

    await Notification.create({
      title: "Survey Deleted",
      message: `${survey.title} survey has been deleted.`,
      type: "engagement",
      role: "admin",
    });

    res.json({ message: "Survey and responses deleted successfully ✅" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get("/api/employee/home", verifyToken, async (req, res) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({ message: "Employee access only" });
    }

    const employeeId = req.user.id;
    const now = new Date();

    // ✅ Current month range
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // ✅ Today range
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
    );

    // ✅ Employee
    const employee = await Employee.findById(employeeId)
      .populate("department", "name")
      .populate("designation", "name");

    // ✅ Attendance summary THIS MONTH
    const totalDays = await Attendance.countDocuments({
      employeeId,
      date: { $gte: startOfMonth, $lt: endOfMonth },
    });

    const present = await Attendance.countDocuments({
      employeeId,
      status: "Present",
      date: { $gte: startOfMonth, $lt: endOfMonth },
    });

    const absent = await Attendance.countDocuments({
      employeeId,
      status: "Absent",
      date: { $gte: startOfMonth, $lt: endOfMonth },
    });

    const late = await Attendance.countDocuments({
      employeeId,
      status: "Late",
      date: { $gte: startOfMonth, $lt: endOfMonth },
    });

    const halfDay = await Attendance.countDocuments({
      employeeId,
      status: "Half-Day",
      date: { $gte: startOfMonth, $lt: endOfMonth },
    });

    const todayAttendance = await Attendance.findOne({
      employeeId,
      date: { $gte: startOfToday, $lt: endOfToday },
    });

    const summary = {
      totalDays,
      present,
      absent,
      late,
      halfDay,
      todayStatus: todayAttendance ? todayAttendance.status : "Not Marked",
      presentToday: !!todayAttendance,
    };

    // ✅ Recent leaves
    const leaves = await Leave.find({ employeeId })
      .sort({ createdAt: -1 })
      .limit(10);

    // ✅ Approved leaves THIS MONTH
    const approvedLeaveCount = await Leave.countDocuments({
      employeeId,
      status: "Approved",
      fromDate: { $lt: endOfMonth },
      toDate: { $gte: startOfMonth },
    });

    // ✅ Tasks
    await Task.updateMany(
      {
        assignedTo: employeeId,
        deadline: { $lt: new Date() },
        status: { $nin: ["Completed", "Under Review"] },
      },
      { $set: { status: "Overdue" } },
    );

    const tasks = await Task.find({ assignedTo: employeeId })
      .sort({ createdAt: -1 })
      .limit(10);

    // ✅ Notifications
    const notifications = await Notification.find({ role: "employee" })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      employee,
      summary,
      leaves,
      approvedLeaveCount,
      tasks,
      notifications,
    });
  } catch (err) {
    console.error("Employee home error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

/* ==============================
        🔹 Start Server
      ============================== */

app.get("/", (req, res) => {
  res.send("HRMS Backend is running successfully 🚀");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
