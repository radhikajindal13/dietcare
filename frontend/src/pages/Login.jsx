// src/pages/Login.jsx
import React from "react";
import { Link } from "react-router-dom";
import GoogleSignIn from "../components/GoogleSignIn/GoogleSignIn"; // adjust path if different
import { useUser } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function Login() {
  const { login } = useUser();
  const navigate = useNavigate();

  async function handleSuccess(data) {
    // backend returned { ok:true, user:{...} } OR handle a mock user
    const u = data?.user ?? { id: 1, name: "Demo User", email: "demo@dietcare.app" };
    login(u);
    // check profile and route
    try {
      const profile = await api.getProfile?.(u.id) ?? null;
      if (profile) navigate("/home");
      else navigate("/onboarding");
    } catch {
      navigate("/onboarding");
    }
  }

  return (
    <main className="container" style={{padding:28}}>
      <h2>Sign in</h2>
      <p className="muted">Use Google to sign in quickly, or use email/password below (demo).</p>

      <div style={{ marginTop: 18 }}>
        <GoogleSignIn onSuccess={handleSuccess} onError={(e)=>console.error(e)} />
      </div>

      <div style={{ marginTop: 18 }}>
        <p>Or use demo account:</p>
        <button className="btn-primary" onClick={() => { 
          login({ id: 1, name: "Demo User", email: "demo@dietcare.app" });
          navigate("/onboarding");
        }}>Use demo account</button>
      </div>

      <p style={{marginTop:16}}>Don't have an account? <Link to="/signup">Sign up</Link></p>
    </main>
  );
}
