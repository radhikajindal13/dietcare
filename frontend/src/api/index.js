const BASE = import.meta.env.VITE_API_BASE || "/api";

export async function getRecommendations(userId) {
  const res = await fetch(`${BASE}/recommendations?user_id=${encodeURIComponent(userId)}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`getRecommendations failed: ${res.status} ${text}`);
  }
  return res.json(); // expected shape: { recommendations: [...] }
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
  const res = await fetch(`${BASE}/profiles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`submitProfile failed: ${res.status} ${text}`);
  }
  return res.json(); // expected { user_id: "...", profile: {...} }
}

export default {
  getRecommendations,
  logInteraction,
  submitProfile,
};
