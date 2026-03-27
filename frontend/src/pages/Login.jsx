import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import "./Auth.css";

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // ✅ DEMO LOGIN
    if (email === "demo@talentalign.com" && password === "demo123") {
  localStorage.setItem("access_token", "demo-token");
  navigate("/choose-plan");
  setLoading(false);
  return;
}

    try {
      // ✅ BACKEND LOGIN
      const response = await api.post(
        "/auth/login",
        new URLSearchParams({
          username: email,
          password: password,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      localStorage.setItem("access_token", response.data.access_token);
navigate("/choose-plan");

    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Incorrect email or password. Try demo@talentalign.com / demo123"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">

        {/* BRAND */}
        <div className="auth-brand">
          <div className="auth-logo">TA</div>
          <h1>TalentAlign AI</h1>
          <p>Smart resume matching for recruiters</p>
        </div>

        {/* FORM */}
        <form onSubmit={handleLogin} className="auth-form">
          <h2>Sign in to your account</h2>

          {error && <div className="auth-error">{error}</div>}

          {/* EMAIL */}
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="recruiter@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* PASSWORD */}
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* BUTTON */}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>

          {/* SIGNUP */}
          <p className="auth-link">
            Don't have an account? <Link to="/signup">Create one</Link>
          </p>

          {/* DEMO INFO */}
          <div
            style={{
              marginTop: "16px",
              padding: "10px 14px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#166534",
            }}
          >
            <strong>Demo credentials:</strong><br />
            Email: demo@talentalign.com<br />
            Password: demo123
          </div>
        </form>

      </div>
    </div>
  );
};

export default Login;