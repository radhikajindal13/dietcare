import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GoogleSignIn from "../GoogleSignIn/GoogleSignIn"; // adjust path if your file is elsewhere
import { useUser } from "../../contexts/UserContext";
import "./Hero.css";

const IMGS = [
  "https://images.unsplash.com/photo-1546069901-eacef0df6022?q=80&w=1400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=1400&auto=format&fit=crop"
];

export default function Hero() {
  const [theme, setTheme] = useState('light'); // Default theme is light
  const { user, login } = useUser(); // MUST be inside component body
  const navigate = useNavigate();

  // This effect will run once on component mount to set the initial theme
  useEffect(() => {
    // On initial load, set the theme based on localStorage (if available)
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
      document.body.setAttribute('data-theme', savedTheme);
    } else {
      // If no theme saved, default to light
      document.body.setAttribute('data-theme', 'light');
    }
  }, []);

  // Toggle theme between light and dark
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    // Apply theme to body
    document.body.setAttribute('data-theme', newTheme);
    // Optionally save to localStorage so the theme persists on page reload
    localStorage.setItem('theme', newTheme);
  };

  async function handleGoogleSuccess(data) {
    const u = data?.user ?? { id: 1, name: "Demo User", email: "demo@dietcare.app" };
    login(u);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE || "http://localhost:4000"}/profiles?user_id=${u.id}`);
      const arr = await res.json();
      if (arr && arr.length) navigate("/home"); else navigate("/onboarding");
    } catch {
      navigate("/onboarding");
    }
  }

  return (
    <header className="dc-hero">
      <nav className="dc-nav container">
        <div className="dc-logo">DietCare</div>

        <div className="dc-nav-right">
          <button className="btn-ghost" aria-label="theme" onClick={toggleTheme}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>

          {/* Use Link so navigation is SPA-style */}
          <Link to="/login"><button className="btn-ghost">Login</button></Link>
          {user ? (
            <button className="btn-primary" onClick={() => navigate("/dashboard")}>Dashboard</button>
          ) : (
            <Link to="/signup"><button className="btn-primary">Sign Up</button></Link>
          )}
        </div>
      </nav>

      <div className="dc-hero-inner container">
        <section className="dc-hero-left">
          <h1 className="dc-hero-title">
            Eat smarter. <span className="dc-hero-accent">Stay healthy.</span>
          </h1>

          <p className="dc-hero-sub">
            AI‑powered meal recommendations tailored to your health needs. Practical recipes, clear nutrition breakdowns, and grocery-ready plans — built with trusted USDA data.
          </p>

          <div className="dc-hero-ctas">
            <GoogleSignIn
              onSuccess={handleGoogleSuccess}
              onError={(e) => { console.error("Google sign in error", e); }}
            />
            <div style={{ width: 12 }} />
            <button className="btn-primary large" onClick={() => navigate(user ? "/home" : "/signup")}>Get personalized meals</button>
          </div>

          <ul className="dc-trust-list" aria-hidden="true">
            <li>No credit card required</li>
            <li>Free forever plan available</li>
            <li>Nutrition engine powered by USDA</li>
          </ul>
        </section>

        <aside className="dc-hero-right" aria-hidden="true">
          <div className="image-stack" role="img" aria-label="Assortment of healthy meals">
            <div className="img-card card-a"><img src={IMGS[0]} alt="Salad bowl" /></div>
            <div className="img-card card-b"><img src={IMGS[1]} alt="Hearty soup" /></div>
            <div className="img-card card-c"><img src={IMGS[2]} alt="Oats and fruit" /></div>
          </div>

          <div className="right-badge">
            <div>
              <strong>3,200+</strong>
              <div>Healthy recipes</div>
            </div>
            <div style={{ marginLeft: 18 }}>
              <strong>100+</strong>
              <div>Condition filters</div>
            </div>
          </div>
        </aside>
      </div>
    </header>
  );
}
