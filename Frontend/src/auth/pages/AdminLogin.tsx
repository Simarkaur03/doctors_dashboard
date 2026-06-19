import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function AdminLogin() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || "/admin/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(email, password);
      // verify role from users collection
      // role checking is performed by AuthContext onAuthStateChanged; wait a tick
      // small delay to allow AuthContext to fetch role
      await new Promise((r) => setTimeout(r, 500));
      // If role is not admin, sign out and show error
      // We'll rely on AuthContext.role during route protection; here we simply navigate and let ProtectedRoute enforce.
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || String(err));
      try {
        await logout();
      } catch (_) {}
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", background: "#111", color: "#fff", padding: 20 }}>
      <h2>Admin Sign In</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <input style={{ width: "100%" }} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label>Password</label>
          <input style={{ width: "100%" }} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit" disabled={loading} style={{ marginTop: 12 }}>{loading ? "Signing in..." : "Sign In"}</button>
        {error && <div style={{ color: "salmon" }}>{error}</div>}
      </form>
    </div>
  );
}
