import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../style/Careers.css";

export default function ApplyJob() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    skills: "",
    experience: "",
    coverLetter: "",
  });

  const [resume, setResume] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchJobDetails();
  }, []);

  // Fetch job details
  const fetchJobDetails = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/jobs/${jobId}`);
      setJob(res.data.job);
    } catch (error) {
      console.log(error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setResume(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const form = new FormData();
      form.append("jobId", jobId);
      form.append("fullName", formData.fullName);
      form.append("email", formData.email);
      form.append("phone", formData.phone);
      form.append("skills", formData.skills);
      form.append("experience", formData.experience);
      form.append("coverLetter", formData.coverLetter);

      if (resume) {
        form.append("resume", resume);
      }

      const res = await axios.post(
        "${import.meta.env.VITE_API_URL}/api/candidates/apply",
        form
      );

      setMessage(res.data.message || "Application submitted successfully");

      setTimeout(() => {
        navigate("/careers");
      }, 1500);
    } catch (error) {
      console.log(error);
      setMessage(error.response?.data?.message || "Failed to apply");
    }
  };

  return (
    <div className="careers-page">
      <section className="jobs-section">
        <div className="section-heading">
          <h2>Apply for Job</h2>
          <p>Complete the form below to submit your application.</p>
        </div>

        {/* Job Info */}
        {job && (
          <div className="job-card" style={{ marginBottom: "20px" }}>
            <h3>{job.title}</h3>
            <p>📍 {job.location}</p>
            <p>💼 {job.department}</p>
            <p>{job.description}</p>
          </div>
        )}

        {message && (
          <p style={{ color: "#0f4c81", fontWeight: "600", marginBottom: "10px" }}>
            {message}
          </p>
        )}

        <form className="recruitment-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={handleChange}
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="phone"
            placeholder="Mobile Number"
            value={formData.phone}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="skills"
            placeholder="Skills"
            value={formData.skills}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="experience"
            placeholder="Experience"
            value={formData.experience}
            onChange={handleChange}
            required
          />

          <textarea
            name="coverLetter"
            placeholder="Cover Letter"
            rows="5"
            value={formData.coverLetter}
            onChange={handleChange}
          />

          {/* Resume Upload */}
          <input type="file" onChange={handleFileChange} />

          <button type="submit">Submit Application</button>
        </form>
      </section>
    </div>
  );
}