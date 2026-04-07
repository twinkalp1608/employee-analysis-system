import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../style/AttendanceRequest.css";

const AttendanceRequests = () => {
  const [requests, setRequests] = useState([]);

  const token = localStorage.getItem("token");

  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await axios.get(
        "${import.meta.env.VITE_API_URL}/api/attendance/requests",
        config
      );
      setRequests(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const updateRequestStatus = async (id, status) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/attendance/requests/${id}`,
        { status },
        config
      );

      alert(`Request ${status} successfully ✅`);
      fetchRequests();
    } catch (error) {
      console.error(error);
      alert("Error updating request ❌");
    }
  };

  return (
    <div className="attendance-table-card">
      <h3>Attendance Requests</h3>

      <table>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Date</th>
            <th>Requested In</th>
            <th>Requested Out</th>
            <th>Reason</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {requests.map((item) => (
            <tr key={item._id}>
              <td>
                {item.employeeId
                  ? `${item.employeeId.firstName} ${item.employeeId.lastName}`
                  : "N/A"}
              </td>

              <td>{new Date(item.date).toLocaleDateString()}</td>

              <td>{item.requestedInTime || "-"}</td>
              <td>{item.requestedOutTime || "-"}</td>

              <td>{item.reason}</td>

              <td>
                <span className={`status-badge ${item.status.toLowerCase()}`}>
                  {item.status}
                </span>
              </td>

              <td>
                {item.status === "Pending" && (
                  <>
                    <button
                      className="approve-btn"
                      onClick={() =>
                        updateRequestStatus(item._id, "Approved")
                      }
                    >
                      Approve
                    </button>

                    <button
                      className="reject-btn"
                      onClick={() =>
                        updateRequestStatus(item._id, "Rejected")
                      }
                    >
                      Reject
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceRequests;