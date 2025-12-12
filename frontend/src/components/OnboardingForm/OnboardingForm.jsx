import { useState } from "react";
import { useUser } from "../../contexts/UserContext";
import { submitProfile } from "../../api";
import { useNavigate } from "react-router-dom";

const conditionsList = ["Diabetes", "Hypertension", "PCOS", "Thyroid", "High Cholesterol"];
const dietTypes = ["Vegetarian", "Vegan", "Non-Vegetarian"];

const OnboardingForm = () => {
  const { updateProfile, setUserId } = useUser();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    age: "",
    dietType: "",
    conditions: [],
    allergies: "",
    budget: "",
  });

  const [saving, setSaving] = useState(false);

  const handleConditionToggle = (condition) => {
    setForm((prev) => ({
      ...prev,
      conditions: prev.conditions.includes(condition)
        ? prev.conditions.filter((c) => c !== condition)
        : [...prev.conditions, condition],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.age || !form.dietType) {
      alert("Please provide your age and diet preference.");
      return;
    }

    setSaving(true);
    try {
      const resp = await submitProfile(form);
      updateProfile(resp.profile ?? form);

      if (resp?.user_id) {
        setUserId(resp.user_id);
      }

      alert("Profile saved! Now you can explore recommendations.");
      navigate("/feed");
    } catch (err) {
      console.error("Failed to save profile:", err);
      alert("Error saving profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2>Tell us about your diet & health</h2>

      <form onSubmit={handleSubmit}>
        <label>Age:</label>
        <input
          type="number"
          value={form.age}
          onChange={(e) => setForm({ ...form, age: e.target.value })}
        />

        <label>Diet Preference:</label>
        <select
          value={form.dietType}
          onChange={(e) => setForm({ ...form, dietType: e.target.value })}
        >
          <option value="">Select...</option>
          {dietTypes.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>

        <label>Medical Conditions:</label>
        <div>
          {conditionsList.map((condition) => (
            <div key={condition}>
              <input
                type="checkbox"
                checked={form.conditions.includes(condition)}
                onChange={() => handleConditionToggle(condition)}
              />
              <span>{condition}</span>
            </div>
          ))}
        </div>

        <label>Allergies (comma separated):</label>
        <input
          type="text"
          placeholder="e.g. peanuts, dairy"
          value={form.allergies}
          onChange={(e) => setForm({ ...form, allergies: e.target.value })}
        />

        <label>Monthly Budget (optional):</label>
        <input
          type="number"
          value={form.budget}
          onChange={(e) => setForm({ ...form, budget: e.target.value })}
        />

        <div style={{ marginTop: 10 }}>
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OnboardingForm;
