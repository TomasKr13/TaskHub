const express = require('express');
const router = express.Router();
const { query } = require('../db');

// *****************************
// POST /api/teams - Vytvoření týmu
// *****************************
router.post('/', async (req, res) => {
  const { teamName } = req.body;
  const userId = req.session?.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Nejste přihlášeni.' });
  }
  if (!teamName) {
    return res.status(400).json({ error: 'Musíte zadat název týmu.' });
  }

  try {
    const existingTeam = await query(
      'SELECT 1 FROM team WHERE team_name = $1',
      [teamName]
    );
    if (existingTeam.rowCount > 0) {
      return res.status(400).json({ error: 'Tým s tímto názvem již existuje.' });
    }

    const teamResult = await query(
      'INSERT INTO team (team_name) VALUES ($1) RETURNING team_id',
      [teamName]
    );

    if (!teamResult.rows.length) {
      throw new Error('Tým nebyl vytvořen.');
    }

    const teamId = teamResult.rows[0].team_id;

    await query(
      'INSERT INTO team_members (user_id, team_id, role) VALUES ($1, $2, $3)',
      [userId, teamId, 'owner']
    );

    res.status(201).json({ message: 'Tým byl úspěšně vytvořen', teamId });
  } catch (error) {
    console.error('❌ Chyba při vytváření týmu:', error);
    res.status(500).json({ error: 'Nepodařilo se vytvořit tým' });
  }
});

// *****************************
// GET /api/teams - Načtení týmů uživatele
// *****************************
router.get('/', async (req, res) => {
  const userId = req.session?.user?.id;
  if (!userId) {
    return res.status(401).json({ error: 'Nejste přihlášeni.' });
  }

  try {
    const result = await query(
      `SELECT t.team_id, t.team_name
       FROM team t
       JOIN team_members tm ON t.team_id = tm.team_id
       WHERE tm.user_id = $1`,
      [userId]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('❌ Chyba při načítání týmů:', error);
    res.status(500).json({ error: 'Chyba při načítání týmů' });
  }
});

// *****************************
// GET /api/teams/:teamId/members - Načtení členů týmu
// *****************************
router.get('/:teamId/members', async (req, res) => {
  const { teamId } = req.params;
  try {
    const result = await query(
      `SELECT u.user_id, u.username, tm.role 
       FROM team_members tm 
       JOIN users u ON tm.user_id = u.user_id
       WHERE tm.team_id = $1`,
      [teamId]
    );
    res.status(200).json({ members: result.rows });
  } catch (error) {
    console.error('❌ Chyba při načítání členů týmu:', error);
    res.status(500).json({ error: 'Chyba při načítání členů týmu' });
  }
});

// *****************************
// POST /api/teams/:teamId/members - Přidání uživatele do týmu
// *****************************
router.post('/:teamId/members', async (req, res) => {
  const { teamId } = req.params;
  const { userId } = req.body;
  const currentUserId = req.session?.user?.id;

  if (!currentUserId) {
    return res.status(401).json({ error: 'Nejste přihlášeni.' });
  }

  try {
    const teamOwner = await query(
      'SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2 AND role = $3',
      [teamId, currentUserId, 'owner']
    );

    if (teamOwner.rowCount === 0) {
      return res.status(403).json({ error: 'Nemáte oprávnění přidávat členy do tohoto týmu.' });
    }

    const userExists = await query('SELECT 1 FROM users WHERE user_id = $1', [userId]);
    if (userExists.rowCount === 0) {
      return res.status(404).json({ error: 'Uživatel nebyl nalezen.' });
    }

    const alreadyMember = await query(
      'SELECT 1 FROM team_members WHERE user_id = $1 AND team_id = $2',
      [userId, teamId]
    );
    if (alreadyMember.rowCount > 0) {
      return res.status(400).json({ error: 'Uživatel je již členem týmu.' });
    }

    await query(
      'INSERT INTO team_members (user_id, team_id, role) VALUES ($1, $2, $3)',
      [userId, teamId, 'member']
    );

    const newMember = await query(
      'SELECT u.user_id, u.username, tm.role FROM team_members tm JOIN users u ON tm.user_id = u.user_id WHERE tm.user_id = $1 AND tm.team_id = $2',
      [userId, teamId]
    );

    res.status(201).json(newMember.rows[0]);
  } catch (error) {
    console.error('❌ Chyba při přidávání uživatele do týmu:', error);
    res.status(500).json({ error: 'Chyba při přidávání uživatele do týmu' });
  }
});

// *****************************
// DELETE /api/teams/:teamId/members/:userId - Odebrání uživatele z týmu
// *****************************
router.delete('/:teamId/members/:userId', async (req, res) => {
  const { teamId, userId } = req.params;
  const currentUserId = req.session?.user?.id;

  if (!currentUserId) {
    return res.status(401).json({ error: 'Nejste přihlášeni.' });
  }

  try {
    const teamOwner = await query(
      'SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2 AND role = $3',
      [teamId, currentUserId, 'owner']
    );

    if (teamOwner.rowCount === 0) {
      return res.status(403).json({ error: 'Nemáte oprávnění odebírat členy z tohoto týmu.' });
    }

    const result = await query(
      'DELETE FROM team_members WHERE user_id = $1 AND team_id = $2 RETURNING *',
      [userId, teamId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Uživatel není členem týmu.' });
    }

    res.status(200).json({ message: 'Uživatel byl úspěšně odebrán z týmu.' });
  } catch (error) {
    console.error('❌ Chyba při odebírání uživatele z týmu:', error);
    res.status(500).json({ error: 'Chyba při odebírání uživatele z týmu' });
  }
});

// *****************************
// DELETE /api/teams/:teamId - Smazání týmu
// *****************************
router.delete('/:teamId', async (req, res) => {
  const { teamId } = req.params;
  const userId = req.session?.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Nejste přihlášeni.' });
  }

  try {
    const teamOwner = await query(
      'SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2 AND role = $3',
      [teamId, userId, 'owner']
    );

    if (teamOwner.rowCount === 0) {
      return res.status(403).json({ error: 'Nemáte oprávnění mazat tento tým.' });
    }

    await query('DELETE FROM team_members WHERE team_id = $1', [teamId]);
    await query('DELETE FROM team WHERE team_id = $1', [teamId]);

    res.status(200).json({ message: 'Tým byl úspěšně smazán.' });
  } catch (error) {
    console.error('❌ Chyba při mazání týmu:', error);
    res.status(500).json({ error: 'Chyba při mazání týmu' });
  }
});

// Endpoint pro přidání úkolu k týmu
router.post('/:teamId/tasks', async (req, res) => {
  const { teamId } = req.params;
  const { title, description, assignedTo, status, time_estimate, task_type, priority } = req.body;
  const userId = req.session?.user?.id;

  if (!title || !description || !assignedTo || !status || !time_estimate || !task_type || !priority) {
    return res.status(400).json({ error: 'Všechna pole musí být vyplněna.' });
  }

  try {
    // Najdi prioritu podle jména
    let priorityResult = await query(
      'SELECT priority_id FROM priority WHERE priority_name = $1',
      [priority]
    );

    let priorityID;
    if (priorityResult.rows.length > 0) {
      // Pokud priorita existuje, použij její ID
      priorityID = priorityResult.rows[0].priority_id;
    } else {
      // Pokud priorita neexistuje, vytvoř novou
      const insertPriorityResult = await query(
        'INSERT INTO priority (priority_name) VALUES ($1) RETURNING priority_id',
        [priority]
      );
      priorityID = insertPriorityResult.rows[0].priority_id;
    }

    const result = await query(
      'INSERT INTO tasks (title, description, team_id, assigned_to, status, time_estimate, user_id, task_type, priority_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [title, description, teamId, assignedTo, status, time_estimate, userId, task_type, priorityID]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Chyba při přidávání úkolu:', error);
    res.status(500).json({ error: 'Chyba při přidávání úkolu' });
  }
});

// Endpoint pro získání úkolů týmu
router.get('/:teamId/tasks', async (req, res) => {
  const { teamId } = req.params;

  try {
    const result = await query(
      `SELECT t.*, u.username AS assignedTo
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.user_id
       WHERE t.team_id = $1
       ORDER BY t.time_estimate ASC`,
      [teamId]
    );
    res.status(200).json({ tasks: result.rows });
  } catch (error) {
    console.error('Chyba při načítání úkolů týmu:', error);
    res.status(500).json({ error: 'Chyba při načítání úkolů týmu' });
  }
});

// Endpoint pro aktualizaci úkolu
router.put('/tasks/:taskId', async (req, res) => {
  const { taskId } = req.params;
  const { title, description, time_estimate, task_type, priority } = req.body;

  try {
    // Najdi prioritu podle jména
    let priorityResult = await query(
      'SELECT priority_id FROM priority WHERE priority_name = $1',
      [priority]
    );

    let priorityID;
    if (priorityResult.rows.length > 0) {
      // Pokud priorita existuje, použij její ID
      priorityID = priorityResult.rows[0].priority_id;
    } else {
      // Pokud priorita neexistuje, vytvoř novou
      const insertPriorityResult = await query(
        'INSERT INTO priority (priority_name) VALUES ($1) RETURNING priority_id',
        [priority]
      );
      priorityID = insertPriorityResult.rows[0].priority_id;
    }

    const result = await query(
      'UPDATE tasks SET title = $1, description = $2, time_estimate = $3, task_type = $4, priority_id = $5 WHERE task_id = $6 RETURNING *',
      [title, description, time_estimate, task_type, priorityID, taskId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Úkol nebyl nalezen.' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Chyba při aktualizaci úkolu:', error);
    res.status(500).json({ error: 'Chyba při aktualizaci úkolu' });
  }
});

// Endpoint pro smazání úkolu
router.delete('/tasks/:taskId', async (req, res) => {
  const { taskId } = req.params;

  try {
    const result = await query('DELETE FROM tasks WHERE task_id = $1 RETURNING *', [taskId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Úkol nebyl nalezen.' });
    }

    res.status(200).json({ message: 'Úkol byl úspěšně smazán.', deletedTask: result.rows[0] });
  } catch (error) {
    console.error('Chyba při mazání úkolu:', error);
    res.status(500).json({ error: 'Chyba při mazání úkolu.' });
  }
});

const handleDeleteTask = async (taskId) => {
  try {
    const response = await fetch(`/api/tasks/${taskId}`, {
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
    time_estimate: selectedDay, // Použití správného dne
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
    setNewTask({ title: "", description: "", task_type: "", priority: "" });
    setShowModal(false); // Zavření modálního okna
  } catch (error) {
    console.error("Chyba při přidávání úkolu:", error);
  }
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

    // Update the task in the state
    setTasksByDay((prevTasks) => {
      const date = updatedTask.time_estimate.split('T')[0];
      return {
        ...prevTasks,
        [date]: prevTasks[date].map((task) =>
          task.task_id === taskId ? updatedTask : task
        ),
      };
    });

    setEditingTask(null); // Close the edit modal
  } catch (error) {
    console.error("Chyba při úpravě úkolu:", error);
  }
};

module.exports = router;
