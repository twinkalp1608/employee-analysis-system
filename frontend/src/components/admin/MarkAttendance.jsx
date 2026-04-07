import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const MarkAttendance = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
 const [formData, setFormData] = useState({
  employeeId: "",
  date: "",
  status: "Present",
  inTime: "",
  outTime: "",
  remarks: "",
  regularizationReason: ""
});

  const token = localStorage.getItem("token");
  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

 const fetchEmployees = async () => {
  try {
    const res = await axios.get("${import.meta.env.VITE_API_URL}/api/employees", config);
    setEmployees(res.data);
  } catch (error) {
    console.error("Error fetching employees:", error.response?.data || error.message);
  }
};

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updatedData = { ...formData, [name]: value };

    if (name === "status" && (value === "Absent" || value === "Leave")) {
      updatedData.inTime = "";
      updatedData.outTime = "";
    }

    setFormData(updatedData);
  };

 const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    await axios.post(
      "${import.meta.env.VITE_API_URL}/api/admin/attendance",
      formData,
      config
    );

    alert("Attendance Added ✅");
    setFormData({
  employeeId: "",
  date: "",
  status: "Present",
  inTime: "",
  outTime: "",
  remarks: "",
  regularizationReason: ""
});

    // 🔥 Redirect to Attendance List
navigate("/dashboard/attendance/list");
  } catch (err) {
    console.error(err);
alert(err.response?.data?.message || "Error adding attendance ❌");
  }
};
  const isTimeDisabled =
  formData.status === "Absent" || formData.status === "Leave";

  return (
    <div className="attendance-card">
      <h2>Mark Attendance</h2>


      <form onSubmit={handleSubmit} className="attendance-form">
<select
  name="employeeId"
  value={formData.employeeId}
  onChange={handleChange}
  required
>   
       <option value="">Select Employee</option>
          {employees.map((emp) => (
            <option key={emp._id} value={emp._id}>
              {emp.firstName} {emp.lastName}
            </option>
          ))}
        </select>

<input
  type="date"
  name="date"
  value={formData.date}
  onChange={handleChange}
  required
/>
        <select
  name="status"
  value={formData.status}
  onChange={handleChange}
>
  <option value="Present">Present</option>
  <option value="Absent">Absent</option>
  <option value="Half-Day">Half-Day</option>
  <option value="Leave">Leave</option>
  <option value="Late">Late</option>
  <option value="WFH">WFH</option>
</select>

<input
  type="time"
  name="inTime"
  value={formData.inTime}
  onChange={handleChange}
  disabled={isTimeDisabled}
/>

<input
  type="time"
  name="outTime"
  value={formData.outTime}
  onChange={handleChange}
  disabled={isTimeDisabled}
/>

       <input
  type="text"
  name="remarks"
  placeholder="Remarks"
  value={formData.remarks}
  onChange={handleChange}
/>
<input
  type="text"
  name="regularizationReason"
  placeholder="Regularization Reason"
  value={formData.regularizationReason}
  onChange={handleChange}
/>

        <button type="submit" className="add-btn">
          Add Attendance
        </button>
      </form>
    </div>
  );
};

export default MarkAttendance;