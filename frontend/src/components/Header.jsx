import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

export default function Header() {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  return (
    <header style={{padding:12, borderBottom:"1px solid #eee", background:"var(--bg)"}}>
      <div className="container" style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <div style={{fontWeight:800, color:"var(--primary)"}}><Link to="/">DietCare</Link></div>
        <div style={{display:"flex", gap:10, alignItems:"center"}}>
          {user ? (
            <>
              <div style={{color:"var(--muted)"}}>{user.name}</div>
              <button className="btn-ghost" onClick={()=>navigate("/dashboard")}>Dashboard</button>
              <button className="btn-ghost" onClick={()=>navigate("/saved")}>Saved</button>
              <button className="btn-ghost" onClick={()=>{ logout(); navigate("/"); }}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login"><button className="btn-ghost">Login</button></Link>
              <Link to="/signup"><button className="btn-primary">Sign Up</button></Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
