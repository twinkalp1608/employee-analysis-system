import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const EmployeeView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);

 const downloadResume = async () => {
  try {

    const token = localStorage.getItem("token");

    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/${employee.resume}`,
      {
        responseType: "blob",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `${employee.firstName}_${employee.lastName}_Resume.pdf`
    );

    document.body.appendChild(link);
    link.click();
    link.remove();

  } catch (error) {
    console.error("Download error:", error);
  }
};


useEffect(() => {

  const token = localStorage.getItem("token");

  axios.get(
    `${import.meta.env.VITE_API_URL}/api/employees/${id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )
  .then((res) => setEmployee(res.data))
  .catch((err) => console.log(err));

}, [id]);


  if (!employee) return <h3>Loading...</h3>;

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor:"darkblue",
        padding: "40px",
      }}
    >
      {/* 🔙 Back Button */}
      <button
        onClick={() => navigate('/dashboard/employee')}
        style={{
          background: "#fff",
          color: "#0f4c81",
          border: "none",
          padding: "10px 18px",
          borderRadius: "8px",
          fontWeight: "bold",
          cursor: "pointer",
          marginBottom: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        }}
      >
        ← Back
      </button>

      {/* 📦 Main Card */}
      <div
        style={{
          background: "#fff",
          borderRadius: "18px",
          padding: "35px",
          maxWidth: "950px",
          margin: "auto",
          boxShadow: "0 10px 35px rgba(0,0,0,0.25)",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            color: "#0f4c81",
            marginBottom: "30px",
          }}
        >
          Employee Profile
        </h2>

        {/* 👤 Profile Section */}
        <div
          style={{
            display: "flex",
            gap: "30px",
            alignItems: "center",
            borderBottom: "2px solid #eee",
            paddingBottom: "25px",
            marginBottom: "25px",
          }}
        >
          <img
            src={`${import.meta.env.VITE_API_URL}/${employee.profilePhoto}`}
            alt="Profile"
            width="140"
            height="140"
            style={{
              borderRadius: "15px",
              objectFit: "cover",
              border: "5px solid #ff7a00",
            }}
          />

          <div>
            <h2 style={{ margin: 0, color: "#0f4c81" }}>
              {employee.firstName} {employee.lastName}
            </h2>

            <p style={{ margin: "6px 0", fontSize: "18px" }}>
              {employee.designation?.name}
            </p>

            <span
              style={{
                background: "#0f4c81",
                color: "#fff",
                padding: "5px 12px",
                borderRadius: "20px",
                fontSize: "14px",
              }}
            >
              {employee.department?.name}
            </span>
          </div>
        </div>

        {/* 📋 Info Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "18px",
            fontSize: "16px",
          }}
        >
          <p><b>Email:</b> {employee.email}</p>
          <p><b>Mobile:</b> {employee.mobile}</p>
          <p><b>Salary:</b> ₹{employee.salary}</p>
          <p><b>Status:</b> {employee.status}</p>
          <p><b>Joining Date:</b> {new Date(employee.joiningDate).toLocaleDateString()}</p>
          <p><b>Gender:</b> {employee.gender}</p>
        </div>

        {/* 📄 Resume Button */}
        <div style={{ textAlign: "center", marginTop: "35px" }}>
          <button
            onClick={downloadResume}
            style={{
              background: "#ff7a00",
              color: "#fff",
              border: "none",
              padding: "14px 28px",
              borderRadius: "10px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            }}
          >
            ⬇ Download Resume
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeView;
