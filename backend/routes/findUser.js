const express = require('express');
const app = express();
const pool = require('./db'); // Předpokládáme, že používáš PostgreSQL nebo jinou databázi

// Endpoint pro vyhledání uživatele podle jména
app.get('/api/chat/searchUser/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: 'Uživatel nenalezen' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Chyba serveru' });
  }
});
