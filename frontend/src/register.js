import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./register.css";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage("Hesla se neshodují!");
      return;
    }

    try {
      const response = await fetch("/api/auth/register", { 
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        // Přesměrování na přihlašovací stránku po úspěšné registraci
        navigate('/login');
      } else {
        setMessage(data.message); 
      }
    } catch (error) {
      setMessage(`Chyba: ${error.message}`);
    }
  };

  return (
    <div className="register-container">
      <h2>TaskHub</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Uživatelské jméno"
          required
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Heslo"
          required
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Potvrďte heslo"
          required
        />
        {message && <div className="message">{message}</div>}
        <button type="submit">Zaregistrovat se</button>
      </form>
      <Link to="/login">Máte účet? Přihlaste se</Link>
    </div>
  );
};

export default Register;
