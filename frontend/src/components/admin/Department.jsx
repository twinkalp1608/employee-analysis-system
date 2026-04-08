import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../style/AddDesignation.css";

const Department = () => {
  const [departments, setDepartments] = useState([]);
  const [name, setName] = useState("");
  const [editId, setEditId] = useState(null);

  const token = localStorage.getItem("token");

  // 🔹 Fetch Departments
  const fetchDepartments = async () => {
    try {
      const res = await axios.get("https://employee-analysis-system-1.onrender.com/api/departments", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDepartments(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // 🔹 Add / Update Department
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Department name required");
      return;
    }

    try {
      if (editId) {
        // Update
        await axios.put(
          `https://employee-analysis-system-1.onrender.com/api/departments/${editId}`,
          { name },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert("Department Updated Successfully ✅");
        setEditId(null);
      } else {
        // Add
        await axios.post(
          "https://employee-analysis-system-1.onrender.com/api/departments",
          { name },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert("Department Added Successfully ✅");
      }

      setName("");
      fetchDepartments();
    } catch (err) {
      alert(err.response?.data?.message || "Error");
    }
  };

  // 🔹 Delete Department
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure to delete?")) return;

    try {
      await axios.delete(
        `https://employee-analysis-system-1.onrender.com/api/departments/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Department Deleted ❌");
      fetchDepartments();
    } catch (err) {
      alert("Delete failed");
    }
  };

  // 🔹 Edit Department
  const handleEdit = (dept) => {
    setName(dept.name);
    setEditId(dept._id);
  };

  return (
  <div className="designation-container">
    <div className="card">
      <h2 className="page-title">Department Management</h2>

      <form className="designation-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter Department Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-field"
          required
        />

        <button type="submit" className="primary-btn">
          {editId ? "Update" : "Add"}
        </button>

        {editId && (
          <button
            type="button"
            className="secondary-btn"
            onClick={() => {
              setEditId(null);
              setName("");
            }}
          >
            Cancel
          </button>
        )}
      </form>
    </div>

    <div className="table-card">
      <h3 className="list-title">Department List</h3>

      <table className="designation-table">
        <thead>
          <tr>
            <th>Sr No</th>
            <th>Department Name</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {departments.map((dept, index) => (
            <tr key={dept._id}>
              <td>{index + 1}</td>
              <td>{dept.name}</td>
              <td>
                <button
                  onClick={() => handleEdit(dept)}
                  className="edit-btn"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(dept._id)}
                  className="delete-btn"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
};

export default Department;

