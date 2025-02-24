import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Register from "./register";
import Login from "./login";
import MainPage from "./Mainpage"; 
import Test from "./Test"; 
import Teams from "./Teams";
import Chat from './chat'; 

function App() {
  const [userId, setUserId] = useState(null);

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Přesměrování z hlavní stránky na login, pokud není uživatel přihlášen */}
          <Route path="/" element={userId ? <Navigate to="/main" /> : <Navigate to="/login" />} />
          <Route path="/test" element={<Test onLogin={(id) => setUserId(id)} />} />
          <Route path="/login" element={<Login onLogin={(id) => setUserId(id)} />} />
          <Route path="/register" element={<Register onRegister={(id) => setUserId(id)} />} />
          <Route path="/main" element={<MainPage userId={userId} />} />
          <Route path="/Teams" element={<Teams userId={userId} />} />
          <Route path="/chat" element={<Chat userId={userId} />} />  
        </Routes>
      </div>
    </Router>
  );
}

export default App;
