// src/pages/Saved.jsx
import React, { useEffect, useState } from "react";
import { useUser } from "../contexts/UserContext";
import api from "../api";
import RecipeCard from "../components/RecipeCard";

export default function Saved() {
  const { user } = useUser();
  const [likes, setLikes] = useState([]);
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE || "http://localhost:4000"}/interactions?user_id=${user.id}&type=like`);
        const arr = await res.json();
        setLikes(arr || []);
        // fetch recipe details
        const ids = arr.map(a => a.recipe_id);
        const recs = await Promise.all(ids.map(id => api.getRecipe(id)));
        setRecipes(recs);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [user]);

  return (
    <main className="container" style={{padding:24}}>
      <h2>Saved / Liked recipes</h2>
      <div style={{marginTop:16}}>
        {recipes.length ? (
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:18}}>
            {recipes.map(r => <RecipeCard key={r.id} recipe={r} />)}
          </div>
        ) : <div className="empty">You have not liked any recipes yet.</div>}
      </div>
    </main>
  );
}
