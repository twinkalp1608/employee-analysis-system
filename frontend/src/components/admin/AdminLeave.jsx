import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../style/AdminLeave.css";

const AdminLeave = () => {
  const [leaves, setLeaves] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const res = await axios.get(
        "https://employee-analysis-system-1.onrender.com//api/admin/leaves",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setLeaves(res.data);
    } catch (error) {
      console.error("Error fetching leaves", error);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(
        `https://employee-analysis-system-1.onrender.com//api/admin/leave-status/${id}`,
        { status },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchLeaves();
    } catch (error) {
      console.error("Error updating status", error);
    }
  };

  return (
    <div className="main-content">
      <div className="admin-leave-page">
        <h2>Manage Leave Requests</h2>

        <div className="table-responsive">
          <table className="admin-leave-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>From</th>
                <th>To</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {leaves.map((leave) => (
                <tr key={leave._id}>
                  <td>{leave.employeeId?.firstName} {leave.employeeId?.lastName}</td>
                  <td>{leave.leaveType}</td>
                  <td>{new Date(leave.fromDate).toLocaleDateString()}</td>
                  <td>{new Date(leave.toDate).toLocaleDateString()}</td>
                  <td>{leave.reason}</td>
                  <td>{leave.status}</td>
                  <td>
                    {leave.status === "Pending" && (
                      <>
                        <button
                          className="approve-btn"
                          onClick={() => updateStatus(leave._id, "Approved")}
                        >
                          Approve
                        </button>
                        <button
                          className="reject-btn"
                          onClick={() => updateStatus(leave._id, "Rejected")}
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

      </div>
    </div>
  );
};

export default AdminLeave;