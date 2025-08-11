import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/api";
import { saveToken } from "../utils/auth";
import { debugTokenStatus } from "../utils/auth";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const emailRef = useRef(null);
  const errorRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  useEffect(() => {
    if (error) {
      errorRef.current?.focus();
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please fill in both email and password.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const response = await loginUser({ email, password });
          console.log("Login API response:", response);
    if (!response.token || typeof response.token !== "string" || response.token.split(".").length !== 3) {
      throw new Error("Invalid authentication token received from server.");
    }
      const saved = saveToken(response.token);
      if (!saved) throw new Error("Failed to save authentication token.");
      debugTokenStatus();
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <form onSubmit={handleSubmit} style={{
        maxWidth: 400,
        width: '90%',
        padding: 40,
        borderRadius: 12,
        boxShadow: 'var(--shadow)',
        background: 'var(--bg-card)'
      }}>
        <h2 style={{ marginBottom: 24, textAlign: 'center' }}>Login</h2>

        {error && <div ref={errorRef} tabIndex={-1} style={{
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: 'white',
          padding: 12,
          borderRadius: 8,
          marginBottom: 20,
          fontWeight: 600,
          outline: 'none'
        }}>{error}</div>}

        <div style={{ position: 'relative', marginBottom: 24 }}>
          <input
            ref={emailRef}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
            required
            autoComplete="email"
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 8,
              border: `2px solid var(--border-color)`,
              fontSize: 14,
              outline: 'none',
              background: 'var(--bg-card)'
            }}
            disabled={loading}
          />
          <label style={{
            position: 'absolute',
            left: 16,
            top: email || emailFocused ? -10 : 14,
            fontSize: email || emailFocused ? 12 : 16,
            color: '#6366f1',
            backgroundColor: 'var(--bg-card)',
            padding: '0 4px',
            pointerEvents: 'none',
            transition: 'all 0.2s ease'
          }}>Email</label>
        </div>

        <div style={{ position: 'relative', marginBottom: 32 }}>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={e => setPassword(e.target.value)}
            onFocus={() => setPasswordFocused(true)}
            onBlur={() => setPasswordFocused(false)}
            required
            autoComplete="current-password"
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 8,
              border: `2px solid var(--border-color)`,
              fontSize: 14,
              outline: 'none',
              background: 'var(--bg-card)',
              paddingRight: 40
            }}
            disabled={loading}
          />
          <label style={{
            position: 'absolute',
            left: 16,
            top: password || passwordFocused ? -10 : 14,
            fontSize: password || passwordFocused ? 12 : 16,
            color: '#6366f1',
            backgroundColor: 'var(--bg-card)',
            padding: '0 4px',
            pointerEvents: 'none',
            transition: 'all 0.2s ease'
          }}>Password</label>
          <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            color: '#64748b'
          }} tabIndex={-1}>
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: 14 }}>
          {loading ? <span className="animate-spin">âŸ³</span> : 'Login'}
        </button>
      </form>
    </div>
  );
}