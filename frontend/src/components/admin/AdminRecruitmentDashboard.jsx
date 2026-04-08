import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../style/Recruitment.css";

const AdminRecruitmentDashboard = () => {
  const [stats, setStats] = useState({
    totalJobs: 0,
    pendingJobs: 0,
    approvedJobs: 0,
    totalCandidates: 0,
    selectedCandidates: 0,
    rejectedCandidates: 0,
  });

  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAdminRecruitmentStats();
  }, []);

  const fetchAdminRecruitmentStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "http://localhost:5000/api/admin/recruitment/dashboard",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setStats(res.data);
    } catch (error) {
      console.log("Error fetching admin recruitment stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      title: "Total Jobs",
      value: stats.totalJobs,
      icon: "💼",
      desc: "All recruitment job posts",
      className: "jobs-card",
    },
    {
      title: "Pending Jobs",
      value: stats.pendingJobs,
      icon: "⏳",
      desc: "Awaiting admin approval",
      className: "pending-card",
    },
    {
      title: "Approved Jobs",
      value: stats.approvedJobs,
      icon: "✅",
      desc: "Approved vacancies",
      className: "approved-card",
    },
    {
      title: "Total Candidates",
      value: stats.totalCandidates,
      icon: "👥",
      desc: "All applications received",
      className: "candidates-card",
    },
    {
      title: "Selected Candidates",
      value: stats.selectedCandidates,
      icon: "🎉",
      desc: "Successfully selected",
      className: "selected-card",
    },
    {
      title: "Rejected Candidates",
      value: stats.rejectedCandidates,
      icon: "❌",
      desc: "Rejected profiles",
      className: "rejected-card",
    },
  ];

  return (
    <div className="recruitment-dashboard-page">

      <div className="recruitment-stats-grid admin-stats-grid">
        {cards.map((card, index) => (
          <div key={index} className={`recruitment-stat-card ${card.className}`}>
            <div className="recruitment-stat-top">
              <div className="recruitment-stat-icon">{card.icon}</div>
              <div>
                <h3>{card.title}</h3>
                <p>{card.desc}</p>
              </div>
            </div>
            <div className="recruitment-stat-value">
              {loading ? "..." : card.value}
            </div>
          </div>
        ))}
      </div>

      <div className="recruitment-dashboard-bottom">
        <div className="recruitment-overview-card">
          <div className="section-header">
            <h2>Approval Overview</h2>
            <span>Admin Monitoring</span>
          </div>

          <div className="overview-list">
            <div className="overview-item">
              <span>Total Jobs</span>
              <strong>{loading ? "..." : stats.totalJobs}</strong>
            </div>
            <div className="overview-item">
              <span>Pending Approval</span>
              <strong>{loading ? "..." : stats.pendingJobs}</strong>
            </div>
            <div className="overview-item">
              <span>Approved Jobs</span>
              <strong>{loading ? "..." : stats.approvedJobs}</strong>
            </div>
            <div className="overview-item">
              <span>Total Candidates</span>
              <strong>{loading ? "..." : stats.totalCandidates}</strong>
            </div>
          </div>
        </div>

        <div className="recruitment-overview-card">
          <div className="section-header">
            <h2>Candidate Outcome</h2>
            <span>Hiring Result</span>
          </div>

          <div className="insight-box">
            <div className="insight-row">
              <label>Selected</label>
              <progress
                value={stats.selectedCandidates || 0}
                max={Math.max(stats.totalCandidates || 1, 1)}
              ></progress>
              <span>{loading ? "..." : stats.selectedCandidates}</span>
            </div>

            <div className="insight-row">
              <label>Rejected</label>
              <progress
                value={stats.rejectedCandidates || 0}
                max={Math.max(stats.totalCandidates || 1, 1)}
              ></progress>
              <span>{loading ? "..." : stats.rejectedCandidates}</span>
            </div>

            <div className="insight-row">
              <label>Approved Jobs</label>
              <progress
                value={stats.approvedJobs || 0}
                max={Math.max(stats.totalJobs || 1, 1)}
              ></progress>
              <span>{loading ? "..." : stats.approvedJobs}</span>
            </div>
          </div>
        </div>
      </div>

      
    </div>
  );
};

export default AdminRecruitmentDashboard;