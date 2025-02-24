import React, { useContext } from "react";
import { AuthContext } from "./authProvider"; // Importuj AuthContext

const Test = () => {
  const { authInfo } = useContext(AuthContext); // Používáme AuthContext

  return (
    <div>
      <h1>User Info</h1>
      {authInfo.isAuthenticated ? (
        <div>
          <p>Username: {authInfo.username}</p>
          <p>Email: {authInfo.email}</p>
          <p>Role: {authInfo.role}</p>
        </div>
      ) : (
        <p>Uživatel není přihlášen.</p>
      )}
    </div>
  );
};

export default Test;
