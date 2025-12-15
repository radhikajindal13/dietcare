// import React from "react";
// import { Link } from "react-router-dom";

// export default function Home() {
//   return (
//     <div>
//       <h1>Welcome — Home</h1>
//       <p>
//         Go to <Link to="/feed">Feed</Link> or <Link to="/onboarding">Onboarding</Link> or{" "}
//         <Link to="/planner">Planner</Link>
//       </p>
//     </div>
//   );
// }

// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import { useUser } from "../contexts/UserContext";
import api from "../api";       // when file is in src/pages (pages folder)
import RecipeCard from "../components/RecipeCard";
import "./home.css";

export default function Home() {
  const { user } = useUser();
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const resp = await api.getRecommendations(user?.id);
        if (!mounted) return;
        setRecs(resp.recommendations || []);
      } catch (err) {
        console.error("Failed to load recommendations", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [user]);

  return (
    <main className="home container">
      <header className="home-header">
        <div>
          <h2>Good to see you, {user?.name?.split(" ")[0] ?? "there"} 👋</h2>
          <p className="muted">Personalized recipes based on your profile</p>
        </div>
        <div className="quick-filters">
          <button className="filter">Low sodium</button>
          <button className="filter">High protein</button>
          <button className="filter">Vegetarian</button>
        </div>
      </header>

      {loading ? (
        <div className="grid-skeleton">Loading recommendations…</div>
      ) : (
        <section className="recipe-grid">
          {recs.length ? recs.map((r) => <RecipeCard key={r.id} recipe={r} />) : (
            <div className="empty">No recommendations found. Try updating your profile.</div>
          )}
        </section>
      )}
    </main>
  );
}
