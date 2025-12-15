// src/pages/RecipeDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import "./recipe-detail.css";

export default function RecipeDetail() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);

  useEffect(() => {
    api.getRecipe(id).then(setRecipe).catch(console.error);
  }, [id]);

  if (!recipe) return <div className="container" style={{padding:24}}>Loading...</div>;

  return (
    <main className="recipe-detail container">
      <div className="rd-grid">
        <div className="rd-media">
          <img src={recipe.image || "https://via.placeholder.com/800x500"} alt={recipe.title} />
        </div>
        <div className="rd-info">
          <h1>{recipe.title}</h1>
          <div className="rd-nutrition">
            <div>{recipe.calories_kcal} kcal</div>
            <div>{recipe.protein_g} g protein</div>
            <div>{recipe.sodium_mg ?? 0} mg sodium</div>
          </div>

          <h3>Ingredients</h3>
          <ul>{(recipe.ingredients||[]).map((it, i)=> <li key={i}>{it}</li>)}</ul>

          <h3>Instructions</h3>
          <ol>{(recipe.instructions||[]).map((s,i)=> <li key={i}>{s}</li>)}</ol>

          <div className="rd-footer">
            <button className="btn-primary">Mark as cooked</button>
            <button className="btn-ghost">Save</button>
          </div>
        </div>
      </div>
    </main>
  );
}
