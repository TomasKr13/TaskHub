const express = require("express");
const router = express.Router();
const { query } = require("../db"); 

// Add Task Route
router.post("/tasks", async (req, res) => {
  const { title, description, task_type, time_estimate, assignedTo, userID, priority } = req.body;

  if (!assignedTo) {
    return res.status(400).json({ error: "Task must be assigned to a user." });
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

    const taskResult = await query(
      'INSERT INTO tasks (title, description, task_type, time_estimate, assigned_to, user_id, priority_id , status) VALUES ($1, $2, $3, $4, $5, $6, $7 , 0) RETURNING *',
      [title, description, task_type, time_estimate, assignedTo, userID, priorityID]
    );

    res.json(taskResult.rows[0]); 
  } catch (error) {
    console.error("Error adding task:", error);
    res.status(500).json({ error: "Failed to add task" });
  }
});

// Uprava úkolu
router.put("/tasks/:id", async (req, res) => {
  const { id } = req.params;
  const { title, description, priority, task_type, time_estimate, status, updateOnlyStatus } = req.body;

  try {
    if (updateOnlyStatus) {
      // Aktualizace statusu
      const statusResult = await query(
        `UPDATE tasks 
         SET status = $1
         WHERE task_id = $2 RETURNING *`,
        [status, id]
      );

      if (statusResult.rowCount === 0) {
        return res.status(404).json({ error: "Úkol nenalezen." });
      }

      return res.json(statusResult.rows[0]);
    }

    // Kontrola
    if (!title || !description || !priority || !task_type || !time_estimate) {
      return res.status(400).json({ error: "Všechna pole musí být vyplněna!" });
    }

    //vytvoření priority
    const priorityResult = await query(
      `SELECT priority_id FROM priority WHERE priority_name = $1`,
      [priority]
    );

    let priorityId;

    if (priorityResult.rowCount > 0) {
      priorityId = priorityResult.rows[0].priority_id;
    } else {
      const newPriority = await query(
        `INSERT INTO priority (priority_name) VALUES ($1) RETURNING priority_id`,
        [priority]
      );
      priorityId = newPriority.rows[0].priority_id;
    }

    const result = await query(
      `UPDATE tasks 
       SET title = $1, description = $2, priority_id = $3, task_type = $4, time_estimate = $5
       WHERE task_id = $6 RETURNING *`,
      [title, description, priorityId, task_type, time_estimate, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Úkol nenalezen." });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Chyba při aktualizaci úkolu:", error);
    res.status(500).json({ error: "Nepodařilo se aktualizovat úkol." });
  }
});




// Cesta smazání úkolu
router.delete("/tasks/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query('DELETE FROM tasks WHERE task_id = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Úkol nenalezen" });
    }

    res.json({ message: "Úkol byl úspěšně smazán", deletedTask: result.rows[0] });
  } catch (error) {
    console.error("Chyba při mazání úkolu:", error);
    res.status(500).json({ error: "Nepodařilo se smazat úkol" });
  }
});


module.exports = router;
