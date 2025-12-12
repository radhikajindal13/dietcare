import React from "react";

const RecipeCard = ({ recipe, onLike, onSave }) => {
  const safeOnLike = onLike ?? (() => {});
  const safeOnSave = onSave ?? (() => {});

  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: "12px",
        borderRadius: "8px",
        maxWidth: "320px",
      }}
    >
      {recipe.image ? (
        <img
          src={recipe.image}
          alt={recipe.title || "recipe image"}
          style={{
            width: "100%",
            borderRadius: "8px",
            marginBottom: "8px",
            objectFit: "cover",
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: 160,
            borderRadius: 8,
            background: "#f6f6f6",
            marginBottom: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#888",
          }}
        >
          No image
        </div>
      )}

      <h3 style={{ margin: "6px 0" }}>{recipe.title}</h3>

      {recipe.calories && <p style={{ margin: "4px 0" }}>Calories: {recipe.calories}</p>}

      {recipe.reason && (
        <p style={{ fontStyle: "italic", color: "#555" }}>Why this meal: {recipe.reason}</p>
      )}

      <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
        <button type="button" onClick={safeOnLike}>
          ❤️ Like
        </button>
        <button type="button" onClick={safeOnSave}>
          💾 Save
        </button>
      </div>
    </div>
  );
};

export default RecipeCard;
