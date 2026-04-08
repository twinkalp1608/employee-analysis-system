import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import axios from "axios";
import "../../style/AddEmployee.css";



const AddEmployee = () => {
  const [designations, setDesignations] = useState([]);

   const navigate = useNavigate();
  const [formData, setFormData] = useState({
    employeeId: "",
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    gender: "",
    department: "",
    designation: "",
    joiningDate: "",
    salary: "",
    // role: "Employee",
    status: "Active",
    password: "",
    address: "",
    dob: "",
    resume: null,
    profilePhoto: null
  });

   const [departments, setDepartments] = useState([]);

  const token = localStorage.getItem("token");

  // Auto-generate Employee ID
  useEffect(() => {
  // 🔹 Generate Employee ID
  const randomId = "EMP" + Math.floor(1000 + Math.random() * 9000);
  setFormData(prev => ({ ...prev, employeeId: randomId }));

  // 🔹 Fetch Departments
  axios.get("http://localhost:5000/api/departments", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  .then(res => {
  console.log("Departments:", res.data);
  setDepartments(res.data);
})
  .catch(err => console.log(err));

}, [token]);


 
  const handleChange = (e) => {
  const { name, value, files } = e.target;

  if (files && files.length > 0) {
    setFormData(prev => ({ ...prev, [name]: files[0] }));
  } else {
    setFormData(prev => ({ ...prev, [name]: value }));
  }
};


  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const data = new FormData();
    for (let key in formData) {
      if (formData[key] !== null) data.append(key, formData[key]);
    }

    const res = await axios.post(
      "http://localhost:5000/api/employees",
      data,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`
        }
      }
    );

    alert("Employee Added Successfully");

    // ✅ Redirect after save
    navigate("/dashboard/employee");

  } catch (error) {
    alert(error.response?.data?.message || "Error adding employee");
  }
};


  return (
    <div className="add-employee-container">
      <div className="form-card">
        <h2>Add New Employee</h2>
        <form onSubmit={handleSubmit} className="form-grid">
          <input type="text" name="employeeId" value={formData.employeeId} readOnly />
          <input type="text" name="firstName" placeholder="First Name" onChange={handleChange} required />
          <input type="text" name="lastName" placeholder="Last Name" onChange={handleChange} required />
          <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
          <input type="text" name="mobile" placeholder="Mobile" onChange={handleChange} required />
          <select name="gender" onChange={handleChange} required>
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          {/* <input type="text" name="department" placeholder="Department" onChange={handleChange} required />
          <input type="text" name="designation" placeholder="Designation" onChange={handleChange} required /> */}
   <select
  name="department"
  value={formData.department}
  onChange={async (e) => {
    handleChange(e);

    const deptId = e.target.value;

    // Reset designation
    setFormData(prev => ({
      ...prev,
      designation: ""
    }));

    if (deptId) {
      const res = await axios.get(
      `http://localhost:5000/api/designations?departmentId=${deptId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setDesignations(res.data);
    } else {
      setDesignations([]);
    }
  }}
  required
>
  <option value="">Select Department</option>

  {departments.map((dep) => (
    <option key={dep._id} value={dep._id}>
      {dep.name}
    </option>
  ))}
</select>
<select
  name="designation"
  value={formData.designation}
  onChange={handleChange}
  required
>
  <option value="">Select Designation</option>

  {designations.map((des) => (
    <option key={des._id} value={des._id}>
      {des.name}
    </option>
  ))}
</select>




          {/* Joining Date */}
<div>
  <label>Joining Date</label>
  <input
    type="date"
    name="joiningDate"
    value={formData.joiningDate}
    onChange={handleChange}
    required
  />
</div>
          <input type="number" name="salary" placeholder="Salary" onChange={handleChange} required />
          {/* <select name="role" onChange={handleChange}>
            <option value="Employee">Employee</option>
            <option value="HR">HR</option>
            <option value="Manager">Manager</option>
          </select> */}
          <select name="status" onChange={handleChange}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <input type="password" name="password" placeholder="Password" onChange={handleChange} required />
          <input type="text" name="address" placeholder="Address" onChange={handleChange} required />
          <div>
  <label>Birth Date</label>
  <input
    type="date"
    name="dob"
    value={formData.dob}
    onChange={handleChange}
    required
  />
</div>
          <div>
            <label>Upload Resume</label>
            <input type="file" name="resume" onChange={handleChange} accept=".pdf,.doc,.docx" required />
          </div>
          <div>
            <label>Upload Profile Photo</label>
            <input type="file" name="profilePhoto" onChange={handleChange} accept=".jpg,.jpeg,.png" required />
          </div>
          <button type="submit" className="submit-btn">Save Employee</button>
        </form>
      </div>
    </div>
  );
};

export default AddEmployee;
