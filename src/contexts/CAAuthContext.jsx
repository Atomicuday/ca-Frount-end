import React, { createContext, useState, useEffect } from "react";
import { storage } from "../utils/storage";
import { STORAGE_KEYS } from "../constants/storageKeys";

export const CAAuthContext = createContext(null);

const INITIAL_MOCK_CA = {
  id: "CA-4091",
  name: "CA Rajesh Sharma, FCA",
  firmName: "R. Sharma & Associates",
  membershipNo: "058921",
  firmRegNo: "014298S",
  email: "rajesh.sharma@zapdocs.in",
  phone: "+91 98450 12345",
  city: "Bengaluru",
  state: "Karnataka",
  copActive: true,
  role: "PRACTICING_CHARTERED_ACCOUNTANT"
};

export const CAAuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    return storage.get(STORAGE_KEYS.CA_USER, INITIAL_MOCK_CA);
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    storage.set(STORAGE_KEYS.CA_USER, user);
  }, [user]);

  const login = async (identifier, _password) => {
    setLoading(true);
    try {
      // Prototype authentication simulation
      const loggedUser = {
        ...INITIAL_MOCK_CA,
        email: identifier.includes("@") ? identifier : INITIAL_MOCK_CA.email
      };
      setUser(loggedUser);
      storage.set(STORAGE_KEYS.CA_SESSION, {
        token: "dev_ca_session_token",
        timestamp: Date.now()
      });
      return { success: true, user: loggedUser };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    storage.remove(STORAGE_KEYS.CA_SESSION);
    // Retain mock user or set null
  };

  const updateProfile = (updatedFields) => {
    setUser((prev) => ({ ...prev, ...updatedFields }));
  };

  return (
    <CAAuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        updateProfile,
        isAuthenticated: !!user
      }}
    >
      {children}
    </CAAuthContext.Provider>
  );
};

export default CAAuthProvider;
