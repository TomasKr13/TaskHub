import React, { createContext, useState, useEffect } from 'react';

// Vytvoření kontextu
export const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [authInfo, setAuthInfo] = useState({
    userID: null,
    username: null,
    role: null,
    email: null,
    isAuthenticated: false,
  });

  // Funkce pro načtení informací o uživateli z backendu
  const fetchAuthInfo = async () => {
    try {
      const response = await fetch('/api/auth/info', {
        method: 'GET',
        credentials: 'include', // Pokud používáš cookies pro autentizaci
      });

      if (response.ok) {
        const data = await response.json();
        setAuthInfo({
          userID: data.user.id,
          username: data.user.username,
          role: data.user.role,
          email: data.user.email,
          isAuthenticated: true,
        });
      } else {
        // Pokud uživatel není přihlášen
        setAuthInfo({
          userID: null,
          username: null,
          role: null,
          email: null,
          isAuthenticated: false,
        });
      }
    } catch (error) {
      console.error('Chyba při načítání informací o uživateli:', error);
      setAuthInfo({
        userID: null,
        username: null,
        role: null,
        email: null,
        isAuthenticated: false,
      });
    }
  };

  // Načti informace o uživateli při načtení aplikace
  useEffect(() => {
    fetchAuthInfo();
  }, []);

  return (
    <AuthContext.Provider value={{ authInfo, setAuthInfo, fetchAuthInfo }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
