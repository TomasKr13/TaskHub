const express = require("express");
const router = express.Router();;
const { query } = require("../db"); // Assuming db connection is here

// Konfigurace připojení k databázi


// Endpoint pro získání úkolů uživatele
router.get("/tasks/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const query_string = `
      SELECT task_id, title, status
      FROM tasks
      WHERE user_id = $1
    `;
    const result = await query(query_string, [userId]);

    res.json({ tasks: result.rows });
  } catch (error) {
    console.error("Chyba při načítání úkolů:", error);
    res.status(500).json({ error: "Došlo k chybě při načítání úkolů." });
  }
});

// Endpoint pro získání informací o uživateli
router.get("/user/:userId", async (req, res) => {
  const { userId } = req.params;
  

  try {
    const query_string = `
      SELECT user_id, username, email
      FROM users
      WHERE user_id = $1
    `;
    const result = await query(query_string, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Uživatel nebyl nalezen." });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Chyba při načítání uživatele:", error);
    res.status(500).json({ error: "Došlo k chybě při načítání uživatele." });
  }
});

module.exports = router;
