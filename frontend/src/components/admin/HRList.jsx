import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../style/Hr.css";

const HRList = ({ token }) => {
  const [hrList, setHrList] = useState([]);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [editId, setEditId] = useState(null);

  const fetchHRList = async () => {
    try {
      const res = await axios.get("https://employee-analysis-system-1.onrender.com//hr", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setHrList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHRList();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await axios.put(`https://employee-analysis-system-1.onrender.com//hr/${editId}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEditId(null);
      } else {
        await axios.post("https://employee-analysis-system-1.onrender.com//hr", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setFormData({ name: "", email: "", password: "" });
      fetchHRList();
    } catch (err) {
      console.error(err);
      alert("Error adding/updating HR");
    }
  };

  const handleEdit = (hr) => {
    setFormData({ name: hr.name, email: hr.email, password: "" });
    setEditId(hr._id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this HR?")) return;
    try {
      await axios.delete(`https://employee-analysis-system-1.onrender.com//hr/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchHRList();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="hr-page">
      <div className="hr-wrapper">
        {/* Form Card */}
        <div className="hr-form-card">
          <h2>{editId ? "Edit HR User" : "HR Management"}</h2>

          <form onSubmit={handleSubmit} className="hr-form">
            <input
              type="text"
              placeholder="Enter HR Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <input
              type="email"
              placeholder="Enter HR Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />

            <input
              type="password"
              placeholder={editId ? "Leave blank to keep password" : "Enter Password"}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              {...(!editId && { required: true })}
            />

            <div className="hr-form-buttons">
              <button type="submit" className="add-btn">
                {editId ? "Update" : "Add"}
              </button>

              {editId && (
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setEditId(null);
                    setFormData({ name: "", email: "", password: "" });
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Table Card */}
        <div className="hr-table-card">
          <h3>HR List</h3>

          <table className="hr-table">
            <thead>
              <tr>
                <th>Sr No</th>
                <th>Name</th>
                <th>Email</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {hrList.length > 0 ? (
                hrList.map((hr, index) => (
                  <tr key={hr._id}>
                    <td>{index + 1}</td>
                    <td>{hr.name}</td>
                    <td>{hr.email}</td>
                    <td>
                      <button
                        className="edit-btn"
                        onClick={() => handleEdit(hr)}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(hr._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="no-data">
                    No HR Users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HRList;