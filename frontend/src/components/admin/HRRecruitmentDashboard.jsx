import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../style/Recruitment.css";

const HRRecruitmentDashboard = () => {
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalCandidates: 0,
    shortlisted: 0,
    selected: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "https://employee-analysis-system-1.onrender.com/api/hr/recruitment/dashboard",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setStats(res.data);
    } catch (error) {
      console.log("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      title: "Total Jobs",
      value: stats.totalJobs,
      icon: "💼",
      desc: "All job openings created",
      className: "jobs-card",
    },
    {
      title: "Total Candidates",
      value: stats.totalCandidates,
      icon: "👥",
      desc: "Applications received",
      className: "candidates-card",
    },
    {
      title: "Shortlisted",
      value: stats.shortlisted,
      icon: "📄",
      desc: "Candidates moved to shortlist",
      className: "shortlisted-card",
    },
    {
      title: "Selected",
      value: stats.selected,
      icon: "✅",
      desc: "Final selected candidates",
      className: "selected-card",
    },
  ];

  return (
    <div className="recruitment-dashboard-page">
      

      <div className="recruitment-stats-grid">
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
            <h2>Hiring Overview</h2>
            <span>Summary</span>
          </div>

          <div className="overview-list">
            <div className="overview-item">
              <span>Open Positions</span>
              <strong>{loading ? "..." : stats.totalJobs}</strong>
            </div>
            <div className="overview-item">
              <span>Total Applications</span>
              <strong>{loading ? "..." : stats.totalCandidates}</strong>
            </div>
            <div className="overview-item">
              <span>Shortlisted Profiles</span>
              <strong>{loading ? "..." : stats.shortlisted}</strong>
            </div>
            <div className="overview-item">
              <span>Successful Hires</span>
              <strong>{loading ? "..." : stats.selected}</strong>
            </div>
          </div>
        </div>

        <div className="recruitment-overview-card">
          <div className="section-header">
            <h2>Quick Insights</h2>
            <span>Recruitment Flow</span>
          </div>

          <div className="insight-box">
            <div className="insight-row">
              <label>Total Candidates</label>
              <progress
                value={stats.totalCandidates || 0}
                max={Math.max(stats.totalCandidates || 1, 1)}
              ></progress>
              <span>{loading ? "..." : stats.totalCandidates}</span>
            </div>

            <div className="insight-row">
              <label>Shortlisted</label>
              <progress
                value={stats.shortlisted || 0}
                max={Math.max(stats.totalCandidates || 1, 1)}
              ></progress>
              <span>{loading ? "..." : stats.shortlisted}</span>
            </div>

            <div className="insight-row">
              <label>Selected</label>
              <progress
                value={stats.selected || 0}
                max={Math.max(stats.totalCandidates || 1, 1)}
              ></progress>
              <span>{loading ? "..." : stats.selected}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRRecruitmentDashboard;