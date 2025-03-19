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
  const [newTask, setNewTask] = useState({ title: "", description: "", time_estimate: "", task_type: "", priority: "" });
  const [teamTasks, setTeamTasks] = useState({});
  const [tasksByDay, setTasksByDay] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingMessageText, setEditingMessageText] = useState("");
  const [userToRemove, setUserToRemove] = useState(null);
  const [showRemoveUserConfirm, setShowRemoveUserConfirm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskToMove, setTaskToMove] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [hoveredTask, setHoveredTask] = useState(null);
  const [userToAdd, setUserToAdd] = useState(null);
  const [showAddUserConfirm, setShowAddUserConfirm] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [showDeleteTaskConfirm, setShowDeleteTaskConfirm] = useState(false);
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
      console.log("Načtené úkoly:", data.tasks); // Debugging

      const tasksByDay = data.tasks.reduce((acc, task) => {
        const date = task.time_estimate.split('T')[0]; // Rozdělení na datum
        if (!acc[date]) acc[date] = [];
        acc[date].push(task);
        return acc;
      }, {});
      console.log("Úkoly seskupené podle dnů:", tasksByDay); // Debugging
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
      dates.push(date.toISOString().split('T')[0]); // Použijte stejný formát jako time_estimate
    }
    return dates;
  };

  const getTwoWeeksDates = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Nastavení na začátek aktuálního týdne (neděle)

    const generateWeekDates = (startDate) => {
      const dates = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        dates.push(date.toISOString().split('T')[0]); // Formát YYYY-MM-DD
      }
      return dates;
    };

    const firstWeekDates = generateWeekDates(startOfWeek);
    const secondWeekStart = new Date(startOfWeek);
    secondWeekStart.setDate(startOfWeek.getDate() + 7); // Začátek druhého týdne
    const secondWeekDates = generateWeekDates(secondWeekStart);

    return [firstWeekDates, secondWeekDates];
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
    setSelectedDay(date); // Nastavení vybraného dne
    setShowModal(true); // Otevření modálního okna
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.title || !newTask.description || !newTask.task_type || !newTask.priority) {
      alert("Název, popis, typ úkolu a priorita nemůže být prázdný.");
      return;
    }
  
    const task = {
      ...newTask,
      team_id: currentTeam.team_id,
      assignedTo: authInfo.userID,
      status: "new",
      time_estimate: selectedDay, // Assign the selected day
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
      setTasksByDay((prevTasks) => ({
        ...prevTasks,
        [selectedDay]: [...(prevTasks[selectedDay] || []), data],
      }));
      setNewTask({ title: "", description: "", task_type: "", priority: "" }); // Reset form
      setSelectedDay(null); // Reset selected day
      // Nezavíráme modal týmu
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

  const handleAddUserToTeam = (userId) => {
    setUserToAdd(userId); // Set the user to add
    setShowAddUserConfirm(true); // Show the confirmation modal
  };

  const confirmAddUserToTeam = async () => {
    if (!currentTeam || !userToAdd) return;

    try {
      const response = await fetch(`/api/teams/${currentTeam.team_id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userToAdd }),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Chyba při přidávání uživatele do týmu");
      const data = await response.json();
      setCurrentTeam((prev) => ({ ...prev, members: [...prev.members, data] }));
      setSearchQuery("");
      setSearchResults([]);
      setShowAddUserConfirm(false); // Close the modal
      setUserToAdd(null); // Reset the user to add
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
      setShowRemoveUserConfirm(false); // Close the modal
      setUserToRemove(null); // Reset the user to remove
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

  const handleEditTask = async (taskId) => {
    try {
      const response = await fetch(`/api/teams/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingTask),
        credentials: "include",
      });

      if (!response.ok) throw new Error("Chyba při úpravě úkolu");

      const updatedTask = await response.json();

      // Aktualizace stavu po úspěšné úpravě
      setTasksByDay((prevTasks) => {
        const oldDate = editingTask.time_estimate.split('T')[0]; // Původní datum
        const newDate = updatedTask.time_estimate.split('T')[0]; // Nové datum

        const updatedTasks = { ...prevTasks };

        // Pokud se datum změnilo, přesuneme úkol
        if (oldDate !== newDate) {
          // Odebrání úkolu ze starého dne
          updatedTasks[oldDate] = updatedTasks[oldDate]?.filter(
            (task) => task.task_id !== taskId
          );

          // Přidání úkolu k novému dni
          if (!updatedTasks[newDate]) updatedTasks[newDate] = [];
          updatedTasks[newDate].push(updatedTask);
        } else {
          // Aktualizace úkolu ve stejném dni
          updatedTasks[oldDate] = updatedTasks[oldDate]?.map((task) =>
            task.task_id === taskId ? updatedTask : task
          );
        }

        return updatedTasks;
      });

      // Znovu načtení úkolů pro aktuální tým
      await fetchTeamTasks(currentTeam.team_id);

      setEditingTask(null); // Zavření modálního okna pro úpravu úkolu
    } catch (error) {
      console.error("Chyba při úpravě úkolu:", error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const response = await fetch(`/api/teams/tasks/${taskId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Chyba při mazání úkolu");

      // Aktualizace stavu po úspěšném smazání
      setTasksByDay((prevTasks) => {
        const updatedTasks = { ...prevTasks };
        for (const date in updatedTasks) {
          updatedTasks[date] = updatedTasks[date].filter((task) => task.task_id !== taskId);
        }
        return updatedTasks;
      });
    } catch (error) {
      console.error("Chyba při mazání úkolu:", error);
    }
  };

  const handleMoveTask = async (taskId, newDate) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...taskToMove, time_estimate: newDate }),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Chyba při přesunu úkolu");
      const updatedTask = await response.json();
      setTeamTasks((prevTasks) =>
        prevTasks.map((task) => (task.task_id === taskId ? updatedTask : task))
      );
      setTasksByDay((prevTasks) => {
        const oldDate = taskToMove.time_estimate.split('T')[0];
        const newTasksByDay = { ...prevTasks };
        newTasksByDay[oldDate] = newTasksByDay[oldDate].filter((task) => task.task_id !== taskId);
        if (!newTasksByDay[newDate]) newTasksByDay[newDate] = [];
        newTasksByDay[newDate].push(updatedTask);
        return newTasksByDay;
      });
      setTaskToMove(null);
    } catch (error) {
      console.error("Chyba při přesunu úkolu:", error);
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task); // Set the selected task
  };

  const handleDeleteTaskClick = (task) => {
    setTaskToDelete(task); // Nastavení úkolu k odstranění
    setShowDeleteTaskConfirm(true); // Zobrazení potvrzovacího modálního okna
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      const response = await fetch(`/api/teams/tasks/${taskToDelete.task_id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Chyba při mazání úkolu");

      // Aktualizace stavu po úspěšném smazání
      setTasksByDay((prevTasks) => {
        const updatedTasks = { ...prevTasks };
        const date = taskToDelete.time_estimate.split('T')[0];
        updatedTasks[date] = updatedTasks[date]?.filter(
          (task) => task.task_id !== taskToDelete.task_id
        );
        return updatedTasks;
      });

      setShowDeleteTaskConfirm(false); // Zavření modálního okna
      setTaskToDelete(null); // Reset úkolu k odstranění
    } catch (error) {
      console.error("Chyba při mazání úkolu:", error);
    }
  };

  return (
    <div className="teams-container">
      <header className="top-navbar">
        <nav className="nav-links">
          <Link to="/main">Hlavní strana</Link>
          <Link to="/Teams">Teamy</Link>
          {/* <Link to="/chat">Chat</Link> */}
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
                  <button className="logout-button" onClick={handleLogoutAndRedirect}>Odhlásit</button>
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
                <div className="timeline-days">
                  {firstWeekDates.concat(secondWeekDates).map((date, index) => (
                    <div key={index} className="day">
                      <div className="day-title">{date}</div>
                      <div className="day-tasks">
                        {tasksByDay[date]?.length > 0 ? (
                          tasksByDay[date].map((task, taskIndex) => (
                            <div
                              key={taskIndex}
                              className="task-item"
                              onClick={() => handleTaskClick(task)} // Open task details on click
                            >
                              <strong>{task.title}</strong>
                              <p>{task.description}</p>
                              <div className="task-actions">
                                <button onClick={(e) => { e.stopPropagation(); setEditingTask(task); }}>Upravit</button>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteTaskClick(task); }}>Smazat</button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p>Žádné úkoly</p>
                        )}
                      </div>
                      <button
                        className="add-task-btn2"
                        onClick={() => handleDayClick(date)} // Assign the correct date
                      >
                        Přidat úkol
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="team-members small-width">
                <h2>Členové týmu</h2>
                <ul>
                  {currentTeam.members?.map((member) => (
                    <li key={member.user_id} className="team-member">
                      <span>{member.username}</span>
                      {/* Skryje tlačítko pro aktuálně přihlášeného uživatele */}
                      {member.user_id !== authInfo.userID && (
                        <button
                          className="delete-member-button"
                          onClick={() => {
                            setUserToRemove(member.user_id); // Nastavení uživatele k odstranění
                            setShowRemoveUserConfirm(true); // Zobrazení potvrzovacího modálního okna
                          }}
                        >
                          ✖
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                {/* Přesunuto pole pro hledání uživatelů */}
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
                  <tr>
                    <td><label>Typ úkolu:</label></td>
                    <td><input type="text" name="task_type" value={newTask.task_type} onChange={(e) => setNewTask({ ...newTask, task_type: e.target.value })} required /></td>
                  </tr>
                  <tr>
                    <td><label>Priorita:</label></td>
                    <td><input type="text" name="priority" value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })} required /></td>
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

      {editingTask && (
        <div className="modal-overlay">
          <div className="modal modal-task">
            <button className="close-button" onClick={() => setEditingTask(null)}>✖</button>
            <h2>Upravit úkol</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleEditTask(editingTask.task_id);
            }}>
              <table className="task-form-table">
                <tbody>
                  <tr>
                    <td><label>Název úkolu:</label></td>
                    <td><input type="text" value={editingTask.title} onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })} required /></td>
                  </tr>
                  <tr>
                    <td><label>Popis úkolu:</label></td>
                    <td><textarea value={editingTask.description} onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })} required /></td>
                  </tr>
                  <tr>
                    <td><label>Čas:</label></td>
                    <td><input type="datetime-local" value={editingTask.time_estimate} onChange={(e) => setEditingTask({ ...editingTask, time_estimate: e.target.value })} required /></td>
                  </tr>
                  <tr>
                    <td><label>Typ úkolu:</label></td>
                    <td><input type="text" value={editingTask.task_type} onChange={(e) => setEditingTask({ ...editingTask, task_type: e.target.value })} required /></td>
                  </tr>
                  <tr>
                    <td><label>Priorita:</label></td>
                    <td><input type="text" value={editingTask.priority} onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })} required /></td>
                  </tr>
                </tbody>
              </table>
              <div className="form-actions">
                <button type="submit">Uložit změny</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {taskToMove && (
        <div className="modal-overlay">
          <div className="modal modal-task">
            <button className="close-button" onClick={() => setTaskToMove(null)}>✖</button>
            <h2>Přesunout úkol</h2>
            <form onSubmit={() => handleMoveTask(taskToMove.task_id, taskToMove.newDate)}>
              <table className="task-form-table">
                <tbody>
                  <tr>
                    <td><label>Nový datum:</label></td>
                    <td><input type="date" name="newDate" value={taskToMove.newDate} onChange={(e) => setTaskToMove({ ...taskToMove, newDate: e.target.value })} required /></td>
                  </tr>
                </tbody>
              </table>
              <div className="form-actions">
                <button type="submit">Přesunout úkol</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-small delete-team">
            <h2>Opravdu chcete smazat tento tým?</h2>
            <div className="form-actions">
              <button onClick={() => deleteTeam(teamToDelete)}>Ano</button>
              <button onClick={() => setShowDeleteConfirm(false)}>Ne</button>
            </div>
          </div>
        </div>
      )}

      {showAddUserConfirm && (
        <div class="modal-overlay">
          <div class="modal-small add-user">
            <h2>Opravdu chcete přidat tohoto uživatele do týmu?</h2>
            <div class="form-actions">
              <button onClick={confirmAddUserToTeam}>Ano</button>
              <button onClick={() => setShowAddUserConfirm(false)}>Ne</button>
            </div>
          </div>
        </div>
      )}

      {selectedTask && (
        <div className="modal-overlay">
          <div className="modal modal-task">
            <button className="close-button" onClick={() => setSelectedTask(null)}>✖</button>
            <h2>Detail úkolu</h2>
            <p><strong>Název:</strong> {selectedTask.title}</p>
            <p><strong>Popis:</strong> {selectedTask.description}</p>
            <p><strong>Odhadovaný čas:</strong> {selectedTask.time_estimate}</p>
            <p><strong>Typ úkolu:</strong> {selectedTask.task_type}</p>
  {/*           <p><strong>Vytvořil:</strong> {selectedTask.user_id || "Neznámý"}</p> */}
          </div>
        </div>
      )}

      {showRemoveUserConfirm && (
        <div class="modal-overlay">
          <div class="modal-small remove-user">
            <h2>Opravdu chcete odstranit tohoto uživatele z týmu?</h2>
            <div class="form-actions">
              <button onClick={() => handleRemoveUserFromTeam(userToRemove)}>Ano</button>
              <button onClick={() => setShowRemoveUserConfirm(false)}>Ne</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteTaskConfirm && (
        <div className="modal-overlay">
          <div className="modal-small delete-task">
            <h2>Opravdu chcete smazat tento úkol?</h2>
            <p><strong>{taskToDelete?.title}</strong></p>
            <div className="form-actions">
              <button onClick={confirmDeleteTask}>Ano</button>
              <button onClick={() => setShowDeleteTaskConfirm(false)}>Ne</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teams;
