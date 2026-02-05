import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.js";
import Loader from "../components/Loader.jsx";

const Register = ({ onToast }) => {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.name) nextErrors.name = "Name is required";
    if (!form.email) nextErrors.email = "Email is required";
    if (!form.password || form.password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    const result = await register(form);
    if (result.ok) {
      onToast?.("Account created!", "success");
      navigate("/products");
    } else {
      const message =
        result.error?.response?.data?.message ||
        result.error?.message ||
        "Registration failed";
      onToast?.(message, "error");
    }
  };

  return (
    <section className="auth">
      <div className="auth__panel">
        <h1>Create account</h1>
        <p className="muted">Start shopping with your new profile.</p>
        <form onSubmit={handleSubmit} className="form">
          <label>
            Full name
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Jane Doe"
            />
            {errors.name && <span className="error">{errors.name}</span>}
          </label>
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
            {loading ? "Creating..." : "Register"}
          </button>
          {loading && <Loader label="Creating account" />}
        </form>
        <p className="muted">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </section>
  );
};

export default Register;
