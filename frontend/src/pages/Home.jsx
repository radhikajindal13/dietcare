import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div>
      <h1>Welcome — Home</h1>
      <p>
        Go to <Link to="/feed">Feed</Link> or <Link to="/onboarding">Onboarding</Link> or{" "}
        <Link to="/planner">Planner</Link>
      </p>
    </div>
  );
}
