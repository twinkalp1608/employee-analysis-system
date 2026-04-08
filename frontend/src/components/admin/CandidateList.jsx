import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../style/Recruitment.css";

const CandidateList = () => {
  const [candidates, setCandidates] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("https://employee-analysis-system-1.onrender.com/api/hr/candidates", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCandidates(res.data.candidates || []);
    } catch (error) {
      console.log(error);
      setMessage("Failed to fetch candidates");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `https://employee-analysis-system-1.onrender.com/api/hr/candidates/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setMessage(res.data.message || "Status updated successfully");
      fetchCandidates();
    } catch (error) {
      console.log(error);
      setMessage(error.response?.data?.message || "Failed to update status");
    }
  };

  const filteredCandidates = statusFilter
    ? candidates.filter((candidate) => candidate.status === statusFilter)
    : candidates;

  return (
    <div className="recruitment-page">
      <div className="recruitment-table-card">
        <div className="recruitment-header">
          <div>
            <h1 className="recruitment-title">Candidate List</h1>
            <p className="recruitment-subtitle">
              Track applicants and update their recruitment status
            </p>
          </div>
        </div>

        {message && (
          <p
            style={{
              marginBottom: "12px",
              color: "#0f4c81",
              fontWeight: "600",
            }}
          >
            {message}
          </p>
        )}

        <div className="filter-bar">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="applied">Applied</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="interview">Interview</option>
            <option value="selected">Selected</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <table className="recruitment-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Position</th>
              <th>Experience</th>
              <th>Resume</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCandidates.length > 0 ? (
              filteredCandidates.map((candidate) => (
                <tr key={candidate._id}>
                  <td>{candidate.name}</td>
                  <td>{candidate.email}</td>
                  <td>{candidate.jobTitle}</td>
                  <td>{candidate.experience}</td>

                  <td>
                    {candidate.resume ? (
                      <div className="recruitment-actions">
                        <a
                          href={`https://employee-analysis-system-1.onrender.com/api/download-resume/${candidate.resume.split("/").pop()}`}
                          className="recruitment-btn secondary"
                          style={{
                            textDecoration: "none",
                            display: "inline-block",
                          }}
                        >
                          Download Resume
                        </a>
                      </div>
                    ) : (
                      "No Resume"
                    )}
                  </td>

                  <td>
                    <span className={`status-badge status-${candidate.status}`}>
                      {candidate.status}
                    </span>
                  </td>

                  <td>
                    <div className="recruitment-actions">
                      {candidate.status !== "interview" &&
                        candidate.status !== "selected" &&
                        candidate.status !== "rejected" && (
                          <button
                            className="recruitment-btn secondary"
                            onClick={() =>
                              updateStatus(candidate._id, "interview")
                            }
                          >
                            Interview
                          </button>
                        )}

                      {candidate.status !== "selected" &&
                        candidate.status !== "rejected" && (
                          <button
                            className="recruitment-btn approve"
                            onClick={() =>
                              updateStatus(candidate._id, "selected")
                            }
                          >
                            Select
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7">No candidates found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CandidateList;