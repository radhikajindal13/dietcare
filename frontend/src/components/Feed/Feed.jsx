// src/components/Feed/Feed.jsx
import { useEffect, useState } from "react";
import { getRecommendations, logInteraction } from "../../api";
import { useUser } from "../../contexts/UserContext";
import RecipeCard from "./RecipeCard";

const Feed = () => {
  const { userId } = useUser();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchRecs = async () => {
      if (!userId) return; // Wait until onboarding is done

      setLoading(true);
      try {
        const data = await getRecommendations(userId);
        setRecipes(data.recommendations || []);
      } catch (err) {
        console.error("Error fetching recommendations:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecs();
  }, [userId]);

  if (!userId) {
    return <p>Please complete onboarding first.</p>;
  }

  if (loading) {
    return <p>Loading recommendations...</p>;
  }

  return (
    <div>
      <h2>Your Personalized Meal Recommendations</h2>
      <div style={{ display: "grid", gap: "16px" }}>
        {recipes.map((rec) => (
          <RecipeCard
            key={rec.id}
            recipe={rec}
            onLike={async () => {
              // optimistic UI can be added here
              await logInteraction({
                user_id: userId,
                recipe_id: rec.id,
                event_type: "like",
              });
            }}
            onSave={async () => {
              await logInteraction({
                user_id: userId,
                recipe_id: rec.id,
                event_type: "save",
              });
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default Feed;
