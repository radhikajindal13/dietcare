// import { createContext, useContext, useState } from "react";

// const UserContext = createContext();

// export const UserProvider = ({ children }) => {
//   const [profile, setProfile] = useState(null);
//   const [userId, setUserId] = useState(null);

//   const updateProfile = (data) => {
//     setProfile(data);
//   };

//   const value = {
//     profile,
//     updateProfile,
//     userId,
//     setUserId,
//   };

//   return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
// };

// export const useUser = () => useContext(UserContext);

// src/contexts/UserContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";

const UserContext = createContext();
export const useUser = () => useContext(UserContext);

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("dietcare_user"));
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) localStorage.setItem("dietcare_user", JSON.stringify(user));
    else localStorage.removeItem("dietcare_user");
  }, [user]);

  const login = (u) => setUser(u);
  const logout = () => setUser(null);

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}
