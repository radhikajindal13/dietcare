import { createContext, useContext, useState } from "react";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);
  const [userId, setUserId] = useState(null);

  const updateProfile = (data) => {
    setProfile(data);
  };

  const value = {
    profile,
    updateProfile,
    userId,
    setUserId,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => useContext(UserContext);
