// frontend/src/components/GoogleSignIn/GoogleSignIn.jsx
import React, { useEffect, useRef, useState } from "react";

export default function GoogleSignIn({ onSuccess, onError }) {
  const btnRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [clientError, setClientError] = useState(null);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setClientError("Missing VITE_GOOGLE_CLIENT_ID in .env");
      console.error("Missing VITE_GOOGLE_CLIENT_ID in .env");
      return;
    }

    let mounted = true;
    // Poll for window.google up to timeout
    const start = Date.now();
    const timeoutMs = 8000; // 8s
    const poll = () => {
      if (!mounted) return;
      if (window.google && window.google.accounts && window.google.accounts.id) {
        try {
          // initialize once
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
            ux_mode: "popup"
          });
          // render the button into the ref container
          if (btnRef.current) {
            window.google.accounts.id.renderButton(btnRef.current, {
              theme: "outline",
              size: "large",
              width: 260
            });
          }
          setReady(true);
        } catch (err) {
          console.error("Google init error:", err);
          setClientError("Google init error: " + String(err));
        }
        return;
      }
      if (Date.now() - start > timeoutMs) {
        setClientError("Timed out waiting for Google script.");
        return;
      }
      // try again shortly
      setTimeout(poll, 200);
    };
    poll();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCredentialResponse(response) {
    try {
      const idToken = response?.credential;
      if (!idToken) throw new Error("No credential returned by Google");
      // send to backend for verification
      const res = await fetch("http://localhost:8000/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id_token: idToken })
      });
      const data = await res.json();
      if (!res.ok) throw data;
      onSuccess?.(data);
    } catch (err) {
      console.error("Google sign-in error:", err);
      onError?.(err);
    }
  }

  // fallback clickable button if script didn't load in time
  if (clientError) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button
          className="btn-cta-ghost"
          onClick={() => window.open("http://localhost:8000/auth/google/login", "_blank")}
        >
          Continue with Google (fallback)
        </button>
        <div style={{ color: "#c04444", fontSize: 13 }}>{clientError}</div>
      </div>
    );
  }

  return (
    <div>
      <div ref={btnRef} />
      {!ready && (
        <div style={{ marginTop: 8 }}>
          <button className="btn-cta-ghost" disabled>Loading Google sign-in…</button>
        </div>
      )}
    </div>
  );
}
