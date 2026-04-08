import React, { useEffect, useState } from "react";
import axios from "axios";

const AttendanceList = () => {
  const [attendance, setAttendance] = useState([]);
  const [filterDate, setFilterDate] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
const [selectedAttendance, setSelectedAttendance] = useState(null);
const [editForm, setEditForm] = useState({
  status: "",
  inTime: "",
  outTime: "",
  remarks: "",
  regularizationReason: ""
});

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

const fetchAttendance = async () => {
  try {
    const res = await axios.get(
      "http://localhost:5000/api/admin/attendance",
      config
    );
    setAttendance(res.data);
  } catch (error) {
    console.log("Error fetching attendance:", error.response?.data);
  }
};

const handleEditClick = (item) => {
  setSelectedAttendance(item);
  setEditForm({
    status: item.status || "",
    inTime: item.inTime || "",
    outTime: item.outTime || "",
    remarks: item.remarks || "",
    regularizationReason: item.regularizationReason || ""
  });
  setShowEditModal(true);
};

const handleEditChange = (e) => {
  const { name, value } = e.target;
  setEditForm((prev) => ({
    ...prev,
    [name]: value
  }));
};

const handleUpdateAttendance = async () => {
  try {
    await axios.put(
      `http://localhost:5000/api/admin/attendance/${selectedAttendance._id}`,
      editForm,
      config
    );

    alert("Attendance updated successfully ✅");
    setShowEditModal(false);
    setSelectedAttendance(null);
    fetchAttendance();
  } catch (error) {
    console.error("Update error:", error.response?.data || error.message);
    alert(error.response?.data?.message || "Error updating attendance ❌");
  }
};

//   const today = new Date();

// const todayAttendance = attendance.filter((item) => {
//   const itemDate = new Date(item.date);
//   return itemDate.toDateString() === today.toDateString();
// });

const filteredAttendance = attendance.filter((item) => {
  const itemDate = new Date(item.date).toLocaleDateString("en-CA"); 
  // en-CA gives YYYY-MM-DD format

  if (filterDate) {
    return itemDate === filterDate;
  }

  const today = new Date().toLocaleDateString("en-CA");
  return itemDate === today;
});
  const deleteAttendance = async (id) => {
  try {
    await axios.delete(`http://localhost:5000/api/admin/attendance/${id}`, config);
    fetchAttendance();
  } catch (err) {
    console.error("Delete error:", err.response?.data || err.message);
  }
};
const presentCount = filteredAttendance.filter(a => a.status === "Present").length;
const absentCount = filteredAttendance.filter(a => a.status === "Absent").length;
const halfDayCount = filteredAttendance.filter(a => a.status === "Half-Day").length;
const leaveCount = filteredAttendance.filter(a => a.status === "Leave").length;
const lateCount = filteredAttendance.filter(a => (a.lateMinutes ?? 0) > 0).length;
  return (
    
    <div className="attendance-table-card">
      <div className="table-header">
        <h3>Attendance List</h3>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />
      </div>

<div className="summary-cards">
  <div className="card present">
    <h4>Present</h4>
    <p>{presentCount}</p>
  </div>

  <div className="card absent">
    <h4>Absent</h4>
    <p>{absentCount}</p>
  </div>

  <div className="card halfday">
    <h4>Half Day</h4>
    <p>{halfDayCount}</p>
  </div>

  <div className="card leave">
    <h4>Leave</h4>
    <p>{leaveCount}</p>
  </div>
  <div className="card late">
  <h4>Late</h4>
  <p>{lateCount}</p>
</div>
</div>

      <table>
        <thead>
      <tr>
  <th>Name</th>
  <th>Date</th>
  <th>Status</th>
  <th>In</th>
  <th>Out</th>
  <th>Hours</th>
  <th>Late (min)</th>
  <th>Type</th>
  <th>Action</th>
</tr>
        </thead>
     <tbody>
  {filteredAttendance.map((item) => (
    <tr key={item._id}>
      <td>
{item.employeeId ? `${item.employeeId.firstName} ${item.employeeId.lastName}` : "N/A"}      </td>

      <td>
        {new Date(item.date).toLocaleDateString()}
      </td>

      <td>
        <span className={`status-badge ${item.status?.toLowerCase() || ""}`}>
          {item.status || "N/A"}
        </span>
      </td>

      <td>{item.inTime || "-"}</td>
<td>{item.outTime || "-"}</td>
<td>{item.workingHours ?? 0}</td>
<td>{item.lateMinutes ?? 0}</td>
<td>{item.attendanceType || "Manual"}</td>

<td>
  <button
    className="edit-btn"
    onClick={() => handleEditClick(item)}
  >
    Edit
  </button>

  {role === "admin" ? (
    <button
      className="delete-btn"
      onClick={() => deleteAttendance(item._id)}
    >
      Delete
    </button>
  ) : null}
</td>
    </tr>
  ))}
</tbody>
      </table>
      {showEditModal && (
  <div className="modal-overlay">
    <div className="edit-modal">
      <h3>Edit Attendance</h3>

      <select
        name="status"
        value={editForm.status}
        onChange={handleEditChange}
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
        value={editForm.inTime}
        onChange={handleEditChange}
      />

      <input
        type="time"
        name="outTime"
        value={editForm.outTime}
        onChange={handleEditChange}
      />

      <input
        type="text"
        name="remarks"
        placeholder="Remarks"
        value={editForm.remarks}
        onChange={handleEditChange}
      />

      <input
        type="text"
        name="regularizationReason"
        placeholder="Regularization Reason"
        value={editForm.regularizationReason}
        onChange={handleEditChange}
      />

      <div className="modal-actions">
        <button className="save-btn" onClick={handleUpdateAttendance}>
          Save
        </button>
        <button
          className="cancel-btn"
          onClick={() => setShowEditModal(false)}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default AttendanceList;