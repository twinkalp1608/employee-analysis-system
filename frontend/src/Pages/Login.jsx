import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../style/Login.css";
import logo from "../assets/images/logo.jpg";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ Single Login API Call
      const response = await axios.post(
        "http://https://employee-analysis-system-1.onrender.com//api/login",
        { email, password }
      );

      // ✅ Save token & role
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", response.data.role);
      localStorage.setItem("userId", response.data.userId);

      console.log("Saving user:", {
  email: email,
  role: response.data.role
});

localStorage.setItem(
  "user",
  JSON.stringify({
    email: email,   // 🔥 directly input field mathi levanu
    role: response.data.role
  })
);
      // ✅ Redirect based on role
      if (response.data.role === "admin") {
        navigate("/dashboard");
      } else if (response.data.role === "hr") {
        navigate("/hrdashboard");
      }
      else if(response.data.role === "employee"){
        navigate("/employee-dashboard");
      }

    } catch (error) {
      if (error.response?.status === 401) {
        alert("Invalid Email or Password");
      } else {
        alert("Server Error");
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="logo-section">
          <div className="logo-large">
            <img src={logo} alt="TechnoGuide" className="logo-img" />
          </div>
          <h1 className="brand-title">Welcome to TechnoGuide</h1>
          <p className="brand-subtitle">PeopleHub</p>
        </div>

        <form className="login-card" onSubmit={handleLogin}>
          <h2 className="form-title">Login</h2>

          <div className="input-group">
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="toggle"
              onClick={() => setShowPassword((s) => !s)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Log In"}
          </button>

          <div className="footer-links">
            <a className="forgot" href="/forgot-password">
              Forgot Password?
            </a>
          </div>

          <div className="candidate-cta-box">
            <div>
              <p className="candidate-cta-title">Looking for a job?</p>
              <span className="candidate-cta-subtitle">
                Explore current openings and apply online
              </span>
            </div>

            <button
              type="button"
              className="candidate-cta-btn"
              onClick={() => navigate("/careers")}
            >
              Explore Careers
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
