import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../style/Engagement.css";

const EngagementManagement = () => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const isHR = role === "hr";
  const isAdmin = role === "admin";
  const [departments, setDepartments] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedSurveyId, setSelectedSurveyId] = useState("");
  const [responses, setResponses] = useState([]);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    surveyFor: "All",
    targetDepartment: "",
    isAnonymous: true,
    endDate: "",
    status: "Active",
    questions: [
      {
        questionText: "",
        category: "Job Satisfaction",
        answerType: "rating",
      },
    ],
  });

  const authHeader = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.get(
        "http://https://employee-analysis-system-1.onrender.com//api/departments",
        authHeader,
      );
      setDepartments(res.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchSurveys = async () => {
    try {
      const res = await axios.get(
        "http://https://employee-analysis-system-1.onrender.com//api/engagement/surveys",
        authHeader,
      );
      setSurveys(res.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await axios.get(
        "http://https://employee-analysis-system-1.onrender.com//api/engagement/summary",
        authHeader,
      );
      setSummary(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchResponses = async (surveyId) => {
  try {
    const res = await axios.get(
      `http://https://employee-analysis-system-1.onrender.com//api/engagement/responses/${surveyId}`,
      authHeader
    );

    setResponses(res.data.responses || []);
  } catch (err) {
    console.log("Error fetching responses:", err);
    setResponses([]);
  }
};

  useEffect(() => {
    fetchDepartments();
    fetchSurveys();
    fetchSummary();
  }, []);

  useEffect(() => {
    if (selectedSurveyId) {
      fetchResponses(selectedSurveyId);
    } else {
      setResponses([]);
    }
  }, [selectedSurveyId]);

  const handleQuestionChange = (index, field, value) => {
    const updated = [...form.questions];
    updated[index][field] = value;
    setForm({ ...form, questions: updated });
  };

  const addQuestion = () => {
    setForm({
      ...form,
      questions: [
        ...form.questions,
        {
          questionText: "",
          category: "General",
          answerType: "rating",
        },
      ],
    });
  };

  const removeQuestion = (index) => {
    const updated = form.questions.filter((_, i) => i !== index);
    setForm({ ...form, questions: updated });
  };

  const handleCreateSurvey = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const payload = {
        ...form,
        targetDepartment:
          form.surveyFor === "Department" ? form.targetDepartment : null,
      };

      const res = await axios.post(
        "http://https://employee-analysis-system-1.onrender.com//api/engagement/surveys",
        payload,
        authHeader,
      );

      setMessage(res.data.message || "Survey created successfully");
      setForm({
        title: "",
        description: "",
        surveyFor: "All",
        targetDepartment: "",
        isAnonymous: true,
        endDate: "",
        status: "Active",
        questions: [
          {
            questionText: "",
            category: "Job Satisfaction",
            answerType: "rating",
          },
        ],
      });

      fetchSurveys();
      fetchSummary();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to create survey");
    }
  };

  const closeSurvey = async (id) => {
    try {
      const res = await axios.put(
        `http://https://employee-analysis-system-1.onrender.com//api/engagement/surveys/${id}/close`,
        {},
        authHeader,
      );
      setMessage(res.data.message);
      fetchSurveys();
      fetchSummary();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to close survey");
    }
  };

  const deleteSurvey = async (id) => {
    try {
      const res = await axios.delete(
        `http://https://employee-analysis-system-1.onrender.com//api/engagement/surveys/${id}`,
        authHeader,
      );
      setMessage(res.data.message);
      if (selectedSurveyId === id) {
        setSelectedSurveyId("");
        setResponses([]);
      }
      fetchSurveys();
      fetchSummary();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to delete survey");
    }
  };

  return (
    <div className="engagement-page">
      <h2 className="engagement-title">Employee Engagement Management</h2>
      {message && <p className="engagement-message">{message}</p>}

      <div className="engagement-grid">
        {isHR && (
          <div className="engagement-card">
            <h3>Create Survey</h3>
            <form onSubmit={handleCreateSurvey} className="engagement-form">
              <input
                type="text"
                placeholder="Survey Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />

              <textarea
                placeholder="Survey Description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />

              <div className="engagement-row">
                <select
                  value={form.surveyFor}
                  onChange={(e) =>
                    setForm({ ...form, surveyFor: e.target.value })
                  }
                >
                  <option value="All">All Employees</option>
                  <option value="Department">Department Wise</option>
                </select>

                {form.surveyFor === "Department" && (
                  <select
                    value={form.targetDepartment}
                    onChange={(e) =>
                      setForm({ ...form, targetDepartment: e.target.value })
                    }
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="engagement-row">
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm({ ...form, endDate: e.target.value })
                  }
                  required
                />

                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={form.isAnonymous}
                  onChange={(e) =>
                    setForm({ ...form, isAnonymous: e.target.checked })
                  }
                />
                Anonymous Survey
              </label>

              <h4>Questions</h4>
              {form.questions.map((q, index) => (
                <div key={index} className="question-box">
                  <input
                    type="text"
                    placeholder="Question text"
                    value={q.questionText}
                    onChange={(e) =>
                      handleQuestionChange(
                        index,
                        "questionText",
                        e.target.value,
                      )
                    }
                    required
                  />

                  <div className="engagement-row">
                    <select
                      value={q.category}
                      onChange={(e) =>
                        handleQuestionChange(index, "category", e.target.value)
                      }
                    >
                      <option value="Job Satisfaction">Job Satisfaction</option>
                      <option value="Manager Support">Manager Support</option>
                      <option value="Workload">Workload</option>
                      <option value="Work Environment">Work Environment</option>
                      <option value="Team Collaboration">
                        Team Collaboration
                      </option>
                      <option value="Growth">Growth</option>
                      <option value="General">General</option>
                    </select>

                    <select
                      value={q.answerType}
                      onChange={(e) =>
                        handleQuestionChange(
                          index,
                          "answerType",
                          e.target.value,
                        )
                      }
                    >
                      <option value="rating">Rating</option>
                      <option value="text">Text</option>
                    </select>
                  </div>

                  {form.questions.length > 1 && (
                    <button
                      type="button"
                      className="danger-btn"
                      onClick={() => removeQuestion(index)}
                    >
                      Remove Question
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                className="secondary-btn"
                onClick={addQuestion}
              >
                + Add Question
              </button>

              <button type="submit" className="primary-btn">
                Create Survey
              </button>
            </form>
          </div>
        )}

        <div className="engagement-card">
          <h3>Summary Dashboard</h3>
          {summary ? (
            <div className="summary-box">
              <p>
                <strong>Total Responses:</strong> {summary.totalResponses}
              </p>
              <p>
                <strong>Overall Satisfaction:</strong>{" "}
                {summary.overallSatisfactionScore}
              </p>
              <p>
                <strong>Work Environment Score:</strong>{" "}
                {summary.overallEnvironmentScore}
              </p>
              <p>
                <strong>Engagement Level:</strong>{" "}
                {summary.overallEngagementLevel}
              </p>

              <h4>Department Wise Analysis</h4>
              <div className="table-wrapper">
                <table className="engagement-table">
                  <thead>
                    <tr>
                      <th>Department</th>
                      <th>Total Responses</th>
                      <th>Avg Satisfaction</th>
                      <th>Avg Environment</th>
                      <th>Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.departmentWise?.length > 0 ? (
                      summary.departmentWise.map((item, i) => (
                        <tr key={i}>
                          <td>{item.department}</td>
                          <td>{item.totalResponses}</td>
                          <td>{item.averageSatisfactionScore}</td>
                          <td>{item.averageWorkEnvironmentScore}</td>
                          <td>{item.engagementLevel}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5">No department analysis available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p>Loading summary...</p>
          )}
        </div>
      </div>

      <div className="engagement-card">
        <h3>All Surveys</h3>
        <div className="table-wrapper">
          <table className="engagement-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>For</th>
                <th>Department</th>
                <th>Status</th>
                <th>End Date</th>
                <th>Responses</th>
                {isHR && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {surveys.length > 0 ? (
                surveys.map((survey) => (
                  <tr key={survey._id}>
                    <td>{survey.title}</td>
                    <td>{survey.surveyFor}</td>
                    <td>{survey.targetDepartment?.name || "-"}</td>
                    <td>{survey.status}</td>
                    <td>{new Date(survey.endDate).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="secondary-btn small-btn"
                        onClick={() => setSelectedSurveyId(survey._id)}
                      >
                        View Responses
                      </button>
                    </td>
                    {isHR && (
                      <td>
                        <div className="action-group">
                          <button
                            className="warning-btn small-btn"
                            onClick={() => closeSurvey(survey._id)}
                          >
                            Close
                          </button>
                          <button
                            className="danger-btn small-btn"
                            onClick={() => deleteSurvey(survey._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7">No surveys found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedSurveyId && (
        <div className="engagement-card">
          <h3>Survey Responses</h3>
          <div className="table-wrapper">
            <table className="engagement-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Satisfaction</th>
                  <th>Environment</th>
                  <th>Comment</th>
                </tr>
              </thead>
              <tbody>
                {responses.length > 0 ? (
                  responses.map((res) => (
                    <tr key={res._id}>
                      <td>
                        {res.employeeId?.firstName} {res.employeeId?.lastName}
                      </td>
                      <td>{res.employeeId?.email}</td>
                      <td>{res.department?.name || "-"}</td>
                      <td>{res.satisfactionScore}</td>
                      <td>{res.workEnvironmentScore}</td>
                      <td>{res.overallComment || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6">No responses found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default EngagementManagement;