import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import './chat.css';  // Import stylů pro Chat
import { AuthContext } from "./authProvider";
import { Link, useNavigate } from "react-router-dom";

const Chat = ({ userId, teamId }) => {
  const { authInfo, setAuthInfo } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [chatUser, setChatUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState(''); // Stav pro hledání
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`/api/chat/${teamId}/users`);
        setUsers(response.data);
      } catch (error) {
        console.error('Chyba při načítání uživatelů:', error);
      }
    };

    fetchUsers();
  }, [teamId]);

  useEffect(() => {
    if (chatUser) {
      const fetchMessages = async () => {
        try {
          const response = await axios.get(`/api/chat/${teamId}/${chatUser.id}`);
          setMessages(response.data);
        } catch (error) {
          console.error('Chyba při načítání zpráv:', error);
        }
      };

      fetchMessages();
    }
  }, [chatUser, teamId]);

  const handleLogoutAndRedirect = (e) => {
    e.preventDefault();
    localStorage.removeItem("authToken");
    setAuthInfo({ isAuthenticated: false, userID: null, username: null, email: null, role: null });
    navigate("/login");
  };

  const handleChatWithUser = (user) => {
    setChatUser(user);
    setMessages([]);
  };

  const handleSendMessage = async () => {
    if (newMessage.trim() === '') return;

    try {
      const response = await axios.post('/api/chat/send', {
        userId,
        teamId,
        message: newMessage,
        chatUserId: chatUser.id,
      });
      setMessages([...messages, response.data]);
      setNewMessage('');
    } catch (error) {
      console.error('Chyba při odesílání zprávy:', error);
    }
  };

  // Filtrování uživatelů na základě vyhledávacího dotazu
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="chat-container">
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

      <div className="chat-wrapper">
        {/* Left panel: Seznam uživatelů */}
        <div className="user-list">
          <h3>Seznam uživatelů</h3>
          <input 
            type="text"
            placeholder="Hledat uživatele..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-bar"
          />
          <ul>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <li
                  key={user.id}
                  className={`user-item ${chatUser?.id === user.id ? 'active' : ''}`}
                  onClick={() => handleChatWithUser(user)}
                  onMouseEnter={() => setShowUserInfo(true)}
                  onMouseLeave={() => setShowUserInfo(false)}
                >
                  {user.username}
                  {showUserInfo && chatUser?.id === user.id && (
                    <div className="user-info">
                      <p><strong>Username:</strong> {user.username}</p>
                      <p><strong>Email:</strong> {user.email}</p>
                    </div>
                  )}
                </li>
              ))
            ) : (
              <li>Načítání uživatelů...</li>
            )}
          </ul>
        </div>

        {/* Right panel: Chat */}
        <div className="chat-area">
          {chatUser ? (
            <>
              <div className="chat-header">
                <h3>Chat s {chatUser.username}</h3>
              </div>
              <div className="messages">
                {messages.length > 0 ? (
                  messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.userId === userId ? 'own' : 'other'}`}>
                      <span className="username">{msg.username}: </span>{msg.message}
                    </div>
                  ))
                ) : (
                  <p>Žádné zprávy...</p>
                )}
              </div>
              <div className="message-input">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Napiš zprávu..."
                />
                <button onClick={handleSendMessage}>Odeslat</button>
              </div>
            </>
          ) : (
            <div className="no-chat-selected">
              <p>Vyberte uživatele pro zahájení chatu.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
