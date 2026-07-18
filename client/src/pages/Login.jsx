import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Logo from "../components/Logo.jsx";
import "./Auth.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login({ username: identifier.trim(), password });
      navigate("/");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <div className="auth__brand">
        <Logo size={60} />
        <h1 className="auth__title">
          Swap<span>Crate</span>
        </h1>
        <p className="auth__tagline">Trade what you have for what you want</p>
      </div>

      <form className="auth__form" onSubmit={handleSubmit}>
        <input
          className="field-input"
          type="text"
          placeholder="Username or email"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="username"
        />
        <input
          className="field-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        {error && <p className="auth__error">{error}</p>}

        <button
          type="submit"
          className="btn-primary auth__submit"
          disabled={busy || !identifier || !password}
        >
          {busy ? "Signing in…" : "Log in"}
        </button>
      </form>

      <p className="auth__switch">
        New to SwapCrate? <Link to="/register">Create an account</Link>
      </p>
    </div>
  );
}
