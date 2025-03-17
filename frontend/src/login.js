import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from './authProvider';
import './login.css'; // Importování CSS souboru

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { fetchAuthInfo } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Logika pro přihlášení

    try {
      const response = await fetch("/api/auth/login", { 
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: username,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await fetchAuthInfo(); // Aktualizace stavu autentizace
        navigate('/main');
      } else {
        alert(data.message); 
      }
    } catch (error) {
      alert(`Chyba: ${error.message}`);
    }
  };

  return (
    <div className="login-container">
      <h2>TaskHub</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Email"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Heslo"
        />
        <button type="submit">Přihlásit se</button>
      </form>
      <Link to="/register">Nemáte účet? Zaregistrujte se</Link>
    </div>
  );
};

export default Login;
