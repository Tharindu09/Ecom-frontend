import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.js";
import Loader from "../components/Loader.jsx";

const Login = ({ onToast }) => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.email) nextErrors.email = "Email is required";
    if (!form.password) nextErrors.password = "Password is required";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    const result = await login(form);
    if (result.ok) {
      onToast?.("Welcome back!", "success");
      const redirectTo = location.state?.from || "/products";
      navigate(redirectTo);
    } else {
      const message =
        result.error?.response?.data?.message ||
        result.error?.message ||
        "Login failed";
      onToast?.(message, "error");
    }
  };

  return (
    <section className="auth">
      <div className="auth__panel">
        <h1>Login</h1>
        <p className="muted">Access your account to place orders.</p>
        <form onSubmit={handleSubmit} className="form">
          <label>
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
            />
            {errors.email && <span className="error">{errors.email}</span>}
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="????????"
            />
            {errors.password && (
              <span className="error">{errors.password}</span>
            )}
          </label>
          <button type="submit" className="button" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
          {loading && <Loader label="Authenticating" />}
        </form>
        <p className="muted">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </section>
  );
};

export default Login;
