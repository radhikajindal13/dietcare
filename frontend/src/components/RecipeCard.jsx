// src/components/RecipeCard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import api from "../api";       // when file is in src/pages (pages folder)
import "./recipecard.css";

export default function RecipeCard({ recipe }) {
  const navigate = useNavigate();
  const { user } = useUser();

  const handleOpen = () => navigate(`/recipe/${recipe.id}`);

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!user) return alert("Please sign in");
    try {
      await api.logInteraction({
        user_id: user.id,
        recipe_id: recipe.id,
        type: "like",
        timestamp: new Date().toISOString()
      });
      // Optionally give quick feedback:
      e.currentTarget.innerText = "Liked ✓";
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <article className="recipe-card" onClick={handleOpen}>
      <div className="rc-media">
        <img src={recipe.image || "https://via.placeholder.com/400x300"} alt={recipe.title} />
      </div>
      <div className="rc-body">
        <h3>{recipe.title}</h3>
        <div className="rc-meta">
          <div>{recipe.calories_kcal ?? "-"} kcal</div>
          <div>{recipe.protein_g ?? 0} g protein</div>
        </div>
        <div className="rc-tags">
          {(recipe.tags || []).slice(0,3).map(t => <span key={t} className="tag">{t}</span>)}
        </div>

        <div className="rc-actions">
          <button className="btn-ghost" onClick={handleLike}>❤ Like</button>
          <button className="btn-primary" onClick={(e)=>{ e.stopPropagation(); handleOpen(); }}>View</button>
        </div>
      </div>
    </article>
  );
}
