// src/api/index.js
const BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export async function getRecipe(id) {
  const res = await fetch(`${BASE}/recipes/${encodeURIComponent(id)}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`getRecipe failed: ${res.status} ${text}`);
  }
  return res.json();
}
/**
 * Fetch recommendations for a user from the mock server.
 * Returns { recommendations: [...] }
 */
export async function getRecommendations(userId) {
  const r = await fetch(`${BASE}/recipes`);
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`getRecommendations (recipes) failed: ${r.status} ${text}`);
  }
  let recipes = await r.json();

  if (userId) {
    try {
      const p = await fetch(`${BASE}/profiles?user_id=${encodeURIComponent(userId)}`);
      if (p.ok) {
        const profiles = await p.json();
        const profile = profiles.length ? profiles[0] : null;
        if (profile) {
          const allergies = Array.isArray(profile.allergies) ? profile.allergies.map(a => a.toLowerCase()) : [];
          const conditions = Array.isArray(profile.conditions) ? profile.conditions.map(c => c.toLowerCase()) : [];

          recipes = recipes.filter(recipe => {
            for (const allergy of allergies) {
              const flagName = `contains_${allergy.replace(/\s+/g, "_")}`;
              if (flagName in recipe && recipe[flagName]) return false;
            }
            if (conditions.includes("hypertension") && (recipe.sodium_mg ?? 0) > 500) return false;
            return true;
          });

          recipes.sort((a, b) => (a.sodium_mg ?? 0) - (b.sodium_mg ?? 0));
        }
      }
    } catch (err) {
      console.warn("Could not load profile for personalization:", err);
    }
  } else {
    recipes.sort((a, b) => (a.sodium_mg ?? 0) - (b.sodium_mg ?? 0));
  }

  return { recommendations: recipes };
}

export async function logInteraction(payload) {
  try {
    const res = await fetch(`${BASE}/interactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      console.warn("logInteraction warning:", res.status, text);
    }
    return res.ok ? await res.json().catch(() => ({})) : null;
  } catch (err) {
    console.error("logInteraction error:", err);
    return null;
  }
}

export async function submitProfile(profile) {
  try {
    if (profile.id) {
      const res = await fetch(`${BASE}/profiles/${profile.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`submitProfile failed: ${res.status} ${text}`);
      }
      return res.json();
    } else {
      const res = await fetch(`${BASE}/profiles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`submitProfile failed: ${res.status} ${text}`);
      }
      return res.json();
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export default {
  getRecommendations,
  logInteraction,
  getRecipe,
  submitProfile,
};
