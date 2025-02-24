import React, { useState, useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "./authProvider";
import "./Teams.css";

const Teams = () => {
  const { authInfo } = useContext(AuthContext);
  const [teams, setTeams] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [currentTeam, setCurrentTeam] = useState(null);

  useEffect(() => {
    const fetchTeams = async () => {
      console.log("halo")
      console.log(authInfo)
      //if (!authInfo?.isAuthenticated || !authInfo.userId) return;
      try {
        const response = await fetch(`/api/teams`);
        if (!response.ok) throw new Error("Chyba při načítání týmů");
        const data = await response.json();
        setTeams(data);
        console.log(data)
      } catch (error) {
        console.error(error);
        alert("Chyba při načítání týmů.");
      }
    };
    fetchTeams();
  }, [authInfo]);

  const createTeam = async () => {
    if (!newTeamName.trim()) {
      alert("Název týmu nemůže být prázdný.");
      return;
    }
    try {
      const response = await fetch("http://localhost:5000/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName: newTeamName }),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Chyba při vytváření týmu");
      const data = await response.json();
      setTeams((prevTeams) => [...prevTeams, { team_name: newTeamName, team_id: data.teamId }]);
      setShowModal(false);
      setNewTeamName("");
    } catch (error) {
      console.error("Chyba při odesílání požadavku:", error);
      alert("Chyba při vytváření týmu.");
    }
  };

  const deleteTeam = async (teamId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/teams/${teamId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Chyba při mazání týmu");
      setTeams((prevTeams) => prevTeams.filter((team) => team.team_id !== teamId));
    } catch (error) {
      console.error("Chyba při mazání týmu:", error);
      alert("Chyba při mazání týmu.");
    }
  };

  const fetchTeamMembers = async (teamId) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/members`);
      if (!response.ok) throw new Error("Chyba při načítání členů týmu");
      const data = await response.json();
      setCurrentTeam((prev) => ({ ...prev, members: data.members }));
    } catch (error) {
      console.error("Chyba při načítání členů týmu:", error);
    }
  };

  const handleTeamClick = async (team) => {
    setCurrentTeam(team);
    await fetchTeamMembers(team.team_id);
    setShowModal(true);
  };

  return (
    <div className="teams-container">
      <header className="top-navbar">
        <nav className="nav-links">
          <Link to="/main">Hlavní strana</Link>
          <Link to="/chat">Chat</Link>
          <Link to="/settings">Odhlásit</Link>
        </nav>
        <h1 className="site-title">TASKHUB</h1>
        <div className="user-profile">
          <span className="user-icon">👤</span>
          {authInfo?.isAuthenticated && (
            <div className="user-info">
              <p><strong>Uživatel:</strong> {authInfo.username}</p>
              <p><strong>Email:</strong> {authInfo.email}</p>
            </div>
          )}
        </div>
      </header>

      <div className="teams-overview">
        <div className="teams-list">
          {teams.length > 0 ? (
            teams.map((team) => (
              <div key={team.team_id} className="team-card">
                <h2>{team.team_name}</h2>
                <button onClick={() => handleTeamClick(team)}>Zobrazit tým</button>
                <button onClick={() => deleteTeam(team.team_id)}>Smazat tým</button>
              </div>
            ))
          ) : (
            <p>Žádné týmy zatím nebyly vytvořeny.</p>
          )}
        </div>
        <button onClick={() => { setShowModal(true); setCurrentTeam(null); }}>+ Přidat tým</button>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            {currentTeam ? (
              <>
                <h2>{currentTeam.team_name}</h2>
                <h3>Členové týmu</h3>
                <ul>
                  {currentTeam.members?.map((member) => (
                    <li key={member.user_id}>{member.username}</li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <h2>Přidat nový tým</h2>
                <input type="text" placeholder="Název týmu" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} />
                <button onClick={createTeam}>Přidat tým</button>
              </>
            )}
            <button onClick={() => setShowModal(false)}>Zavřít</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teams;
