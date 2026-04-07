import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../style/EmpTask.css";

const EmployeeTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [employee, setEmployee] = useState(null);
  const [remarks, setRemarks] = useState({});
  const [submissionFiles, setSubmissionFiles] = useState({});
const [submissionRemarks, setSubmissionRemarks] = useState({});

  const token = localStorage.getItem("token");

  // Fetch employee details
  const fetchEmployee = async () => {
    try {
      const res = await axios.get(
        "${import.meta.env.VITE_API_URL}/api/employee-dashboard",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setEmployee(res.data.employee);
    } catch (err) {
      console.log(err);
    }
  };

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      const res = await axios.get("${import.meta.env.VITE_API_URL}/api/employee/tasks", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setTasks(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchEmployee();
    fetchTasks();
  }, []);

  // Update task status
  const updateStatus = async (id, status) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/employee/tasks/${id}`,
        {
          status,
          remarks: remarks[id] || "",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      fetchTasks();
    } catch (err) {
      console.log(err);
    }
  };

  const submitTaskForReview = async (id) => {
  try {
    const formData = new FormData();
    formData.append("submissionRemarks", submissionRemarks[id] || "");

    if (submissionFiles[id]) {
      formData.append("employeeSubmission", submissionFiles[id]);
    }

    await axios.put(
      `${import.meta.env.VITE_API_URL}/api/employee/tasks/${id}/submit`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    fetchTasks();
  } catch (err) {
    console.log(err);
  }
};

  return (
    <div className="employee-task-page">
      

      <div className="employee-task-content">
        <div className="employee-task-title-box">
          <h1>My Tasks</h1>
          <p>Track your tasks and update progress easily.</p>
        </div>

        <div className="employee-task-list">
          {tasks.length === 0 ? (
            <div className="employee-no-task-card">
              <h3>No Tasks Assigned</h3>
              <p>You don’t have any tasks right now.</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task._id}
                className={`employee-task-card 
  ${task.status === "Overdue" ? "overdue-task" : ""} 
  ${task.status === "Completed" ? "completed" : ""}
`}
              >
                <div className="employee-task-card-top">
                  <h4>{task.title}</h4>

                  <span
                    className={`employee-task-status ${
                      task.status === "Completed"
                        ? "completed"
                        : task.status === "In Progress"
                          ? "inprogress"
                          : task.status === "Overdue"
                            ? "overdue"
                            : "pending"
                    }`}
                  >
                    {task.status}
                  </span>
                </div>

                <p className="employee-task-description">{task.description}</p>
              {task.attachment && (
  <div className="employee-task-attachment">
    <a
      href={`${import.meta.env.VITE_API_URL}/${task.attachment}`}
      target="_blank"
      rel="noreferrer"
    >
      📎 View Attachment
    </a>
  </div>
)}
{task.employeeSubmission && (
  <div className="employee-task-attachment">
    <a
      href={`${import.meta.env.VITE_API_URL}/${task.employeeSubmission}`}
      target="_blank"
      rel="noreferrer"
    >
      📄 View Submitted File
    </a>
  </div>
)}

                <div className="employee-task-info-grid">
  <div className="info-box">
    <span>Start Date</span>
    <strong>{task.startDate?.slice(0, 10) || "Not Set"}</strong>
  </div>

  <div className="info-box">
    <span>Deadline</span>
    <strong>{task.deadline?.slice(0, 10) || "Not Set"}</strong>
  </div>

  <div className="info-box">
    <span>Assigned By</span>
    <strong>{task.assignedBy?.name || "HR"}</strong>
  </div>

  <div className="info-box">
    <span>Completed On</span>
    <strong>{task.completedAt?.slice(0, 10) || "Not Completed"}</strong>
  </div>
</div>
{task.submissionRemarks && (
  <div className="employee-last-update">
    <span>Submission Remarks</span>
    <p>{task.submissionRemarks}</p>
  </div>
)}
<div className="employee-last-update">
  <span>Last Update</span>
  <p>{task.remarks || "No update yet"}</p>
</div>


                {task.status !== "Completed" && (
                  <div className="employee-remarks-box">
                    <textarea
                      placeholder="Add remarks..."
                      value={remarks[task._id] || ""}
                      onChange={(e) =>
                        setRemarks({ ...remarks, [task._id]: e.target.value })
                      }
                    />
                  </div>
                )}
                {task.status !== "Completed" && task.status !== "Under Review" && (
  <div className="employee-submission-box">
    <textarea
      placeholder="Add submission remarks..."
      value={submissionRemarks[task._id] || ""}
      onChange={(e) =>
        setSubmissionRemarks({
          ...submissionRemarks,
          [task._id]: e.target.value,
        })
      }
    />

    <input
      type="file"
      onChange={(e) =>
        setSubmissionFiles({
          ...submissionFiles,
          [task._id]: e.target.files[0],
        })
      }
      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xlsx,.xls,.zip,.ppt,.pptx"
    />
  </div>
)}
              {task.status !== "Completed" && task.status !== "Under Review" && (
  <div className="employee-task-actions">
    {task.status === "Pending" && (
      <button
        className="employee-start-btn"
        onClick={() => updateStatus(task._id, "In Progress")}
      >
        Start Task
      </button>
    )}

    {(task.status === "In Progress" || task.status === "Rework Required") && (
      <button
        className="employee-complete-btn"
        onClick={() => submitTaskForReview(task._id)}
      >
        Submit For Review
      </button>
    )}
  </div>
)}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeTasks;
