import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../style/Recruitment.css";

const AdminJobApproval = () => {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    fetchPendingJobs();
  }, []);

  const fetchPendingJobs = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("https://employee-analysis-system-1.onrender.com//api/admin/jobs/pending", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setJobs(res.data.jobs || []);
    } catch (error) {
      console.log(error);
    }
  };

  const updateJobStatus = async (id, status) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `https://employee-analysis-system-1.onrender.com//api/admin/jobs/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchPendingJobs();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="recruitment-page">
      <div className="recruitment-table-card">
        <div className="recruitment-header">
          <div>
            <h1 className="recruitment-title">Admin Job Approval</h1>
            <p className="recruitment-subtitle">Approve or reject job requests created by HR</p>
          </div>
        </div>

        <table className="recruitment-table">
          <thead>
            <tr>
              <th>Job Title</th>
              <th>Department</th>
              <th>Location</th>
              <th>Openings</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.length > 0 ? (
              jobs.map((job) => (
                <tr key={job._id}>
                  <td>{job.title}</td>
                  <td>{job.department}</td>
                  <td>{job.location}</td>
                  <td>{job.openings}</td>
                  <td>
                    <span className={`status-badge status-${job.status}`}>
                      {job.status}
                    </span>
                  </td>
                  <td>
                    <div className="recruitment-actions">
                      <button
                        className="recruitment-btn approve"
                        onClick={() => updateJobStatus(job._id, "approved")}
                      >
                        Approve
                      </button>
                      <button
                        className="recruitment-btn reject"
                        onClick={() => updateJobStatus(job._id, "rejected")}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">No pending jobs found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminJobApproval;