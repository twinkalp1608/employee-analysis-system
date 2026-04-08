import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import "../style/ForgotPassword.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

  useEffect(() => {
    if (step !== 2 || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [step, timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const navigate = useNavigate();

  const sendOTP = async () => {
    setLoading(true);
    try {
      await axios.post(
        "https://employee-analysis-system-1.onrender.com//api/send-otp",
        { email },
      );
      alert("OTP sent successfully");
      setStep(2);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };
  const verifyOTP = async () => {
    setLoading(true);
    try {
      await axios.post(
        "https://employee-analysis-system-1.onrender.com//api/verify-otp",
        {
          email,
          otp,
        },
      );

      alert("OTP verified ✅");
      setStep(3); // 👉 Password step open
    } catch (err) {
      alert(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (otp.length === 6 && step === 2) {
      verifyOTP();
    }
  }, [otp]);

  const resetPassword = async () => {
    setLoading(true);
    try {
      await axios.post(
        "https://employee-analysis-system-1.onrender.com//api/reset-password",
        {
          email,
          otp,
          newPassword,
        },
      );
      alert("Password updated successfully");
      navigate("/");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-container">
      <div className="forgot-card">
        <h2>Forgot Password</h2>

        {step === 1 && (
          <>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button className="forgot-btn" onClick={sendOTP} disabled={loading}>
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              disabled={loading} // ⭐ add this line
            />

            {/* ⭐ TIMER AHIA MUKVU */}
            <p style={{ color: "red", marginBottom: "10px" }}>
              OTP valid for {minutes}:{seconds < 10 ? "0" : ""}
              {seconds}
            </p>
          </>
        )}

        {step === 3 && (
          <>
            <input
              type="password"
              name="newPassword"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />

            <button
              className="forgot-btn"
              onClick={resetPassword}
              disabled={loading}
            >
              {loading ? "Updating..." : "Reset Password"}
            </button>
          </>
        )}

        <div className="back-link">
          <Link to="/">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
