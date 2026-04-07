import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../style/Recruitment.css";

const CreateJob = () => {
  const [formData, setFormData] = useState({
    title: "",
    department: "",
    description: "",
    skills: "",
    experience: "",
    salaryRange: "",
    openings: 1,
    location: "",
  });

  const [departments, setDepartments] = useState([]);
  const [jobTitles, setJobTitles] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get("${import.meta.env.VITE_API_URL}/api/departments", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setDepartments(res.data || []);
    } catch (error) {
      console.log("Error fetching departments:", error);
    }
  };

  const fetchJobTitlesByDepartment = async (departmentId) => {
    try {
      const token = localStorage.getItem("token");

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/job-titles/by-department/${departmentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setJobTitles(res.data || []);
    } catch (error) {
      console.log("Error fetching job titles:", error);
      setJobTitles([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "department") {
      const selectedDept = departments.find((dept) => dept.name === value);

      setFormData((prev) => ({
        ...prev,
        department: value,
        title: "",
      }));

      setJobTitles([]);

      if (selectedDept?._id) {
        fetchJobTitlesByDepartment(selectedDept._id);
      }
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");

      const payload = {
        ...formData,
        skills: formData.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter((skill) => skill !== ""),
        openings: Number(formData.openings),
      };

      const res = await axios.post("${import.meta.env.VITE_API_URL}/api/hr/jobs", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setMessage(res.data.message || "Job created successfully");

      setFormData({
        title: "",
        department: "",
        description: "",
        skills: "",
        experience: "",
        salaryRange: "",
        openings: 1,
        location: "",
      });

      setJobTitles([]);
    } catch (error) {
      console.log(error);
      setMessage(error.response?.data?.message || "Failed to create job");
    }
  };

  return (
    <div className="recruitment-page">
      <div className="recruitment-form-card">
        <div className="recruitment-header">
          <div>
            <h1 className="recruitment-title">Create Job</h1>
            <p className="recruitment-subtitle">
              Add a new job vacancy for recruitment
            </p>
          </div>
        </div>

        {message && (
          <p
            style={{
              marginBottom: "16px",
              color: "#0f4c81",
              fontWeight: "600",
            }}
          >
            {message}
          </p>
        )}

        <form className="recruitment-form" onSubmit={handleSubmit}>
          <select
            name="title"
            value={formData.title}
            onChange={handleChange}
            required style={{color:"black"}}
          >
            <option value="">Select Job Title</option>
            {jobTitles.map((job) => (
              <option key={job._id} value={job.name}>
                {job.name}
              </option>
            ))}
          </select>

          <select
            name="department"
            value={formData.department}
            onChange={handleChange}
            required style={{color:"black"}}
          >
            <option value="">Select Department</option>
            {departments.map((dept) => (
              <option key={dept._id} value={dept.name}>
                {dept.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            name="experience"
            placeholder="Experience Required"
            value={formData.experience}
            onChange={handleChange}
          />

          <input
            type="text"
            name="salaryRange"
            placeholder="Salary Range"
            value={formData.salaryRange}
            onChange={handleChange}
          />

          <input
            type="number"
            name="openings"
            placeholder="Openings"
            value={formData.openings}
            onChange={handleChange}
            min="1"
          />

          <input
            type="text"
            name="location"
            placeholder="Location"
            value={formData.location}
            onChange={handleChange}
          />

          <input
            type="text"
            name="skills"
            placeholder="Skills (comma separated)"
            value={formData.skills}
            onChange={handleChange}
            className="full-width"
          />

          <textarea
            name="description"
            placeholder="Job Description"
            value={formData.description}
            onChange={handleChange}
            className="full-width"
            required
          />

          <div className="full-width">
            <button type="submit" className="recruitment-btn">
              Create Job
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateJob;