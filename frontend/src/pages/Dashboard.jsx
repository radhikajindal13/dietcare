// src/pages/Dashboard.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

export default function Dashboard() {
  const { user } = useUser();

  return (
    <main className="container" style={{padding:24}}>
      <h2>Welcome back, {user?.name?.split(" ")[0]}</h2>
      <p className="muted">Quick actions</p>

      <div style={{display:"flex", gap:14, marginTop:18, flexWrap:"wrap"}}>
        <Link to="/home" className="btn-primary" style={{padding:"12px 18px"}}>View Recommendations</Link>
        <Link to="/saved" className="btn-ghost" style={{padding:"12px 18px"}}>Saved Recipes</Link>
        <Link to="/onboarding" className="btn-ghost" style={{padding:"12px 18px"}}>Edit Profile</Link>
      </div>
    </main>
  );
}
