// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header.jsx";
import Home from "./pages/Home";
import Planner from "./pages/Planner";
import OnboardingForm from "./components/OnboardingForm/OnboardingForm";
import Feed from "./components/Feed/Feed";

function App() {
  return (
    <>
      <Header />
      <main style={{ padding: 20 }}>
        <Routes>
          <Route path="/onboarding" element={<OnboardingForm />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/planner" element={<Planner />} />
          <Route path="/" element={<Home />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
