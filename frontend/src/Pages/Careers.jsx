import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../style/Careers.css";
import logo from "../assets/images/logo.jpg";

export default function Careers() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get("http://localhost:5000/api/jobs");

      // Safe check
      if (res.data && Array.isArray(res.data.jobs)) {
        setJobs(res.data.jobs);
      } else {
        setJobs([]);
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setError("Failed to load jobs");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="careers-page">
      <header className="careers-hero">
        <div className="careers-overlay container">
          {/* 👇 Add this logo */}
    <div className="company-logo">
      <img src={logo} alt="Company Logo" />
    </div>
          <p className="careers-tag">TechnoGuide • Careers</p>
          <h1>Join Our Team</h1>
          <p className="careers-subtitle">
            Explore open positions and apply to grow your career with us.
          </p>

          <div className="careers-hero-actions">
            <button
              className="primary-btn"
              onClick={() => {
                const jobsSection = document.getElementById("open-jobs");
                jobsSection?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              View Open Jobs
            </button>

            <button className="secondary-btn" onClick={() => navigate("/")}>
              Employee / HR Login
            </button>
          </div>
        </div>
      </header>

      <section className="why-join-section">
        <h2>Why Work With Us?</h2>
        <div className="benefits-grid">
          <div className="benefit-card">
            <h3>Growth Opportunities</h3>
            <p>
              Work on real projects, improve your skills, and build your career
              in a supportive environment.
            </p>
          </div>

          <div className="benefit-card">
            <h3>Collaborative Culture</h3>
            <p>
              Join a team that values communication, innovation, and teamwork.
            </p>
          </div>

          <div className="benefit-card">
            <h3>Modern Work Environment</h3>
            <p>
              We focus on productivity, learning, and a positive employee
              experience.
            </p>
          </div>
        </div>
      </section>

      <section className="jobs-section" id="open-jobs">
        <div className="section-heading">
          <h2>Open Positions</h2>
          <p>Find the role that matches your skills and career goals.</p>
        </div>

        {loading && <p>Loading jobs...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}

        {!loading && !error && jobs.length === 0 && (
          <p>No jobs available right now.</p>
        )}

        {!loading && !error && jobs.length > 0 && (
          <div className="jobs-grid">
            {jobs.map((job) => (
              <div className="job-card" key={job._id}>
                <div className="job-top">
                  <h3>{job.title}</h3>
                  <span className="job-badge">{job.department}</span>
                </div>

                <div className="job-meta">
                  <span>📍 {job.location || "N/A"}</span>
                  <span>💼 {job.type || "Full Time"}</span>
                  <span>⭐ {job.experience || "N/A"}</span>
                </div>

                <p className="job-description">{job.description}</p>

                <div className="job-actions">
                  <button
                    className="apply-btn"
                    onClick={() => navigate(`/apply-job/${job._id}`)}
                  >
                    Apply Now
                  </button>

                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      
    </div>
  );
}