import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../style/Task.css";

const Task = () => {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    assignedTo: [],
    priority: "Medium",
    startDate: "",
    deadline: "",
    attachment: null,
  });
  const [showForm, setShowForm] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [editTaskId, setEditTaskId] = useState(null);
  const [filter, setFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  const fetchEmployees = async () => {
    try {
      const res = await axios.get("http://https://employee-analysis-system-1.onrender.com//api/employees", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setEmployees(res.data);
    } catch (err) {
      console.log("Employee fetch error:", err);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await axios.get("http://https://employee-analysis-system-1.onrender.com//api/tasks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (!token) {
      console.log("❌ No token found — Please login");
      return;
    }

    fetchTasks();
    fetchEmployees();
  }, [token]);

const handleChange = (e) => {
  const { name, value, files } = e.target;

  if (name === "attachment") {
    setForm({ ...form, attachment: files[0] });
  } else {
    setForm({ ...form, [name]: value });
  }
};

const handleEmployeeSelect = (employeeId, checked) => {
  if (checked) {
    setForm({
      ...form,
      assignedTo: [...form.assignedTo, employeeId],
    });
  } else {
    setForm({
      ...form,
      assignedTo: form.assignedTo.filter((id) => id !== employeeId),
    });
  }
};

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);

      form.assignedTo.forEach((employeeId) => formData.append("assignedTo", employeeId));

      formData.append("priority", form.priority);
       formData.append("startDate", form.startDate);
      formData.append("deadline", form.deadline);

      if (form.attachment) {
        formData.append("attachment", form.attachment);
      }

      if (editTaskId) {
  const editFormData = new FormData();
  editFormData.append("title", form.title);
  editFormData.append("description", form.description);
  editFormData.append("assignedTo", form.assignedTo[0] || "");
  editFormData.append("priority", form.priority);
  editFormData.append("startDate", form.startDate);
  editFormData.append("deadline", form.deadline);

  if (form.attachment) {
    editFormData.append("attachment", form.attachment);
  }

  await axios.put(
    `http://https://employee-analysis-system-1.onrender.com//api/tasks/${editTaskId}`,
    editFormData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    }
  );
} else {
  const formData = new FormData();
  formData.append("title", form.title);
  formData.append("description", form.description);

  form.assignedTo.forEach((employeeId) => {
    formData.append("assignedTo", employeeId);
  });

  formData.append("priority", form.priority);
  formData.append("startDate", form.startDate);
  formData.append("deadline", form.deadline);

  if (form.attachment) {
    formData.append("attachment", form.attachment);
  }

  await axios.post("http://https://employee-analysis-system-1.onrender.com//api/tasks", formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
}

      fetchTasks();

      setForm({
        title: "",
        description: "",
        assignedTo: [],
        priority: "Medium",
        startDate: "",
        deadline: "",
        attachment: null,
      });

      setEditTaskId(null);
      setShowForm(false);
    } catch (err) {
      console.log(err);
    }
  };

  

   const handleEdit = (task) => {
  setForm({
    title: task.title || "",
    description: task.description || "",
    assignedTo: task.assignedTo?._id ? [task.assignedTo._id] : [],
    priority: task.priority || "Medium",
    startDate: task.startDate ? task.startDate.slice(0, 10) : "",
    deadline: task.deadline ? task.deadline.slice(0, 10) : "",
    attachment: null,
  });

  setEditTaskId(task._id);
  setShowForm(true);
};

  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter((task) => task.status === "Pending").length;
  const inProgressTasks = tasks.filter(
    (task) => task.status === "In Progress",
  ).length;
  const completedTasks = tasks.filter(
    (task) => task.status === "Completed",
  ).length;
  const overdueTasks = tasks.filter((task) => task.status === "Overdue").length;

  const filteredTasks = tasks.filter((task) => {
    const matchesFilter = filter === "All" || task.status === filter;
    const matchesSearch = task.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleDelete = async (id) => {
  try {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmDelete) return;

    await axios.delete(`http://https://employee-analysis-system-1.onrender.com//api/tasks/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setTasks((prevTasks) => prevTasks.filter((task) => task._id !== id));

    alert("Task deleted successfully ✅");
  } catch (err) {
    console.log(err);
    alert("Error deleting task ❌");
  }
};

  const handleReview = async (id, status) => {
  try {
    await axios.put(
      `http://https://employee-analysis-system-1.onrender.com//api/tasks/review/${id}`,
      { status },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    alert(`Task marked as ${status} ✅`);
    fetchTasks();
  } catch (err) {
    console.log(err);
    alert("Error reviewing task ❌");
  }
};

  return (
    <div className="task-container">
      <div className="task-header-section">
        <div>
          <h1 className="task-title">📋 Task Management</h1>
        </div>
        {role === "hr" && (
          <button
            className="btn-create-task"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "✕ Cancel" : "+ Create New Task"}
          </button>
        )}
      </div>
      <div className="task-stats-row">
        <div className="task-stat-card">
          <h3>Total</h3>
          <p>{totalTasks}</p>
        </div>
        <div className="task-stat-card">
          <h3>Pending</h3>
          <p>{pendingTasks}</p>
        </div>
        <div className="task-stat-card">
          <h3>In Progress</h3>
          <p>{inProgressTasks}</p>
        </div>
        <div className="task-stat-card">
          <h3>Completed</h3>
          <p>{completedTasks}</p>
        </div>
        <div className="task-stat-card">
          <h3>Overdue</h3>
          <p>{overdueTasks}</p>
        </div>
      </div>

     {!showForm && (
  <div className="task-toolbar">
    <input
      type="text"
      placeholder="Search by task title"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="task-search-input"
    />

    <select
      value={filter}
      onChange={(e) => setFilter(e.target.value)}
      className="task-filter-select"
    >
      <option value="All">All</option>
      <option value="Pending">Pending</option>
      <option value="In Progress">In Progress</option>
      <option value="Under Review">Under Review</option>
      <option value="Rework Required">Rework Required</option>
      <option value="Completed">Completed</option>
      <option value="Overdue">Overdue</option>
    </select>
  </div>
)}
      {/* Create Task Card */}
      {showForm && (
        <div className="task-form-card">
          <h3>{editTaskId ? "Edit Task" : "Create New Task"}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Task Title *</label>
                <input
                  type="text"
                  name="title"
                  placeholder="Enter task title"
                  value={form.title}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Task Description</label>
              <textarea
                name="description"
                placeholder="Describe the task details"
                value={form.description}
                onChange={handleChange}
                rows="4"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Assigned To *</label>
                <div className="employee-checkbox-list">
  {employees.map((emp) => (
    <label key={emp._id} className="employee-checkbox-item">
      <input
        type="checkbox"
        checked={form.assignedTo.includes(emp._id)}
        onChange={(e) => handleEmployeeSelect(emp._id, e.target.checked)}
      />
      <span>
        {emp.firstName} {emp.lastName}
      </span>
    </label>
  ))}
</div>

              </div>
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Deadline</label>
                <input
                  type="date"
                  name="deadline"
                  value={form.deadline}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Attachment</label>
                <input
                  type="file"
                  name="attachment"
                  onChange={handleChange}
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                />
              </div>
            </div>
            <button type="submit" className="btn-submit">
              {editTaskId ? "Update Task" : "Create Task"}
            </button>{" "}
          </form>
        </div>
      )}

      {/* Task List */}
     {/* Task List */}
{!showForm && (
  <div className="task-list">
    {filteredTasks.length === 0 ? (
      <div className="empty-state">
        <p>No tasks yet. Create one to get started!</p>
      </div>
    ) : (
      filteredTasks.map((task) => (
        <div key={task._id} className="task-card">
          <div className="task-card-header">
            <div>
              <h4>{task.title}</h4>
            </div>

            <div
              style={{ display: "flex", gap: "8px", alignItems: "center" }}
            >
              <span
                className={`priority-badge priority-${task.priority.toLowerCase()}`}
              >
                {task.priority}
              </span>
              {role === "hr" && (
                <>
                  <button
                    onClick={() => handleEdit(task)}
                    style={{
                      background: "#4CAF50",
                      color: "white",
                      border: "none",
                      padding: "4px 8px",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(task._id)}
                    style={{
                      background: "#ff4d4d",
                      color: "white",
                      border: "none",
                      padding: "4px 8px",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>

          <p className="task-description">{task.description}</p>

          {task.attachment && (
            <div className="task-attachment">
              <a
                href={`http://https://employee-analysis-system-1.onrender.com//${task.attachment}`}
                target="_blank"
                rel="noreferrer"
              >
                View Attachment
              </a>
            </div>
          )}

          {task.employeeSubmission && (
            <div className="task-attachment">
              <a
                href={`http://https://employee-analysis-system-1.onrender.com//${task.employeeSubmission}`}
                target="_blank"
                rel="noreferrer"
              >
                View Employee Submission
              </a>
            </div>
          )}

          <div className="task-meta">
            <div className="meta-item">
              <span className="meta-label">Assigned Employee(s)</span>
              <span className="meta-value">
                {task.assignedTo
                  ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
                  : "Not Assigned"}
              </span>
            </div>

            <div className="meta-item">
              <span className="meta-label">Submission Remarks:</span>
              <span className="meta-value">
                {task.submissionRemarks || "No submission remarks"}
              </span>
            </div>

            <div className="meta-item">
              <span className="meta-label">Assigned By:</span>
              <span className="meta-value">
                {task.assignedBy ? task.assignedBy.name : "HR"}
              </span>
            </div>

            <div className="meta-item">
              <span className="meta-label">Status:</span>
              <span
                className={`meta-value status ${
                  task.status === "Completed"
                    ? "completed"
                    : task.status === "In Progress"
                    ? "in-progress"
                    : task.status === "Overdue"
                    ? "overdue"
                    : task.status === "Under Review"
                    ? "under-review"
                    : task.status === "Rework Required"
                    ? "rework-required"
                    : "pending"
                }`}
              >
                {task.status || "Pending"}
              </span>
            </div>

            <div className="meta-item">
              <span className="meta-label">Remarks:</span>
              <span className="meta-value">
                {task.remarks || "No remarks"}
              </span>
            </div>
          </div>

          <div className="task-dates">
            <div className="date-item">
              <span className="date-label">📅 Start:</span>
              <span>
                {task.startDate ? task.startDate.slice(0, 10) : "Not Set"}
              </span>
            </div>

            <div className="date-item">
              <span className="date-label">⏰ Deadline:</span>
              <span>
                {task.deadline ? task.deadline.slice(0, 10) : "Not Set"}
              </span>
            </div>

            <div className="date-item">
              <span className="date-label">✅ Completed:</span>
              <span>
                {task.completedAt
                  ? task.completedAt.slice(0, 10)
                  : "Not Completed"}
              </span>
            </div>
          </div>

          {role === "hr" && task.status === "Under Review" && (
            <div
              style={{
                display: "flex",
                gap: "10px",
                marginTop: "14px",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => handleReview(task._id, "Completed")}
                style={{
                  background: "#16a34a",
                  color: "#fff",
                  border: "none",
                  padding: "8px 14px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Approve
              </button>

              <button
                onClick={() => handleReview(task._id, "Rework Required")}
                style={{
                  background: "#f59e0b",
                  color: "#fff",
                  border: "none",
                  padding: "8px 14px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                Rework
              </button>
            </div>
          )}
        </div>
      ))
    )}
  </div>
)}
    </div>
  );
};

export default Task;
