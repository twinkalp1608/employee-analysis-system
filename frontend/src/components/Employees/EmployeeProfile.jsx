import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../style/EmployeeProfile.css";

const EmployeeProfile = () => {
  const [employee, setEmployee] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
const [formData, setFormData] = useState({});

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(
          "${import.meta.env.VITE_API_URL}/api/employee-dashboard",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        setEmployee(res.data.employee);
      } catch (error) {
        console.log("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, []);


  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-GB");
  };

  if (!employee) {
    return <div className="profile-loading">Loading...</div>;
  }

  const handleChange = (e) => {
  setFormData({
    ...formData,
    [e.target.name]: e.target.value,
  });
};

const handleEditClick = () => {
  setIsEditing(true);
  setFormData({
    ...employee,
    firstName: employee.firstName || "",
    lastName: employee.lastName || "",
    email: employee.email || "",
    mobile: employee.mobile || "",
    gender: employee.gender || "",
    dob: employee.dob ? employee.dob.slice(0, 10) : "",
    address: employee.address || "",
  });
};

const handleSave = async () => {
  try {
    await axios.put(
      `${import.meta.env.VITE_API_URL}/api/employees/${employee._id}`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    setEmployee(formData);
    setIsEditing(false);
    alert("Profile updated successfully!");
  } catch (error) {
    console.log("Error updating profile:", error);
    alert("Error updating profile");
  }
};

  return (
    <div className="profile-page">
      <div className="profile-wrapper">
        {/* Top Card */}
        <div className="profile-header-card">
          <div className="profile-header-left">
           <div className="profile-image-box">
  <img
    src={
      employee.profilePhoto
        ? employee.profilePhoto.startsWith("http")
          ? employee.profilePhoto
          : employee.profilePhoto.startsWith("/uploads/")
          ? `${import.meta.env.VITE_API_URL}${employee.profilePhoto}`
          : employee.profilePhoto.startsWith("uploads/")
          ? `${import.meta.env.VITE_API_URL}/${employee.profilePhoto}`
          : `${import.meta.env.VITE_API_URL}/uploads/${employee.profilePhoto}`
        : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
    }
    alt="Profile"
    className="profile-img"
    onError={(e) => {
      e.target.src =
        "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
    }}
  />
</div>

            <div className="profile-main-info">
              <h2>
                {employee.firstName} {employee.lastName}
              </h2>
              <p className="profile-role">
                {employee.designation?.name || "No Designation"}
              </p>
              <p className="profile-dept">
                {employee.department?.name || "No Department"}
              </p>

              <span className="profile-status-badge">Active Employee</span>
            </div>
          </div>

          <div className="profile-header-right">
  {isEditing ? (
    <>
      <button className="save-btn" onClick={handleSave}>
        💾 Save
      </button>
      <button
        className="cancel-btn"
        onClick={() => {
          setIsEditing(false);
          setFormData({});
        }}
      >
        ❌ Cancel
      </button>
    </>
  ) : (
    <button className="edit-profile-btn" onClick={handleEditClick}>
      ✏ Edit Profile
    </button>
  )}
</div>
        </div>

        {/* Cards */}
        <div className="profile-grid">
          <div className="profile-card">
  <h3>👤 Personal Information</h3>

  {isEditing ? (
    <div className="edit-form">
      <input
        type="text"
        name="firstName"
        placeholder="First Name"
        value={formData.firstName || ""}
        onChange={handleChange}
      />

      <input
        type="text"
        name="lastName"
        placeholder="Last Name"
        value={formData.lastName || ""}
        onChange={handleChange}
      />

      <input
        type="email"
        name="email"
        placeholder="Email"
        value={formData.email || ""}
        onChange={handleChange}
      />

      <input
        type="text"
        name="mobile"
        placeholder="Mobile"
        value={formData.mobile || ""}
        onChange={handleChange}
      />

      <input
        type="text"
        name="gender"
        placeholder="Gender"
        value={formData.gender || ""}
        onChange={handleChange}
      />

      <input
        type="date"
        name="dob"
        value={formData.dob || ""}
        onChange={handleChange}
      />
    </div>
  ) : (
    <>
      <div className="info-row">
        <span>Full Name</span>
        <strong>
          {employee.firstName} {employee.lastName}
        </strong>
      </div>

      <div className="info-row">
        <span>Email</span>
        <strong>{employee.email || "N/A"}</strong>
      </div>

      <div className="info-row">
        <span>Mobile</span>
        <strong>{employee.mobile || "N/A"}</strong>
      </div>

      <div className="info-row">
        <span>Gender</span>
        <strong>{employee.gender || "N/A"}</strong>
      </div>

      <div className="info-row">
        <span>Date of Birth</span>
        <strong>{formatDate(employee.dob)}</strong>
      </div>
    </>
  )}
</div>

          <div className="profile-card">
            <h3>💼 Professional Details</h3>

            <div className="info-row">
              <span>Employee ID</span>
              <strong>{employee.employeeId || "N/A"}</strong>
            </div>

            <div className="info-row">
              <span>Department</span>
              <strong>{employee.department?.name || "N/A"}</strong>
            </div>

            <div className="info-row">
              <span>Designation</span>
              <strong>{employee.designation?.name || "N/A"}</strong>
            </div>

            <div className="info-row">
              <span>Joining Date</span>
              <strong>{formatDate(employee.joiningDate)}</strong>
            </div>

            <div className="info-row">
              <span>Salary</span>
              <strong>₹ {employee.salary || "0"}</strong>
            </div>
          </div>

         <div className="profile-card full-width">
  <h3>📍 Address</h3>

  {isEditing ? (
    <textarea
      name="address"
      rows="4"
      placeholder="Enter address"
      value={formData.address || ""}
      onChange={handleChange}
      className="profile-textarea"
    ></textarea>
  ) : (
    <div className="address-box">
      {employee.address || "Address not available"}
    </div>
  )}
</div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;