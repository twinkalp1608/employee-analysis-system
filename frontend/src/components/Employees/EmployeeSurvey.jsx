import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../style/Engagement.css";

const EmployeeSurvey = () => {
  const token = localStorage.getItem("token");

  const [surveys, setSurveys] = useState([]);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [overallComment, setOverallComment] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const authHeader = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const fetchSurveys = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        "http://https://employee-analysis-system-1.onrender.com//api/employee/engagement/surveys",
        authHeader
      );

      setSurveys(res.data || []);
    } catch (err) {
      console.log("Error fetching surveys:", err);
      setMessage(err.response?.data?.message || "Failed to load surveys");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, []);

  const openSurvey = (survey) => {
    setSelectedSurvey(survey);

    const preparedAnswers = survey.questions.map((q) => ({
      questionText: q.questionText,
      category: q.category,
      answerType: q.answerType,
      rating: q.answerType === "rating" ? 3 : null,
      textAnswer: "",
    }));

    setAnswers(preparedAnswers);
    setOverallComment("");
    setMessage("");
  };

  const handleAnswerChange = (index, field, value) => {
    const updated = [...answers];
    updated[index][field] = field === "rating" ? Number(value) : value;
    setAnswers(updated);
  };

  const submitSurvey = async (e) => {
    e.preventDefault();

    if (!selectedSurvey) return;

    try {
      const res = await axios.post(
        `http://https://employee-analysis-system-1.onrender.com//api/employee/engagement/respond/${selectedSurvey._id}`,
        { answers, overallComment },
        authHeader
      );

      setMessage(res.data.message || "Survey submitted successfully ✅");
      setSelectedSurvey(null);
      setAnswers([]);
      setOverallComment("");
      fetchSurveys();
    } catch (err) {
      console.log("Submit error:", err);
      setMessage(err.response?.data?.message || "Failed to submit survey");
    }
  };

  if (loading) {
    return <p style={{ padding: "20px", fontSize: "18px" }}>Loading...</p>;
  }

  return (
    <div className="engagement-page">
      <h2 className="engagement-title">Employee Engagement Survey</h2>

      {message && <p className="engagement-message">{message}</p>}

      {!selectedSurvey ? (
        <div className="engagement-card">
          <h3>Available Surveys</h3>

          <div className="table-wrapper">
            <table className="engagement-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Survey For</th>
                  <th>End Date</th>
                  <th>Anonymous</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {surveys.length > 0 ? (
                  surveys.map((survey) => (
                    <tr key={survey._id}>
                      <td>{survey.title}</td>
                      <td>{survey.description || "-"}</td>
                      <td>{survey.surveyFor}</td>
                      <td>{new Date(survey.endDate).toLocaleDateString()}</td>
                      <td>{survey.isAnonymous ? "Yes" : "No"}</td>
                      <td>
                        <button
                          className="primary-btn small-btn"
                          onClick={() => openSurvey(survey)}
                        >
                          Fill Survey
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6">No active surveys available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="engagement-card">
          <h3>{selectedSurvey.title}</h3>
          <p>{selectedSurvey.description}</p>

          <form onSubmit={submitSurvey} className="engagement-form">
            {answers.map((answer, index) => (
              <div key={index} className="question-box">
                <label className="question-label">
                  {index + 1}. {answer.questionText}
                </label>

                {answer.answerType === "rating" ? (
                  <select
                    value={answer.rating || 3}
                    onChange={(e) =>
                      handleAnswerChange(index, "rating", e.target.value)
                    }
                  >
                    <option value={1}>1 - Very Poor</option>
                    <option value={2}>2 - Poor</option>
                    <option value={3}>3 - Average</option>
                    <option value={4}>4 - Good</option>
                    <option value={5}>5 - Excellent</option>
                  </select>
                ) : (
                  <textarea
                    placeholder="Write your answer"
                    value={answer.textAnswer}
                    onChange={(e) =>
                      handleAnswerChange(index, "textAnswer", e.target.value)
                    }
                  />
                )}
              </div>
            ))}

            <textarea
              placeholder="Overall comment"
              value={overallComment}
              onChange={(e) => setOverallComment(e.target.value)}
            />

            <div className="action-group">
              <button type="submit" className="primary-btn">
                Submit Survey
              </button>

              <button
                type="button"
                className="secondary-btn"
                onClick={() => {
                  setSelectedSurvey(null);
                  setAnswers([]);
                  setOverallComment("");
                }}
              >
                Back
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default EmployeeSurvey;