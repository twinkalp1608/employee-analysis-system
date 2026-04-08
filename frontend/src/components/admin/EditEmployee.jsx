import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "../../style/AddEmployee.css";

const EditEmployee = () => {
  const { id } = useParams(); // Get employee ID from URL
const [designations, setDesignations] = useState([]);
const [filteredDesignations, setFilteredDesignations] = useState([]);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");

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


  // Fetch employee data when component mounts
 useEffect(() => {
  axios
    .get(`https://employee-analysis-system-1.onrender.com//api/employees/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      const data = res.data;

      setFormData(prev => ({
        ...prev,
        employeeId: data.employeeId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        mobile: data.mobile,
        gender: data.gender,
        department: data.department?._id || data.department,
        designation: data.designation?._id || data.designation,
        joiningDate: data.joiningDate?.slice(0, 10),
        salary: data.salary,
        // role: data.role,
        status: data.status,
        password: "",
        address: data.address,
        dob: data.dob?.slice(0, 10)
      }));

    })
    .catch(err => console.error(err));
}, [id, token]);

  useEffect(() => {
  axios
    .get("https://employee-analysis-system-1.onrender.com//api/departments", {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setDepartments(res.data))
    .catch(err => console.error(err));
}, []);

useEffect(() => {
  axios
    .get("https://employee-analysis-system-1.onrender.com//api/designations", {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setDesignations(res.data))
    .catch(err => console.error(err));
}, []);

useEffect(() => {
  if (formData.department && designations.length > 0) {
    const filtered = designations.filter(
      des => des.department?._id === formData.department
    );
    setFilteredDesignations(filtered);
  } else {
    setFilteredDesignations([]);
  }
}, [formData.department, designations]);



  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };
  const handleDepartmentChange = (e) => {
  const value = e.target.value;

  setFormData(prev => ({
    ...prev,
    department: value,
    designation: ""
  }));
};

  const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const data = new FormData();
    for (let key in formData) {
      if (formData[key] !== null) data.append(key, formData[key]);
    }

    const res = await axios.put(
      `https://employee-analysis-system-1.onrender.com//api/employees/${id}`,
      data,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`
        }
      }
    );

    alert(res.data.message || "Employee updated successfully!");
    
    // 🔹 Redirect to Employee List (dashboard)
    navigate("/dashboard/employee");

  } catch (error) {
    alert(error.response?.data?.message || "Error updating employee");
    console.error(error.response?.data);
  }
};
const selectedDeptName = departments.find(dep => dep._id === formData.department)?.name;



  return (
    <div className="add-employee-container">
      <div className="form-card">
        <h2>Edit Employee</h2>
        <form onSubmit={handleSubmit} className="form-grid">
          <input type="text" name="employeeId" value={formData.employeeId} readOnly />
          <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} required />
          <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} required />
{userRole !== "hr" && (
  <input
    type="email"
    name="email"
    placeholder="Email"
    value={formData.email}
    onChange={handleChange}
    required
  />
)}
          <input type="text" name="mobile" placeholder="Mobile" value={formData.mobile} onChange={handleChange} required />
       {userRole !== "hr" && (
  <select
    name="gender"
    value={formData.gender}
    onChange={handleChange}
    required
  >
    <option value="">Select Gender</option>
    <option value="Male">Male</option>
    <option value="Female">Female</option>
  </select>
)}
<select
  name="department"
  value={formData.department}
  onChange={handleDepartmentChange}
  required
>
  <option value="">Select Department</option>
  {departments.map(dep => (
    <option key={dep._id} value={dep._id}>{dep.name}</option>
  ))}
</select>
<select
  name="designation"
  value={formData.designation}
  onChange={handleChange}
  required
  disabled={!formData.department}
>
  <option value="">Select Designation</option>
  {filteredDesignations.map(des => (
    <option key={des._id} value={des._id}>
      {des.name}
    </option>
  ))} 
</select>




{userRole !== "hr" && (
  <input
    type="date"
    name="joiningDate"
    value={formData.joiningDate}
    onChange={handleChange}
    required
  />
)}
{userRole !== "hr" && (
  <input
    type="number"
    name="salary"
    placeholder="Salary"
    value={formData.salary}
    onChange={handleChange}
    required
  />
)}
          {/* <select name="role" value={formData.role} onChange={handleChange} required  >
            <option value="Employee">Employee</option>
            <option value="HR">HR</option>
            <option value="Manager">Manager</option>
          </select> */}
          <select name="status" value={formData.status} onChange={handleChange}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
{userRole !== "hr" && (
  <input
    type="password"
    name="password"
    placeholder="Password (leave blank to keep)"
    onChange={handleChange}
  />
)}
          <input type="text" name="address" placeholder="Address" value={formData.address} onChange={handleChange} required />
          <input type="date" name="dob" value={formData.dob} onChange={handleChange} required />
          <div>
            <label>Upload Resume</label>
            <input type="file" name="resume" onChange={handleChange} accept=".pdf,.doc,.docx" />
          </div>
          <div>
            <label>Upload Profile Photo</label>
            <input type="file" name="profilePhoto" onChange={handleChange} accept=".jpg,.jpeg,.png" />
          </div>
          <button type="submit" className="submit-btn">Update Employee</button>
        </form>
      </div>
    </div>
  );
};

export default EditEmployee;
