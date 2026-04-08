import React, { useEffect, useState } from "react";
import "../../style/AddDesignation.css";

import axios from "axios";

const AddDesignation = () => {
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");

  const token = localStorage.getItem("token");

  const fetchDepartments = async () => {
    const res = await axios.get("https://employee-analysis-system-1.onrender.com//api/departments", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setDepartments(res.data);
  };

  const fetchDesignations = async (deptId = "") => {
    const res = await axios.get(
      `https://employee-analysis-system-1.onrender.com//api/designations?departmentId=${deptId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    setDesignations(res.data);
  };

  useEffect(() => {
    if (department) {
      fetchDesignations(department);
    }
  }, [department]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        await axios.put(
          `https://employee-analysis-system-1.onrender.com//api/designations/${editingId}`,
          { name, department },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        alert("Updated Successfully ✅");
      } else {
        await axios.post(
          "https://employee-analysis-system-1.onrender.com//api/designations",
          { name, department },
          { headers: { Authorization: `Bearer ${token}` } },
        );
        alert("Added Successfully ✅");
      }

      setName("");
      setDepartment("");
      setEditingId(null);
      fetchDesignations(department);
    } catch (error) {
      console.log(error.response?.data || error.message);
      alert("Something went wrong ❌");
    }
  };

  const handleDelete = async (id) => {
    try {
      if (window.confirm("Are you sure?")) {
        await axios.delete(`https://employee-analysis-system-1.onrender.com//api/designations/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        alert("Deleted Successfully ✅");
        fetchDesignations(department);
      }
    } catch (error) {
      console.log(error.response?.data || error.message);
      alert("Delete Failed ❌");
    }
  };

  const handleEdit = (des) => {
    setName(des.name);
    setDepartment(des.department?._id);
    setEditingId(des._id);
  };

  useEffect(() => {
    fetchDesignations();
  }, []);

  return (
    <div className="designation-container">
      <div className="card">
        <h2 className="page-title">Designation Management</h2>

        <form className="designation-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter Designation"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
            required
          />

          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="input-field"
            required
          >
            <option value="">Select Department</option>
            {departments.map((dept) => (
              <option key={dept._id} value={dept._id}>
                {dept.name}
              </option>
            ))}
          </select>

          <button type="submit" className="primary-btn">
            {editingId ? "Update" : "Add"}
          </button>
        </form>
      </div>

      <div className="table-card">
        <h3 className="list-title">Designation List</h3>

        <table className="designation-table">
          <thead>
            <tr>
              <th>Sr No</th>
              <th>Designation Name</th>
              <th>Department Name</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {designations.map((des, index) => (
              <tr key={des._id}>
                <td>{index + 1}</td>
                <td>{des.name}</td>
                <td>{des.department?.name}</td>
                <td>
                  <button onClick={() => handleEdit(des)} className="edit-btn">
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(des._id)}
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

export default AddDesignation;
