import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "./authProvider";
import "./Teams.css";

const Teams = () => {
  const { authInfo, setAuthInfo } = useContext(AuthContext);
  const [teams, setTeams] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [currentTeam, setCurrentTeam] = useState(null);
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayTasks, setDayTasks] = useState("");
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newTask, setNewTask] = useState({ title: "", description: "" });
  const [teamTasks, setTeamTasks] = useState({});
  const [tasksByDay, setTasksByDay] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingMessageText, setEditingMessageText] = useState("");
  const [userToRemove, setUserToRemove] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeams = async () => {
      if (!authInfo?.isAuthenticated || !authInfo.userID) return;
      try {
        const response = await fetch(`/api/teams`, {
          credentials: 'include',
        });
        if (!response.ok) throw new Error("Chyba při načítání týmů");
        const data = await response.json();
        setTeams(data);
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
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName: newTeamName }),
        credentials: "include",
      });
      if (!response.ok) throw Error("Chyba při vytváření týmu");
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
      const response = await fetch(`/api/teams/${teamId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Chyba při mazání týmu");
      setTeams((prevTeams) => prevTeams.filter((team) => team.team_id !== teamId));
      setShowDeleteConfirm(false);
      setTeamToDelete(null);
    } catch (error) {
      console.error("Chyba při mazání týmu:", error);
      alert("Chyba při mazání týmu.");
    }
  };

  const fetchTeamMembers = async (teamId) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/members`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error("Chyba při načítání členů týmu");
      const data = await response.json();
      setCurrentTeam((prev) => ({ ...prev, members: data.members }));
    } catch (error) {
      console.error("Chyba při načítání členů týmu:", error);
    }
  };

  const fetchTeamTasks = async (teamId) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/tasks`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error("Chyba při načítání úkolů týmu");
      const data = await response.json();
      setTeamTasks(data.tasks);
      const tasksByDay = data.tasks.reduce((acc, task) => {
        const date = task.date.split('T')[0];
        if (!acc[date]) acc[date] = [];
        acc[date].push(task);
        return acc;
      }, {});
      setTasksByDay(tasksByDay);
    } catch (error) {
      console.error("Chyba při načítání úkolů týmu:", error);
    }
  };

  const fetchChatMessages = async (teamId) => {
    try {
      const response = await fetch(`/api/chat/${teamId}/messages`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error("Chyba při načítání zpráv");
      const data = await response.json();
      setChatMessages(data);
    } catch (error) {
      console.error("Chyba při načítání zpráv:", error);
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      const response = await fetch(`/api/chat/messages/${messageId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Chyba při mazání zprávy");
      setChatMessages((prevMessages) => prevMessages.filter((msg) => msg.chat_id !== messageId));
    } catch (error) {
      console.error("Chyba při mazání zprávy:", error);
    }
  };

  const handleEditMessage = async (messageId) => {
    try {
      const response = await fetch(`/api/chat/messages/${messageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: editingMessageText }),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Chyba při úpravě zprávy");
      const updatedMessage = await response.json();
      setChatMessages((prevMessages) =>
        prevMessages.map((msg) => (msg.chat_id === messageId ? updatedMessage : msg))
      );
      setEditingMessageId(null);
      setEditingMessageText("");
    } catch (error) {
      console.error("Chyba při úpravě zprávy:", error);
    }
  };

  const handleTeamClick = async (team) => {
    setCurrentTeam(team);
    await fetchTeamMembers(team.team_id);
    await fetchTeamTasks(team.team_id);
    await fetchChatMessages(team.team_id);
    setShowModal(true);
  };

  const getWeekDates = (startDate) => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      dates.push(date.toLocaleDateString());
    }
    return dates;
  };

  const getTwoWeeksDates = () => {
    const today = new Date();
    const startOfWeek = today.getDate() - today.getDay();
    const firstWeekStart = new Date(today.setDate(startOfWeek));
    const secondWeekStart = new Date(today.setDate(startOfWeek + 7));
    return [getWeekDates(firstWeekStart), getWeekDates(secondWeekStart)];
  };

  const [firstWeekDates, secondWeekDates] = getTwoWeeksDates();

  const handleSendMessage = async () => {
    if (chatMessage.trim()) {
      try {
        const response = await fetch(`/api/chat/${currentTeam.team_id}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: authInfo.userID, message: chatMessage }),
          credentials: "include",
        });
        if (!response.ok) throw new Error("Chyba při odesílání zprávy");
        const newMessage = await response.json();
        setChatMessages([...chatMessages, newMessage]);
        setChatMessage("");
      } catch (error) {
        console.error("Chyba při odesílání zprávy:", error);
      }
    }
  };

  const handleDayClick = (date) => {
    setSelectedDay(date);
    setShowModal(true);
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.title || !newTask.description) {
      alert("Název a popis úkolu nemůže být prázdný.");
      return;
    }
  
    const task = {
      ...newTask,
      team_id: currentTeam.team_id,
      assignedTo: authInfo.userID,
      status: "new",
      date: selectedDay,
    };
  
    try {
      const response = await fetch(`/api/teams/${currentTeam.team_id}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(task),
        credentials: "include",
      });
  
      if (!response.ok) {
        throw new Error("Chyba při přidávání úkolu.");
      }
  
      const data = await response.json();
      setTeamTasks((prevTasks) => [...prevTasks, data]);
      setTasksByDay((prevTasks) => ({
        ...prevTasks,
        [selectedDay]: [...(prevTasks[selectedDay] || []), data],
      }));
      setNewTask({ title: "", description: "" });
      setSelectedDay(null);
      setShowModal(false);
    } catch (error) {
      console.error("Chyba při přidávání úkolu:", error);
    }
  };
  

  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length >= 1) { // Fetch users when at least one character is typed
      try {
        const response = await fetch(`/api/users/searchUser/${query}`);
        if (!response.ok) throw new Error("Chyba při vyhledávání uživatelů");
        const data = await response.json();
        setSearchResults(data);
      } catch (error) {
        console.error("Chyba při vyhledávání uživatelů:", error);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleAddUserToTeam = async (userId) => {
    if (!currentTeam) return;

    try {
      const response = await fetch(`/api/teams/${currentTeam.team_id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Chyba při přidávání uživatele do týmu");
      const data = await response.json();
      setCurrentTeam((prev) => ({ ...prev, members: [...prev.members, data] }));
      setSearchQuery("");
      setSearchResults([]);
    } catch (error) {
      console.error("Chyba při přidávání uživatele do týmu:", error);
    }
  };

  const handleRemoveUserFromTeam = async (userId) => {
    if (!currentTeam) return;
  
    try {
      const response = await fetch(`/api/teams/${currentTeam.team_id}/members/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Chyba při odebírání uživatele z týmu");
      setCurrentTeam((prev) => ({
        ...prev,
        members: prev.members.filter((member) => member.user_id !== userId),
      }));
      setUserToRemove(null); // Reset the user to remove state
    } catch (error) {
      console.error("Chyba při odebírání uživatele z týmu:", error);
    }
  };

  const handleLogoutAndRedirect = (e) => {
    e.preventDefault();
    localStorage.removeItem("authToken");
    setAuthInfo({ isAuthenticated: false, userID: null, username: null, email: null, role: null });
    navigate("/login");
  };

  const confirmDeleteTeam = (teamId) => {
    setTeamToDelete(teamId);
    setShowDeleteConfirm(true);
  };

  return (
    <div className="teams-container">
      <header className="top-navbar">
        <nav className="nav-links">
          <Link to="/main">Hlavní strana</Link>
          <Link to="/Teams">Teamy</Link>
          <Link to="/chat">Chat</Link>
        </nav>
        <div className="site-title">
          <h1>TASKHUB</h1>
        </div>
        <div className="user-profile" onMouseEnter={() => setShowUserInfo(true)} onMouseLeave={() => setShowUserInfo(false)}>
          <span className="user-icon">👤</span>
          {showUserInfo && (
            <div className="user-info-container">
              <p className="user-info-title">User Info</p>
              {authInfo.isAuthenticated ? (
                <div className="user-info-content">
                  <p><strong>Username:</strong> {authInfo.username}</p>
                  <p><strong>Email:</strong> {authInfo.email}</p>
                  <button onClick={handleLogoutAndRedirect}>Odhlásit</button>
                </div>
              ) : (
                <p className="user-info-content">Uživatel není přihlášen.</p>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="teams-overview">
        <h2>Seznam týmů</h2>
        <div className="teams-list">
          {teams.length > 0 ? (
            teams.map((team) => (
              <div key={team.team_id} className="team-card card">
                <h2>{team.team_name}</h2>
                <button className="team-button" onClick={() => handleTeamClick(team)}>Zobrazit tým</button>
                <button className="team-button" onClick={() => confirmDeleteTeam(team.team_id)}>Smazat tým</button>
              </div>
            ))
          ) : (
            <p>Žádné týmy zatím nebyly vytvořeny.</p>
          )}
        </div>
        <button className="add-team-button" onClick={() => { setShowModal(true); setCurrentTeam(null); }}>+ Přidat tým</button>
      </div>

      {showModal && currentTeam && (
        <div className="modal-overlay">
          <div className="modal full-screen-modal">
            <button className="close-button" onClick={() => setShowModal(false)}>✖</button>
            <h2>{currentTeam.team_name}</h2>
            <div className="team-page">
              <div className="real-time-chat">
                <h2>Chat</h2>
                <div className="chat-messages">
                  {chatMessages.map((msg, index) => (
                    <div key={index} className="chat-message">
                      <strong>{msg.username}:</strong>
                      {editingMessageId === msg.chat_id ? (
                        <input
                          type="text"
                          value={editingMessageText}
                          onChange={(e) => setEditingMessageText(e.target.value)}
                        />
                      ) : (
                        <span onDoubleClick={() => {
                          setEditingMessageId(msg.chat_id);
                          setEditingMessageText(msg.message);
                        }}>
                          {msg.message}
                        </span>
                      )}
                      <span className="chat-timestamp">{new Date(msg.created_at).toLocaleString()}</span>
                      {authInfo.userID === msg.user_id && (
                        <>
                          {editingMessageId !== msg.chat_id && (
                            <>
                              <button className="edit-message-button" onClick={() => {
                                setEditingMessageId(msg.chat_id);
                                setEditingMessageText(msg.message);
                              }}>✎</button>
                              <button className="delete-message-button" onClick={() => deleteMessage(msg.chat_id)}>✖</button>
                            </>
                          )}
                          {editingMessageId === msg.chat_id && (
                            <button className="save-message-button" onClick={() => handleEditMessage(msg.chat_id)}>Uložit</button>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
                <div className="chat-input">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Napište zprávu..."
                  />
                  <button onClick={handleSendMessage}>➤</button>
                </div>
              </div>
              <div className="team-timeline">
                <h2>Kalendář</h2>
                <div className="timeline-weeks">
                  <div className="week">
                    <h3>Týden 1</h3>
                    <div className="timeline-days">
                      {firstWeekDates.map((date, index) => (
                        <div key={index} className="day" onClick={() => handleDayClick(date)}>
                          <div className="day-title">{date}</div>
                          <div className="day-tasks">
                            {tasksByDay[date]?.map((task, taskIndex) => (
                              <div key={taskIndex}>{task.title}</div>
                            )) || "Úkoly zde"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="week">
                    <h3>Týden 2</h3>
                    <div className="timeline-days">
                      {secondWeekDates.map((date, index) => (
                        <div key={index} className="day" onClick={() => handleDayClick(date)}>
                          <div className="day-title">{date}</div>
                          <div className="day-tasks">
                            {tasksByDay[date]?.map((task, taskIndex) => (
                              <div key={taskIndex}>{task.title}</div>
                            )) || "Úkoly zde"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="team-members small-width">
                <h2>Členové týmu</h2>
                <ul>
                  {currentTeam.members?.map((member) => (
                    <li key={member.user_id} onDoubleClick={() => setUserToRemove(userToRemove === member.user_id ? null : member.user_id)}>
                      {member.username}
                      {userToRemove === member.user_id && (
                        <button className="confirm-remove-button" onClick={() => handleRemoveUserFromTeam(member.user_id)}>✔</button>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="add-member">
                  <input
                    type="text"
                    placeholder="Hledat uživatele..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                  {searchResults.length > 0 && (
                    <ul className="search-results">
                      {searchResults.map((user) => (
                        <li key={user.user_id} onClick={() => handleAddUserToTeam(user.user_id)}>
                          {user.username}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && !currentTeam && (
        <div className="modal-overlay">
          <div className="modal">
            <button className="close-button" onClick={() => setShowModal(false)}>✖</button>
            <h2>Přidat nový tým</h2>
            <input type="text" placeholder="Název týmu" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} />
            <div className="form-actions">
              <button onClick={createTeam}>Přidat tým</button>
            </div>
          </div>
        </div>
      )}

      {selectedDay && (
        <div className="modal-overlay">
          <div className="modal modal-task">
            <button className="close-button" onClick={() => setSelectedDay(null)}>✖</button>
            <h2>Přidat úkol k dni {selectedDay}</h2>
            <form onSubmit={handleAddTask}>
              <table className="task-form-table">
                <tbody>
                  <tr>
                    <td><label>Název úkolu:</label></td>
                    <td><input type="text" name="title" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} required /></td>
                  </tr>
                  <tr>
                    <td><label>Popis úkolu:</label></td>
                    <td><textarea name="description" value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} required /></td>
                  </tr>
                </tbody>
              </table>
              <div className="form-actions">
                <button type="submit">Přidat úkol</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal modal-small">
            <h2>Opravdu chcete smazat tento tým?</h2>
            <div className="form-actions">
              <button onClick={() => deleteTeam(teamToDelete)}>Ano</button>
              <button onClick={() => setShowDeleteConfirm(false)}>Ne</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teams;
