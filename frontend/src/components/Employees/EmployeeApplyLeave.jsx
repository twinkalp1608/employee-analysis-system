import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../style/EmployeeApplyLeave.css";

const EmployeeApplyLeave = () => {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);

  const [form, setForm] = useState({
    leaveType: "",
    fromDate: "",
    toDate: "",
    reason: ""
  });

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const res = await axios.get(
          "https://employee-analysis-system-1.onrender.com/api/employee-dashboard",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`
            }
          }
        );

        setEmployee(res.data.employee);
      } catch (err) {
        console.log(err);
      }
    };

    fetchEmployee();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post(
        "https://employee-analysis-system-1.onrender.com/api/leave/apply",
        form,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      alert("Leave Applied Successfully");
      navigate("/employee-dashboard");

      setForm({
        leaveType: "",
        fromDate: "",
        toDate: "",
        reason: ""
      });
    } catch (err) {
      console.log(err);
      alert("Failed to apply leave");
    }
  };

  return (
    <div className="apply-leave-page">
    

      {/* LEAVE FORM */}
      <div className="apply-leave-container">
        <div className="apply-leave-card">
          {/* <button
    className="back-btn"
    onClick={() => navigate("/employee-dashboard")}
  >
    ← Back
  </button> */}
          <div className="apply-leave-title">
            <h3>Apply for Leave</h3>
            <p>Fill in the details below to submit your leave request.</p>
          </div>

          <form onSubmit={handleSubmit} className="apply-leave-form">
            <div className="form-group">
              <label>Leave Type</label>
              <input
                type="text"
                placeholder="Enter leave type"
                value={form.leaveType}
                onChange={(e) =>
                  setForm({ ...form, leaveType: e.target.value })
                }
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>From Date</label>
                <input
                  type="date"
                  value={form.fromDate}
                  onChange={(e) =>
                    setForm({ ...form, fromDate: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label>To Date</label>
                <input
                  type="date"
                  value={form.toDate}
                  onChange={(e) =>
                    setForm({ ...form, toDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="form-group">
              <label>Reason</label>
              <textarea
                rows="5"
                placeholder="Write your reason here..."
                value={form.reason}
                onChange={(e) =>
                  setForm({ ...form, reason: e.target.value })
                }
              />
            </div>

            <button type="submit" className="apply-submit-btn">
              Submit Leave Request
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmployeeApplyLeave;