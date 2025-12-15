// src/pages/Signup.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

export default function Signup() {
  const { login } = useUser();
  const navigate = useNavigate();

  // Simple demo signup that creates a user in front-end only
  function handleDemoSignup() {
    const u = { id: Date.now(), name: "New User", email: "new@demo.com" };
    login(u);
    navigate("/onboarding");
  }

  return (
    <main className="container" style={{padding:28}}>
      <h2>Create account</h2>
      <p className="muted">Simple demo signup. Replace with real form later.</p>

      <div style={{ marginTop: 18 }}>
        <button className="btn-primary" onClick={handleDemoSignup}>Create demo account</button>
      </div>
    </main>
  );
}
