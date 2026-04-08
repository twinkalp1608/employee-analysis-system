  import React, { useEffect, useState } from "react";
  import axios from "axios";
  import { useNavigate } from "react-router-dom";
  import "../../style/EmployeeList.css";

  const EmployeeList = () => {
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);
const employeesPerPage = 5;

    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const navigate = useNavigate();

    const fetchEmployees = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/employees",
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        setEmployees(response.data);
      } catch (error) {
        console.log("Error fetching employees");
      }
    };

    useEffect(() => {
      fetchEmployees();
    }, []);
    useEffect(() => {
  setCurrentPage(1);
}, [searchTerm, statusFilter]);

    // DELETE FUNCTION
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) return;

    try {
      await axios.delete(
        `http://localhost:5000/api/employees/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert("Employee Deleted Successfully ✅");
      fetchEmployees();

    } catch (error) {
      console.log(error);
      alert("Delete Failed ❌");
    }
  };
  const filteredEmployees = employees.filter((emp) => {
  const matchesSearch =
    emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase());

  const matchesStatus =
    statusFilter === "All" || emp.status === statusFilter;

  return matchesSearch && matchesStatus;
});
const indexOfLastEmployee = currentPage * employeesPerPage;
const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage;
const currentEmployees = filteredEmployees.slice(
  indexOfFirstEmployee,
  indexOfLastEmployee
);

const totalPages = Math.ceil(filteredEmployees.length / employeesPerPage);

const handlePageChange = (pageNumber) => {
  setCurrentPage(pageNumber);
};
  return (
    <div className="employee-container">
      <div className="header-section">
        {/* <h2 className="main-title">Employee Management</h2> */}
        <h2>Employee List</h2>

        <div className="controls">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select-field"
          >
            <option value="All">All</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <button
            onClick={() => navigate("/add-employee")}
            className="add-btn"
          >
            ➕ Add Employee
          </button>
        </div>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Department</th>
            <th>Designation</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
  {currentEmployees.length > 0 ? (
    currentEmployees.map((emp) => (
      <tr key={emp._id}>
        <td>{emp.employeeId}</td>
        <td>{emp.firstName} {emp.lastName}</td>
        <td>{emp.email}</td>
        <td>{emp.department?.name || "-"}</td>
        <td>{emp.designation?.name || "-"}</td>

        <td>
          <span className={`status ${emp.status === "Active" ? "active" : "inactive"}`}>
            {emp.status}
          </span>
        </td>

        <td>
          <div className="action-group">
            <button
              onClick={() => navigate(`/employee/${emp._id}`)}
              className="action-btn view-btn"
            >
              View
            </button>

            <button
              onClick={() => navigate(`/employee/edit/${emp._id}`)}
              className="action-btn edit-btn"
            >
              Edit
            </button>

            {role === "admin" && (
              <button
                onClick={() => handleDelete(emp._id)}
                className="action-btn delete-btn"
              >
                Delete
              </button>
            )}
          </div>
        </td>
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>
        No employees found
      </td>
    </tr>
  )}
</tbody>
      </table>
      {filteredEmployees.length > employeesPerPage && (
  <div className="pagination">
    <button
      onClick={() => handlePageChange(currentPage - 1)}
      disabled={currentPage === 1}
    >
      Previous
    </button>

    {[...Array(totalPages)].map((_, index) => (
      <button
        key={index + 1}
        className={currentPage === index + 1 ? "active-page" : ""}
        onClick={() => handlePageChange(index + 1)}
      >
        {index + 1}
      </button>
    ))}

    <button
      onClick={() => handlePageChange(currentPage + 1)}
      disabled={currentPage === totalPages}
    >
      Next
    </button>
  </div>
)}
    </div>
  );
  };

  export default EmployeeList;
