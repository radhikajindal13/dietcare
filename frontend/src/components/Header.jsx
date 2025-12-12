import React from "react";
import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header style={{ padding: "12px 20px", borderBottom: "1px solid #eee" }}>
      <nav style={{ display: "flex", gap: 12 }}>
        <Link to="/">Home</Link>
        <Link to="/feed">Feed</Link>
        <Link to="/planner">Planner</Link>
        <Link to="/onboarding">Onboarding</Link>
      </nav>
    </header>
  );
}
