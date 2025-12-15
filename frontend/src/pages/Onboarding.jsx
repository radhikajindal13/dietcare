// src/pages/Onboarding.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import api from "../api"; // your API wrapper
import "./Onboarding.css";

export default function Onboarding() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    user_id: user?.id ?? null,
    age: "",
    diet: "vegetarian",
    allergies: [],
    conditions: [],
    calorie_target: ""
  });

  useEffect(() => {
    if (!user) return;
    // try to prefill if profile exists
    (async () => {
      try {
        const p = await api.getProfile(user.id);
        if (p) {
          setProfile({
            ...profile,
            id: p.id,
            age: p.age || "",
            diet: p.diet || "vegetarian",
            allergies: p.allergies || [],
            conditions: p.conditions || [],
            calorie_target: p.calorie_target || ""
          });
        }
      } catch (err) {
        // ignore
      }
    })();
    // eslint-disable-next-line
  }, [user]);

  const checkboxToggle = (field, value) => {
    setProfile((s) => {
      const arr = new Set(s[field]);
      if (arr.has(value)) arr.delete(value);
      else arr.add(value);
      return { ...s, [field]: Array.from(arr) };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...profile, user_id: user.id };
      const saved = await api.submitProfile(payload);
      // navigate to home after profile is saved
      navigate("/home");
    } catch (err) {
      console.error(err);
      alert("Could not save profile. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="onboarding container">
      <h2>Complete your profile</h2>
      <form onSubmit={handleSubmit} className="onboarding-form">
        <label>
          Age
          <input
            type="number"
            value={profile.age}
            onChange={(e) => setProfile({ ...profile, age: e.target.value })}
            min="5"
            max="120"
            required
          />
        </label>

        <label>
          Diet preference
          <select
            value={profile.diet}
            onChange={(e) => setProfile({ ...profile, diet: e.target.value })}
          >
            <option value="vegetarian">Vegetarian</option>
            <option value="vegan">Vegan</option>
            <option value="non-veg">Non-Veg</option>
            <option value="pescatarian">Pescatarian</option>
          </select>
        </label>

        <div className="chips">
          <div className="chip-title">Allergies</div>
          {["dairy", "peanut", "gluten", "soy"].map((a) => (
            <label key={a} className="chip">
              <input
                type="checkbox"
                checked={profile.allergies.includes(a)}
                onChange={() => checkboxToggle("allergies", a)}
              />
              <span>{a}</span>
            </label>
          ))}
        </div>

        <div className="chips">
          <div className="chip-title">Medical conditions</div>
          {["diabetes", "hypertension", "kidney"].map((c) => (
            <label key={c} className="chip">
              <input
                type="checkbox"
                checked={profile.conditions.includes(c)}
                onChange={() => checkboxToggle("conditions", c)}
              />
              <span>{c}</span>
            </label>
          ))}
        </div>

        <label>
          Daily calorie target (kcal)
          <input
            type="number"
            value={profile.calorie_target}
            onChange={(e) => setProfile({ ...profile, calorie_target: e.target.value })}
          />
        </label>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Saving..." : "Save profile & continue"}
          </button>
        </div>
      </form>
    </main>
  );
}
