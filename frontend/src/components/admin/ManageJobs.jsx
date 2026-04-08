import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../style/Recruitment.css";

const ManageJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/hr/jobs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setJobs(res.data.jobs || []);
    } catch (error) {
      console.log(error);
      setMessage("Failed to fetch jobs");
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/hr/jobs/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchJobs();
    } catch (error) {
      console.log(error);
      setMessage("Failed to delete job");
    }
  };

  return (
    <div className="recruitment-page">
      <div className="recruitment-table-card">
        <div className="recruitment-header">
          <div>
            <h1 className="recruitment-title">Manage Jobs</h1>
            <p className="recruitment-subtitle">View and manage all created vacancies</p>
          </div>
        </div>

        {message && <p style={{ marginBottom: "12px", color: "red" }}>{message}</p>}

        <table className="recruitment-table">
          <thead>
            <tr>
              <th>Title</th>
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
                      <button className="recruitment-btn secondary">Edit</button>
                      <button
                        className="recruitment-btn reject"
                        onClick={() => handleDelete(job._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">No jobs found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageJobs;