import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "./authProvider";
import { Link, useNavigate } from "react-router-dom";
import "./Mainpage.css";

const MainPage = () => {
  const { authInfo, setAuthInfo } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [inProgressTasks, setInProgressTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "",
    task_type: "",
    time_estimate: "",
    status: "",
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const navigate = useNavigate();

  const decreaseStatus = async (task) => {
    const currentStatus = parseInt(task.status)
    const nextStatus = currentStatus - 1; 
    if (task.status > 0) {
      const updatedTask = { ...task, status: nextStatus.toString()};
      await updateTaskStatus(updatedTask);
    }
  };
  
  const increaseStatus = async (task) => {
    const currentStatus = parseInt(task.status)
    const nextStatus = currentStatus + 1; 
    if (task.status < 3) {
      const updatedTask = { ...task, status: nextStatus.toString() };
      await updateTaskStatus(updatedTask);
    }
  };
  
  const updateTaskStatus = async (task) => {
    try {
      const response = await fetch(`/api/manage/tasks/${task.task_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...task, updateOnlyStatus: true }),
      });
  
      if (!response.ok) {
        throw new Error("Chyba při aktualizaci stavu úkolu.");
      }
  
      const updatedTask = await response.json();
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.task_id === updatedTask.task_id ? updatedTask : t))
      );
    } catch (error) {
      console.error("Chyba při změně stavu úkolu:", error);
    }
  };
  

  const fetchTasks = async () => {
    console.log(authInfo);
    if (authInfo.isAuthenticated) {
      try {
        const response = await fetch(`/api/main/tasks/${authInfo.userID}`);
        const data = await response.json();
        setTasks(data.tasks);
        setAssignedTasks(data.tasks.filter((task) => task.assignedTo === authInfo.userID));
        setInProgressTasks(data.tasks.filter((task) => task.status === "in-progress"));
        setCompletedTasks(data.tasks.filter((task) => task.status === "completed"));
      } catch (error) {
        console.error("Chyba při načítání úkolů:", error);
        console.log("authInfo");
      }
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [authInfo]);

  const handleLogoutAndRedirect = (e) => {
    e.preventDefault();
    localStorage.removeItem("authToken");
    setAuthInfo({ isAuthenticated: false, userID: null, username: null, email: null, role: null });
    navigate("/login");
  };

  const addTask = async () => {
    if (!newTask.title || !newTask.description || !newTask.priority || !newTask.task_type || !newTask.time_estimate) {
      return;
    }

    const task = {
      ...newTask,
      assignedTo: authInfo.userID,
      status: "new",
      userID: authInfo.userID,
    };

    try {
      const response = await fetch("/api/manage/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(task),
      });

      if (!response.ok) {
        throw new Error("Chyba serveru při přidávání úkolu.");
      }

      const data = await response.json();
      setTasks((prevTasks) => [...prevTasks, data]);
      setAssignedTasks((prev) => [...prev, data]);
      setShowTaskForm(false);
    } catch (error) {
      console.error("Chyba při přidávání úkolu:", error);
    }
  };

  const updateTask = async () => {
    if (!taskToEdit.title || !taskToEdit.description || !taskToEdit.priority || !taskToEdit.task_type || !taskToEdit.time_estimate) {
      return;
    }

    try {
      const response = await fetch(`/api/manage/tasks/${taskToEdit.task_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(taskToEdit),
      });

      if (!response.ok) {
        throw new Error("Chyba serveru při aktualizaci úkolu.");
      }

      const updatedTask = await response.json();
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.task_id === updatedTask.task_id ? updatedTask : task))
      );
      setTaskToEdit(null);
    } catch (error) {
      console.error("Chyba při úpravě úkolu:", error);
    }
  };

  const confirmDeleteTask = (taskId) => {
    setTaskToDelete(taskId);
    setShowDeleteConfirm(true);
  };

  const deleteTask = async () => {
    try {
      const response = await fetch(`/api/manage/tasks/${taskToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Chyba serveru při mazání úkolu.");
      }

      setTasks((prevTasks) => prevTasks.filter((task) => task.task_id !== taskToDelete));
      setShowDeleteConfirm(false);
      setTaskToDelete(null);
    } catch (error) {
      console.error("Chyba při mazání úkolu:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (taskToEdit) {
      setTaskToEdit({
        ...taskToEdit,
        [name]: value,
      });
    } else {
      setNewTask({
        ...newTask,
        [name]: value,
      });
    }
  };

  const handleTitleDoubleClick = (task) => {
    setTaskToEdit(task);
  };

  const moveTaskUp = (taskId) => {
    setTasks((prevTasks) => {
      const index = prevTasks.findIndex((task) => task.task_id === taskId);
      if (index > 0) {
        const newTasks = [...prevTasks];
        [newTasks[index - 1], newTasks[index]] = [newTasks[index], newTasks[index - 1]];
        return newTasks;
      }
      return prevTasks;
    });
  };

  const moveTaskDown = (taskId) => {
    setTasks((prevTasks) => {
      const index = prevTasks.findIndex((task) => task.task_id === taskId);
      if (index < prevTasks.length - 1) {
        const newTasks = [...prevTasks];
        [newTasks[index + 1], newTasks[index]] = [newTasks[index], newTasks[index + 1]];
        return newTasks;
      }
      return prevTasks;
    });
  };

  return (
    <div className="container">
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
                </div>
              ) : (
                <p className="user-info-content">Uživatel není přihlášen.</p>
              )}
              <button onClick={handleLogoutAndRedirect}>Odhlásit</button>
            </div>
          )}
        </div>
      </header>

      <div className="content">
        <main className="dashboard">
          <TaskTable
            key={"Všechny úkoly"}
            title="Všechny úkoly"
            tasks={tasks.filter(task => task.status === "0")}
            emptyMessage="Nejsou žádné úkoly"
            onAddTask={() => setShowTaskForm(true)}
            onDeleteTask={confirmDeleteTask}
            onEditTask={setTaskToEdit}
            onDoubleClickTitle={handleTitleDoubleClick}
            onIncreaseStatus={increaseStatus}
            onDecreaseStatus={decreaseStatus}
            onMoveTaskUp={moveTaskUp}
            onMoveTaskDown={moveTaskDown}
          />
          <TaskTable
            key={"Přiřazené úkoly"}
            title="Přiřazené úkoly"
            tasks={tasks.filter(task => task.status === "1")}
            onDeleteTask={confirmDeleteTask}
            onEditTask={setTaskToEdit}
            onDoubleClickTitle={handleTitleDoubleClick}
            onIncreaseStatus={increaseStatus}
            onDecreaseStatus={decreaseStatus}
            onMoveTaskUp={moveTaskUp}
            onMoveTaskDown={moveTaskDown}
          />
          <TaskTable
            key={"Rozpracované úkoly"}
            title="Rozpracované úkoly"
            tasks={tasks.filter(task => task.status === "2")}
            onDeleteTask={confirmDeleteTask}
            onEditTask={setTaskToEdit}
            onDoubleClickTitle={handleTitleDoubleClick}
            onIncreaseStatus={increaseStatus}
            onDecreaseStatus={decreaseStatus}
            onMoveTaskUp={moveTaskUp}
            onMoveTaskDown={moveTaskDown}
          />
          <TaskTable
            key={"Hotové úkoly"}
            title="Hotové úkoly"
            tasks={tasks.filter(task => task.status === "3")}
            onDeleteTask={confirmDeleteTask}
            onEditTask={setTaskToEdit}
            onDoubleClickTitle={handleTitleDoubleClick}
            onIncreaseStatus={increaseStatus}
            onDecreaseStatus={decreaseStatus}
            onMoveTaskUp={moveTaskUp}
            onMoveTaskDown={moveTaskDown}
          />
        </main>
      </div>

      {(showTaskForm || taskToEdit) && (
        <div className="modal-overlay">
          <div className="modal">
            <button className="close-button" onClick={() => { setTaskToEdit(null); setShowTaskForm(false); }}>✖</button>
            <h2>{taskToEdit ? "Upravit úkol" : "Přidat nový úkol"}</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                taskToEdit ? updateTask() : addTask();
              }}
            >
              <table className="task-form-table">
                <tbody>
                  <tr>
                    <td><label>Název úkolu:</label></td>
                    <td><input type="text" name="title" value={taskToEdit ? taskToEdit.title : newTask.title} onChange={handleInputChange} required /></td>
                  </tr>
                  <tr>
                    <td><label>Popis úkolu:</label></td>
                    <td><textarea name="description" value={taskToEdit ? taskToEdit.description : newTask.description} onChange={handleInputChange} required /></td>
                  </tr>
                  <tr>
                    <td><label>Důležitost:</label></td>
                    <td>
                      <select name="priority" value={taskToEdit ? taskToEdit.priority : newTask.priority} onChange={handleInputChange} required>
                        <option value="">Vyberte...</option>
                        <option value="low">Nízká</option>
                        <option value="medium">Střední</option>
                        <option value="high">Vysoká</option>
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <td><label>Typ úkolu:</label></td>
                    <td><input type="text" name="task_type" value={taskToEdit ? taskToEdit.task_type : newTask.task_type} onChange={handleInputChange} required /></td>
                  </tr>
                  <tr>
                    <td><label>Datum a čas dokončení:</label></td>
                    <td><input type="datetime-local" name="time_estimate" value={taskToEdit ? taskToEdit.time_estimate : newTask.time_estimate} onChange={handleInputChange} required /></td>
                  </tr>
                </tbody>
              </table>
              <div className="form-actions">
                <button type="submit">{taskToEdit ? "Upravit " : "Přidat úkol"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-small">
            <h2>Opravdu chcete smazat tento úkol?</h2>
            <div className="form-actions">
              <button onClick={deleteTask}>Ano</button>
              <button onClick={() => setShowDeleteConfirm(false)}>Ne</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TaskTable = ({ title, tasks, emptyMessage = "Nejsou žádné úkoly", onAddTask, onDeleteTask, onEditTask , onDecreaseStatus , onIncreaseStatus, onMoveTaskUp, onMoveTaskDown }) => {
  console.log(tasks);
  return (
    
    <div className="table">
      <div className="table-header">
        {title}
        {onAddTask && <button className="add-task-btn" onClick={onAddTask}>+</button>}
      </div>
      <div className="table-content">
        {tasks.length > 0 ? (
        
          tasks.map((task) => ( 
            
            <div key={task.title} className={"task-card id:" + task.id}>
              <h3 onDoubleClick={() => onEditTask(task)}>{task.title}</h3>
              <p><strong>Popis úkolu:</strong>{task.description}</p>
              <p><strong>Důležitost:</strong> {task.priority}</p>
              <p><strong>Typ:</strong> {task.task_type}</p>
              <p><strong>Čas dokončení:</strong> {task.time_estimate}</p>

              <div className="status-controls">
                <button onClick={() => onDecreaseStatus(task)} disabled={task.status === 0}>◀</button>
                  {/* <span>{task.status}</span> */}
                <button onClick={() => onIncreaseStatus(task)} disabled={task.status === 3}>▶</button>
              </div>

              

              <button className="delete-btn" onClick={() => onDeleteTask(task.task_id)}>×</button>
            </div>
          ))
        ) : (
          <p>{emptyMessage}</p>
        )}
      </div>
    </div>
  );
};

export default MainPage;
